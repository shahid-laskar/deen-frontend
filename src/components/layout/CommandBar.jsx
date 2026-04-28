import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { cn } from '@/lib/utils'
import { Icon } from '@/components/ui/icon'

/**
 * Global Command Bar (⌘K / Ctrl+K).
 * Per enhanced-ui spec §1.1:
 *   - Index: routes, surahs (114), duas, settings, recent screens
 *   - Fuzzy match with grouped results
 *   - ↑/↓ navigate, Enter open, Esc close
 */

// ─── Index data ────────────────────────────────────────────────────────────────

const ROUTES = [
  { type: 'page', label: 'Dashboard',       to: '/today',          icon: 'home' },
  { type: 'page', label: 'Planner',         to: '/today/tasks',    icon: 'list' },
  { type: 'page', label: 'Journal',         to: '/today/journal',  icon: 'notebook' },
  { type: 'page', label: 'Prayer Times',    to: '/worship/prayer', icon: 'clock' },
  { type: 'page', label: 'Quran',           to: '/worship/quran',  icon: 'book' },
  { type: 'page', label: 'Qibla Compass',   to: '/worship/qibla',  icon: 'compass' },
  { type: 'page', label: 'Habits',          to: '/grow/habits',    icon: 'heart' },
  { type: 'page', label: 'AI Guide',        to: '/grow/ai',        icon: 'sparkles' },
  { type: 'page', label: 'Learning',        to: '/grow/learning',  icon: 'book' },
  { type: 'page', label: 'Wellness',        to: '/grow/wellness',  icon: 'heart' },
  { type: 'page', label: 'Meals',           to: '/grow/meal',      icon: 'utensils' },
  { type: 'page', label: 'Workout',         to: '/grow/workout',   icon: 'activity' },
  { type: 'page', label: 'Islamic Finance', to: '/grow/finance',   icon: 'bank' },
  { type: 'page', label: 'Community',       to: '/community',      icon: 'user' },
  { type: 'page', label: 'Tarbiyah (Kids)', to: '/me/children',    icon: 'user' },
  { type: 'page', label: 'Family',          to: '/me/family',      icon: 'home' },
  { type: 'page', label: 'Settings',        to: '/me/settings',    icon: 'settings' },
  { type: 'page', label: 'Gamification',    to: '/grow/gamification', icon: 'star' },
  { type: 'page', label: 'Waqf & Sadaqah',  to: '/grow/waqf',     icon: 'heart' },
]

// Popular Surahs for quick access
const SURAHS = [
  { type: 'surah', label: 'Al-Fatiha (1)',      to: '/worship/quran/1',   icon: 'book' },
  { type: 'surah', label: 'Al-Baqarah (2)',     to: '/worship/quran/2',   icon: 'book' },
  { type: 'surah', label: 'Al-Imran (3)',        to: '/worship/quran/3',   icon: 'book' },
  { type: 'surah', label: 'An-Nisa (4)',         to: '/worship/quran/4',   icon: 'book' },
  { type: 'surah', label: 'Al-Maidah (5)',       to: '/worship/quran/5',   icon: 'book' },
  { type: 'surah', label: 'Al-Anam (6)',         to: '/worship/quran/6',   icon: 'book' },
  { type: 'surah', label: 'Al-Araf (7)',         to: '/worship/quran/7',   icon: 'book' },
  { type: 'surah', label: 'Yunus (10)',          to: '/worship/quran/10',  icon: 'book' },
  { type: 'surah', label: 'Yusuf (12)',          to: '/worship/quran/12',  icon: 'book' },
  { type: 'surah', label: 'Ar-Rahman (55)',      to: '/worship/quran/55',  icon: 'book' },
  { type: 'surah', label: 'Al-Mulk (67)',        to: '/worship/quran/67',  icon: 'book' },
  { type: 'surah', label: 'Al-Kahf (18)',        to: '/worship/quran/18',  icon: 'book' },
  { type: 'surah', label: 'Maryam (19)',         to: '/worship/quran/19',  icon: 'book' },
  { type: 'surah', label: 'Ta-Ha (20)',          to: '/worship/quran/20',  icon: 'book' },
  { type: 'surah', label: 'Ya-Sin (36)',         to: '/worship/quran/36',  icon: 'book' },
  { type: 'surah', label: 'Al-Waqiah (56)',      to: '/worship/quran/56',  icon: 'book' },
  { type: 'surah', label: 'Al-Hashr (59)',       to: '/worship/quran/59',  icon: 'book' },
  { type: 'surah', label: 'Al-Jumu\'ah (62)',    to: '/worship/quran/62',  icon: 'book' },
  { type: 'surah', label: 'An-Nas (114)',        to: '/worship/quran/114', icon: 'book' },
  { type: 'surah', label: 'Al-Falaq (113)',      to: '/worship/quran/113', icon: 'book' },
  { type: 'surah', label: 'Al-Ikhlas (112)',     to: '/worship/quran/112', icon: 'book' },
  { type: 'surah', label: 'Al-Kawthar (108)',    to: '/worship/quran/108', icon: 'book' },
]

const ALL_ITEMS = [...ROUTES, ...SURAHS]

// ─── Fuzzy search ──────────────────────────────────────────────────────────────
function fuzzyMatch(query, text) {
  const q = query.toLowerCase()
  const t = text.toLowerCase()
  if (t.includes(q)) return true
  // Simple fuzzy: all chars of query appear in order in text
  let qi = 0
  for (let ti = 0; ti < t.length && qi < q.length; ti++) {
    if (t[ti] === q[qi]) qi++
  }
  return qi === q.length
}

function searchItems(query) {
  if (!query.trim()) return []
  return ALL_ITEMS.filter(item => fuzzyMatch(query, item.label)).slice(0, 12)
}

function groupResults(results) {
  const groups = {}
  for (const item of results) {
    const key = item.type === 'surah' ? 'Surahs' : 'Pages'
    if (!groups[key]) groups[key] = []
    groups[key].push(item)
  }
  return groups
}

// ─── Component ─────────────────────────────────────────────────────────────────

export function CommandBar() {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef(null)
  const navigate = useNavigate()

  const results = query ? searchItems(query) : []
  const grouped = groupResults(results)
  const flatResults = results

  // Keyboard shortcut ⌘K / Ctrl+K
  useEffect(() => {
    const handler = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setOpen(prev => !prev)
      }
      if (e.key === 'Escape' && open) {
        setOpen(false)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open])

  // Focus input when opening
  useEffect(() => {
    if (open) {
      setQuery('')
      setSelectedIndex(0)
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [open])

  const handleSelect = useCallback((item) => {
    setOpen(false)
    navigate({ to: item.to })
  }, [navigate])

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex(i => Math.min(i + 1, flatResults.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex(i => Math.max(i - 1, 0))
    } else if (e.key === 'Enter' && flatResults[selectedIndex]) {
      handleSelect(flatResults[selectedIndex])
    }
  }

  if (!open) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-sm animate-fade-in"
        onClick={() => setOpen(false)}
      />

      {/* Dialog */}
      <div className="fixed inset-x-4 top-[12vh] md:inset-x-auto md:left-1/2 md:-translate-x-1/2 md:w-[560px] z-[101] animate-slide-up">
        <div className="rounded-2xl border border-border bg-card shadow-elevated overflow-hidden">
          {/* Search input */}
          <div className="flex items-center gap-3 px-4 py-3.5 border-b border-border">
            <Icon name="search" size={18} className="text-muted-foreground shrink-0" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => { setQuery(e.target.value); setSelectedIndex(0) }}
              onKeyDown={handleKeyDown}
              placeholder="Search pages, surahs, settings..."
              className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground/50 outline-none"
            />
            <kbd className="hidden md:inline-flex items-center gap-0.5 rounded-md border border-border bg-muted px-1.5 py-0.5 text-[10px] font-mono text-muted-foreground">
              ESC
            </kbd>
          </div>

          {/* Results */}
          <div className="max-h-[50vh] overflow-y-auto py-2">
            {query && flatResults.length === 0 && (
              <div className="px-4 py-8 text-center">
                <p className="text-sm text-muted-foreground">No results for "{query}"</p>
              </div>
            )}

            {Object.entries(grouped).map(([group, items]) => (
              <div key={group}>
                <p className="px-4 pt-2 pb-1 text-[10px] uppercase tracking-widest font-bold text-muted-foreground/60">
                  {group}
                </p>
                {items.map((item) => {
                  const globalIdx = flatResults.indexOf(item)
                  return (
                    <button
                      key={item.to}
                      onClick={() => handleSelect(item)}
                      onMouseEnter={() => setSelectedIndex(globalIdx)}
                      className={cn(
                        'w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors',
                        globalIdx === selectedIndex
                          ? 'bg-primary/10 text-primary'
                          : 'text-foreground hover:bg-muted/50'
                      )}
                    >
                      <Icon name={item.icon} size={16} className="shrink-0 opacity-60" />
                      <span className="text-sm font-medium truncate">{item.label}</span>
                      {globalIdx === selectedIndex && (
                        <kbd className="ml-auto text-[10px] text-primary/60 font-mono">↵</kbd>
                      )}
                    </button>
                  )
                })}
              </div>
            ))}

            {!query && (
              <div className="px-4 py-6 text-center space-y-2">
                <p className="text-sm text-muted-foreground">Start typing to search...</p>
                <div className="flex items-center justify-center gap-2 text-[11px] text-muted-foreground/50">
                  <span>Navigate</span>
                  <kbd className="rounded border border-border bg-muted px-1 py-0.5 font-mono text-[10px]">↑↓</kbd>
                  <span>Select</span>
                  <kbd className="rounded border border-border bg-muted px-1 py-0.5 font-mono text-[10px]">↵</kbd>
                  <span>Close</span>
                  <kbd className="rounded border border-border bg-muted px-1 py-0.5 font-mono text-[10px]">ESC</kbd>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}

/** Button trigger for the command bar (used in mobile header) */
export function CommandBarTrigger({ className }) {
  const handleOpen = () => {
    // Dispatch a synthetic ⌘K event to open the command bar
    window.dispatchEvent(new KeyboardEvent('keydown', {
      key: 'k',
      metaKey: true,
      bubbles: true,
    }))
  }

  return (
    <button
      onClick={handleOpen}
      className={cn(
        'flex items-center gap-2 rounded-lg text-muted-foreground hover:bg-accent transition-colors',
        className
      )}
      aria-label="Search (⌘K)"
    >
      <Icon name="search" size={18} />
    </button>
  )
}
