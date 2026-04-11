import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,

      setAuth: ({ user, access_token, refresh_token }) => {
        localStorage.setItem('access_token', access_token)
        localStorage.setItem('refresh_token', refresh_token)
        set({ user, accessToken: access_token, refreshToken: refresh_token, isAuthenticated: true })
      },

      updateUser: (user) => set({ user }),

      logout: () => {
        localStorage.removeItem('access_token')
        localStorage.removeItem('refresh_token')
        set({ user: null, accessToken: null, refreshToken: null, isAuthenticated: false })
      },

      isOnboardingComplete: () => get().user?.onboarding_completed ?? false,
      isFemale: () => get().user?.gender === 'female',
      getMadhab: () => get().user?.madhab ?? 'hanafi',
      hasLocation: () => !!(get().user?.latitude && get().user?.longitude),
    }),
    {
      name: 'deen-auth',
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
)
