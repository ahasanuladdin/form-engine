import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface AdminUser {
  id: number
  name: string
  email: string
  bio?: string
}

interface AuthState {
  token: string | null
  user: AdminUser | null
  setAuth: (token: string, user: AdminUser) => void
  clearAuth: () => void
  isLoggedIn: () => boolean
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      user: null,
      setAuth: (token, user) => set({ token, user }),
      clearAuth: () => set({ token: null, user: null }),
      isLoggedIn: () => !!get().token,
    }),
    { name: 'admin-auth' }   // saved in localStorage as "admin-auth"
  )
)