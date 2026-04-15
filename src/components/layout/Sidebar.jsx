import React from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { clsx } from 'clsx'
import {
  LayoutDashboard, Clock, BookOpen, Target, BookMarked,
  CheckSquare, Sparkles, Settings, Moon, Sun, Heart, LogOut,
  Utensils, Dumbbell, Baby, Compass, Users, HandHeart, ChevronRight
} from 'lucide-react'
import { useAuthStore } from '../../store/authStore'
import { useAppStore } from '../../store/appStore'
import { authApi } from '../../lib/api'
import toast from 'react-hot-toast'

const V1_NAV = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/prayer',    icon: Clock,           label: 'Prayer' },
  { to: '/quran',     icon: BookOpen,        label: 'Quran & Hifz' },
  { to: '/learning',  icon: BookOpen,        label: 'Learning Hub' },
  { to: '/habits',    icon: Target,          label: 'Habits' },
  { to: '/journal',   icon: BookMarked,      label: 'Journal' },
  { to: '/tasks',     icon: CheckSquare,     label: 'Planner' },
  { to: '/ai',        icon: Sparkles,        label: 'AI Guide' },
  { to: '/qibla',     icon: Compass,         label: 'Qibla & Mosques' },
  { to: '/gamification', icon: Target,       label: 'Journey & Gamification' },
]

const V2_NAV = [
  { to: '/meal',     icon: Utensils,  label: 'Meal Planner' },
  { to: '/workout',  icon: Dumbbell,  label: 'Workout' },
  { to: '/children', icon: Baby,      label: 'Child Upbringing' },
]

const V3_NAV = [
  { to: '/community', icon: Users,     label: 'Community' },
  { to: '/waqf',      icon: HandHeart, label: 'Waqf & Sadaqah' },
]

const FEMALE_NAV = [{ to: '/female', icon: Heart, label: "Sister's Space" }]

function NavItem({ to, icon: Icon, label, pink = false }) {
  return (
    <NavLink to={to} className={({ isActive }) => clsx(
      'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-150',
      isActive && 'font-medium shadow-sm'
    )}
    style={({ isActive }) => ({
      background: isActive ? (pink ? 'rgba(236,72,153,0.15)' : 'var(--t-primary)') : 'transparent',
      color: isActive ? (pink ? '#f472b6' : '#ffffff') : (pink ? 'rgba(236,72,153,0.7)' : 'var(--t-text-muted)'),
    })}>
      {({ isActive }) => <><Icon size={18} style={{ color: isActive ? (pink ? '#f472b6' : 'white') : (pink ? 'rgba(236,72,153,0.6)' : 'var(--t-text-muted)') }} />{label}</>}
    </NavLink>
  )
}

function SectionLabel({ label }) {
  return <p className="pt-3 pb-1 px-3 text-xs uppercase tracking-wider font-medium" style={{ color: 'var(--t-accent)' }}>{label}</p>
}

export default function Sidebar() {
  const { user, isFemale, logout } = useAuthStore()
  const { sidebarOpen, toggleSidebar, setSidebarOpen, theme, toggleTheme } = useAppStore()
  const navigate = useNavigate()

  const handleLogout = async () => {
    try { const r = localStorage.getItem('refresh_token'); if (r) await authApi.logout(r) } catch {}
    logout()
    navigate('/login')
    toast.success('Logged out. Assalamu Alaikum!')
  }

  return (
    <>
      {sidebarOpen && <div className="fixed inset-0 bg-black/40 z-30 md:hidden" onClick={toggleSidebar} />}
      <aside className={clsx(
        'fixed left-0 top-0 h-full z-40 flex flex-col transition-transform duration-300 w-[260px]',
        sidebarOpen ? 'translate-x-0' : '-translate-x-full', 'md:relative md:translate-x-0'
      )} style={{ background: 'var(--t-bg-sidebar)', borderRight: '1px solid var(--t-border)' }}>
        {/* Logo */}
        <div className="flex items-center gap-3 px-6 py-5" style={{ borderBottom: '1px solid var(--t-border)' }}>
          <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'var(--t-accent)' }}>
            <span className="font-arabic text-white font-bold text-lg leading-none">د</span>
          </div>
          <div>
            <h1 className="font-display text-white font-semibold text-lg leading-none" style={{ color: 'var(--t-text)' }}>Deen</h1>
            <p className="text-xs mt-0.5" style={{ color: 'var(--t-primary)' }}>Islamic Companion</p>
          </div>
          <button onClick={toggleSidebar} className="ml-auto md:hidden hover:text-white" style={{ color: 'var(--t-text-muted)' }}><ChevronRight size={18} /></button>
        </div>

        {/* User */}
        <div className="px-4 py-4" style={{ borderBottom: '1px solid var(--t-border)' }}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center font-semibold text-sm" style={{ background: 'rgba(20,168,96,0.1)', color: 'var(--t-primary)' }}>
              {user?.email?.[0]?.toUpperCase() ?? 'U'}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium truncate" style={{ color: 'var(--t-text)' }}>{user?.profile?.display_name || user?.email?.split('@')[0] || 'User'}</p>
              <p className="text-xs capitalize" style={{ color: 'var(--t-text-muted)' }}>{user?.madhab} school</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
          {V1_NAV.map(n => <NavItem key={n.to} {...n} />)}

          <SectionLabel label="Wellness" />
          {V2_NAV.map(n => <NavItem key={n.to} {...n} />)}

          <SectionLabel label="Community" />
          {V3_NAV.map(n => <NavItem key={n.to} {...n} />)}

          {isFemale() && (
            <>
              <SectionLabel label="Sister's Tools" />
              {FEMALE_NAV.map(n => <NavItem key={n.to} {...n} pink />)}
            </>
          )}
        </nav>

        {/* Bottom */}
        <div className="px-3 py-4 border-t border-emerald-900/50 space-y-0.5">
          <NavItem to="/settings" icon={Settings} label="Settings" />
          <button onClick={toggleTheme} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-emerald-400 hover:bg-emerald-900/50 hover:text-emerald-200 transition-all">
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            {theme === 'dark' ? 'Light mode' : 'Dark mode'}
          </button>
          <button onClick={handleLogout} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-emerald-500 hover:bg-red-900/20 hover:text-red-400 transition-all">
            <LogOut size={18} /> Sign out
          </button>
        </div>
      </aside>
    </>
  )
}
