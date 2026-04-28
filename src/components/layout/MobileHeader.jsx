import React from 'react'
import { Link } from '@tanstack/react-router'
import { Menu } from 'lucide-react'
import { useTheme } from '@/lib/theme-context'
import { useAppStore } from '@/store/appStore'
import { Icon } from '@/components/ui/icon'
import { ThemeTrigger } from '@/components/theme/ThemeTrigger'
import { cn } from '@/lib/utils'

export function MobileHeader() {
  const { resolvedDark, setMode, mode } = useTheme()
  const { toggleSidebar } = useAppStore()

  const toggleDark = () => {
    if (mode === 'dark') setMode('light')
    else if (mode === 'light') setMode('dark')
    else setMode(resolvedDark ? 'light' : 'dark')
  }

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

      <div className="flex items-center gap-1">
        {/* Theme picker trigger */}
        <ThemeTrigger className="p-2" showLabel={false} />

        {/* Dark mode toggle */}
        <button
          onClick={toggleDark}
          className="p-2 rounded-lg text-muted-foreground hover:bg-accent transition-colors"
          aria-label="Toggle dark mode"
        >
          <Icon name={resolvedDark ? 'sun' : 'moon'} size={20} />
        </button>
      </div>
    </header>
  )
}
