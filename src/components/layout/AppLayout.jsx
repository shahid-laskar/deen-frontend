import React, { useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import { Menu } from 'lucide-react'
import Sidebar from './Sidebar'
import BottomNav from './BottomNav'
import SeasonalPrompt from '../ui/SeasonalPrompt'
import { useAppStore } from '../../store/appStore'
import { useThemeStore } from '../../store/themeStore'

export default function AppLayout() {
  const { sidebarOpen, toggleSidebar, setSidebarOpen } = useAppStore()
  const { applyToDOM, checkSeasonalTheme, checkAutoDark, pendingSeasonalTheme } = useThemeStore()

  // Apply theme on mount
  useEffect(() => {
    applyToDOM()
    checkSeasonalTheme()
  }, [])

  // Check auto-dark every minute
  useEffect(() => {
    checkAutoDark()
    const id = setInterval(checkAutoDark, 60_000)
    return () => clearInterval(id)
  }, [])

  // Close sidebar on mobile by default
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 768px)')
    if (mq.matches) setSidebarOpen(false)
  }, [])

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: 'var(--t-bg)' }}>
      {/* Desktop sidebar */}
      <div className="hidden md:block">
        <Sidebar />
      </div>

      {/* Mobile sidebar overlay */}
      <div className="md:hidden">
        <Sidebar />
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile topbar */}
        <div
          className="flex items-center gap-4 px-4 py-3 md:hidden border-b"
          style={{ background: 'var(--t-bg-sidebar)', borderColor: 'var(--t-border)' }}
        >
          <button
            onClick={toggleSidebar}
            className="nav-tab p-2"
            style={{ color: 'var(--t-text-muted)', flex: 'none', height: 'auto' }}
          >
            <Menu size={22} />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center"
                 style={{ background: 'var(--t-accent)' }}>
              <span className="font-arabic text-white text-sm font-bold leading-none">د</span>
            </div>
            <span className="font-display font-semibold" style={{ color: 'var(--t-text)' }}>Deen</span>
          </div>
        </div>

        {/* Page content — id used by BottomNav scroll watcher */}
        <main
          id="main-scroll"
          className="flex-1 overflow-y-auto"
          style={{ paddingBottom: 'calc(var(--nav-h) + env(safe-area-inset-bottom))' }}
        >
          <div className="min-h-full">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Bottom nav (mobile only) */}
      <BottomNav />

      {/* Seasonal theme permission prompt */}
      {pendingSeasonalTheme && <SeasonalPrompt />}
    </div>
  )
}
