import React from 'react'
import { FormField, FieldStyle, TableColumn, TableRow } from '@/types'
import { getFieldMeta } from '@/lib/fieldRegistry'
import { Trash2 } from 'lucide-react'
import { useBuilderStore } from '@/store/builderStore'

interface Props { field: FormField; sectionId?: string }

function buildWrapperStyle(s?: FieldStyle): React.CSSProperties {
  if (!s) return {}
  return {
    marginTop:    s.marginTop    || undefined,
    marginRight:  s.marginRight  || undefined,
    marginBottom: s.marginBottom || undefined,
    marginLeft:   s.marginLeft   || undefined,
    paddingTop:   s.paddingTop   || undefined,
    paddingRight: s.paddingRight || undefined,
    paddingBottom:s.paddingBottom|| undefined,
    paddingLeft:  s.paddingLeft  || undefined,
    backgroundColor: s.wrapperBg || undefined,
    borderRadius: s.wrapperRadius|| undefined,
    border:       s.wrapperBorder? `1px solid ${s.wrapperBorder}` : undefined,
  }
}

function buildLabelStyle(s?: FieldStyle): React.CSSProperties {
  if (!s) return {}
  return {
    color:      s.labelColor  || undefined,
    fontSize:   s.labelSize   || undefined,
    fontWeight: s.labelWeight || undefined,
  }
}

function buildInputStyle(s?: FieldStyle): React.CSSProperties {
  if (!s) return {}
  return {
    backgroundColor: s.inputBg     || undefined,
    color:           s.inputColor  || undefined,
    borderColor:     s.inputBorder || undefined,
    borderRadius:    s.inputRadius || undefined,
    fontSize:        s.inputSize   || undefined,
  }
}

function Label({ field }: Props) {
  return (
    <label className="block text-sm font-medium text-[#374151] mb-1.5" style={buildLabelStyle(field.style)}>
      {field.label || 'Label'}
      {field.validation?.required && <span className="text-red-500 ml-0.5">*</span>}
    </label>
  )
}

const inputBase = "w-full px-3 py-2 border border-[#d1d5db] rounded-lg text-sm text-[#374151] bg-[#f9fafb] placeholder-[#9ca3af] focus:outline-none"

const DEFAULT_TABLE_COLS: TableColumn[] = [
  { id: 'c1', header: '', align: 'left' },
  { id: 'c2', header: '', align: 'left' },
  { id: 'c3', header: '', align: 'left' },
]

const DEFAULT_TABLE_ROWS: TableRow[] = [
  { id: 'r1', cells: { c1: 'Cell 1,1', c2: 'Cell 1,2', c3: 'Cell 1,3' } },
  { id: 'r2', cells: { c1: 'Cell 2,1', c2: 'Cell 2,2', c3: 'Cell 2,3' } },
  { id: 'r3', cells: { c1: 'Cell 3,1', c2: 'Cell 3,2', c3: 'Cell 3,3' } },
]

export default function FieldPreview({ field, sectionId }: Props) {
  const { updateField } = useBuilderStore()
  const s = field.style
  const inputStyle = buildInputStyle(s)
  const wrapStyle  = buildWrapperStyle(s)

  const deleteColumn = (colId: string) => {
    const cols = field.tableColumns ?? DEFAULT_TABLE_COLS
    if (cols.length <= 1) return
    const newCols = cols.filter(c => c.id !== colId)
    const newRows = (field.tableRows ?? DEFAULT_TABLE_ROWS).map(r => {
      const { [colId]: _, ...rest } = r.cells
      return { ...r, cells: rest }
    })
    updateField(field.id, { tableColumns: newCols, tableRows: newRows }, sectionId)
  }

  switch (field.type) {

    // ── INPUTS ──────────────────────────────────────────────────────────────

    case 'button': {
      const variantStyles: Record<string, string> = {
        primary:   'bg-[#6366f1] text-white border-transparent',
        secondary: 'bg-[#f1f5f9] text-[#374151] border-[#e2e8f0]',
        outline:   'bg-transparent text-[#6366f1] border-[#6366f1]',
        danger:    'bg-red-500 text-white border-transparent',
      }
      const v = field.buttonVariant || 'primary'
      const alignClass = field.buttonAlign === 'center' ? 'justify-center' : field.buttonAlign === 'right' ? 'justify-end' : 'justify-start'
      return (
        <div style={wrapStyle} className={`flex ${alignClass} w-full`}>
          <button type="button" disabled
            className={`px-5 py-2.5 rounded-lg text-sm font-medium border cursor-default ${variantStyles[v]}`}
            style={inputStyle}>
            {field.content || 'Button'}
          </button>
        </div>
      )
    }

    case 'button_group': {
      const opts = field.options?.length
        ? field.options
        : [{ label: 'Primary', value: 'primary' }, { label: 'Secondary', value: 'secondary' }, { label: 'Outline', value: 'outline' }]
      const variantStyles: Record<string, string> = {
        primary:   'bg-[#6366f1] text-white',
        secondary: 'bg-[#f1f5f9] text-[#374151] border border-[#e2e8f0]',
        outline:   'bg-transparent text-[#6366f1] border border-[#6366f1]',
        danger:    'bg-red-500 text-white',
      }
      const fallbackStyles = [
        'bg-[#6366f1] text-white',
        'bg-[#f1f5f9] text-[#374151] border border-[#e2e8f0]',
        'bg-transparent text-[#6366f1] border border-[#6366f1]',
        'bg-[#f1f5f9] text-[#374151] border border-[#e2e8f0]',
      ]
      return (
        <div style={wrapStyle} className="flex flex-col gap-2">
          <Label field={field} />
          <div className="flex flex-col gap-2">
            {opts.map((opt, i) => (
              <button
                key={opt.value}
                disabled
                className={`w-full px-3 py-2 rounded-lg text-sm font-medium cursor-default text-left ${opt.value in variantStyles ? variantStyles[opt.value] : fallbackStyles[i % fallbackStyles.length]}`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      )
    }

    case 'checkbox':
      return (
        <div className="flex items-center gap-2.5" style={wrapStyle}>
          <div className="w-4 h-4 rounded border-2 border-[#d1d5db] bg-[#f9fafb]" />
          <span className="text-sm text-[#374151]" style={buildLabelStyle(s)}>{field.label || 'Checkbox'}</span>
        </div>
      )

    case 'date_picker':
      return (
        <div style={wrapStyle}>
          <Label field={field} />
          <input readOnly className={inputBase} style={inputStyle} type="date" />
          {field.helpText && <p className="text-xs text-[#9ca3af] mt-1">{field.helpText}</p>}
        </div>
      )

    case 'radio_group':
      return (
        <div style={wrapStyle}>
          <Label field={field} />
          <div className="space-y-1.5">
            {(field.options?.length ? field.options : [{ label: 'Option 1', value: '1' }, { label: 'Option 2', value: '2' }]).map(o => (
              <div key={o.value} className="flex items-center gap-2.5">
                <div className="w-4 h-4 rounded-full border-2 border-[#d1d5db] bg-[#f9fafb]" />
                <span className="text-sm text-[#374151]">{o.label}</span>
              </div>
            ))}
          </div>
        </div>
      )

    case 'radio_item':
      return (
        <div className="flex items-center gap-2.5" style={wrapStyle}>
          <div className="w-4 h-4 rounded-full border-2 border-[#6366f1] bg-[#f9fafb] flex items-center justify-center">
            <div className="w-2 h-2 rounded-full bg-[#6366f1]" />
          </div>
          <span className="text-sm text-[#374151]" style={buildLabelStyle(s)}>{field.label || 'Radio item'}</span>
        </div>
      )

    case 'select':
      return (
        <div style={wrapStyle}>
          <Label field={field} />
          <select className={inputBase} style={inputStyle} disabled>
            <option>{field.placeholder || 'Select an option'}</option>
            {field.options?.map(o => <option key={o.value}>{o.label}</option>)}
          </select>
          {field.helpText && <p className="text-xs text-[#9ca3af] mt-1">{field.helpText}</p>}
        </div>
      )

    case 'switch':
      return (
        <div className="flex items-center gap-3" style={wrapStyle}>
          <div className="w-10 h-6 rounded-full bg-[#6366f1] relative flex items-center px-0.5 justify-end">
            <div className="w-5 h-5 rounded-full bg-white shadow-sm" />
          </div>
          <span className="text-sm text-[#374151]" style={buildLabelStyle(s)}>{field.label || 'Switch'}</span>
        </div>
      )

    case 'text_field':
      return (
        <div style={wrapStyle}>
          <Label field={field} />
          <input readOnly className={inputBase} style={inputStyle} type="text" placeholder={field.placeholder || 'Enter text...'} />
          {field.helpText && <p className="text-xs text-[#9ca3af] mt-1">{field.helpText}</p>}
        </div>
      )

    case 'uploader':
      return (
        <div style={wrapStyle}>
          <Label field={field} />
          <div className="border-2 border-dashed border-[#d1d5db] rounded-lg p-4 text-center bg-[#f9fafb]">
            <p className="text-xs text-[#9ca3af]">Click to upload or drag and drop</p>
          </div>
          {field.helpText && <p className="text-xs text-[#9ca3af] mt-1">{field.helpText}</p>}
        </div>
      )

    // ── DATA DISPLAY ─────────────────────────────────────────────────────────

    case 'list':
      return (
        <div style={wrapStyle}>
          <Label field={field} />
          <ul className="space-y-1 text-sm text-[#374151] list-disc list-inside">
            <li>List item one</li>
            <li>List item two</li>
            <li>List item three</li>
          </ul>
        </div>
      )

    case 'list_item':
      return (
        <div className="flex items-center gap-2 text-sm text-[#374151]" style={wrapStyle}>
          <div className="w-1.5 h-1.5 rounded-full bg-[#6366f1]" />
          <span>{field.label || 'List item'}</span>
        </div>
      )

    case 'tooltip':
      return (
        <div className="inline-flex items-center gap-2" style={wrapStyle}>
          <span className="text-sm text-[#374151]">{field.label || 'Hover me'}</span>
          <div className="relative group cursor-default">
            <div className="w-4 h-4 rounded-full bg-[#6366f1] text-white text-[10px] flex items-center justify-center font-bold">?</div>
            <div className="absolute left-1/2 -translate-x-1/2 bottom-6 bg-[#1e293b] text-white text-xs px-2 py-1 rounded shadow-lg whitespace-nowrap pointer-events-none">
              {field.placeholder || 'Tooltip text'}
            </div>
          </div>
        </div>
      )

    case 'typography':
      return (
        <div style={wrapStyle}>
          <p className="text-sm text-[#374151] leading-relaxed">{field.content || field.label || 'Typography text'}</p>
        </div>
      )

    case 'table': {
      const cols: TableColumn[] = field.tableColumns?.length ? field.tableColumns : DEFAULT_TABLE_COLS
      const rows: TableRow[]    = field.tableRows?.length    ? field.tableRows    : DEFAULT_TABLE_ROWS
      const striped  = field.tableStriped  ?? true
      const bordered = field.tableBordered ?? true
      const compact  = field.tableCompact  ?? false

      return (
        <div style={wrapStyle} className="w-full overflow-x-auto">
          {field.label && (
            <p className="text-sm font-semibold text-[#374151] mb-2">{field.label}</p>
          )}
          <table
            className="w-full text-xs text-left"
            style={{ borderCollapse: 'collapse' }}
          >
            <thead>
              <tr className="bg-[#f3f4f6]">
                {cols.map(col => (
                  <th
                    key={col.id}
                    className={`relative group/col font-semibold text-[#374151] ${compact ? 'px-2 py-1.5' : 'px-3 py-2'}`}
                    style={{
                      textAlign: col.align || 'left',
                      width: col.width || undefined,
                      border: bordered ? '1px solid #e5e7eb' : undefined,
                    }}
                  >
                    {col.header || <span className="text-[#9ca3af] font-normal italic">Column</span>}
                    {cols.length > 1 && (
                      <button
                        type="button"
                        onClick={e => { e.stopPropagation(); deleteColumn(col.id) }}
                        className="absolute top-0.5 right-0.5 opacity-0 group-hover/col:opacity-100 transition-opacity p-0.5 rounded bg-red-50 hover:bg-red-100 text-red-400 hover:text-red-600"
                        title={`Delete column "${col.header || 'Column'}"`}
                      >
                        <Trash2 size={10} />
                      </button>
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, ri) => (
                <tr
                  key={row.id}
                  className={striped && ri % 2 === 1 ? 'bg-[#f9fafb]' : 'bg-white'}
                >
                  {cols.map(col => (
                    <td
                      key={col.id}
                      className={`text-[#374151] ${compact ? 'px-2 py-1' : 'px-3 py-2'}`}
                      style={{
                        textAlign: col.align || 'left',
                        border: bordered ? '1px solid #e5e7eb' : undefined,
                      }}
                    >
                      {row.cells[col.id] || ''}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
            {field.tableCaption && (
              <caption className="caption-bottom text-xs text-[#9ca3af] italic mt-1 py-1 text-left">
                {field.tableCaption}
              </caption>
            )}
          </table>
        </div>
      )
    }

    // ── FEEDBACK ──────────────────────────────────────────────────────────────

    case 'circular_progress':
      return (
        <div className="flex items-center gap-3" style={wrapStyle}>
          <svg width="48" height="48" viewBox="0 0 48 48">
            <circle cx="24" cy="24" r="20" fill="none" stroke="#e5e7eb" strokeWidth="4" />
            <circle cx="24" cy="24" r="20" fill="none" stroke="#6366f1" strokeWidth="4"
              strokeDasharray="125.6" strokeDashoffset="31.4" strokeLinecap="round"
              transform="rotate(-90 24 24)" />
            <text x="24" y="28" textAnchor="middle" className="text-xs" fill="#374151" fontSize="10">75%</text>
          </svg>
          <span className="text-sm text-[#374151]">{field.label || 'Circular progress'}</span>
        </div>
      )

    case 'linear_progress':
      return (
        <div style={wrapStyle}>
          <div className="flex justify-between mb-1">
            <span className="text-sm text-[#374151]">{field.label || 'Progress'}</span>
            <span className="text-xs text-[#9ca3af]">75%</span>
          </div>
          <div className="w-full h-2 bg-[#e5e7eb] rounded-full">
            <div className="h-2 bg-[#6366f1] rounded-full" style={{ width: '75%' }} />
          </div>
        </div>
      )

    // ── LAYOUT ────────────────────────────────────────────────────────────────

    case 'box':
      return (
        <div style={wrapStyle} className="border border-dashed border-[#d1d5db] rounded-lg p-4 bg-[#f9fafb] min-h-[60px]">
          {(field.children && field.children.length > 0) ? (
            <div className="flex flex-col gap-2">
              {field.children.map(child => {
                const childMeta = getFieldMeta(child.type)
                return (
                  <div key={child.id} className="flex items-center gap-2 px-2 py-1.5 rounded bg-white border border-[#e5e7eb]">
                    <span className="w-4 h-4 rounded flex items-center justify-center flex-shrink-0"
                      style={{ background: childMeta.color + '18', color: childMeta.color }}>
                      <childMeta.icon size={9} />
                    </span>
                    <span className="text-xs text-[#6b7280]">{child.label || childMeta.label}</span>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="flex items-center justify-center h-full min-h-[40px]">
              <span className="text-xs text-[#9ca3af]">{field.label || 'Box'}</span>
            </div>
          )}
        </div>
      )

    case 'container':
      return (
        <div style={wrapStyle} className="border border-dashed border-[#6366f1] rounded-lg p-4 bg-[#f5f3ff] min-h-[80px] flex items-center justify-center">
          <span className="text-xs text-[#6366f1]">{field.label || 'Container'}</span>
        </div>
      )

    case 'dialog_layout':
      return (
        <div style={wrapStyle} className="border border-[#d1d5db] rounded-lg shadow-sm bg-white overflow-hidden">
          <div className="px-4 py-2 border-b border-[#e5e7eb] bg-[#f9fafb] flex items-center justify-between">
            <span className="text-sm font-medium text-[#374151]">{field.label || 'Dialog'}</span>
            <span className="text-[#9ca3af] text-lg leading-none cursor-default">×</span>
          </div>
          <div className="px-4 py-3">
            <p className="text-xs text-[#9ca3af]">Dialog content area</p>
          </div>
          <div className="px-4 py-2 border-t border-[#e5e7eb] bg-[#f9fafb] flex justify-end gap-2">
            <button disabled className="px-3 py-1 text-xs border border-[#d1d5db] rounded cursor-default text-[#374151]">Cancel</button>
            <button disabled className="px-3 py-1 text-xs bg-[#6366f1] text-white rounded cursor-default">Confirm</button>
          </div>
        </div>
      )

    case 'stack':
      return (
        <div style={wrapStyle} className="space-y-2">
          <Label field={field} />
          {[1, 2, 3].map(i => (
            <div key={i} className="h-8 bg-[#e5e7eb] rounded-md flex items-center px-3">
              <span className="text-xs text-[#9ca3af]">Stack item {i}</span>
            </div>
          ))}
        </div>
      )

    // ── SURFACES ──────────────────────────────────────────────────────────────

    case 'card':
      return (
        <div style={wrapStyle} className="border border-[#e5e7eb] rounded-xl p-4 bg-white shadow-sm">
          <p className="text-sm font-medium text-[#374151] mb-1">{field.label || 'Card title'}</p>
          <p className="text-xs text-[#9ca3af]">{field.placeholder || 'Card content goes here.'}</p>
        </div>
      )

    // ── NAVIGATION ────────────────────────────────────────────────────────────

    case 'breadcrumbs':
      return (
        <div className="flex items-center gap-1 text-sm" style={wrapStyle}>
          <span className="text-[#6366f1] cursor-pointer">Home</span>
          <span className="text-[#9ca3af]">/</span>
          <span className="text-[#6366f1] cursor-pointer">Section</span>
          <span className="text-[#9ca3af]">/</span>
          <span className="text-[#374151]">{field.label || 'Current'}</span>
        </div>
      )

    case 'link':
      return (
        <div style={wrapStyle}>
          <a href="#" onClick={e => e.preventDefault()} className="text-sm text-[#6366f1] underline underline-offset-2">
            {field.label || field.placeholder || 'Click here'}
          </a>
        </div>
      )

    // ── FORM ──────────────────────────────────────────────────────────────────

    case 'form_control_label':
      return (
        <div className="flex items-center gap-2.5" style={wrapStyle}>
          <div className="w-4 h-4 rounded border-2 border-[#6366f1] bg-[#f9fafb] flex items-center justify-center">
            <div className="w-2 h-2 rounded-sm bg-[#6366f1]" />
          </div>
          <label className="text-sm text-[#374151]" style={buildLabelStyle(s)}>{field.label || 'Form control label'}</label>
        </div>
      )

    case 'form_label':
      return (
        <div style={wrapStyle}>
          <label className="block text-sm font-medium text-[#374151]" style={buildLabelStyle(s)}>
            {field.label || 'Form label'}
            {field.validation?.required && <span className="text-red-500 ml-0.5">*</span>}
          </label>
        </div>
      )

    // ── TEMPLATES ─────────────────────────────────────────────────────────────

    case 'embedded_form':
      return (
        <div style={wrapStyle} className="border border-dashed border-[#6366f1] rounded-lg p-4 bg-[#f5f3ff]">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-4 h-4 bg-[#6366f1] rounded-sm flex items-center justify-center">
              <span className="text-white text-[8px] font-bold">&lt;/&gt;</span>
            </div>
            <span className="text-xs font-medium text-[#6366f1]">{field.label || 'Embedded Form'}</span>
          </div>
          <div className="space-y-1.5">
            <div className="h-6 bg-[#e0d9fd] rounded" />
            <div className="h-6 bg-[#e0d9fd] rounded" />
            <div className="h-8 bg-[#6366f1] rounded flex items-center justify-center">
              <span className="text-white text-xs">Submit</span>
            </div>
          </div>
        </div>
      )

    case 'slot':
      return (
        <div style={wrapStyle} className="border-2 border-dashed border-[#9ca3af] rounded-lg p-4 min-h-[60px] flex items-center justify-center bg-[#f9fafb]">
          <span className="text-xs text-[#9ca3af]">{field.label || '{ Slot }'}</span>
        </div>
      )

    case 'test':
      return (
        <div style={wrapStyle} className="border border-[#f59e0b] rounded-lg p-3 bg-[#fffbeb]">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-[#f59e0b]" />
            <span className="text-xs font-medium text-[#92400e]">{field.label || 'Test component'}</span>
          </div>
        </div>
      )

    // ── STRUCTURE ─────────────────────────────────────────────────────────────

    case 'repeater':
      return (
        <div style={wrapStyle}>
          <Label field={field} />
          <div className="space-y-2">
            {[1, 2].map(i => (
              <div key={i} className="flex items-center gap-2 p-2 border border-[#e5e7eb] rounded-lg bg-[#f9fafb]">
                <div className="flex-1 h-6 bg-[#e5e7eb] rounded" />
                <button disabled className="w-6 h-6 flex items-center justify-center text-[#9ca3af] text-sm cursor-default">×</button>
              </div>
            ))}
            <button disabled className="w-full py-1.5 border border-dashed border-[#d1d5db] rounded-lg text-xs text-[#9ca3af] cursor-default">
              + Add item
            </button>
          </div>
        </div>
      )

    // ── MODAL ─────────────────────────────────────────────────────────────────

    case 'modal':
      return (
        <div style={wrapStyle} className="border border-[#d1d5db] rounded-xl shadow-lg bg-white overflow-hidden">
          <div className="px-5 py-3 border-b border-[#e5e7eb] flex items-center justify-between">
            <span className="text-sm font-semibold text-[#0f172a]">{field.label || 'Modal Title'}</span>
            <span className="text-[#9ca3af] text-lg leading-none cursor-default">×</span>
          </div>
          <div className="px-5 py-4">
            <p className="text-sm text-[#64748b]">{field.placeholder || 'Modal body content goes here.'}</p>
          </div>
          <div className="px-5 py-3 border-t border-[#e5e7eb] bg-[#f9fafb] flex justify-end gap-2">
            <button disabled className="px-4 py-1.5 text-sm border border-[#d1d5db] rounded-lg cursor-default text-[#374151]">Cancel</button>
            <button disabled className="px-4 py-1.5 text-sm bg-[#6366f1] text-white rounded-lg cursor-default">Confirm</button>
          </div>
        </div>
      )

    // ── TYPOGRAPHY ────────────────────────────────────────────────────────────

    case 'heading': {
      const lvl = field.level || 1
      const sizeMap: Record<number, string> = {
        1: 'text-4xl font-extrabold tracking-tight',
        2: 'text-3xl font-bold tracking-tight',
        3: 'text-2xl font-semibold',
        4: 'text-xl font-semibold',
        5: 'text-lg font-medium',
        6: 'text-base font-medium text-[#64748b]',
      }
      const tagMap: Record<number, React.ElementType> = {
        1: 'h1', 2: 'h2', 3: 'h3', 4: 'h4', 5: 'h5', 6: 'h6',
      }
      const Tag = tagMap[lvl]
      return (
        <div style={wrapStyle}>
          <Tag className={`${sizeMap[lvl]} text-[#0f172a] leading-tight`} style={buildLabelStyle(s)}>
            {field.content || field.label || `Heading ${lvl}`}
          </Tag>
        </div>
      )
    }

    case 'paragraph':
      return (
        <div style={wrapStyle}>
          <p className="text-base text-[#374151] leading-relaxed" style={buildLabelStyle(s)}>
            {field.content || field.label || 'This is a paragraph. Click to edit and add your own text content here.'}
          </p>
        </div>
      )

    case 'blockquote':
      return (
        <div style={wrapStyle} className="border-l-4 border-[#6366f1] pl-4 py-1 bg-[#f5f3ff] rounded-r-lg">
          <p className="text-sm italic text-[#4b5563] leading-relaxed">
            {field.content || field.label || 'This is a blockquote. Add your quote text here.'}
          </p>
        </div>
      )

    case 'code_block':
      return (
        <div style={wrapStyle} className="rounded-lg overflow-hidden border border-[#e2e8f0]">
          <div className="flex items-center gap-1.5 px-3 py-2 bg-[#1e293b]">
            <span className="w-2.5 h-2.5 rounded-full bg-[#ff5f57]" />
            <span className="w-2.5 h-2.5 rounded-full bg-[#febc2e]" />
            <span className="w-2.5 h-2.5 rounded-full bg-[#28c840]" />
          </div>
          <pre className="px-4 py-3 text-sm font-mono text-[#e2e8f0] bg-[#0f172a] overflow-x-auto leading-relaxed whitespace-pre-wrap">
            <code>{field.content || field.label || `// Your code here\nconst hello = "world"\nconsole.log(hello)`}</code>
          </pre>
        </div>
      )

    case 'ordered_list':
      return (
        <div style={wrapStyle}>
          {field.label && <p className="text-sm font-medium text-[#374151] mb-1.5">{field.label}</p>}
          <ol className="list-decimal list-inside space-y-1 text-sm text-[#374151]" style={buildLabelStyle(s)}>
            {(field.content || 'First item\nSecond item\nThird item').split('\n').map((item, i) => (
              <li key={i} className="leading-relaxed">{item}</li>
            ))}
          </ol>
        </div>
      )

    case 'unordered_list':
      return (
        <div style={wrapStyle}>
          {field.label && <p className="text-sm font-medium text-[#374151] mb-1.5">{field.label}</p>}
          <ul className="list-disc list-inside space-y-1 text-sm text-[#374151]" style={buildLabelStyle(s)}>
            {(field.content || 'First item\nSecond item\nThird item').split('\n').map((item, i) => (
              <li key={i} className="leading-relaxed">{item}</li>
            ))}
          </ul>
        </div>
      )

    case 'divider':
      return (
        <div style={wrapStyle} className="py-2">
          {field.label ? (
            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-[#e5e7eb]" />
              <span className="text-xs text-[#9ca3af] font-medium">{field.label}</span>
              <div className="flex-1 h-px bg-[#e5e7eb]" />
            </div>
          ) : (
            <hr className="border-0 border-t border-[#e5e7eb]" />
          )}
        </div>
      )

    case 'caption':
      return (
        <div style={wrapStyle}>
          <p className="text-xs text-[#9ca3af] leading-relaxed italic" style={buildLabelStyle(s)}>
            {field.content || field.label || 'Caption text — add a short description or note here.'}
          </p>
        </div>
      )

    default:
      return (
        <div className="text-xs text-[#94a3b8] italic px-2 py-1 border border-dashed border-[#e5e7eb] rounded">
          Unknown field type: {field.type}
        </div>
      )
  }
}