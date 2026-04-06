import React, { useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import { Menu } from 'lucide-react'
import Sidebar from './Sidebar'
import { useAppStore } from '../../store/appStore'

export default function AppLayout() {
  const { sidebarOpen, toggleSidebar, setSidebarOpen, theme } = useAppStore()

  // Apply theme on mount
  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
  }, [theme])

  // Close sidebar on mobile by default
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 768px)')
    if (mq.matches) setSidebarOpen(false)
  }, [])

  return (
    <div className="flex h-screen bg-parchment-50 dark:bg-emerald-950/30 overflow-hidden">
      <Sidebar />

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile topbar */}
        <div className="flex items-center gap-4 px-4 py-3 bg-white dark:bg-emerald-950 border-b border-parchment-200 dark:border-emerald-900/50 md:hidden">
          <button
            onClick={toggleSidebar}
            className="text-emerald-700 dark:text-emerald-400 hover:text-emerald-900 transition-colors"
          >
            <Menu size={22} />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-gold-700 rounded-lg flex items-center justify-center">
              <span className="font-arabic text-white text-sm font-bold leading-none">د</span>
            </div>
            <span className="font-display font-semibold text-emerald-900 dark:text-emerald-100">Deen</span>
          </div>
        </div>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          <div className="min-h-full">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
