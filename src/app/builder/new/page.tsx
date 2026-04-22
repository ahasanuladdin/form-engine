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
import FieldPalette from '@/components/builder/FieldPalette'
import FormCanvas, { FieldCard, getWidthPx } from '@/components/builder/FormCanvas'
import PropertiesPanel from '@/components/builder/PropertiesPanel'
import BuilderToolbar from '@/components/builder/BuilderToolbar'
import { getFieldMeta } from '@/lib/fieldRegistry'

export default function NewBuilderPage() {
  const router  = useRouter()
  const store   = useBuilderStore()
  const { fields, sections, addField, moveField, addFieldToSection, moveFieldInSection, moveFieldBetweenSections, formName, formDescription } = store

  const [activeField, setActiveField]             = useState<FormField | null>(null)
  const [activeSectionId, setActiveSectionId]     = useState<string | null>(null)
  const [activePaletteType, setActivePaletteType] = useState<FieldType | null>(null)
  const [savedId, setSavedId]                     = useState<number | null>(null)

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
  }, [fields, sections, addField, addFieldToSection, moveField, moveFieldInSection, moveFieldBetweenSections])

  const paletteMeta = activePaletteType ? getFieldMeta(activePaletteType) : null

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-[var(--surface)]">
      <BuilderToolbar
        formId={savedId || undefined}
        onSaved={(id) => { setSavedId(id); router.replace(`/builder/${id}`) }}
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

          <main className="flex-1 overflow-y-auto p-6">
            <div className="max-w-2xl mx-auto">
              <div className="mb-6 bg-[var(--card-bg)] rounded-xl border border-[var(--border)] p-5">
                <h1 className="text-xl font-bold text-[var(--text)]">{formName || 'Untitled Form'}</h1>
                {formDescription && <p className="text-sm text-[var(--muted)] mt-1">{formDescription}</p>}
              </div>
              {(fields.length > 0 || sections.length > 0) && (
                <p className="text-[11px] text-[var(--muted)] mb-2">
                  ⠿ Drag any field to move it · Sections group your fields logically
                </p>
              )}
              <FormCanvas />
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