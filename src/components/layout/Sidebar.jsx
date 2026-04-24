import React, { useState, useEffect } from 'react'
import { Link, useLocation, useNavigate } from '@tanstack/react-router'
import {
  LayoutDashboard,
  Clock,
  BookOpen,
  Heart,
  NotebookPen,
  ListTodo,
  Compass,
  Settings,
  Moon,
  Sun,
  Sparkles,
  Brain,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Droplets,
  Users,
  Trophy,
  HandCoins,
  Mic,
} from 'lucide-react'
import { useAuthStore } from '@/store/authStore'

const navItems = [
  { title: 'Dashboard', to: '/dashboard', icon: LayoutDashboard },
  { title: 'Prayer', to: '/prayer', icon: Clock },
  { title: 'Quran', to: '/quran', icon: BookOpen },
  { title: 'Habits', to: '/habits', icon: Heart },
  { title: 'Dhikr', to: '/habits/dhikr', icon: Sparkles },
  { title: 'Journal', to: '/journal', icon: NotebookPen },
  { title: 'Tasks', to: '/tasks', icon: ListTodo },
  { title: 'AI Guide', to: '/ai', icon: Brain },
  { title: 'Qibla', to: '/qibla', icon: Compass },
  { title: 'Wellness', to: '/wellness', icon: Droplets },
  { title: 'Community', to: '/community', icon: Users },
  { title: 'Quests', to: '/gamification', icon: Trophy },
  { title: 'Waqf', to: '/waqf', icon: HandCoins },
  { title: 'Recitation', to: '/recitation', icon: Mic },
  { title: 'Settings', to: '/settings', icon: Settings },
]

export function Sidebar() {
  const location = useLocation()
  const navigate = useNavigate()
  const [collapsed, setCollapsed] = useState(false)
  const [darkMode, setDarkMode] = useState(false)
  const logout = useAuthStore((s) => s.logout)

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode)
  }, [darkMode])

  async function onLogout() {
    await logout()
    navigate({ to: '/login' })
  }

  return (
    <aside
      className={`hidden md:flex flex-col h-screen sticky top-0 bg-sidebar border-r border-sidebar-border/60 relative transition-all duration-300 ease-out ${
        collapsed ? 'w-[4.5rem]' : 'w-64'
      }`}
    >
      <div className="relative z-10 flex items-center gap-3 px-5 py-6 border-b border-sidebar-border/40">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary/80 text-primary-foreground shadow-sm">
          <span className="font-amiri text-lg font-bold">د</span>
        </div>
        {!collapsed && (
          <div className="overflow-hidden">
            <h1 className="text-lg font-bold tracking-tight text-sidebar-foreground">Deen</h1>
            <p className="text-[9px] uppercase tracking-[0.2em] text-muted-foreground font-semibold">
              Your Islamic Companion
            </p>
          </div>
        )}
      </div>

      <nav className="relative z-10 flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
        {navItems.map((item) => {
          const isActive =
            location.pathname === item.to || location.pathname.startsWith(item.to + '/')
          const Icon = item.icon
          return (
            <Link
              key={item.to}
              to={item.to}
              className={`relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 group ${
                isActive
                  ? 'bg-primary/10 text-primary shadow-sm'
                  : 'text-sidebar-foreground/65 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground'
              }`}
            >
              {isActive && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full bg-primary" />
              )}
              <Icon
                className={`h-[18px] w-[18px] shrink-0 transition-transform duration-200 group-hover:scale-105 ${
                  isActive ? 'text-primary' : ''
                }`}
                strokeWidth={isActive ? 2.2 : 1.8}
              />
              {!collapsed && <span className="truncate">{item.title}</span>}
            </Link>
          )
        })}
      </nav>

      <div className="relative z-10 border-t border-sidebar-border/40 px-3 py-3 space-y-1">
        <button
          onClick={() => setDarkMode(!darkMode)}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-sidebar-foreground/60 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground transition-all duration-200"
        >
          {darkMode ? <Sun className="h-[18px] w-[18px]" /> : <Moon className="h-[18px] w-[18px]" />}
          {!collapsed && <span>{darkMode ? 'Light Mode' : 'Dark Mode'}</span>}
        </button>
        <button
          onClick={onLogout}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-sidebar-foreground/60 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground transition-all duration-200"
        >
          <LogOut className="h-[18px] w-[18px]" />
          {!collapsed && <span>Sign out</span>}
        </button>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-sidebar-foreground/60 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground transition-all duration-200"
        >
          {collapsed ? <ChevronRight className="h-[18px] w-[18px]" /> : <ChevronLeft className="h-[18px] w-[18px]" />}
          {!collapsed && <span>Collapse</span>}
        </button>
      </div>
    </aside>
  )
}
