import React, { useState } from 'react'
import { Link, useRouterState, useNavigate } from '@tanstack/react-router'
import { cn } from '@/lib/utils'
import { Icon } from '@/components/ui/icon'
import { HUB_NAV } from '@/components/layout/Sidebar'
import { useAuthStore } from '@/store/authStore'

/**
 * Mobile bottom navigation — 5-tab bar with Apple-style drawers.
 * Clicking a tab opens a bottom sheet with its sub-routes.
 */

const TABS = [
  { to: '/today',     base: '/today',     iconName: 'home',     label: 'Today' },
  { to: '/worship',   base: '/worship',   iconName: 'moon',     label: 'Worship' },
  { to: '/grow',      base: '/grow',      iconName: 'heart',    label: 'Grow' },
  { to: '/community', base: '/community', iconName: 'user',     label: 'Ummah' },
  { to: '/me',        base: '/me',        iconName: 'user',     label: 'Me' },
]

export function BottomNav() {
  const { location } = useRouterState()
  const navigate = useNavigate()
  const { isFemale } = useAuthStore()
  
  const [activeDrawer, setActiveDrawer] = useState(null)

  const handleTabClick = (e, tab) => {
    e.preventDefault()
    const hubLabel = tab.label === 'Ummah' ? 'Community' : tab.label
    const hub = HUB_NAV.find(h => h.label === hubLabel)
    
    if (hub && hub.items.length > 0) {
      // Toggle drawer off if clicking the same tab, otherwise open it
      setActiveDrawer(activeDrawer?.label === hub.label ? null : hub)
    } else {
      setActiveDrawer(null)
      navigate({ to: tab.to })
    }
  }

  return (
    <>
      {/* Drawer Overlay */}
      {activeDrawer && (
        <div 
          className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-sm md:hidden animate-fade-in"
          onClick={() => setActiveDrawer(null)}
        />
      )}

      {/* Floating Drawer Content */}
      <div 
        className={cn(
          "fixed bottom-[76px] left-4 right-4 z-[101] bg-card/90 backdrop-blur-xl md:hidden rounded-3xl border border-border shadow-2xl transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] p-5",
          activeDrawer ? "translate-y-0 opacity-100 scale-100" : "translate-y-12 opacity-0 scale-95 pointer-events-none"
        )}
      >
        {activeDrawer && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">
                {activeDrawer.label}
              </h3>
            </div>
            
            <div className="flex flex-wrap justify-start gap-x-4 gap-y-6">
              {activeDrawer.items.map(item => {
                if (item.femaleOnly && !isFemale?.()) return null
                const isItemActive = location.pathname === item.to || location.pathname.startsWith(item.to + '/')
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    onClick={() => setActiveDrawer(null)}
                    className="flex flex-col items-center gap-2 group w-[72px]"
                  >
                    <div className={cn(
                      "w-14 h-14 rounded-[1.25rem] flex items-center justify-center transition-all duration-300 relative",
                      isItemActive 
                        ? "bg-primary text-primary-foreground shadow-glow-primary scale-105" 
                        : "bg-surface-2 text-foreground border border-border shadow-sm group-hover:scale-105 group-hover:shadow-md"
                    )}>
                      <Icon name={item.iconName} size={24} className={isItemActive ? "text-primary-foreground" : "text-primary/80"} />
                      {isItemActive && (
                        <div className="absolute -top-1 -right-1 w-4 h-4 bg-background rounded-full flex items-center justify-center">
                          <div className="w-3 h-3 bg-primary rounded-full" />
                        </div>
                      )}
                    </div>
                    <span className={cn(
                      "text-[10px] font-bold text-center leading-tight px-1",
                      isItemActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
                    )}>
                      {item.label}
                    </span>
                  </Link>
                )
              })}
            </div>
          </div>
        )}
      </div>

      <nav
        className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-card/95 backdrop-blur-lg md:hidden"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
        role="tablist"
        aria-label="Main navigation"
      >
        <div className="flex items-stretch justify-around" style={{ height: '56px' }}>
          {TABS.map((tab) => {
            const isActive = location.pathname === tab.base || location.pathname.startsWith(tab.base + '/')
            return (
              <button
                key={tab.to}
                onClick={(e) => handleTabClick(e, tab)}
                role="tab"
                aria-selected={isActive || activeDrawer?.label === (tab.label === 'Ummah' ? 'Community' : tab.label)}
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
                  isActive && 'bg-primary/10',
                  activeDrawer?.label === (tab.label === 'Ummah' ? 'Community' : tab.label) && 'scale-110'
                )}>
                  <Icon name={tab.iconName} size={20} />
                </div>
                <span className={cn(
                  'text-[10px] font-semibold leading-none',
                  isActive ? 'text-primary' : 'text-muted-foreground'
                )}>
                  {tab.label}
                </span>
              </button>
            )
          })}
        </div>
      </nav>
    </>
  )
}
