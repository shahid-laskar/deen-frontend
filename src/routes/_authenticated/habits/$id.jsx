import React, { useState } from 'react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { format, subDays, startOfWeek, eachDayOfInterval } from 'date-fns'
import { Flame, Check, ArrowLeft, Trash2, Edit2, MoreHorizontal, Plus, X } from 'lucide-react'
import api from '@/lib/api'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import toast from 'react-hot-toast'
import { HabitFormSheet } from '@/components/habits/HabitFormSheet'

export const Route = createFileRoute('/_authenticated/habits/$id')({
  component: HabitDetailPage,
})

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

// ── 365-day Heatmap ──────────────────────────────────────────────────────────
function Heatmap365({ data = [] }) {
  const today = new Date()
  const start = subDays(today, 364)
  const weeks = []
  let day = startOfWeek(start, { weekStartsOn: 0 })
  while (day <= today) {
    const end = new Date(Math.min(day.getTime() + 6 * 86400000, today.getTime()))
    weeks.push(eachDayOfInterval({ start: day, end }))
    day = new Date(day.getTime() + 7 * 86400000)
  }
  const byDate = {}
  data.forEach(d => { byDate[d.date] = d })

  return (
    <div className="overflow-x-auto pb-2 scrollbar-none">
      <div className="flex gap-[3px] min-w-max">
        {weeks.map((week, wi) => (
          <div key={wi} className="flex flex-col gap-[3px]">
            {week.map((d, di) => {
              const k = format(d, 'yyyy-MM-dd')
              const cell = byDate[k]
              const completed = cell?.completed
              return (
                <div key={di} title={`${k}${cell ? ` · ${cell.count || 0}x` : ''}`}
                  className={cn(
                    'w-3 h-3 rounded-sm transition-transform cursor-default hover:scale-125',
                    completed ? 'bg-primary' : 'bg-muted'
                  )}
                  style={completed ? { opacity: Math.max(0.3, Math.min(1, (cell?.count || 1) / 5)) } : {}} />
              )
            })}
          </div>
        ))}
      </div>
      <div className="flex items-center gap-2 mt-3 text-[10px] uppercase font-bold text-muted-foreground w-max ml-auto">
        <span>Less</span>
        {[0.2, 0.4, 0.6, 0.8, 1].map((v, i) => (
          <div key={i} className="w-3 h-3 rounded-sm bg-primary" style={{ opacity: v }} />
        ))}
        <span>More</span>
      </div>
    </div>
  )
}

// ── Day-of-Week Bar Chart ────────────────────────────────────────────────────
function DayOfWeekChart({ rates = {} }) {
  const max = Math.max(...Object.values(rates), 1)
  return (
    <div className="flex items-end gap-2 h-20">
      {DAY_LABELS.map((label, i) => {
        const rate = rates[i] || 0
        const height = max > 0 ? (rate / max) * 100 : 0
        return (
          <div key={i} className="flex flex-col items-center gap-1 flex-1">
            <div className="relative w-full rounded-t-sm overflow-hidden bg-muted" style={{ height: 56 }}>
              <div className="absolute bottom-0 left-0 right-0 bg-primary rounded-t-sm transition-all duration-700"
                style={{ height: `${height}%` }} />
            </div>
            <span className="text-[9px] font-bold text-muted-foreground">{label}</span>
            <span className="text-[8px] font-bold text-primary">{rate}%</span>
          </div>
        )
      })}
    </div>
  )
}

// ── Checklist Editor ─────────────────────────────────────────────────────────
function ChecklistEditor({ habitId }) {
  const qc = useQueryClient()
  const [newLabel, setNewLabel] = useState('')

  const { data: items = [] } = useQuery({
    queryKey: ['habits', habitId, 'checklist'],
    queryFn: () => api.get(`/habits/${habitId}/checklist`).then(r => r.data).catch(() => []),
  })

  const { mutate: addItem } = useMutation({
    mutationFn: () => api.post(`/habits/${habitId}/checklist`, { label: newLabel }),
    onSuccess: () => { setNewLabel(''); qc.invalidateQueries({ queryKey: ['habits', habitId, 'checklist'] }) },
    onError: () => toast.error('Could not add item'),
  })

  const { mutate: removeItem } = useMutation({
    mutationFn: (itemId) => api.delete(`/habits/${habitId}/checklist/${itemId}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['habits', habitId, 'checklist'] }),
  })

  return (
    <div className="space-y-2">
      {items.map(item => (
        <div key={item.id} className="flex items-center gap-3 p-2.5 rounded-xl bg-muted/50">
          <Check className="h-4 w-4 text-primary/60 shrink-0" />
          <span className="text-sm font-medium text-foreground flex-1">{item.label}</span>
          {item.arabic_text && (
            <span className="font-amiri text-base text-primary" dir="rtl">{item.arabic_text}</span>
          )}
          {item.repetition_count > 1 && (
            <span className="text-[10px] font-black text-muted-foreground">×{item.repetition_count}</span>
          )}
          <button onClick={() => removeItem(item.id)}
            className="text-muted-foreground hover:text-destructive transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>
      ))}
      <div className="flex gap-2 mt-2">
        <input value={newLabel} onChange={e => setNewLabel(e.target.value)}
          placeholder="Add checklist item…"
          className="flex-1 px-3 py-2 rounded-xl bg-muted/50 border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
          onKeyDown={e => e.key === 'Enter' && newLabel.trim() && addItem()}
        />
        <button onClick={() => newLabel.trim() && addItem()}
          className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground hover:opacity-90">
          <Plus className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}

// ── Main Detail Page ─────────────────────────────────────────────────────────
function HabitDetailPage() {
  const { id } = Route.useParams()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [editOpen, setEditOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  const { data: habit, isLoading: habitLoading } = useQuery({
    queryKey: ['habit', id],
    queryFn: () => api.get(`/habits/${id}`).then(r => r.data),
  })

  const { data: analytics, isLoading: analyticsLoading } = useQuery({
    queryKey: ['habit', id, 'analytics'],
    queryFn: () => api.get(`/habits/${id}/analytics`).then(r => r.data).catch(() => null),
  })

  const { data: logs = [] } = useQuery({
    queryKey: ['habit', id, 'logs'],
    queryFn: () => api.get(`/habits/${id}/logs`, { params: { days: 30 } }).then(r => r.data).catch(() => []),
  })

  const { mutate: deleteHabit } = useMutation({
    mutationFn: () => api.delete(`/habits/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['habits'] })
      toast.success('Habit deleted')
      navigate({ to: '/habits/' })
    },
  })

  const { mutate: archiveHabit } = useMutation({
    mutationFn: () => api.patch(`/habits/${id}`, { is_active: false }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['habits'] })
      toast.success('Habit archived')
      navigate({ to: '/habits/' })
    },
  })

  if (habitLoading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-8 bg-muted rounded-xl w-2/3" />
        <div className="h-32 bg-muted rounded-2xl" />
        <div className="h-48 bg-muted rounded-2xl" />
      </div>
    )
  }

  if (!habit) {
    return (
      <div className="text-center py-20">
        <p className="text-muted-foreground">Habit not found.</p>
        <button onClick={() => navigate({ to: '/habits/' })} className="mt-4 text-primary text-sm font-bold">← Back</button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Back + header */}
      <div className="animate-slide-up relative z-50">
        <button onClick={() => navigate({ to: '/habits/' })}
          className="flex items-center gap-1.5 text-sm font-bold text-muted-foreground hover:text-foreground transition-colors mb-4">
          <ArrowLeft className="h-4 w-4" /> Back to Today
        </button>

        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <span className="text-4xl">{habit.icon || '✅'}</span>
            <div>
              <h1 className="font-amiri text-3xl font-bold text-gradient-primary">{habit.name}</h1>
              <p className="text-sm text-muted-foreground capitalize mt-1">
                {habit.category} · {habit.difficulty} · {habit.habit_type}
              </p>
              {habit.anchor_prayer && (
                <span className="inline-block mt-1 px-2 py-0.5 rounded-lg bg-primary/10 text-primary text-[10px] font-black uppercase tracking-widest">
                  after {habit.anchor_prayer}
                </span>
              )}
            </div>
          </div>

          <div className="relative">
            <button onClick={() => setMenuOpen(!menuOpen)}
              className="flex h-9 w-9 items-center justify-center rounded-xl glass-card shadow-soft hover:shadow-elevated transition-all">
              <MoreHorizontal className="h-4 w-4" />
            </button>
            {menuOpen && (
              <div className="absolute right-0 top-11 w-40 rounded-2xl glass-card shadow-elevated border border-border/50 z-50 overflow-hidden">
                <button onClick={() => { setEditOpen(true); setMenuOpen(false) }}
                  className="w-full flex items-center gap-2 px-4 py-2.5 text-sm font-bold hover:bg-muted/60 transition-colors">
                  <Edit2 className="h-4 w-4" /> Edit
                </button>
                <button onClick={() => { archiveHabit(); setMenuOpen(false) }}
                  className="w-full flex items-center gap-2 px-4 py-2.5 text-sm font-bold hover:bg-muted/60 transition-colors text-muted-foreground">
                  Archive
                </button>
                <button onClick={() => { if (confirm('Delete this habit?')) deleteHabit(); setMenuOpen(false) }}
                  className="w-full flex items-center gap-2 px-4 py-2.5 text-sm font-bold hover:bg-destructive/10 text-destructive transition-colors">
                  <Trash2 className="h-4 w-4" /> Delete
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Streak + rate cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 animate-slide-up stagger-1">
        {[
          { label: 'Current Streak', value: `${habit.current_streak || 0}d`, color: 'from-orange-500/20', icon: '🔥' },
          { label: 'Longest Streak', value: `${habit.longest_streak || 0}d`, color: 'from-gold/20', icon: '🏆' },
          { label: '30-day Rate', value: `${analytics?.completion_rate_30d || 0}%`, color: 'from-primary/15', icon: '📊' },
          { label: '7-day Rate', value: `${analytics?.completion_rate_7d || 0}%`, color: 'from-sage/20', icon: '📅' },
        ].map(({ label, value, color, icon }) => (
          <div key={label} className={cn('relative overflow-hidden rounded-2xl glass-card shadow-soft p-4')}>
            <div className={cn('absolute inset-0 bg-gradient-to-br to-transparent', color)} />
            <div className="relative">
              <span className="text-xl">{icon}</span>
              <p className="text-xl font-black mt-2 tabular-nums">{value}</p>
              <p className="text-[10px] uppercase font-bold text-muted-foreground mt-0.5">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Implementation intention */}
      {(habit.implementation_intention || habit.temptation_bundle) && (
        <div className="rounded-2xl glass-card shadow-soft p-5 space-y-3 animate-slide-up stagger-2">
          {habit.implementation_intention && (
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Implementation Intention</p>
              <p className="text-sm text-foreground italic">"{habit.implementation_intention}"</p>
            </div>
          )}
          {habit.temptation_bundle && (
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Temptation Bundle</p>
              <p className="text-sm text-foreground italic">"{habit.temptation_bundle}"</p>
            </div>
          )}
        </div>
      )}

      {/* 365-day heatmap */}
      <div className="rounded-2xl glass-card shadow-soft p-5 animate-slide-up stagger-2">
        <h2 className="text-sm font-bold text-foreground mb-4">Annual Consistency</h2>
        <Heatmap365 data={analytics?.heatmap || []} />
      </div>

      {/* Day-of-week chart */}
      {analytics?.day_of_week_rates && (
        <div className="rounded-2xl glass-card shadow-soft p-5 animate-slide-up stagger-3">
          <h2 className="text-sm font-bold text-foreground mb-4">Best Days of Week</h2>
          <DayOfWeekChart rates={analytics.day_of_week_rates} />
        </div>
      )}

      {/* Checklist editor */}
      {habit.habit_type === 'checklist' && (
        <div className="rounded-2xl glass-card shadow-soft p-5 animate-slide-up stagger-3">
          <h2 className="text-sm font-bold text-foreground mb-4">Checklist Items</h2>
          <ChecklistEditor habitId={id} />
        </div>
      )}

      {/* Recent logs */}
      {logs.length > 0 && (
        <div className="rounded-2xl glass-card shadow-soft p-5 animate-slide-up stagger-4">
          <h2 className="text-sm font-bold text-foreground mb-4">Recent Logs</h2>
          <div className="space-y-2">
            {logs.slice(0, 10).map((log, i) => (
              <div key={log.id || i} className="flex items-center justify-between py-1.5 border-b border-border/50 last:border-0">
                <span className="text-sm font-medium text-foreground">
                  {format(new Date(log.log_date), 'MMM d, yyyy')}
                </span>
                <div className="flex items-center gap-2">
                  {log.notes && <span className="text-xs text-muted-foreground italic truncate max-w-32">{log.notes}</span>}
                  {log.completed
                    ? <span className="flex items-center gap-1 text-sage text-xs font-bold"><Check className="h-3.5 w-3.5" /> Done</span>
                    : <span className="text-xs text-muted-foreground">{log.count}×</span>
                  }
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {editOpen && (
        <HabitFormSheet habit={habit} onClose={() => setEditOpen(false)} />
      )}
    </div>
  )
}
