import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { format } from 'date-fns'
import {
  Clock, BookOpen, Target, Flame, CheckSquare,
  Sparkles, ChevronRight, BookMarked, TrendingUp
} from 'lucide-react'
import { prayerApi, habitsApi, quranApi, tasksApi } from '../lib/api'
import { useAuthStore } from '../store/authStore'
import { Card, StatCard, ProgressRing, Skeleton, Badge } from '../components/ui/index'

const PRAYER_NAMES = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha']
const STATUS_COLOR = {
  on_time: '#0d6b3d', late: '#c9870a', missed: '#ef4444', qadha: '#3b82f6', excused: '#9ca3af',
}

function PrayerWidget({ summary }) {
  if (!summary) return <Skeleton className="h-32" />
  const total = 5
  const done = summary.total_logged || 0
  return (
    <div className="flex items-center gap-4">
      <ProgressRing value={done} max={total} size={72} strokeWidth={6} color="#0d6b3d">
        <span className="text-sm font-bold text-emerald-800 dark:text-emerald-200">{done}/{total}</span>
      </ProgressRing>
      <div className="flex-1 space-y-2">
        {PRAYER_NAMES.map((p) => {
          const log = summary[p]
          return (
            <div key={p} className="flex items-center gap-2">
              <div
                className="w-2 h-2 rounded-full flex-shrink-0"
                style={{ background: log ? STATUS_COLOR[log.status] || '#9ca3af' : '#e5e7eb' }}
              />
              <span className="text-xs capitalize text-emerald-800 dark:text-emerald-300 w-16">{p}</span>
              {log ? (
                <span className={`text-xs status-${log.status}`}>{log.status.replace('_', ' ')}</span>
              ) : (
                <span className="text-xs text-parchment-400 dark:text-emerald-700">—</span>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

function HabitStreak({ habits }) {
  if (!habits) return <Skeleton className="h-24" />
  const today = habits.filter((h) => h.completed_today)
  const total = habits.filter((h) => h.is_active)
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-muted text-xs">Today's habits</span>
        <Badge variant={today.length === total.length && total.length > 0 ? 'green' : 'gold'}>
          {today.length}/{total.length}
        </Badge>
      </div>
      <div className="space-y-1.5">
        {total.slice(0, 4).map((h) => (
          <div key={h.id} className="flex items-center gap-2">
            <div className={`w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 ${
              h.completed_today
                ? 'bg-emerald-700 border-emerald-700'
                : 'border-parchment-300 dark:border-emerald-700'
            }`}>
              {h.completed_today && <span className="text-white text-xs">✓</span>}
            </div>
            <span className="text-xs text-emerald-800 dark:text-emerald-300 truncate">{h.name}</span>
            {h.current_streak > 0 && (
              <span className="text-xs text-gold-600 ml-auto flex items-center gap-0.5">
                <Flame size={10} /> {h.current_streak}
              </span>
            )}
          </div>
        ))}
        {total.length === 0 && <p className="text-xs text-muted">No habits yet. <Link to="/habits" className="text-emerald-700 hover:underline">Add one →</Link></p>}
      </div>
    </div>
  )
}

export default function Dashboard() {
  const { user, isFemale } = useAuthStore()
  const today = format(new Date(), 'EEEE, d MMMM yyyy')
  const displayName = user?.profile?.display_name || user?.email?.split('@')[0] || 'friend'

  const { data: prayerSummary } = useQuery({
    queryKey: ['prayer', 'today'],
    queryFn: () => prayerApi.getTodaySummary().then((r) => r.data),
  })

  const { data: streak } = useQuery({
    queryKey: ['prayer', 'streak'],
    queryFn: () => prayerApi.getStreak().then((r) => r.data),
  })

  const { data: habits } = useQuery({
    queryKey: ['habits'],
    queryFn: () => habitsApi.list().then((r) => r.data),
  })

  const { data: hifzDue } = useQuery({
    queryKey: ['quran', 'hifz', 'due'],
    queryFn: () => quranApi.getHifzDueToday().then((r) => r.data),
  })

  const { data: todayTasks } = useQuery({
    queryKey: ['tasks', 'today'],
    queryFn: () => tasksApi.today().then((r) => r.data),
  })

  const pendingTasks = todayTasks?.filter((t) => !t.completed) || []

  const greeting = () => {
    const h = new Date().getHours()
    if (h < 5) return 'Assalamu Alaikum'
    if (h < 12) return 'Good morning'
    if (h < 17) return 'Good afternoon'
    if (h < 20) return 'Good evening'
    return 'Good night'
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-8 animate-fade-up">
        <p className="text-muted text-sm mb-1">{today}</p>
        <h1 className="font-display text-3xl font-bold text-emerald-900 dark:text-emerald-50">
          {greeting()}, {displayName} 🌙
        </h1>
        <p className="text-parchment-500 dark:text-emerald-600 mt-1">
          {streak?.current_streak > 0
            ? `${streak.current_streak} day prayer streak — MashaaAllah!`
            : 'Start your day with Bismillah.'}
        </p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Prayer streak', value: streak?.current_streak ?? 0, sub: 'days in a row', icon: Flame, color: 'gold' },
          { label: 'Habits today', value: `${habits?.filter(h => h.completed_today).length ?? 0}/${habits?.length ?? 0}`, sub: 'completed', icon: Target, color: 'emerald' },
          { label: 'Hifz due', value: hifzDue?.length ?? 0, sub: 'pages to review', icon: BookOpen, color: 'blue' },
          { label: 'Tasks today', value: pendingTasks.length, sub: 'pending', icon: CheckSquare, color: 'emerald' },
        ].map((stat, i) => (
          <div key={stat.label} className={`animate-fade-up stagger-${i + 1}`}>
            <StatCard {...stat} />
          </div>
        ))}
      </div>

      {/* Main grid */}
      <div className="grid md:grid-cols-3 gap-5">
        {/* Prayer card */}
        <Card className="animate-fade-up stagger-1">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Clock size={18} className="text-emerald-700 dark:text-emerald-500" />
              <h2 className="section-title text-base">Today's Prayers</h2>
            </div>
            <Link to="/prayer" className="text-muted hover:text-emerald-700 text-xs flex items-center gap-1">
              View <ChevronRight size={12} />
            </Link>
          </div>
          <PrayerWidget summary={prayerSummary} />
        </Card>

        {/* Habits card */}
        <Card className="animate-fade-up stagger-2">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Target size={18} className="text-emerald-700 dark:text-emerald-500" />
              <h2 className="section-title text-base">Habits</h2>
            </div>
            <Link to="/habits" className="text-muted hover:text-emerald-700 text-xs flex items-center gap-1">
              View <ChevronRight size={12} />
            </Link>
          </div>
          <HabitStreak habits={habits} />
        </Card>

        {/* Quick links */}
        <div className="space-y-3 animate-fade-up stagger-3">
          {[
            { to: '/quran', icon: BookOpen, label: 'Quran & Hifz', sub: hifzDue?.length ? `${hifzDue.length} due for review` : 'Continue memorising', color: 'text-emerald-600' },
            { to: '/journal', icon: BookMarked, label: 'Journal', sub: 'Reflect on your day', color: 'text-gold-600' },
            { to: '/ai', icon: Sparkles, label: 'AI Guide', sub: 'Get lifestyle advice', color: 'text-blue-600' },
          ].map(({ to, icon: Icon, label, sub, color }) => (
            <Link key={to} to={to}>
              <Card hover className="!p-4">
                <div className="flex items-center gap-3">
                  <Icon size={20} className={color} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-emerald-900 dark:text-emerald-200">{label}</p>
                    <p className="text-xs text-muted truncate">{sub}</p>
                  </div>
                  <ChevronRight size={16} className="text-parchment-400 flex-shrink-0" />
                </div>
              </Card>
            </Link>
          ))}
        </div>
      </div>

      {/* Tasks due today */}
      {pendingTasks.length > 0 && (
        <Card className="mt-5 animate-fade-up">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <CheckSquare size={18} className="text-emerald-700 dark:text-emerald-500" />
              <h2 className="section-title text-base">Today's Tasks</h2>
            </div>
            <Link to="/tasks" className="text-muted hover:text-emerald-700 text-xs flex items-center gap-1">
              All tasks <ChevronRight size={12} />
            </Link>
          </div>
          <div className="space-y-2">
            {pendingTasks.slice(0, 4).map((task) => (
              <div key={task.id} className="flex items-center gap-3 py-2 border-b border-parchment-100 dark:border-emerald-900/30 last:border-0">
                <div className="w-4 h-4 rounded border-2 border-parchment-300 dark:border-emerald-700 flex-shrink-0" />
                <span className="text-sm text-emerald-800 dark:text-emerald-300 flex-1 truncate">{task.title}</span>
                {task.time_block && <Badge variant="gray" className="text-xs">{task.time_block.replace('_', ' ')}</Badge>}
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Daily ayah */}
      <Card className="mt-5 bg-emerald-950 border-0 animate-fade-up">
        <p className="font-arabic text-2xl text-white text-right leading-loose mb-3">
          رَبَّنَا آتِنَا فِي الدُّنْيَا حَسَنَةً وَفِي الآخِرَةِ حَسَنَةً وَقِنَا عَذَابَ النَّارِ
        </p>
        <p className="text-emerald-300 text-sm text-right">
          "Our Lord, give us in this world [that which is] good and in the Hereafter [that which is] good and protect us from the punishment of the Fire." — Quran 2:201
        </p>
      </Card>
    </div>
  )
}
