'use client'
import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  DndContext, DragEndEvent, DragStartEvent,
  PointerSensor, useSensor, useSensors,
  DragOverlay, rectIntersection,
} from '@dnd-kit/core'
import { useBuilderStore } from '@/store/builderStore'
import { FieldType, FormField } from '@/types'
import { v4 as uuid } from 'uuid'
import FieldPalette from '@/components/builder/FieldPalette'
import FormCanvas, { FieldCard, getWidthPx } from '@/components/builder/FormCanvas'
import PropertiesPanel from '@/components/builder/PropertiesPanel'
import BuilderToolbar from '@/components/builder/BuilderToolbar'
import { getFieldMeta } from '@/lib/fieldRegistry'

export default function NewBuilderPage() {
  const router  = useRouter()
  const store   = useBuilderStore()
  const { fields, sections, addField, moveField, addFieldToSection, moveFieldInSection, moveFieldBetweenSections, updateField, removeFieldFromRow, formName, formDescription } = store

  const [activeField, setActiveField]             = useState<FormField | null>(null)
  const [activeSectionId, setActiveSectionId]     = useState<string | null>(null)
  const [activePaletteType, setActivePaletteType] = useState<FieldType | null>(null)
  const [savedId, setSavedId]                     = useState<number | null>(null)
  const [viewport, setViewport]                   = useState<'desktop' | 'tablet' | 'mobile'>('desktop')

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  )

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
      if (over.id === 'canvas' || over.id === 'canvas-empty') {
        addField(type)
        return
      }
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
      const draggingId      = String(active.id)

      if (rowFields.some(f => f.id === draggingId)) return

      const newCount = rowFields.length + 1
      const w: 'col1'|'col2'|'col3'|'col4' = newCount >= 4 ? 'col4' : newCount === 3 ? 'col3' : newCount === 2 ? 'col2' : 'col1'
      const rowId = rowFields[0]?.rowId ?? uuid()

      rowFields.forEach(f => updateField(f.id, { rowId, width: w }, targetSectionId))
      updateField(draggingId, { rowId, width: w }, targetSectionId ?? (active.data.current?.sectionId as string | undefined))
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
        if (oldIdx !== -1 && newIdx !== -1) moveField(oldIdx, newIdx)
      } else {
        const destSectionId = toSectionId || null
        let toIndex = 0
        if (destSectionId) {
          const sec = sections.find(s => s.id === destSectionId)
          toIndex   = sec ? sec.fields.length : 0
        } else {
          toIndex = fields.length
        }
        moveFieldBetweenSections(String(active.id), fromSectionId || null, destSectionId, toIndex)
      }
    }
  }, [fields, sections, addField, addFieldToSection, moveField, moveFieldInSection, moveFieldBetweenSections, updateField, removeFieldFromRow])

  const paletteMeta = activePaletteType ? getFieldMeta(activePaletteType) : null

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-[var(--surface)]">
      <BuilderToolbar
        formId={savedId || undefined}
        onSaved={(id) => { setSavedId(id); router.replace(`/builder/${id}`) }}
        mode="editor"
        viewport={viewport}
        onViewportChange={setViewport}
      />

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

          <main className="flex-1 overflow-y-auto bg-[var(--canvas-bg)] p-6">
            {viewport !== 'desktop' && (
              <div className="mb-3 flex items-center gap-2 text-xs text-[var(--muted)]">
                <span className="px-2 py-0.5 rounded-full bg-[var(--surface-2)] font-mono">
                  {viewport === 'tablet' ? '768px' : '375px'}
                </span>
                <span>{viewport === 'tablet' ? 'Tablet view' : 'Mobile view'}</span>
              </div>
            )}

            {viewport === 'desktop' ? (
              <div className="w-full">
                <div className="mb-6 bg-[var(--card-bg)] rounded-xl border border-[var(--border)] p-5">
                  <h1 className="text-xl font-bold text-[var(--text)]">{formName || 'Untitled Form'}</h1>
                  {formDescription && <p className="text-sm text-[var(--muted)] mt-1">{formDescription}</p>}
                </div>
                {(fields.length > 0 || sections.length > 0) && (
                  <p className="text-[11px] text-[var(--muted)] mb-2">
                    ⠿ Drag fields vertically to reorder · Drag onto the <span className="font-semibold text-[var(--brand)]">→ beside</span> zone to place fields side-by-side · Widths auto-balance
                  </p>
                )}
                <FormCanvas viewport="desktop" />
              </div>
            ) : (
              <div
                className="mx-auto transition-all duration-300"
                style={{ width: viewport === 'tablet' ? '768px' : '375px', maxWidth: '100%' }}
              >
                <div className={`px-4 py-2 flex items-center gap-2 ${viewport === 'mobile' ? 'bg-[#1e293b] rounded-t-3xl' : 'bg-[#1e293b] rounded-t-2xl'}`}>
                  <div className="w-2 h-2 rounded-full bg-red-400" />
                  <div className="w-2 h-2 rounded-full bg-yellow-400" />
                  <div className="w-2 h-2 rounded-full bg-green-400" />
                  <div className="flex-1 mx-4 bg-[#0f172a] rounded-full h-5 flex items-center justify-center">
                    <span className="text-[10px] text-[#475569] font-mono">form preview</span>
                  </div>
                </div>
                <div className="bg-[var(--card-bg)] border-x border-b border-[#1e293b] rounded-b-2xl shadow-2xl overflow-hidden">
                  <div className="overflow-y-auto max-h-[78vh]" style={{ overflowX: 'hidden' }}>
                    <div className="p-4">
                      <div className="mb-4 bg-[var(--card-bg)] rounded-xl border border-[var(--border)] p-4">
                        <h1 className="text-lg font-bold text-[var(--text)]">{formName || 'Untitled Form'}</h1>
                        {formDescription && <p className="text-sm text-[var(--muted)] mt-1">{formDescription}</p>}
                      </div>
                      {(fields.length > 0 || sections.length > 0) && (
                        <p className="text-[10px] text-[var(--muted)] mb-2 leading-snug">
                          ⠿ Drag fields to reorder · Drag onto <span className="font-semibold text-[var(--brand)]">beside</span> zone to place side-by-side
                        </p>
                      )}
                      <FormCanvas viewport={viewport} />
                    </div>
                  </div>
                </div>
              </div>
            )}
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
            <div className="palette-item shadow-xl opacity-95 w-48 bg-[var(--card-bg)] border border-[var(--brand)]/30">
              <span className="w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0"
                style={{ background: paletteMeta.color + '18', color: paletteMeta.color }}>
                <paletteMeta.icon size={13} />
              </span>
              <span>{paletteMeta.label}</span>
            </div>
          )}
        </DragOverlay>
      </DndContext>
    </div>
  )
}