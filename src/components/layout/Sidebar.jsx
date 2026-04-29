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

// ─── Nav structure ────────────────────────────────────────────────────────────
const HUB_NAV = [
  {
    label: 'Today',
    items: [
      { to: '/today', iconName: 'home', label: 'Dashboard' },
      { to: '/today/tasks', iconName: 'list', label: 'Planner' },
      { to: '/today/journal', iconName: 'notebook', label: 'Journal' },
    ]
  },
  {
    label: 'Worship',
    items: [
      { to: '/worship/prayer', iconName: 'clock', label: 'Prayer' },
      { to: '/worship/quran', iconName: 'book', label: 'Quran' },
      { to: '/worship/audio', iconName: 'headphones', label: 'Audio Hub' },
      { to: '/worship/qibla', iconName: 'compass', label: 'Qibla' },
    ]
  },
  {
    label: 'Grow',
    items: [
      { to: '/grow/habits', iconName: 'heart', label: 'Habits' },
      { to: '/grow/learning', iconName: 'book', label: 'Learning' },
      { to: '/grow/ai', iconName: 'sparkles', label: 'AI Guide' },
      { to: '/grow/wellness', iconName: 'heart', label: 'Wellness' },
      { to: '/grow/meal', iconName: 'utensils', label: 'Meals' },
      { to: '/grow/workout', iconName: 'activity', label: 'Workout' },
      { to: '/grow/finance', iconName: 'bank', label: 'Islamic Finance' },
    ]
  },
  {
    label: 'Community',
    items: [
      { to: '/community', iconName: 'user', label: 'Community' },
      { to: '/grow/waqf', iconName: 'heart', label: 'Waqf & Sadaqah' },
    ]
  },
  {
    label: 'Me',
    items: [
      { to: '/me/children', iconName: 'user', label: 'Tarbiyah (Kids)' },
      { to: '/me/family', iconName: 'home', label: 'Family' },
      { to: '/me/female', iconName: 'heart', label: 'Sister\'s Space', femaleOnly: true },
    ]
  }
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
            <div className="w-8 h-8 rounded-lg flex items-center justify-center font-semibold text-sm bg-primary/10 text-primary shrink-0 shadow-sm">
              {initial}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold truncate text-sidebar-foreground">{displayName}</p>
              <p className="text-[10px] capitalize font-medium text-muted-foreground">{user?.madhab || 'hanafi'} school</p>
            </div>
          </div>
        </div>
      )}

      {/* Global Search / Command Bar Trigger */}
      <div className="px-3 py-2 shrink-0">
        <button
          onClick={() => window.dispatchEvent(new CustomEvent('openCommandBar'))}
          className={cn(
            'flex items-center gap-3 w-full rounded-lg px-3 py-2 text-sm font-medium transition-all text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
            sidebarCollapsed ? 'justify-center px-0' : ''
          )}
        >
          <Icon name="search" size={18} className="shrink-0" />
          {!sidebarCollapsed && (
            <div className="flex items-center justify-between w-full">
              <span>Search...</span>
              <kbd className="rounded border border-sidebar-border bg-sidebar-accent px-1 py-0.5 font-mono text-[10px] opacity-70">
                ⌘K
              </kbd>
            </div>
          )}
        </button>
      </div>

      {/* Navigation */}
      <nav className="relative z-10 flex-1 overflow-y-auto px-3 py-4 space-y-0.5 scrollbar-none">
        {HUB_NAV.map(hub => (
          <React.Fragment key={hub.label}>
            <SectionLabel label={hub.label} collapsed={sidebarCollapsed} />
            {hub.items.map(n => {
              if (n.femaleOnly && !isFemale?.()) return null
              return <NavItem key={n.to} {...n} collapsed={sidebarCollapsed} />
            })}
          </React.Fragment>
        ))}
      </nav>

      {/* Footer actions */}
      <div className="relative z-10 border-t border-sidebar-border px-3 py-4 space-y-1 shrink-0 mt-auto bg-sidebar/50 backdrop-blur-md">
        {/* Upgrade */}
        <Link to="/me/subscription" className="group">
          {({ isActive }) => (
            <div className={cn(
              'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all',
              isActive ? 'bg-primary/10 text-primary' : 'text-sidebar-foreground/70 hover:bg-sidebar-accent'
            )}>
              <Icon name="crown" size={18} className="shrink-0" />
              {!sidebarCollapsed && <span>Upgrade Plan</span>}
            </div>
          )}
        </Link>

        {user?.role === 'admin' && (
          <Link to="/me/admin" className="group">
            {({ isActive }) => (
              <div className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all',
                isActive ? 'bg-primary/10 text-primary' : 'text-sidebar-foreground/70 hover:bg-sidebar-accent'
              )}>
                <Icon name="shield" size={18} className="shrink-0" />
                {!sidebarCollapsed && <span>Admin Portal</span>}
              </div>
            )}
          </Link>
        )}

        {/* Dark mode toggle */}
        <button
          onClick={toggleDark}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-sidebar-foreground/70 hover:bg-sidebar-accent transition-colors"
        >
          <Icon name={resolvedDark ? 'sun' : 'moon'} size={18} className="shrink-0" />
          {!sidebarCollapsed && <span>{resolvedDark ? 'Light Mode' : 'Dark Mode'}</span>}
        </button>

        {/* Settings */}
        <Link to="/me/settings" className="group">
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

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-sidebar-foreground/70 hover:bg-destructive/10 hover:text-destructive transition-colors"
        >
          <Icon name="log-out" size={18} className="shrink-0" />
          {!sidebarCollapsed && <span>Sign out</span>}
        </button>

        {/* Collapse toggle */}
        <button
          onClick={toggleCollapsed}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-sidebar-foreground/70 hover:bg-sidebar-accent transition-colors"
        >
          <Icon name={sidebarCollapsed ? 'chevron-right' : 'chevron-left'} size={18} className="shrink-0" />
          {!sidebarCollapsed && <span>Collapse</span>}
        </button>
      </div>
    </aside>
  )
}
