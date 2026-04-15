import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const useAppStore = create(
  persist(
    (set) => ({
      sidebarOpen: true,
      sidebarCollapsed: false,
      activeConversationId: null,

      toggleSidebar:     () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
      setSidebarOpen:    (open) => set({ sidebarOpen: open }),
      toggleCollapsed:   () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
      setCollapsed:      (val) => set({ sidebarCollapsed: val }),
      setActiveConversation: (id) => set({ activeConversationId: id }),
    }),
    {
      name: 'deen-app-v2',
      onRehydrateStorage: () => (state) => {
        // Close sidebar on mobile by default
        if (typeof window !== 'undefined' && window.matchMedia('(max-width: 768px)').matches) {
          state?.setSidebarOpen(false)
        }
      },
    }
  )
)
