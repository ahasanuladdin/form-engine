// lib/api.ts  ← REPLACE your existing file with this
import axios from 'axios'
import { useAuthStore } from '@/store/authStore'

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api',
  headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
})

// ── Attach Bearer token to every request automatically ──────────────────────
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// ── On 401, clear auth and redirect to /login ────────────────────────────────
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      useAuthStore.getState().clearAuth()
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

// ── Auth ─────────────────────────────────────────────────────────────────────
export const authApi = {
  login:  (email: string, password: string) =>
    api.post('/admin/login', { email, password }),
  logout: () => api.post('/admin/logout'),
}

// ── Forms ────────────────────────────────────────────────────────────────────
export const formsApi = {
  list:      ()                      => api.get('/forms'),
  get:       (id: number)            => api.get(`/forms/${id}`),
  getBySlug: (slug: string)          => api.get(`/forms/slug/${slug}`),
  create:    (data: any)             => api.post('/forms', data),
  update:    (id: number, data: any) => api.put(`/forms/${id}`, data),
  delete:    (id: number)            => api.delete(`/forms/${id}`),
  publish:   (id: number)            => api.post(`/forms/${id}/publish`),
  unpublish: (id: number)            => api.post(`/forms/${id}/unpublish`),
}

// ── Submissions ───────────────────────────────────────────────────────────────
export const submissionsApi = {
  list:   (formId: number)           => api.get(`/forms/${formId}/submissions`),
  submit: (formId: number, data: any) => api.post(`/forms/${formId}/submit`, { data }),
  delete: (id: number)               => api.delete(`/submissions/${id}`),
}