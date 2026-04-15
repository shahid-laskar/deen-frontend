import React from 'react'
import { Link, useRouterState } from '@tanstack/react-router'
import { cn } from '@/lib/utils'
import { LayoutDashboard, Clock, BookOpen, Heart, Sparkles } from 'lucide-react'

const TABS = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Home' },
  { to: '/prayer',    icon: Clock,           label: 'Prayer' },
  { to: '/quran',     icon: BookOpen,        label: 'Quran' },
  { to: '/habits',    icon: Heart,           label: 'Habits' },
  { to: '/ai',        icon: Sparkles,        label: 'AI' },
]

export function BottomNav() {
  const { location } = useRouterState()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-card/95 backdrop-blur-lg md:hidden"
         style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
      <div className="flex items-center justify-around px-2 py-1.5">
        {TABS.map((tab) => {
          const isActive = location.pathname === tab.to || location.pathname.startsWith(tab.to + '/')
          return (
            <Link
              key={tab.to}
              to={tab.to}
              className={cn(
                'flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all',
                isActive ? 'text-primary' : 'text-muted-foreground'
              )}
            >
              <div className={cn('p-1 rounded-lg transition-all', isActive && 'bg-primary/10')}>
                <tab.icon className="h-5 w-5" />
              </div>
              <span className="text-[10px] font-medium">{tab.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
