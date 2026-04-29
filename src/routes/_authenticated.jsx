import React from 'react'
import { createFileRoute, redirect } from '@tanstack/react-router'
import { useAuthStore } from '@/store/authStore'
import { Sidebar } from '@/components/layout/Sidebar'
import { BottomNav } from '@/components/layout/BottomNav'
import { MobileHeader } from '@/components/layout/MobileHeader'
import { ContextualTopBar } from '@/components/layout/ContextualTopBar'
import { CommandBar } from '@/components/layout/CommandBar'
import { SeasonalPrompt } from '@/components/layout/SeasonalPrompt'
import { GlobalAudioPlayer } from '@/components/worship/GlobalAudioPlayer'
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
  return (
    <div className="flex h-screen w-full bg-background overflow-hidden">
      {/* Desktop sidebar */}
      <Sidebar />

      {/* Main content area */}
      <div className="flex flex-1 flex-col min-w-0">
        <MobileHeader />
        {/* Contextual top bar — Hijri date + prayer countdown + location */}
        <ContextualTopBar />
        <main className="flex-1 overflow-y-auto pb-[calc(64px+env(safe-area-inset-bottom))] md:pb-0">
          <Outlet />
        </main>
      </div>

      {/* Mobile bottom navigation */}
      <BottomNav />

      {/* Global command bar (⌘K) */}
      <CommandBar />

      {/* Seasonal theme prompt */}
      <SeasonalPrompt />

      {/* Global Background Audio */}
      <GlobalAudioPlayer />
    </div>
  )
}
