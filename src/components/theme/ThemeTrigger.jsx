import React, { useState } from 'react'
import { Palette } from 'lucide-react'
import { useTheme } from '@/lib/theme-context'
import { cn } from '@/lib/utils'
import { ThemeGallery } from './ThemeGallery'

/**
 * ThemeTrigger — palette button that opens the ThemeGallery dialog.
 * Drop this anywhere in the layout (Sidebar footer, MobileHeader, etc.)
 */
export function ThemeTrigger({ showLabel = false, className }) {
  const [open, setOpen] = useState(false)
  const { themes, themeId } = useTheme()
  const current = themes.find(t => t.id === themeId)
  const [s0, s1] = current?.swatches || ['#D4A574', '#8BA888']

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        aria-label="Open theme gallery"
        className={cn(
          'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-all duration-200',
          'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
          className
        )}
      >
        {/* Mini swatch preview */}
        <div className="relative h-[18px] w-[18px] shrink-0 flex items-center justify-center">
          <div
            className="h-[18px] w-[18px] rounded-full ring-1 ring-border/50 shadow-sm"
            style={{ background: `linear-gradient(135deg, ${s0}, ${s1})` }}
          />
        </div>
        {showLabel && <span>Theme</span>}
      </button>

      <ThemeGallery open={open} onClose={() => setOpen(false)} />
    </>
  )
}
