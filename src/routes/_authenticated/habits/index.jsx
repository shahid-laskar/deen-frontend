import React, { useState, useCallback } from 'react'
import { createFileRoute, Link } from '@tanstack/react-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { format } from 'date-fns'
import { Plus, Flame, Check, Heart, Layers, BookOpen, ChevronDown, RotateCcw, Sparkles, MoonStar, Feather, Activity, GraduationCap, User, Users, SunDim, HeartHandshake, ShieldAlert } from 'lucide-react'
import api from '@/lib/api'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import toast from 'react-hot-toast'
import { HabitFormSheet } from '@/components/habits/HabitFormSheet'
import { ChecklistSheet } from '@/components/habits/ChecklistSheet'

export const Route = createFileRoute('/_authenticated/habits/')({
  component: HabitsTodayPage,
})

const CAT_ICONS = {
  ibadah: <MoonStar className="h-5 w-5" />,
  quran: <BookOpen className="h-5 w-5" />,
  dhikr: <Heart className="h-5 w-5" />,
  sunnah: <Feather className="h-5 w-5" />,
  health: <Activity className="h-5 w-5" />,
  learning: <GraduationCap className="h-5 w-5" />,
  personal: <User className="h-5 w-5" />,
  family: <Users className="h-5 w-5" />,
  fasting: <SunDim className="h-5 w-5" />,
  sadaqah: <HeartHandshake className="h-5 w-5" />,
  avoid: <ShieldAlert className="h-5 w-5" />,
}
const DIFF_DOT = { easy: 'bg-green-500', medium: 'bg-orange-500', hard: 'bg-red-500', epic: 'bg-purple-500' }
const PRAYER_ANCHORS = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha', null]
const PRAYER_LABELS = { fajr: '🌅 After Fajr', dhuhr: '☀️ After Dhuhr', asr: '🌤 After Asr', maghrib: '🌆 After Maghrib', isha: '🌙 After Isha', null: '📋 Unanchored' }

// ── Health Score Gauge ──────────────────────────────────────────────────────
function HealthScoreGauge({ score = 0, label = '' }) {
  const r = 44
  const circ = 2 * Math.PI * r
  const dash = circ * (score / 100)
  const color = score >= 85 ? 'text-sage' : score >= 65 ? 'text-primary' : score >= 40 ? 'text-gold' : 'text-orange-500'
  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative w-24 h-24">
        <svg className="-rotate-90 absolute inset-0 w-full h-full" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r={r} fill="none" stroke="currentColor" strokeWidth="6" className="text-border" />
          <circle cx="50" cy="50" r={r} fill="none" stroke="currentColor" strokeWidth="6"
            className={cn('transition-all duration-1000', color)}
            strokeLinecap="round"
            strokeDasharray={`${circ}`}
            strokeDashoffset={circ - dash} />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-xl font-black tabular-nums">{Math.round(score)}</span>
        </div>
      </div>
      <span className={cn('text-[10px] font-black uppercase tracking-widest', color)}>{label || 'Score'}</span>
    </div>
  )
}

// ── Rahmah Token Badge ──────────────────────────────────────────────────────
function RahmahTokens({ tokens, habitId, onUse }) {
  if (!tokens || tokens <= 0) return null
  return (
    <button
      onClick={onUse}
      className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-purple-500/10 text-purple-600 text-[10px] font-black uppercase tracking-widest hover:bg-purple-500/20 transition-all"
      title="Use Rahmah Token to protect yesterday's streak"
    >
      ☪️ ×{tokens}
    </button>
  )
}

// ── Sparkline (last 30 days) ────────────────────────────────────────────────
function Sparkline({ rate30d = 0 }) {
  const w = 40, h = 14
  const bars = 10
  // Simple visual representation using rate
  return (
    <div className="flex items-end gap-0.5" style={{ width: w, height: h }}>
      {Array.from({ length: bars }, (_, i) => {
        const filled = i < Math.round((rate30d / 100) * bars)
        return (
          <div key={i} className={cn('flex-1 rounded-sm', filled ? 'bg-primary/60' : 'bg-border')}
            style={{ height: filled ? `${Math.max(3, (i + 1) / bars * h)}px` : '3px' }} />
        )
      })}
    </div>
  )
}

// ── Single Habit Card ───────────────────────────────────────────────────────
function HabitCard({ habit, onLog, onUseToken, onOpenChecklist }) {
  const done = habit.completed_today
  const streak = habit.current_streak || 0
  const tokens = habit.rahmah_tokens || 0

  const handleLog = useCallback(() => {
    if (habit.habit_type === 'checklist') {
      onOpenChecklist()
    } else {
      onLog(habit)
    }
  }, [habit, onLog, onOpenChecklist])

  return (
    <div className={cn(
      'group relative overflow-hidden rounded-2xl glass-card shadow-soft hover:shadow-elevated card-hover transition-all',
      done && 'ring-1 ring-primary/30 bg-primary/3'
    )}>
      {done && <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent pointer-events-none" />}
      <div className="relative p-4 flex items-center gap-3">
        {/* Log button */}
        <button
          onClick={handleLog}
          className={cn(
            'flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl transition-all',
            done
              ? 'bg-primary text-primary-foreground shadow-glow-primary'
              : 'bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground hover:shadow-glow-primary'
          )}
        >
          {done
            ? <Check className="h-5 w-5" strokeWidth={2.5} />
            : <span className="flex items-center justify-center">{CAT_ICONS[habit.category] || <Check className="h-5 w-5" />}</span>
          }
        </button>

        {/* Info - Clickable to Detail Page */}
        <Link to={`/habits/${habit.id}`} className="flex-1 min-w-0 hover:opacity-80 transition-opacity">
          <div className="flex items-center gap-2">
            <p className="font-bold text-sm text-foreground truncate">{habit.name}</p>
            <span className={cn('w-1.5 h-1.5 rounded-full shrink-0', DIFF_DOT[habit.difficulty])} />
          </div>
          <div className="flex items-center gap-2.5 mt-1 flex-wrap">
            {streak > 0 && (
              <span className={cn('flex items-center gap-0.5 text-[10px] font-bold uppercase',
                streak >= 7 ? 'text-orange-500' : 'text-muted-foreground')}>
                <Flame className="h-3 w-3" /> {streak}d
              </span>
            )}
            <Sparkline rate30d={habit.completion_rate_30d} />
            <span className="text-[10px] font-bold text-muted-foreground">{habit.completion_rate_30d}%</span>
            {habit.anchor_prayer && (
              <span className="text-[10px] font-bold text-primary/70 uppercase">
                {habit.anchor_prayer}
              </span>
            )}
          </div>
        </Link>

        {/* Actions */}
        <div className="flex items-center gap-1.5 shrink-0">
          <RahmahTokens tokens={tokens} habitId={habit.id} onUse={() => onUseToken(habit.id)} />
          {habit.habit_type === 'checklist' && (
            <button
              onClick={onOpenChecklist}
              className="flex h-8 w-8 items-center justify-center rounded-xl bg-muted/60 text-muted-foreground hover:bg-primary/10 hover:text-primary transition-all"
            >
              <ChevronDown className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Main Today Page ─────────────────────────────────────────────────────────
function HabitsTodayPage() {
  const qc = useQueryClient()
  const [formOpen, setFormOpen] = useState(false)
  const [activeChecklist, setActiveChecklist] = useState(null)
  const today = format(new Date(), 'yyyy-MM-dd')

  const { data: habits = [] } = useQuery({
    queryKey: ['habits'],
    queryFn: () => api.get('/habits').then(r => r.data).catch(() => []),
  })

  const { data: health } = useQuery({
    queryKey: ['habits', 'health'],
    queryFn: () => api.get('/habits/analytics/health').then(r => r.data).catch(() => null),
  })

  const { mutate: logHabit } = useMutation({
    mutationFn: (habit) => api.post('/habits/log', {
      habit_id: habit.id,
      log_date: today,
      count: habit.completed_today ? 0 : 1,
      completed: !habit.completed_today,
    }),
    onMutate: async (habit) => {
      await qc.cancelQueries({ queryKey: ['habits'] })
      const prev = qc.getQueryData(['habits'])
      qc.setQueryData(['habits'], old =>
        (old || []).map(h => h.id === habit.id ? { ...h, completed_today: !habit.completed_today } : h)
      )
      return { prev }
    },
    onError: (_, __, ctx) => { qc.setQueryData(['habits'], ctx.prev); toast.error('Failed to log habit') },
    onSuccess: (data, habit) => { 
      qc.invalidateQueries({ queryKey: ['habits'] }); 
      if (!habit.completed_today) {
        toast.success('Alhamdulillah! 🤲') 
      }
    },
  })

  const { mutate: useToken } = useMutation({
    mutationFn: (id) => api.post(`/habits/${id}/use-token`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['habits'] }); toast.success('Rahmah Token used — streak protected ☪️') },
    onError: (e) => toast.error(e.response?.data?.detail || 'No tokens available'),
  })

  const doneCount = habits.filter(h => h.completed_today).length
  const total = habits.length
  const pct = total ? Math.round((doneCount / total) * 100) : 0
  const bestStreak = habits.reduce((m, h) => Math.max(m, h.current_streak || 0), 0)
  const totalTokens = habits.reduce((s, h) => s + (h.rahmah_tokens || 0), 0)

  // Group by anchor_prayer
  const grouped = {}
  PRAYER_ANCHORS.forEach(p => { grouped[p] = [] })
  habits.forEach(h => {
    const key = h.anchor_prayer || null
    if (grouped[key]) grouped[key].push(h)
    else grouped[null].push(h)
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-end justify-between flex-wrap gap-4 animate-slide-up">
        <div>
          <p className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground font-bold">Daily Practice</p>
          <h1 className="font-amiri text-4xl md:text-5xl font-bold mt-2 text-gradient-primary">Habits</h1>
          <p className="text-sm text-muted-foreground mt-2">Small consistent acts beloved to Allah</p>
        </div>
        <button
          onClick={() => setFormOpen(true)}
          className="flex items-center gap-2 rounded-2xl bg-primary text-primary-foreground px-5 py-3 text-sm font-bold shadow-glow-primary hover:opacity-90 transition-all"
        >
          <Plus className="h-4 w-4" /> New Habit
        </button>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-3 gap-3 animate-slide-up stagger-1">
        {/* Health Score */}
        <div className="relative overflow-hidden rounded-2xl glass-card shadow-soft p-4 col-span-1">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/15 to-transparent" />
          <div className="relative flex flex-col items-center justify-center h-full">
            <HealthScoreGauge score={health?.score || 0} label={health?.label || '—'} />
          </div>
        </div>

        {/* Today */}
        <div className="relative overflow-hidden rounded-2xl glass-card shadow-soft p-4">
          <div className="absolute inset-0 bg-gradient-to-br from-sage/20 to-transparent" />
          <div className="relative">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-sage/15 text-sage mb-3">
              <Check className="h-4 w-4" strokeWidth={2.5} />
            </div>
            <p className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground">Today</p>
            <p className="text-3xl font-black mt-1 tabular-nums">{pct}%</p>
            <p className="text-xs text-muted-foreground mt-0.5">{doneCount}/{total} done</p>
          </div>
        </div>

        {/* Best Streak */}
        <div className="relative overflow-hidden rounded-2xl glass-card shadow-soft p-4">
          <div className="absolute inset-0 bg-gradient-to-br from-orange-500/20 to-transparent" />
          <div className="relative">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-orange-500/15 text-orange-500 mb-3">
              <Flame className="h-4 w-4" strokeWidth={2.5} />
            </div>
            <p className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground">Best</p>
            <p className="text-3xl font-black mt-1 tabular-nums">{bestStreak}<span className="text-xs font-semibold text-muted-foreground ml-1">d</span></p>
            <p className="text-xs text-muted-foreground mt-0.5">streak</p>
          </div>
        </div>
      </div>

      {/* Rahmah tokens row */}
      {totalTokens > 0 && (
        <div className="flex items-center gap-2 px-4 py-2.5 rounded-2xl glass-card shadow-soft border-purple-500/20 animate-slide-up stagger-2">
          <span className="text-base">☪️</span>
          <p className="text-xs font-bold text-purple-600">{totalTokens} Rahmah Token{totalTokens > 1 ? 's' : ''} available — tap the badge on any missed habit to protect your streak</p>
        </div>
      )}

      {/* Habit groups */}
      {total === 0 ? (
        <div className="rounded-3xl glass-card shadow-soft p-10 flex flex-col items-center text-center animate-slide-up stagger-2">
          <Sparkles className="h-12 w-12 text-primary/40 mb-4" />
          <h3 className="text-base font-bold text-foreground mb-1">Start your journey</h3>
          <p className="text-sm text-muted-foreground mb-6 max-w-sm mx-auto">
            "The most beloved of deeds to Allah are those most consistent, even if small." — Bukhari
          </p>
          <div className="flex gap-3 justify-center flex-wrap">
            <button onClick={() => setFormOpen(true)}
              className="flex items-center gap-2 rounded-2xl bg-primary text-primary-foreground px-5 py-2.5 text-sm font-bold shadow-glow-primary">
              <Plus className="h-4 w-4" /> New Habit
            </button>
            <Link to="/habits/library"
              className="flex items-center gap-2 rounded-2xl glass-card shadow-soft px-5 py-2.5 text-sm font-bold hover:shadow-elevated transition-all">
              <BookOpen className="h-4 w-4" /> Browse Library
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-6 animate-slide-up stagger-2">
          {PRAYER_ANCHORS.map(anchor => {
            const group = grouped[anchor] || []
            if (group.length === 0) return null
            return (
              <div key={String(anchor)} className="space-y-2">
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground px-1">
                  {PRAYER_LABELS[anchor]}
                </p>
                {group.map(h => (
                  <HabitCard key={h.id} habit={h} onLog={logHabit} onUseToken={useToken} onOpenChecklist={() => setActiveChecklist(h)} />
                ))}
              </div>
            )
          })}
        </div>
      )}

      {formOpen && <HabitFormSheet onClose={() => setFormOpen(false)} />}
      
      {activeChecklist && (
        <ChecklistSheet 
          habitId={activeChecklist.id} 
          habitName={activeChecklist.name} 
          onClose={() => setActiveChecklist(null)} 
        />
      )}
    </div>
  )
}
