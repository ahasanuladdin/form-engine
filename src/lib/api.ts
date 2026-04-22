import axios from 'axios'

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api',
  headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
})

// Forms
export const formsApi = {
  list:      ()                  => api.get('/forms'),
  get:       (id: number)        => api.get(`/forms/${id}`),
  getBySlug: (slug: string)      => api.get(`/forms/slug/${slug}`),
  create:    (data: any)         => api.post('/forms', data),
  update:    (id: number, data: any) => api.put(`/forms/${id}`, data),
  delete:    (id: number)        => api.delete(`/forms/${id}`),
  publish:   (id: number)        => api.post(`/forms/${id}/publish`),
  unpublish: (id: number)        => api.post(`/forms/${id}/unpublish`),
}

// Submissions
export const submissionsApi = {
  list:   (formId: number) => api.get(`/forms/${formId}/submissions`),
  submit: (formId: number, data: any) => api.post(`/forms/${formId}/submit`, { data }),
  delete: (id: number)     => api.delete(`/submissions/${id}`),
}
