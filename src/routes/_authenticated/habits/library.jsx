import React, { useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Search, Plus, Check, Filter } from 'lucide-react'
import api from '@/lib/api'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import toast from 'react-hot-toast'

export const Route = createFileRoute('/_authenticated/habits/library')({
  component: HabitsLibraryPage,
})

const CATEGORIES = ['ibadah', 'quran', 'dhikr', 'sunnah', 'health', 'learning', 'personal', 'family', 'fasting', 'sadaqah', 'avoid']
const DIFFICULTIES = ['easy', 'medium', 'hard', 'epic']
const HABIT_TYPES = ['binary', 'quantity', 'duration', 'avoid', 'checklist']

const CAT_ICONS = {
  ibadah: '🕌', quran: '📖', dhikr: '📿', sunnah: '🌙', health: '💪',
  learning: '📚', personal: '✅', family: '👨‍👩‍👧', fasting: '🌙', sadaqah: '💚', avoid: '🚫',
}
const DIFF_STYLE = {
  easy: 'text-green-600 bg-green-500/10 border-green-500/20',
  medium: 'text-orange-600 bg-orange-500/10 border-orange-500/20',
  hard: 'text-red-600 bg-red-500/10 border-red-500/20',
  epic: 'text-purple-600 bg-purple-500/10 border-purple-500/20',
}
const CAT_GRADIENT = {
  ibadah: 'from-primary/15 to-transparent',
  quran: 'from-gold/20 to-transparent',
  dhikr: 'from-sage/20 to-transparent',
  sunnah: 'from-primary/10 to-sage/10',
  health: 'from-green-500/15 to-transparent',
  learning: 'from-blue-500/10 to-transparent',
  personal: 'from-muted/40 to-transparent',
  family: 'from-pink-500/10 to-transparent',
  fasting: 'from-gold/15 to-transparent',
  sadaqah: 'from-sage/15 to-transparent',
  avoid: 'from-red-500/10 to-transparent',
}

function HabitsLibraryPage() {
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const [catFilter, setCatFilter] = useState('')
  const [diffFilter, setDiffFilter] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [added, setAdded] = useState(new Set())

  const { data: library = [], isLoading } = useQuery({
    queryKey: ['habits', 'library', catFilter, diffFilter, typeFilter],
    queryFn: () => api.get('/habits/library', {
      params: {
        ...(catFilter && { category: catFilter }),
        ...(diffFilter && { difficulty: diffFilter }),
        ...(typeFilter && { habit_type: typeFilter }),
      }
    }).then(r => r.data).catch(() => []),
  })

  const { mutate: addHabit, isPending } = useMutation({
    mutationFn: (key) => api.post(`/habits/from-library?key=${key}`),
    onSuccess: (_, key) => {
      setAdded(prev => new Set([...prev, key]))
      qc.invalidateQueries({ queryKey: ['habits'] })
      toast.success('Habit added to your list! 🌱')
    },
    onError: (e) => toast.error(e.response?.data?.detail || 'Could not add habit'),
  })

  const filtered = library.filter(h =>
    !search || h.name.toLowerCase().includes(search.toLowerCase()) ||
    h.islamic_source?.toLowerCase().includes(search.toLowerCase())
  )

  // Group by category
  const groups = {}
  filtered.forEach(h => {
    if (!groups[h.category]) groups[h.category] = []
    groups[h.category].push(h)
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="animate-slide-up">
        <p className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground font-bold">Islamic Habits</p>
        <h1 className="font-amiri text-4xl md:text-5xl font-bold mt-2 text-gradient-primary">Library</h1>
        <p className="text-sm text-muted-foreground mt-2">120+ curated habits from Quran & Sunnah</p>
      </div>

      {/* Search */}
      <div className="relative animate-slide-up stagger-1">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search habits or Islamic sources…"
          className="w-full pl-10 pr-4 py-3 rounded-2xl glass-card shadow-soft border-0 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 bg-transparent"
        />
      </div>

      {/* Filters */}
      <div className="space-y-2 animate-slide-up stagger-2">
        {/* Category pills */}
        <div className="flex gap-1.5 overflow-x-auto scrollbar-none pb-1">
          <button
            onClick={() => setCatFilter('')}
            className={cn('px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all shrink-0',
              !catFilter ? 'bg-primary text-primary-foreground shadow-glow-primary' : 'glass-card shadow-soft text-muted-foreground hover:text-foreground')}
          >All</button>
          {CATEGORIES.map(c => (
            <button key={c}
              onClick={() => setCatFilter(catFilter === c ? '' : c)}
              className={cn('px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all shrink-0 capitalize flex items-center gap-1',
                catFilter === c ? 'bg-primary text-primary-foreground shadow-glow-primary' : 'glass-card shadow-soft text-muted-foreground hover:text-foreground')}
            >
              {CAT_ICONS[c]} {c}
            </button>
          ))}
        </div>

        {/* Difficulty + Type row */}
        <div className="flex gap-1.5 overflow-x-auto scrollbar-none pb-1">
          {DIFFICULTIES.map(d => (
            <button key={d}
              onClick={() => setDiffFilter(diffFilter === d ? '' : d)}
              className={cn('px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all shrink-0 capitalize',
                diffFilter === d ? 'bg-primary/10 text-primary border border-primary/30' : 'glass-card shadow-soft text-muted-foreground hover:text-foreground')}
            >{d}</button>
          ))}
          <div className="w-px bg-border mx-1 shrink-0" />
          {HABIT_TYPES.map(t => (
            <button key={t}
              onClick={() => setTypeFilter(typeFilter === t ? '' : t)}
              className={cn('px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all shrink-0 capitalize',
                typeFilter === t ? 'bg-primary/10 text-primary border border-primary/30' : 'glass-card shadow-soft text-muted-foreground hover:text-foreground')}
            >{t}</button>
          ))}
        </div>
      </div>

      {/* Results count */}
      <p className="text-xs font-bold text-muted-foreground animate-slide-up stagger-2">
        {isLoading ? 'Loading…' : `${filtered.length} habits`}
      </p>

      {/* Grouped cards */}
      <div className="space-y-8 animate-slide-up stagger-3">
        {Object.entries(groups).map(([cat, items]) => (
          <div key={cat}>
            <h2 className="flex items-center gap-2 text-sm font-black uppercase tracking-widest text-muted-foreground mb-3">
              <span>{CAT_ICONS[cat]}</span> {cat}
            </h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {items.map(h => (
                <div key={h.key}
                  className={cn('relative overflow-hidden rounded-2xl glass-card shadow-soft hover:shadow-elevated card-hover p-5')}>
                  <div className={cn('absolute inset-0 bg-gradient-to-br', CAT_GRADIENT[h.category])} />
                  <div className="relative">
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex items-start gap-2 min-w-0">
                        <span className="text-xl shrink-0">{h.icon || CAT_ICONS[h.category]}</span>
                        <div className="min-w-0">
                          <h3 className="font-bold text-sm text-foreground leading-snug">{h.name}</h3>
                          {h.minimum_version && (
                            <p className="text-[10px] text-muted-foreground mt-0.5 italic">Min: {h.minimum_version}</p>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => !added.has(h.key) && addHabit(h.key)}
                        disabled={isPending || added.has(h.key)}
                        className={cn(
                          'shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all',
                          added.has(h.key)
                            ? 'bg-sage/15 text-sage cursor-default'
                            : 'bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground hover:shadow-glow-primary'
                        )}
                      >
                        {added.has(h.key) ? <><Check className="h-3 w-3" /> Added</> : <><Plus className="h-3 w-3" /> Add</>}
                      </button>
                    </div>

                    {/* Islamic source */}
                    {h.islamic_source && (
                      <p className="font-amiri text-base text-primary/80 leading-snug mb-2" dir="auto">{h.islamic_source}</p>
                    )}

                    {/* Tags */}
                    <div className="flex gap-1.5 flex-wrap">
                      <span className={cn('text-[9px] font-black uppercase px-2 py-0.5 rounded-md border', DIFF_STYLE[h.difficulty])}>
                        {h.difficulty}
                      </span>
                      <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-md border border-border/60 text-muted-foreground">
                        {h.habit_type}
                      </span>
                      {h.estimated_minutes && (
                        <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-md border border-border/60 text-muted-foreground">
                          ~{h.estimated_minutes}min
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}

        {filtered.length === 0 && !isLoading && (
          <div className="rounded-2xl glass-card shadow-soft p-10 text-center">
            <span className="text-4xl mb-4 block">🔍</span>
            <p className="text-sm text-muted-foreground">No habits found. Try adjusting your filters.</p>
          </div>
        )}
      </div>
    </div>
  )
}
