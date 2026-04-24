import React from 'react'
import { Link, useLocation } from '@tanstack/react-router'
import { LayoutDashboard, Clock, BookOpen, Heart } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { MoreSheet } from '@/components/layout/MoreSheet'

const tabs = [
  { title: 'Home', to: '/dashboard', icon: LayoutDashboard },
  { title: 'Prayer', to: '/prayer', icon: Clock },
  { title: 'Quran', to: '/quran', icon: BookOpen },
  { title: 'Habits', to: '/habits', icon: Heart },
]

export function BottomNav() {
  const location = useLocation()
  const user = useAuthStore((s) => s.user)

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border/40 glass-card md:hidden">
      <div className="flex items-center justify-around px-2 py-2">
        {tabs.map((tab) => {
          const isActive =
            location.pathname === tab.to || location.pathname.startsWith(tab.to + '/')
          const Icon = tab.icon
          return (
            <Link
              key={tab.to}
              to={tab.to}
              className={`relative flex flex-col items-center gap-0.5 px-4 py-1.5 rounded-2xl transition-all duration-300 ${
                isActive ? 'text-primary' : 'text-muted-foreground'
              }`}
            >
              <div
                className={`relative p-1.5 rounded-xl transition-all duration-300 ${
                  isActive ? 'bg-primary/12 scale-110' : 'hover:bg-muted/40'
                }`}
              >
                <Icon className="h-5 w-5" strokeWidth={isActive ? 2.2 : 1.8} />
                {isActive && (
                  <div className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-4 h-0.5 rounded-full bg-primary" />
                )}
              </div>
              <span
                className={`text-[10px] font-semibold transition-all ${
                  isActive ? 'text-primary' : ''
                }`}
              >
                {tab.title}
              </span>
            </Link>
          )
        })}
        <MoreSheet user={user} />
      </div>
    </nav>
  )
}
