'use client'
import { useEffect, useState, useCallback } from 'react'
import { useParams } from 'next/navigation'
import {
  DndContext, DragEndEvent, DragStartEvent,
  PointerSensor, useSensor, useSensors,
  DragOverlay, rectIntersection,
} from '@dnd-kit/core'
import { useBuilderStore } from '@/store/builderStore'
import { formsApi } from '@/lib/api'
import { FieldType, FormField } from '@/types'
import FieldPalette from '@/components/builder/FieldPalette'
import FormCanvas, { FieldCard, getWidthPx } from '@/components/builder/FormCanvas'
import PropertiesPanel from '@/components/builder/PropertiesPanel'
import BuilderToolbar from '@/components/builder/BuilderToolbar'
import FormRenderer from '@/components/FormRenderer'
import { getFieldMeta } from '@/lib/fieldRegistry'
import { Loader2, Eye, PenLine } from 'lucide-react'

export default function EditBuilderPage() {
  const params = useParams()
  const id     = Number(params.id)

  const store = useBuilderStore()
  const { fields, sections, addField, settings, formName, formDescription,
          addFieldToSection, moveFieldInSection, moveFieldBetweenSections } = store

  const [activeField, setActiveField]             = useState<FormField | null>(null)
  const [activeSectionId, setActiveSectionId]     = useState<string | null>(null)
  const [activePaletteType, setActivePaletteType] = useState<FieldType | null>(null)
  const [form, setForm]     = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [mode, setMode]     = useState<'editor' | 'preview'>('editor')
  const [viewport, setViewport] = useState<'desktop' | 'tablet' | 'mobile'>('desktop')

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  )

  useEffect(() => {
    formsApi.get(id).then(res => {
      const f = res.data.data
      setForm(f)
      store.loadSchema(
        f.schema?.fields || [],
        f.schema?.settings || f.settings || {},
        f.name,
        f.description || '',
        f.schema?.sections || []
      )
    }).finally(() => setLoading(false))
  }, [id])

  const handleDragStart = useCallback(({ active }: DragStartEvent) => {
    if (active.data.current?.fromPalette) {
      setActivePaletteType(active.data.current.type)
      setActiveField(null)
    } else if (active.data.current?.fromCanvas) {
      setActiveField(active.data.current.field as FormField)
      setActiveSectionId(active.data.current.sectionId || null)
      setActivePaletteType(null)
    }
  }, [])

  const handleDragEnd = useCallback(({ active, over }: DragEndEvent) => {
    setActiveField(null)
    setActivePaletteType(null)
    setActiveSectionId(null)
    if (!over) return

    if (active.data.current?.fromPalette) {
      const type = active.data.current.type as FieldType
      if (String(over.id).startsWith('section-drop-')) {
        const sectionId = String(over.id).replace('section-drop-', '')
        addFieldToSection(sectionId, type)
        return
      }
      if (over.id === 'canvas' || over.id === 'canvas-empty') { addField(type); return }
      const inSection = sections.find(s => s.fields.some(f => f.id === over.id))
      if (inSection) {
        const idx = inSection.fields.findIndex(f => f.id === over.id)
        addFieldToSection(inSection.id, type, idx >= 0 ? idx : undefined)
      } else {
        const idx = fields.findIndex(f => f.id === over.id)
        addField(type, idx >= 0 ? idx : undefined)
      }
      return
    }

    if (active.data.current?.fromCanvas && over.id !== active.id) {
      const fromSectionId = active.data.current.sectionId as string | undefined
      const toSectionId   = over.data.current?.sectionId  as string | undefined
      if (fromSectionId && toSectionId && fromSectionId === toSectionId) {
        const sec = sections.find(s => s.id === fromSectionId)
        if (sec) {
          const oldIdx = sec.fields.findIndex(f => f.id === active.id)
          const newIdx = sec.fields.findIndex(f => f.id === over.id)
          if (oldIdx !== -1 && newIdx !== -1) moveFieldInSection(fromSectionId, oldIdx, newIdx)
        }
      } else if (!fromSectionId && !toSectionId) {
        const oldIdx = fields.findIndex(f => f.id === active.id)
        const newIdx = fields.findIndex(f => f.id === over.id)
        if (oldIdx !== -1 && newIdx !== -1) store.moveField(oldIdx, newIdx)
      } else {
        const destSectionId = toSectionId || null
        let toIndex = destSectionId
          ? (sections.find(s => s.id === destSectionId)?.fields.length || 0)
          : fields.length
        moveFieldBetweenSections(String(active.id), fromSectionId || null, destSectionId, toIndex)
      }
    }
  }, [fields, sections, addField, addFieldToSection, store, moveFieldInSection, moveFieldBetweenSections])

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-[var(--surface)]">
        <Loader2 className="animate-spin text-[var(--brand)]" size={28} />
      </div>
    )
  }

  const paletteMeta = activePaletteType ? getFieldMeta(activePaletteType) : null

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-[var(--surface)]">
      <BuilderToolbar
        formId={id}
        isPublished={form?.is_published}
        mode={mode}
        onModeChange={setMode}
        viewport={viewport}
        onViewportChange={setViewport}
      />

      {mode === 'preview' && (
        <div className="flex-1 overflow-y-auto bg-[var(--canvas-bg)]">
          <div className="bg-amber-50 dark:bg-amber-900/20 border-b border-amber-200 dark:border-amber-800 px-6 py-2.5 flex items-center justify-between">
            <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400 text-sm">
              <Eye size={14} />
              <span className="font-medium">Preview Mode</span>
              <span className="text-amber-500"> — Drag fields in the form to reorder them.</span>
            </div>
            <button onClick={() => setMode('editor')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-100 dark:bg-amber-900/40 hover:bg-amber-200 text-amber-700 dark:text-amber-400 text-xs font-medium transition-colors">
              <PenLine size={12} /> Back to Editor
            </button>
          </div>
          <div className="max-w-2xl mx-auto px-6 py-8">
            <div className="bg-[var(--card-bg)] rounded-2xl border border-[var(--border)] shadow-sm p-8">
              <h1 className="text-2xl font-bold text-[var(--text)] mb-1">{formName}</h1>
              {formDescription && <p className="text-sm text-[var(--muted)] mb-6">{formDescription}</p>}
              <hr className="border-[var(--border)] mb-6" />
              <FormRenderer
                schema={{ fields, sections, settings }}
                formName={formName}
                onSubmit={async () => {}}
                previewOnly={false}
                draggable={true}
                onReorder={(reordered: FormField[]) => {
                  reordered.forEach((f, i) => {
                    const storeIdx = fields.findIndex(sf => sf.id === f.id)
                    if (storeIdx !== i) store.moveField(storeIdx, i)
                  })
                }}
              />
            </div>
          </div>
        </div>
      )}

      {mode === 'editor' && (
        <DndContext
          sensors={sensors}
          collisionDetection={rectIntersection}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="flex-1 flex overflow-hidden">
            <aside className="w-56 bg-[var(--sidebar-bg)] border-r border-[var(--border)] flex flex-col overflow-hidden flex-shrink-0">
              <FieldPalette />
            </aside>

            <main className="flex-1 overflow-y-auto bg-[var(--canvas-bg)] p-6 flex flex-col items-center">
              {viewport !== 'desktop' && (
                <div className="mb-3 flex items-center gap-2 text-xs text-[var(--muted)]">
                  <span className="px-2 py-0.5 rounded-full bg-[var(--surface-2)] font-mono">
                    {viewport === 'tablet' ? '768px' : '375px'}
                  </span>
                  <span>{viewport === 'tablet' ? 'Tablet view' : 'Mobile view'}</span>
                </div>
              )}

              <div className="transition-all duration-300 w-full"
                style={{ maxWidth: viewport === 'desktop' ? '100%' : viewport === 'tablet' ? '768px' : '375px' }}>
                {viewport !== 'desktop' && (
                  <div className={`bg-[#1e293b] rounded-t-2xl px-4 py-2 flex items-center gap-2 ${viewport === 'mobile' ? 'rounded-t-3xl' : ''}`}>
                    <div className="w-2 h-2 rounded-full bg-red-400" />
                    <div className="w-2 h-2 rounded-full bg-yellow-400" />
                    <div className="w-2 h-2 rounded-full bg-green-400" />
                    <div className="flex-1 mx-4 bg-[#0f172a] rounded-full h-5 flex items-center justify-center">
                      <span className="text-[10px] text-[#475569] font-mono">form preview</span>
                    </div>
                  </div>
                )}

                <div className={`bg-[var(--card-bg)] ${viewport !== 'desktop' ? 'border-x border-b border-[#1e293b] rounded-b-2xl overflow-hidden shadow-2xl' : 'rounded-xl'}`}>
                  <div className={viewport !== 'desktop' ? 'overflow-y-auto max-h-[70vh]' : ''}>
                    <div className="p-6">
                      <div className="mb-6 bg-[var(--card-bg)] rounded-xl border border-[var(--border)] p-5">
                        <h1 className="text-xl font-bold text-[var(--text)]">{formName || 'Untitled Form'}</h1>
                        {formDescription && <p className="text-sm text-[var(--muted)] mt-1">{formDescription}</p>}
                      </div>
                      {(fields.length > 0 || sections.length > 0) && (
                        <p className="text-[11px] text-[var(--muted)] mb-2">
                          ⠿ Drag any field card to move it
                        </p>
                      )}
                      <FormCanvas />
                    </div>
                  </div>
                </div>
              </div>
            </main>

            <aside className="w-64 bg-[var(--sidebar-bg)] border-l border-[var(--border)] flex flex-col overflow-hidden flex-shrink-0">
              <PropertiesPanel />
            </aside>
          </div>

          <DragOverlay dropAnimation={{ duration: 180, easing: 'cubic-bezier(0.18,0.67,0.6,1.22)' }}>
            {activeField && (
              <div style={{ width: getWidthPx(activeField.width), opacity: 0.95 }}>
                <FieldCard field={activeField} isDragging={true} sectionId={activeSectionId || undefined} />
              </div>
            )}
            {paletteMeta && (
              <div className="palette-item shadow-xl opacity-95 w-48 border border-[var(--brand)]/30">
                <span className="w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0"
                  style={{ background: paletteMeta.color + '18', color: paletteMeta.color }}>
                  <paletteMeta.icon size={13} />
                </span>
                <span>{paletteMeta.label}</span>
              </div>
            )}
          </DragOverlay>
        </DndContext>
      )}
    </div>
  )
}