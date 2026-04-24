import React, { useState } from 'react'
import { createFileRoute, Link, useRouter } from '@tanstack/react-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Trash2, Pencil, Archive } from 'lucide-react'
import toast from 'react-hot-toast'
import { habitsApi } from '@/lib/api'
import { HabitHeatmap } from '@/components/habits/HabitHeatmap'
import { DayOfWeekChart } from '@/components/habits/DayOfWeekChart'
import { StreakFlame } from '@/components/habits/StreakFlame'
import { HabitFormSheet } from '@/components/habits/HabitFormSheet'

export const Route = createFileRoute('/_authenticated/habits/$id')({
  component: HabitDetailPage,
})

function HabitDetailPage() {
  const { id } = Route.useParams()
  const router = useRouter()
  const qc = useQueryClient()
  const [showForm, setShowForm] = useState(false)

  const habit = useQuery({
    queryKey: ['habit', id],
    queryFn: () => habitsApi.get(id),
  })

  const analytics = useQuery({
    queryKey: ['habit', id, 'analytics'],
    queryFn: () => habitsApi.analytics(id).catch(() => null),
  })

  const logs = useQuery({
    queryKey: ['habit', id, 'logs'],
    queryFn: () => habitsApi.logs(id, { days: 30 }).catch(() => []),
  })

  const remove = useMutation({
    mutationFn: () => habitsApi.remove(id),
    onSuccess: () => {
      toast.success('Habit deleted')
      qc.invalidateQueries({ queryKey: ['habits'] })
      router.navigate({ to: '/habits' })
    },
  })

  const archive = useMutation({
    mutationFn: (h) => habitsApi.update(h.id, { archived: !h.archived }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['habit', id] }),
  })

  if (habit.isLoading) {
    return <div className="rounded-2xl glass-card p-8 text-center text-sm text-muted-foreground">Loading…</div>
  }
  if (!habit.data) {
    return (
      <div className="rounded-2xl glass-card p-8 text-center space-y-3">
        <p className="text-sm text-muted-foreground">Habit not found.</p>
        <Link to="/habits" className="text-sm font-bold text-primary">Back to habits</Link>
      </div>
    )
  }
  const h = habit.data

  return (
    <div className="space-y-6 animate-slide-up">
      <Link to="/habits" className="inline-flex items-center gap-2 text-xs font-bold text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-3.5 w-3.5" />
        Back
      </Link>

      <div className="rounded-3xl glass-card shadow-elevated p-5 md:p-6">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-2xl font-bold">{h.name}</h2>
              <StreakFlame streak={h.current_streak ?? 0} />
            </div>
            {h.description && <p className="text-sm text-muted-foreground mt-1">{h.description}</p>}
            <div className="flex gap-2 mt-2 text-[10px] uppercase tracking-wider font-bold text-muted-foreground">
              {h.category && <span>{h.category}</span>}
              <span>· {h.habit_type ?? 'BINARY'}</span>
              <span>· {h.difficulty ?? 'EASY'}</span>
            </div>
          </div>
          <div className="flex gap-1">
            <button onClick={() => setShowForm(true)} className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/40">
              <Pencil className="h-4 w-4" />
            </button>
            <button onClick={() => archive.mutate(h)} className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/40">
              <Archive className="h-4 w-4" />
            </button>
            <button
              onClick={() => { if (window.confirm(`Delete "${h.name}"?`)) remove.mutate() }}
              className="p-2 rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/10"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>

        {h.islamic_source && (
          <div className="mt-4 rounded-xl bg-primary/5 p-4 border-l-2 border-primary">
            <p className="text-sm italic text-foreground/80">"{h.islamic_source}"</p>
          </div>
        )}

        <div className="grid grid-cols-3 gap-3 mt-5">
          <div className="rounded-xl bg-muted/40 p-3 text-center">
            <p className="text-[9px] uppercase tracking-widest font-bold text-muted-foreground">Current</p>
            <p className="text-2xl font-bold tabular-nums mt-1">{h.current_streak ?? 0}</p>
            <p className="text-[10px] text-muted-foreground">day streak</p>
          </div>
          <div className="rounded-xl bg-muted/40 p-3 text-center">
            <p className="text-[9px] uppercase tracking-widest font-bold text-muted-foreground">Longest</p>
            <p className="text-2xl font-bold tabular-nums mt-1">{h.longest_streak ?? 0}</p>
            <p className="text-[10px] text-muted-foreground">days</p>
          </div>
          <div className="rounded-xl bg-muted/40 p-3 text-center">
            <p className="text-[9px] uppercase tracking-widest font-bold text-muted-foreground">Rate</p>
            <p className="text-2xl font-bold tabular-nums mt-1">{Math.round((h.completion_rate ?? 0) * 100)}%</p>
            <p className="text-[10px] text-muted-foreground">overall</p>
          </div>
        </div>
      </div>

      {analytics.data && (
        <>
          <div className="rounded-2xl glass-card shadow-soft p-5">
            <h3 className="text-[10px] uppercase tracking-[0.2em] font-bold text-muted-foreground mb-4">365-day activity</h3>
            <HabitHeatmap data={analytics.data.heatmap} />
            <div className="mt-3 flex items-center gap-2 text-[10px] text-muted-foreground">
              <span>Less</span>
              <div className="h-2.5 w-2.5 rounded-sm bg-muted/30" />
              <div className="h-2.5 w-2.5 rounded-sm bg-primary/30" />
              <div className="h-2.5 w-2.5 rounded-sm bg-primary/50" />
              <div className="h-2.5 w-2.5 rounded-sm bg-primary/70" />
              <div className="h-2.5 w-2.5 rounded-sm bg-primary" />
              <span>More</span>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl glass-card shadow-soft p-5">
              <h3 className="text-[10px] uppercase tracking-[0.2em] font-bold text-muted-foreground mb-4">By day of week</h3>
              <DayOfWeekChart rates={analytics.data.day_of_week_rates} />
            </div>
            <div className="rounded-2xl glass-card shadow-soft p-5 space-y-3">
              <h3 className="text-[10px] uppercase tracking-[0.2em] font-bold text-muted-foreground">Recent rates</h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-muted/40 p-3">
                  <p className="text-[10px] uppercase font-bold text-muted-foreground">Last 7d</p>
                  <p className="text-2xl font-bold tabular-nums mt-1">{Math.round(analytics.data.rate_7d * 100)}%</p>
                </div>
                <div className="rounded-xl bg-muted/40 p-3">
                  <p className="text-[10px] uppercase font-bold text-muted-foreground">Last 30d</p>
                  <p className="text-2xl font-bold tabular-nums mt-1">{Math.round(analytics.data.rate_30d * 100)}%</p>
                </div>
              </div>
              <div className="rounded-xl bg-muted/40 p-3">
                <p className="text-[10px] uppercase font-bold text-muted-foreground">Total completions</p>
                <p className="text-2xl font-bold tabular-nums mt-1">{analytics.data.total_completions}</p>
              </div>
            </div>
          </div>
        </>
      )}

      {(logs.data ?? []).length > 0 && (
        <div className="rounded-2xl glass-card shadow-soft p-5">
          <h3 className="text-[10px] uppercase tracking-[0.2em] font-bold text-muted-foreground mb-3">Recent logs</h3>
          <div className="space-y-1.5">
            {logs.data.slice(0, 14).map((l) => (
              <div key={l.id} className="flex items-center justify-between text-xs px-2 py-1.5 rounded-lg hover:bg-muted/40">
                <span className="font-bold tabular-nums">{l.log_date}</span>
                <span className={l.completed ? 'text-primary font-bold' : 'text-muted-foreground'}>
                  {l.completed ? '✓ Done' : '—'}{l.count ? ` (${l.count})` : ''}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {showForm && <HabitFormSheet initial={h} onClose={() => setShowForm(false)} />}
    </div>
  )
}
