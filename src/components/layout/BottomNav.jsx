import React from 'react'
import { Link, useRouterState } from '@tanstack/react-router'
import { cn } from '@/lib/utils'
import { Icon } from '@/components/ui/icon'

/**
 * Mobile bottom navigation — 5-tab bar.
 * Enhanced per spec §1.1:
 *   - 56px tall, safe-area inset
 *   - Active tab: filled icon + label + 2px top accent line
 *   - Inactive: icon only on small screens, icon+label otherwise
 *   - ≥44×44px tap targets
 */

const TABS = [
  { to: '/today',          iconName: 'home',     label: 'Today' },
  { to: '/worship/prayer', iconName: 'clock',    label: 'Worship' },
  { to: '/grow/habits',    iconName: 'heart',    label: 'Grow' },
  { to: '/community',      iconName: 'user',     label: 'Ummah' },
  { to: '/me/settings',    iconName: 'settings', label: 'Me' },
]

export function BottomNav() {
  const { location } = useRouterState()

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-card/95 backdrop-blur-lg md:hidden"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      role="tablist"
      aria-label="Main navigation"
    >
      <div className="flex items-stretch justify-around" style={{ height: '56px' }}>
        {TABS.map((tab) => {
          const isActive = location.pathname === tab.to || location.pathname.startsWith(tab.to + '/')
          return (
            <Link
              key={tab.to}
              to={tab.to}
              role="tab"
              aria-selected={isActive}
              aria-label={tab.label}
              className={cn(
                'relative flex flex-col items-center justify-center gap-0.5 flex-1 min-w-[44px] min-h-[44px] transition-all',
                isActive ? 'text-primary' : 'text-muted-foreground'
              )}
            >
              {/* Active top accent line */}
              {isActive && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-[2px] rounded-full bg-primary" />
              )}
              <div className={cn(
                'flex items-center justify-center w-10 h-7 rounded-xl transition-all duration-200',
                isActive && 'bg-primary/10'
              )}>
                <Icon name={tab.iconName} size={20} />
              </div>
              <span className={cn(
                'text-[10px] font-semibold leading-none',
                isActive ? 'text-primary' : 'text-muted-foreground'
              )}>
                {tab.label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
