'use client'
import { useBuilderStore } from '@/store/builderStore'
import { formsApi } from '@/lib/api'
import { useState, useRef, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useTheme } from '@/components/ThemeProvider'
import {
  Save, Eye, Globe, ArrowLeft, Loader2,
  CheckCircle, AlertCircle, FileText,
  Download, Upload, X, PenLine,
  Monitor, Tablet, Smartphone, Moon, Sun,
} from 'lucide-react'

interface Props {
  formId?: number
  isPublished?: boolean
  onSaved?: (id: number) => void
  mode?: 'editor' | 'preview'
  onModeChange?: (mode: 'editor' | 'preview') => void
  viewport?: 'desktop' | 'tablet' | 'mobile'
  onViewportChange?: (v: 'desktop' | 'tablet' | 'mobile') => void
}

export default function BuilderToolbar({ formId, isPublished, onSaved, mode = 'editor', onModeChange, viewport = 'desktop', onViewportChange }: Props) {
  const store   = useBuilderStore()
  const { fields, sections, formName, formDescription, settings, clearDirty, isDirty, exportSchema, importSchema, insertSchema, insertIndex } = store
  const totalFields = fields.length + sections.reduce((sum, sec) => sum + sec.fields.length, 0)
  const { setInsertIndex } = store
  const { theme, toggleTheme } = useTheme()

  const [saving, setSaving]         = useState(false)
  const [publishing, setPublishing] = useState(false)
  const [toast, setToast]           = useState<{ type: 'success'|'error'; msg: string } | null>(null)
  const [importModal, setImportModal] = useState(false)
  const [importText, setImportText]   = useState('')
  const [importError, setImportError] = useState('')
  const [autoSaveStatus, setAutoSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const fileInputRef  = useRef<HTMLInputElement>(null)
  const autoSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const router = useRouter()

  const showToast = (type: 'success'|'error', msg: string) => {
    setToast({ type, msg })
    setTimeout(() => setToast(null), 3000)
  }

  // ── Save ──────────────────────────────────────────────────────────────────
  const handleSave = useCallback(async () => {
    if (!formName.trim()) return showToast('error', 'Form name is required')
    setSaving(true)
    try {
      const payload = { name: formName, description: formDescription, schema: { fields, sections, settings }, settings }
      if (formId) {
        await formsApi.update(formId, payload)
        showToast('success', 'Form saved!')
      } else {
        const res = await formsApi.create(payload)
        onSaved?.(res.data.data.id)
        showToast('success', 'Form created!')
      }
      clearDirty()
    } catch {
      showToast('error', 'Failed to save form')
    } finally {
      setSaving(false)
    }
  }, [formName, formDescription, fields, sections, settings, formId, onSaved, clearDirty])

  // ── Auto-save: debounce 2 s whenever isDirty becomes true and formId exists ─
  const performAutoSave = useCallback(async () => {
    if (!formId || !formName.trim()) return
    setAutoSaveStatus('saving')
    try {
      const payload = { name: formName, description: formDescription, schema: { fields, sections, settings }, settings }
      await formsApi.update(formId, payload)
      clearDirty()
      setAutoSaveStatus('saved')
      setTimeout(() => setAutoSaveStatus('idle'), 2000)
    } catch {
      setAutoSaveStatus('error')
    }
  }, [formId, formName, formDescription, fields, sections, settings, clearDirty])

  useEffect(() => {
    if (!isDirty || !formId) return
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current)
    autoSaveTimer.current = setTimeout(() => {
      performAutoSave()
    }, 2000)
    return () => {
      if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current)
    }
  }, [isDirty, formId, performAutoSave])

  // ── Publish ───────────────────────────────────────────────────────────────
  const handlePublish = async () => {
    if (!formId) { await handleSave(); return }
    setPublishing(true)
    try {
      if (isPublished) {
        await formsApi.unpublish(formId)
        showToast('success', 'Form unpublished')
      } else {
        await formsApi.publish(formId)
        showToast('success', 'Form published!')
      }
    } catch {
      showToast('error', 'Failed to change status')
    } finally {
      setPublishing(false)
    }
  }

  // ── Export JSON ───────────────────────────────────────────────────────────
  const handleExport = () => {
    const json = exportSchema()
    const blob = new Blob([json], { type: 'application/json' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href     = url
    a.download = `${formName.toLowerCase().replace(/\s+/g, '-') || 'form'}.json`
    a.click()
    URL.revokeObjectURL(url)
    showToast('success', 'JSON downloaded!')
  }

  // ── Import JSON via file ──────────────────────────────────────────────────
  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      const text = ev.target?.result as string
      setImportText(text)
      setImportModal(true)
      setImportError('')
    }
    reader.readAsText(file)
    e.target.value = '' // reset so same file can be re-imported
  }

  // ── Import JSON confirm ───────────────────────────────────────────────────
  const handleImportConfirm = () => {
    const hasExistingFields = totalFields > 0
    const result = hasExistingFields
      ? insertSchema(importText, insertIndex)
      : importSchema(importText)
    if (result.ok) {
      setImportModal(false)
      setImportText('')
      setImportError('')
      store.setInsertIndex(null) // clear cursor after insert
      showToast('success', hasExistingFields
        ? `Inserted at position ${(insertIndex ?? totalFields) + 1}`
        : 'Schema imported!')
    } else {
      setImportError(result.error || 'Invalid JSON')
    }
  }

  return (
    <>
      <header className="h-14 bg-[var(--panel-bg)] border-b border-[var(--border)] flex items-center px-4 gap-3 sticky top-0 z-40 relative">
        {/* Back */}
        <button
          onClick={() => router.push('/')}
          className="p-1.5 rounded-lg hover:bg-[var(--surface-2)] text-[var(--muted)] transition-colors"
        >
          <ArrowLeft size={18} />
        </button>

        {/* Form name */}
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <div className="w-7 h-7 rounded-md bg-[var(--brand)] flex items-center justify-center flex-shrink-0">
            <FileText size={13} className="text-white" />
          </div>
          <div className="min-w-0">
            <input
              className="font-semibold text-[var(--text)] text-sm bg-transparent outline-none w-full truncate max-w-[240px]"
              value={formName}
              onChange={e => store.setFormMeta(e.target.value, formDescription)}
              placeholder="Untitled Form"
            />
            {autoSaveStatus === 'saving' && (
              <span className="text-[10px] text-[var(--muted)] font-medium flex items-center gap-1">
                <Loader2 size={10} className="animate-spin" /> Saving…
              </span>
            )}
            {autoSaveStatus === 'saved' && (
              <span className="text-[10px] text-emerald-500 font-medium flex items-center gap-1">
                <CheckCircle size={10} /> Saved
              </span>
            )}
            {autoSaveStatus === 'error' && (
              <span className="text-[10px] text-red-500 font-medium flex items-center gap-1">
                <AlertCircle size={10} /> Save failed
              </span>
            )}
            {autoSaveStatus === 'idle' && isDirty && !formId && (
              <span className="text-[10px] text-[#f59e0b] font-medium">Unsaved changes</span>
            )}
            {autoSaveStatus === 'idle' && isDirty && formId && (
              <span className="text-[10px] text-[var(--muted)] font-medium">Saving soon…</span>
            )}
          </div>
        </div>

        {/* Field count */}
        <span className="text-xs text-[var(--muted)] hidden md:block">
        {totalFields} field{totalFields !== 1 ? 's' : ''}
        </span>

        {/* ── Viewport switcher — center ── */}
        {mode === 'editor' && onViewportChange && (
          <div className="flex items-center bg-[var(--surface-2)] rounded-lg p-0.5 gap-0.5 absolute left-1/2 -translate-x-1/2">
            {([
              { key: 'desktop', icon: Monitor,    title: 'Desktop (full width)' },
              { key: 'tablet',  icon: Tablet,     title: 'Tablet (768px)'      },
              { key: 'mobile',  icon: Smartphone, title: 'Mobile (375px)'      },
            ] as const).map(({ key, icon: Icon, title }) => (
              <button
                key={key}
                title={title}
                onClick={() => onViewportChange(key)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                  viewport === key
                    ? 'bg-[var(--panel-bg)] text-[var(--brand)] shadow-sm'
                    : 'text-[var(--muted)] hover:text-[var(--text)]'
                }`}
              >
                <Icon size={15} />
              </button>
            ))}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-2">

          {/* Dark mode toggle */}
          <button
            onClick={toggleTheme}
            title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            className="p-1.5 rounded-lg border border-[var(--border)] text-[var(--muted)] hover:bg-[var(--surface-2)] transition-colors"
          >
            {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
          </button>

          {/* Import button */}
          <button
            onClick={() => fileInputRef.current?.click()}
            title="Import JSON"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[var(--border)] text-sm text-[var(--muted)] hover:bg-[var(--surface-2)] transition-colors"
          >
            <Upload size={14} />
            <span className="hidden md:block">Import</span>
          </button>
          <input ref={fileInputRef} type="file" accept=".json" className="hidden" onChange={handleFileImport} />

          {/* Export button */}
          <button
            onClick={handleExport}
            title="Export JSON"
            disabled={totalFields === 0}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[var(--border)] text-sm text-[var(--muted)] hover:bg-[var(--surface-2)] transition-colors disabled:opacity-40"
          >
            <Download size={14} />
            <span className="hidden md:block">Export</span>
          </button>

          {/* Editor / Preview toggle */}
          {formId && onModeChange && (
            <div className="flex items-center bg-[var(--surface-2)] rounded-lg p-0.5 gap-0.5">
              <button
                onClick={() => onModeChange('editor')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                  mode === 'editor'
                    ? 'bg-[var(--panel-bg)] text-[var(--brand)] shadow-sm'
                    : 'text-[var(--muted)] hover:text-[var(--text)]'
                }`}
              >
                <PenLine size={13} />
                <span className="hidden md:block">Editor</span>
              </button>
              <button
                onClick={() => onModeChange('preview')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                  mode === 'preview'
                    ? 'bg-[var(--panel-bg)] text-[var(--brand)] shadow-sm'
                    : 'text-[var(--muted)] hover:text-[var(--text)]'
                }`}
              >
                <Eye size={13} />
                <span className="hidden md:block">Preview</span>
              </button>
            </div>
          )}

          {/* Save */}
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[var(--border)] text-sm text-[var(--muted)] hover:bg-[var(--surface-2)] transition-colors disabled:opacity-50"
          >
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
            <span className="hidden md:block">Save</span>
          </button>

          {/* Publish */}
          <button
            onClick={handlePublish}
            disabled={publishing || !formId}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 ${
              isPublished
                ? 'bg-[var(--surface-2)] text-[var(--muted)] hover:bg-[var(--border)]'
                : 'bg-[var(--brand)] text-white hover:bg-[var(--brand-dark)]'
            }`}
          >
            {publishing ? <Loader2 size={14} className="animate-spin" /> : <Globe size={14} />}
            <span className="hidden md:block">{isPublished ? 'Unpublish' : 'Publish'}</span>
          </button>
        </div>

        {/* Toast */}
        {toast && (
          <div className={`fixed bottom-6 right-6 flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg text-sm font-medium z-50 ${
            toast.type === 'success' ? 'bg-[#0f172a] text-white' : 'bg-red-500 text-white'
          }`}>
            {toast.type === 'success' ? <CheckCircle size={15} /> : <AlertCircle size={15} />}
            {toast.msg}
          </div>
        )}
      </header>

      {/* ── Import Modal ─────────────────────────────────────────────────────── */}
      {importModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-[var(--panel-bg)] rounded-2xl shadow-2xl w-full max-w-2xl flex flex-col max-h-[85vh]">
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-[var(--border)]">
              <div>
                <h2 className="font-semibold text-[var(--text)]">Import Form Schema</h2>
                <p className="text-xs text-[var(--muted)] mt-0.5">
                  {totalFields > 0
                    ? insertIndex !== null
                      ? `Will insert after field ${insertIndex} (cursor position set)`
                      : 'Will append to end — hover between fields to set insert position'
                    : 'Paste or edit the JSON below, then confirm'}
                </p>
              </div>
              <button
                onClick={() => { setImportModal(false); setImportError('') }}
                className="p-1.5 rounded-lg hover:bg-[var(--surface-2)] text-[var(--muted)] transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            {/* JSON editor */}
            <div className="flex-1 overflow-hidden p-4">
              <textarea
                value={importText}
                onChange={e => { setImportText(e.target.value); setImportError('') }}
                className="w-full h-64 font-mono text-xs bg-[#0f172a] text-[#a5f3fc] p-4 rounded-xl resize-none outline-none border-2 border-transparent focus:border-[var(--brand)]"
                placeholder='{ "name": "My Form", "schema": { "fields": [...] } }'
                spellCheck={false}
              />
              {importError && (
                <div className="mt-2 flex items-center gap-2 text-red-500 text-xs">
                  <AlertCircle size={13} />
                  {importError}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between p-4 border-t border-[var(--border)] bg-[var(--surface-2)] rounded-b-2xl">
              <p className="text-xs text-[var(--muted)]">
                {totalFields > 0
                  ? insertIndex !== null
                    ? <span className="text-[var(--brand)] font-medium">↕ Inserting after field {insertIndex} of {totalFields}</span>
                    : '↓ No cursor set — will append to end'
                  : '⚠️ This will replace the current canvas'}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => { setImportModal(false); setImportError('') }}
                  className="px-4 py-2 rounded-lg border border-[var(--border)] text-sm text-[var(--muted)] hover:bg-[var(--panel-bg)] transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleImportConfirm}
                  disabled={!importText.trim()}
                  className="px-4 py-2 rounded-lg bg-[var(--brand)] text-white text-sm font-medium hover:bg-[var(--brand-dark)] transition-colors disabled:opacity-50"
                >
                  {totalFields > 0 ? 'Insert Schema' : 'Import Schema'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}