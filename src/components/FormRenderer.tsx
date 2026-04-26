'use client'
import React, { useState, useEffect, useRef } from 'react'
import { FormField, FormSection, FormSchema, TableColumn, TableRow } from '@/types'
import { getFieldMeta } from '@/lib/fieldRegistry'
import { useForm, Controller } from 'react-hook-form'
import {
  DndContext, closestCenter, PointerSensor, useSensor, useSensors,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext, useSortable, verticalListSortingStrategy, arrayMove,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical } from 'lucide-react'

interface Props {
  schema: FormSchema
  formName: string
  onSubmit: (data: Record<string, any>) => Promise<void>
  previewOnly?: boolean
  draggable?: boolean
  onReorder?: (fields: FormField[]) => void
}

const TYPOGRAPHY_TYPES = new Set(['heading', 'paragraph', 'blockquote', 'code_block', 'ordered_list', 'unordered_list', 'divider', 'caption', 'table'])

function buildDefaults(fields: FormField[]): Record<string, any> {
  return fields.reduce((acc, field) => {
    if (TYPOGRAPHY_TYPES.has(field.type)) return acc  // not form fields
    if (field.defaultValue !== undefined && field.defaultValue !== null && field.defaultValue !== '') {
      acc[field.id] = field.defaultValue
    } else if (field.type === 'switch') { acc[field.id] = false }
    else if (field.type === 'checkbox') { acc[field.id] = false }
    else { acc[field.id] = '' }
    // recurse into box children
    if (field.children && field.children.length > 0) {
      Object.assign(acc, buildDefaults(field.children))
    }
    return acc
  }, {} as Record<string, any>)
}

// ── Default table data ────────────────────────────────────────────────────────
const DEFAULT_TABLE_COLS: TableColumn[] = [
  { id: 'c1', header: '', align: 'left' },
  { id: 'c2', header: '', align: 'left' },
  { id: 'c3', header: '', align: 'left' },
]

const DEFAULT_TABLE_ROWS: TableRow[] = [
  { id: 'r1', cells: { c1: 'Cell 1,1', c2: 'Cell 1,2', c3: 'Cell 1,3' } },
  { id: 'r2', cells: { c1: 'Cell 2,1', c2: 'Cell 2,2', c3: 'Cell 2,3' } },
]

// ── Single field renderer ─────────────────────────────────────────────────────
function FieldRenderer({ field, register, errors, watch, control }: {
  field: FormField; register: any; errors: any; watch: any; control: any
}) {
  const inputBase = `w-full px-3 py-2.5 border rounded-lg text-sm transition-colors outline-none focus:ring-2 focus:ring-[#6366f1]/20 ${errors[field.id]
      ? 'border-red-400 focus:border-red-400'
      : 'border-[#d1d5db] focus:border-[#6366f1]'
    }`

  const rules: any = {}
  if (field.validation?.required) rules.required = field.validation.message || 'This field is required'
  if (field.validation?.minLength) rules.minLength = { value: field.validation.minLength, message: `Minimum ${field.validation.minLength} characters` }
  if (field.validation?.maxLength) rules.maxLength = { value: field.validation.maxLength, message: `Maximum ${field.validation.maxLength} characters` }
  if (field.validation?.min) rules.min = { value: field.validation.min, message: `Minimum value is ${field.validation.min}` }
  if (field.validation?.max) rules.max = { value: field.validation.max, message: `Maximum value is ${field.validation.max}` }
  if (field.validation?.pattern) rules.pattern = { value: new RegExp(field.validation.pattern), message: 'Invalid format' }

  const FieldLabel = () => (
    <label className="block text-sm font-medium text-[#374151] mb-1.5">
      {field.label}
      {field.validation?.required && <span className="text-red-500 ml-0.5">*</span>}
      {field.helpText && <span className="text-xs text-[#9ca3af] ml-2 font-normal">{field.helpText}</span>}
    </label>
  )
  const FieldError = () => errors[field.id]
    ? <p className="text-xs text-red-500 mt-1">{errors[field.id].message}</p>
    : null

  switch (field.type) {

    // ── INPUTS ──────────────────────────────────────────────────────────────

    case 'button': {
      const variantClass: Record<string, string> = {
        primary: 'bg-[#6366f1] text-white hover:bg-[#4f46e5]',
        secondary: 'bg-[#f1f5f9] text-[#374151] border border-[#e2e8f0] hover:bg-[#e2e8f0]',
        outline: 'bg-transparent text-[#6366f1] border border-[#6366f1] hover:bg-[#eef2ff]',
        danger: 'bg-red-500 text-white hover:bg-red-600',
      }
      const v = field.buttonVariant || 'primary'
      const alignClass = field.buttonAlign === 'center' ? 'justify-center' : field.buttonAlign === 'right' ? 'justify-end' : 'justify-start'
      return (
        <div className={`flex w-full ${alignClass}`}>
          <button
            type={field.buttonAction === 'submit' ? 'submit' : 'button'}
            onClick={field.buttonAction === 'url' && field.buttonUrl ? () => window.open(field.buttonUrl, '_blank') : undefined}
            className={`px-5 py-2.5 rounded-lg text-sm font-medium transition-colors ${variantClass[v]}`}
          >
            {field.content || 'Button'}
          </button>
        </div>
      )
    }

    case 'button_group': {
      const defaultOptions = [
        { label: 'Primary', value: 'primary' },
        { label: 'Secondary', value: 'secondary' },
        { label: 'Outline', value: 'outline' },
      ]
      const groupOptions = field.options?.length ? field.options : defaultOptions
      const variantStyles: Record<string, string> = {
        primary:   'bg-[#6366f1] text-white hover:bg-[#4f46e5]',
        secondary: 'bg-[#f1f5f9] text-[#374151] border border-[#e2e8f0] hover:bg-[#e2e8f0]',
        outline:   'bg-transparent text-[#6366f1] border border-[#6366f1] hover:bg-[#eef2ff]',
        danger:    'bg-red-500 text-white hover:bg-red-600',
      }
      return (
        <div className="flex flex-col gap-2">
          {groupOptions.map((opt, i) => {
            const variant = opt.value in variantStyles ? opt.value : (i === 0 ? 'primary' : i === 1 ? 'secondary' : 'outline')
            return (
              <button key={opt.value} type="button"
                className={`w-full px-3 py-2 rounded-lg text-sm font-medium transition-colors text-left ${variantStyles[variant]}`}>
                {opt.label}
              </button>
            )
          })}
        </div>
      )
    }

    case 'checkbox':
      return (
        <div>
          <div className="flex items-center gap-2.5">
            <input type="checkbox" id={field.id} {...register(field.id, rules)}
              className="w-4 h-4 rounded border-[#d1d5db] text-[#6366f1] focus:ring-[#6366f1]/30 cursor-pointer" />
            <label htmlFor={field.id} className="text-sm text-[#374151] cursor-pointer">
              {field.label}{field.validation?.required && <span className="text-red-500 ml-0.5">*</span>}
            </label>
          </div>
          <FieldError />
        </div>
      )

    case 'date_picker':
      return (
        <div>
          <FieldLabel />
          <input type="date" className={inputBase} {...register(field.id, rules)} />
          <FieldError />
        </div>
      )

    case 'radio_group':
      return (
        <div>
          <FieldLabel />
          <div className="space-y-2">
            {(field.options?.length ? field.options : [{ label: 'Option 1', value: 'option1' }, { label: 'Option 2', value: 'option2' }]).map(opt => (
              <div key={opt.value} className="flex items-center gap-2.5">
                <input type="radio" id={`${field.id}-${opt.value}`} value={opt.value}
                  {...register(field.id, rules)}
                  className="w-4 h-4 border-[#d1d5db] text-[#6366f1] cursor-pointer" />
                <label htmlFor={`${field.id}-${opt.value}`} className="text-sm text-[#374151] cursor-pointer">{opt.label}</label>
              </div>
            ))}
          </div>
          <FieldError />
        </div>
      )

    case 'radio_item':
      return (
        <div className="flex items-center gap-2.5">
          <input type="radio" id={field.id} {...register(field.id, rules)}
            className="w-4 h-4 border-[#d1d5db] text-[#6366f1] cursor-pointer" />
          <label htmlFor={field.id} className="text-sm text-[#374151] cursor-pointer">{field.label || 'Radio item'}</label>
          <FieldError />
        </div>
      )

    case 'select':
      return (
        <div>
          <FieldLabel />
          <Controller
            name={field.id}
            control={control}
            rules={rules}
            render={({ field: f }) => (
              <select
                className={inputBase}
                value={f.value !== undefined && f.value !== null ? String(f.value) : ''}
                onChange={e => f.onChange(e.target.value)}
                onBlur={f.onBlur}
                ref={f.ref}
              >
                <option value="">{field.placeholder || 'Select an option'}</option>
                {(field.options || []).map(opt => (
                  <option key={opt.value} value={String(opt.value)}>{opt.label}</option>
                ))}
              </select>
            )}
          />
          <FieldError />
        </div>
      )

    case 'switch':
      return (
        <div className="flex items-center gap-3">
          <Controller name={field.id} control={control} rules={rules}
            render={({ field: f }) => (
              <button type="button" role="switch" aria-checked={!!f.value}
                onClick={() => f.onChange(!f.value)}
                className={`w-11 h-6 rounded-full relative transition-colors ${f.value ? 'bg-[#6366f1]' : 'bg-[#d1d5db]'}`}>
                <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-all ${f.value ? 'left-5' : 'left-0.5'}`} />
              </button>
            )}
          />
          <label className="text-sm font-medium text-[#374151]">{field.label}</label>
        </div>
      )

    case 'text_field':
      return (
        <div>
          <FieldLabel />
          <input type="text" className={inputBase} placeholder={field.placeholder} {...register(field.id, rules)} />
          <FieldError />
        </div>
      )

    case 'uploader':
      return (
        <div>
          <FieldLabel />
          <label className="flex flex-col items-center justify-center w-full border-2 border-dashed border-[#d1d5db] rounded-lg p-6 bg-[#f9fafb] cursor-pointer hover:border-[#6366f1] hover:bg-[#f5f3ff] transition-colors">
            <svg className="w-8 h-8 text-[#9ca3af] mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
            <span className="text-sm text-[#9ca3af]">Click to upload or drag and drop</span>
            <input type="file" className="hidden" {...register(field.id, rules)} />
          </label>
          <FieldError />
        </div>
      )

    // ── DATA DISPLAY ──────────────────────────────────────────────────────────

    case 'list':
      return (
        <ul className="space-y-1.5 text-sm text-[#374151] list-disc list-inside">
          <li>List item one</li>
          <li>List item two</li>
          <li>List item three</li>
        </ul>
      )

    case 'list_item':
      return (
        <div className="flex items-center gap-2 text-sm text-[#374151]">
          <div className="w-1.5 h-1.5 rounded-full bg-[#6366f1] flex-shrink-0" />
          <span>{field.label || 'List item'}</span>
        </div>
      )

    case 'tooltip': {
      const [open, setOpen] = useState(false)
      return (
        <div className="inline-flex items-center gap-2">
          <span className="text-sm text-[#374151]">{field.label || 'Hover for info'}</span>
          <div className="relative"
            onMouseEnter={() => setOpen(true)}
            onMouseLeave={() => setOpen(false)}>
            <div className="w-4 h-4 rounded-full bg-[#6366f1] text-white text-[10px] flex items-center justify-center font-bold cursor-help">?</div>
            {open && (
              <div className="absolute left-1/2 -translate-x-1/2 bottom-6 bg-[#1e293b] text-white text-xs px-2.5 py-1.5 rounded-lg shadow-xl whitespace-nowrap z-50">
                {field.placeholder || 'Tooltip text'}
                <div className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-[#1e293b]" />
              </div>
            )}
          </div>
        </div>
      )
    }

    case 'typography':
      return <p className="text-sm text-[#374151] leading-relaxed">{field.content || field.label || 'Typography text'}</p>

    case 'table': {
      const cols: TableColumn[] = field.tableColumns?.length ? field.tableColumns : DEFAULT_TABLE_COLS
      const rows: TableRow[]    = field.tableRows?.length    ? field.tableRows    : DEFAULT_TABLE_ROWS
      const striped  = field.tableStriped  ?? true
      const bordered = field.tableBordered ?? true
      const compact  = field.tableCompact  ?? false

      return (
        <div className="w-full overflow-x-auto">
          {field.label && (
            <p className="text-sm font-semibold text-[#374151] mb-2">{field.label}</p>
          )}
          <table
            className="w-full text-sm text-left"
            style={{ borderCollapse: 'collapse' }}
          >
            <thead>
              <tr className="bg-[#f3f4f6]">
                {cols.map(col => (
                  <th
                    key={col.id}
                    className={`font-semibold text-[#374151] ${compact ? 'px-2 py-2' : 'px-4 py-3'}`}
                    style={{
                      textAlign: col.align || 'left',
                      width: col.width || undefined,
                      border: bordered ? '1px solid #e5e7eb' : undefined,
                    }}
                  >
                    {col.header || ''}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, ri) => (
                <tr
                  key={row.id}
                  className={`transition-colors hover:bg-[#f5f3ff] ${striped && ri % 2 === 1 ? 'bg-[#f9fafb]' : 'bg-white'}`}
                >
                  {cols.map(col => (
                    <td
                      key={col.id}
                      className={`text-[#374151] ${compact ? 'px-2 py-1.5' : 'px-4 py-3'}`}
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
              <caption className="caption-bottom text-xs text-[#9ca3af] italic py-2 text-left">
                {field.tableCaption}
              </caption>
            )}
          </table>
        </div>
      )
    }

    // ── FEEDBACK ──────────────────────────────────────────────────────────────

    case 'circular_progress': {
      const pct = 75
      const r = 20, circ = 2 * Math.PI * r
      return (
        <div className="flex items-center gap-3">
          <svg width="56" height="56" viewBox="0 0 48 48">
            <circle cx="24" cy="24" r={r} fill="none" stroke="#e5e7eb" strokeWidth="4" />
            <circle cx="24" cy="24" r={r} fill="none" stroke="#6366f1" strokeWidth="4"
              strokeDasharray={circ} strokeDashoffset={circ * (1 - pct / 100)}
              strokeLinecap="round" transform="rotate(-90 24 24)" />
            <text x="24" y="28" textAnchor="middle" fill="#374151" fontSize="10" fontWeight="600">{pct}%</text>
          </svg>
          <span className="text-sm text-[#374151]">{field.label || 'Loading...'}</span>
        </div>
      )
    }

    case 'linear_progress':
      return (
        <div>
          <div className="flex justify-between mb-1.5">
            <span className="text-sm font-medium text-[#374151]">{field.label || 'Progress'}</span>
            <span className="text-xs text-[#9ca3af]">75%</span>
          </div>
          <div className="w-full h-2.5 bg-[#e5e7eb] rounded-full overflow-hidden">
            <div className="h-full bg-[#6366f1] rounded-full transition-all" style={{ width: '75%' }} />
          </div>
        </div>
      )

    // ── LAYOUT ────────────────────────────────────────────────────────────────

    case 'box':
      return (
        <div className="border border-dashed border-[#d1d5db] rounded-lg p-4 bg-[#f9fafb]">
          {field.children && field.children.length > 0 ? (
            <div className="flex flex-col gap-3">
              {field.children.map(child => (
                <FieldRenderer
                  key={child.id}
                  field={child}
                  register={register}
                  errors={errors}
                  watch={watch}
                  control={control}
                />
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-center min-h-[48px]">
              <span className="text-xs text-[#9ca3af]">{field.label || 'Box'}</span>
            </div>
          )}
        </div>
      )

    case 'container':
      return (
        <div className="border border-dashed border-[#6366f1] rounded-lg p-4 bg-[#f5f3ff] min-h-[80px] flex items-center justify-center">
          <span className="text-xs text-[#6366f1]">{field.label || 'Container'}</span>
        </div>
      )

    case 'dialog_layout':
      return (
        <div className="border border-[#d1d5db] rounded-xl shadow-sm bg-white overflow-hidden">
          <div className="px-4 py-3 border-b border-[#e5e7eb] bg-[#f9fafb] flex items-center justify-between">
            <span className="text-sm font-semibold text-[#0f172a]">{field.label || 'Dialog'}</span>
            <span className="text-[#9ca3af] text-xl leading-none cursor-pointer hover:text-[#374151]">×</span>
          </div>
          <div className="px-4 py-4">
            <p className="text-sm text-[#64748b]">Dialog content area</p>
          </div>
          <div className="px-4 py-3 border-t border-[#e5e7eb] bg-[#f9fafb] flex justify-end gap-2">
            <button type="button" className="px-3 py-1.5 text-xs border border-[#d1d5db] rounded-lg text-[#374151] hover:bg-[#f1f5f9] transition-colors">Cancel</button>
            <button type="button" className="px-3 py-1.5 text-xs bg-[#6366f1] text-white rounded-lg hover:bg-[#4f46e5] transition-colors">Confirm</button>
          </div>
        </div>
      )

    case 'stack':
      return (
        <div className="space-y-2">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-10 bg-[#f1f5f9] border border-[#e5e7eb] rounded-lg flex items-center px-3">
              <span className="text-xs text-[#9ca3af]">Stack item {i}</span>
            </div>
          ))}
        </div>
      )

    // ── SURFACES ──────────────────────────────────────────────────────────────

    case 'card':
      return (
        <div className="border border-[#e5e7eb] rounded-xl p-4 bg-white shadow-sm">
          <p className="text-sm font-semibold text-[#374151] mb-1">{field.label || 'Card title'}</p>
          <p className="text-xs text-[#9ca3af]">{field.placeholder || 'Card content goes here.'}</p>
        </div>
      )

    // ── NAVIGATION ────────────────────────────────────────────────────────────

    case 'breadcrumbs':
      return (
        <nav className="flex items-center gap-1 text-sm flex-wrap">
          <a href="#" onClick={e => e.preventDefault()} className="text-[#6366f1] hover:underline">Home</a>
          <span className="text-[#9ca3af]">/</span>
          <a href="#" onClick={e => e.preventDefault()} className="text-[#6366f1] hover:underline">Section</a>
          <span className="text-[#9ca3af]">/</span>
          <span className="text-[#374151]">{field.label || 'Current page'}</span>
        </nav>
      )

    case 'link':
      return (
        <a href={field.placeholder || '#'} onClick={e => e.preventDefault()}
          className="text-sm text-[#6366f1] underline underline-offset-2 hover:text-[#4f46e5] transition-colors">
          {field.label || 'Click here'}
        </a>
      )

    // ── FORM ──────────────────────────────────────────────────────────────────

    case 'form_control_label':
      return (
        <div className="flex items-center gap-2.5">
          <div className="w-4 h-4 rounded border-2 border-[#6366f1] bg-white flex items-center justify-center">
            <div className="w-2 h-2 rounded-sm bg-[#6366f1]" />
          </div>
          <label className="text-sm font-medium text-[#374151]">{field.label || 'Form control label'}</label>
        </div>
      )

    case 'form_label':
      return (
        <label className="block text-sm font-medium text-[#374151]">
          {field.label || 'Form label'}
          {field.validation?.required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
      )

    // ── TEMPLATES ─────────────────────────────────────────────────────────────

    case 'embedded_form':
      return (
        <div className="border border-dashed border-[#6366f1] rounded-lg p-4 bg-[#f5f3ff]">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-5 h-5 bg-[#6366f1] rounded flex items-center justify-center">
              <span className="text-white text-[9px] font-bold">&lt;/&gt;</span>
            </div>
            <span className="text-xs font-semibold text-[#6366f1]">{field.label || 'Embedded Form'}</span>
          </div>
          <div className="space-y-2">
            <div className="h-7 bg-[#ddd6fe] rounded" />
            <div className="h-7 bg-[#ddd6fe] rounded" />
            <div className="h-9 bg-[#6366f1] rounded flex items-center justify-center">
              <span className="text-white text-xs font-medium">Submit</span>
            </div>
          </div>
        </div>
      )

    case 'slot':
      return (
        <div className="border-2 border-dashed border-[#9ca3af] rounded-lg p-4 min-h-[60px] flex items-center justify-center bg-[#f9fafb]">
          <span className="text-xs text-[#9ca3af] font-mono">{field.label || '{ Slot }'}</span>
        </div>
      )

    case 'test':
      return (
        <div className="border border-[#f59e0b] rounded-lg p-3 bg-[#fffbeb] flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-[#f59e0b] flex-shrink-0" />
          <span className="text-xs font-medium text-[#92400e]">{field.label || 'Test component'}</span>
        </div>
      )

    // ── STRUCTURE ─────────────────────────────────────────────────────────────

    case 'repeater':
      return (
        <div>
          <FieldLabel />
          <div className="space-y-2">
            {[1, 2].map(i => (
              <div key={i} className="flex items-center gap-2 p-2.5 border border-[#e5e7eb] rounded-lg bg-[#f9fafb]">
                <div className="flex-1 h-6 bg-[#e5e7eb] rounded" />
                <button type="button" className="w-6 h-6 flex items-center justify-center text-[#9ca3af] hover:text-red-400 transition-colors text-lg leading-none">×</button>
              </div>
            ))}
            <button type="button" className="w-full py-2 border border-dashed border-[#d1d5db] rounded-lg text-xs text-[#9ca3af] hover:border-[#6366f1] hover:text-[#6366f1] transition-colors">
              + Add item
            </button>
          </div>
        </div>
      )

    // ── MODAL ─────────────────────────────────────────────────────────────────

    case 'modal': {
      const [open, setOpen] = useState(false)
      return (
        <div>
          <button type="button" onClick={() => setOpen(true)}
            className="px-4 py-2 bg-[#6366f1] text-white text-sm rounded-lg hover:bg-[#4f46e5] transition-colors">
            Open Modal
          </button>
          {open && (
            <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={() => setOpen(false)}>
              <div className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-4" onClick={e => e.stopPropagation()}>
                <div className="px-5 py-4 border-b border-[#e5e7eb] flex items-center justify-between">
                  <h3 className="text-base font-semibold text-[#0f172a]">{field.label || 'Modal Title'}</h3>
                  <button type="button" onClick={() => setOpen(false)} className="text-[#9ca3af] hover:text-[#374151] text-xl leading-none transition-colors">×</button>
                </div>
                <div className="px-5 py-5">
                  <p className="text-sm text-[#64748b]">{field.placeholder || 'Modal body content goes here.'}</p>
                </div>
                <div className="px-5 py-4 border-t border-[#e5e7eb] bg-[#f9fafb] flex justify-end gap-2 rounded-b-xl">
                  <button type="button" onClick={() => setOpen(false)} className="px-4 py-2 text-sm border border-[#d1d5db] rounded-lg text-[#374151] hover:bg-[#f1f5f9] transition-colors">Cancel</button>
                  <button type="button" onClick={() => setOpen(false)} className="px-4 py-2 text-sm bg-[#6366f1] text-white rounded-lg hover:bg-[#4f46e5] transition-colors">Confirm</button>
                </div>
              </div>
            </div>
          )}
        </div>
      )
    }

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
      const Tag = `h${lvl}` as React.ElementType
      return (
        <Tag className={`${sizeMap[lvl]} text-[#0f172a] leading-tight`}>
          {field.content || field.label || `Heading ${lvl}`}
        </Tag>
      )
    }

    case 'paragraph':
      return (
        <p className="text-base text-[#374151] leading-relaxed">
          {field.content || field.label || ''}
        </p>
      )

    case 'blockquote':
      return (
        <blockquote className="border-l-4 border-[#6366f1] pl-4 py-1 bg-[#f5f3ff] rounded-r-lg">
          <p className="text-sm italic text-[#4b5563] leading-relaxed">
            {field.content || field.label || ''}
          </p>
        </blockquote>
      )

    case 'code_block':
      return (
        <div className="rounded-lg overflow-hidden border border-[#e2e8f0]">
          <div className="flex items-center gap-1.5 px-3 py-2 bg-[#1e293b]">
            <span className="w-2.5 h-2.5 rounded-full bg-[#ff5f57]" />
            <span className="w-2.5 h-2.5 rounded-full bg-[#febc2e]" />
            <span className="w-2.5 h-2.5 rounded-full bg-[#28c840]" />
          </div>
          <pre className="px-4 py-3 text-sm font-mono text-[#e2e8f0] bg-[#0f172a] overflow-x-auto leading-relaxed whitespace-pre-wrap">
            <code>{field.content || field.label || ''}</code>
          </pre>
        </div>
      )

    case 'ordered_list':
      return (
        <div>
          {field.label && <p className="text-sm font-medium text-[#374151] mb-1.5">{field.label}</p>}
          <ol className="list-decimal list-inside space-y-1 text-sm text-[#374151]">
            {(field.content || '').split('\n').filter(Boolean).map((item, i) => (
              <li key={i} className="leading-relaxed">{item}</li>
            ))}
          </ol>
        </div>
      )

    case 'unordered_list':
      return (
        <div>
          {field.label && <p className="text-sm font-medium text-[#374151] mb-1.5">{field.label}</p>}
          <ul className="list-disc list-inside space-y-1 text-sm text-[#374151]">
            {(field.content || '').split('\n').filter(Boolean).map((item, i) => (
              <li key={i} className="leading-relaxed">{item}</li>
            ))}
          </ul>
        </div>
      )

    case 'divider':
      return (
        <div className="py-1">
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
        <p className="text-xs text-[#9ca3af] leading-relaxed italic">
          {field.content || field.label || ''}
        </p>
      )

    // ── FALLBACK ──────────────────────────────────────────────────────────────

    default:
      return (
        <div>
          <FieldLabel />
          <input type="text" className={inputBase} placeholder={field.placeholder} {...register(field.id, rules)} />
          <FieldError />
        </div>
      )
  }
}

// ── Sortable field wrapper ────────────────────────────────────────────────────
function SortableField({ field, register, errors, watch, control, draggable }: {
  field: FormField; register: any; errors: any; watch: any; control: any; draggable: boolean
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: field.id })
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.4 : 1 }

  return (
    <div ref={setNodeRef} style={style} className="relative group">
      {draggable && (
        <div {...attributes} {...listeners}
          className="absolute -left-6 top-1/2 -translate-y-1/2 cursor-grab active:cursor-grabbing p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity text-[#94a3b8] hover:text-[#6366f1]">
          <GripVertical size={16} />
        </div>
      )}
      <FieldRenderer field={field} register={register} errors={errors} watch={watch} control={control} />
    </div>
  )
}

// ── Main FormRenderer ─────────────────────────────────────────────────────────
export default function FormRenderer({ schema, formName, onSubmit, previewOnly = false, draggable = false, onReorder }: Props) {
  const [fields, setFields] = useState<FormField[]>(schema.fields)
  const [sections, setSections] = useState<FormSection[]>(schema.sections || [])
  const [submitted, setSubmitted] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)
  const prevSchemaRef = useRef<string>('')

  useEffect(() => {
    const fieldKey = JSON.stringify(schema.fields)
    const sectionKey = JSON.stringify(schema.sections)
    const key = fieldKey + sectionKey
    if (key !== prevSchemaRef.current) {
      prevSchemaRef.current = key
      setFields(schema.fields)
      setSections(schema.sections || [])
    }
  }, [schema.fields, schema.sections])

  const defaults = buildDefaults(fields)

  const { register, handleSubmit, formState: { errors, isSubmitting }, watch, reset, control } = useForm({ defaultValues: defaults })

  useEffect(() => { reset(buildDefaults(fields)) }, [fields])

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }))

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const oldIdx = fields.findIndex(f => f.id === active.id)
    const newIdx = fields.findIndex(f => f.id === over.id)
    if (oldIdx === -1 || newIdx === -1) return
    const reordered = arrayMove(fields, oldIdx, newIdx)
    setFields(reordered)
    onReorder?.(reordered)
  }

  const submit = async (data: any) => {
    await onSubmit(data)
    setSubmitted(true)
    reset()
  }

  if (submitted) {
    return (
      <div className="text-center py-12">
        <div className="w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
          <svg className="w-7 h-7 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h3 className="text-xl font-bold text-[#0f172a] mb-2">Thank you!</h3>
        <p className="text-[#64748b] text-sm">{schema.settings?.successMessage}</p>
        <button onClick={() => setSubmitted(false)}
          className="mt-6 px-5 py-2 border border-[#e2e8f0] rounded-lg text-sm text-[#64748b] hover:bg-[#f8fafc] transition-colors">
          Submit another response
        </button>
      </div>
    )
  }

  const getWidthStyle = (width?: string): React.CSSProperties => {
    switch (width) {
      case 'col2': return { flex: '1 1 180px', minWidth: 0 }
      case 'col3': return { flex: '1 1 120px', minWidth: 0 }
      case 'col4': return { flex: '1 1 80px', minWidth: 0 }
      default: return { width: '100%' }
    }
  }

  // Group flat field list into rows by rowId (mirrors FormCanvas groupIntoRows)
  const groupIntoRows = (fieldList: FormField[]): FormField[][] => {
    const rows: FormField[][] = []
    const rowMap = new Map<string, FormField[]>()
    for (const field of fieldList) {
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

  const renderFieldList = (fieldList: FormField[]) => {
    const rows = groupIntoRows(fieldList)
    return (
      <div className="flex flex-col gap-4">
        {rows.map((row, ri) => (
          <div key={ri} style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
            {row.map(field => (
              <div key={field.id} style={{ ...getWidthStyle(field.width), minWidth: 0, overflow: 'hidden' }}>
                <SortableField
                  field={field}
                  register={register}
                  errors={errors}
                  watch={watch}
                  control={control}
                  draggable={draggable}
                />
              </div>
            ))}
          </div>
        ))}
      </div>
    )
  }

  // ── Stepper mode ─────────────────────────────────────────────────────────
  const stepperMode = schema.settings?.stepperMode && sections.length > 0
  const totalSteps = sections.length
  const isLastStep = currentStep === totalSteps - 1

  const StepperBar = () => (
    <div className="mb-8 overflow-x-auto">
      <div className="flex items-start min-w-max">
        {sections.map((sec, idx) => {
          const isActive = idx === currentStep
          const isCompleted = idx < currentStep
          return (
            <React.Fragment key={sec.id}>
              {/* Step circle + label */}
              <button
                type="button"
                onClick={() => setCurrentStep(idx)}
                className="flex flex-col items-center gap-1.5 focus:outline-none flex-shrink-0"
                style={{ minWidth: 64, maxWidth: 80 }}
              >
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold border-2 transition-all flex-shrink-0 ${isCompleted
                      ? 'bg-[var(--brand,#6366f1)] border-[var(--brand,#6366f1)] text-white'
                      : isActive
                        ? 'bg-white border-[var(--brand,#6366f1)] text-[var(--brand,#6366f1)] shadow-md shadow-[var(--brand,#6366f1)]/20'
                        : 'bg-white border-[#d1d5db] text-[#94a3b8]'
                    }`}
                >
                  {isCompleted ? (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    idx + 1
                  )}
                </div>
                <span
                  className={`text-xs font-medium text-center leading-tight transition-colors break-words w-full ${isActive ? 'text-[var(--brand,#6366f1)]' : isCompleted ? 'text-[#374151]' : 'text-[#94a3b8]'
                    }`}
                >
                  {sec.title}
                </span>
              </button>

              {/* Connector line (not after last) — sits at circle height (top 18px = half of h-9=36px) */}
              {idx < totalSteps - 1 && (
                <div className="flex-shrink-0 flex-1 h-0.5 mx-2 rounded-full transition-all" style={{ marginTop: 18, minWidth: 12, background: idx < currentStep ? 'var(--brand,#6366f1)' : '#e2e8f0' }}
                />
              )}
            </React.Fragment>
          )
        })}
      </div>
    </div>
  )

  // ── Normal (non-stepper) content ──────────────────────────────────────────
  const allContent = (
    <>
      {sections.map(section => (
        <div key={section.id} className="mb-8">
          <div className="mb-4 pb-3 border-b-2 border-[var(--brand,#6366f1)]/20">
            <div className="flex items-center gap-2">
              <div className="w-1 h-6 rounded-full bg-[var(--brand,#6366f1)]" />
              <h2 className="text-base font-semibold text-[#0f172a] dark:text-white">{section.title}</h2>
            </div>
            {section.description && (
              <p className="text-sm text-[#64748b] mt-1 ml-3">{section.description}</p>
            )}
          </div>
          {section.fields.length > 0
            ? renderFieldList(section.fields)
            : <p className="text-sm text-[#94a3b8] italic ml-3">No fields in this section.</p>
          }
        </div>
      ))}
      {fields.length > 0 && (
        <div className={sections.length > 0 ? 'pt-2' : ''}>
          {renderFieldList(fields)}
        </div>
      )}
    </>
  )

  // ── Stepper content (one step at a time) ──────────────────────────────────
  const stepperContent = stepperMode ? (
    <>
      <StepperBar />

      {/* Active section fields */}
      {(() => {
        const sec = sections[currentStep]
        return (
          <div>
            {sec.description && (
              <p className="text-sm text-[#64748b] mb-4">{sec.description}</p>
            )}
            {sec.fields.length > 0
              ? renderFieldList(sec.fields)
              : <p className="text-sm text-[#94a3b8] italic">No fields in this step.</p>
            }
          </div>
        )
      })()}

      {/* Unsectioned fields only on last step */}
      {isLastStep && fields.length > 0 && (
        <div className="mt-4">{renderFieldList(fields)}</div>
      )}

      {/* Navigation buttons */}
      <div className="flex justify-between mt-8 pt-4 border-t border-[#f1f5f9]">
        <button
          type="button"
          disabled={currentStep === 0}
          onClick={() => setCurrentStep(s => s - 1)}
          className="px-5 py-2.5 rounded-lg text-sm font-medium border border-[#e2e8f0] text-[#374151] hover:bg-[#f8fafc] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          ← Back
        </button>

        {isLastStep ? (
          <button
            type="submit"
            className="px-6 py-2.5 rounded-lg text-sm font-semibold bg-[var(--brand,#6366f1)] text-white hover:bg-[#4f46e5] transition-colors shadow-sm"
          >
            {schema.settings?.submitLabel || 'Submit'}
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setCurrentStep(s => s + 1)}
            className="px-6 py-2.5 rounded-lg text-sm font-semibold bg-[var(--brand,#6366f1)] text-white hover:bg-[#4f46e5] transition-colors shadow-sm"
          >
            Next →
          </button>
        )}
      </div>
    </>
  ) : null

  return (
    <form onSubmit={handleSubmit(submit)} noValidate>
      {stepperMode ? (
        stepperContent
      ) : draggable ? (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={fields.map(f => f.id)} strategy={verticalListSortingStrategy}>
            {allContent}
          </SortableContext>
        </DndContext>
      ) : allContent}
    </form>
  )
}