import React from 'react'
import { createFileRoute, Link } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { format, subDays, startOfWeek, eachDayOfInterval } from 'date-fns'
import { Flame, Check, Trophy, AlertCircle, BarChart2, Layers, MoonStar, BookOpen, Heart, Feather, Activity, GraduationCap, User, Users, SunDim, HeartHandshake, ShieldAlert } from 'lucide-react'
import api from '@/lib/api'
import { cn } from '@/lib/utils'

export const Route = createFileRoute('/_authenticated/grow/habits/analytics')({
  component: HabitsAnalyticsPage,
})

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const CAT_ICONS = {
  ibadah: <MoonStar className="h-4 w-4" />,
  quran: <BookOpen className="h-4 w-4" />,
  dhikr: <Heart className="h-4 w-4" />,
  sunnah: <Feather className="h-4 w-4" />,
  health: <Activity className="h-4 w-4" />,
  learning: <GraduationCap className="h-4 w-4" />,
  personal: <User className="h-4 w-4" />,
  family: <Users className="h-4 w-4" />,
  fasting: <SunDim className="h-4 w-4" />,
  sadaqah: <HeartHandshake className="h-4 w-4" />,
  avoid: <ShieldAlert className="h-4 w-4" />,
}

// ── Health Score Gauge ──────────────────────────────────────────────────────
function HealthGauge({ score = 0, label = '', breakdown }) {
  const r = 56
  const circ = 2 * Math.PI * r
  const color = score >= 85 ? '#6aa84f' : score >= 65 ? 'var(--color-primary)' : score >= 40 ? 'var(--color-gold)' : '#e67c35'
  const textColor = score >= 85 ? 'text-sage' : score >= 65 ? 'text-primary' : score >= 40 ? 'text-gold' : 'text-orange-500'

  return (
    <div className="relative overflow-hidden rounded-3xl glass-card shadow-elevated p-6 md:p-8">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-gold/5 to-sage/10" />
      <div className="relative grid md:grid-cols-2 gap-6 items-center">
        {/* Gauge */}
        <div className="flex flex-col items-center gap-3">
          <div className="relative w-36 h-36">
            <svg className="-rotate-90 absolute inset-0 w-full h-full" viewBox="0 0 130 130">
              <circle cx="65" cy="65" r={r} fill="none" stroke="currentColor" strokeWidth="8" className="text-border" />
              <circle cx="65" cy="65" r={r} fill="none" stroke={color} strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={`${circ}`}
                strokeDashoffset={`${circ * (1 - Math.min(score, 100) / 100)}`}
                className="transition-all duration-1000" />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-3xl font-black tabular-nums">{Math.round(score)}</span>
              <span className="text-[10px] font-bold text-muted-foreground uppercase">/ 100</span>
            </div>
          </div>
          <div className={cn('text-sm font-black uppercase tracking-widest', textColor)}>{label}</div>
        </div>

        {/* Breakdown */}
        {breakdown && (
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-foreground mb-4">Score Breakdown</h3>
            {[
              { label: 'Completion Rate', value: breakdown.completion_rate, max: 100, unit: '%' },
              { label: 'Avg Streak', value: breakdown.avg_streak, max: 30, unit: 'd' },
              { label: 'Category Variety', value: breakdown.category_variety, max: 5, unit: ' cats' },
            ].map(item => (
              <div key={item.label}>
                <div className="flex justify-between text-xs font-bold text-muted-foreground mb-1">
                  <span>{item.label}</span>
                  <span className="text-foreground">{typeof item.value === 'number' ? item.value.toFixed(1) : 0}{item.unit}</span>
                </div>
                <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                  <div className="h-full bg-primary rounded-full transition-all duration-700"
                    style={{ width: `${Math.min((item.value / item.max) * 100, 100)}%` }} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ── Weekly Review Card ───────────────────────────────────────────────────────
function WeeklyReview({ data }) {
  if (!data) return null
  const weekRange = `${format(new Date(data.week_start), 'MMM d')} – ${format(new Date(data.week_end), 'MMM d')}`

  return (
    <div className="rounded-2xl glass-card shadow-soft p-5">
      <div className="flex items-center justify-between mb-5">
        <div>
          <p className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground">This Week</p>
          <h2 className="text-base font-bold text-foreground mt-0.5">{weekRange}</h2>
        </div>
        <div className="text-right">
          <p className="text-2xl font-black text-primary">{data.completion_rate}%</p>
          <p className="text-xs text-muted-foreground">{data.total_completed}/{data.total_possible} done</p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-2 rounded-full bg-muted overflow-hidden mb-5">
        <div className="h-full bg-gradient-to-r from-primary to-gold rounded-full transition-all duration-700"
          style={{ width: `${data.completion_rate}%` }} />
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        {/* Top habits */}
        {data.top_habits?.length > 0 && (
          <div>
            <p className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-sage mb-2">
              <Trophy className="h-3 w-3" /> Top Performers
            </p>
            <div className="space-y-1">
              {data.top_habits.map((name, i) => (
                <div key={i} className="flex items-center gap-2 py-1 px-2 rounded-lg bg-sage/10">
                  <span className="text-[10px] font-black text-sage">{i + 1}</span>
                  <span className="text-xs font-bold text-foreground truncate">{name}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Needs attention */}
        {data.needs_attention?.length > 0 && (
          <div>
            <p className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-orange-500 mb-2">
              <AlertCircle className="h-3 w-3" /> Needs Attention
            </p>
            <div className="space-y-1">
              {data.needs_attention.map((name, i) => (
                <div key={i} className="flex items-center gap-2 py-1 px-2 rounded-lg bg-orange-500/10">
                  <span className="text-xs font-bold text-foreground truncate">{name}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Streak Table ─────────────────────────────────────────────────────────────
function StreakTable({ habits = [], streakSummary = {} }) {
  const sorted = [...habits].sort((a, b) => (b.current_streak || 0) - (a.current_streak || 0))
  if (sorted.length === 0) return null

  return (
    <div className="rounded-2xl glass-card shadow-soft p-5">
      <h2 className="text-sm font-black uppercase tracking-widest text-muted-foreground mb-4">Streak Leaderboard</h2>
      <div className="space-y-2">
        {sorted.map((h, i) => {
          const streak = h.current_streak || 0
          const longest = h.longest_streak || 0
          return (
            <Link key={h.id} to={`/grow/habits/${h.id}`}
              className="flex items-center gap-3 p-2 rounded-xl hover:bg-muted/50 transition-colors group">
              <span className="text-xs font-black text-muted-foreground w-4 text-center">{i + 1}</span>
              <span className="flex items-center justify-center shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary">{CAT_ICONS[h.category] || <Check className="h-3 w-3" />}</span>
              <p className="text-sm font-bold text-foreground flex-1 truncate group-hover:text-primary transition-colors">{h.name}</p>
              <div className="flex items-center gap-3 shrink-0">
                <div className="flex items-center gap-1 text-orange-500">
                  <Flame className="h-3.5 w-3.5" />
                  <span className="text-xs font-black">{streak}d</span>
                </div>
                <span className="text-[10px] text-muted-foreground">best {longest}d</span>
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}

// ── Category Donut ───────────────────────────────────────────────────────────
function CategoryBreakdown({ habits = [] }) {
  const counts = {}
  habits.forEach(h => { counts[h.category] = (counts[h.category] || 0) + 1 })
  const entries = Object.entries(counts).sort((a, b) => b[1] - a[1])
  if (entries.length === 0) return null
  const total = habits.length

  const COLORS = ['bg-primary', 'bg-gold', 'bg-sage', 'bg-orange-500', 'bg-blue-500', 'bg-purple-500', 'bg-pink-500']

  return (
    <div className="rounded-2xl glass-card shadow-soft p-5">
      <h2 className="text-sm font-black uppercase tracking-widest text-muted-foreground mb-4">Category Spread</h2>
      <div className="flex h-3 rounded-full overflow-hidden gap-0.5 mb-4">
        {entries.map(([cat, count], i) => (
          <div key={cat} className={cn('h-full rounded-full', COLORS[i % COLORS.length])}
            style={{ width: `${(count / total) * 100}%` }} />
        ))}
      </div>
      <div className="grid grid-cols-2 gap-2">
        {entries.map(([cat, count], i) => (
          <div key={cat} className="flex items-center gap-2">
            <div className={cn('w-2 h-2 rounded-full shrink-0', COLORS[i % COLORS.length])} />
            <span className="text-xs font-bold text-foreground capitalize flex-1 truncate flex items-center gap-1.5">{CAT_ICONS[cat]} {cat}</span>
            <span className="text-xs font-bold text-muted-foreground">{count}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Main Analytics Page ──────────────────────────────────────────────────────
function HabitsAnalyticsPage() {
  const { data: health } = useQuery({
    queryKey: ['habits', 'health'],
    queryFn: () => api.get('/habits/analytics/health').then(r => r.data).catch(() => null),
  })

  const { data: weekly } = useQuery({
    queryKey: ['habits', 'weekly'],
    queryFn: () => api.get('/habits/analytics/weekly').then(r => r.data).catch(() => null),
  })

  const { data: habits = [] } = useQuery({
    queryKey: ['habits'],
    queryFn: () => api.get('/habits').then(r => r.data).catch(() => []),
  })

  const totalTokens = habits.reduce((s, h) => s + (h.rahmah_tokens || 0), 0)
  const totalCompletions = habits.reduce((s, h) => s + (h.total_completions || 0), 0)
  const bestStreak = habits.reduce((m, h) => Math.max(m, h.longest_streak || 0), 0)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="animate-slide-up">
        <p className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground font-bold">Overview</p>
        <h1 className="font-amiri text-4xl md:text-5xl font-bold mt-2 text-gradient-primary">Analytics</h1>
        <p className="text-sm text-muted-foreground mt-2">Your consistency over time</p>
      </div>

      {/* Health gauge */}
      {health && (
        <div className="animate-slide-up stagger-1">
          <HealthGauge score={health.score} label={health.label} breakdown={health.breakdown} />
        </div>
      )}

      {/* Quick stats row */}
      <div className="grid grid-cols-3 gap-3 animate-slide-up stagger-2">
        <div className="relative overflow-hidden rounded-2xl glass-card shadow-soft p-4">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/15 to-transparent" />
          <div className="relative">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/15 text-primary mb-2">
              <Check className="h-4 w-4" strokeWidth={2.5} />
            </div>
            <p className="text-2xl font-black tabular-nums">{totalCompletions}</p>
            <p className="text-[10px] uppercase font-bold text-muted-foreground mt-0.5">Total Logs</p>
          </div>
        </div>
        <div className="relative overflow-hidden rounded-2xl glass-card shadow-soft p-4">
          <div className="absolute inset-0 bg-gradient-to-br from-orange-500/20 to-transparent" />
          <div className="relative">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-orange-500/15 text-orange-500 mb-2">
              <Flame className="h-4 w-4" strokeWidth={2.5} />
            </div>
            <p className="text-2xl font-black tabular-nums">{bestStreak}<span className="text-xs font-semibold text-muted-foreground ml-0.5">d</span></p>
            <p className="text-[10px] uppercase font-bold text-muted-foreground mt-0.5">Best Streak</p>
          </div>
        </div>
        <div className="relative overflow-hidden rounded-2xl glass-card shadow-soft p-4">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500/20 to-transparent" />
          <div className="relative">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-purple-500/15 text-purple-500 mb-2">
              <span className="text-sm">☪️</span>
            </div>
            <p className="text-2xl font-black tabular-nums">{totalTokens}</p>
            <p className="text-[10px] uppercase font-bold text-muted-foreground mt-0.5">Tokens</p>
          </div>
        </div>
      </div>

      {/* Weekly review */}
      <div className="animate-slide-up stagger-2">
        <WeeklyReview data={weekly} />
      </div>

      {/* Streak table */}
      <div className="animate-slide-up stagger-3">
        <StreakTable habits={habits} streakSummary={weekly?.streak_summary} />
      </div>

      {/* Category breakdown */}
      <div className="animate-slide-up stagger-4">
        <CategoryBreakdown habits={habits} />
      </div>

      {habits.length === 0 && (
        <div className="rounded-2xl glass-card shadow-soft p-10 text-center">
          <BarChart2 className="h-10 w-10 text-muted-foreground/30 mx-auto mb-4" />
          <p className="text-sm text-muted-foreground">Add habits to see analytics here.</p>
        </div>
      )}
    </div>
  )
}
