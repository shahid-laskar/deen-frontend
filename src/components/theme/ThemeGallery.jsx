import React, { useState, useEffect, useCallback } from 'react'
import { X, Sun, Moon, Monitor, Palette, ChevronDown, ChevronUp } from 'lucide-react'
import { useTheme } from '@/lib/theme-context'
import { ThemeSwatch } from './ThemeSwatch'
import { cn } from '@/lib/utils'

const CATEGORIES = ['all', 'traditional', 'modern', 'luxury', 'nature']

const ICON_PACKS = [
  { id: 'lucide', label: 'Lucide' },
  { id: 'lucide-filled', label: 'Lucide Filled' },
  { id: 'phosphor', label: 'Phosphor' },
  { id: 'phosphor-duotone', label: 'Phosphor Duotone' },
  { id: 'tabler', label: 'Tabler' },
  { id: 'hugeicons', label: 'Hugeicons' },
  { id: 'remix', label: 'Remix' },
  { id: 'iconoir', label: 'Iconoir' },
]

const TYPESETS = [
  { id: 'classic', label: 'Classic Scholar' },
  { id: 'editorial', label: 'Editorial' },
  { id: 'royal', label: 'Royal' },
  { id: 'modern', label: 'Modern' },
  { id: 'geometric', label: 'Geometric' },
  { id: 'soft', label: 'Soft' },
]

function ModeButton({ value, current, onClick, icon: Icon, label }) {
  return (
    <button
      onClick={() => onClick(value)}
      className={cn(
        'flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all',
        current === value
          ? 'bg-primary text-primary-foreground shadow-sm'
          : 'bg-muted text-muted-foreground hover:bg-accent hover:text-accent-foreground'
      )}
    >
      <Icon className="h-3.5 w-3.5" />
      {label}
    </button>
  )
}

/**
 * ThemeGallery — full-screen modal for 24-theme + icon + typeset selection.
 */
export function ThemeGallery({ open, onClose }) {
  const {
    themes, themeId, mode, iconPack, typeset,
    setTheme, setMode, setIconPackOverride, setTypesetOverride,
  } = useTheme()

  const [tab, setTab] = useState('all')
  const [showAdvanced, setShowAdvanced] = useState(false)

  // Close on Escape
  useEffect(() => {
    if (!open) return
    const handler = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open, onClose])

  // Prevent body scroll while open
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  const filtered = tab === 'all'
    ? themes
    : themes.filter(t => t.category === tab)

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="relative z-10 flex flex-col w-full max-w-3xl max-h-[90vh] rounded-2xl border border-border bg-card shadow-2xl animate-slide-up overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-5 py-4 shrink-0">
          <div className="flex items-center gap-2">
            <Palette className="h-5 w-5 text-primary" />
            <h2 className="text-base font-semibold text-foreground">Choose Theme</h2>
            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-semibold text-primary">
              24 themes
            </span>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted transition-colors"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Mode toggle */}
        <div className="flex items-center justify-between border-b border-border px-5 py-3 shrink-0">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Display Mode</span>
          <div className="flex gap-1.5">
            <ModeButton value="light" current={mode} onClick={setMode} icon={Sun} label="Light" />
            <ModeButton value="dark" current={mode} onClick={setMode} icon={Moon} label="Dark" />
            <ModeButton value="system" current={mode} onClick={setMode} icon={Monitor} label="System" />
          </div>
        </div>

        {/* Category tabs */}
        <div className="flex gap-1 border-b border-border px-5 py-2 shrink-0 overflow-x-auto scrollbar-none">
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setTab(cat)}
              className={cn(
                'shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium capitalize transition-all',
                tab === cat
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              )}
            >
              {cat === 'all' ? `All (${themes.length})` : `${cat} (${themes.filter(t => t.category === cat).length})`}
            </button>
          ))}
        </div>

        {/* Theme grid — scrollable */}
        <div className="flex-1 overflow-y-auto p-5">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {filtered.map(theme => (
              <ThemeSwatch
                key={theme.id}
                theme={theme}
                isActive={theme.id === themeId}
                onSelect={(id) => {
                  setTheme(id)
                  onClose()
                }}
              />
            ))}
          </div>

          {/* Advanced overrides */}
          <div className="mt-5 rounded-xl border border-border bg-muted/40">
            <button
              onClick={() => setShowAdvanced(v => !v)}
              className="flex w-full items-center justify-between px-4 py-3 text-sm font-medium text-foreground"
            >
              <span>Advanced Overrides</span>
              {showAdvanced
                ? <ChevronUp className="h-4 w-4 text-muted-foreground" />
                : <ChevronDown className="h-4 w-4 text-muted-foreground" />
              }
            </button>

            {showAdvanced && (
              <div className="border-t border-border px-4 pb-4 pt-3 space-y-4">
                <p className="text-xs text-muted-foreground">
                  Override the icon pack and typography independently of your theme.
                </p>

                {/* Icon pack override */}
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-foreground uppercase tracking-wider">Icon Pack</p>
                  <div className="flex flex-wrap gap-1.5">
                    <button
                      onClick={() => setIconPackOverride(null)}
                      className={cn(
                        'rounded-lg border px-2.5 py-1 text-xs font-medium transition-all',
                        iconPack === themes.find(t => t.id === themeId)?.icons && !localStorage.getItem('deen.icons-override')
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-border text-muted-foreground hover:border-primary/40'
                      )}
                    >
                      Theme default
                    </button>
                    {ICON_PACKS.map(p => (
                      <button
                        key={p.id}
                        onClick={() => setIconPackOverride(p.id)}
                        className={cn(
                          'rounded-lg border px-2.5 py-1 text-xs font-medium transition-all',
                          iconPack === p.id
                            ? 'border-primary bg-primary/10 text-primary'
                            : 'border-border text-muted-foreground hover:border-primary/40'
                        )}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Typography override */}
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-foreground uppercase tracking-wider">Typography</p>
                  <div className="flex flex-wrap gap-1.5">
                    <button
                      onClick={() => setTypesetOverride(null)}
                      className="rounded-lg border border-border px-2.5 py-1 text-xs font-medium text-muted-foreground hover:border-primary/40"
                    >
                      Theme default
                    </button>
                    {TYPESETS.map(ts => (
                      <button
                        key={ts.id}
                        onClick={() => setTypesetOverride(ts.id)}
                        className={cn(
                          'rounded-lg border px-2.5 py-1 text-xs font-medium transition-all',
                          typeset === ts.id
                            ? 'border-primary bg-primary/10 text-primary'
                            : 'border-border text-muted-foreground hover:border-primary/40'
                        )}
                      >
                        {ts.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
