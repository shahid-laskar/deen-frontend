import React from 'react'
import { Link, useRouterState } from '@tanstack/react-router'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/store/authStore'
import { useAppStore } from '@/store/appStore'
import { useTheme } from '@/lib/theme-context'
import { authApi } from '@/lib/api'
import { Icon } from '@/components/ui/icon'
import { Pattern } from '@/components/ui/pattern'
import { ThemeTrigger } from '@/components/theme/ThemeTrigger'
import {
  LogOut, ChevronLeft, ChevronRight, Crown, Shield, Heart,
} from 'lucide-react'

// ─── Nav structure ────────────────────────────────────────────────────────────
const CORE_NAV = [
  { to: '/dashboard',    iconName: 'home',     label: 'Dashboard' },
  { to: '/prayer',       iconName: 'clock',    label: 'Prayer Times' },
  { to: '/quran',        iconName: 'book',     label: 'Quran' },
  { to: '/habits/dhikr', iconName: 'sparkles', label: 'Dhikr & Dua' },
  { to: '/habits/',      iconName: 'heart',    label: 'Habits' },
  { to: '/journal',      iconName: 'notebook', label: 'Journal' },
  { to: '/tasks',        iconName: 'list',     label: 'Planner' },
  { to: '/ai',           iconName: 'sparkles', label: 'AI Guide' },
  { to: '/qibla',        iconName: 'compass',  label: 'Qibla' },
  { to: '/gamification', iconName: 'trophy',   label: 'Journey' },
  { to: '/learning',     iconName: 'book',     label: 'Learning Hub' },
]

const WELLNESS_NAV = [
  { to: '/meal',      iconName: 'heart',    label: 'Meal Planner' },
  { to: '/workout',   iconName: 'flame',    label: 'Workout' },
  { to: '/wellness',  iconName: 'star',     label: 'Wellness' },
  { to: '/children',  iconName: 'shield',   label: 'Child Upbringing' },
]

const COMMUNITY_NAV = [
  { to: '/community', iconName: 'user',     label: 'Community' },
  { to: '/waqf',      iconName: 'heart',    label: 'Waqf & Sadaqah' },
  { to: '/finance',   iconName: 'star',     label: 'Islamic Finance' },
  { to: '/family',    iconName: 'home',     label: 'Family & Home' },
]

// ─── Individual nav link ──────────────────────────────────────────────────────
function NavItem({ to, iconName, label, collapsed, pink = false, search }) {
  return (
    <Link to={to} search={search} activeOptions={{ exact: true }} className="group">
      {({ isActive }) => (
        <div className={cn(
          'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 relative',
          isActive
            ? pink ? 'bg-pink-500/10 text-pink-400' : 'bg-primary/10 text-primary'
            : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
        )}>
          <Icon
            name={iconName}
            size={18}
            className={cn('shrink-0', isActive && !pink && 'text-primary')}
          />
          {!collapsed && <span className="truncate">{label}</span>}
          {isActive && !collapsed && (
            <div className="ml-auto h-1.5 w-1.5 rounded-full bg-primary" />
          )}
        </div>
      )}
    </Link>
  )
}

// ─── Section label ────────────────────────────────────────────────────────────
function SectionLabel({ label, collapsed }) {
  if (collapsed) return <div className="h-px bg-sidebar-border mx-2 my-2" />
  return (
    <p className="pt-4 pb-1 px-3 text-[10px] uppercase tracking-widest font-semibold text-muted-foreground/60">
      {label}
    </p>
  )
}

// ─── Main Sidebar ─────────────────────────────────────────────────────────────
export function Sidebar() {
  const { user, isFemale, logout } = useAuthStore()
  const { sidebarCollapsed, toggleCollapsed } = useAppStore()
  const { resolvedDark, setMode, mode } = useTheme()

  const handleLogout = async () => {
    try {
      const r = localStorage.getItem('refresh_token')
      if (r) await authApi.logout(r)
    } catch {}
    logout()
    window.location.href = '/login'
  }

  const toggleDark = () => {
    if (mode === 'dark') setMode('light')
    else if (mode === 'light') setMode('dark')
    else setMode(resolvedDark ? 'light' : 'dark')
  }

  const displayName = user?.profile?.display_name || user?.email?.split('@')[0] || 'User'
  const initial = displayName[0]?.toUpperCase() ?? 'U'

  return (
    <aside className={cn(
      'hidden md:flex flex-col h-full bg-sidebar border-r border-sidebar-border relative transition-all duration-300 overflow-hidden shrink-0',
      sidebarCollapsed ? 'w-[4.5rem]' : 'w-64'
    )}>
      {/* Theme-aware geometric background */}
      <Pattern className="text-sidebar-foreground opacity-[0.035]" />

      {/* Logo */}
      <div className="relative z-10 flex items-center gap-3 px-5 py-6 border-b border-sidebar-border shrink-0">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm shadow-primary/20">
          <span className="font-amiri text-xl font-bold leading-none">د</span>
        </div>
        {!sidebarCollapsed && (
          <div className="overflow-hidden">
            <h1 className="text-lg font-bold tracking-tight text-sidebar-foreground leading-none">Deen</h1>
            <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground/60 mt-1">
              Your Islamic Companion
            </p>
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
            <Link to="/female" className="group">
              {({ isActive }) => (
                <div className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all',
                  isActive ? 'bg-pink-500/10 text-pink-400' : 'text-pink-400/70 hover:bg-pink-500/10 hover:text-pink-400'
                )}>
                  <Heart className="h-[18px] w-[18px] shrink-0" />
                  {!sidebarCollapsed && <span className="truncate">Sister's Space</span>}
                </div>
              )}
            </Link>
          </>
        )}
      </nav>

      {/* Footer actions */}
      <div className="relative z-10 border-t border-sidebar-border px-3 py-4 space-y-1 shrink-0 mt-auto">
        {/* Upgrade */}
        <Link to="/subscription" className="group">
          {({ isActive }) => (
            <div className={cn(
              'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all',
              isActive ? 'bg-primary/10 text-primary' : 'text-sidebar-foreground/70 hover:bg-sidebar-accent'
            )}>
              <Crown className="h-[18px] w-[18px] shrink-0" />
              {!sidebarCollapsed && <span>Upgrade Plan</span>}
            </div>
          )}
        </Link>

        {/* Settings */}
        <Link to="/settings" className="group">
          {({ isActive }) => (
            <div className={cn(
              'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all',
              isActive ? 'bg-primary/10 text-primary' : 'text-sidebar-foreground/70 hover:bg-sidebar-accent'
            )}>
              <Icon name="settings" size={18} className="shrink-0" />
              {!sidebarCollapsed && <span>Settings</span>}
            </div>
          )}
        </Link>

        {user?.role === 'admin' && (
          <Link to="/admin" className="group">
            {({ isActive }) => (
              <div className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all',
                isActive ? 'bg-primary/10 text-primary' : 'text-sidebar-foreground/70 hover:bg-sidebar-accent'
              )}>
                <Shield className="h-[18px] w-[18px] shrink-0" />
                {!sidebarCollapsed && <span>Admin Portal</span>}
              </div>
            )}
          </Link>
        )}

        {/* Theme trigger */}
        <ThemeTrigger showLabel={!sidebarCollapsed} />

        {/* Dark mode toggle */}
        <button
          onClick={toggleDark}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-sidebar-foreground/70 hover:bg-sidebar-accent transition-colors"
        >
          <Icon name={resolvedDark ? 'sun' : 'moon'} size={18} className="shrink-0" />
          {!sidebarCollapsed && <span>{resolvedDark ? 'Light Mode' : 'Dark Mode'}</span>}
        </button>

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-sidebar-foreground/70 hover:bg-destructive/10 hover:text-destructive transition-colors"
        >
          <LogOut className="h-[18px] w-[18px] shrink-0" />
          {!sidebarCollapsed && <span>Sign out</span>}
        </button>

        {/* Collapse toggle */}
        <button
          onClick={toggleCollapsed}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-sidebar-foreground/70 hover:bg-sidebar-accent transition-colors"
        >
          {sidebarCollapsed
            ? <ChevronRight className="h-[18px] w-[18px]" />
            : <ChevronLeft className="h-[18px] w-[18px]" />}
          {!sidebarCollapsed && <span>Collapse</span>}
        </button>
      </div>
    </aside>
  )
}
