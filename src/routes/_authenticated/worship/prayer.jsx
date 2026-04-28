import { createFileRoute } from '@tanstack/react-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useMemo, useState } from 'react'
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
  Building2,
  Navigation,
  BarChart2
} from 'lucide-react'
import api from '@/lib/api'
import { useAuthStore } from '@/store/authStore'
import { calcPrayerTimes } from '@/lib/prayerTimes'
import { cn } from '@/lib/utils'

export const Route = createFileRoute('/_authenticated/worship/prayer')({
  component: PrayerPage,
})

const TABS = [
  { id: 'times', label: 'Times', icon: Clock },
  { id: 'mosques', label: 'Mosques', icon: Building2 },
  { id: 'travel', label: 'Travel', icon: Plane },
  { id: 'stats', label: 'Stats', icon: BarChart2 },
]

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

function MosqueTab({ user }) {
  const isMeccaDefault = user?.latitude === 21.4225 && user?.longitude === 39.8262
  const [currentLat, setCurrentLat] = useState(isMeccaDefault ? null : user?.latitude)
  const [currentLng, setCurrentLng] = useState(isMeccaDefault ? null : user?.longitude)
  const [detecting, setDetecting] = useState(false)
  const [locationError, setLocationError] = useState(null)

  const { data: mosques = [], isLoading, refetch } = useQuery({
    queryKey: ['prayer', 'mosques', currentLat, currentLng],
    queryFn: () => {
      if (!currentLat || !currentLng) return []
      return api.get('/prayer/mosques/nearby', { params: { lat: currentLat, lng: currentLng, radius_km: 50000 } }).then(r => r.data).catch(() => [])
    },
    enabled: !!(currentLat && currentLng),
  })

  const detectLocation = () => {
    setDetecting(true); setLocationError(null)
    navigator.geolocation?.getCurrentPosition(
      pos => { setCurrentLat(pos.coords.latitude); setCurrentLng(pos.coords.longitude); setDetecting(false) },
      () => { setLocationError('Could not get your location.'); setDetecting(false) }
    )
  }

  return (
    <div className="space-y-4 animate-slide-up">
      <div className="rounded-3xl glass-card shadow-soft p-5 md:p-6">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="font-bold text-foreground text-lg">Nearby Mosques</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              {currentLat ? 'Closest mosques to your location' : 'Enable location to find nearby mosques'}
            </p>
          </div>
          <button className="flex items-center gap-1.5 rounded-xl bg-primary/10 text-primary px-3 py-2 text-xs font-bold hover:bg-primary hover:text-primary-foreground transition-all" onClick={detectLocation} disabled={detecting}>
            <Navigation className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">{detecting ? 'Detecting…' : 'Update Location'}</span>
          </button>
        </div>
        {locationError && <p className="text-sm text-destructive mb-3">{locationError}</p>}
        {isLoading ? (
          <div className="space-y-3">{[1, 2, 3].map(i => <div key={i} className="h-16 rounded-2xl bg-muted animate-pulse" />)}</div>
        ) : mosques.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground border border-dashed border-border/60 rounded-2xl">
            <Building2 className="h-10 w-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm font-medium">{currentLat ? 'No mosques found nearby.' : 'Set your location to discover local mosques.'}</p>
            {!currentLat && <button className="mt-4 rounded-xl bg-primary text-primary-foreground px-5 py-2.5 text-sm font-bold shadow-glow-primary hover:scale-105 transition-all" onClick={detectLocation}>Detect My Location</button>}
          </div>
        ) : (
          <div className="space-y-2.5 max-h-[450px] overflow-y-auto pr-2 scrollbar-none">
            {mosques.map(m => (
              <div key={m.id} className="rounded-2xl border border-border/50 bg-background/50 p-4 hover:bg-muted/50 transition-colors card-hover">
                <div className="flex justify-between items-start gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <p className="text-sm font-bold text-foreground">{m.name}</p>
                      {m.is_verified && <span className="text-[9px] uppercase tracking-wider font-bold text-sage bg-sage/15 px-1.5 py-0.5 rounded">✓ Verified</span>}
                    </div>
                    {m.address && <p className="text-xs text-muted-foreground">{m.address}</p>}
                    <div className="flex gap-1.5 mt-2 flex-wrap">
                      {m.has_jumuah && <span className="text-[9px] uppercase tracking-wider font-bold text-gold-foreground bg-gold/20 px-1.5 py-0.5 rounded">Jumu'ah</span>}
                      {m.madhab && <span className="text-[9px] uppercase tracking-wider font-bold text-primary bg-primary/15 px-1.5 py-0.5 rounded capitalize">{m.madhab}</span>}
                    </div>
                  </div>
                  <span className="text-[10px] uppercase tracking-widest font-black text-muted-foreground shrink-0 bg-muted px-2 py-1 rounded-lg">{m.distance_km} km</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <button
        onClick={() => api.post('/prayer/mosques/seed').then(() => refetch())}
        className="w-full py-3.5 rounded-2xl border border-dashed border-border/60 text-xs font-bold uppercase tracking-wider text-muted-foreground hover:bg-muted/50 transition-colors"
      >
        + Load sample mosque data
      </button>
    </div>
  )
}

function TravelTab({ user }) {
  const [detecting, setDetecting] = useState(false)
  const [currentLat, setCurrentLat] = useState(null)
  const [currentLng, setCurrentLng] = useState(null)

  const { data: travelInfo, isLoading } = useQuery({
    queryKey: ['prayer', 'travel-tab', currentLat, currentLng],
    queryFn: () => api.get('/prayer/travel-mode', { params: { lat: currentLat, lng: currentLng } }).then(r => r.data).catch(() => null),
    enabled: !!(currentLat && currentLng),
  })

  const detect = () => {
    setDetecting(true)
    navigator.geolocation?.getCurrentPosition(
      pos => { setCurrentLat(pos.coords.latitude); setCurrentLng(pos.coords.longitude); setDetecting(false) },
      () => { toast.error('Could not detect location'); setDetecting(false) }
    )
  }

  return (
    <div className="space-y-4 animate-slide-up">
      <div className="rounded-3xl glass-card shadow-soft p-5 md:p-6">
        <h3 className="font-bold text-foreground text-lg mb-1">Travel Mode (Qasr)</h3>
        <p className="text-sm text-muted-foreground mb-5">
          Detect your location to check if you qualify for Qasr — shortening 4-rakah prayers to 2.
        </p>
        <button onClick={detect} disabled={detecting} className="w-full flex items-center justify-center gap-2 rounded-xl bg-primary text-primary-foreground py-3 text-sm font-bold shadow-glow-primary hover:scale-[1.02] transition-all">
          <Plane className="h-4 w-4" />
          {detecting ? 'Detecting…' : 'Detect My Position'}
        </button>
      </div>

      {isLoading && <div className="h-32 rounded-3xl bg-muted animate-pulse" />}

      {travelInfo && (
        <div className="rounded-3xl glass-card shadow-soft p-5 md:p-6 space-y-4">
          <div className={cn('flex items-center gap-4 p-4 rounded-2xl', travelInfo.is_travelling ? 'bg-blue-500/10 border border-blue-500/20' : 'bg-sage/10 border border-sage/20')}>
            <span className="text-4xl">{travelInfo.is_travelling ? '✈️' : '🏠'}</span>
            <div>
              <p className="font-bold text-foreground">{travelInfo.is_travelling ? 'You are travelling' : 'You are at home'}</p>
              <p className="text-sm text-muted-foreground mt-0.5">{travelInfo.distance_from_home_km} km from home location</p>
            </div>
          </div>

          {travelInfo.is_travelling && (
            <div className="space-y-2">
              <div className="rounded-2xl p-4 bg-blue-500/8 border border-blue-500/20">
                <p className="text-sm font-bold text-blue-400">Qasr Prayers (2 rakat)</p>
                <p className="text-xs text-muted-foreground mt-1">Dhuhr, Asr, and Isha may be shortened to 2 rakat while travelling.</p>
              </div>
              <div className="rounded-2xl p-4 bg-purple-500/8 border border-purple-500/20">
                <p className="text-sm font-bold text-purple-400">Jam' (Combining)</p>
                <p className="text-xs text-muted-foreground mt-1">You may combine Dhuhr+Asr and Maghrib+Isha when needed while travelling.</p>
              </div>
            </div>
          )}

          <div className="rounded-2xl p-4 bg-muted/50 border border-border/50">
            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-2">{user?.madhab || 'Hanafi'} Scholar Notes</p>
            <p className="text-sm text-foreground leading-relaxed">{travelInfo.madhab_notes}</p>
          </div>
        </div>
      )}

      {!travelInfo && !isLoading && (
        <div className="text-center py-12 text-muted-foreground glass-card rounded-3xl border border-dashed border-border/60">
          <span className="text-4xl block mb-3 opacity-50">✈️</span>
          <p className="text-sm font-medium">Tap "Detect My Position" to check your travel status.</p>
          <p className="text-xs mt-1 opacity-70">Your home location is set in Settings.</p>
        </div>
      )}
    </div>
  )
}

function StatisticsPanel({ heatmapData }) {
  const { data: stats } = useQuery({ 
    queryKey: ['prayer', 'stats'], 
    queryFn: () => api.get('/prayer/stats').then(r => r.data).catch(() => []) 
  })

  return (
    <div className="space-y-4 animate-slide-up">
      <div className="rounded-3xl glass-card shadow-soft p-5 md:p-6">
        <h3 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-5">30-Day On-Time Rates</h3>
        <div className="space-y-4">
          {PRAYERS.map(p => {
            const name = p.name.toLowerCase()
            const s = stats?.find(r => r.prayer_name === name)
            const val = s ? s.on_time_count : 0
            const max = s ? (s.total_days || 1) : 1
            const pct = Math.min(100, Math.round((val / max) * 100))
            return (
              <div key={name} className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="font-bold text-foreground capitalize">{p.name}</span>
                  <span className="font-bold text-muted-foreground">{pct}%</span>
                </div>
                <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-primary transition-all duration-1000" style={{ width: `${pct}%` }} />
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Heatmap */}
      <div className="rounded-3xl glass-card shadow-soft p-5 md:p-6">
        <h3 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-4">52-Week Record</h3>
        <div className="flex flex-wrap gap-[3px]">
          {heatmapData.length === 0 ? (
            <p className="text-sm text-muted-foreground">No data yet — log your first prayer.</p>
          ) : (
            heatmapData.slice(-365).map((d) => {
              const a = Math.min(1, Math.max(0, (d.on_time ?? 0) / 5))
              return (
                <div
                  key={d.date}
                  title={`${d.date} · ${d.on_time ?? 0}/5`}
                  className="h-2.5 w-2.5 sm:h-3 sm:w-3 rounded-sm hover:scale-125 transition-transform"
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


function PrayerPage() {
  const qc = useQueryClient()
  const { user } = useAuthStore()
  const [now, setNow] = useState(() => new Date())
  const [coords, setCoords] = useState({ lat: user?.latitude, lng: user?.longitude })
  const [activeTab, setActiveTab] = useState('times')

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

  // Calculate times offline based on coords
  const offlineTimes = useMemo(() => {
    const lat = Number(coords.lat) || Number(user?.latitude) || 21.4225
    const lng = Number(coords.lng) || Number(user?.longitude) || 39.8262
    if (isNaN(lat) || isNaN(lng)) return null
    try {
      return calcPrayerTimes(lat, lng, user?.prayer_method || 'MWL', user?.madhab || 'hanafi')
    } catch { return null }
  }, [coords.lat, coords.lng, user?.latitude, user?.longitude, user?.prayer_method, user?.madhab])

  const { data: apiTimesData } = useQuery({
    queryKey: ['prayer', 'times', coords.lat, coords.lng],
    queryFn: () => {
      const lat = Number(coords.lat) || Number(user?.latitude) || 21.4225
      const lng = Number(coords.lng) || Number(user?.longitude) || 39.8262
      return api.get('/prayer/times', { params: { lat, lng } }).then(r => r.data).catch(() => null)
    },
  })

  const { data: summary } = useQuery({
    queryKey: ['prayer', 'summary', 'today'],
    queryFn: () => api.get(`/prayer/summary/today?date=${todayISO()}`).then(r => r.data).catch(() => null),
  })

  const { data: weekly } = useQuery({
    queryKey: ['prayer', 'weekly'],
    queryFn: () => api.get('/prayer/weekly-summary').then(r => r.data).catch(() => null),
  })

  const { data: streak } = useQuery({
    queryKey: ['prayer', 'streak'],
    queryFn: () => api.get('/prayer/streak').then(r => r.data).catch(() => null),
  })

  const { data: heatmap } = useQuery({
    queryKey: ['prayer', 'heatmap'],
    queryFn: () => api.get('/prayer/heatmap').then(r => r.data).catch(() => []),
  })

  const { data: travel } = useQuery({
    queryKey: ['prayer', 'travel', coords.lat, coords.lng],
    queryFn: () => {
      if (!coords.lat || !coords.lng) return null
      return api.get('/prayer/travel-mode', { params: { lat: coords.lat, lng: coords.lng } }).then(r => r.data).catch(() => null)
    },
    enabled: !!(coords.lat && coords.lng),
  })

  const log = useMutation({
    mutationFn: (payload) => {
      let backendStatus = 'on_time'
      let withCongregation = false
      if (payload.status === 'Late') backendStatus = 'late'
      if (payload.status === 'Qaza') backendStatus = 'qadha'
      if (payload.status === 'Jamaah') {
        backendStatus = 'on_time'
        withCongregation = true
      }
      return api.post('/prayer/log', {
        prayer_name: payload.prayer.toLowerCase(),
        log_date: todayISO(),
        prayed_at: new Date().toISOString(),
        status: backendStatus,
        with_congregation: withCongregation,
      })
    },
    onSuccess: () => {
      toast.success('Logged')
      qc.invalidateQueries({ queryKey: ['prayer'] })
    },
    onError: () => toast.error('Could not log prayer'),
  })

  const apiTimes = apiTimesData?.data || apiTimesData || {}
  const prayers = PRAYERS.map((p) => {
    const key = p.name.toLowerCase()
    let t = offlineTimes ? offlineTimes[key] : null
    if (!t) t = apiTimes[key] || apiTimes[p.name]
    return {
      ...p,
      time: t || '—',
    }
  })

  const currentIdx = useMemo(() => {
    const m = now.getHours() * 60 + now.getMinutes()
    let last = 0
    prayers.forEach((p, i) => {
      const [h, mn] = (p.time || '00:00').split(':').map(Number)
      if (!isNaN(h) && h * 60 + (mn || 0) <= m) last = i
    })
    return last
  }, [now, prayers])

  const heatmapData = (heatmap || [])

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 md:px-8 md:py-10 space-y-6 pb-24">
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
            <span className="hidden sm:inline">Notifications On</span>
          </button>
        </div>
      </div>

      {/* Tab bar */}
      <div className="inline-flex h-10 items-center justify-start rounded-xl bg-muted/50 p-1 gap-1 w-full overflow-x-auto scrollbar-none animate-slide-up border border-border/50">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={cn(
              'inline-flex items-center gap-2 whitespace-nowrap rounded-lg px-4 py-1.5 text-sm font-bold transition-all',
              activeTab === t.id
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground hover:bg-background/50'
            )}
          >
            <t.icon className="h-4 w-4" />
            {t.label}
          </button>
        ))}
      </div>

      {activeTab === 'times' && (
        <div className="space-y-8">
          {/* Travel mode banner */}
          {travel?.is_travelling && (
            <div className="rounded-2xl border border-gold/30 bg-gold/5 p-4 flex items-center gap-3 animate-slide-up">
              <Plane className="h-5 w-5 text-gold-foreground" />
              <p className="text-sm font-semibold">
                Travel mode active — qasr (shortened) prayers enabled.
              </p>
            </div>
          )}

          {/* Prayer log rows */}
          <div className="grid gap-3 animate-slide-up stagger-1">
            {prayers.map((p, idx) => {
              const isCurrent = idx === currentIdx
              const isNext = idx === currentIdx + 1
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
                      <p.icon className="h-5 w-5" strokeWidth={2} />
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
                              className="text-[9px] uppercase tracking-wider text-muted-foreground hover:text-primary hover:bg-primary/10 px-1.5 py-0.5 rounded font-bold transition-colors"
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

          {/* Quick Stats */}
          <div className="grid gap-4 md:grid-cols-3 animate-slide-up stagger-2">
            <StatCard
              label="Today"
              value={`${summary?.total_on_time ?? 0}/5`}
              sub="prayers logged"
            />
            <StatCard
              label="This week"
              value={`${weekly?.on_time_pct ?? 0}%`}
              sub="completion rate"
            />
            <StatCard
              label="Streak"
              value={String(streak?.current_streak ?? 0)}
              sub="days in a row"
            />
          </div>

          {/* Additional Prayers */}
          <div className="animate-slide-up stagger-3 pt-4">
            <div className="rounded-3xl glass-card shadow-soft p-5 text-center">
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-3">Additional Prayers</p>
              <div className="flex flex-wrap items-center justify-center gap-3">
                {['Tahajjud', 'Duha', 'Jumuah'].map(extra => (
                  <button
                    key={extra}
                    onClick={() => log.mutate({ prayer: extra, status: 'On Time' })}
                    className="flex items-center gap-2 rounded-xl bg-background border border-border/60 px-4 py-2 text-sm font-bold hover:border-primary/50 hover:bg-primary/5 hover:text-primary transition-all shadow-sm"
                  >
                    <Star className="h-3.5 w-3.5 opacity-50" />
                    {extra}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'mosques' && <MosqueTab user={user} />}
      {activeTab === 'travel' && <TravelTab user={user} />}
      {activeTab === 'stats' && <StatisticsPanel heatmapData={heatmapData} />}
    </div>
  )
}

function StatCard({ label, value, sub }) {
  return (
    <div className="rounded-3xl border border-border/60 bg-card p-5 shadow-soft hover:shadow-elevated transition-shadow">
      <div className="flex items-center gap-2 text-primary">
        <Clock className="h-3.5 w-3.5" />
        <span className="text-[10px] uppercase tracking-widest font-black">{label}</span>
      </div>
      <p className="text-3xl font-bold mt-3 tabular-nums">{value}</p>
      <p className="text-xs font-medium text-muted-foreground mt-1">{sub}</p>
      <CheckCircle2 className="h-4 w-4 text-sage/60 mt-4" />
    </div>
  )
}
