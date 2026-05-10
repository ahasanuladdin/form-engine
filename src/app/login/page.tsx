'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { authApi } from '@/lib/api'
import { useAuthStore } from '@/store/authStore'
import { FileText, Mail, Lock, LogIn, AlertCircle } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const setAuth = useAuthStore((s) => s.setAuth)

  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [error,    setError]    = useState('')
  const [loading,  setLoading]  = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res  = await authApi.login(email, password)
      const json = res.data
      if (!json.status) { setError(json.message || 'Login failed'); return }
      setAuth(json.access_token, json.data)
      router.replace('/')
    } catch (err: any) {
      setError(
        err.response?.data?.message ||
        'Cannot reach the server. Is your backend running?'
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[var(--surface)] flex items-center justify-center p-4">
      <div className="w-full max-w-sm">

        {/* Brand */}
        <div className="flex items-center gap-2.5 justify-center mb-8">
          <div className="w-9 h-9 rounded-xl bg-[var(--brand)] flex items-center justify-center">
            <FileText size={18} className="text-white" />
          </div>
          <span className="text-xl font-semibold text-[var(--text)] tracking-tight">
            FormEngine
          </span>
        </div>

        {/* Card */}
        <div className="bg-[var(--card-bg)] rounded-2xl border border-[var(--border)] p-8">
          <h1 className="text-lg font-semibold text-[var(--text)] mb-1">Sign in</h1>
          <p className="text-sm text-[var(--muted)] mb-6">
            Enter your admin credentials to continue
          </p>

          {error && (
            <div className="flex items-start gap-2.5 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 rounded-lg px-3.5 py-3 text-sm mb-4">
              <AlertCircle size={15} className="mt-0.5 flex-shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            {/* Email */}
            <div>
              <label
                htmlFor="email"
                className="block text-xs font-medium text-[var(--muted)] mb-1.5"
              >
                Email address
              </label>
              <div className="relative">
                <Mail
                  size={15}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)] pointer-events-none"
                />
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter Your Email"
                  className="w-full pl-9 pr-3 py-2.5 text-sm rounded-lg border border-[var(--border)]
                             bg-[var(--input-bg)] text-[var(--text)] placeholder:text-[var(--muted)]
                             focus:outline-none focus:ring-2 focus:ring-[var(--brand)]/30
                             focus:border-[var(--brand)] transition-all"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label
                htmlFor="password"
                className="block text-xs font-medium text-[var(--muted)] mb-1.5"
              >
                Password
              </label>
              <div className="relative">
                <Lock
                  size={15}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)] pointer-events-none"
                />
                <input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-3 py-2.5 text-sm rounded-lg border border-[var(--border)]
                             bg-[var(--input-bg)] text-[var(--text)] placeholder:text-[var(--muted)]
                             focus:outline-none focus:ring-2 focus:ring-[var(--brand)]/30
                             focus:border-[var(--brand)] transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg
                         bg-[var(--brand)] hover:bg-[var(--brand-dark)] text-white text-sm font-medium
                         transition-colors disabled:opacity-60 disabled:cursor-not-allowed mt-2"
            >
              <LogIn size={15} />
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>
        </div>

      </div>
    </div>
  )
}