'use client'
import { useBuilderStore } from '@/store/builderStore'
import { findFieldDeep } from '@/store/builderStore'
import { FormField, FieldOption, FieldStyle, TableColumn, TableRow } from '@/types'
import { useState, useEffect } from 'react'
import { Plus, Trash2, Settings, CheckSquare, GripVertical, Palette, ChevronDown, Table } from 'lucide-react'

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h4 className="text-xs font-semibold text-[var(--muted)] uppercase tracking-wider mb-3 mt-1">{children}</h4>
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mb-3">
      <label className="block text-xs font-medium text-[var(--muted)] mb-1.5">{label}</label>
      {children}
    </div>
  )
}

function Input({ value, onChange, placeholder, type = 'text' }: any) {
  return (
    <input className="fe-input" type={type} value={value || ''} placeholder={placeholder}
      onChange={e => onChange(e.target.value)} />
  )
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button type="button" onClick={() => onChange(!checked)}
      className={`w-9 h-5 rounded-full relative transition-colors ${checked ? 'bg-[#6366f1]' : 'bg-[#cbd5e1]'}`}>
      <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${checked ? 'left-4' : 'left-0.5'}`} />
    </button>
  )
}

function SpacingRow({ label, values, onChange }: {
  label: string
  values: [string, string, string, string]
  onChange: (vals: [string, string, string, string]) => void
}) {
  const sides = ['T', 'R', 'B', 'L']
  return (
    <div className="mb-3">
      <label className="block text-xs font-medium text-[#64748b] mb-1.5">{label}</label>
      <div className="grid grid-cols-4 gap-1">
        {values.map((v, i) => (
          <div key={i} className="relative">
            <input
              className="fe-input text-center text-xs pr-1 pl-1"
              value={v}
              placeholder="0"
              onChange={e => {
                const next = [...values] as [string, string, string, string]
                next[i] = e.target.value
                onChange(next)
              }}
            />
            <span className="absolute -top-1.5 left-1/2 -translate-x-1/2 text-[8px] text-[var(--muted)] font-bold">{sides[i]}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function ColorRow({ label, value, onChange }: { label: string; value?: string; onChange: (v: string) => void }) {
  return (
    <div className="mb-3">
      <label className="block text-xs font-medium text-[var(--muted)] mb-1.5">{label}</label>
      <div className="flex items-center gap-2">
        <div className="relative flex-shrink-0">
          <input type="color" value={value || '#000000'}
            onChange={e => onChange(e.target.value)}
            className="w-8 h-8 rounded-md border border-[var(--border)] cursor-pointer p-0.5 bg-[var(--input-bg)]" />
        </div>
        <input className="fe-input flex-1 font-mono text-xs" value={value || ''}
          placeholder="#000000 or rgba()" onChange={e => onChange(e.target.value)} />
        {value && (
          <button onClick={() => onChange('')} className="text-[var(--muted)] hover:text-red-400 text-xs px-1">✕</button>
        )}
      </div>
    </div>
  )
}

function SelectRow({ label, value, onChange, options }: {
  label: string; value?: string
  onChange: (v: string) => void
  options: { label: string; value: string }[]
}) {
  return (
    <div className="mb-3">
      <label className="block text-xs font-medium text-[var(--muted)] mb-1.5">{label}</label>
      <select className="fe-input text-xs" value={value || ''} onChange={e => onChange(e.target.value)}>
        <option value="">Default</option>
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  )
}

function Collapsible({ title, children, defaultOpen = false }: { title: string; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="mb-2 border border-[var(--border)] rounded-lg overflow-hidden">
      <button onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-3 py-2.5 bg-[var(--surface-2)] hover:opacity-80 transition-opacity text-left">
        <span className="text-xs font-semibold text-[var(--text)]">{title}</span>
        <ChevronDown size={13} className={`text-[var(--muted)] transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && <div className="px-3 pt-3 pb-1">{children}</div>}
    </div>
  )
}

// ── Style panel ───────────────────────────────────────────────────────────────
function StylePanel({ field, sectionId }: { field: FormField; sectionId?: string | null }) {
  const { updateField } = useBuilderStore()
  const s = field.style || {}

  const set = (patch: Partial<FieldStyle>) =>
    updateField(field.id, { style: { ...s, ...patch } }, sectionId ?? undefined)

  const isLayout = ['heading', 'paragraph', 'divider', 'blockquote', 'code_block', 'ordered_list', 'unordered_list', 'caption'].includes(field.type)
  const isInput = !['heading', 'paragraph', 'divider', 'blockquote', 'code_block', 'ordered_list', 'unordered_list', 'caption', 'toggle', 'rating', 'checkbox', 'color', 'file', 'table'].includes(field.type)

  const fontSizes = ['10px', '11px', '12px', '13px', '14px', '15px', '16px', '18px', '20px', '24px'].map(v => ({ label: v, value: v }))
  const fontWeights = [
    { label: 'Regular (400)', value: '400' },
    { label: 'Medium (500)', value: '500' },
    { label: 'SemiBold (600)', value: '600' },
    { label: 'Bold (700)', value: '700' },
  ]
  const radii = [
    { label: 'None', value: '0px' },
    { label: 'Small', value: '4px' },
    { label: 'Medium', value: '8px' },
    { label: 'Large', value: '12px' },
    { label: 'XL', value: '16px' },
    { label: 'Full', value: '9999px' },
  ]

  return (
    <div className="space-y-2">
      <Collapsible title="Wrapper" defaultOpen>
        <SpacingRow label="Margin"
          values={[s.marginTop || '', s.marginRight || '', s.marginBottom || '', s.marginLeft || '']}
          onChange={([t, r, b, l]) => set({ marginTop: t, marginRight: r, marginBottom: b, marginLeft: l })}
        />
        <SpacingRow label="Padding"
          values={[s.paddingTop || '', s.paddingRight || '', s.paddingBottom || '', s.paddingLeft || '']}
          onChange={([t, r, b, l]) => set({ paddingTop: t, paddingRight: r, paddingBottom: b, paddingLeft: l })}
        />
        <ColorRow label="Background" value={s.wrapperBg} onChange={v => set({ wrapperBg: v })} />
        <div className="mb-3">
          <label className="block text-xs font-medium text-[#64748b] mb-1.5">Border Radius</label>
          <select className="fe-input text-xs" value={s.wrapperRadius || ''} onChange={e => set({ wrapperRadius: e.target.value })}>
            <option value="">Default</option>
            {radii.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
          </select>
        </div>
        <ColorRow label="Border Color" value={s.wrapperBorder} onChange={v => set({ wrapperBorder: v })} />
      </Collapsible>

      {!isLayout && field.type !== 'table' && (
        <Collapsible title="Label">
          <ColorRow label="Color" value={s.labelColor} onChange={v => set({ labelColor: v })} />
          <SelectRow label="Font Size" value={s.labelSize} onChange={v => set({ labelSize: v })} options={fontSizes} />
          <SelectRow label="Font Weight" value={s.labelWeight} onChange={v => set({ labelWeight: v })} options={fontWeights} />
        </Collapsible>
      )}

      {isInput && (
        <Collapsible title="Input">
          <ColorRow label="Background" value={s.inputBg} onChange={v => set({ inputBg: v })} />
          <ColorRow label="Text Color" value={s.inputColor} onChange={v => set({ inputColor: v })} />
          <ColorRow label="Border Color" value={s.inputBorder} onChange={v => set({ inputBorder: v })} />
          <div className="mb-3">
            <label className="block text-xs font-medium text-[#64748b] mb-1.5">Border Radius</label>
            <select className="fe-input text-xs" value={s.inputRadius || ''} onChange={e => set({ inputRadius: e.target.value })}>
              <option value="">Default</option>
              {radii.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
            </select>
          </div>
          <SelectRow label="Font Size" value={s.inputSize} onChange={v => set({ inputSize: v })} options={fontSizes} />
        </Collapsible>
      )}

      <button
        onClick={() => updateField(field.id, { style: {} }, sectionId ?? undefined)}
        className="w-full py-1.5 text-xs text-[#94a3b8] hover:text-red-500 transition-colors border border-dashed border-[#e2e8f0] hover:border-red-200 rounded-lg mt-2"
      >
        Reset all styles
      </button>
    </div>
  )
}

// ── Options editor ────────────────────────────────────────────────────────────
function OptionsEditor({ field, sectionId }: { field: FormField; sectionId?: string | null }) {
  const { updateField } = useBuilderStore()
  const options = field.options || []
  const sid = sectionId ?? undefined

  const update = (idx: number, patch: Partial<FieldOption>) => {
    const next = options.map((o, i) => i === idx ? { ...o, ...patch } : o)
    updateField(field.id, { options: next }, sid)
  }
  const add = () => updateField(field.id, {
    options: [...options, { label: `Option ${options.length + 1}`, value: `option${options.length + 1}` }]
  }, sid)
  const remove = (idx: number) => updateField(field.id, { options: options.filter((_, i) => i !== idx) }, sid)

  return (
    <div>
      <div className="space-y-1.5 mb-2">
        {options.map((opt, i) => (
          <div key={i} className="flex items-center gap-1.5">
            <GripVertical size={12} className="text-[var(--border)] flex-shrink-0" />
            <input className="fe-input flex-1 text-xs" value={opt.label} placeholder="Label"
              onChange={e => update(i, { label: e.target.value, value: e.target.value.toLowerCase().replace(/\s+/g, '_') })} />
            <button onClick={() => remove(i)} className="p-1 rounded hover:bg-red-50 dark:hover:bg-red-900/20 text-[var(--muted)] hover:text-red-400 transition-colors">
              <Trash2 size={12} />
            </button>
          </div>
        ))}
      </div>
      <button onClick={add}
        className="w-full py-1.5 border-2 border-dashed border-[var(--border)] rounded-lg text-xs text-[var(--muted)] hover:border-[var(--brand)] hover:text-[var(--brand)] transition-colors flex items-center justify-center gap-1">
        <Plus size={12} /> Add Option
      </button>
    </div>
  )
}

// ── Table editor ──────────────────────────────────────────────────────────────
const FALLBACK_COLS: TableColumn[] = [
  { id: 'c1', header: 'Column 1', align: 'left' },
  { id: 'c2', header: 'Column 2', align: 'left' },
  { id: 'c3', header: 'Column 3', align: 'left' },
]
const FALLBACK_ROWS: TableRow[] = [
  { id: 'r1', cells: { c1: 'Cell 1,1', c2: 'Cell 1,2', c3: 'Cell 1,3' } },
  { id: 'r2', cells: { c1: 'Cell 2,1', c2: 'Cell 2,2', c3: 'Cell 2,3' } },
]

function TableEditor({ field, sectionId }: { field: FormField; sectionId?: string | null }) {
  const { updateField } = useBuilderStore()
  const sid = sectionId ?? undefined

  // ── LOCAL STATE for columns so inputs are always fully controlled ──────────
  // We seed from field.tableColumns (or fallback), then sync to the store on
  // every change. This prevents the "empty input" problem caused by stale
  // store reads between keystrokes.
  const resolvedCols = field.tableColumns?.length ? field.tableColumns : FALLBACK_COLS
  const resolvedRows = field.tableRows?.length    ? field.tableRows    : FALLBACK_ROWS

  const [localCols, setLocalCols] = useState<TableColumn[]>(resolvedCols)
  const [localRows, setLocalRows] = useState<TableRow[]>(resolvedRows)

  // Keep local state in sync when a different table field is selected
  useEffect(() => {
    setLocalCols(field.tableColumns?.length ? field.tableColumns : FALLBACK_COLS)
    setLocalRows(field.tableRows?.length    ? field.tableRows    : FALLBACK_ROWS)
  }, [field.id]) // eslint-disable-line react-hooks/exhaustive-deps

  // Persist both cols and rows to the store together
  const persist = (cols: TableColumn[], rows: TableRow[]) => {
    updateField(field.id, { tableColumns: cols, tableRows: rows }, sid)
  }

  // ── Column header change: update local state immediately (keeps input
  //    responsive) then persist to store ────────────────────────────────────
  const updateColHeader = (idx: number, header: string) => {
    const next = localCols.map((c, i) => i === idx ? { ...c, header } : c)
    setLocalCols(next)
    persist(next, localRows)
  }

  const updateColProp = (idx: number, patch: Partial<TableColumn>) => {
    const next = localCols.map((c, i) => i === idx ? { ...c, ...patch } : c)
    setLocalCols(next)
    persist(next, localRows)
  }

  const addCol = () => {
    const newId  = `c${Date.now()}`
    const newCol: TableColumn = { id: newId, header: `Column ${localCols.length + 1}`, align: 'left' }
    const newRows = localRows.map(r => ({ ...r, cells: { ...r.cells, [newId]: '' } }))
    setLocalCols([...localCols, newCol])
    setLocalRows(newRows)
    persist([...localCols, newCol], newRows)
  }

  const removeCol = (idx: number) => {
    if (localCols.length <= 1) return
    const cid     = localCols[idx].id
    const newCols = localCols.filter((_, i) => i !== idx)
    const newRows = localRows.map(r => {
      const cells = { ...r.cells }
      delete cells[cid]
      return { ...r, cells }
    })
    setLocalCols(newCols)
    setLocalRows(newRows)
    persist(newCols, newRows)
  }

  const addRow = () => {
    const newRow: TableRow = {
      id: `r${Date.now()}`,
      cells: Object.fromEntries(localCols.map(c => [c.id, ''])),
    }
    const newRows = [...localRows, newRow]
    setLocalRows(newRows)
    persist(localCols, newRows)
  }

  const updateCell = (rowIdx: number, colId: string, value: string) => {
    const newRows = localRows.map((r, i) =>
      i === rowIdx ? { ...r, cells: { ...r.cells, [colId]: value } } : r
    )
    setLocalRows(newRows)
    persist(localCols, newRows)
  }

  const removeRow = (idx: number) => {
    if (localRows.length <= 1) return
    const newRows = localRows.filter((_, i) => i !== idx)
    setLocalRows(newRows)
    persist(localCols, newRows)
  }

  return (
    <div className="space-y-4">
      {/* Display options */}
      <div>
        <SectionTitle>Display Options</SectionTitle>
        <div className="flex flex-wrap gap-3">
          {([
            { key: 'tableStriped',  label: 'Striped rows',    defaultVal: true  },
            { key: 'tableBordered', label: 'Bordered',        defaultVal: true  },
            { key: 'tableCompact',  label: 'Compact spacing', defaultVal: false },
          ] as { key: keyof FormField; label: string; defaultVal: boolean }[]).map(({ key, label, defaultVal }) => {
            const checked = (field[key] as boolean) ?? defaultVal
            return (
              <label key={key} className="flex items-center gap-2 cursor-pointer select-none group">
                <button
                  type="button"
                  onClick={() => updateField(field.id, { [key]: !checked }, sid)}
                  className={`rounded-full relative transition-colors flex-shrink-0 ${checked ? 'bg-[#6366f1]' : 'bg-[#cbd5e1]'}`}
                  style={{ width: 32, height: 18 }}
                >
                  <span
                    className={`absolute top-0.5 w-3.5 h-3.5 rounded-full bg-white shadow transition-all ${checked ? 'left-[14px]' : 'left-0.5'}`}
                  />
                </button>
                <span className="text-xs text-[var(--text)]">{label}</span>
              </label>
            )
          })}
        </div>
      </div>

      <Row label="Caption (optional)">
        <input
          className="fe-input text-xs"
          value={field.tableCaption || ''}
          placeholder="Add a table caption..."
          onChange={e => updateField(field.id, { tableCaption: e.target.value }, sid)}
        />
      </Row>

      {/* Columns */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <SectionTitle>Columns ({localCols.length})</SectionTitle>
          <button
            onClick={addCol}
            className="flex items-center gap-1 text-[10px] font-semibold text-[var(--brand)] hover:opacity-70 transition-opacity px-2 py-1 rounded-md bg-[#eef2ff]"
          >
            <Plus size={10} /> Add Column
          </button>
        </div>
        <div className="space-y-1.5">
          {localCols.map((col, i) => (
            <div key={col.id} className="flex items-center gap-1.5">
              <GripVertical size={12} className="text-[var(--border)] flex-shrink-0" />
              {/* Controlled by localCols — always shows what was typed */}
              <input
                className="fe-input flex-1 text-xs min-w-0"
                value={col.header}
                placeholder={`Column ${i + 1}`}
                onChange={e => updateColHeader(i, e.target.value)}
              />
              <select
                className="fe-input w-14 text-xs flex-shrink-0"
                value={col.align || 'left'}
                onChange={e => updateColProp(i, { align: e.target.value as 'left' | 'center' | 'right' })}
                title="Text alignment"
              >
                <option value="left">⬅ L</option>
                <option value="center">↔ C</option>
                <option value="right">➡ R</option>
              </select>
              <input
                className="fe-input w-16 text-xs flex-shrink-0"
                value={col.width || ''}
                placeholder="width"
                title="Column width (e.g. 120px, 20%)"
                onChange={e => updateColProp(i, { width: e.target.value })}
              />
              <button
                onClick={() => removeCol(i)}
                disabled={localCols.length <= 1}
                className="p-1 rounded hover:bg-red-50 dark:hover:bg-red-900/20 text-[var(--muted)] hover:text-red-400 transition-colors disabled:opacity-30 disabled:cursor-not-allowed flex-shrink-0"
              >
                <Trash2 size={12} />
              </button>
            </div>
          ))}
        </div>
        <p className="text-[10px] text-[var(--muted)] mt-1.5 opacity-70">Width: e.g. 100px, 20%, auto</p>
      </div>

      {/* Rows */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <SectionTitle>Rows ({localRows.length})</SectionTitle>
          <button
            onClick={addRow}
            className="flex items-center gap-1 text-[10px] font-semibold text-[var(--brand)] hover:opacity-70 transition-opacity px-2 py-1 rounded-md bg-[#eef2ff]"
          >
            <Plus size={10} /> Add Row
          </button>
        </div>
        <div className="space-y-2">
          {localRows.map((row, ri) => (
            <div key={row.id} className="border border-[var(--border)] rounded-lg overflow-hidden">
              <div className="flex items-center justify-between px-2.5 py-1.5 bg-[var(--surface-2)] border-b border-[var(--border)]">
                <span className="text-[10px] font-bold text-[var(--muted)] uppercase tracking-wider">Row {ri + 1}</span>
                <button
                  onClick={() => removeRow(ri)}
                  disabled={localRows.length <= 1}
                  className="p-0.5 rounded hover:bg-red-50 text-[var(--muted)] hover:text-red-400 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <Trash2 size={11} />
                </button>
              </div>
              <div className="px-2.5 py-2 space-y-1.5">
                {localCols.map(col => (
                  <div key={col.id} className="flex items-center gap-2">
                    {/* Label uses live localCols header so it updates as you rename */}
                    <span
                      className="text-[10px] text-[var(--muted)] flex-shrink-0 truncate font-medium"
                      style={{ width: 64, minWidth: 64 }}
                      title={col.header}
                    >
                      {col.header}
                    </span>
                    <input
                      className="fe-input flex-1 text-xs"
                      value={row.cells[col.id] ?? ''}
                      placeholder="Cell value"
                      onChange={e => updateCell(ri, col.id, e.target.value)}
                    />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ── Field properties ──────────────────────────────────────────────────────────
function FieldProperties({ field, sectionId }: { field: FormField; sectionId?: string | null }) {
  const { updateField } = useBuilderStore()
  const [tab, setTab] = useState<'general' | 'validation'>('general')
  const sid = sectionId ?? undefined

  const set = (patch: Partial<FormField>) => updateField(field.id, patch, sid)
  const setVal = (patch: object) => set({ validation: { ...field.validation, ...patch } })

  const hasOptions = ['select', 'radio', 'button_group', 'radio_group'].includes(field.type)
  const isInput = !['heading', 'paragraph', 'divider', 'blockquote', 'code_block', 'ordered_list', 'unordered_list', 'caption', 'button', 'checkbox', 'toggle', 'rating', 'slider', 'color', 'file', 'table'].includes(field.type)
  const isLayout = ['heading', 'paragraph', 'divider', 'blockquote', 'code_block', 'ordered_list', 'unordered_list', 'caption', 'button', 'table'].includes(field.type)

  return (
    <div>
      {!isLayout && (
        <div className="flex gap-1 mb-4 bg-[#f1f5f9] p-1 rounded-lg">
          {(['general', 'validation'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`flex-1 py-1.5 rounded-md text-xs font-medium transition-all capitalize ${tab === t ? 'bg-white text-[#0f172a] shadow-sm' : 'text-[#64748b] hover:text-[#374151]'}`}>
              {t}
            </button>
          ))}
        </div>
      )}

      {tab === 'general' && (
        <div>
          {field.type === 'table' && (
            <>
              <Row label="Table Label (optional)">
                <Input value={field.label} onChange={(v: string) => set({ label: v })} placeholder="Table title" />
              </Row>
              <div className="mb-4">
                <div className="flex items-center gap-2 mb-3 py-2 px-3 bg-[#eef2ff] rounded-lg border border-[#c7d2fe]">
                  <Table size={13} className="text-[#6366f1] flex-shrink-0" />
                  <span className="text-xs font-semibold text-[#4f46e5]">Table Editor</span>
                </div>
                <TableEditor field={field} sectionId={sectionId} />
              </div>
            </>
          )}

          {field.type === 'heading' && (
            <>
              <Row label="Content"><Input value={field.content} onChange={(v: string) => set({ content: v })} placeholder="Heading text" /></Row>
              <Row label="Level">
                <div className="grid grid-cols-6 gap-1">
                  {[1, 2, 3, 4, 5, 6].map(l => (
                    <button key={l} onClick={() => set({ level: l as any })}
                      className={`py-1.5 rounded-lg text-xs font-bold border transition-all ${(field.level || 1) === l
                        ? 'border-[#6366f1] bg-[#eef2ff] text-[#6366f1]'
                        : 'border-[#e2e8f0] text-[#94a3b8] hover:border-[#a5b4fc]'
                      }`}>H{l}</button>
                  ))}
                </div>
              </Row>
            </>
          )}
          {field.type === 'paragraph' && (
            <Row label="Content">
              <textarea className="fe-input resize-none" rows={4} value={field.content || ''}
                onChange={e => set({ content: e.target.value })} placeholder="Paragraph text..." />
            </Row>
          )}
          {field.type === 'blockquote' && (
            <Row label="Quote Text">
              <textarea className="fe-input resize-none" rows={3} value={field.content || ''}
                onChange={e => set({ content: e.target.value })} placeholder="Enter quote text..." />
            </Row>
          )}
          {field.type === 'code_block' && (
            <Row label="Code">
              <textarea className="fe-input resize-none font-mono text-xs" rows={5} value={field.content || ''}
                onChange={e => set({ content: e.target.value })} placeholder={'// Your code here\nconst hello = "world"'} />
            </Row>
          )}
          {(field.type === 'ordered_list' || field.type === 'unordered_list') && (
            <>
              <Row label="Title (optional)"><Input value={field.label} onChange={(v: string) => set({ label: v })} placeholder="List title" /></Row>
              <Row label="Items (one per line)">
                <textarea className="fe-input resize-none" rows={4} value={field.content || ''}
                  onChange={e => set({ content: e.target.value })} placeholder={"First item\nSecond item\nThird item"} />
              </Row>
            </>
          )}
          {field.type === 'divider' && (
            <Row label="Label (optional)"><Input value={field.label} onChange={(v: string) => set({ label: v })} placeholder="Section divider text" /></Row>
          )}
          {field.type === 'caption' && (
            <Row label="Caption Text">
              <textarea className="fe-input resize-none" rows={2} value={field.content || ''}
                onChange={e => set({ content: e.target.value })} placeholder="Add a caption or note..." />
            </Row>
          )}
          {field.type === 'button' && (
            <>
              <Row label="Button Label">
                <Input value={field.content} onChange={(v: string) => set({ content: v })} placeholder="Submit" />
              </Row>
              <Row label="Variant">
                <div className="grid grid-cols-2 gap-1.5">
                  {([
                    { key: 'primary',   label: 'Primary',   cls: 'bg-[#6366f1] text-white' },
                    { key: 'secondary', label: 'Secondary', cls: 'bg-[#f1f5f9] text-[#374151] border border-[#e2e8f0]' },
                    { key: 'outline',   label: 'Outline',   cls: 'border border-[#6366f1] text-[#6366f1]' },
                    { key: 'danger',    label: 'Danger',    cls: 'bg-red-500 text-white' },
                  ] as const).map(({ key, label, cls }) => (
                    <button key={key} onClick={() => set({ buttonVariant: key })}
                      className={`py-1.5 px-2 rounded-lg text-xs font-medium transition-all ring-2 ${(field.buttonVariant || 'primary') === key ? 'ring-[#6366f1] ring-offset-1' : 'ring-transparent'} ${cls}`}>
                      {label}
                    </button>
                  ))}
                </div>
              </Row>
              <Row label="Action">
                <select className="fe-input text-xs" value={field.buttonAction || 'submit'} onChange={e => set({ buttonAction: e.target.value as any })}>
                  <option value="submit">Submit Form</option>
                  <option value="reset">Reset Form</option>
                  <option value="url">Open URL</option>
                </select>
              </Row>
              {field.buttonAction === 'url' && (
                <Row label="URL">
                  <Input value={field.buttonUrl} onChange={(v: string) => set({ buttonUrl: v })} placeholder="https://..." />
                </Row>
              )}
              <Row label="Alignment">
                <div className="flex gap-1.5">
                  {([
                    { key: 'left',   icon: '⇤', title: 'Left'   },
                    { key: 'center', icon: '↔', title: 'Center' },
                    { key: 'right',  icon: '⇥', title: 'Right'  },
                  ] as const).map(({ key, icon, title }) => (
                    <button key={key} onClick={() => set({ buttonAlign: key })} title={title}
                      className={`flex-1 py-2 rounded-lg text-sm border transition-all ${(field.buttonAlign || 'left') === key
                        ? 'border-[#6366f1] bg-[#eef2ff] text-[#6366f1] font-bold'
                        : 'border-[#e2e8f0] text-[#94a3b8] hover:border-[#a5b4fc]'
                      }`}>
                      {icon}
                    </button>
                  ))}
                </div>
              </Row>
            </>
          )}

          {!isLayout && (
            <>
              <Row label="Label"><Input value={field.label} onChange={(v: string) => set({ label: v })} placeholder="Field label" /></Row>
              {isInput && <Row label="Placeholder"><Input value={field.placeholder} onChange={(v: string) => set({ placeholder: v })} placeholder="Placeholder text" /></Row>}
              <Row label="Help Text"><Input value={field.helpText} onChange={(v: string) => set({ helpText: v })} placeholder="Optional help text" /></Row>
              {field.type === 'textarea' && <Row label="Rows"><Input type="number" value={field.rows} onChange={(v: string) => set({ rows: Number(v) })} placeholder="4" /></Row>}
              {field.type === 'rating' && <Row label="Max Stars"><Input type="number" value={field.maxRating} onChange={(v: string) => set({ maxRating: Number(v) })} placeholder="5" /></Row>}
              {field.type === 'slider' && (<>
                <Row label="Min"><Input type="number" value={field.min} onChange={(v: string) => set({ min: Number(v) })} /></Row>
                <Row label="Max"><Input type="number" value={field.max} onChange={(v: string) => set({ max: Number(v) })} /></Row>
                <Row label="Step"><Input type="number" value={field.step} onChange={(v: string) => set({ step: Number(v) })} /></Row>
              </>)}
              {hasOptions && (
                <div className="mb-3">
                  <SectionTitle>Options</SectionTitle>
                  <OptionsEditor field={field} sectionId={sectionId} />
                </div>
              )}

              <div className="mb-3">
                <label className="block text-xs font-medium text-[#64748b] mb-2">Column Width</label>
                <div className="grid grid-cols-4 gap-1">
                  {([
                    { key: 'col1', label: '100%' },
                    { key: 'col2', label: '50%'  },
                    { key: 'col3', label: '33%'  },
                    { key: 'col4', label: '25%'  },
                  ] as const).map(({ key, label }) => (
                    <button key={key} onClick={() => set({ width: key })} title={label}
                      className={`flex flex-col items-center gap-1 py-2 px-1 rounded-lg border transition-all ${(field.width || 'col1') === key
                        ? 'border-[#6366f1] bg-[#eef2ff] text-[#6366f1]'
                        : 'border-[#e2e8f0] text-[#94a3b8] hover:border-[#a5b4fc] hover:text-[#6366f1]'
                      }`}>
                      <div className="flex gap-0.5 w-full justify-center">
                        {Array.from({ length: 4 }).map((_, i) => (
                          <div key={i} className={`h-3 rounded-sm flex-1 transition-colors ${(field.width || 'col1') === key ? 'bg-[#6366f1]' : 'bg-[#cbd5e1]'
                            } ${(key === 'col2' && i >= 2) || (key === 'col3' && i >= 3) ? 'opacity-20' : ''}`} />
                        ))}
                      </div>
                      <span className="text-[10px] font-semibold leading-none">{label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {tab === 'validation' && !isLayout && (
        <div>
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-medium text-[#64748b]">Required</label>
              <Toggle checked={!!field.validation?.required} onChange={v => setVal({ required: v })} />
            </div>
            {field.validation?.required && (
              <Input value={field.validation?.message} onChange={(v: string) => setVal({ message: v })} placeholder="Error message (optional)" />
            )}
          </div>
          {isInput && field.type !== 'number' && (<>
            <Row label="Min Length"><Input type="number" value={field.validation?.minLength} onChange={(v: string) => setVal({ minLength: Number(v) })} placeholder="0" /></Row>
            <Row label="Max Length"><Input type="number" value={field.validation?.maxLength} onChange={(v: string) => setVal({ maxLength: Number(v) })} placeholder="255" /></Row>
            <Row label="Pattern (regex)"><Input value={field.validation?.pattern} onChange={(v: string) => setVal({ pattern: v })} placeholder="e.g. ^[A-Z]" /></Row>
          </>)}
          {field.type === 'number' && (<>
            <Row label="Min Value"><Input type="number" value={field.validation?.min} onChange={(v: string) => setVal({ min: Number(v) })} /></Row>
            <Row label="Max Value"><Input type="number" value={field.validation?.max} onChange={(v: string) => setVal({ max: Number(v) })} /></Row>
          </>)}
        </div>
      )}
    </div>
  )
}

// ── Form settings panel ───────────────────────────────────────────────────────
function FormSettingsPanel() {
  const { settings, setSettings, formName, formDescription, setFormMeta, sections, updateSection } = useBuilderStore()
  return (
    <div>
      <Row label="Form Name">
        <input className="fe-input" value={formName} onChange={e => setFormMeta(e.target.value, formDescription)} />
      </Row>
      <Row label="Description">
        <textarea className="fe-input resize-none" rows={2} value={formDescription} onChange={e => setFormMeta(formName, e.target.value)} />
      </Row>

      <div className="mt-4 pt-4 border-t border-[#f1f5f9]">
        <SectionTitle>Stepper / Steps</SectionTitle>
        <div className="flex items-center justify-between py-2">
          <span className="text-xs text-[var(--text)]">Enable step-by-step mode</span>
          <button
            type="button"
            onClick={() => setSettings({ stepperMode: !settings.stepperMode })}
            className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none ${settings.stepperMode ? 'bg-[var(--brand,#6366f1)]' : 'bg-[#cbd5e1]'}`}
          >
            <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${settings.stepperMode ? 'translate-x-4' : 'translate-x-1'}`} />
          </button>
        </div>

        {settings.stepperMode && (
          <div className="mt-2 space-y-2">
            {sections.length === 0 ? (
              <p className="text-xs text-[var(--muted)] italic">No sections yet. Add sections — each becomes a step.</p>
            ) : (
              sections.map((sec, idx) => (
                <div key={sec.id} className="flex items-center gap-2">
                  <span className="text-[10px] font-bold text-[var(--brand)] w-5 shrink-0">{idx + 1}.</span>
                  <input
                    className="fe-input flex-1 text-xs"
                    placeholder={`Step ${idx + 1} label…`}
                    value={sec.title}
                    onChange={e => updateSection(sec.id, { title: e.target.value })}
                  />
                </div>
              ))
            )}
            <p className="text-[10px] text-[var(--muted)] mt-1">Each section = one step. Rename sections above to set step labels.</p>
          </div>
        )}
      </div>

      <div className="mt-4 pt-4 border-t border-[#f1f5f9]">
        <SectionTitle>Submit Settings</SectionTitle>
        <Row label="Button Label">
          <input className="fe-input" value={settings.submitLabel || ''} onChange={e => setSettings({ submitLabel: e.target.value })} />
        </Row>
        <Row label="Success Message">
          <textarea className="fe-input resize-none" rows={2} value={settings.successMessage || ''} onChange={e => setSettings({ successMessage: e.target.value })} />
        </Row>
        <Row label="Redirect URL (optional)">
          <input className="fe-input" value={settings.redirectUrl || ''} placeholder="https://..." onChange={e => setSettings({ redirectUrl: e.target.value })} />
        </Row>
      </div>
    </div>
  )
}

// ── Right panel root ──────────────────────────────────────────────────────────
type PanelTab = 'properties' | 'style' | 'settings'

export default function PropertiesPanel() {
  const {
    fields, sections,
    selectedId, selectedSectionId, selectedFieldSectionId,
    selectField, selectSection, updateSection,
  } = useBuilderStore()

  const [panelTab, setPanelTab] = useState<PanelTab>('properties')

  const findField = (id: string | null): FormField | undefined => {
    if (!id) return undefined
    const inTop = findFieldDeep(fields, id)
    if (inTop) return inTop
    for (const sec of sections) {
      const inSec = findFieldDeep(sec.fields, id)
      if (inSec) return inSec
    }
    return undefined
  }

  const field = findField(selectedId)
  const selectedSection = sections.find(s => s.id === selectedSectionId)

  const handleSelectTab = (t: PanelTab) => {
    if (t !== 'settings') selectField(selectedId, selectedFieldSectionId)
    setPanelTab(t)
  }

  return (
    <div className="h-full flex flex-col">
      <div className="px-3 pt-3 pb-0 border-b border-[var(--border)]">
        <div className="flex gap-0.5">
          <button onClick={() => handleSelectTab('properties')}
            className={`flex-1 py-2 text-xs font-medium rounded-t-md transition-all border-b-2 ${panelTab === 'properties' ? 'text-[var(--brand)] border-[var(--brand)]' : 'text-[var(--muted)] border-transparent hover:text-[var(--text)]'}`}>
            Properties
          </button>
          <button onClick={() => handleSelectTab('style')}
            className={`flex-1 py-2 text-xs font-medium rounded-t-md transition-all border-b-2 flex items-center justify-center gap-1 ${panelTab === 'style' ? 'text-[var(--brand)] border-[var(--brand)]' : 'text-[var(--muted)] border-transparent hover:text-[var(--text)]'}`}>
            <Palette size={11} /> Style
          </button>
          <button onClick={() => { handleSelectTab('settings'); selectField(null) }}
            className={`flex-1 py-2 text-xs font-medium rounded-t-md transition-all border-b-2 flex items-center justify-center gap-1 ${panelTab === 'settings' ? 'text-[var(--brand)] border-[var(--brand)]' : 'text-[var(--muted)] border-transparent hover:text-[var(--text)]'}`}>
            <Settings size={11} /> Form
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4">
        {panelTab === 'settings' && <FormSettingsPanel />}

        {panelTab === 'properties' && (
          selectedSection ? (
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-semibold text-[var(--text)] uppercase tracking-wide">Section</span>
                <button onClick={() => selectSection(null)} className="text-[var(--muted)] hover:text-[var(--text)] text-xs">✕</button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-[var(--muted)] mb-1.5">Section Title</label>
                  <input
                    className="fe-input text-sm"
                    value={selectedSection.title}
                    onChange={e => updateSection(selectedSection.id, { title: e.target.value })}
                    placeholder="Section title"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[var(--muted)] mb-1.5">
                    Description <span className="font-normal opacity-60">(optional)</span>
                  </label>
                  <textarea
                    className="fe-input text-sm resize-none"
                    rows={3}
                    value={selectedSection.description || ''}
                    onChange={e => updateSection(selectedSection.id, { description: e.target.value })}
                    placeholder="Add a description for this section..."
                  />
                </div>
                <div className="pt-2 border-t border-[var(--border)]">
                  <p className="text-xs text-[var(--muted)]">
                    <span className="font-medium">{selectedSection.fields.length}</span> field{selectedSection.fields.length !== 1 ? 's' : ''} in this section.
                  </p>
                  <p className="text-[10px] text-[var(--muted)] mt-1 opacity-70">
                    Drag fields from the palette onto this section, or use the canvas to rearrange.
                  </p>
                </div>
              </div>
            </div>
          ) : field ? (
            <>
              {field && !fields.find(f => f.id === field.id) && !sections.flatMap(s => s.fields).find(f => f.id === field.id) && (
                <div className="flex items-center gap-1.5 mb-3 px-2.5 py-1.5 bg-[#eef2ff] rounded-lg border border-[var(--brand)]/20">
                  <span className="text-[10px] text-[var(--brand)] font-medium">Inside Box</span>
                  <span className="text-[10px] text-[var(--muted)]">→ {field.label || field.type}</span>
                </div>
              )}
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-semibold text-[var(--text)] uppercase tracking-wide">
                  {field.type} Field
                </span>
                <button onClick={() => selectField(null)} className="text-[var(--muted)] hover:text-[var(--text)] text-xs">✕</button>
              </div>
              <FieldProperties field={field} sectionId={selectedFieldSectionId} />
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center py-10">
              <div className="w-10 h-10 rounded-xl bg-[var(--surface-2)] flex items-center justify-center mb-3">
                <CheckSquare size={18} className="text-[var(--muted)]" />
              </div>
              <p className="text-sm text-[var(--muted)]">Select a field or section to edit its properties</p>
            </div>
          )
        )}

        {panelTab === 'style' && (
          field ? (
            <>
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-semibold text-[var(--text)] uppercase tracking-wide">
                  Style — {field.label || field.type}
                </span>
                <button onClick={() => selectField(null)} className="text-[var(--muted)] hover:text-[var(--text)] text-xs">✕</button>
              </div>
              <StylePanel field={field} sectionId={selectedFieldSectionId} />
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center py-10">
              <div className="w-10 h-10 rounded-xl bg-[var(--surface-2)] flex items-center justify-center mb-3">
                <Palette size={18} className="text-[var(--muted)]" />
              </div>
              <p className="text-sm text-[var(--muted)]">Select a field to style it</p>
            </div>
          )
        )}
      </div>
    </div>
  )
}