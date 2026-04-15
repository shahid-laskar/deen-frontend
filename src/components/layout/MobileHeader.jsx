import React from 'react'
import { Link } from '@tanstack/react-router'
import { Moon, Sun, Menu } from 'lucide-react'
import { useThemeStore } from '@/store/themeStore'
import { useAppStore } from '@/store/appStore'
import { cn } from '@/lib/utils'

export function MobileHeader() {
  const { isDark, toggleDark } = useThemeStore()
  const { toggleSidebar } = useAppStore()

  return (
    <header className="flex items-center justify-between px-4 py-3 border-b border-border bg-card/80 backdrop-blur-md md:hidden sticky top-0 z-30">
      <div className="flex items-center gap-3">
        <button
          onClick={toggleSidebar}
          className="p-2 rounded-lg text-muted-foreground hover:bg-accent transition-colors"
          aria-label="Toggle menu"
        >
          <Menu className="h-5 w-5" />
        </button>
        <Link to="/dashboard" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <span className="font-amiri text-base font-bold leading-none">د</span>
          </div>
          <span className="text-base font-semibold tracking-tight text-foreground">Deen</span>
        </Link>
      </div>
      <button
        onClick={toggleDark}
        className="p-2 rounded-lg text-muted-foreground hover:bg-accent transition-colors"
        aria-label="Toggle dark mode"
      >
        {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
      </button>
    </header>
  )
}
