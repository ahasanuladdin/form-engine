'use client'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { formsApi, submissionsApi } from '@/lib/api'
import { Form } from '@/types'
import FormRenderer from '@/components/FormRenderer'
import { Loader2, FileText } from 'lucide-react'

export default function PublicFormPage() {
  const params = useParams()
  const slug   = params.slug as string
  const [form, setForm]     = useState<Form | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]   = useState('')

  useEffect(() => {
    formsApi.getBySlug(slug)
      .then(res => setForm(res.data.data))
      .catch(() => setError('Form not found or not available'))
      .finally(() => setLoading(false))
  }, [slug])

  const handleSubmit = async (data: Record<string, any>) => {
    if (!form) return
    await submissionsApi.submit(form.id, data)
  }

  if (loading) return (
    <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center">
      <Loader2 className="animate-spin text-[#6366f1]" size={28} />
    </div>
  )

  if (error || !form) return (
    <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center text-center p-6">
      <div>
        <div className="w-14 h-14 rounded-2xl bg-red-50 flex items-center justify-center mx-auto mb-4">
          <FileText size={24} className="text-red-400" />
        </div>
        <h2 className="text-lg font-semibold text-[#0f172a] mb-2">Form Not Found</h2>
        <p className="text-sm text-[#64748b]">This form is not available or has been unpublished.</p>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-[#f8fafc] py-12 px-4">
      <div className="max-w-xl mx-auto">
        {/* Form card */}
        <div className="bg-white rounded-2xl shadow-card-lg border border-[#e2e8f0] overflow-hidden">
          {/* Header accent */}
          <div className="h-2 bg-gradient-to-r from-[#6366f1] to-[#8b5cf6]" />

          <div className="p-8">
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-[#0f172a]">{form.name}</h1>
              {form.description && (
                <p className="text-[#64748b] text-sm mt-2 leading-relaxed">{form.description}</p>
              )}
            </div>

            <FormRenderer
              schema={form.schema}
              formName={form.name}
              onSubmit={handleSubmit}
            />
          </div>
        </div>

        <p className="text-center text-xs text-[#94a3b8] mt-6">
          Powered by <span className="font-semibold text-[#6366f1]">FormEngine</span>
        </p>
      </div>
    </div>
  )
}
