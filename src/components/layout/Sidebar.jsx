import React from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { clsx } from 'clsx'
import {
  LayoutDashboard, Clock, BookOpen, Target, BookMarked,
  CheckSquare, Sparkles, Settings, Moon, Sun, Menu, Heart,
  LogOut, ChevronRight
} from 'lucide-react'
import { useAuthStore } from '../../store/authStore'
import { useAppStore } from '../../store/appStore'
import { authApi } from '../../lib/api'
import toast from 'react-hot-toast'

const NAV = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/prayer', icon: Clock, label: 'Prayer' },
  { to: '/quran', icon: BookOpen, label: 'Quran & Hifz' },
  { to: '/habits', icon: Target, label: 'Habits' },
  { to: '/journal', icon: BookMarked, label: 'Journal' },
  { to: '/tasks', icon: CheckSquare, label: 'Planner' },
  { to: '/ai', icon: Sparkles, label: 'AI Guide' },
]

const FEMALE_NAV = [
  { to: '/female', icon: Heart, label: 'Sister\'s Space' },
]

export default function Sidebar() {
  const { user, isFemale, logout } = useAuthStore()
  const { sidebarOpen, toggleSidebar, theme, toggleTheme } = useAppStore()
  const navigate = useNavigate()

  const handleLogout = async () => {
    try {
      const refresh = localStorage.getItem('refresh_token')
      if (refresh) await authApi.logout(refresh)
    } catch {}
    logout()
    navigate('/login')
    toast.success('Logged out. Assalamu Alaikum!')
  }

  return (
    <>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-30 md:hidden"
          onClick={toggleSidebar}
        />
      )}

      <aside
        className={clsx(
          'fixed left-0 top-0 h-full z-40 flex flex-col bg-emerald-950 dark:bg-emerald-950',
          'border-r border-emerald-900/50 transition-transform duration-300',
          'w-[260px]',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full',
          'md:relative md:translate-x-0'
        )}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-6 py-5 border-b border-emerald-900/50">
          <div className="w-9 h-9 bg-gold-700 rounded-xl flex items-center justify-center flex-shrink-0">
            <span className="font-arabic text-white font-bold text-lg leading-none">د</span>
          </div>
          <div>
            <h1 className="font-display text-white font-semibold text-lg leading-none">Deen</h1>
            <p className="text-emerald-500 text-xs mt-0.5">Islamic Companion</p>
          </div>
          <button
            onClick={toggleSidebar}
            className="ml-auto md:hidden text-emerald-500 hover:text-white transition-colors"
          >
            <ChevronRight size={18} />
          </button>
        </div>

        {/* User */}
        <div className="px-4 py-4 border-b border-emerald-900/50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-emerald-800 rounded-xl flex items-center justify-center text-emerald-200 font-semibold text-sm">
              {user?.email?.[0]?.toUpperCase() ?? 'U'}
            </div>
            <div className="min-w-0">
              <p className="text-white text-sm font-medium truncate">
                {user?.profile?.display_name || user?.email?.split('@')[0] || 'User'}
              </p>
              <p className="text-emerald-500 text-xs capitalize">{user?.madhab} school</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {NAV.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                clsx(
                  'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-150',
                  isActive
                    ? 'bg-emerald-800/70 text-white font-medium'
                    : 'text-emerald-400 hover:bg-emerald-900/50 hover:text-emerald-200'
                )
              }
            >
              {({ isActive }) => (
                <>
                  <Icon size={18} className={isActive ? 'text-gold-400' : ''} />
                  {label}
                </>
              )}
            </NavLink>
          ))}

          {isFemale() && (
            <>
              <div className="pt-3 pb-1 px-3">
                <p className="text-emerald-700 text-xs uppercase tracking-wider font-medium">Sister's Tools</p>
              </div>
              {FEMALE_NAV.map(({ to, icon: Icon, label }) => (
                <NavLink
                  key={to}
                  to={to}
                  className={({ isActive }) =>
                    clsx(
                      'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-150',
                      isActive
                        ? 'bg-pink-900/40 text-pink-200 font-medium'
                        : 'text-emerald-400 hover:bg-pink-900/20 hover:text-pink-300'
                    )
                  }
                >
                  {({ isActive }) => (
                    <>
                      <Icon size={18} className={isActive ? 'text-pink-400' : ''} />
                      {label}
                    </>
                  )}
                </NavLink>
              ))}
            </>
          )}
        </nav>

        {/* Bottom controls */}
        <div className="px-3 py-4 border-t border-emerald-900/50 space-y-1">
          <NavLink
            to="/settings"
            className={({ isActive }) =>
              clsx(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-150',
                isActive
                  ? 'bg-emerald-800/70 text-white font-medium'
                  : 'text-emerald-400 hover:bg-emerald-900/50 hover:text-emerald-200'
              )
            }
          >
            {({ isActive }) => <><Settings size={18} className={isActive ? 'text-gold-400' : ''} />Settings</>}
          </NavLink>

          <button
            onClick={toggleTheme}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-emerald-400 hover:bg-emerald-900/50 hover:text-emerald-200 transition-all duration-150"
          >
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            {theme === 'dark' ? 'Light mode' : 'Dark mode'}
          </button>

          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-emerald-500 hover:bg-red-900/20 hover:text-red-400 transition-all duration-150"
          >
            <LogOut size={18} />
            Sign out
          </button>
        </div>
      </aside>
    </>
  )
}
