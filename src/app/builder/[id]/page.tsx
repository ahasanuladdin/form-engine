'use client'
import { useEffect, useState, useCallback } from 'react'
import { useParams } from 'next/navigation'
import {
  DndContext, DragEndEvent, DragStartEvent,
  PointerSensor, useSensor, useSensors,
  DragOverlay, rectIntersection,
} from '@dnd-kit/core'
import type { CollisionDetection } from '@dnd-kit/core'
import { useBuilderStore } from '@/store/builderStore'
import { formsApi } from '@/lib/api'
import { FieldType, FormField } from '@/types'
import { v4 as uuid } from 'uuid'
import FieldPalette from '@/components/builder/FieldPalette'
import FormCanvas, { FieldCard, getWidthPx } from '@/components/builder/FormCanvas'
import PropertiesPanel from '@/components/builder/PropertiesPanel'
import BuilderToolbar from '@/components/builder/BuilderToolbar'
import FormRenderer from '@/components/FormRenderer'
import { getFieldMeta } from '@/lib/fieldRegistry'
import { Loader2, Eye, PenLine } from 'lucide-react'

// ── Custom collision: beside: zones always win when the pointer is over them ──
// rectIntersection picks the droppable with the largest overlap area, which means
// a wide field card (600-800px) always beats the narrow BesideZone (24px).
// This custom detector checks beside: zones first; only if none intersect does it
// fall back to rectIntersection for the rest of the droppables.
const besidePriorityCollision: CollisionDetection = (args) => {
  const besideContainers = args.droppableContainers.filter(
    (c) => String(c.id).startsWith('beside:')
  )
  if (besideContainers.length > 0) {
    const besideHits = rectIntersection({ ...args, droppableContainers: besideContainers })
    if (besideHits.length > 0) return besideHits
  }
  return rectIntersection(args)
}

export default function EditBuilderPage() {
  const params = useParams()
  const id     = Number(params.id)

  const store = useBuilderStore()
  const { fields, sections, addField, settings, formName, formDescription,
          addFieldToSection, moveFieldInSection, moveFieldBetweenSections, updateField, removeFieldFromRow } = store

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

    // ── Beside drop ──────────────────────────────────────────────────────────
    if (String(over.id).startsWith('beside:')) {
      const rowFields       = (over.data.current?.rowFields ?? []) as FormField[]
      const targetSectionId = over.data.current?.sectionId as string | undefined
      const fromSectionId   = active.data.current?.sectionId as string | undefined
      const draggingId      = String(active.id)

      // Skip if already in the same row
      if (rowFields.some(f => f.id === draggingId)) return

      const newCount = rowFields.length + 1
      const w: 'col1'|'col2'|'col3'|'col4' = newCount >= 4 ? 'col4' : newCount === 3 ? 'col3' : newCount === 2 ? 'col2' : 'col1'
      const rowId = rowFields[0]?.rowId ?? uuid()

      // If dragged field already belongs to a row, detach it first
      const draggedField = active.data.current?.field as FormField | undefined
      if (draggedField?.rowId) {
        removeFieldFromRow(draggingId, fromSectionId)
      }

      // If coming from a different section, move the field into the target section first
      const normalizedFrom   = fromSectionId   ?? null
      const normalizedTarget = targetSectionId ?? null

      if (normalizedFrom !== normalizedTarget) {
        const targetSec = normalizedTarget ? sections.find(s => s.id === normalizedTarget) : null
        const toIndex   = targetSec ? targetSec.fields.length : fields.length
        moveFieldBetweenSections(draggingId, normalizedFrom, normalizedTarget, toIndex)
      }

      // Assign shared rowId + balanced width to all row members and the dragged field
      rowFields.forEach(f => updateField(f.id, { rowId, width: w }, targetSectionId))
      updateField(draggingId, { rowId, width: w }, targetSectionId)
      return
    }

    if (active.data.current?.fromCanvas && over.id !== active.id) {
      const fromSectionId   = active.data.current.sectionId as string | undefined
      const toSectionId     = over.data.current?.sectionId  as string | undefined
      const draggedField    = active.data.current.field as FormField | undefined

      if (draggedField?.rowId && !String(over.id).startsWith('beside:')) {
        removeFieldFromRow(String(active.id), fromSectionId)
      }

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
  }, [fields, sections, addField, addFieldToSection, store, moveFieldInSection, moveFieldBetweenSections, updateField, removeFieldFromRow])

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
          collisionDetection={besidePriorityCollision}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="flex-1 flex overflow-hidden">
            <aside className="w-56 bg-[var(--sidebar-bg)] border-r border-[var(--border)] flex flex-col overflow-hidden flex-shrink-0">
              <FieldPalette />
            </aside>

            <main className="flex-1 overflow-y-auto bg-[var(--canvas-bg)] p-6">
              {viewport !== 'desktop' && (
                <div className="mb-3 flex items-center gap-2 text-xs text-[var(--muted)]">
                  <span className="px-2 py-0.5 rounded-full bg-[var(--surface-2)] font-mono">
                    {viewport === 'tablet' ? '768px' : '375px'}
                  </span>
                  <span>{viewport === 'tablet' ? 'Tablet view' : 'Mobile view'}</span>
                </div>
              )}

              {/* ── Canvas width is now constrained to max-w-2xl for desktop, matching  ── */}
              {/* ── the new-form page. This ensures BesideZones are a meaningful size   ── */}
              {/* ── relative to field cards so the custom collision detector can hit them. ── */}
              <div className="transition-all duration-300 mx-auto"
                style={{ maxWidth: viewport === 'desktop' ? '672px' : viewport === 'tablet' ? '768px' : '375px' }}>
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
                          ⠿ Drag fields vertically to reorder · Drag onto the <span className="font-semibold text-[var(--brand)]">→ beside</span> zone to place fields side-by-side · Widths auto-balance
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