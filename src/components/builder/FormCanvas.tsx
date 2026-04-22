'use client'
import { useDroppable } from '@dnd-kit/core'
import { SortableContext, useSortable, rectSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useBuilderStore } from '@/store/builderStore'
import { FormField, FormSection, FieldType, FieldWidth } from '@/types'
import { getFieldMeta } from '@/lib/fieldRegistry'
import {
  Trash2, Copy, ChevronRight, Plus, X, LayoutTemplate,
  Pencil, ChevronDown, ChevronUp, CheckCircle2,
} from 'lucide-react'
import FieldPreview from './FieldPreview'
import BoxChildModal from './BoxChildModal'
import { useState, useEffect } from 'react'
import { v4 as uuid } from 'uuid'

// ── Width helpers ─────────────────────────────────────────────────────────────

export const WIDTH_LABEL: Record<FieldWidth, string> = {
  col1: '100%', col2: '50%', col3: '33%', col4: '25%',
}

export function getWidthPx(width?: FieldWidth): string {
  switch (width) {
    case 'col2': return 'calc(50% - 6px)'
    case 'col3': return 'calc(33.333% - 8px)'
    case 'col4': return 'calc(25% - 9px)'
    default:     return '100%'
  }
}

// ── Group flat field list into rows by rowId ──────────────────────────────────
function groupIntoRows(fields: FormField[]): FormField[][] {
  const rows: FormField[][] = []
  const rowMap = new Map<string, FormField[]>()
  for (const field of fields) {
    const rid = field.rowId
    if (rid) {
      if (!rowMap.has(rid)) {
        const group: FormField[] = []
        rowMap.set(rid, group)
        rows.push(group)
      }
      rowMap.get(rid)!.push(field)
    } else {
      rows.push([field])
    }
  }
  return rows
}

// ── Box children display ──────────────────────────────────────────────────────
function BoxChildrenDisplay({
  field, onAddChildren, onRemoveChild, parentSectionId,
}: {
  field: FormField
  onAddChildren: (types: FieldType[]) => void
  onRemoveChild: (childId: string) => void
  parentSectionId?: string
}) {
  const [modalOpen, setModalOpen] = useState(false)
  const { selectedId, selectField } = useBuilderStore()
  const children = field.children || []

  return (
    <div className="mt-2 border border-dashed border-[#d1d5db] rounded-lg bg-[#f9fafb] dark:bg-[#1e293b] overflow-visible">
      {children.length > 0 && (
        <div className="px-3 pt-3 pb-1 flex flex-col gap-1.5">
          {children.map(child => {
            const childMeta = getFieldMeta(child.type)
            const isChildSelected = selectedId === child.id
            return (
              <div
                key={child.id}
                onClick={e => { e.stopPropagation(); selectField(child.id, parentSectionId ?? null) }}
                className={`flex items-center gap-2 px-2.5 py-1.5 rounded-md border group/child cursor-pointer transition-all ${
                  isChildSelected
                    ? 'bg-[#eef2ff] border-[var(--brand)] dark:bg-[#1e1b4b]'
                    : 'bg-white dark:bg-[#0f172a] border-[var(--border)] hover:border-[var(--brand)]/50 hover:bg-[#f5f3ff]/40'
                }`}
              >
                <span
                  className="w-5 h-5 rounded flex items-center justify-center flex-shrink-0"
                  style={{ background: childMeta.color + '18', color: childMeta.color }}
                >
                  <childMeta.icon size={10} />
                </span>
                <span className="flex-1 text-xs text-[var(--text)] truncate">
                  {child.label || childMeta.label}
                </span>
                {isChildSelected && (
                  <span className="text-[10px] text-[var(--brand)] font-semibold flex-shrink-0">editing</span>
                )}
                <button
                  onClick={e => { e.stopPropagation(); onRemoveChild(child.id) }}
                  className="opacity-0 group-hover/child:opacity-100 w-4 h-4 rounded flex items-center justify-center text-[var(--muted)] hover:text-red-500 hover:bg-red-50 transition-all flex-shrink-0"
                >
                  <X size={10} />
                </button>
              </div>
            )
          })}
        </div>
      )}
      <button
        onClick={e => { e.stopPropagation(); setModalOpen(true) }}
        className="w-full flex items-center justify-center gap-1.5 py-2.5 text-xs text-[var(--muted)] hover:text-[var(--brand)] hover:bg-[#eef2ff] dark:hover:bg-[#1e1b4b] transition-colors group/add"
      >
        <span className="w-5 h-5 rounded-full border border-dashed border-[var(--muted)] group-hover/add:border-[var(--brand)] flex items-center justify-center transition-colors">
          <Plus size={10} />
        </span>
        <span>Add components</span>
      </button>
      <BoxChildModal open={modalOpen} onClose={() => setModalOpen(false)} onAdd={onAddChildren} />
    </div>
  )
}

// ── Field card ────────────────────────────────────────────────────────────────
export function FieldCard({ field, isDragging = false, sectionId }: {
  field: FormField
  isDragging?: boolean
  sectionId?: string
}) {
  const { selectedId, selectField, removeField, duplicateField, updateField } = useBuilderStore()
  const isSelected = selectedId === field.id
  const meta = getFieldMeta(field.type)
  const isBox = field.type === 'box'

  const handleAddChildren = (types: FieldType[]) => {
    const newChildren: FormField[] = types.map(type => {
      const m = getFieldMeta(type)
      return { id: uuid(), type, label: m.label, width: 'col1' } as FormField
    })
    updateField(field.id, { children: [...(field.children || []), ...newChildren] }, sectionId)
  }

  const handleRemoveChild = (childId: string) => {
    updateField(field.id, { children: (field.children || []).filter(c => c.id !== childId) }, sectionId)
  }

  return (
    <div
      onClick={e => { if (!isDragging) { e.stopPropagation(); selectField(field.id, sectionId ?? null) } }}
      className={`field-card group relative ${isSelected && !isDragging ? 'selected' : ''} ${isDragging ? 'shadow-2xl ring-2 ring-[#6366f1] ring-offset-2' : ''}`}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span
            className="w-5 h-5 rounded flex items-center justify-center"
            style={{ background: meta.color + '18', color: meta.color }}
          >
            <meta.icon size={11} />
          </span>
          <span className="text-xs font-medium text-[var(--muted)] truncate max-w-[120px]">
            {field.label || meta.label}
          </span>
        </div>
        {!isDragging && (
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <span className="text-[10px] font-mono text-[var(--muted)] bg-[var(--surface-2)] px-1.5 py-0.5 rounded">
              {WIDTH_LABEL[field.width || 'col1']}
            </span>
            <button
              onClick={e => { e.stopPropagation(); duplicateField(field.id, sectionId) }}
              className="p-1 rounded hover:bg-[var(--surface-2)] text-[var(--muted)] hover:text-[var(--brand)] transition-colors"
              title="Duplicate"
            >
              <Copy size={13} />
            </button>
            <button
              onClick={e => { e.stopPropagation(); removeField(field.id, sectionId) }}
              className="p-1 rounded hover:bg-red-50 dark:hover:bg-red-900/20 text-[var(--muted)] hover:text-red-500 transition-colors"
              title="Remove"
            >
              <Trash2 size={13} />
            </button>
            {isSelected && <ChevronRight size={13} className="text-[var(--brand)] ml-1" />}
          </div>
        )}
      </div>

      {isBox ? (
        <BoxChildrenDisplay
          field={field}
          onAddChildren={handleAddChildren}
          onRemoveChild={handleRemoveChild}
          parentSectionId={sectionId}
        />
      ) : (
        <div className="pointer-events-none select-none">
          <FieldPreview field={field} />
        </div>
      )}

      {isSelected && !isDragging && (
        <div className="absolute left-0 top-3 bottom-3 w-0.5 bg-[#6366f1] rounded-full" />
      )}
    </div>
  )
}

// ── Sortable wrapper ──────────────────────────────────────────────────────────
function SortableFieldCard({ field, sectionId }: { field: FormField; sectionId?: string }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: field.id,
    data: { fromCanvas: true, field, sectionId },
  })

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      style={{
        flex: '1 1 0',
        minWidth: 0,
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0 : 1,
        zIndex: isDragging ? 99 : 1,
        cursor: 'grab',
      }}
    >
      <FieldCard field={field} sectionId={sectionId} />
    </div>
  )
}

// ── Beside-drop zone ──────────────────────────────────────────────────────────
// A slim droppable sliver that appears to the right of each field while dragging.
// When a compatible field is hovered over it, it expands and highlights.
function BesideZone({
  afterField,
  rowFields,
  sectionId,
}: {
  afterField: FormField
  rowFields: FormField[]
  sectionId?: string
}) {
  const droppableId = `beside:${afterField.id}`
  const { isOver, setNodeRef, active } = useDroppable({
    id: droppableId,
    data: { type: 'beside', afterFieldId: afterField.id, rowFields, sectionId },
  })

  // Only show/activate when a draggable field is in motion
  const draggingField = active?.data?.current?.field as FormField | undefined
  const alreadyInRow  = draggingField ? rowFields.some(f => f.id === draggingField.id) : false
  const canAccept     = !!draggingField && !alreadyInRow && rowFields.length < 4

  if (!canAccept && !active) return <div className="w-1 flex-shrink-0" />

  return (
    <div
      ref={setNodeRef}
      className={`
        flex-shrink-0 rounded-lg border-2 border-dashed
        flex items-center justify-center
        transition-all duration-150 overflow-hidden
        ${isOver && canAccept
          ? 'w-14 border-[var(--brand)] bg-[#eef2ff] dark:bg-[#1e1b4b] shadow-inner'
          : canAccept
            ? 'w-6 border-[var(--brand)]/30 bg-[#f5f3ff]/20 hover:border-[var(--brand)]/60 hover:bg-[#eef2ff]/40 hover:w-10'
            : 'w-2 border-transparent'
        }
      `}
      title={canAccept ? 'Drop here to place beside' : ''}
    >
      {isOver && canAccept && (
        <span
          className="text-[9px] text-[var(--brand)] font-bold select-none leading-tight text-center px-0.5"
          style={{ writingMode: 'vertical-rl', textOrientation: 'mixed' }}
        >
          + beside
        </span>
      )}
      {!isOver && canAccept && (
        <span className="text-[var(--brand)]/40 text-[10px] font-bold select-none">|</span>
      )}
    </div>
  )
}

// ── Row of fields ─────────────────────────────────────────────────────────────
function FieldRow({ rowFields, sectionId }: { rowFields: FormField[]; sectionId?: string }) {
  return (
    <div className="flex gap-2 items-stretch w-full">
      {rowFields.map(field => (
        <div key={field.id} className="flex gap-1 items-stretch min-w-0" style={{ flex: '1 1 0' }}>
          <SortableFieldCard field={field} sectionId={sectionId} />
          {/* Beside zone after every field — hidden when row is full (4 fields) */}
          <BesideZone afterField={field} rowFields={rowFields} sectionId={sectionId} />
        </div>
      ))}
    </div>
  )
}

// ── Insertion cursor ──────────────────────────────────────────────────────────
function InsertionCursor({ index, active, sectionId }: { index: number; active: boolean; sectionId?: string }) {
  const { setInsertIndex, setInsertSectionId } = useBuilderStore()
  return (
    <div
      className="w-full flex items-center gap-2 cursor-pointer group/cur select-none"
      style={{ minHeight: active ? 28 : 10, transition: 'min-height 0.15s' }}
      onMouseEnter={() => { setInsertIndex(index); setInsertSectionId(sectionId || null) }}
      onClick={e => { e.stopPropagation(); setInsertIndex(index); setInsertSectionId(sectionId || null) }}
    >
      <div className={`flex-1 rounded-full transition-all duration-150 ${active ? 'h-0.5 bg-[var(--brand)]' : 'h-px bg-transparent group-hover/cur:bg-[var(--brand)]/30'}`} />
      {active && (
        <span className="text-[10px] font-semibold text-[var(--brand)] whitespace-nowrap px-2 py-0.5 rounded-full bg-[#eef2ff] dark:bg-[#1e1b4b] border border-[var(--brand)]/30">
          ✦ Insert here
        </span>
      )}
      <div className={`flex-1 rounded-full transition-all duration-150 ${active ? 'h-0.5 bg-[var(--brand)]' : 'h-px bg-transparent group-hover/cur:bg-[var(--brand)]/30'}`} />
    </div>
  )
}

// ── Field row list ────────────────────────────────────────────────────────────
function FieldRowList({
  fields,
  sectionId,
  insertIndex,
  insertSectionId,
}: {
  fields: FormField[]
  sectionId?: string
  insertIndex: number | null
  insertSectionId: string | null
}) {
  const rows = groupIntoRows(fields)

  const matchesCursor = (rowIdx: number) =>
    sectionId
      ? insertSectionId === sectionId && insertIndex === rowIdx
      : !insertSectionId && insertIndex === rowIdx

  return (
    <div className="flex flex-col gap-0">
      <InsertionCursor index={0} active={matchesCursor(0)} sectionId={sectionId} />
      {rows.map((rowFields, rowIdx) => (
        <div key={rowFields.map(f => f.id).join('+')} className="flex flex-col">
          <FieldRow rowFields={rowFields} sectionId={sectionId} />
          <InsertionCursor index={rowIdx + 1} active={matchesCursor(rowIdx + 1)} sectionId={sectionId} />
        </div>
      ))}
    </div>
  )
}

// ── Empty canvas ──────────────────────────────────────────────────────────────
function EmptyCanvas() {
  const { isOver, setNodeRef } = useDroppable({ id: 'canvas-empty' })
  const { addSection } = useBuilderStore()
  return (
    <div
      ref={setNodeRef}
      className={`flex flex-col items-center justify-center min-h-[400px] rounded-xl border-2 border-dashed transition-all ${
        isOver ? 'border-[var(--brand)] bg-[#eef2ff] dark:bg-[#1e1b4b]' : 'border-[var(--border)]'
      }`}
    >
      <div className="w-12 h-12 rounded-2xl bg-[#eef2ff] dark:bg-[#1e1b4b] flex items-center justify-center mb-3">
        <svg width="22" height="22" fill="none" viewBox="0 0 24 24">
          <path d="M12 5v14M5 12h14" stroke="var(--brand)" strokeWidth="2.5" strokeLinecap="round" />
        </svg>
      </div>
      <p className="font-medium text-[var(--muted)] text-sm">Drag fields here</p>
      <p className="text-xs text-[var(--muted)] mt-1 opacity-70">Or click a field from the left panel</p>
      <div className="mt-4 flex items-center gap-2">
        <span className="text-xs text-[var(--muted)]">or</span>
        <button
          onClick={addSection}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#eef2ff] dark:bg-[#1e1b4b] text-[var(--brand)] text-xs font-medium hover:bg-[#e0e7ff] transition-colors"
        >
          <LayoutTemplate size={13} />
          Add Section
        </button>
      </div>
    </div>
  )
}

// ── Section block ─────────────────────────────────────────────────────────────
function SectionBlock({ section }: { section: FormSection }) {
  const {
    selectedSectionId, selectSection, insertIndex, insertSectionId,
    removeSection, duplicateSection, updateSection,
  } = useBuilderStore()

  const isSelected = selectedSectionId === section.id
  const [collapsed, setCollapsed]       = useState(false)
  const [editingTitle, setEditingTitle] = useState(false)
  const [editingDesc, setEditingDesc]   = useState(false)
  const [titleVal, setTitleVal]         = useState(section.title)
  const [descVal, setDescVal]           = useState(section.description || '')

  useEffect(() => { setTitleVal(section.title) }, [section.title])
  useEffect(() => { setDescVal(section.description || '') }, [section.description])

  const commitTitle = () => {
    updateSection(section.id, { title: titleVal.trim() || 'Untitled Section' })
    setEditingTitle(false)
  }
  const commitDesc = () => {
    updateSection(section.id, { description: descVal })
    setEditingDesc(false)
  }

  const { setNodeRef, isOver } = useDroppable({ id: `section-drop-${section.id}` })

  return (
    <div
      className={`rounded-xl border-2 transition-all mb-4 ${
        isSelected
          ? 'border-[var(--brand)] shadow-md shadow-[var(--brand)]/10'
          : 'border-[var(--border)] hover:border-[var(--brand)]/40'
      } ${isOver ? 'bg-[#eef2ff]/40 dark:bg-[#1e1b4b]/40' : 'bg-[var(--panel-bg)]'}`}
      onClick={e => { e.stopPropagation(); selectSection(section.id) }}
    >
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-[var(--border)] group/sec-header">
        <div className="w-1 h-8 rounded-full bg-[var(--brand)] flex-shrink-0 opacity-70" />
        <LayoutTemplate size={15} className="text-[var(--brand)] flex-shrink-0" />

        <div className="flex-1 min-w-0">
          {editingTitle ? (
            <input
              autoFocus
              className="w-full text-sm font-semibold bg-transparent outline-none border-b border-[var(--brand)] pb-0.5 text-[var(--text)]"
              value={titleVal}
              onChange={e => setTitleVal(e.target.value)}
              onBlur={commitTitle}
              onKeyDown={e => {
                if (e.key === 'Enter') commitTitle()
                if (e.key === 'Escape') { setTitleVal(section.title); setEditingTitle(false) }
              }}
              onClick={e => e.stopPropagation()}
            />
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-[var(--text)] truncate">{section.title}</span>
              <button
                onClick={e => { e.stopPropagation(); setEditingTitle(true) }}
                className="opacity-0 group-hover/sec-header:opacity-100 p-0.5 rounded text-[var(--muted)] hover:text-[var(--brand)] transition-all"
                title="Rename"
              >
                <Pencil size={11} />
              </button>
            </div>
          )}
          {editingDesc ? (
            <input
              autoFocus
              className="w-full text-xs bg-transparent outline-none border-b border-[var(--border)] pb-0.5 text-[var(--muted)] mt-0.5"
              value={descVal}
              placeholder="Section description (optional)"
              onChange={e => setDescVal(e.target.value)}
              onBlur={commitDesc}
              onKeyDown={e => {
                if (e.key === 'Enter') commitDesc()
                if (e.key === 'Escape') { setDescVal(section.description || ''); setEditingDesc(false) }
              }}
              onClick={e => e.stopPropagation()}
            />
          ) : (
            <div
              className="text-xs text-[var(--muted)] mt-0.5 cursor-text hover:text-[var(--text)] transition-colors min-h-[16px]"
              onClick={e => { e.stopPropagation(); setEditingDesc(true) }}
              title="Click to add description"
            >
              {section.description || <span className="opacity-40 italic">Add description…</span>}
            </div>
          )}
        </div>

        <span className="text-[10px] font-mono text-[var(--muted)] bg-[var(--surface-2)] px-1.5 py-0.5 rounded flex-shrink-0">
          {section.fields.length} field{section.fields.length !== 1 ? 's' : ''}
        </span>

        <div className="flex items-center gap-1 flex-shrink-0">
          <button
            onClick={e => { e.stopPropagation(); duplicateSection(section.id) }}
            className="p-1.5 rounded-lg hover:bg-[var(--surface-2)] text-[var(--muted)] hover:text-[var(--brand)] transition-colors"
            title="Duplicate"
          >
            <Copy size={13} />
          </button>
          <button
            onClick={e => { e.stopPropagation(); removeSection(section.id) }}
            className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-[var(--muted)] hover:text-red-500 transition-colors"
            title="Delete"
          >
            <Trash2 size={13} />
          </button>
          <button
            onClick={e => { e.stopPropagation(); setCollapsed(v => !v) }}
            className="p-1.5 rounded-lg hover:bg-[var(--surface-2)] text-[var(--muted)] transition-colors"
            title={collapsed ? 'Expand' : 'Collapse'}
          >
            {collapsed ? <ChevronDown size={13} /> : <ChevronUp size={13} />}
          </button>
        </div>
      </div>

      {/* Body */}
      {!collapsed && (
        <div ref={setNodeRef} className="p-3 min-h-[80px]">
          <SortableContext items={section.fields.map(f => f.id)} strategy={rectSortingStrategy}>
            {section.fields.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-6 rounded-lg border border-dashed border-[var(--border)] text-[var(--muted)]">
                <p className="text-xs">Drop fields here</p>
                <p className="text-[10px] opacity-60 mt-1">or click a field from the left panel</p>
              </div>
            ) : (
              <FieldRowList
                fields={section.fields}
                sectionId={section.id}
                insertIndex={insertIndex}
                insertSectionId={insertSectionId}
              />
            )}
          </SortableContext>
        </div>
      )}
    </div>
  )
}

// ── Stepper tab bar ───────────────────────────────────────────────────────────
function StepperTabBar({
  sections, activeStep, onStepClick, onAddStep, onRenameStep,
}: {
  sections: FormSection[]
  activeStep: number
  onStepClick: (idx: number) => void
  onAddStep: () => void
  onRenameStep: (id: string, title: string) => void
}) {
  const [editingIdx, setEditingIdx] = useState<number | null>(null)
  const [editVal, setEditVal]       = useState('')

  const startEdit = (idx: number, e: React.MouseEvent) => {
    e.stopPropagation()
    setEditingIdx(idx)
    setEditVal(sections[idx].title)
  }

  const commitEdit = (id: string) => {
    if (editVal.trim()) onRenameStep(id, editVal.trim())
    setEditingIdx(null)
  }

  return (
    <div className="mb-5">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-[10px] font-semibold text-[var(--brand)] uppercase tracking-widest">Stepper Steps</span>
        <div className="flex-1 h-px bg-[var(--brand)]/20" />
        <span className="text-[10px] text-[var(--muted)]">Click step to edit • Double-click to rename</span>
      </div>

      <div className="flex items-stretch gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        {sections.map((sec, idx) => {
          const isActive = idx === activeStep
          const isDone   = idx < activeStep
          return (
            <button
              key={sec.id}
              onClick={() => onStepClick(idx)}
              onDoubleClick={e => startEdit(idx, e)}
              className={`
                relative flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-medium
                whitespace-nowrap transition-all duration-200 border group/tab flex-shrink-0
                ${isActive
                  ? 'bg-[var(--brand)] text-white border-[var(--brand)] shadow-md shadow-[var(--brand)]/25'
                  : isDone
                    ? 'bg-[var(--brand)]/8 text-[var(--brand)] border-[var(--brand)]/30 hover:bg-[var(--brand)]/15'
                    : 'bg-[var(--surface-2)] text-[var(--muted)] border-[var(--border)] hover:text-[var(--text)] hover:border-[var(--brand)]/40'
                }
              `}
            >
              <span className={`
                w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0
                ${isActive ? 'bg-white/20 text-white' : isDone ? 'bg-[var(--brand)]/20 text-[var(--brand)]' : 'bg-[var(--border)] text-[var(--muted)]'}
              `}>
                {isDone ? <CheckCircle2 size={12} className="text-[var(--brand)]" /> : idx + 1}
              </span>

              {editingIdx === idx ? (
                <input
                  autoFocus
                  className="w-24 bg-transparent outline-none border-b border-white/50 text-white text-xs py-0"
                  value={editVal}
                  onChange={e => setEditVal(e.target.value)}
                  onBlur={() => commitEdit(sec.id)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') commitEdit(sec.id)
                    if (e.key === 'Escape') setEditingIdx(null)
                    e.stopPropagation()
                  }}
                  onClick={e => e.stopPropagation()}
                />
              ) : (
                <span className="max-w-[120px] truncate">{sec.title}</span>
              )}

              {editingIdx !== idx && (
                <span
                  onClick={e => startEdit(idx, e)}
                  className={`opacity-0 group-hover/tab:opacity-100 transition-opacity ml-0.5 flex-shrink-0 ${
                    isActive ? 'text-white/60 hover:text-white' : 'text-[var(--muted)] hover:text-[var(--brand)]'
                  }`}
                >
                  <Pencil size={10} />
                </span>
              )}
              {isActive && <span className="absolute bottom-0 left-3 right-3 h-0.5 bg-white/40 rounded-full" />}
            </button>
          )
        })}

        <button
          onClick={onAddStep}
          className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl border-2 border-dashed border-[var(--border)] text-[var(--muted)] hover:text-[var(--brand)] hover:border-[var(--brand)] hover:bg-[#eef2ff]/50 dark:hover:bg-[#1e1b4b]/50 text-xs font-medium transition-all flex-shrink-0"
        >
          <Plus size={12} />Step
        </button>
      </div>

      <div className="mt-2.5 h-1 rounded-full bg-[var(--border)] overflow-hidden">
        <div
          className="h-full rounded-full bg-[var(--brand)] transition-all duration-300"
          style={{
            width: sections.length > 1
              ? `${(activeStep / (sections.length - 1)) * 100}%`
              : activeStep === 0 ? '100%' : '0%',
          }}
        />
      </div>
      <div className="flex justify-between mt-1">
        <span className="text-[10px] text-[var(--muted)]">Step {activeStep + 1} of {sections.length}</span>
        <span className="text-[10px] text-[var(--muted)]">
          {sections[activeStep]?.fields.length || 0} field{sections[activeStep]?.fields.length !== 1 ? 's' : ''} in this step
        </span>
      </div>
    </div>
  )
}

// ── Main canvas ───────────────────────────────────────────────────────────────
export default function FormCanvas() {
  const { fields, sections, insertIndex, insertSectionId, addSection, settings, updateSection } = useBuilderStore()
  const { setNodeRef, isOver } = useDroppable({ id: 'canvas' })

  const [activeStep, setActiveStep] = useState(0)

  const stepperMode = settings.stepperMode && sections.length > 0
  const clampedStep = Math.min(activeStep, Math.max(0, sections.length - 1))

  useEffect(() => {
    if (clampedStep !== activeStep) setActiveStep(clampedStep)
  }, [clampedStep, activeStep])

  const prevSectionCount = useState(sections.length)[0]
  useEffect(() => {
    if (stepperMode && sections.length > prevSectionCount) setActiveStep(sections.length - 1)
  }, [sections.length]) // eslint-disable-line react-hooks/exhaustive-deps

  if (fields.length === 0 && sections.length === 0) return <EmptyCanvas />

  if (stepperMode) {
    const activeSection = sections[clampedStep]
    return (
      <div ref={setNodeRef} className={`min-h-[200px] rounded-xl p-2 transition-colors ${isOver ? 'bg-[#eef2ff]/60 dark:bg-[#1e1b4b]/60' : ''}`}>
        <StepperTabBar
          sections={sections}
          activeStep={clampedStep}
          onStepClick={setActiveStep}
          onAddStep={addSection}
          onRenameStep={(id, title) => updateSection(id, { title })}
        />
        {activeSection && <SectionBlock key={activeSection.id} section={activeSection} />}
        {fields.length > 0 && (
          <div className="mt-3">
            <div className="flex items-center gap-2 mb-3">
              <div className="flex-1 h-px bg-[var(--border)]" />
              <span className="text-[10px] text-[var(--muted)] uppercase tracking-wider font-medium px-2">Other fields (shown on last step)</span>
              <div className="flex-1 h-px bg-[var(--border)]" />
            </div>
            <SortableContext items={fields.map(f => f.id)} strategy={rectSortingStrategy}>
              <FieldRowList
                fields={fields}
                insertIndex={insertIndex}
                insertSectionId={insertSectionId}
              />
            </SortableContext>
          </div>
        )}
        <div className={`mt-1 h-10 rounded-xl border-2 border-dashed flex items-center justify-center transition-all ${isOver ? 'border-[var(--brand)] bg-[#eef2ff] dark:bg-[#1e1b4b] opacity-100' : 'border-transparent opacity-0'}`}>
          <span className="text-xs text-[var(--brand)] font-medium">Drop here</span>
        </div>
      </div>
    )
  }

  return (
    <div ref={setNodeRef} className={`min-h-[200px] rounded-xl p-2 transition-colors ${isOver ? 'bg-[#eef2ff]/60 dark:bg-[#1e1b4b]/60' : ''}`}>
      {sections.map(section => (
        <SectionBlock key={section.id} section={section} />
      ))}

      {fields.length > 0 && (
        <div>
          {sections.length > 0 && (
            <div className="flex items-center gap-2 mb-3 mt-1">
              <div className="flex-1 h-px bg-[var(--border)]" />
              <span className="text-[10px] text-[var(--muted)] uppercase tracking-wider font-medium px-2">Other fields</span>
              <div className="flex-1 h-px bg-[var(--border)]" />
            </div>
          )}
          <SortableContext items={fields.map(f => f.id)} strategy={rectSortingStrategy}>
            <FieldRowList
              fields={fields}
              insertIndex={insertIndex}
              insertSectionId={insertSectionId}
            />
          </SortableContext>
        </div>
      )}

      <button
        onClick={addSection}
        className="mt-3 w-full flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-dashed border-[var(--border)] text-[var(--muted)] hover:border-[var(--brand)] hover:text-[var(--brand)] hover:bg-[#eef2ff]/50 dark:hover:bg-[#1e1b4b]/50 transition-all text-xs font-medium"
      >
        <LayoutTemplate size={13} />
        Add Section
      </button>

      <div className={`mt-1 h-10 rounded-xl border-2 border-dashed flex items-center justify-center transition-all ${isOver ? 'border-[var(--brand)] bg-[#eef2ff] dark:bg-[#1e1b4b] opacity-100' : 'border-transparent opacity-0'}`}>
        <span className="text-xs text-[var(--brand)] font-medium">Drop here</span>
      </div>
    </div>
  )
}
