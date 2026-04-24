import React, { useEffect, useMemo, useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import {
  Bell,
  CheckCircle2,
  Clock,
  MapPin,
  Moon,
  Plane,
  Star,
  Sun,
  Sunrise,
  Sunset,
} from 'lucide-react'
import { prayerApi } from '@/lib/api'

export const Route = createFileRoute('/_authenticated/prayer')({
  component: PrayerPage,
})

const PRAYERS = [
  { name: 'Fajr', arabic: 'الفجر', icon: Star, period: 'Dawn' },
  { name: 'Sunrise', arabic: 'الشروق', icon: Sunrise, period: 'Morning' },
  { name: 'Dhuhr', arabic: 'الظهر', icon: Sun, period: 'Noon' },
  { name: 'Asr', arabic: 'العصر', icon: Sun, period: 'Afternoon' },
  { name: 'Maghrib', arabic: 'المغرب', icon: Sunset, period: 'Sunset' },
  { name: 'Isha', arabic: 'العشاء', icon: Moon, period: 'Night' },
]

const STATUSES = ['Prayed', 'On Time', 'Late', 'Jamaah', 'Qaza']

function todayISO() {
  return new Date().toISOString().slice(0, 10)
}

function PrayerPage() {
  const qc = useQueryClient()
  const [now, setNow] = useState(() => new Date())
  const [coords, setCoords] = useState({})

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 30_000)
    return () => clearInterval(t)
  }, [])

  useEffect(() => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) return
    navigator.geolocation.getCurrentPosition(
      (p) => setCoords({ lat: p.coords.latitude, lng: p.coords.longitude }),
      () => {},
      { timeout: 8000 }
    )
  }, [])

  const times = useQuery({
    queryKey: ['prayer', 'times', coords.lat, coords.lng],
    queryFn: () =>
      prayerApi.times({ lat: coords.lat, lng: coords.lng }).catch(() => null),
  })

  const summary = useQuery({
    queryKey: ['prayer', 'summary', 'today'],
    queryFn: () => prayerApi.summaryToday().catch(() => null),
  })

  const weekly = useQuery({
    queryKey: ['prayer', 'summary', 'weekly'],
    queryFn: () => prayerApi.summaryWeekly().catch(() => null),
  })

  const heatmap = useQuery({
    queryKey: ['prayer', 'heatmap'],
    queryFn: () => prayerApi.heatmap(180).catch(() => []),
  })

  const travel = useQuery({
    queryKey: ['prayer', 'travel'],
    queryFn: () => prayerApi.travelMode().catch(() => null),
  })

  const events = useQuery({
    queryKey: ['prayer', 'events'],
    queryFn: () => prayerApi.events().catch(() => []),
  })

  const log = useMutation({
    mutationFn: (payload) =>
      prayerApi.log({ prayer: payload.prayer, status: payload.status, date: todayISO() }),
    onSuccess: () => {
      toast.success('Logged')
      qc.invalidateQueries({ queryKey: ['prayer'] })
    },
    onError: () => toast.error('Could not log prayer'),
  })

  const apiTimes = times.data ?? {}
  const prayers = PRAYERS.map((p) => ({
    ...p,
    time: apiTimes[p.name.toLowerCase()] ?? apiTimes[p.name] ?? '—',
  }))

  const currentIdx = useMemo(() => {
    const m = now.getHours() * 60 + now.getMinutes()
    let last = 0
    prayers.forEach((p, i) => {
      const [h, mn] = (p.time || '00:00').split(':').map(Number)
      if (!isNaN(h) && h * 60 + (mn || 0) <= m) last = i
    })
    return last
  }, [now, prayers])

  const heatmapData = heatmap.data ?? []

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 md:px-8 md:py-10 space-y-8">
      {/* Header */}
      <div className="animate-slide-up">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <p className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground font-bold">
              Salah Schedule
            </p>
            <h1 className="font-amiri text-4xl md:text-5xl font-bold mt-2 text-gradient-primary">
              Prayer Times
            </h1>
            <div className="flex items-center gap-2 mt-3 text-sm text-muted-foreground">
              <MapPin className="h-3.5 w-3.5 text-primary" />
              <span>
                {coords.lat
                  ? `${coords.lat.toFixed(2)}, ${coords.lng?.toFixed(2)}`
                  : 'Location not set'}
              </span>
              <span className="text-muted-foreground/40">•</span>
              <span>
                {now.toLocaleDateString('en-US', {
                  weekday: 'long',
                  month: 'long',
                  day: 'numeric',
                })}
              </span>
            </div>
          </div>
          <button className="flex items-center gap-2 rounded-2xl glass-card px-4 py-2.5 text-sm font-semibold shadow-soft hover:shadow-elevated transition-all">
            <Bell className="h-4 w-4 text-primary" />
            Notifications On
          </button>
        </div>
      </div>

      {/* Travel mode banner */}
      {travel.data?.active && (
        <div className="rounded-2xl border border-gold/30 bg-gold/5 p-4 flex items-center gap-3">
          <Plane className="h-5 w-5 text-gold-foreground" />
          <p className="text-sm font-semibold">
            Travel mode active — qasr (shortened) prayers enabled.
          </p>
        </div>
      )}

      {/* Events */}
      {(events.data ?? []).length > 0 && (
        <div className="rounded-2xl glass-card shadow-soft p-4">
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold mb-2">
            Islamic events
          </p>
          <div className="flex gap-2 flex-wrap">
            {(events.data ?? []).slice(0, 4).map((e) => (
              <span
                key={e.name}
                className="rounded-full bg-primary/10 text-primary text-xs font-bold px-3 py-1"
              >
                {e.name} · {e.date}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Prayer log rows */}
      <div className="grid gap-3 animate-slide-up stagger-2">
        {prayers.map((p, idx) => {
          const isCurrent = idx === currentIdx
          const isNext = idx === currentIdx + 1
          const Icon = p.icon
          return (
            <div
              key={p.name}
              className={`relative overflow-hidden rounded-2xl border transition-all duration-300 card-hover ${
                isCurrent
                  ? 'border-primary/40 bg-primary/8 shadow-glow-primary'
                  : isNext
                    ? 'border-gold/30 bg-gold/5 shadow-soft'
                    : 'border-border/50 glass-card shadow-soft'
              }`}
            >
              <div className="flex items-center gap-4 p-4 md:p-5">
                <div
                  className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${
                    isCurrent
                      ? 'bg-primary text-primary-foreground'
                      : isNext
                        ? 'bg-gold/20 text-gold-foreground'
                        : 'bg-muted/60 text-muted-foreground'
                  }`}
                >
                  <Icon className="h-5 w-5" strokeWidth={2} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-3 flex-wrap">
                    <h3 className="text-lg font-bold">{p.name}</h3>
                    <span className="font-amiri text-lg text-primary/70">{p.arabic}</span>
                    {isCurrent && (
                      <span className="text-[10px] uppercase tracking-wider font-bold text-primary bg-primary/15 px-2 py-0.5 rounded-full animate-pulse-glow">
                        Now
                      </span>
                    )}
                    {isNext && (
                      <span className="text-[10px] uppercase tracking-wider font-bold text-gold-foreground bg-gold/25 px-2 py-0.5 rounded-full">
                        Next
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">{p.period}</p>
                </div>
                <div className="text-right space-y-1.5">
                  <p className="text-2xl font-bold tabular-nums">{p.time}</p>
                  {p.name !== 'Sunrise' && (
                    <div className="flex gap-1 flex-wrap justify-end">
                      {STATUSES.map((s) => (
                        <button
                          key={s}
                          onClick={() => log.mutate({ prayer: p.name, status: s })}
                          disabled={log.isPending}
                          className="text-[9px] uppercase tracking-wider text-muted-foreground hover:text-primary hover:bg-primary/10 px-1.5 py-0.5 rounded font-bold"
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3 animate-slide-up stagger-3">
        <StatCard
          label="Today"
          value={`${summary.data?.completed ?? 0}/5`}
          sub="prayers logged"
        />
        <StatCard
          label="This week"
          value={`${weekly.data?.rate ?? 0}%`}
          sub="completion rate"
        />
        <StatCard
          label="Streak"
          value={String(summary.data?.streak ?? 0)}
          sub="days in a row"
        />
      </div>

      {/* Heatmap */}
      <div className="rounded-3xl glass-card shadow-soft p-6 md:p-8 animate-slide-up stagger-4">
        <h3 className="text-lg font-bold mb-4">Last 180 days</h3>
        <div className="flex flex-wrap gap-[3px]">
          {heatmapData.length === 0 ? (
            <p className="text-sm text-muted-foreground">No data yet — log your first prayer above.</p>
          ) : (
            heatmapData.slice(-180).map((d) => {
              const a = Math.min(1, Math.max(0, (d.rate ?? 0) / 100))
              return (
                <div
                  key={d.date}
                  title={`${d.date} · ${d.rate ?? 0}%`}
                  className="h-3 w-3 rounded-sm"
                  style={{
                    background:
                      a === 0
                        ? 'color-mix(in oklab, var(--color-muted) 60%, transparent)'
                        : `color-mix(in oklab, var(--color-primary) ${20 + a * 70}%, transparent)`,
                  }}
                />
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}

function StatCard({ label, value, sub }) {
  return (
    <div className="rounded-2xl border border-border/60 bg-card p-5 shadow-soft">
      <div className="flex items-center gap-2 text-primary">
        <Clock className="h-3.5 w-3.5" />
        <span className="text-[10px] uppercase tracking-widest font-bold">{label}</span>
      </div>
      <p className="text-3xl font-bold mt-2 tabular-nums">{value}</p>
      <p className="text-xs text-muted-foreground mt-1">{sub}</p>
      <CheckCircle2 className="h-4 w-4 text-sage/40 mt-3" />
    </div>
  )
}
