'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { formsApi } from '@/lib/api'
import { Form } from '@/types'
import { useTheme } from '@/components/ThemeProvider'
import {
  Plus, FileText, Eye, Edit2, Trash2,
  BarChart2, Globe, Clock, CheckCircle, XCircle, Database, Moon, Sun,
} from 'lucide-react'

export default function HomePage() {
  const [forms, setForms]   = useState<Form[]>([])
  const [loading, setLoading] = useState(true)
  const { theme, toggleTheme } = useTheme()

  const load = async () => {
    try {
      const res = await formsApi.list()
      setForms(res.data.data)
    } catch { /* backend not running */ }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this form?')) return
    await formsApi.delete(id)
    load()
  }

  const handlePublish = async (form: Form) => {
    if (form.is_published) await formsApi.unpublish(form.id)
    else                    await formsApi.publish(form.id)
    load()
  }

  return (
    <div className="min-h-screen bg-[var(--surface)]">
      {/* Header */}
      <header className="bg-[var(--panel-bg)] border-b border-[var(--border)] sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[var(--brand)] flex items-center justify-center">
              <FileText size={16} className="text-white" />
            </div>
            <span className="font-semibold text-[var(--text)] text-lg tracking-tight">FormEngine</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={toggleTheme}
              title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
              className="p-2 rounded-lg border border-[var(--border)] text-[var(--muted)] hover:bg-[var(--surface-2)] transition-colors"
            >
              {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
            </button>
            <Link
              href="/db-import"
              className="flex items-center gap-2 px-4 py-2 bg-[var(--surface-2)] text-[var(--muted)] border border-[var(--border)] rounded-lg text-sm font-medium hover:text-[var(--text)] transition-colors"
            >
              <Database size={16} />
              Import from DB
            </Link>
            <Link
              href="/builder/new"
              className="flex items-center gap-2 px-4 py-2 bg-[var(--brand)] text-white rounded-lg text-sm font-medium hover:bg-[var(--brand-dark)] transition-colors"
            >
              <Plus size={16} />
              New Form
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { label: 'Total Forms',       value: forms.length,                                   icon: FileText,     color: '#6366f1' },
            { label: 'Published',         value: forms.filter(f => f.is_published).length,        icon: Globe,        color: '#10b981' },
            { label: 'Total Submissions', value: forms.reduce((a, f) => a + (f.submissions_count || 0), 0), icon: BarChart2, color: '#f59e0b' },
          ].map(s => (
            <div key={s.label} className="bg-[var(--card-bg)] rounded-xl border border-[var(--border)] p-5 flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: s.color + '18' }}>
                <s.icon size={20} style={{ color: s.color }} />
              </div>
              <div>
                <div className="text-2xl font-bold text-[var(--text)]">{s.value}</div>
                <div className="text-xs text-[var(--muted)] mt-0.5">{s.label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Forms list */}
        <div className="bg-[var(--card-bg)] rounded-xl border border-[var(--border)] overflow-hidden">
          <div className="px-6 py-4 border-b border-[var(--border)] flex items-center justify-between">
            <h2 className="font-semibold text-[var(--text)]">All Forms</h2>
            <span className="text-sm text-[var(--muted)]">{forms.length} forms</span>
          </div>

          {loading ? (
            <div className="py-20 text-center text-[var(--muted)]">Loading…</div>
          ) : forms.length === 0 ? (
            <div className="py-20 text-center">
              <div className="w-14 h-14 rounded-2xl bg-[#eef2ff] dark:bg-[#1e1b4b] flex items-center justify-center mx-auto mb-4">
                <FileText size={28} className="text-[var(--brand)]" />
              </div>
              <p className="font-medium text-[var(--text)] mb-1">No forms yet</p>
              <p className="text-sm text-[var(--muted)] mb-4">Create your first form to get started</p>
              <Link
                href="/builder/new"
                className="inline-flex items-center gap-2 px-4 py-2 bg-[var(--brand)] text-white rounded-lg text-sm font-medium hover:bg-[var(--brand-dark)] transition-colors"
              >
                <Plus size={15} /> Create Form
              </Link>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="bg-[var(--surface-2)] text-xs text-[var(--muted)] uppercase tracking-wide">
                  <th className="text-left px-6 py-3 font-medium">Form Name</th>
                  <th className="text-left px-6 py-3 font-medium">Status</th>
                  <th className="text-left px-6 py-3 font-medium">Submissions</th>
                  <th className="text-left px-6 py-3 font-medium">Updated</th>
                  <th className="text-right px-6 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {forms.map(form => (
                  <tr key={form.id} className="hover:bg-[var(--surface-2)] transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-medium text-[var(--text)] text-sm">{form.name}</div>
                      {form.description && (
                        <div className="text-xs text-[var(--muted)] mt-0.5 line-clamp-1">{form.description}</div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => handlePublish(form)}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                          form.is_published
                            ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100'
                            : 'bg-[var(--surface-2)] text-[var(--muted)] hover:bg-[var(--border)]'
                        }`}
                      >
                        {form.is_published
                          ? <><CheckCircle size={11} /> Published</>
                          : <><XCircle size={11} /> Draft</>
                        }
                      </button>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 text-sm text-[var(--muted)]">
                        <BarChart2 size={14} />
                        {form.submissions_count ?? 0}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 text-xs text-[var(--muted)]">
                        <Clock size={12} />
                        {new Date(form.updated_at).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1 justify-end">
                        <Link
                          href={`/forms/${form.slug}`}
                          className="p-1.5 rounded-md hover:bg-[var(--surface-2)] text-[var(--muted)] transition-colors"
                          title="Preview"
                        >
                          <Eye size={15} />
                        </Link>
                        <Link
                          href={`/builder/${form.id}`}
                          className="p-1.5 rounded-md hover:bg-[#eef2ff] dark:hover:bg-[#1e1b4b] text-[var(--brand)] transition-colors"
                          title="Edit"
                        >
                          <Edit2 size={15} />
                        </Link>
                        <Link
                          href={`/submissions/${form.id}`}
                          className="p-1.5 rounded-md hover:bg-[#f0fdf4] dark:hover:bg-emerald-900/20 text-[#10b981] transition-colors"
                          title="Submissions"
                        >
                          <BarChart2 size={15} />
                        </Link>
                        <button
                          onClick={() => handleDelete(form.id)}
                          className="p-1.5 rounded-md hover:bg-red-50 dark:hover:bg-red-900/20 text-[#ef4444] transition-colors"
                          title="Delete"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </main>
    </div>
  )
}
