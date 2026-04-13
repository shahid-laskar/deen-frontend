import React, { useState, useEffect, useRef } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { LayoutDashboard, BookOpen, Clock, Users, User } from 'lucide-react'
import { clsx } from 'clsx'

const TABS = [
  { to: '/dashboard',  icon: LayoutDashboard, label: 'Home' },
  { to: '/quran',      icon: BookOpen,         label: 'Quran' },
  { to: '/prayer',     icon: Clock,            label: 'Prayer' },
  { to: '/community',  icon: Users,            label: 'Community' },
  { to: '/settings',   icon: User,             label: 'Profile' },
]

export default function BottomNav() {
  const location    = useLocation()
  const [hidden, setHidden] = useState(false)
  const lastScrollY = useRef(0)
  const ticking     = useRef(false)

  // Hide-on-scroll-down, reveal-on-scroll-up
  useEffect(() => {
    const mainEl = document.getElementById('main-scroll')
    if (!mainEl) return

    const handleScroll = () => {
      if (ticking.current) return
      ticking.current = true
      requestAnimationFrame(() => {
        const currentY = mainEl.scrollTop
        const delta    = currentY - lastScrollY.current
        if (delta > 6 && currentY > 60)  setHidden(true)
        if (delta < -6)                   setHidden(false)
        lastScrollY.current = currentY
        ticking.current = false
      })
    }

    mainEl.addEventListener('scroll', handleScroll, { passive: true })
    return () => mainEl.removeEventListener('scroll', handleScroll)
  }, [])

  // Reset on route change
  useEffect(() => { setHidden(false) }, [location.pathname])

  return (
    <nav className={clsx('bottom-nav md:hidden', hidden && 'hidden')}>
      {/* Islamic geometric pattern strip at top of nav */}
      <div
        className="absolute top-0 left-0 right-0 h-px opacity-30 bg-geometric"
        style={{ backgroundSize: '40px 40px' }}
      />

      {TABS.map(({ to, icon: Icon, label }) => {
        const active = location.pathname.startsWith(to)
        return (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) => clsx('nav-tab', isActive && 'active')}
            onClick={() => {
              // Haptic-style animation handled by CSS :active
              if (window.navigator?.vibrate) window.navigator.vibrate(8)
            }}
          >
            {({ isActive }) => (
              <>
                <div className="relative">
                  <Icon size={22} strokeWidth={isActive ? 2 : 1.7} />
                  {isActive && (
                    <span
                      className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full"
                      style={{ background: 'var(--t-nav-active)' }}
                    />
                  )}
                </div>
                <span className="text-[10px] leading-none">{label}</span>
              </>
            )}
          </NavLink>
        )
      })}
    </nav>
  )
}
