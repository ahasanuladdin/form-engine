'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { formsApi, submissionsApi } from '@/lib/api'
import { Form, FormSubmission, FormField } from '@/types'
import { ArrowLeft, Trash2, Download, BarChart2, Loader2, Inbox } from 'lucide-react'

// Field types that are actual user inputs (have submission data)
const INPUT_TYPES = new Set([
  'text_field', 'checkbox', 'date_picker', 'radio_group', 'radio_item',
  'select', 'switch', 'uploader',
])

// Collect ALL input fields from both top-level fields and all sections
function collectInputFields(form: Form): FormField[] {
  const schema = form.schema
  const allFields: FormField[] = [
    ...(schema.fields || []),
    ...(schema.sections || []).flatMap(s => s.fields),
  ]
  return allFields.filter(f => INPUT_TYPES.has(f.type))
}

export default function SubmissionsPage() {
  const { id }  = useParams()
  const router  = useRouter()
  const [form, setForm]               = useState<Form | null>(null)
  const [submissions, setSubmissions] = useState<FormSubmission[]>([])
  const [loading, setLoading]         = useState(true)
  const [selected, setSelected]       = useState<FormSubmission | null>(null)

  const load = async () => {
    const [fRes, sRes] = await Promise.all([
      formsApi.get(Number(id)),
      submissionsApi.list(Number(id)),
    ])
    setForm(fRes.data.data)
    setSubmissions(sRes.data.data || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [id])

  const handleDelete = async (sid: number) => {
    if (!confirm('Delete this submission?')) return
    await submissionsApi.delete(sid)
    setSelected(null)
    load()
  }

  const exportCsv = () => {
    if (!form || !submissions.length) return
    const fields = collectInputFields(form)
    const header = ['ID', 'Date', ...fields.map(f => f.label)]
    const rows   = submissions.map(s => [
      s.id,
      new Date(s.created_at).toLocaleString(),
      ...fields.map(f => {
        const v = s.data[f.id]
        return v !== undefined && v !== null ? String(v) : ''
      }),
    ])
    const csv  = [header, ...rows].map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href = url; a.download = `${form.name}-submissions.csv`; a.click()
  }

  const inputFields = form ? collectInputFields(form) : []

  if (loading) return (
    <div className="h-screen flex items-center justify-center bg-[#f8fafc]">
      <Loader2 className="animate-spin text-[#6366f1]" size={28} />
    </div>
  )

  return (
    <div className="min-h-screen bg-[#f8fafc]">
      {/* Header */}
      <header className="bg-white border-b border-[#e2e8f0] sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-6 h-14 flex items-center gap-4">
          <button onClick={() => router.push('/')} className="p-1.5 rounded-lg hover:bg-[#f1f5f9] text-[#64748b]">
            <ArrowLeft size={18} />
          </button>
          <div className="flex items-center gap-2 flex-1">
            <BarChart2 size={16} className="text-[#6366f1]" />
            <span className="font-semibold text-[#0f172a] text-sm">{form?.name}</span>
            <span className="text-xs text-[#94a3b8]">— Submissions</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-[#64748b]">{submissions.length} total</span>
            <button
              onClick={exportCsv}
              disabled={!submissions.length}
              className="flex items-center gap-1.5 px-3 py-1.5 border border-[#e2e8f0] rounded-lg text-xs text-[#64748b] hover:bg-[#f8fafc] transition-colors disabled:opacity-40"
            >
              <Download size={13} /> Export CSV
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-6 flex gap-6">
        {/* Table */}
        <div className="flex-1 bg-white rounded-xl border border-[#e2e8f0] overflow-hidden">
          {submissions.length === 0 ? (
            <div className="py-20 text-center">
              <Inbox size={36} className="text-[#cbd5e1] mx-auto mb-3" />
              <p className="font-medium text-[#94a3b8]">No submissions yet</p>
              <p className="text-xs text-[#cbd5e1] mt-1">Share your form to start collecting responses</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[#f8fafc] text-xs text-[#64748b] uppercase tracking-wide border-b border-[#f1f5f9]">
                    <th className="text-left px-4 py-3 font-medium">#</th>
                    <th className="text-left px-4 py-3 font-medium">Date</th>
                    {inputFields.slice(0, 3).map(f => (
                      <th key={f.id} className="text-left px-4 py-3 font-medium truncate max-w-[120px]">{f.label}</th>
                    ))}
                    {inputFields.length > 3 && <th className="px-4 py-3 font-medium">+{inputFields.length - 3} more</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#f8fafc]">
                  {submissions.map(s => (
                    <tr
                      key={s.id}
                      onClick={() => setSelected(s)}
                      className={`cursor-pointer hover:bg-[#f8fafc] transition-colors ${selected?.id === s.id ? 'bg-[#eef2ff]' : ''}`}
                    >
                      <td className="px-4 py-3 text-[#94a3b8] font-mono text-xs">{s.id}</td>
                      <td className="px-4 py-3 text-[#64748b] text-xs whitespace-nowrap">
                        {new Date(s.created_at).toLocaleString()}
                      </td>
                      {inputFields.slice(0, 3).map(f => (
                        <td key={f.id} className="px-4 py-3 text-[#374151] truncate max-w-[150px]">
                          {String(s.data[f.id] ?? '—')}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Detail panel */}
        {selected && (
          <div className="w-80 flex-shrink-0 bg-white rounded-xl border border-[#e2e8f0] p-5 h-fit sticky top-20">
            <div className="flex items-center justify-between mb-4">
              <span className="font-semibold text-[#0f172a] text-sm">Submission #{selected.id}</span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => handleDelete(selected.id)}
                  className="p-1.5 rounded-lg hover:bg-red-50 text-[#94a3b8] hover:text-red-500 transition-colors"
                >
                  <Trash2 size={14} />
                </button>
                <button
                  onClick={() => setSelected(null)}
                  className="p-1.5 rounded-lg hover:bg-[#f1f5f9] text-[#94a3b8] transition-colors"
                >
                  ✕
                </button>
              </div>
            </div>
            <p className="text-xs text-[#94a3b8] mb-4">
              {new Date(selected.created_at).toLocaleString()}
            </p>
            <div className="space-y-3 max-h-[70vh] overflow-y-auto pr-1">
              {/* Group by section if sections exist */}
              {form?.schema.sections && form.schema.sections.length > 0 ? (
                <>
                  {form.schema.sections.map(sec => {
                    const secFields = sec.fields.filter(f => INPUT_TYPES.has(f.type))
                    if (!secFields.length) return null
                    return (
                      <div key={sec.id}>
                        <p className="text-[10px] font-bold uppercase tracking-wider text-[#6366f1] mb-2 mt-1">{sec.title}</p>
                        <div className="space-y-2.5">
                          {secFields.map(f => (
                            <div key={f.id}>
                              <p className="text-xs font-medium text-[#94a3b8] mb-0.5">{f.label}</p>
                              <p className="text-sm text-[#374151] break-words">
                                {selected.data[f.id] !== undefined && selected.data[f.id] !== ''
                                  ? String(selected.data[f.id])
                                  : <span className="text-[#d1d5db]">—</span>
                                }
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )
                  })}
                  {/* Top-level fields (not in any section) */}
                  {(form.schema.fields || []).filter(f => INPUT_TYPES.has(f.type)).map(f => (
                    <div key={f.id}>
                      <p className="text-xs font-medium text-[#94a3b8] mb-0.5">{f.label}</p>
                      <p className="text-sm text-[#374151] break-words">
                        {selected.data[f.id] !== undefined && selected.data[f.id] !== ''
                          ? String(selected.data[f.id])
                          : <span className="text-[#d1d5db]">—</span>
                        }
                      </p>
                    </div>
                  ))}
                </>
              ) : (
                inputFields.map(f => (
                  <div key={f.id}>
                    <p className="text-xs font-medium text-[#94a3b8] mb-0.5">{f.label}</p>
                    <p className="text-sm text-[#374151] break-words">
                      {selected.data[f.id] !== undefined && selected.data[f.id] !== ''
                        ? String(selected.data[f.id])
                        : <span className="text-[#d1d5db]">—</span>
                      }
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}