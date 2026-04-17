import React, { useEffect } from 'react'
import { createFileRoute, redirect, useNavigate } from '@tanstack/react-router'
import { useAuthStore } from '@/store/authStore'
import { Sidebar } from '@/components/layout/Sidebar'
import { BottomNav } from '@/components/layout/BottomNav'
import { MobileHeader } from '@/components/layout/MobileHeader'
import { SeasonalPrompt } from '@/components/layout/SeasonalPrompt'
import { useThemeStore } from '@/store/themeStore'
import { Outlet } from '@tanstack/react-router'

export const Route = createFileRoute('/_authenticated')({
  beforeLoad: () => {
    const { isAuthenticated, user } = useAuthStore.getState()
    if (!isAuthenticated) {
      throw redirect({ to: '/login' })
    }
    if (isAuthenticated && user && !user.onboarding_completed) {
      throw redirect({ to: '/onboarding' })
    }
  },
  component: AuthenticatedLayout,
})

function AuthenticatedLayout() {
  const { checkAutoDark } = useThemeStore()

  useEffect(() => {
    // Check auto-dark every minute
    checkAutoDark()
    const interval = setInterval(checkAutoDark, 60_000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="flex h-screen w-full bg-background overflow-hidden">
      {/* Desktop sidebar */}
      <Sidebar />

      {/* Main content area */}
      <div className="flex flex-1 flex-col min-w-0">
        <MobileHeader />
        <main className="flex-1 overflow-y-auto pb-[calc(64px+env(safe-area-inset-bottom))] md:pb-0">
          <Outlet />
        </main>
      </div>

      {/* Mobile bottom navigation */}
      <BottomNav />

      {/* Seasonal theme prompt */}
      <SeasonalPrompt />
    </div>
  )
}
