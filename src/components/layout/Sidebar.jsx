import React, { useState, useEffect } from 'react'
import { Link, useRouterState } from '@tanstack/react-router'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/store/authStore'
import { useAppStore } from '@/store/appStore'
import { useThemeStore } from '@/store/themeStore'
import { authApi } from '@/lib/api'
import {
  LayoutDashboard, Clock, BookOpen, Target, BookMarked,
  CheckSquare, Sparkles, Settings, Moon, Sun, Heart, LogOut,
  Utensils, Dumbbell, Baby, Compass, Users, HandHeart,
  DollarSign, Activity, Shield, Crown, ChevronLeft, ChevronRight,
  Trophy
} from 'lucide-react'

// ─── Nav structure (matches existing nav groups) ───────────────────────────────
const CORE_NAV = [
  { to: '/dashboard',    icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/prayer',       icon: Clock,           label: 'Prayer Times' },
  { to: '/quran',        icon: BookOpen,        label: 'Quran' },
  { to: '/habits',       icon: Sparkles,        label: 'Dhikr & Dua', search: { tab: 'dhikr' } },
  { to: '/habits',       icon: Heart,           label: 'Habits',      search: { tab: 'today' } },
  { to: '/journal',      icon: BookMarked,      label: 'Journal' },
  { to: '/tasks',        icon: CheckSquare,     label: 'Planner' },
  { to: '/ai',           icon: Sparkles,        label: 'AI Guide' },
  { to: '/qibla',        icon: Compass,         label: 'Qibla' },
  { to: '/gamification', icon: Trophy,          label: 'Journey' },
  { to: '/learning',     icon: BookMarked,      label: 'Learning Hub' },
]

const WELLNESS_NAV = [
  { to: '/meal',      icon: Utensils,  label: 'Meal Planner' },
  { to: '/workout',   icon: Dumbbell,  label: 'Workout' },
  { to: '/wellness',  icon: Activity,  label: 'Wellness' },
  { to: '/children',  icon: Baby,      label: 'Child Upbringing' },
]

const COMMUNITY_NAV = [
  { to: '/community', icon: Users,      label: 'Community' },
  { to: '/waqf',      icon: HandHeart,  label: 'Waqf & Sadaqah' },
  { to: '/finance',   icon: DollarSign, label: 'Islamic Finance' },
  { to: '/family',    icon: Baby,       label: 'Family & Home' },
]

// ─── Geometric SVG background ─────────────────────────────────────────────────
function GeometricPattern() {
  return (
    <svg className="absolute inset-0 h-full w-full opacity-[0.04] text-current" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <pattern id="sidebar-geo" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
          <path d="M20 0L40 20L20 40L0 20Z" fill="none" stroke="currentColor" strokeWidth="0.5" />
          <circle cx="20" cy="20" r="5" fill="none" stroke="currentColor" strokeWidth="0.3" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#sidebar-geo)" />
    </svg>
  )
}

// ─── Individual nav link ───────────────────────────────────────────────────────
function NavItem({ to, icon: Icon, label, collapsed, pink = false, search }) {
  return (
    <Link
      to={to}
      search={search}
      activeOptions={{ exact: true }}
      className="group"
    >
      {({ isActive }) => (
        <div
          className={cn(
            'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 relative',
            isActive
              ? pink ? 'bg-pink-500/10 text-pink-400' : 'bg-primary/10 text-primary'
              : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
          )}
        >
          <Icon className={cn('h-[18px] w-[18px] shrink-0', isActive && !pink && 'text-primary')} />
          {!collapsed && <span className="truncate">{label}</span>}
          {isActive && !collapsed && (
            <div className="ml-auto h-1.5 w-1.5 rounded-full bg-primary" />
          )}
        </div>
      )}
    </Link>
  )
}

// ─── Section label ─────────────────────────────────────────────────────────────
function SectionLabel({ label, collapsed }) {
  if (collapsed) return <div className="h-px bg-sidebar-border mx-2 my-2" />
  return (
    <p className="pt-4 pb-1 px-3 text-[10px] uppercase tracking-widest font-semibold text-muted-foreground/60">
      {label}
    </p>
  )
}

// ─── Main Sidebar ──────────────────────────────────────────────────────────────
export function Sidebar() {
  const { user, isFemale, logout } = useAuthStore()
  const { sidebarCollapsed, toggleCollapsed } = useAppStore()
  const { isDark, toggleDark } = useThemeStore()

  const handleLogout = async () => {
    try {
      const r = localStorage.getItem('refresh_token')
      if (r) await authApi.logout(r)
    } catch {}
    logout()
    window.location.href = '/login'
  }

  const displayName = user?.profile?.display_name || user?.email?.split('@')[0] || 'User'
  const initial = displayName[0]?.toUpperCase() ?? 'U'

  return (
    <aside
      className={cn(
        'hidden md:flex flex-col h-full bg-sidebar border-r border-sidebar-border relative transition-all duration-300 overflow-hidden shrink-0',
        sidebarCollapsed ? 'w-[4.5rem]' : 'w-64'
      )}
    >
      {/* Geometric background pattern */}
      <GeometricPattern />

      {/* Logo */}
      <div className="relative z-10 flex items-center gap-3 px-5 py-6 border-b border-sidebar-border shrink-0">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm shadow-primary/20">
          <span className="font-amiri text-xl font-bold leading-none">د</span>
        </div>
        {!sidebarCollapsed && (
          <div className="overflow-hidden">
            <h1 className="text-lg font-bold tracking-tight text-sidebar-foreground leading-none">Deen</h1>
            <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground/60 mt-1">Your Islamic Companion</p>
          </div>
        )}
      </div>

      {/* User chip */}
      {!sidebarCollapsed && (
        <div className="relative z-10 px-4 py-3 border-b border-sidebar-border shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center font-semibold text-sm bg-primary/10 text-primary shrink-0">
              {initial}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium truncate text-sidebar-foreground">{displayName}</p>
              <p className="text-[10px] capitalize text-muted-foreground">{user?.madhab || 'hanafi'} school</p>
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="relative z-10 flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
        {CORE_NAV.map(n => <NavItem key={n.label} {...n} collapsed={sidebarCollapsed} />)}

        <SectionLabel label="Wellness" collapsed={sidebarCollapsed} />
        {WELLNESS_NAV.map(n => <NavItem key={n.to} {...n} collapsed={sidebarCollapsed} />)}

        <SectionLabel label="Community" collapsed={sidebarCollapsed} />
        {COMMUNITY_NAV.map(n => <NavItem key={n.to} {...n} collapsed={sidebarCollapsed} />)}

        {isFemale?.() && (
          <>
            <SectionLabel label="Sister's Tools" collapsed={sidebarCollapsed} />
            <NavItem to="/female" icon={Heart} label="Sister's Space" collapsed={sidebarCollapsed} pink />
          </>
        )}
      </nav>

      {/* Footer actions */}
      <div className="relative z-10 border-t border-sidebar-border px-3 py-4 space-y-1 shrink-0 mt-auto">
        <NavItem to="/subscription" icon={Crown} label="Upgrade Plan" collapsed={sidebarCollapsed} />
        <NavItem to="/settings" icon={Settings} label="Settings" collapsed={sidebarCollapsed} />
        {user?.role === 'admin' && (
          <NavItem to="/admin" icon={Shield} label="Admin Portal" collapsed={sidebarCollapsed} />
        )}
        <button
          onClick={toggleDark}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-sidebar-foreground/70 hover:bg-sidebar-accent transition-colors"
        >
          {isDark ? <Sun className="h-[18px] w-[18px] shrink-0" /> : <Moon className="h-[18px] w-[18px] shrink-0" />}
          {!sidebarCollapsed && <span>{isDark ? 'Light Mode' : 'Dark Mode'}</span>}
        </button>
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-sidebar-foreground/70 hover:bg-destructive/10 hover:text-destructive transition-colors"
        >
          <LogOut className="h-[18px] w-[18px] shrink-0" />
          {!sidebarCollapsed && <span>Sign out</span>}
        </button>
        <button
          onClick={toggleCollapsed}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-sidebar-foreground/70 hover:bg-sidebar-accent transition-colors"
        >
          {sidebarCollapsed ? <ChevronRight className="h-[18px] w-[18px]" /> : <ChevronLeft className="h-[18px] w-[18px]" />}
          {!sidebarCollapsed && <span>Collapse</span>}
        </button>
      </div>
    </aside>
  )
}
