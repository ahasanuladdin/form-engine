'use client'
import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { api } from '@/lib/api'
import FormRenderer from '@/components/FormRenderer'
import {
  Database, Table2, ArrowRight, Loader2, RefreshCw,
  Wand2, ArrowLeft, AlertCircle, CheckCircle2,
  Hash, Type, Calendar, ToggleLeft, List, AlignLeft,
  FileInput, Star, Palette, Layers, Rows, Eye,
  ChevronLeft, ChevronRight, FileText, Zap,
} from 'lucide-react'

// ── Types ─────────────────────────────────────────────────────────────────────
interface ColumnInfo   { name: string; type: string; nullable: boolean; default: string|null; key: string }
interface GeneratedField {
  id: string; type: string; label: string; placeholder?: string
  width: string; validation?: { required?: boolean; maxLength?: number }
  options?: { label: string; value: string }[]; rows?: number
  maxRating?: number; defaultValue?: any
}

// ── Field type meta ───────────────────────────────────────────────────────────
const FT: Record<string, { icon: any; color: string }> = {
  text:     { icon: Type,        color: '#3b82f6' },
  email:    { icon: Type,        color: '#8b5cf6' },
  password: { icon: Type,        color: '#ef4444' },
  number:   { icon: Hash,        color: '#f59e0b' },
  textarea: { icon: AlignLeft,   color: '#06b6d4' },
  select:   { icon: List,        color: '#10b981' },
  checkbox: { icon: CheckCircle2,color: '#10b981' },
  date:     { icon: Calendar,    color: '#f97316' },
  file:     { icon: FileInput,   color: '#64748b' },
  toggle:   { icon: ToggleLeft,  color: '#10b981' },
  rating:   { icon: Star,        color: '#f59e0b' },
  color:    { icon: Palette,     color: '#ec4899' },
}
const fm = (t: string) => FT[t] || { icon: Type, color: '#64748b' }

// ── Map DB/API field types → builder component types ─────────────────────────
const DB_TYPE_MAP: Record<string, string> = {
  text:        'text_field',
  email:       'text_field',
  password:    'text_field',
  number:      'text_field',
  textarea:    'text_field',
  date:        'date_picker',
  toggle:      'switch',
  boolean:     'switch',
  checkbox:    'checkbox',
  select:      'select',
  file:        'uploader',
  color:       'text_field',
  rating:      'text_field',
}
const mapFieldType = (fields: GeneratedField[]): GeneratedField[] =>
  fields.map(f => ({ ...f, type: DB_TYPE_MAP[f.type] ?? f.type }))

// ── Helpers ───────────────────────────────────────────────────────────────────
const DbBadge = ({ type }: { type: string }) => (
  <span className="font-mono text-[10px] bg-[#0f172a] text-[#94a3b8] border border-[#1e2d45] px-2 py-0.5 rounded-md">
    {type.length > 18 ? type.slice(0, 18) + '…' : type}
  </span>
)

const NullBadge = ({ v }: { v: boolean }) => (
  <span className={`text-[10px] px-2 py-0.5 rounded font-mono border ${v ? 'bg-[#10b981]/10 text-[#10b981] border-[#10b981]/20' : 'bg-[#ef4444]/10 text-[#ef4444] border-[#ef4444]/20'}`}>
    {v ? 'NULL' : 'NOT NULL'}
  </span>
)

// ── Main ──────────────────────────────────────────────────────────────────────
export default function DbImportPage() {
  const router = useRouter()

  // Table list
  const [tables, setTables]        = useState<string[]>([])
  const [selectedTable, setTable]  = useState('')
  const [loadingTables, setLT]     = useState(false)

  // Columns
  const [columns, setColumns]      = useState<ColumnInfo[]>([])
  const [loadingCols, setLC]       = useState(false)

  // Mode: 'schema' | 'data'
  const [mode, setMode]            = useState<'schema'|'data'>('schema')

  // Schema mode
  const [schemaFields, setSchemaFields]   = useState<GeneratedField[]>([])
  const [schemaName, setSchemaName]       = useState('')
  const [loadingSchema, setLSch]          = useState(false)

  // Data mode
  const [rows, setRows]            = useState<any[]>([])
  const [rowCols, setRowCols]      = useState<string[]>([])   // column names for table header
  const [page, setPage]            = useState(1)
  const [totalPages, setTotalPages]= useState(1)
  const [total, setTotal]          = useState(0)
  const [loadingRows, setLR]       = useState(false)
  const [generatingRowId, setGRI]  = useState<string|null>(null)

  // Row-generated form preview
  const [rowSchema, setRowSchema]  = useState<{ name: string; fields: GeneratedField[]; rowData: any } | null>(null)

  // Shared
  const [error, setError]          = useState('')
  const [toast, setToast]          = useState('')
  const [importing, setImporting]  = useState(false)

  const showToast = (m: string) => { setToast(m); setTimeout(() => setToast(''), 3000) }

  // ── Load tables ────────────────────────────────────────────────────────
  const loadTables = async () => {
    setLT(true); setError('')
    try {
      const r = await api.get('/schema/tables')
      setTables(r.data.data)
    } catch { setError('Failed to load tables. Is Laravel running?') }
    finally { setLT(false) }
  }
  useEffect(() => { loadTables() }, [])

  // ── Select table ───────────────────────────────────────────────────────
  const selectTable = async (table: string) => {
    setTable(table); setColumns([]); setSchemaFields([])
    setRows([]); setRowSchema(null); setError('')
    setLSch(false); setPage(1)
    setLC(true)
    try {
      const r = await api.get(`/schema/tables/${table}/columns`)
      setColumns(r.data.data)
    } catch { setError('Failed to load columns.') }
    finally { setLC(false) }
  }

  // ── Generate schema (schema mode) ─────────────────────────────────────
  const generateSchema = async () => {
    setLSch(true); setError('')
    try {
      const r = await api.get(`/schema/tables/${selectedTable}/generate`)
      setSchemaFields(mapFieldType(r.data.data.schema.fields))
      setSchemaName(r.data.data.name)
    } catch { setError('Failed to generate schema.') }
    finally { setLSch(false) }
  }

  // ── Load rows (data mode) ──────────────────────────────────────────────
  const loadRows = useCallback(async (pg = 1) => {
    if (!selectedTable) return
    setLR(true); setError('')
    try {
      const r = await api.get(`/schema/tables/${selectedTable}/rows?page=${pg}&per_page=10`)
      const d = r.data.data
      setRows(d.rows)
      setTotal(d.total)
      setTotalPages(d.last_page)
      setPage(d.page)
      // Derive columns from first row
      if (d.rows.length > 0) setRowCols(Object.keys(d.rows[0]))
    } catch { setError('Failed to load rows.') }
    finally { setLR(false) }
  }, [selectedTable])

  useEffect(() => {
    if (mode === 'data' && selectedTable) loadRows(1)
  }, [mode, selectedTable])

  // ── Generate form from a row ───────────────────────────────────────────
  const generateFromRow = async (rowId: any) => {
    setGRI(String(rowId)); setError('')
    try {
      const r = await api.get(`/schema/tables/${selectedTable}/rows/${rowId}/generate`)
      const d = r.data.data
      setRowSchema({ name: d.name, fields: mapFieldType(d.schema.fields), rowData: d.row_data })
    } catch { setError('Failed to generate form from row.') }
    finally { setGRI(null) }
  }

  // ── Open in builder ────────────────────────────────────────────────────
  const openInBuilder = async (fields: GeneratedField[], name: string) => {
    setImporting(true)
    try {
      const payload = {
        name,
        description: `Auto-generated from ${selectedTable} table`,
        schema: { fields, settings: { submitLabel: 'Submit', successMessage: 'Thank you!', showLabels: true } },
        settings: {},
      }
      const res = await api.post('/forms', payload)
      showToast('Form created! Opening builder…')
      setTimeout(() => router.push(`/builder/${res.data.data.id}`), 900)
    } catch { setError('Failed to create form.') }
    finally { setImporting(false) }
  }

  // ── Render ─────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen text-[#e2e8f0]"
      style={{ background: '#070b14', fontFamily: "'DM Sans',sans-serif" }}>

      {/* Grid bg */}
      <div className="fixed inset-0 pointer-events-none" style={{
        backgroundImage: 'linear-gradient(rgba(59,130,246,0.04) 1px,transparent 1px),linear-gradient(90deg,rgba(59,130,246,0.04) 1px,transparent 1px)',
        backgroundSize: '40px 40px'
      }} />

      {/* Header */}
      <header className="relative z-10 border-b border-[#1e2d45] bg-[#0d1424]/80 backdrop-blur-sm px-6 py-4 flex items-center gap-4">
        <button onClick={() => router.push('/')} className="p-2 rounded-lg hover:bg-[#1e2d45] text-[#64748b] hover:text-white transition-colors">
          <ArrowLeft size={18} />
        </button>
        <div className="w-9 h-9 rounded-xl flex items-center justify-center"
          style={{ background: 'linear-gradient(135deg,#3b82f6,#8b5cf6)' }}>
          <Database size={18} className="text-white" />
        </div>
        <div>
          <h1 className="font-bold text-white text-base leading-tight">DB → Form Generator</h1>
          <p className="text-xs text-[#64748b]">Generate forms from database tables & rows</p>
        </div>
      </header>

      <div className="relative z-10 flex h-[calc(100vh-65px)] overflow-hidden">

        {/* ── LEFT: Table List ────────────────────────────────────────── */}
        <aside className="w-56 flex-shrink-0 border-r border-[#1e2d45] bg-[#0a1020] flex flex-col overflow-hidden">
          <div className="px-4 py-3 border-b border-[#1e2d45] flex items-center justify-between">
            <span className="text-xs font-semibold text-[#64748b] uppercase tracking-wider">Tables</span>
            <button onClick={loadTables} disabled={loadingTables} className="p-1 rounded hover:bg-[#1e2d45] text-[#475569] hover:text-white transition-colors">
              <RefreshCw size={12} className={loadingTables ? 'animate-spin' : ''} />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto">
            {loadingTables ? (
              <div className="flex justify-center py-8"><Loader2 size={20} className="animate-spin text-[#3b82f6]" /></div>
            ) : tables.length === 0 ? (
              <div className="py-8 text-center text-[#475569] text-xs px-3"><Database size={24} className="mx-auto mb-2 opacity-30" />No tables found</div>
            ) : tables.map(t => (
              <button key={t} onClick={() => selectTable(t)}
                className={`w-full flex items-center gap-2.5 px-4 py-3 text-left transition-all border-l-2 ${
                  selectedTable === t ? 'bg-[#3b82f6]/10 border-[#3b82f6]' : 'border-transparent hover:bg-[#1e2d45]/50 hover:border-[#1e2d45]'
                }`}>
                <Table2 size={13} className={selectedTable === t ? 'text-[#3b82f6]' : 'text-[#475569]'} />
                <span className={`font-mono text-xs truncate ${selectedTable === t ? 'text-white font-semibold' : 'text-[#94a3b8]'}`}>{t}</span>
              </button>
            ))}
          </div>
          <div className="px-4 py-2 border-t border-[#1e2d45]">
            <span className="text-[10px] text-[#475569] font-mono">{tables.length} tables</span>
          </div>
        </aside>

        {/* ── MAIN CONTENT ────────────────────────────────────────────── */}
        <main className="flex-1 overflow-y-auto">
          {!selectedTable ? (
            // Empty state
            <div className="flex flex-col items-center justify-center h-full text-center px-4">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
                style={{ background: 'linear-gradient(135deg,#3b82f6,#8b5cf6)' }}>
                <Database size={28} className="text-white" />
              </div>
              <h2 className="text-lg font-semibold text-white mb-2">Select a Table</h2>
              <p className="text-[#475569] text-sm max-w-xs">Choose a table from the left to preview its structure and generate forms from schema or row data.</p>
            </div>
          ) : (
            <div className="p-6 flex flex-col gap-5">

              {/* Error */}
              {error && (
                <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-xl text-sm">
                  <AlertCircle size={15} />{error}
                </div>
              )}

              {/* Table header + mode toggle */}
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(59,130,246,0.12)' }}>
                    <Table2 size={15} className="text-[#3b82f6]" />
                  </div>
                  <div>
                    <h2 className="font-bold text-white font-mono">{selectedTable}</h2>
                    <p className="text-xs text-[#475569]">{columns.length} columns · {total} rows</p>
                  </div>
                </div>

                {/* Mode toggle */}
                <div className="flex items-center bg-[#0d1424] border border-[#1e2d45] rounded-xl p-1 gap-1">
                  <button onClick={() => setMode('schema')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      mode === 'schema' ? 'bg-[#3b82f6] text-white' : 'text-[#64748b] hover:text-white'}`}>
                    <Layers size={13} /> Schema Mode
                  </button>
                  <button onClick={() => { setMode('data'); loadRows(1) }}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      mode === 'data' ? 'bg-[#8b5cf6] text-white' : 'text-[#64748b] hover:text-white'}`}>
                    <Rows size={13} /> Data Mode
                  </button>
                </div>
              </div>

              {/* ── SCHEMA MODE ─────────────────────────────────────── */}
              {mode === 'schema' && (
                <div className="flex flex-col gap-5">
                  {/* Columns table */}
                  <div className="bg-[#0d1424] border border-[#1e2d45] rounded-2xl overflow-hidden">
                    <div className="px-5 py-3 border-b border-[#1e2d45] flex items-center justify-between">
                      <span className="text-sm font-semibold text-white">Column Structure</span>
                      <button onClick={generateSchema} disabled={loadingCols || loadingSchema}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all disabled:opacity-40"
                        style={{ background: 'linear-gradient(135deg,#3b82f6,#8b5cf6)', color: 'white' }}>
                        {loadingSchema ? <Loader2 size={13} className="animate-spin" /> : <Wand2 size={13} />}
                        Generate Form from Schema
                      </button>
                    </div>
                    {loadingCols ? (
                      <div className="flex justify-center py-10"><Loader2 size={22} className="animate-spin text-[#3b82f6]" /></div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b border-[#1e2d45]">
                              {['#','Column','DB Type','Nullable','Key'].map(h => (
                                <th key={h} className="text-left px-5 py-3 text-[10px] font-semibold text-[#475569] uppercase tracking-wider">{h}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-[#1e2d45]/40">
                            {columns.map((col, i) => (
                              <tr key={col.name} className="hover:bg-[#1e2d45]/20 transition-colors">
                                <td className="px-5 py-3 text-[#475569] font-mono text-xs">{i+1}</td>
                                <td className="px-5 py-3 font-mono text-xs font-semibold text-[#e2e8f0]">{col.name}</td>
                                <td className="px-5 py-3"><DbBadge type={col.type} /></td>
                                <td className="px-5 py-3"><NullBadge v={col.nullable} /></td>
                                <td className="px-5 py-3">
                                  {col.key === 'PRI' && <span className="text-[10px] px-2 py-0.5 rounded font-mono bg-[#f59e0b]/10 text-[#f59e0b] border border-[#f59e0b]/20">PK</span>}
                                  {col.key === 'UNI' && <span className="text-[10px] px-2 py-0.5 rounded font-mono bg-[#8b5cf6]/10 text-[#8b5cf6] border border-[#8b5cf6]/20">UNI</span>}
                                  {col.key === 'MUL' && <span className="text-[10px] px-2 py-0.5 rounded font-mono bg-[#3b82f6]/10 text-[#3b82f6] border border-[#3b82f6]/20">IDX</span>}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>

                  {/* Generated schema fields */}
                  {schemaFields.length > 0 && (
                    <div className="bg-[#0d1424] border border-[#1e2d45] rounded-2xl overflow-hidden">
                      <div className="px-5 py-3 border-b border-[#1e2d45] flex items-center justify-between flex-wrap gap-3">
                        <div className="flex items-center gap-2">
                          <Wand2 size={14} className="text-[#10b981]" />
                          <span className="text-sm font-semibold text-white">Generated Fields</span>
                          <span className="text-xs px-2 py-0.5 rounded-full bg-[#10b981]/10 text-[#10b981] border border-[#10b981]/20 font-mono">{schemaFields.length}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <input value={schemaName} onChange={e => setSchemaName(e.target.value)}
                            className="bg-[#111827] border border-[#1e2d45] rounded-lg px-3 py-1.5 text-sm text-white outline-none focus:border-[#3b82f6] w-44" />
                          <button onClick={() => openInBuilder(schemaFields, schemaName)} disabled={importing}
                            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold disabled:opacity-50"
                            style={{ background: 'linear-gradient(135deg,#10b981,#3b82f6)', color: 'white' }}>
                            {importing ? <Loader2 size={13} className="animate-spin" /> : <ArrowRight size={13} />}
                            Open in Builder
                          </button>
                        </div>
                      </div>
                      <div className="p-5 flex flex-wrap gap-3">
                        {schemaFields.map(f => {
                          const { icon: Icon, color } = fm(f.type)
                          return (
                            <div key={f.id} className="bg-[#111827] border border-[#1e2d45] rounded-xl p-3 hover:border-[#2d3f5e] transition-all"
                              style={{ width: 'calc(33.333% - 8px)', minWidth: '160px' }}>
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                  <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ background: color + '18' }}>
                                    <Icon size={11} style={{ color }} />
                                  </div>
                                  <span className="text-xs font-semibold text-white truncate max-w-[80px]">{f.label}</span>
                                </div>
                                <span className="font-mono text-[9px] font-bold px-1.5 py-0.5 rounded border"
                                  style={{ color, background: color + '15', borderColor: color + '40' }}>{f.type}</span>
                              </div>
                              <div className="space-y-1">
                                {f.validation?.required && <span className="inline-block text-[9px] px-1.5 py-0.5 rounded bg-[#ef4444]/10 text-[#ef4444] border border-[#ef4444]/20 font-mono">required</span>}
                                {f.options && <div className="text-[9px] text-[#475569]">{f.options.length} options</div>}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ── DATA MODE ───────────────────────────────────────── */}
              {mode === 'data' && (
                <div className="flex flex-col gap-5">
                  {/* Rows table */}
                  <div className="bg-[#0d1424] border border-[#1e2d45] rounded-2xl overflow-hidden">
                    <div className="px-5 py-3 border-b border-[#1e2d45] flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Rows size={14} className="text-[#8b5cf6]" />
                        <span className="text-sm font-semibold text-white">Table Data</span>
                        <span className="text-xs text-[#475569] font-mono">{total} rows total</span>
                      </div>
                      <button onClick={() => loadRows(page)} disabled={loadingRows}
                        className="p-1.5 rounded-lg hover:bg-[#1e2d45] text-[#64748b] hover:text-white transition-colors">
                        <RefreshCw size={13} className={loadingRows ? 'animate-spin' : ''} />
                      </button>
                    </div>

                    {loadingRows ? (
                      <div className="flex justify-center py-12"><Loader2 size={22} className="animate-spin text-[#8b5cf6]" /></div>
                    ) : rows.length === 0 ? (
                      <div className="py-10 text-center text-[#475569] text-sm">No rows found in this table.</div>
                    ) : (
                      <>
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="border-b border-[#1e2d45]">
                                {rowCols.map(col => (
                                  <th key={col} className="text-left px-4 py-3 text-[10px] font-semibold text-[#475569] uppercase tracking-wider whitespace-nowrap font-mono">{col}</th>
                                ))}
                                <th className="text-left px-4 py-3 text-[10px] font-semibold text-[#475569] uppercase tracking-wider">Action</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-[#1e2d45]/40">
                              {rows.map((row, ri) => (
                                <tr key={ri} className="hover:bg-[#1e2d45]/20 transition-colors group">
                                  {rowCols.map(col => (
                                    <td key={col} className="px-4 py-3 font-mono text-xs text-[#94a3b8] max-w-[140px]">
                                      <span className="block truncate" title={String(row[col] ?? '')}>
                                        {row[col] === null ? <span className="text-[#334155] italic">null</span> :
                                         row[col] === true || row[col] === 1 ? <span className="text-[#10b981]">true</span> :
                                         row[col] === false || row[col] === 0 ? <span className="text-[#ef4444]">false</span> :
                                         String(row[col]).length > 24 ? String(row[col]).slice(0, 24) + '…' : String(row[col])}
                                      </span>
                                    </td>
                                  ))}
                                  <td className="px-4 py-3">
                                    <button
                                      onClick={() => generateFromRow(row.id ?? row[rowCols[0]])}
                                      disabled={generatingRowId === String(row.id ?? row[rowCols[0]])}
                                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all disabled:opacity-50 whitespace-nowrap"
                                      style={{ background: 'rgba(139,92,246,0.12)', color: '#8b5cf6', border: '1px solid rgba(139,92,246,0.25)' }}
                                    >
                                      {generatingRowId === String(row.id ?? row[rowCols[0]])
                                        ? <Loader2 size={11} className="animate-spin" />
                                        : <Zap size={11} />}
                                      Generate Form
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>

                        {/* Pagination */}
                        <div className="px-5 py-3 border-t border-[#1e2d45] flex items-center justify-between">
                          <span className="text-xs text-[#475569] font-mono">
                            Page {page} of {totalPages} · {total} rows
                          </span>
                          <div className="flex items-center gap-2">
                            <button onClick={() => loadRows(page - 1)} disabled={page <= 1 || loadingRows}
                              className="p-1.5 rounded-lg hover:bg-[#1e2d45] text-[#64748b] hover:text-white disabled:opacity-30 transition-colors">
                              <ChevronLeft size={14} />
                            </button>
                            <div className="flex gap-1">
                              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                                const p = i + 1
                                return (
                                  <button key={p} onClick={() => loadRows(p)}
                                    className={`w-7 h-7 rounded-lg text-xs font-mono transition-all ${page === p ? 'bg-[#8b5cf6] text-white' : 'text-[#64748b] hover:bg-[#1e2d45] hover:text-white'}`}>
                                    {p}
                                  </button>
                                )
                              })}
                              {totalPages > 5 && <span className="text-[#475569] text-xs flex items-end pb-1">…</span>}
                            </div>
                            <button onClick={() => loadRows(page + 1)} disabled={page >= totalPages || loadingRows}
                              className="p-1.5 rounded-lg hover:bg-[#1e2d45] text-[#64748b] hover:text-white disabled:opacity-30 transition-colors">
                              <ChevronRight size={14} />
                            </button>
                          </div>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Row-generated form preview */}
                  {rowSchema && (
                    <div className="bg-[#0d1424] border border-[#8b5cf6]/30 rounded-2xl overflow-hidden">
                      <div className="px-5 py-3 border-b border-[#1e2d45] flex items-center justify-between flex-wrap gap-3">
                        <div className="flex items-center gap-2">
                          <Zap size={14} className="text-[#8b5cf6]" />
                          <span className="text-sm font-semibold text-white">{rowSchema.name}</span>
                          <span className="text-xs px-2 py-0.5 rounded-full bg-[#8b5cf6]/10 text-[#8b5cf6] border border-[#8b5cf6]/20 font-mono">{rowSchema.fields.length} fields</span>
                        </div>
                        <button onClick={() => openInBuilder(rowSchema.fields, rowSchema.name)} disabled={importing}
                          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold disabled:opacity-50"
                          style={{ background: 'linear-gradient(135deg,#8b5cf6,#3b82f6)', color: 'white' }}>
                          {importing ? <Loader2 size={13} className="animate-spin" /> : <ArrowRight size={13} />}
                          Open in Builder (Pre-filled)
                        </button>
                      </div>

                      {/* Real form preview with actual values */}
                      <div className="p-6 bg-white rounded-b-2xl">
                        <FormRenderer
                          schema={{ fields: rowSchema.fields as any, settings: { submitLabel: 'Update', successMessage: 'Updated!', showLabels: true } }}
                          formName={rowSchema.name}
                          onSubmit={async () => {}}
                          previewOnly={true}
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </main>
      </div>

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 flex items-center gap-2 bg-[#0d1424] border border-[#10b981]/30 text-[#10b981] px-4 py-3 rounded-xl shadow-2xl text-sm font-medium z-50">
          <CheckCircle2 size={15} />{toast}
        </div>
      )}
    </div>
  )
}