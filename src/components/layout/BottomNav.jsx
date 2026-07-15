import React, { useState } from 'react'
import { Link, useRouterState, useNavigate } from '@tanstack/react-router'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { Icon } from '@/components/ui/icon'
import { HUB_NAV } from '@/components/layout/Sidebar'
import { useAuthStore } from '@/store/authStore'

/**
 * Mobile bottom navigation — 5-tab bar with Apple-style drawers.
 * Uses Framer Motion layoutId for smooth floating pill indicator.
 */

const TABS = [
  { to: '/today',     base: '/today',     iconName: 'home',  label: 'Today'   },
  { to: '/worship',   base: '/worship',   iconName: 'moon',  label: 'Worship' },
  { to: '/grow',      base: '/grow',      iconName: 'heart', label: 'Grow'    },
  { to: '/community', base: '/community', iconName: 'users', label: 'Ummah'   },
  { to: '/me',        base: '/me',        iconName: 'user',  label: 'Me'      },
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
      setActiveDrawer(activeDrawer?.label === hub.label ? null : hub)
    } else {
      setActiveDrawer(null)
      navigate({ to: tab.to })
    }
  }

  return (
    <>
      {/* Drawer Overlay */}
      <AnimatePresence>
        {activeDrawer && (
          <motion.div
            className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm md:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setActiveDrawer(null)}
          />
        )}
      </AnimatePresence>

      {/* Floating Drawer Sheet */}
      <AnimatePresence>
        {activeDrawer && (
          <motion.div
            className="fixed bottom-[68px] left-3 right-3 z-[101] glass-strong md:hidden rounded-3xl border border-border/50 shadow-elevated p-5"
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.96 }}
            transition={{ type: 'spring', stiffness: 380, damping: 30 }}
            drag="y"
            dragConstraints={{ top: 0, bottom: 200 }}
            dragElastic={0.15}
            onDragEnd={(e, info) => { if (info.offset.y > 50) setActiveDrawer(null) }}
          >
            {/* Handle */}
            <div className="absolute top-2.5 left-1/2 -translate-x-1/2 w-10 h-1 bg-muted-foreground/20 rounded-full cursor-grab active:cursor-grabbing" />

            <div className="mt-3 space-y-4">
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/50 px-1">
                {activeDrawer.label}
              </p>
              <div className="flex flex-wrap gap-3">
                {activeDrawer.items.map((item, i) => {
                  if (item.femaleOnly && !isFemale?.()) return null
                  const isItemActive = location.pathname === item.to || location.pathname.startsWith(item.to + '/')
                  return (
                    <motion.div
                      key={item.to}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.04, type: 'spring', stiffness: 300, damping: 25 }}
                    >
                      <Link
                        to={item.to}
                        onClick={() => setActiveDrawer(null)}
                        className="flex flex-col items-center gap-2 group w-[68px]"
                      >
                        <div className={cn(
                          'w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-200 relative shadow-sm',
                          isItemActive
                            ? 'bg-gradient-to-br from-primary to-primary/80 shadow-glow-primary scale-105'
                            : 'bg-card border border-border/60 group-hover:scale-105 group-hover:border-primary/30 group-hover:shadow-md'
                        )}>
                          <Icon
                            name={item.iconName}
                            size={22}
                            className={isItemActive ? 'text-primary-foreground' : 'text-primary/70'}
                          />
                          {isItemActive && (
                            <motion.div
                              className="absolute -top-1 -right-1 w-4 h-4 bg-background rounded-full flex items-center justify-center"
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              transition={{ type: 'spring', stiffness: 500, damping: 20 }}
                            >
                              <div className="w-2.5 h-2.5 bg-primary rounded-full" />
                            </motion.div>
                          )}
                        </div>
                        <span className={cn(
                          'text-[10px] font-semibold text-center leading-tight',
                          isItemActive ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground'
                        )}>
                          {item.label}
                        </span>
                      </Link>
                    </motion.div>
                  )
                })}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tab Bar */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-50 md:hidden glass-strong border-t border-border/40"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
        role="tablist"
        aria-label="Main navigation"
      >
        <div className="flex items-stretch justify-around" style={{ height: '60px' }}>
          {TABS.map((tab) => {
            const isActive = location.pathname === tab.base || location.pathname.startsWith(tab.base + '/')
            const isDrawerOpen = activeDrawer?.label === (tab.label === 'Ummah' ? 'Community' : tab.label)

            return (
              <button
                key={tab.to}
                onClick={(e) => handleTabClick(e, tab)}
                role="tab"
                aria-selected={isActive || isDrawerOpen}
                aria-label={tab.label}
                className="relative flex flex-col items-center justify-center gap-1 flex-1 min-w-[44px] min-h-[44px] transition-all"
              >
                {/* Floating pill indicator */}
                {isActive && (
                  <motion.div
                    layoutId="bottom-nav-pill"
                    className="absolute inset-x-2 top-1 h-[2px] rounded-full bg-primary"
                    initial={false}
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  />
                )}

                <motion.div
                  className={cn(
                    'flex items-center justify-center w-10 h-7 rounded-xl transition-all duration-200',
                    (isActive || isDrawerOpen) ? 'bg-primary/10' : ''
                  )}
                  animate={{
                    scale: isDrawerOpen ? 1.15 : 1,
                  }}
                  transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                >
                  <Icon
                    name={tab.iconName}
                    size={19}
                    className={cn(
                      'transition-colors',
                      (isActive || isDrawerOpen) ? 'text-primary' : 'text-muted-foreground'
                    )}
                  />
                </motion.div>
                <span className={cn(
                  'text-[10px] font-bold leading-none transition-colors',
                  (isActive || isDrawerOpen) ? 'text-primary' : 'text-muted-foreground'
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
