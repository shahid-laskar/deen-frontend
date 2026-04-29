import React, { useState, useEffect, useCallback, useRef } from 'react'
import { createFileRoute, Link } from '@tanstack/react-router'
import { RefreshCw, Moon } from 'lucide-react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { format } from 'date-fns'
import toast from 'react-hot-toast'
import api from '@/lib/api'
import { useAuthStore } from '@/store/authStore'
import { useTheme } from '@/lib/theme-context'
import { getIslamicContext } from '@/lib/hijri'
import { cn } from '@/lib/utils'
import { Icon } from '@/components/ui/icon'
import { Pattern } from '@/components/ui/pattern'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { PrayerHeroSkeleton, CardSkeleton } from '@/components/ui/skeleton'
import { SalahRings } from '@/components/dashboard/SalahRings'
import { TodayIntention } from '@/components/dashboard/TodayIntention'
import { StreakPulse } from '@/components/dashboard/StreakPulse'
import { SmartSuggestion } from '@/components/dashboard/SmartSuggestion'

export const Route = createFileRoute('/_authenticated/today/')({
  component: DashboardPage,
})

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getGreeting() {
  const h = new Date().getHours()
  if (h < 5) return 'Peace be upon you'
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
  const d = new Date(); d.setHours(h, m, 0, 0); return d
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

function formatCountdown(ms) {
  if (ms <= 0) return { h: '00', m: '00', s: '00' }
  return {
    h: String(Math.floor(ms / 3_600_000)).padStart(2, '0'),
    m: String(Math.floor((ms % 3_600_000) / 60_000)).padStart(2, '0'),
    s: String(Math.floor((ms % 60_000) / 1_000)).padStart(2, '0'),
  }
}

// ─── Geometric Divider ───────────────────────────────────────────────────────
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
  return (
    <div className="space-y-1">
      <p className="text-sm text-muted-foreground tracking-wide">{format(new Date(), 'EEEE, MMMM d, yyyy')}</p>
      <h1 className="text-2xl md:text-3xl font-bold text-foreground">
        {getGreeting()}{displayName ? `, ${displayName}` : ''} 🤲
      </h1>
      <p className="font-amiri text-base text-primary/80">بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ</p>
      <GeometricDivider />
      <p className="text-xs font-medium text-muted-foreground tracking-wide">{ctx.formatted}</p>
    </div>
  )
}

// ─── Islamic Banner ────────────────────────────────────────────────────
function IslamicBanner() {
  const ctx = getIslamicContext()
  const msgs = {
    ramadan: { icon: '🌙', text: `Ramadan Mubarak! Day ${ctx.hijri.day} of Ramadan` },
    eid_fitr: { icon: '🎉', text: 'Eid ul-Fitr Mubarak! May Allah accept your worship.' },
    eid_adha: { icon: '🐑', text: 'Eid ul-Adha Mubarak! May Allah accept your sacrifice.' },
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
  const [countdown, setCountdown] = useState({ h: '00', m: '00', s: '00' })
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const tick = () => {
      const np = findNextPrayer(times); setNext(np)
      if (!np) return
      const now = new Date()
      const target = parseTime(np.time)
      if (!target) return
      if (target < now) target.setDate(target.getDate() + 1)
      setCountdown(formatCountdown(target - now))
      const prevIdx = np.index === 0 ? 4 : np.index - 1
      const prevTime = parseTime(times?.[PRAYER_NAMES[prevIdx].toLowerCase()])
      if (prevTime && target) {
        if (prevTime > now) prevTime.setDate(prevTime.getDate() - 1)
        setProgress(Math.min(((now - prevTime) / (target - prevTime)) * 100, 100))
      }
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [times])

  const radius = 62, circumference = 2 * Math.PI * radius
  const strokeOffset = circumference - (progress / 100) * circumference
  const logged = summary?.total_logged ?? 0
  if (!next) return null

  return (
    <div className="relative overflow-hidden rounded-2xl border border-border/50 p-6 shadow-glow-primary group" style={{ background: 'var(--gradient-hero)' }}>
      <Pattern className="opacity-[0.06] text-white" />
      <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
        {/* Progress ring */}
        <div className="relative flex-shrink-0">
          <div className="absolute inset-2 rounded-full bg-white/10 blur-xl animate-pulse" />
          <svg width="148" height="148" className="-rotate-90 relative z-10">
            <circle cx="74" cy="74" r={radius} fill="none" stroke="currentColor" strokeWidth="5" className="text-white/20" />
            <circle cx="74" cy="74" r={radius} fill="none" stroke="white" strokeWidth="6" strokeLinecap="round"
              strokeDasharray={circumference} strokeDashoffset={strokeOffset}
              className="transition-all duration-1000 ease-linear"
              style={{ filter: "drop-shadow(0 0 6px rgba(255,255,255,0.4))" }} />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center z-10">
            <span className="font-amiri text-2xl text-white leading-none">{ARABIC_NAMES[next.name]}</span>
            <span className="text-[11px] font-bold text-white/80 mt-1 tracking-wide">{next.time}</span>
          </div>
        </div>
        {/* Info */}
        <div className="flex-1 text-center md:text-left space-y-3">
          <div className="flex items-center justify-center md:justify-start gap-2 text-white/70">
            <Icon name="clock" size={14} />
            <span className="text-[11px] uppercase tracking-[0.2em] font-bold">Next Prayer</span>
          </div>
          <h3 className="text-4xl font-black tracking-tight text-white">{next.name}</h3>
          <div className="flex items-center justify-center md:justify-start gap-1.5">
            {[{ value: countdown.h, label: "hr" }, { value: countdown.m, label: "min" }, { value: countdown.s, label: "sec" }].map((unit, i) => (
              <div key={unit.label} className="flex items-center gap-1.5 text-white">
                <div className="flex flex-col items-center">
                  <span className="text-3xl md:text-4xl font-mono font-bold tabular-nums leading-none">{unit.value}</span>
                  <span className="text-[9px] uppercase tracking-wider text-white/60 mt-0.5 font-bold">{unit.label}</span>
                </div>
                {i < 2 && <span className="text-2xl font-light text-white/30 -mt-3">:</span>}
              </div>
            ))}
          </div>
          <div className="flex items-center justify-center md:justify-start gap-1.5 text-white/60">
            <Icon name="map-pin" size={12} />
            <span className="text-[10px] tracking-wide font-medium">{logged}/5 prayers logged today</span>
          </div>
        </div>
        {/* Prayer timeline */}
        <div className="flex md:flex-col gap-3">
          {PRAYER_NAMES.map((name, i) => {
            const isCurrent = next?.name === name
            const isPast = next ? i < next.index : false
            const logStatus = summary?.[name.toLowerCase()]?.status
            const timeKey = Object.keys(times || {}).find(k => k.toLowerCase() === name.toLowerCase())
            return (
              <div key={name} className="flex flex-col items-center gap-1.5 group/item">
                <div className={cn('h-3.5 w-3.5 rounded-full border-2 transition-all duration-300 relative',
                  isCurrent ? 'border-white bg-white shadow-[0_0_10px_rgba(255,255,255,0.5)] scale-110' :
                  logStatus === 'on_time' ? 'border-white/60 bg-white/40' :
                  isPast ? 'border-white/20 bg-white/10' : 'border-white/10 bg-transparent group-hover/item:border-white/40'
                )}>
                  {isCurrent && <div className="absolute inset-0 rounded-full bg-white animate-ping opacity-20" />}
                </div>
                <div className="text-center">
                  <span className={cn("text-[8px] font-black uppercase tracking-tighter block leading-none mb-1", isCurrent ? "text-white" : "text-white/50")}>{name}</span>
                  <span className="text-[9px] font-bold text-white/80 block">{timeKey ? times[timeKey] : '--:--'}</span>
                </div>
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
    <div className="relative overflow-hidden rounded-2xl border border-border bg-card p-6 group">
      <Pattern className="opacity-[0.03] text-primary" />
      <div className="relative z-10 space-y-4">
        <div className="flex items-center gap-2 text-gold">
          <Icon name="book" size={16} />
          <span className="text-xs uppercase tracking-wider font-bold">Verse of the Day</span>
        </div>
        <div className="text-center space-y-4 py-2">
          <p className="font-amiri-quran text-2xl md:text-3xl leading-loose text-foreground" dir="rtl">{arabic}</p>
          <div className="mx-auto w-16 h-0.5 bg-gradient-to-r from-transparent via-gold/50 to-transparent" />
          <p className="text-base text-foreground/80 font-medium italic">"{translation}"</p>
          <p className="text-xs text-muted-foreground font-bold tracking-wide uppercase opacity-70">{ref}</p>
        </div>
      </div>
    </div>
  )
}

// ─── Habits Summary ───────────────────────────────────────────────────────────
function HabitsSummary({ habits }) {
  if (!habits?.length) {
    return (
      <div className="rounded-2xl border border-border bg-card p-6 flex flex-col items-center justify-center text-center space-y-2">
        <Icon name="notebook" size={32} className="text-muted-foreground/30" />
        <p className="text-sm text-muted-foreground font-medium">No habits tracked yet</p>
        <Link to="/grow/habits" className="text-xs text-primary font-bold hover:underline">Start Tracking</Link>
      </div>
    )
  }
  const completed = habits.filter(h => h.completed_today).length
  const pct = Math.round((completed / habits.length) * 100)
  return (
    <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Today's Habits</h3>
        <span className="text-xs font-bold text-primary">{completed}/{habits.length}</span>
      </div>
      <div className="space-y-1.5">
        <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
          <div className="h-full rounded-full bg-gradient-to-r from-primary to-gold transition-all duration-500" style={{ width: `${pct}%` }} />
        </div>
        <p className="text-[11px] font-medium text-muted-foreground">{pct}% completed</p>
      </div>
      <div className="space-y-2">
        {habits.slice(0, 5).map(h => (
          <div key={h.id} className={cn('flex items-center gap-3 rounded-lg px-3 py-2 transition-colors', h.completed_today ? 'bg-sage/10' : 'hover:bg-muted/50')}>
            {h.completed_today
              ? <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-sage"><Icon name="check" size={10} className="text-white" /></div>
              : <Icon name="plus" size={14} className="h-5 w-5 shrink-0 text-border" />
            }
            <span className={cn('text-sm flex-1 truncate font-medium', h.completed_today ? 'text-muted-foreground line-through' : 'text-foreground')}>{h.name}</span>
            {h.current_streak > 0 && <span className="text-[10px] text-gold shrink-0 font-bold">🔥 {h.current_streak}</span>}
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Children Progress Widget ──────────────────────────────────────────
function ChildrenProgressWidget() {
  const { data: children = [] } = useQuery({
    queryKey: ['children'],
    queryFn: () => api.get('/children').then(r => r.data).catch(() => []),
  })
  if (!children.length) return null
  return (
    <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Children's Progress</h3>
        <Link to="/me/children" className="text-xs text-primary font-bold hover:underline">View All</Link>
      </div>
      <div className="space-y-3">
        {children.slice(0, 3).map(c => (
          <Link key={c.id} to={`/me/children/${c.id}`} className="flex items-center justify-between p-3 rounded-xl bg-muted/30 border border-border/50 hover:bg-muted/50 hover:border-primary/30 transition-all">
            <div className="flex items-center gap-3">
              <span className="text-2xl">{c.avatar_emoji}</span>
              <div>
                <p className="text-sm font-bold text-foreground leading-tight">{c.name}</p>
                <p className="text-[10px] font-semibold text-muted-foreground">Level {c.level || 1} • {c.xp_total || 0} XP</p>
              </div>
            </div>
            {c.current_streak > 0 && (
              <div className="flex items-center gap-1 text-orange-500 bg-orange-500/10 px-2 py-1 rounded-lg">
                <Icon name="flame" size={12} />
                <span className="text-xs font-bold">{c.current_streak}</span>
              </div>
            )}
          </Link>
        ))}
      </div>
    </div>
  )
}

// ─── Quick Actions ────────────────────────────────────────────────────────────
const ACTIONS = [
  { title: 'Quran', icon: 'book', color: 'bg-primary/10 text-primary', to: '/worship/quran', desc: 'Read & Listen' },
  { title: 'Dhikr', icon: 'sparkles', color: 'bg-gold/15 text-gold', to: '/grow/habits', search: { tab: 'dhikr' }, desc: 'Tasbeeh Counter' },
  { title: 'Journal', icon: 'notebook', color: 'bg-sage/15 text-sage', to: '/today/journal', desc: 'Daily Reflection' },
  { title: 'Habits', icon: 'heart', color: 'bg-warm/10 text-warm', to: '/grow/habits', desc: 'Track Progress' },
  { title: 'Qibla', icon: 'compass', color: 'bg-primary/10 text-primary', to: '/worship/qibla', desc: 'Find Direction' },
  { title: 'Community', icon: 'user', color: 'bg-sage/15 text-sage', to: '/community', desc: 'Connect' },
  { title: 'Wellness', icon: 'star', color: 'bg-warm/10 text-warm', to: '/grow/wellness', desc: 'Body & Mind' },
  { title: 'Meals', icon: 'heart', color: 'bg-gold/15 text-gold', to: '/grow/meal', desc: 'Meal Nutrition' },
]

function QuickActions() {
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Quick Actions</h3>
      <div className="grid grid-cols-4 gap-3">
        {ACTIONS.map(action => (
          <Link key={action.title} to={action.to} search={action.search}
            className="group flex flex-col items-center gap-2 rounded-xl border border-border bg-card p-4 transition-all duration-200 hover:shadow-md hover:border-primary/20 hover:-translate-y-0.5">
            <div className={cn('flex h-11 w-11 items-center justify-center rounded-xl transition-transform group-hover:scale-110', action.color)}>
              <Icon name={action.icon} size={20} />
            </div>
            <div className="text-center">
              <p className="text-xs font-bold text-foreground">{action.title}</p>
              <p className="text-[10px] text-muted-foreground hidden md:block font-medium">{action.desc}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}

// ─── Pull-to-refresh ─────────────────────────────────────────────────────────
function usePullToRefresh(onRefresh) {
  const startY = useRef(null)
  const [pullDist, setPullDist] = useState(0)
  const [pulling, setPulling] = useState(false)
  const onTouchStart = useCallback(e => { if (window.scrollY === 0) startY.current = e.touches[0].clientY }, [])
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
  const [showMore, setShowMore] = useState(false)
  const [ramadanMode, setRamadanMode] = useState(() => { try { return localStorage.getItem('deen-ramadan-mode') === 'true' } catch { return false } })

  const toggleRamadanMode = () => {
    const next = !ramadanMode
    setRamadanMode(next)
    localStorage.setItem('deen-ramadan-mode', next)
    toast.success(next ? 'Ramadan Mode activated! 🌙' : 'Ramadan Mode disabled')
  }

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

  const { data: habits, isLoading: habitsLoading } = useQuery({
    queryKey: ['habits'],
    queryFn: () => api.get('/habits').then(r => r.data).catch(() => []),
  })

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
    <div className="mx-auto max-w-4xl px-4 py-6 md:px-8 md:py-8 space-y-5"
      onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd}>

      {/* Pull-to-refresh */}
      {pulling && (
        <div className="flex justify-center -mt-4" style={{ opacity: pullDist / 60 }}>
          <RefreshCw className="h-5 w-5 text-primary animate-spin" />
        </div>
      )}

      {/* 1. Header */}
      <div className="flex items-start justify-between gap-4">
        <IslamicHeader displayName={displayName} />
        <div className="flex flex-col items-end gap-2 mt-1">
          <button onClick={toggleRamadanMode} className={cn('flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border', ramadanMode ? 'bg-primary/10 border-primary/30 text-primary' : 'bg-card border-border text-muted-foreground hover:bg-muted')}>
            <Moon className="h-3.5 w-3.5" /> {ramadanMode ? 'Ramadan' : 'Ramadan'}
          </button>
          <button onClick={refresh} className={cn('p-2 rounded-xl text-muted-foreground hover:bg-muted transition-colors', refreshing && 'animate-spin')}>
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Seasonal banner */}
      <IslamicBanner />
      
      {/* Ramadan Mode Widget */}
      {ramadanMode && (
        <div className="rounded-2xl border-2 border-primary/30 bg-primary/5 p-6 space-y-4 animate-in fade-in zoom-in-95 shadow-sm">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-black text-foreground flex items-center gap-2"><Moon className="h-5 w-5 text-primary" fill="currentColor" /> Ramadan Tracker</h3>
            <Badge className="bg-primary text-primary-foreground font-black uppercase tracking-widest text-[9px]">Active</Badge>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-card p-4 rounded-xl border border-border">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Next Fasting Milestone</p>
              <p className="text-xl font-black text-primary">Iftar in 4h 20m</p>
            </div>
            <div className="bg-card p-4 rounded-xl border border-border">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Taraweeh</p>
              <p className="text-xl font-black text-primary">8 / 20 Rakat</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1 bg-card text-xs">Log Fast</Button>
            <Button variant="outline" className="flex-1 bg-card text-xs">Read Quran</Button>
            <Button variant="outline" className="flex-1 bg-card text-xs">Donate Zakat</Button>
          </div>
        </div>
      )}

      {/* 2. Prayer Hero — next prayer with live countdown */}
      {ptLoading ? <PrayerHeroSkeleton /> : <PrayerHero times={prayerTimes} summary={summary} />}

      {/* 3. Salah Rings — five prayer progress rings */}
      <SalahRings summary={summary} />

      {/* 4. Today's Intention — editable daily niyyah */}
      <TodayIntention />

      {/* 5. Streak Pulse — current streak + sparkline */}
      {habitsLoading ? <CardSkeleton lines={2} /> : <StreakPulse habits={habits || []} />}

      {/* 6. Daily Verse — ayah + reflection */}
      <DailyVerse verseData={verseData} />

      {/* 7. Smart Suggestion — AI-picked next action */}
      <SmartSuggestion prayerSummary={summary} habits={habits} />

      {/* Progressive disclosure: "Show more" toggle */}
      <button
        onClick={() => setShowMore(!showMore)}
        className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-border bg-card text-sm font-medium text-muted-foreground hover:bg-muted/50 hover:text-foreground transition-all"
      >
        <span>{showMore ? 'Show less' : 'Show more'}</span>
        <Icon name={showMore ? 'chevron-up' : 'chevron-down'} size={16} />
      </button>

      {/* Collapsible section */}
      {showMore && (
        <div className="space-y-5 animate-fade-up">
          {/* Quick Actions */}
          <QuickActions />

          {/* Dashboard Grid */}
          <div className="grid gap-6 md:grid-cols-2">
            {habitsLoading ? <CardSkeleton /> : <HabitsSummary habits={habits} />}
            <ChildrenProgressWidget />
          </div>

          {/* Ayat footer */}
          <div className="rounded-2xl bg-sidebar border border-sidebar-border p-5 text-center space-y-2">
            <p className="font-amiri text-lg text-primary/90" dir="rtl">وَمَن يَتَّقِ اللَّهَ يَجْعَل لَّهُ مَخْرَجًا</p>
            <p className="text-xs text-muted-foreground">"And whoever has taqwa of Allah — He will make for him a way out." — Quran 65:2</p>
          </div>
        </div>
      )}
    </div>
  )
}
