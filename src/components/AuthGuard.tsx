'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/authStore'

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const router   = useRouter()
  const isLoggedIn = useAuthStore((s) => s.isLoggedIn)

  useEffect(() => {
    if (!isLoggedIn()) {
      router.replace('/login')
    }
  }, [isLoggedIn, router])

  if (!isLoggedIn()) return null   // blank while redirecting

  return <>{children}</>
}