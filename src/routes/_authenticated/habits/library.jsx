import React, { useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { Search } from 'lucide-react'
import { habitsApi } from '@/lib/api'
import { LibraryCard } from '@/components/habits/LibraryCard'

export const Route = createFileRoute('/_authenticated/habits/library')({
  component: LibraryPage,
})

const CATEGORIES = ['all', 'ibadah', 'quran', 'dhikr', 'sunnah', 'health', 'knowledge', 'family', 'charity']
const DIFFICULTIES = ['ALL', 'EASY', 'MEDIUM', 'HARD']
const TYPES = ['ALL', 'BINARY', 'QUANTITY', 'DURATION', 'AVOID', 'CHECKLIST']

function LibraryPage() {
  const [category, setCategory] = useState('all')
  const [difficulty, setDifficulty] = useState('ALL')
  const [habitType, setHabitType] = useState('ALL')
  const [q, setQ] = useState('')

  const lib = useQuery({
    queryKey: ['habits', 'library', category, difficulty, habitType],
    queryFn: () =>
      habitsApi
        .library({
          category: category === 'all' ? undefined : category,
          difficulty: difficulty === 'ALL' ? undefined : difficulty,
          habit_type: habitType === 'ALL' ? undefined : habitType,
        })
        .catch(() => []),
  })

  const items = (lib.data ?? []).filter(
    (i) => !q || i.name.toLowerCase().includes(q.toLowerCase()) || i.description?.toLowerCase().includes(q.toLowerCase())
  )

  return (
    <div className="space-y-5 animate-slide-up">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search the library…"
          className="w-full rounded-2xl border border-border/60 bg-card pl-10 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
      </div>

      <div className="space-y-2">
        <div className="flex gap-1.5 flex-wrap">
          {CATEGORIES.map((c) => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              className={`rounded-full px-3 py-1 text-xs font-bold capitalize transition-all ${
                category === c ? 'bg-primary text-primary-foreground' : 'bg-muted/60 text-muted-foreground hover:bg-muted'
              }`}
            >
              {c}
            </button>
          ))}
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {DIFFICULTIES.map((d) => (
            <button
              key={d}
              onClick={() => setDifficulty(d)}
              className={`rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider transition-all ${
                difficulty === d ? 'bg-foreground text-background' : 'bg-muted/40 text-muted-foreground hover:bg-muted'
              }`}
            >
              {d}
            </button>
          ))}
          <span className="mx-1 text-muted-foreground/40">|</span>
          {TYPES.map((t) => (
            <button
              key={t}
              onClick={() => setHabitType(t)}
              className={`rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider transition-all ${
                habitType === t ? 'bg-foreground text-background' : 'bg-muted/40 text-muted-foreground hover:bg-muted'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {lib.isLoading ? (
        <div className="rounded-2xl glass-card shadow-soft p-8 text-center">
          <p className="text-sm text-muted-foreground">Loading library…</p>
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-2xl glass-card shadow-soft p-8 text-center">
          <p className="text-sm text-muted-foreground">No matches.</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {items.map((i) => (
            <LibraryCard key={i.key} item={i} />
          ))}
        </div>
      )}
    </div>
  )
}
