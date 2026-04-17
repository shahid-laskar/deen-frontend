import React, { useState, useMemo } from 'react'
import { createFileRoute, Link } from '@tanstack/react-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { format, subDays, startOfWeek, eachDayOfInterval } from 'date-fns'
import {
  Clock, MapPin, RotateCcw, Star, Users, Plane, Navigation,
  BarChart2, Building2,
} from 'lucide-react'
import api from '@/lib/api'
import { useAuthStore } from '@/store/authStore'
import { calcPrayerTimes, getNextPrayer, CALCULATION_METHODS } from '@/lib/prayerTimes'
import { getIslamicContext } from '@/lib/hijri'
import { cn } from '@/lib/utils'
import { Skeleton } from '@/components/ui/skeleton'
import { Progress } from '@/components/ui/progress'
import { ProgressRing } from '@/components/ui/progress-ring'
import { Switch } from '@/components/ui/switch'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import toast from 'react-hot-toast'

export const Route = createFileRoute('/_authenticated/prayer')({
  component: PrayerPage,
})

// ─── Constants ────────────────────────────────────────────────────────────────
const PRAYERS = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha']
const PRAYER_DISPLAY = { fajr: 'Fajr', dhuhr: 'Dhuhr', asr: 'Asr', maghrib: 'Maghrib', isha: 'Isha' }
const PRAYER_ARABIC = { fajr: 'الفجر', dhuhr: 'الظهر', asr: 'العصر', maghrib: 'المغرب', isha: 'العشاء' }

const STATUS_OPTIONS = [
  { value: 'on_time', label: 'On time', emoji: '✅', color: 'text-sage border-sage/50 bg-sage/10' },
  { value: 'late', label: 'Late', emoji: '⏰', color: 'text-gold border-gold/50 bg-gold/10' },
  { value: 'qadha', label: 'Qadha', emoji: '🔄', color: 'text-blue-400 border-blue-400/50 bg-blue-400/10' },
  { value: 'missed', label: 'Missed', emoji: '❌', color: 'text-destructive border-destructive/50 bg-destructive/10' },
]
const STATUS_BADGE_VARIANT = { on_time: 'sage', late: 'gold', qadha: 'default', missed: 'destructive', excused: 'muted' }

const TABS = [
  { id: 'times', label: 'Times', icon: Clock },
  { id: 'mosques', label: 'Mosques', icon: Building2 },
  { id: 'travel', label: 'Travel', icon: Plane },
  { id: 'stats', label: 'Stats', icon: BarChart2 },
]

// ─── Offline times hook ───────────────────────────────────────────────────────
function useOfflineTimes(user) {
  return useMemo(() => {
    if (typeof user?.latitude !== 'number' || typeof user?.longitude !== 'number') return null
    try {
      return calcPrayerTimes(user.latitude, user.longitude, user.prayer_method || 'MWL', user.madhab || 'hanafi')
    } catch { return null }
  }, [user?.latitude, user?.longitude, user?.prayer_method, user?.madhab])
}

// ─── Prayer Heatmap ───────────────────────────────────────────────────────────
function PrayerHeatmap({ data }) {
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
  data?.forEach(d => { byDate[d.date] = d })

  return (
    <div className="overflow-x-auto">
      <div style={{ display: 'flex', gap: 2, minWidth: 'max-content' }}>
        {weeks.map((week, wi) => (
          <div key={wi} style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {week.map((d, di) => {
              const k = format(d, 'yyyy-MM-dd')
              const cell = byDate[k]
              const r = cell ? cell.on_time / 5 : 0
              return (
                <div
                  key={di} title={cell ? `${k}: ${cell.on_time}/5 on time` : k}
                  className="rounded-sm"
                  style={{
                    width: 11, height: 11,
                    background: r === 0 ? 'oklch(var(--border))' : `oklch(from oklch(0.60 0.10 155) l c h / ${0.15 + r * 0.85})`,
                  }}
                />
              )
            })}
          </div>
        ))}
      </div>
      <div className="flex items-center gap-1 mt-2 text-muted-foreground text-[11px]">
        <span>Less</span>
        {[0.15, 0.35, 0.55, 0.75, 1].map((v, i) => (
          <div key={i} className="w-2.5 h-2.5 rounded-sm bg-primary" style={{ opacity: v }} />
        ))}
        <span>More</span>
      </div>
    </div>
  )
}

// ─── Stats progress bar ───────────────────────────────────────────────────────
function StatsBar({ label, value, max }) {
  const pct = max ? Math.min(100, Math.round((value / max) * 100)) : 0
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between text-xs">
        <span className="text-muted-foreground capitalize">{label}</span>
        <span className="font-medium text-foreground">{pct}%</span>
      </div>
      <Progress value={pct} className="h-1.5" />
    </div>
  )
}

// ─── Log Modal ────────────────────────────────────────────────────────────────
function LogModal({ prayerName, onClose, onSave, isPending }) {
  const [status, setStatus] = useState('on_time')
  const [withCong, setWithCong] = useState(false)
  const [khushu, setKhushu] = useState(null)
  const [locationName, setLocationName] = useState('')
  const [notes, setNotes] = useState('')

  const displayName = PRAYER_DISPLAY[prayerName] || prayerName
  const inputCls = 'w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring'

  return (
    <Dialog open={!!prayerName} onOpenChange={open => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Log {displayName}</DialogTitle>
        </DialogHeader>
        <div className="space-y-5">
          {/* Status selection */}
          <div className="space-y-2">
            <p className="text-sm font-medium text-foreground">How did you pray?</p>
            <div className="grid grid-cols-2 gap-2">
              {STATUS_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setStatus(opt.value)}
                  className={cn(
                    'py-3 rounded-xl text-sm font-medium border-2 transition-all flex items-center justify-center gap-2',
                    status === opt.value ? opt.color : 'border-border bg-card text-muted-foreground hover:bg-muted'
                  )}
                >
                  {opt.emoji} {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Congregation toggle */}
          {status !== 'missed' && (
            <div className="flex items-center justify-between py-3 border-t border-b border-border">
              <div>
                <p className="text-sm font-medium text-foreground">With congregation</p>
                <p className="text-xs text-muted-foreground">27× the reward of praying alone</p>
              </div>
              <Switch checked={withCong} onCheckedChange={setWithCong} />
            </div>
          )}

          {/* Khushu rating */}
          {status !== 'missed' && (
            <div className="space-y-2">
              <p className="text-sm font-medium text-foreground">Khushu rating</p>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map(n => (
                  <button
                    key={n}
                    onClick={() => setKhushu(khushu === n ? null : n)}
                    className={cn(
                      'flex-1 py-2 rounded-xl border transition-all',
                      (khushu ?? 0) >= n
                        ? 'border-gold/50 bg-gold/10 text-gold'
                        : 'border-border bg-card text-muted-foreground'
                    )}
                  >
                    <Star className="h-3.5 w-3.5 mx-auto" fill={(khushu ?? 0) >= n ? 'currentColor' : 'none'} />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Mosque name */}
          {withCong && (
            <div className="space-y-1.5">
              <p className="text-sm font-medium text-foreground">Mosque (optional)</p>
              <input className={inputCls} placeholder="e.g. Al-Noor Mosque" value={locationName} onChange={e => setLocationName(e.target.value)} />
            </div>
          )}

          {/* Notes */}
          <div className="space-y-1.5">
            <p className="text-sm font-medium text-foreground">Notes (optional)</p>
            <input className={inputCls} placeholder="Any reflection..." value={notes} onChange={e => setNotes(e.target.value)} />
          </div>

          <div className="flex gap-3">
            <Button variant="outline" onClick={onClose} className="flex-1">Cancel</Button>
            <Button
              className="flex-1"
              disabled={isPending}
              onClick={() => onSave({ status, with_congregation: withCong, khushu_rating: khushu, location_name: locationName || null, notes: notes || null })}
            >
              {isPending ? 'Saving…' : 'Save'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ─── Prayer Row ───────────────────────────────────────────────────────────────
function PrayerRow({ name, time, log, isNext, onLog }) {
  const display = PRAYER_DISPLAY[name]
  const arabic = PRAYER_ARABIC[name]

  return (
    <button
      onClick={() => onLog(name)}
      className={cn(
        'w-full group relative flex items-center justify-between gap-4 px-5 py-4 rounded-2xl border transition-all duration-300 hover:scale-[1.01] active:scale-[0.99] text-left',
        isNext
          ? 'bg-primary/8 border-primary/30 shadow-sm shadow-primary/10'
          : 'bg-card border-border/60 hover:border-border hover:shadow-md'
      )}
    >
      {isNext && (
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-1/2 bg-primary rounded-r-full" />
      )}

      <div className="flex items-center gap-4 flex-1">
        {/* Step indicator like dashboard timeline */}
        <div className={cn(
          "w-3.5 h-3.5 rounded-full border-2 transition-all duration-500",
          log?.status === 'on_time' ? "bg-sage border-sage shadow-[0_0_8px_oklch(var(--sage)/0.4)]" :
            isNext ? "bg-primary border-primary shadow-[0_0_8px_oklch(var(--primary)/0.4)] animate-pulse" :
              "bg-transparent border-muted-foreground/30"
        )} />

        <div className="flex flex-col">
          <span className={cn(
            "text-[9px] font-black uppercase tracking-[0.2em] leading-none mb-1.5",
            isNext ? "text-primary" : "text-muted-foreground"
          )}>
            {display}
          </span>
          <span className="text-xl font-bold text-foreground tabular-nums leading-none">
            {time || '--:--'}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {log ? (
          <div className="flex flex-col items-end gap-1">
            <Badge variant={STATUS_BADGE_VARIANT[log.status]} className="capitalize px-2 py-0.5 text-[10px] font-bold">
              {log.status.replace('_', ' ')}
            </Badge>
            <div className="flex items-center gap-2">
              {log.with_congregation && <Users className="h-3 w-3 text-primary" />}
              <RotateCcw className="h-2.5 w-2.5 text-muted-foreground/50" />
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-end opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-2 group-hover:translate-x-0">
            <span className="text-[10px] font-bold text-primary uppercase tracking-widest">Tap to Log</span>
            <span className="font-amiri text-lg text-primary/30 leading-none">{arabic}</span>
          </div>
        )}
      </div>
    </button>
  )
}

// ─── Season Banner ────────────────────────────────────────────────────────────
function SeasonBanner({ times, ctx }) {
  if (ctx.isRamadan) return (
    <div className="rounded-2xl p-4 bg-gradient-to-br from-purple-950 to-indigo-950 border border-purple-800/40">
      <div className="flex items-center gap-3 mb-3">
        <span className="text-2xl">🌙</span>
        <div>
          <p className="text-white font-bold">Ramadan — Day {ctx.hijri.day}</p>
          <p className="text-purple-300 text-xs">May Allah accept your fasting and prayers</p>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {[['Suhoor ends', times?.fajr], ['Iftar', times?.maghrib]].map(([label, t]) => (
          <div key={label} className="rounded-xl p-3 bg-white/8">
            <p className="text-purple-300 text-[10px] uppercase tracking-widest">{label}</p>
            <p className="text-white font-bold text-lg">{t || '—'}</p>
          </div>
        ))}
      </div>
    </div>
  )
  if (ctx.isEidFitr) return (
    <div className="rounded-2xl p-4 bg-gradient-to-br from-green-950 to-emerald-900 border border-green-700/40 text-center">
      <p className="text-3xl mb-1">🎉</p>
      <p className="text-white font-bold text-lg">Eid ul-Fitr Mubarak!</p>
      <p className="text-green-300 text-sm mt-1">Taqabbal Allahu Minna wa Minkum</p>
    </div>
  )
  if (ctx.isEidAdha) return (
    <div className="rounded-2xl p-4 bg-gradient-to-br from-amber-950 to-orange-900 border border-amber-700/40 text-center">
      <p className="text-3xl mb-1">🐑</p>
      <p className="text-white font-bold text-lg">Eid ul-Adha Mubarak!</p>
      <p className="text-amber-300 text-sm mt-1">May Allah accept our Qurbani</p>
    </div>
  )
  if (ctx.isDhulHijjah10) return (
    <div className="rounded-xl px-4 py-3 flex items-center gap-3 bg-gold/8 border border-gold/30">
      <span className="text-xl">🕋</span>
      <div>
        <p className="text-gold font-bold">Day {ctx.hijri.day} of Dhul Hijjah</p>
        <p className="text-muted-foreground text-xs">Blessed days — increase your dhikr and good deeds</p>
      </div>
    </div>
  )
  return null
}

// ─── Mosque Tab ───────────────────────────────────────────────────────────────
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
    <div className="space-y-4">
      <div className="rounded-2xl border border-border bg-card p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-semibold text-foreground">Nearby Mosques</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              {currentLat ? 'Closest mosques to your location' : 'Enable location to find nearby mosques'}
            </p>
          </div>
          <Button size="sm" variant="outline" onClick={detectLocation} disabled={detecting}>
            <Navigation className="h-3.5 w-3.5 mr-1" />
            {detecting ? 'Detecting…' : 'Update'}
          </Button>
        </div>
        {locationError && <p className="text-sm text-destructive mb-3">{locationError}</p>}
        {isLoading ? (
          <div className="space-y-3">{[1, 2, 3].map(i => <Skeleton key={i} className="h-16" />)}</div>
        ) : mosques.length === 0 ? (
          <div className="text-center py-10 text-muted-foreground">
            <Building2 className="h-10 w-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm">{currentLat ? 'No mosques found nearby.' : 'Set your location to discover local mosques.'}</p>
            {!currentLat && <Button size="sm" className="mt-3" onClick={detectLocation}>Detect My Location</Button>}
          </div>
        ) : (
          <div className="space-y-2 max-h-[450px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-border hover:scrollbar-thumb-muted-foreground/30 transition-colors">
            {mosques.map(m => (
              <div key={m.id} className="rounded-xl border border-border bg-background p-3">
                <div className="flex justify-between items-start">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-semibold text-foreground">{m.name}</p>
                      {m.is_verified && <Badge variant="sage" className="text-[10px]">✓ Verified</Badge>}
                    </div>
                    {m.address && <p className="text-xs text-muted-foreground mt-0.5">{m.address}</p>}
                    <div className="flex gap-1 mt-1 flex-wrap">
                      {m.has_jumuah && <Badge variant="gold" className="text-[10px]">Jumu'ah</Badge>}
                      {m.madhab && <Badge variant="muted" className="text-[10px] capitalize">{m.madhab}</Badge>}
                    </div>
                  </div>
                  <span className="text-xs font-semibold text-muted-foreground ml-3 shrink-0">{m.distance_km} km</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <button
        onClick={() => api.post('/prayer/mosques/seed').then(() => refetch())}
        className="w-full py-2.5 rounded-xl border border-dashed border-border text-xs text-muted-foreground hover:bg-muted transition-colors"
      >
        + Load sample mosque data
      </button>
    </div>
  )
}

// ─── Travel Tab ───────────────────────────────────────────────────────────────
function TravelTab({ user }) {
  const [detecting, setDetecting] = useState(false)
  const [currentLat, setCurrentLat] = useState(null)
  const [currentLng, setCurrentLng] = useState(null)

  const { data: travelInfo, isLoading } = useQuery({
    queryKey: ['prayer', 'travel', currentLat, currentLng],
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
    <div className="space-y-4">
      <div className="rounded-2xl border border-border bg-card p-5">
        <h3 className="font-semibold text-foreground mb-1">Travel Mode (Qasr)</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Detect your location to check if you qualify for Qasr — shortening 4-rakah prayers to 2.
        </p>
        <Button onClick={detect} disabled={detecting} className="w-full">
          <Plane className="h-4 w-4 mr-2" />
          {detecting ? 'Detecting…' : 'Detect My Position'}
        </Button>
      </div>

      {isLoading && <Skeleton className="h-32" />}

      {travelInfo && (
        <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
          <div className={cn('flex items-center gap-3 p-3 rounded-xl', travelInfo.is_travelling ? 'bg-blue-500/10 border border-blue-500/20' : 'bg-sage/10 border border-sage/20')}>
            <span className="text-3xl">{travelInfo.is_travelling ? '✈️' : '🏠'}</span>
            <div>
              <p className="font-bold text-foreground">{travelInfo.is_travelling ? 'You are travelling' : 'You are at home'}</p>
              <p className="text-sm text-muted-foreground">{travelInfo.distance_from_home_km} km from home location</p>
            </div>
          </div>

          {travelInfo.is_travelling && (
            <div className="space-y-2">
              <div className="rounded-xl p-3 bg-blue-500/8 border border-blue-500/20">
                <p className="text-sm font-semibold text-blue-400">Qasr Prayers (2 rakat)</p>
                <p className="text-xs text-muted-foreground mt-1">Dhuhr, Asr, and Isha may be shortened to 2 rakat while travelling.</p>
              </div>
              <div className="rounded-xl p-3 bg-purple-500/8 border border-purple-500/20">
                <p className="text-sm font-semibold text-purple-400">Jam' (Combining)</p>
                <p className="text-xs text-muted-foreground mt-1">You may combine Dhuhr+Asr and Maghrib+Isha when needed while travelling.</p>
              </div>
            </div>
          )}

          <div className="rounded-xl p-3 bg-muted">
            <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5">{user?.madhab || 'Hanafi'} Scholar Notes</p>
            <p className="text-sm text-foreground leading-relaxed">{travelInfo.madhab_notes}</p>
          </div>
        </div>
      )}

      {!travelInfo && !isLoading && (
        <div className="text-center py-12 text-muted-foreground">
          <span className="text-4xl block mb-3">✈️</span>
          <p className="text-sm">Tap "Detect My Position" to check your travel status.</p>
          <p className="text-xs mt-1">Your home location is set in Settings.</p>
        </div>
      )}
    </div>
  )
}

// ─── Statistics Panel ─────────────────────────────────────────────────────────
function StatisticsPanel() {
  const { data: stats, isLoading: sl } = useQuery({ queryKey: ['prayer', 'stats'], queryFn: () => api.get('/prayer/stats').then(r => r.data).catch(() => []) })
  const { data: heatmap, isLoading: hl } = useQuery({ queryKey: ['prayer', 'heatmap'], queryFn: () => api.get('/prayer/heatmap').then(r => r.data).catch(() => []) })
  const { data: weekly } = useQuery({ queryKey: ['prayer', 'weekly'], queryFn: () => api.get('/prayer/weekly-summary').then(r => r.data).catch(() => null) })

  return (
    <div className="space-y-4">
      {weekly && (
        <div className="rounded-2xl border border-border bg-card p-5">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4">This week</h3>
          <div className="grid grid-cols-3 gap-3 mb-3">
            {[
              ['Prayed', weekly.total_prayed, weekly.total_prayers_possible],
              ['On time', weekly.total_on_time, weekly.total_prayers_possible],
              ["Jama'ah", weekly.congregation_count, Math.max(weekly.total_prayed, 1)],
            ].map(([label, val, max]) => (
              <div key={label} className="flex flex-col items-center gap-2">
                <ProgressRing value={max ? Math.round((val / max) * 100) : 0} size={56} strokeWidth={4}>
                  <span className="text-xs font-bold text-foreground">{val}</span>
                </ProgressRing>
                <p className="text-[10px] text-muted-foreground">{label}</p>
              </div>
            ))}
          </div>
          <p className="text-xs text-center text-muted-foreground">
            {weekly.total_on_time}/{weekly.total_prayers_possible} on time ({weekly.on_time_pct}%)
            {weekly.best_prayer && <> · Best: <span className="text-primary capitalize">{weekly.best_prayer}</span></>}
          </p>
        </div>
      )}

      <div className="rounded-2xl border border-border bg-card p-5">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4">30-day on-time rates</h3>
        {sl
          ? <div className="space-y-3">{PRAYERS.map(p => <Skeleton key={p} className="h-5" />)}</div>
          : <div className="space-y-3">{PRAYERS.map(name => {
            const s = stats?.find(r => r.prayer_name === name)
            return s ? <StatsBar key={name} label={name} value={s.on_time_count} max={s.total_days || 1} /> : null
          })}</div>
        }
      </div>

      <div className="rounded-2xl border border-border bg-card p-5">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-1">52-week record</h3>
        <p className="text-xs text-muted-foreground mb-4">Darker = more on-time prayers that day</p>
        {hl ? <Skeleton className="h-20" /> : <PrayerHeatmap data={heatmap} />}
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────
function PrayerPage() {
  const qc = useQueryClient()
  const { user, hasLocation } = useAuthStore()
  const today = format(new Date(), 'yyyy-MM-dd')
  const [tab, setTab] = useState('times')
  const [logModal, setLogModal] = useState(null)
  const times = useOfflineTimes(user)
  const nextPrayer = useMemo(() => times ? getNextPrayer(times) : null, [times])
  const ctx = getIslamicContext()

  const { data: summary, isLoading: sumLoading } = useQuery({
    queryKey: ['prayer', 'today', today],
    queryFn: () => api.get(`/prayer/summary/today?date=${today}`).then(r => r.data).catch(() => null),
  })
  const { data: streak } = useQuery({
    queryKey: ['prayer', 'streak'],
    queryFn: () => api.get('/prayer/streak').then(r => r.data).catch(() => null),
  })

  const { mutate: logPrayer, isPending } = useMutation({
    mutationFn: (fields) => api.post('/prayer/log', {
      prayer_name: logModal,
      log_date: today,
      prayed_at: fields.status !== 'missed' ? new Date().toISOString() : null,
      ...fields,
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['prayer'] })
      toast.success(`${PRAYER_DISPLAY[logModal] || logModal} logged ✓`)
      setLogModal(null)
    },
    onError: () => toast.error('Could not save.'),
  })

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 md:px-8 md:py-8 space-y-6">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-background/95 backdrop-blur-md -mx-4 px-4 py-2 border-b border-border/50">
        <h1 className="text-2xl font-bold text-foreground">Prayer</h1>
        <p className="text-sm text-primary mt-0.5">{ctx.formatted}</p>
      </div>

      {/* Tab bar */}
      <div className="inline-flex h-9 items-center justify-start rounded-lg bg-muted p-1 gap-0.5 w-full overflow-x-auto">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              'inline-flex items-center gap-1.5 whitespace-nowrap rounded-md px-3 py-1 text-sm font-medium transition-all',
              tab === t.id
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <t.icon className="h-3.5 w-3.5" />
            {t.label}
          </button>
        ))}
      </div>

      {/* Times Tab */}
      {tab === 'times' && (
        <div className="space-y-4">
          {/* Location warning */}
          {!hasLocation?.() && (
            <div className="flex items-center gap-3 rounded-xl bg-gold/10 border border-gold/30 px-4 py-3">
              <MapPin className="h-4 w-4 text-gold shrink-0" />
              <p className="text-sm text-foreground">
                Set your location in{' '}
                <Link to="/settings" className="text-gold underline-offset-2 hover:underline">Settings</Link>
                {' '}for accurate prayer times.
              </p>
            </div>
          )}

          {/* Season banner */}
          <SeasonBanner times={times} ctx={ctx} />

          {/* Quick stats */}
          <div className="grid grid-cols-3 gap-3">
            {[
              ['Current streak', streak?.current_streak ?? '—', 'days'],
              ['Today', `${summary?.total_on_time ?? 0}/5`, 'on time'],
              ['This week', streak ? `${Math.round(streak.this_week_completion)}%` : '—', 'completion'],
            ].map(([label, value, sub]) => (
              <div key={label} className="rounded-xl border border-border bg-card p-3 text-center">
                <p className="text-xl font-bold text-foreground">{value}</p>
                <p className="text-[10px] text-muted-foreground">{sub}</p>
                <p className="text-[9px] text-muted-foreground mt-0.5">{label}</p>
              </div>
            ))}
          </div>

          {/* Prayer rows */}
          <div className="rounded-2xl border border-border bg-card p-4 space-y-2">
            {sumLoading
              ? PRAYERS.map(p => <Skeleton key={p} className="h-14" />)
              : PRAYERS.map(name => (
                  <PrayerRow
                    key={name}
                    name={name}
                    time={times?.[name.toLowerCase()] || null}
                    log={summary?.[name] || null}
                    isNext={nextPrayer?.name?.toLowerCase() === name}
                    onLog={setLogModal}
                  />
                ))
            }
          </div>

          {/* Sunrise / Sunset / Midnight */}
          {times && (
            <div className="grid grid-cols-3 gap-2">
              {[['🌄 Sunrise', times.sunrise], ['🌞 Sunset', times.sunset], ['🕛 Midnight', times.midnight]].map(([l, t]) => (
                <div key={l} className="rounded-xl border border-border bg-card p-3 text-center">
                  <p className="text-xs text-muted-foreground">{l}</p>
                  <p className="text-sm font-semibold text-foreground mt-0.5">{t || '—'}</p>
                </div>
              ))}
            </div>
          )}

          {/* Calculation method note */}
          {user?.prayer_method && (
            <p className="text-center text-[11px] text-muted-foreground">
              {CALCULATION_METHODS[user.prayer_method]?.label || user.prayer_method}
              {' · '}Asr: {user.madhab === 'hanafi' ? 'Hanafi (later)' : 'Standard'}
            </p>
          )}

          {/* Extra sunnah/nafl prayers */}
          <p className="text-center text-[11px] text-muted-foreground">
            Also track:{' '}
            {['jumuah', 'tahajjud', 'duha'].map((p, i) => (
              <React.Fragment key={p}>
                {i > 0 && ' · '}
                <button onClick={() => setLogModal(p)} className="text-primary capitalize hover:underline">
                  {p}
                </button>
              </React.Fragment>
            ))}
          </p>
        </div>
      )}

      {tab === 'mosques' && <MosqueTab user={user} />}
      {tab === 'travel' && <TravelTab user={user} />}
      {tab === 'stats' && <StatisticsPanel />}

      <LogModal
        prayerName={logModal}
        onClose={() => setLogModal(null)}
        onSave={logPrayer}
        isPending={isPending}
      />
    </div>
  )
}
