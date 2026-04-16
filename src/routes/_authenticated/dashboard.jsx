import React, { useState, useEffect, useCallback, useRef } from 'react'
import { createFileRoute, Link } from '@tanstack/react-router'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { format } from 'date-fns'
import {
  Clock, BookOpen, Sparkles, NotebookPen, Heart, Compass, Users,
  Dumbbell, Apple, Check, Circle, RefreshCw, ChevronRight,
  ThumbsUp, X, HandHeart,
} from 'lucide-react'
import api from '@/lib/api'
import { useAuthStore } from '@/store/authStore'
import { getIslamicContext } from '@/lib/hijri'
import { cn } from '@/lib/utils'

export const Route = createFileRoute('/_authenticated/dashboard')({
  component: DashboardPage,
})

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getGreeting() {
  const h = new Date().getHours()
  if (h < 5)  return 'Peace be upon you'
  if (h < 12) return 'Good Morning'
  if (h < 17) return 'Good Afternoon'
  if (h < 21) return 'Good Evening'
  return 'Peace be upon you'
}

const PRAYER_NAMES = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha']
const ARABIC_NAMES = { Fajr: 'الفجر', Dhuhr: 'الظهر', Asr: 'العصر', Maghrib: 'المغرب', Isha: 'العشاء' }

function parseTime(t) {
  if (!t) return null
  const [h, m] = t.split(':').map(Number)
  const d = new Date()
  d.setHours(h, m, 0, 0)
  return d
}

function findNextPrayer(times) {
  if (!times) return null
  const now = new Date()
  for (const name of PRAYER_NAMES) {
    const t = parseTime(times[name.toLowerCase()])
    if (t && t > now) return { name, time: times[name.toLowerCase()], index: PRAYER_NAMES.indexOf(name) }
  }
  return { name: 'Fajr', time: times?.fajr, index: 0 }
}

function pad(n) { return String(n).padStart(2, '0') }

function formatCountdown(ms) {
  if (ms <= 0) return '00:00:00'
  const h = Math.floor(ms / 3_600_000)
  const m = Math.floor((ms % 3_600_000) / 60_000)
  const s = Math.floor((ms % 60_000) / 1_000)
  return `${pad(h)}:${pad(m)}:${pad(s)}`
}

// ─── Geometric Divider (from enhanced) ───────────────────────────────────────
function GeometricDivider() {
  return (
    <svg className="w-32 h-3 text-primary/30 my-2" viewBox="0 0 128 12">
      <line x1="0" y1="6" x2="48" y2="6" stroke="currentColor" strokeWidth="0.5" />
      <polygon points="56,0 64,6 56,12 48,6" fill="none" stroke="currentColor" strokeWidth="0.7" />
      <polygon points="64,2 70,6 64,10 58,6" fill="currentColor" opacity="0.3" />
      <polygon points="72,0 80,6 72,12 64,6" fill="none" stroke="currentColor" strokeWidth="0.7" />
      <line x1="80" y1="6" x2="128" y2="6" stroke="currentColor" strokeWidth="0.5" />
    </svg>
  )
}

// ─── Islamic Header ───────────────────────────────────────────────────────────
function IslamicHeader({ displayName }) {
  const ctx = getIslamicContext()
  const { user } = useAuthStore()
  return (
    <div className="space-y-1">
      <p className="text-sm text-muted-foreground tracking-wide">{format(new Date(), 'EEEE, MMMM d, yyyy')}</p>
      <h1 className="text-2xl md:text-3xl font-semibold text-foreground">
        {getGreeting()}{displayName ? `, ${displayName}` : ''} 🤲
      </h1>
      <p className="font-amiri text-lg text-primary/80">بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ</p>
      <GeometricDivider />
      <p className="text-sm font-medium text-primary">{ctx.formatted}</p>
    </div>
  )
}

// ─── Islamic Season Banner ────────────────────────────────────────────────────
function IslamicBanner() {
  const ctx = getIslamicContext()
  const msgs = {
    ramadan:        { icon: '🌙', text: `Ramadan Mubarak! Day ${ctx.hijri.day} of Ramadan` },
    eid_fitr:       { icon: '🎉', text: 'Eid ul-Fitr Mubarak! May Allah accept your worship.' },
    eid_adha:       { icon: '🐑', text: 'Eid ul-Adha Mubarak! May Allah accept your sacrifice.' },
    dhul_hijjah_10: { icon: '🕋', text: `Day ${ctx.hijri.day} of the blessed days of Dhul Hijjah` },
  }
  const msg = msgs[ctx.season]
  if (!msg) return null
  return (
    <div className="flex items-center gap-3 rounded-xl bg-primary/10 border border-primary/20 px-4 py-3 animate-fade-up">
      <span className="text-xl">{msg.icon}</span>
      <p className="text-sm font-medium text-primary">{msg.text}</p>
    </div>
  )
}

// ─── Prayer Hero ──────────────────────────────────────────────────────────────
function PrayerHero({ times, summary }) {
  const [next, setNext] = useState(() => findNextPrayer(times))
  const [countdown, setCountdown] = useState('00:00:00')
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const tick = () => {
      const np = findNextPrayer(times)
      setNext(np)
      if (!np) return
      const now = new Date()
      const target = parseTime(np.time)
      if (!target) return
      if (target < now) target.setDate(target.getDate() + 1)
      const diff = target - now
      setCountdown(formatCountdown(diff))

      const prevIdx = np.index === 0 ? 4 : np.index - 1
      const prevName = PRAYER_NAMES[prevIdx]
      const prevTime = parseTime(times?.[prevName.toLowerCase()])
      if (prevTime && target) {
        if (prevTime > now) prevTime.setDate(prevTime.getDate() - 1)
        const total = target - prevTime
        const elapsed = now - prevTime
        setProgress(Math.min((elapsed / total) * 100, 100))
      }
    }
    tick()
    const id = setInterval(tick, 1_000)
    return () => clearInterval(id)
  }, [times])

  const radius = 58
  const circumference = 2 * Math.PI * radius
  const strokeOffset = circumference - (progress / 100) * circumference

  const logged = summary?.total_logged ?? 0

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/10 via-card to-gold/5 border border-border p-6">
      {/* Geometric background */}
      <svg className="absolute top-0 right-0 w-48 h-48 text-primary/[0.04]" viewBox="0 0 200 200">
        <polygon points="100,10 190,60 190,140 100,190 10,140 10,60" fill="none" stroke="currentColor" strokeWidth="1" />
        <polygon points="100,30 170,70 170,130 100,170 30,130 30,70" fill="none" stroke="currentColor" strokeWidth="0.7" />
        <polygon points="100,50 150,80 150,120 100,150 50,120 50,80" fill="none" stroke="currentColor" strokeWidth="0.5" />
      </svg>

      <div className="relative z-10 flex flex-col md:flex-row items-center gap-6">
        {/* Progress ring */}
        <div className="relative flex-shrink-0">
          <svg width="140" height="140" className="-rotate-90">
            <circle cx="70" cy="70" r={radius} fill="none" strokeWidth="4" className="stroke-border stroke-current" />
            <circle
              cx="70" cy="70" r={radius}
              fill="none" strokeWidth="4" strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={strokeOffset}
              className="stroke-primary stroke-current transition-all duration-1000"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="font-amiri text-xl text-primary">{next ? ARABIC_NAMES[next.name] : '—'}</span>
            <span className="text-[11px] font-medium text-muted-foreground mt-0.5">{next?.time ?? ''}</span>
          </div>
        </div>

        {/* Info */}
        <div className="flex-1 text-center md:text-left space-y-2">
          <div className="flex items-center justify-center md:justify-start gap-2 text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span className="text-xs uppercase tracking-wider font-medium">Next Prayer</span>
          </div>
          <h3 className="text-3xl font-bold text-foreground">{next?.name ?? '—'}</h3>
          <p className="text-2xl font-mono font-semibold text-primary tabular-nums">{countdown}</p>
          <p className="text-xs text-muted-foreground">{logged}/5 prayers logged today</p>
        </div>

        {/* Prayer dots */}
        <div className="flex md:flex-col gap-3">
          {PRAYER_NAMES.map((name, i) => {
            const isPast = next ? i < next.index : false
            const isCurrent = next?.name === name
            const logKey = name.toLowerCase()
            const logStatus = summary?.[logKey]?.status
            return (
              <div key={name} className="flex flex-col items-center gap-1">
                <div className={cn(
                  'h-3 w-3 rounded-full border-2 transition-all',
                  isCurrent ? 'border-primary bg-primary scale-110' :
                  logStatus === 'on_time' ? 'border-sage bg-sage' :
                  isPast ? 'border-border bg-border' :
                  'border-border bg-transparent'
                )} />
                <span className="text-[9px] font-medium text-muted-foreground">{name[0]}</span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ─── Daily Verse ──────────────────────────────────────────────────────────────
function DailyVerse({ verseData }) {
  const arabic = verseData?.arabic_text || 'إِنَّ مَعَ الْعُسْرِ يُسْرًا'
  const translation = verseData?.translation || 'Indeed, with hardship comes ease.'
  const ref = verseData?.reference || 'Surah Ash-Sharh (94:6)'

  return (
    <div className="relative overflow-hidden rounded-2xl border border-border bg-card p-6">
      {/* Gold corner ornaments */}
      <svg className="absolute top-0 left-0 w-20 h-20 text-gold/20" viewBox="0 0 80 80">
        <path d="M0 0L40 0L0 40Z" fill="currentColor" />
        <path d="M0 0L20 0L0 20Z" fill="currentColor" opacity="0.5" />
      </svg>
      <svg className="absolute bottom-0 right-0 w-20 h-20 text-gold/20 rotate-180" viewBox="0 0 80 80">
        <path d="M0 0L40 0L0 40Z" fill="currentColor" />
        <path d="M0 0L20 0L0 20Z" fill="currentColor" opacity="0.5" />
      </svg>

      <div className="relative z-10 space-y-4">
        <div className="flex items-center gap-2 text-gold">
          <BookOpen className="h-4 w-4" />
          <span className="text-xs uppercase tracking-wider font-semibold">Verse of the Day</span>
        </div>
        <div className="text-center space-y-3 py-2">
          <p className="font-amiri text-2xl md:text-3xl leading-relaxed text-foreground" dir="rtl">{arabic}</p>
          <div className="mx-auto w-16 h-px bg-gradient-to-r from-transparent via-gold/50 to-transparent" />
          <p className="text-base text-foreground/80 italic">"{translation}"</p>
          <p className="text-xs text-muted-foreground font-medium">{ref}</p>
        </div>
      </div>
    </div>
  )
}

// ─── Habits Summary ───────────────────────────────────────────────────────────
function HabitsSummary({ habits }) {
  if (!habits?.length) {
    return (
      <div className="rounded-2xl border border-border bg-card p-6 flex flex-col items-center justify-center gap-3 min-h-[160px]">
        <Heart className="h-8 w-8 text-muted-foreground/40" />
        <p className="text-sm text-muted-foreground text-center">No habits yet.<br/>Start tracking your daily Islamic goals.</p>
        <Link to="/habits" className="text-xs font-medium text-primary hover:underline">Add your first habit →</Link>
      </div>
    )
  }

  const completed = habits.filter(h => h.completed_today).length
  const pct = Math.round((completed / habits.length) * 100)

  return (
    <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Today's Habits</h3>
        <span className="text-xs font-bold text-primary">{completed}/{habits.length}</span>
      </div>
      {/* Gradient progress bar */}
      <div className="space-y-1.5">
        <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-primary to-gold transition-all duration-500"
            style={{ width: `${pct}%` }}
          />
        </div>
        <p className="text-[11px] text-muted-foreground">{pct}% completed</p>
      </div>
      <div className="space-y-2">
        {habits.slice(0, 5).map(h => (
          <div key={h.id} className={cn('flex items-center gap-3 rounded-lg px-3 py-2 transition-colors', h.completed_today ? 'bg-sage/10' : 'hover:bg-muted/50')}>
            {h.completed_today
              ? <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-sage"><Check className="h-3 w-3 text-white" /></div>
              : <Circle className="h-5 w-5 shrink-0 text-border" />
            }
            <span className={cn('text-sm flex-1 truncate', h.completed_today ? 'text-muted-foreground line-through' : 'text-foreground')}>{h.name}</span>
            {h.current_streak > 0 && <span className="text-[10px] text-gold shrink-0">🔥 {h.current_streak}</span>}
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Quick Actions ────────────────────────────────────────────────────────────
const ACTIONS = [
  { title: 'Quran',     icon: BookOpen,    color: 'bg-primary/10 text-primary', to: '/quran',     desc: 'Read & Listen' },
  { title: 'Dhikr',     icon: Sparkles,    color: 'bg-gold/15 text-gold',       to: '/habits',    desc: 'Tasbeeh Counter' },
  { title: 'Journal',   icon: NotebookPen, color: 'bg-sage/15 text-sage',       to: '/journal',   desc: 'Daily Reflection' },
  { title: 'Habits',    icon: Heart,       color: 'bg-warm/10 text-warm',       to: '/habits',    desc: 'Track Progress' },
  { title: 'Qibla',     icon: Compass,     color: 'bg-primary/10 text-primary', to: '/qibla',     desc: 'Find Direction' },
  { title: 'Community', icon: Users,       color: 'bg-sage/15 text-sage',       to: '/community', desc: 'Connect' },
  { title: 'Wellness',  icon: Dumbbell,    color: 'bg-warm/10 text-warm',       to: '/wellness',  desc: 'Body & Mind' },
  { title: 'Sadaqah',   icon: HandHeart,   color: 'bg-gold/15 text-gold',       to: '/waqf',      desc: 'Give & Earn Ajr' },
]

function QuickActions() {
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Quick Actions</h3>
      <div className="grid grid-cols-4 gap-3">
        {ACTIONS.map(action => (
          <Link
            key={action.title}
            to={action.to}
            className="group flex flex-col items-center gap-2 rounded-xl border border-border bg-card p-4 transition-all duration-200 hover:shadow-md hover:border-primary/20 hover:-translate-y-0.5"
          >
            <div className={cn('flex h-11 w-11 items-center justify-center rounded-xl transition-transform group-hover:scale-110', action.color)}>
              <action.icon className="h-5 w-5" />
            </div>
            <div className="text-center">
              <p className="text-xs font-semibold text-foreground">{action.title}</p>
              <p className="text-[10px] text-muted-foreground hidden md:block">{action.desc}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}

// ─── AI Insight Card ──────────────────────────────────────────────────────────
function InsightCard() {
  const [dismissed, setDismissed] = useState(false)
  const { data: insight } = useQuery({
    queryKey: ['insights', 'today'],
    queryFn: () => api.get('/insights/today').then(r => r.data).catch(() => null),
  })

  if (!insight || dismissed) return null
  return (
    <div className="rounded-xl border border-purple-500/20 bg-gradient-to-br from-purple-500/8 to-blue-500/8 p-4 animate-fade-up">
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex items-center gap-2">
          <Sparkles className="h-3.5 w-3.5 text-purple-400 shrink-0" />
          <p className="text-[11px] font-bold text-purple-400 uppercase tracking-wider">Today's Insight</p>
        </div>
        <button onClick={() => setDismissed(true)} className="text-muted-foreground hover:text-foreground">
          <X className="h-4 w-4" />
        </button>
      </div>
      <p className="text-sm text-foreground leading-relaxed mb-2">{insight.content}</p>
      {insight.quran_reference && <p className="text-xs text-purple-400 italic mb-3">{insight.quran_reference}</p>}
      <div className="flex gap-2 justify-end">
        <button
          onClick={() => api.post(`/insights/${insight.id}/rate`, { rating: 1 }).then(() => setDismissed(true))}
          className="inline-flex items-center gap-1.5 rounded-lg bg-sage/10 border border-sage/20 px-2.5 py-1 text-[11px] text-sage hover:bg-sage/20 transition-colors"
        >
          <ThumbsUp className="h-3 w-3" /> Helpful
        </button>
        <button
          onClick={() => api.post(`/insights/${insight.id}/dismiss`).then(() => setDismissed(true))}
          className="inline-flex items-center gap-1.5 rounded-lg bg-muted px-2.5 py-1 text-[11px] text-muted-foreground hover:bg-accent transition-colors"
        >
          <X className="h-3 w-3" /> Dismiss
        </button>
      </div>
    </div>
  )
}

// ─── Nav Quick Links ──────────────────────────────────────────────────────────
const NAV_LINKS = [
  { to: '/quran',    icon: BookOpen,  label: 'Quran & Hifz',    desc: 'Continue your memorisation' },
  { to: '/qibla',   icon: Compass,   label: 'Qibla & Mosques', desc: 'Direction + nearby mosques' },
  { to: '/wellness',icon: Dumbbell,  label: 'Wellness Center', desc: 'Health, fasts & sleep' },
  { to: '/waqf',    icon: HandHeart, label: 'Waqf & Sadaqah',  desc: 'Give for the sake of Allah' },
]

// ─── Pull-to-refresh ─────────────────────────────────────────────────────────
function usePullToRefresh(onRefresh) {
  const startY = useRef(null)
  const [pullDist, setPullDist] = useState(0)
  const [pulling, setPulling] = useState(false)

  const onTouchStart = useCallback(e => {
    if (window.scrollY === 0) startY.current = e.touches[0].clientY
  }, [])
  const onTouchMove = useCallback(e => {
    if (startY.current === null) return
    const d = e.touches[0].clientY - startY.current
    if (d > 0) { e.preventDefault(); setPullDist(Math.min(d, 80)); setPulling(true) }
  }, [])
  const onTouchEnd = useCallback(() => {
    if (pullDist >= 60) onRefresh()
    startY.current = null; setPullDist(0); setPulling(false)
  }, [pullDist, onRefresh])

  return { onTouchStart, onTouchMove, onTouchEnd, pulling, pullDist }
}

// ─── Dashboard Page ───────────────────────────────────────────────────────────
function DashboardPage() {
  const { user } = useAuthStore()
  const qc = useQueryClient()
  const [refreshing, setRefreshing] = useState(false)

  const displayName = user?.profile?.display_name || user?.email?.split('@')[0] || ''
  const lat = user?.latitude
  const lng = user?.longitude
  const today = format(new Date(), 'yyyy-MM-dd')

  const { data: prayerTimes, isLoading: ptLoading } = useQuery({
    queryKey: ['prayer', 'times'],
    queryFn: () => api.get('/prayer/times', lat && lng ? { params: { lat, lng } } : {}).then(r => r.data).catch(() => null),
    staleTime: 5 * 60_000,
  })

  const { data: summary } = useQuery({
    queryKey: ['prayer', 'summary', 'today', today],
    queryFn: () => api.get(`/prayer/summary/today?date=${today}`).then(r => r.data).catch(() => null),
  })

  const { data: habits } = useQuery({
    queryKey: ['habits'],
    queryFn: () => api.get('/habits').then(r => r.data).catch(() => []),
  })

  // Verse of the day (random from a curated set)
  const { data: verseData } = useQuery({
    queryKey: ['verse', 'today'],
    queryFn: () => api.get('/quran/verse-of-day').then(r => r.data).catch(() => null),
    staleTime: 24 * 60 * 60_000,
  })

  const refresh = useCallback(async () => {
    setRefreshing(true)
    await qc.invalidateQueries()
    setTimeout(() => setRefreshing(false), 800)
  }, [qc])

  const { onTouchStart, onTouchMove, onTouchEnd, pulling, pullDist } = usePullToRefresh(refresh)

  return (
    <div
      className="mx-auto max-w-4xl px-4 py-6 md:px-8 md:py-8 space-y-6"
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      {/* Pull-to-refresh indicator */}
      {pulling && (
        <div className="flex justify-center -mt-4" style={{ opacity: pullDist / 60 }}>
          <RefreshCw className="h-5 w-5 text-primary animate-spin" />
        </div>
      )}

      {/* Header row */}
      <div className="flex items-start justify-between gap-4">
        <IslamicHeader displayName={displayName} />
        <button
          onClick={refresh}
          className={cn('mt-1 p-2 rounded-xl text-muted-foreground hover:bg-muted transition-colors', refreshing && 'animate-spin')}
        >
          <RefreshCw className="h-4 w-4" />
        </button>
      </div>

      {/* Seasonal banner */}
      <IslamicBanner />

      {/* Prayer hero */}
      {ptLoading
        ? <div className="h-44 rounded-2xl bg-muted animate-pulse" />
        : <PrayerHero times={prayerTimes} summary={summary} />
      }

      {/* AI insight */}
      <InsightCard />

      {/* Quick Actions */}
      <QuickActions />

      {/* Habits + Verse 2-col grid */}
      <div className="grid gap-6 md:grid-cols-2">
        <DailyVerse verseData={verseData} />
        <HabitsSummary habits={habits} />
      </div>

      {/* Quick nav links */}
      <div className="space-y-2">
        {NAV_LINKS.map(item => (
          <Link
            key={item.to}
            to={item.to}
            className="flex items-center gap-4 px-5 py-4 rounded-xl border border-border bg-card hover:shadow-md hover:border-primary/20 hover:-translate-y-0.5 transition-all duration-200"
          >
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <item.icon className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground">{item.label}</p>
              <p className="text-xs text-muted-foreground">{item.desc}</p>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
          </Link>
        ))}
      </div>

      {/* Ayat footer */}
      <div className="rounded-2xl bg-sidebar border border-sidebar-border p-5 text-center space-y-2">
        <p className="font-amiri text-lg text-primary/90" dir="rtl">وَمَن يَتَّقِ اللَّهَ يَجْعَل لَّهُ مَخْرَجًا</p>
        <p className="text-xs text-muted-foreground">"And whoever has taqwa of Allah — He will make for him a way out." — Quran 65:2</p>
      </div>
    </div>
  )
}
