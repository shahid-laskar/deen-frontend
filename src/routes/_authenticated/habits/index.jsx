import React, { useState } from 'react'
import { createFileRoute, Link } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { Plus, Sparkles, BookOpen } from 'lucide-react'
import { habitsApi } from '@/lib/api'
import { HabitCard } from '@/components/habits/HabitCard'
import { HabitFormSheet } from '@/components/habits/HabitFormSheet'
import { HealthScoreGauge } from '@/components/habits/HealthScoreGauge'
import { RahmahTokenBadge } from '@/components/habits/RahmahTokenBadge'

export const Route = createFileRoute('/_authenticated/habits/')({
  component: TodayPage,
})

const PRAYER_ORDER = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha']

function TodayPage() {
  const [showForm, setShowForm] = useState(false)
  const list = useQuery({
    queryKey: ['habits'],
    queryFn: () => habitsApi.list().catch(() => []),
  })
  const health = useQuery({
    queryKey: ['habits', 'health'],
    queryFn: () => habitsApi.healthScore().catch(() => ({ score: 0, label: 'Building' })),
  })

  const habits = (list.data ?? []).filter((h) => !h.archived)
  const completed = habits.filter((h) => h.today_completed).length
  const tokens = Math.max(...habits.map((h) => h.rahmah_tokens ?? 0), 0)

  const grouped = new Map()
  const unanchored = []
  for (const h of habits) {
    if (h.anchor_prayer && PRAYER_ORDER.includes(h.anchor_prayer)) {
      const arr = grouped.get(h.anchor_prayer) ?? []
      arr.push(h)
      grouped.set(h.anchor_prayer, arr)
    } else {
      unanchored.push(h)
    }
  }

  return (
    <div className="space-y-6 animate-slide-up">
      <div className="rounded-3xl glass-card shadow-elevated p-5 md:p-6">
        <div className="flex items-center gap-5 flex-wrap">
          <HealthScoreGauge score={health.data?.score ?? 0} label={health.data?.label ?? 'Building'} />
          <div className="flex-1 min-w-[180px]">
            <p className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground">
              Today's progress
            </p>
            <p className="text-3xl font-bold mt-1 tabular-nums">
              {completed} <span className="text-base text-muted-foreground font-semibold">/ {habits.length}</span>
            </p>
            <div className="mt-2 h-2 w-full max-w-xs rounded-full bg-muted overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-primary to-gold transition-all duration-500"
                style={{ width: `${habits.length ? (completed / habits.length) * 100 : 0}%` }}
              />
            </div>
          </div>
          <div className="flex flex-col gap-2 items-end">
            <RahmahTokenBadge tokens={tokens} />
            <button
              onClick={() => setShowForm(true)}
              className="flex items-center gap-2 rounded-2xl bg-primary text-primary-foreground px-4 py-2 text-sm font-bold shadow-glow-primary hover:opacity-90 transition-all"
            >
              <Plus className="h-4 w-4" />
              New
            </button>
          </div>
        </div>
      </div>

      {habits.length === 0 ? (
        <div className="rounded-2xl glass-card shadow-soft p-10 text-center space-y-4">
          <Sparkles className="h-8 w-8 mx-auto text-primary" />
          <p className="text-sm text-muted-foreground">No habits yet. Start small with proven practices.</p>
          <Link
            to="/habits/library"
            className="inline-flex items-center gap-2 rounded-xl bg-primary text-primary-foreground px-5 py-2.5 text-sm font-bold shadow-glow-primary"
          >
            <BookOpen className="h-4 w-4" />
            Browse the Habit Library
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {PRAYER_ORDER.filter((p) => grouped.has(p)).map((p) => (
            <section key={p} className="space-y-2">
              <h3 className="text-[10px] uppercase tracking-[0.2em] font-bold text-muted-foreground px-1">
                After {p}
              </h3>
              <div className="space-y-2">
                {grouped.get(p).map((h) => (
                  <HabitCard key={h.id} habit={h} />
                ))}
              </div>
            </section>
          ))}

          {unanchored.length > 0 && (
            <section className="space-y-2">
              {grouped.size > 0 && (
                <h3 className="text-[10px] uppercase tracking-[0.2em] font-bold text-muted-foreground px-1">
                  Anytime
                </h3>
              )}
              <div className="space-y-2">
                {unanchored.map((h) => (
                  <HabitCard key={h.id} habit={h} />
                ))}
              </div>
            </section>
          )}
        </div>
      )}

      {showForm && <HabitFormSheet onClose={() => setShowForm(false)} />}
    </div>
  )
}
