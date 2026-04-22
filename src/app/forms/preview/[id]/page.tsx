'use client'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { formsApi } from '@/lib/api'
import { Form } from '@/types'
import FormRenderer from '@/components/FormRenderer'
import { Loader2, ArrowLeft, ExternalLink } from 'lucide-react'
import Link from 'next/link'

export default function PreviewPage() {
  const { id }  = useParams()
  const [form, setForm]     = useState<Form | null>(null)
  const [loading, setLoading] = useState(true)

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

  return (
    <div className="min-h-screen bg-[#f8fafc]">
      {/* Preview banner */}
      <div className="bg-[#0f172a] text-white px-6 py-2.5 flex items-center justify-between text-sm">
        <div className="flex items-center gap-3">
          <Link href={`/builder/${form.id}`} className="flex items-center gap-1.5 hover:text-[#a5b4fc] transition-colors">
            <ArrowLeft size={14} />
            Back to editor
          </Link>
          <span className="text-[#475569]">•</span>
          <span className="text-[#94a3b8]">Preview Mode</span>
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

      <div className="py-12 px-4">
        <div className="max-w-xl mx-auto">
          <div className="bg-white rounded-2xl shadow-card-lg border border-[#e2e8f0] overflow-hidden">
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
