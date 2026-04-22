'use client'
import { useBuilderStore } from '@/store/builderStore'
import { FormSection } from '@/types'
import {
  Plus, Trash2, Copy, ChevronDown, ChevronRight,
  GripVertical, LayoutTemplate,
} from 'lucide-react'
import { useState } from 'react'
import {
  DndContext, closestCenter, PointerSensor, useSensor, useSensors, DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext, useSortable, verticalListSortingStrategy, arrayMove,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

function SortableSectionRow({ section }: { section: FormSection }) {
  const {
    attributes, listeners, setNodeRef, transform, transition, isDragging,
  } = useSortable({ id: section.id })

  const {
    selectedSectionId, selectSection, removeSection,
    duplicateSection, updateSection,
  } = useBuilderStore()

  const isSelected = selectedSectionId === section.id
  const [editing, setEditing] = useState(false)
  const [titleVal, setTitleVal] = useState(section.title)

  const commitTitle = () => {
    updateSection(section.id, { title: titleVal.trim() || 'Untitled Section' })
    setEditing(false)
  }

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.4 : 1 }}
      onClick={() => selectSection(section.id)}
      className={`group flex items-center gap-2 px-3 py-2.5 rounded-lg cursor-pointer transition-all border ${
        isSelected
          ? 'bg-[#eef2ff] dark:bg-[#1e1b4b] border-[var(--brand)]/30 text-[var(--brand)]'
          : 'border-transparent hover:bg-[var(--surface-2)] text-[var(--text)]'
      }`}
    >
      {/* Drag handle */}
      <span
        {...attributes}
        {...listeners}
        className="text-[var(--muted)] cursor-grab active:cursor-grabbing flex-shrink-0"
        onClick={e => e.stopPropagation()}
      >
        <GripVertical size={13} />
      </span>

      {/* Section icon */}
      <span className={`flex-shrink-0 ${isSelected ? 'text-[var(--brand)]' : 'text-[var(--muted)]'}`}>
        <LayoutTemplate size={13} />
      </span>

      {/* Title — inline edit on double-click */}
      {editing ? (
        <input
          autoFocus
          className="flex-1 text-xs bg-transparent outline-none border-b border-[var(--brand)] py-0.5"
          value={titleVal}
          onChange={e => setTitleVal(e.target.value)}
          onBlur={commitTitle}
          onKeyDown={e => { if (e.key === 'Enter') commitTitle(); if (e.key === 'Escape') { setTitleVal(section.title); setEditing(false) } }}
          onClick={e => e.stopPropagation()}
        />
      ) : (
        <span
          className="flex-1 text-xs font-medium truncate"
          onDoubleClick={e => { e.stopPropagation(); setEditing(true) }}
          title="Double-click to rename"
        >
          {section.title}
        </span>
      )}

      {/* Field count badge */}
      <span className="text-[10px] text-[var(--muted)] font-mono bg-[var(--surface-2)] px-1.5 py-0.5 rounded flex-shrink-0">
        {section.fields.length}
      </span>

      {/* Actions */}
      <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
        <button
          onClick={e => { e.stopPropagation(); duplicateSection(section.id) }}
          className="p-1 rounded hover:bg-[var(--surface-2)] text-[var(--muted)] hover:text-[var(--brand)] transition-colors"
          title="Duplicate section"
        >
          <Copy size={11} />
        </button>
        <button
          onClick={e => { e.stopPropagation(); removeSection(section.id) }}
          className="p-1 rounded hover:bg-red-50 dark:hover:bg-red-900/20 text-[var(--muted)] hover:text-red-500 transition-colors"
          title="Delete section"
        >
          <Trash2 size={11} />
        </button>
      </div>
    </div>
  )
}

export default function SectionPanel() {
  const { sections, addSection, moveSection } = useBuilderStore()

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }))

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const oldIdx = sections.findIndex(s => s.id === active.id)
    const newIdx = sections.findIndex(s => s.id === over.id)
    if (oldIdx !== -1 && newIdx !== -1) moveSection(oldIdx, newIdx)
  }

  return (
    <div className="border-t border-[var(--border)] pt-3 mt-3">
      {/* Header */}
      <div className="flex items-center justify-between px-4 pb-2">
        <h3 className="text-xs font-semibold text-[var(--text)] uppercase tracking-wider">Sections</h3>
        <button
          onClick={addSection}
          className="flex items-center gap-1 text-xs text-[var(--brand)] hover:text-[var(--brand-dark)] font-medium transition-colors"
          title="Add section"
        >
          <Plus size={12} />
          Add
        </button>
      </div>

      {sections.length === 0 ? (
        <div className="px-4 py-3 text-center">
          <p className="text-xs text-[var(--muted)]">No sections yet</p>
          <button
            onClick={addSection}
            className="mt-2 text-xs text-[var(--brand)] hover:underline"
          >
            + Create first section
          </button>
        </div>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={sections.map(s => s.id)} strategy={verticalListSortingStrategy}>
            <div className="px-2 space-y-0.5">
              {sections.map(sec => (
                <SortableSectionRow key={sec.id} section={sec} />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}
    </div>
  )
}