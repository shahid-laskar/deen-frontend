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
import { useTranslation } from 'react-i18next'
import { motion, AnimatePresence } from 'framer-motion'

// ─── Nav structure (exported for BottomNav) ───────────────────────────────────
export const HUB_NAV = [
  {
    label: 'Today',
    items: [
      { to: '/today',         iconName: 'home',      label: 'Dashboard' },
      { to: '/today/tasks',   iconName: 'list',      label: 'Tasks' },
      { to: '/today/journal', iconName: 'notebook',  label: 'Journal' },
    ]
  },
  {
    label: 'Worship',
    items: [
      { to: '/worship/prayer', iconName: 'clock',     label: 'Prayer' },
      { to: '/worship/quran',  iconName: 'book',      label: 'Quran' },
      { to: '/worship/qibla',  iconName: 'compass',   label: 'Qibla' },
      { to: '/worship/dhikr',  iconName: 'sparkles',  label: 'Dhikr' },
      { to: '/worship/duas',   iconName: 'heart',     label: 'Duas' },
      { to: '/worship/hadith', iconName: 'book-open', label: 'Hadith' },
    ]
  },
  {
    label: 'Grow',
    items: [
      { to: '/grow/habits',       iconName: 'heart',    label: 'Habits' },
      { to: '/grow/learning',     iconName: 'book',     label: 'Learning' },
      { to: '/grow/ai',           iconName: 'sparkles', label: 'AI Guide' },
      { to: '/grow/wellness',     iconName: 'heart',    label: 'Wellness' },
      { to: '/grow/meal',         iconName: 'utensils', label: 'Meals' },
      { to: '/grow/workout',      iconName: 'activity', label: 'Workout' },
      { to: '/grow/finance',      iconName: 'bank',     label: 'Finance' },
    ]
  },
  {
    label: 'Community',
    items: [
      { to: '/community',  iconName: 'user',  label: 'Community' },
      { to: '/grow/waqf',  iconName: 'heart', label: 'Waqf & Sadaqah' },
    ]
  },
  {
    label: 'Me',
    items: [
      { to: '/me/children', iconName: 'user',  label: 'Tarbiyah (Kids)' },
      { to: '/me/family',   iconName: 'home',  label: 'Family' },
      { to: '/me/female',   iconName: 'heart', label: "Sister's Space", femaleOnly: true },
    ]
  }
]

// ─── Individual nav link ──────────────────────────────────────────────────────
function NavItem({ to, iconName, label, collapsed, search, onClick }) {
  const { location } = useRouterState()
  const isActive = location.pathname === to || location.pathname.startsWith(to + '/')

  return (
    <Link to={to} search={search} className="group relative block" onClick={onClick}>
      {/* Animated active pill */}
      {isActive && (
        <motion.div
          layoutId="sidebar-active-pill"
          className="absolute inset-0 nav-pill-indicator"
          initial={false}
          transition={{ type: 'spring', stiffness: 380, damping: 30 }}
        />
      )}
      <div className={cn(
        'relative z-10 flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors duration-150',
        isActive
          ? 'text-primary'
          : 'text-sidebar-foreground/65 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground'
      )}>
        <Icon
          name={iconName}
          size={17}
          className={cn('shrink-0 transition-transform duration-150', isActive && 'scale-110')}
        />
        {!collapsed && <span className="truncate">{label}</span>}
      </div>
    </Link>
  )
}

// ─── Section label ────────────────────────────────────────────────────────────
function SectionLabel({ label, collapsed }) {
  if (collapsed) return <div className="h-px bg-sidebar-border/40 mx-2 my-3" />
  return (
    <p className="pt-5 pb-1.5 px-3 text-[9px] uppercase tracking-[0.18em] font-black text-muted-foreground/45">
      {label}
    </p>
  )
}

// ─── Main Sidebar ─────────────────────────────────────────────────────────────
export function Sidebar() {
  const { user, isFemale, logout } = useAuthStore()
  const { sidebarCollapsed, toggleCollapsed, sidebarOpen, setSidebarOpen } = useAppStore()
  const { resolvedDark, setMode, mode } = useTheme()
  const { t } = useTranslation()

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

  const handleMobileLinkClick = () => {
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      setSidebarOpen(false)
    }
  }

  const displayName = user?.profile?.display_name || user?.email?.split('@')[0] || 'User'
  const initial = displayName[0]?.toUpperCase() ?? 'U'

  return (
    <>
      {/* Mobile Backdrop */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm md:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      <aside className={cn(
        'fixed md:relative top-0 bottom-0 left-0 z-[70] md:z-auto flex flex-col h-full bg-sidebar border-r border-sidebar-border/60 transition-all duration-300 overflow-hidden shrink-0',
        'shadow-elevated md:shadow-none',
        sidebarCollapsed ? 'w-[4.5rem]' : 'w-72 md:w-64',
        !sidebarOpen ? '-translate-x-full md:translate-x-0' : 'translate-x-0'
      )}>
        {/* Theme-aware geometric background */}
        <Pattern className="text-sidebar-foreground opacity-[0.025]" />

        {/* Logo */}
        <div className="relative z-10 flex items-center gap-3 px-5 py-5 border-b border-sidebar-border/40 shrink-0">
          <motion.div
            className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary/80 text-primary-foreground shadow-glow-primary"
            whileHover={{ scale: 1.08 }}
            transition={{ type: 'spring', stiffness: 400, damping: 17 }}
          >
            <div className="absolute inset-0 rounded-full bg-primary blur-md opacity-30 scale-105" />
            <span className="relative font-amiri text-xl font-bold leading-none">د</span>
          </motion.div>
          {!sidebarCollapsed && (
            <div className="overflow-hidden">
              <h1 className="text-lg font-bold tracking-tight text-sidebar-foreground leading-none">Deen</h1>
              <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/40 mt-0.5">
                Your Islamic Companion
              </p>
            </div>
          )}
        </div>

        {/* User chip */}
        {!sidebarCollapsed && (
          <div className="relative z-10 px-4 py-3 border-b border-sidebar-border/40 shrink-0">
            <div className="flex items-center gap-3">
              {/* Circular avatar with ring */}
              <div className="relative shrink-0">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center font-bold text-sm text-primary ring-2 ring-primary/20 shadow-sm">
                  {initial}
                </div>
                <div className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-green-400 border-2 border-sidebar" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-bold truncate text-sidebar-foreground">{displayName}</p>
                <p className="text-[10px] capitalize font-medium text-muted-foreground/60">{user?.madhab || 'hanafi'} school</p>
              </div>
            </div>
          </div>
        )}

        {/* Search trigger */}
        <div className="relative z-10 px-3 pt-3 pb-1 shrink-0">
          <button
            onClick={() => window.dispatchEvent(new CustomEvent('openCommandBar'))}
            className={cn(
              'flex items-center gap-3 w-full rounded-xl px-3 py-2.5 text-sm font-medium transition-all',
              'text-sidebar-foreground/55 border border-sidebar-border/40',
              'hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground hover:border-sidebar-border',
              sidebarCollapsed ? 'justify-center' : ''
            )}
          >
            <Icon name="search" size={16} className="shrink-0" />
            {!sidebarCollapsed && (
              <div className="flex items-center justify-between w-full">
                <span className="text-xs">Search...</span>
                <kbd className="rounded-md border border-sidebar-border/60 bg-sidebar-accent/40 px-1.5 py-0.5 font-mono text-[9px] opacity-60">
                  ⌘K
                </kbd>
              </div>
            )}
          </button>
        </div>

        {/* Navigation */}
        <nav className="relative z-10 flex-1 overflow-y-auto px-3 py-2 space-y-0.5 scrollbar-none">
          {HUB_NAV.map(hub => (
            <React.Fragment key={hub.label}>
              <SectionLabel label={hub.label} collapsed={sidebarCollapsed} />
              {hub.items.map(n => {
                if (n.femaleOnly && !isFemale?.()) return null
                return <NavItem key={n.to} {...n} collapsed={sidebarCollapsed} onClick={handleMobileLinkClick} />
              })}
            </React.Fragment>
          ))}
        </nav>

        {/* Footer */}
        <div className="relative z-10 border-t border-sidebar-border/40 px-3 py-4 space-y-0.5 shrink-0 mt-auto glass-card !rounded-none !border-0 !border-t">
          {/* Upgrade */}
          <Link to="/me/subscription" className="group" onClick={handleMobileLinkClick}>
            {({ isActive }) => (
              <div className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all',
                isActive ? 'text-primary bg-primary/10' : 'text-muted-foreground hover:bg-sidebar-accent/60 hover:text-gold'
              )}>
                <Icon name="crown" size={17} className={cn('shrink-0 transition-colors', !isActive && 'group-hover:text-gold')} />
                {!sidebarCollapsed && <span>Upgrade Plan</span>}
              </div>
            )}
          </Link>

          {user?.role === 'admin' && (
            <Link to="/me/admin" className="group" onClick={handleMobileLinkClick}>
              {({ isActive }) => (
                <div className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all',
                  isActive ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-sidebar-accent/60'
                )}>
                  <Icon name="shield" size={17} className="shrink-0" />
                  {!sidebarCollapsed && <span>Admin Portal</span>}
                </div>
              )}
            </Link>
          )}

          {/* Dark mode */}
          <button
            onClick={toggleDark}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-sidebar-accent/60 hover:text-foreground transition-colors"
          >
            <Icon name={resolvedDark ? 'sun' : 'moon'} size={17} className="shrink-0" />
            {!sidebarCollapsed && <span>{resolvedDark ? 'Light Mode' : 'Dark Mode'}</span>}
          </button>

          {/* Settings */}
          <Link to="/me/settings" className="group" onClick={handleMobileLinkClick}>
            {({ isActive }) => (
              <div className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all',
                isActive ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-sidebar-accent/60'
              )}>
                <Icon name="settings" size={17} className="shrink-0" />
                {!sidebarCollapsed && <span>Settings</span>}
              </div>
            )}
          </Link>

          {/* Logout */}
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
          >
            <Icon name="log-out" size={17} className="shrink-0" />
            {!sidebarCollapsed && <span>Sign out</span>}
          </button>

          {/* Collapse toggle */}
          <button
            onClick={toggleCollapsed}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground/50 hover:bg-sidebar-accent/40 hover:text-muted-foreground transition-colors"
          >
            <Icon name={sidebarCollapsed ? 'chevron-right' : 'chevron-left'} size={16} className="shrink-0" />
            {!sidebarCollapsed && <span className="text-xs">Collapse</span>}
          </button>
        </div>
      </aside>
    </>
  )
}
