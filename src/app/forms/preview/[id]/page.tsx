'use client'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { formsApi } from '@/lib/api'
import { Form } from '@/types'
import FormRenderer from '@/components/FormRenderer'
import { Loader2, ArrowLeft, ExternalLink, Edit2, Monitor, Tablet, Smartphone } from 'lucide-react'
import Link from 'next/link'

export default function PreviewPage() {
  const { id }  = useParams()
  const [form, setForm]       = useState<Form | null>(null)
  const [loading, setLoading] = useState(true)
  const [viewport, setViewport] = useState<'desktop' | 'tablet' | 'mobile'>('desktop')

  useEffect(() => {
    formsApi.get(Number(id))
      .then(res => setForm(res.data.data))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-[#f8fafc]">
      <Loader2 className="animate-spin text-[#6366f1]" size={28} />
    </div>
  )

  if (!form) return null

  const viewportWidth = viewport === 'desktop' ? '860px' : viewport === 'tablet' ? '768px' : '375px'

  return (
    <div className="min-h-screen bg-[#f8fafc]">
      {/* Preview banner */}
      <div className="bg-[#0f172a] text-white px-6 py-2.5 flex items-center justify-between text-sm">
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-1.5 hover:text-[#a5b4fc] transition-colors">
            <ArrowLeft size={14} />
            Dashboard
          </Link>
          <span className="text-[#475569]">•</span>
          <Link href={`/builder/${form.id}`} className="flex items-center gap-1.5 hover:text-[#a5b4fc] transition-colors text-[#94a3b8]">
            <Edit2 size={13} />
            Edit form
          </Link>
          <span className="text-[#475569]">•</span>
          <span className="text-[#94a3b8]">Preview Mode</span>
        </div>

        {/* Viewport switcher */}
        <div className="flex items-center bg-white/10 rounded-lg p-0.5 gap-0.5">
          {([
            { key: 'desktop' as const, icon: Monitor,    title: 'Desktop' },
            { key: 'tablet'  as const, icon: Tablet,     title: 'Tablet (768px)' },
            { key: 'mobile'  as const, icon: Smartphone, title: 'Mobile (375px)' },
          ]).map(({ key, icon: Icon, title }) => (
            <button
              key={key}
              title={title}
              onClick={() => setViewport(key)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                viewport === key
                  ? 'bg-white/20 text-white'
                  : 'text-[#94a3b8] hover:text-white'
              }`}
            >
              <Icon size={14} />
              <span className="hidden sm:block">{title}</span>
            </button>
          ))}
        </div>

        {form.is_published && (
          <a
            href={`/forms/${form.slug}`}
            target="_blank"
            className="flex items-center gap-1.5 text-[#a5b4fc] hover:text-white transition-colors"
          >
            <ExternalLink size={13} /> View live form
          </a>
        )}
      </div>

      {/* Viewport size label */}
      {viewport !== 'desktop' && (
        <div className="flex justify-center pt-4">
          <span className="px-3 py-1 rounded-full bg-[#e2e8f0] text-[#64748b] text-xs font-mono">
            {viewport === 'tablet' ? '768px — Tablet view' : '375px — Mobile view'}
          </span>
        </div>
      )}

      <div className={viewport === 'desktop' ? 'py-8 px-6' : 'py-8 px-4'}>
        <div
          className="mx-auto transition-all duration-300"
          style={
            viewport === 'desktop'
              ? { width: '100%' }
              : { width: viewport === 'tablet' ? '768px' : '375px', maxWidth: '100%' }
          }
        >
          {/* Device chrome for non-desktop */}
          {viewport !== 'desktop' && (
            <div className={`px-4 py-2 flex items-center gap-2 ${viewport === 'mobile' ? 'bg-[#1e293b] rounded-t-3xl' : 'bg-[#1e293b] rounded-t-2xl'}`}>
              <div className="w-2 h-2 rounded-full bg-red-400" />
              <div className="w-2 h-2 rounded-full bg-yellow-400" />
              <div className="w-2 h-2 rounded-full bg-green-400" />
              <div className="flex-1 mx-4 bg-[#0f172a] rounded-full h-5 flex items-center justify-center">
                <span className="text-[10px] text-[#475569] font-mono">form preview</span>
              </div>
            </div>
          )}

          <div className={`bg-white shadow-card-lg border border-[#e2e8f0] overflow-hidden ${
            viewport !== 'desktop'
              ? 'border-x border-b border-[#1e293b] rounded-b-2xl'
              : 'rounded-2xl'
          }`}>
            <div className="h-2 bg-gradient-to-r from-[#6366f1] to-[#8b5cf6]" />
            <div className="p-8">
              <h1 className="text-2xl font-bold text-[#0f172a] mb-1">{form.name}</h1>
              {form.description && <p className="text-[#64748b] text-sm mb-6">{form.description}</p>}
              <FormRenderer
                schema={form.schema}
                formName={form.name}
                onSubmit={async () => { alert('Preview mode — submissions disabled') }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}