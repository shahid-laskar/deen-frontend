import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { format } from 'date-fns'
import { BookOpen, Target, Compass, RefreshCw, ChevronRight, Activity } from 'lucide-react'
import api from '../lib/api'
import { useAuthStore } from '../store/authStore'
import { getIslamicContext } from '../lib/hijri'
import { Card, Skeleton, ProgressRing } from '../components/ui/index'
import { clsx } from 'clsx'

function getGreeting(name) {
  const h = new Date().getHours()
  const prefix = h < 5 ? '🌙 Good night' : h < 12 ? '🌅 Good morning' : h < 17 ? '☀️ Good afternoon' : '🌆 Good evening'
  return `${prefix}${name ? `, ${name}` : ''}`
}

function useCountdown(targetTimeStr) {
  const [remaining, setRemaining] = React.useState(null)
  React.useEffect(() => {
    if (!targetTimeStr) return
    const tick = () => {
      const [h, m] = targetTimeStr.split(':').map(Number)
      const now = new Date(); const target = new Date()
      target.setHours(h, m, 0, 0); if (target < now) target.setDate(target.getDate() + 1)
      const diff = target - now
      setRemaining({ h: Math.floor(diff / 3_600_000), m: Math.floor((diff % 3_600_000) / 60_000), s: Math.floor((diff % 60_000) / 1_000) })
    }
    tick(); const id = setInterval(tick, 1_000); return () => clearInterval(id)
  }, [targetTimeStr])
  return remaining
}

const PRAYER_ORDER = ['Fajr', 'Sunrise', 'Dhuhr', 'Asr', 'Maghrib', 'Isha']

function findNextPrayer(timings) {
  if (!timings) return null
  const now = new Date()
  for (const name of PRAYER_ORDER) {
    const val = timings[name]; if (!val) continue
    const [h, m] = val.split(':').map(Number); const t = new Date(); t.setHours(h, m, 0, 0)
    if (t > now) return { name, time: val }
  }
  return { name: 'Fajr', time: timings.Fajr }
}

function pad(n) { return String(n).padStart(2, '0') }

function PrayerHero({ times, summary }) {
  const next = findNextPrayer(times?.timings)
  const countdown = useCountdown(next?.time)
  return (
    <div className="relative overflow-hidden rounded-2xl p-5 mb-5" style={{ background: 'var(--t-prayer-hero)' }}>
      <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")", backgroundSize: '40px 40px' }} />
      <div className="relative z-10">
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="text-white/70 text-xs uppercase tracking-widest mb-0.5">Next prayer</p>
            <h2 className="font-display text-2xl font-bold text-white">{next?.name || '—'}</h2>
            <p className="text-white/60 text-sm">{next?.time || ''}</p>
          </div>
          {summary && (
            <ProgressRing value={summary.total_logged} max={5} size={64} strokeWidth={5} color="rgba(255,255,255,0.9)">
              <span className="text-xs font-bold text-white">{summary.total_logged}/5</span>
            </ProgressRing>
          )}
        </div>
        {countdown && (
          <div className="flex gap-2 items-end">
            {[{ v: pad(countdown.h), l: 'hr' }, { v: pad(countdown.m), l: 'min' }, { v: pad(countdown.s), l: 'sec' }].map(({ v, l }, i) => (
              <React.Fragment key={i}>
                {i > 0 && <span className="text-white/40 font-bold pb-4">:</span>}
                <div className="text-center"><div className="font-display text-2xl font-bold text-white leading-none">{v}</div><div className="text-white/50 text-[10px] uppercase">{l}</div></div>
              </React.Fragment>
            ))}
            <span className="text-white/50 text-xs ml-1 pb-1">until {next?.name}</span>
          </div>
        )}
        <div className="flex gap-2 mt-4">
          {['Fajr','Dhuhr','Asr','Maghrib','Isha'].map(name => {
            const log = summary?.[name.toLowerCase()]
            return (
              <div key={name} className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold"
                style={{ background: log?.status === 'on_time' ? 'rgba(255,255,255,0.9)' : log?.status ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.12)', color: log?.status === 'on_time' ? '#0a3d24' : 'rgba(255,255,255,0.8)' }}>{name[0]}</div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

const QUICK_ACTIONS = [
  { icon: '📿', label: 'Dhikr',  to: '/habits'  },
  { icon: '📖', label: 'Quran',  to: '/quran'   },
  { icon: '✍️', label: 'Journal',to: '/journal' },
  { icon: '✅', label: 'Habits', to: '/habits'  },
]

function IslamicBanner({ ctx }) {
  const msgs = { isRamadan: { e:'🌙', t:`Ramadan Mubarak! Day ${ctx.hijri.day}` }, isEidFitr: { e:'🎉', t:'Eid ul-Fitr Mubarak!' }, isEidAdha: { e:'🐑', t:'Eid ul-Adha Mubarak!' }, isDhulHijjah10: { e:'🕌', t:`Day ${ctx.hijri.day} of Dhul Hijjah` } }
  const key = Object.keys(msgs).find(k => ctx[k])
  if (!key) return null
  const { e, t } = msgs[key]
  return (
    <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="rounded-xl px-4 py-3 mb-4 flex items-center gap-3" style={{ background: 'var(--t-accent)' }}>
      <span className="text-xl">{e}</span>
      <p className="text-sm font-medium text-white">{t}</p>
    </motion.div>
  )
}

export default function Dashboard() {
  const { user } = useAuthStore()
  const qc = useQueryClient()
  const navigate = useNavigate()
  const [refreshing, setRefreshing] = useState(false)
  const ctx = getIslamicContext()
  const displayName = user?.profile?.display_name || user?.email?.split('@')[0] || ''
  const lat = user?.latitude; const lng = user?.longitude

  const { data: prayerTimes, isLoading: ptLoading } = useQuery({ queryKey: ['prayer','times'], queryFn: () => api.get('/prayer/times', lat && lng ? { params: { lat, lng } } : {}).then(r => r.data).catch(() => null), staleTime: 5*60_000 })
  const { data: summary } = useQuery({ queryKey: ['prayer','summary','today'], queryFn: () => api.get('/prayer/summary/today').then(r => r.data).catch(() => null) })
  const { data: habits } = useQuery({ queryKey: ['habits'], queryFn: () => api.get('/habits').then(r => r.data).catch(() => []) })
  const { data: journal } = useQuery({ queryKey: ['journal'], queryFn: () => api.get('/journal', { params: { limit: 1 } }).then(r => r.data).catch(() => []) })

  const refresh = async () => { setRefreshing(true); await qc.invalidateQueries(); setTimeout(() => setRefreshing(false), 800) }

  return (
    <div className="max-w-2xl mx-auto px-4 py-5">
      {/* Header */}
      <div className="flex items-start justify-between mb-5">
        <div>
          <h1 className="font-display text-xl font-bold" style={{ color: 'var(--t-text)' }}>{getGreeting(displayName)}</h1>
          <p className="text-sm mt-0.5 font-medium" style={{ color: 'var(--t-accent)' }}>{ctx.formatted}</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={refresh} className={clsx('p-2 rounded-xl', refreshing && 'animate-spin')} style={{ color: 'var(--t-text-muted)', background: 'var(--t-bg-card)', border: '0.5px solid var(--t-border)' }}><RefreshCw size={16} /></button>
          <div className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white text-sm" style={{ background: 'var(--t-primary)' }}>{displayName?.[0]?.toUpperCase() ?? 'U'}</div>
        </div>
      </div>

      <IslamicBanner ctx={ctx} />

      {ptLoading ? <Skeleton className="h-44 mb-5" /> : <PrayerHero times={prayerTimes} summary={summary} />}

      {/* Quick actions */}
      <div className="grid grid-cols-4 gap-3 mb-5">
        {QUICK_ACTIONS.map((a, i) => (
          <motion.button key={a.label} onClick={() => navigate(a.to)} className="flex flex-col items-center gap-2 py-3 rounded-xl" style={{ background: 'var(--t-bg-card)', border: '0.5px solid var(--t-border)' }} whileTap={{ scale: 0.92 }} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <span className="text-2xl">{a.icon}</span>
            <span className="text-xs font-medium" style={{ color: 'var(--t-text-muted)' }}>{a.label}</span>
          </motion.button>
        ))}
      </div>

      {/* Habits card */}
      {habits?.length > 0 && (
        <Card className="mb-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-display font-semibold text-sm" style={{ color: 'var(--t-text)' }}>Today's habits</h3>
            <span className="text-xs" style={{ color: 'var(--t-text-muted)' }}>{habits.filter(h=>h.completed_today).length}/{habits.length}</span>
          </div>
          <div className="space-y-2">
            {habits.slice(0,4).map(h => (
              <div key={h.id} className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0"
                  style={{ background: h.completed_today ? 'var(--t-primary)' : 'transparent', borderColor: h.completed_today ? 'var(--t-primary)' : 'var(--t-border-strong)' }}>
                  {h.completed_today && <span style={{ color: 'white', fontSize: 9 }}>✓</span>}
                </div>
                <span className="text-sm flex-1" style={{ color: h.completed_today ? 'var(--t-text-muted)' : 'var(--t-text)', textDecoration: h.completed_today ? 'line-through' : 'none' }}>{h.name}</span>
                {h.current_streak > 0 && <span className="text-xs" style={{ color: 'var(--t-accent)' }}>🔥 {h.current_streak}</span>}
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Quick nav cards */}
      <div className="space-y-2">
        {[
          { to: '/quran',    icon: BookOpen,  label: 'Quran & Hifz',     desc: 'Continue your memorisation' },
          { to: '/qibla',    icon: Compass,   label: 'Qibla & Mosques',  desc: 'Direction + nearby mosques' },
          { to: '/wellness', icon: Activity,  label: 'Wellness Center',  desc: 'Health, fasts & sleep' },
          { to: '/waqf',     icon: Target,    label: 'Waqf & Sadaqah',   desc: 'Give for the sake of Allah' },
        ].map((item, i) => (
          <motion.a key={item.to} href={item.to} className="flex items-center gap-4 px-5 py-4 rounded-xl" style={{ background: 'var(--t-bg-card)', border: '0.5px solid var(--t-border)' }} whileTap={{ scale: 0.98 }} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 + i * 0.06 }}>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'var(--t-border)' }}><item.icon size={20} style={{ color: 'var(--t-primary)' }} /></div>
            <div className="flex-1"><div className="font-medium text-sm" style={{ color: 'var(--t-text)' }}>{item.label}</div><div className="text-xs" style={{ color: 'var(--t-text-muted)' }}>{item.desc}</div></div>
            <ChevronRight size={16} style={{ color: 'var(--t-text-muted)' }} />
          </motion.a>
        ))}
      </div>

      {/* Ayat footer */}
      <div className="mt-6 rounded-2xl p-5" style={{ background: 'var(--t-bg-sidebar)' }}>
        <p className="font-arabic text-lg text-right mb-2" style={{ color: 'var(--t-accent)' }}>وَمَن يَتَّقِ اللَّهَ يَجْعَل لَّهُ مَخْرَجًا</p>
        <p className="text-xs" style={{ color: 'var(--t-text-muted)' }}>"And whoever has taqwa of Allah — He will make for him a way out." — Quran 65:2</p>
      </div>
    </div>
  )
}
