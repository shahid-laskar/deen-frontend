import React, { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { format, subDays, startOfWeek, eachDayOfInterval } from 'date-fns'
import { Clock, MapPin, RotateCcw, Star, Users, Plane, ChevronDown, Navigation } from 'lucide-react'
import api from '../lib/api'
import { useAuthStore } from '../store/authStore'
import { Card, Button, Skeleton, StatCard, ProgressRing, Toggle, Modal } from '../components/ui/index'
import { calcPrayerTimes, getNextPrayer, CALCULATION_METHODS } from '../lib/prayerTimes'
import { getIslamicContext } from '../lib/hijri'
import toast from 'react-hot-toast'
import { clsx } from 'clsx'

const PRAYERS = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha']
const PRAYER_DISPLAY = { fajr: 'Fajr', dhuhr: 'Dhuhr', asr: 'Asr', maghrib: 'Maghrib', isha: 'Isha' }
const PRAYER_ICONS   = { fajr: '🌙', dhuhr: '☀️', asr: '🌤', maghrib: '🌅', isha: '🌑' }
const STATUS_OPTIONS = [
  { value: 'on_time', label: 'On time', emoji: '✅' },
  { value: 'late',    label: 'Late',    emoji: '⏰' },
  { value: 'qadha',   label: 'Qadha',  emoji: '🔄' },
  { value: 'missed',  label: 'Missed', emoji: '❌' },
]
const STATUS_COLOR = { on_time: 'var(--t-primary)', late: 'var(--t-accent)', qadha: '#3b82f6', missed: '#ef4444', excused: 'var(--t-border)' }

const TABS = [
  { id: 'times',   label: 'Times'   },
  { id: 'mosques', label: 'Mosques' },
  { id: 'travel',  label: 'Travel'  },
  { id: 'stats',   label: 'Stats'   },
]

function useOfflineTimes(user) {
  return useMemo(() => {
    if (!user?.latitude || !user?.longitude) return null
    try { return calcPrayerTimes(user.latitude, user.longitude, user.prayer_method || 'MWL', user.madhab || 'hanafi') }
    catch { return null }
  }, [user?.latitude, user?.longitude, user?.prayer_method, user?.madhab])
}

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
  const color = (cell) => {
    if (!cell) return 'var(--t-border)'
    const r = cell.on_time / 5
    if (r === 0) return 'var(--t-border)'
    return `rgba(20,168,96,${0.15 + r * 0.85})`
  }
  return (
    <div className="overflow-x-auto">
      <div style={{ display: 'flex', gap: 2, minWidth: 'max-content' }}>
        {weeks.map((week, wi) => (
          <div key={wi} style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {week.map((d, di) => {
              const k = format(d, 'yyyy-MM-dd'); const cell = byDate[k]
              return <div key={di} title={cell ? `${k}: ${cell.on_time}/5 on time` : k} style={{ width: 11, height: 11, background: color(cell), borderRadius: 2, cursor: 'default' }} />
            })}
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 6, color: 'var(--t-text-muted)', fontSize: 11 }}>
        <span>Less</span>
        {[0.1, 0.3, 0.5, 0.7, 1].map((v, i) => <div key={i} style={{ width: 11, height: 11, borderRadius: 2, background: `rgba(20,168,96,${v})` }} />)}
        <span>More</span>
      </div>
    </div>
  )
}

function StatsBar({ label, value, max }) {
  const pct = max ? Math.min(100, Math.round((value / max) * 100)) : 0
  return (
    <div style={{ marginBottom: 8 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--t-text-muted)', marginBottom: 3 }}>
        <span className="capitalize">{label}</span><span style={{ color: 'var(--t-text)' }}>{pct}%</span>
      </div>
      <div style={{ height: 6, background: 'var(--t-border)', borderRadius: 3, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${pct}%`, background: 'var(--t-primary)', borderRadius: 3, transition: 'width 0.7s' }} />
      </div>
    </div>
  )
}

function LogModal({ prayerName, onClose, onSave, isPending }) {
  const [status, setStatus] = useState('on_time')
  const [withCong, setWithCong] = useState(false)
  const [khushu, setKhushu] = useState(null)
  const [locationName, setLocationName] = useState('')
  const [notes, setNotes] = useState('')
  if (!prayerName) return null
  return (
    <Modal open={!!prayerName} onClose={onClose} title={`Log ${PRAYER_DISPLAY[prayerName] || prayerName}`}>
      <div className="space-y-5">
        <div>
          <p className="label">How did you pray?</p>
          <div className="grid grid-cols-2 gap-2">
            {STATUS_OPTIONS.map(opt => (
              <button key={opt.value} onClick={() => setStatus(opt.value)}
                className="py-3 rounded-xl text-sm font-medium border-2 transition-all flex items-center justify-center gap-2"
                style={{ borderColor: status === opt.value ? STATUS_COLOR[opt.value] : 'var(--t-border)', background: status === opt.value ? STATUS_COLOR[opt.value] + '18' : 'var(--t-bg-card)', color: 'var(--t-text)' }}>
                {opt.emoji} {opt.label}
              </button>
            ))}
          </div>
        </div>
        {status !== 'missed' && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0', borderTop: '0.5px solid var(--t-border)', borderBottom: '0.5px solid var(--t-border)' }}>
            <div>
              <p style={{ fontSize: 14, fontWeight: 500, color: 'var(--t-text)' }}>With congregation</p>
              <p style={{ fontSize: 11, color: 'var(--t-text-muted)' }}>27× the reward of praying alone</p>
            </div>
            <Toggle checked={withCong} onChange={e => setWithCong(e.target.checked)} />
          </div>
        )}
        {status !== 'missed' && (
          <div>
            <p className="label">Khushu rating</p>
            <div className="flex gap-2">
              {[1,2,3,4,5].map(n => (
                <button key={n} onClick={() => setKhushu(khushu === n ? null : n)}
                  className="flex-1 py-2 rounded-xl border transition-all"
                  style={{ borderColor: khushu >= n ? 'var(--t-accent)' : 'var(--t-border)', background: khushu >= n ? 'rgba(201,135,10,0.12)' : 'var(--t-bg-card)' }}>
                  <Star size={14} style={{ margin: 'auto', color: khushu >= n ? 'var(--t-accent)' : 'var(--t-text-muted)' }} fill={khushu >= n ? 'currentColor' : 'none'} />
                </button>
              ))}
            </div>
          </div>
        )}
        {withCong && (
          <div>
            <p className="label">Mosque (optional)</p>
            <input className="input" placeholder="e.g. Al-Noor Mosque" value={locationName} onChange={e => setLocationName(e.target.value)} />
          </div>
        )}
        <div>
          <p className="label">Note (optional)</p>
          <input className="input" placeholder="Any reflection..." value={notes} onChange={e => setNotes(e.target.value)} />
        </div>
        <div className="flex gap-3">
          <Button variant="secondary" onClick={onClose} className="flex-1">Cancel</Button>
          <Button variant="primary" loading={isPending} onClick={() => onSave({ status, with_congregation: withCong, khushu_rating: khushu, location_name: locationName || null, notes: notes || null })} className="flex-1">Save</Button>
        </div>
      </div>
    </Modal>
  )
}

function PrayerRow({ name, time, log, isNext, onLog }) {
  const c = STATUS_COLOR[log?.status] || 'var(--t-border)'
  return (
    <div onClick={() => onLog(name)} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', borderRadius: 12, border: `${isNext ? 2 : 1}px solid ${isNext ? 'var(--t-accent)' : log ? c : 'var(--t-border)'}`, background: log ? c + '12' : isNext ? 'rgba(201,135,10,0.05)' : 'var(--t-bg-card)', cursor: 'pointer', transition: 'all 0.15s' }}>
      <span style={{ fontSize: 20, width: 28, textAlign: 'center' }}>{PRAYER_ICONS[name]}</span>
      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--t-text)', textTransform: 'capitalize' }}>{PRAYER_DISPLAY[name]}</span>
          {isNext && <span style={{ fontSize: 9, fontWeight: 700, padding: '2px 8px', borderRadius: 99, background: 'var(--t-accent)', color: 'white' }}>NEXT</span>}
        </div>
        <span style={{ fontSize: 12, color: 'var(--t-text-muted)' }}>{time || '—'}</span>
      </div>
      {log ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {log.with_congregation && <Users size={12} style={{ color: 'var(--t-primary)' }} />}
          {log.khushu_rating && <span style={{ color: 'var(--t-accent)', fontSize: 11 }}>{'★'.repeat(log.khushu_rating)}</span>}
          <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 99, background: c + '22', color: c, fontWeight: 500 }}>{STATUS_OPTIONS.find(s => s.value === log.status)?.label}</span>
          <RotateCcw size={12} style={{ color: 'var(--t-text-muted)' }} />
        </div>
      ) : <span style={{ fontSize: 11, color: 'var(--t-text-muted)' }}>Tap to log →</span>}
    </div>
  )
}

// ─── Islamic Season Banners ────────────────────────────────────────────────────

function SeasonBanner({ times, ctx }) {
  // Ramadan
  if (ctx.isRamadan) return (
    <div style={{ borderRadius: 16, padding: 16, marginBottom: 16, background: 'linear-gradient(135deg, #1a0d40, #2d1060)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
        <span style={{ fontSize: 24 }}>🌙</span>
        <div>
          <p style={{ color: 'white', fontWeight: 700 }}>Ramadan — Day {ctx.hijri.day}</p>
          <p style={{ color: '#c084fc', fontSize: 12 }}>May Allah accept your fasting</p>
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        {[['Suhoor ends', times?.Fajr], ['Iftar', times?.Maghrib]].map(([label, t]) => (
          <div key={label} style={{ borderRadius: 10, padding: '8px 12px', background: 'rgba(255,255,255,0.08)' }}>
            <p style={{ color: '#c084fc', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</p>
            <p style={{ color: 'white', fontWeight: 700, fontSize: 18 }}>{t || '—'}</p>
          </div>
        ))}
      </div>
    </div>
  )

  // Eid ul-Fitr
  if (ctx.isEidFitr) return (
    <div style={{ borderRadius: 16, padding: 16, marginBottom: 16, background: 'linear-gradient(135deg, #14532d, #166534)', textAlign: 'center' }}>
      <p style={{ fontSize: 28 }}>🎉</p>
      <p style={{ color: 'white', fontWeight: 700, fontSize: 18 }}>Eid ul-Fitr Mubarak!</p>
      <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13, marginTop: 4 }}>Taqabbal Allahu Minna wa Minkum</p>
    </div>
  )

  // Eid ul-Adha
  if (ctx.isEidAdha) return (
    <div style={{ borderRadius: 16, padding: 16, marginBottom: 16, background: 'linear-gradient(135deg, #451a03, #78350f)', textAlign: 'center' }}>
      <p style={{ fontSize: 28 }}>🐑</p>
      <p style={{ color: 'white', fontWeight: 700, fontSize: 18 }}>Eid ul-Adha Mubarak!</p>
      <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13, marginTop: 4 }}>May Allah accept our Qurbani</p>
    </div>
  )

  // Dhul Hijjah first 10 days
  if (ctx.isDhulHijjah10) return (
    <div style={{ borderRadius: 16, padding: '12px 16px', marginBottom: 16, background: 'linear-gradient(135deg, #1c1917, #292524)', display: 'flex', alignItems: 'center', gap: 12 }}>
      <span style={{ fontSize: 20 }}>🕌</span>
      <div>
        <p style={{ color: '#fbbf24', fontWeight: 700 }}>Day {ctx.hijri.day} of Dhul Hijjah</p>
        <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12 }}>Best days for deeds — these days are more beloved than any others</p>
      </div>
    </div>
  )

  return null
}

// ─── Mosque Finder Tab ─────────────────────────────────────────────────────────

function MosqueTab({ user }) {
  const [locationError, setLocationError] = useState(null)
  const [currentLat, setCurrentLat] = useState(user?.latitude)
  const [currentLng, setCurrentLng] = useState(user?.longitude)
  const [detecting, setDetecting] = useState(false)

  const { data: mosques = [], isLoading, refetch } = useQuery({
    queryKey: ['prayer', 'mosques', currentLat, currentLng],
    queryFn: () => {
      if (!currentLat || !currentLng) return []
      return api.get('/prayer/mosques/nearby', { params: { lat: currentLat, lng: currentLng, radius_km: 50000 } }).then(r => r.data).catch(() => [])
    },
    enabled: !!(currentLat && currentLng),
  })

  const detectLocation = () => {
    setDetecting(true)
    navigator.geolocation?.getCurrentPosition(
      pos => { setCurrentLat(pos.coords.latitude); setCurrentLng(pos.coords.longitude); setDetecting(false) },
      () => { setLocationError('Could not get your location.'); setDetecting(false) }
    )
  }

  return (
    <div className="space-y-4">
      <Card>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <div>
            <h3 className="font-display font-semibold" style={{ color: 'var(--t-text)' }}>Nearby Mosques</h3>
            <p style={{ fontSize: 12, color: 'var(--t-text-muted)', marginTop: 2 }}>
              {currentLat ? `Closest mosques to your location` : 'Enable location to find nearby mosques'}
            </p>
          </div>
          <button onClick={detectLocation} disabled={detecting}
            style={{ padding: '8px 14px', borderRadius: 10, background: 'var(--t-primary)', color: 'white', border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600, opacity: detecting ? 0.7 : 1 }}>
            <Navigation size={14} style={{ display: 'inline', marginRight: 4 }} />
            {detecting ? 'Detecting…' : 'Update Location'}
          </button>
        </div>
        {locationError && <p style={{ color: '#ef4444', fontSize: 13, marginBottom: 8 }}>{locationError}</p>}
        {isLoading ? (
          <div className="space-y-2">{[1,2,3].map(i => <Skeleton key={i} className="h-16" />)}</div>
        ) : mosques.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--t-text-muted)' }}>
            <span style={{ fontSize: 32 }}>🕌</span>
            <p style={{ marginTop: 8, fontSize: 14 }}>
              {currentLat ? 'No mosques found nearby. Try increasing radius.' : 'Set your location to discover local mosques.'}
            </p>
            {!currentLat && (
              <Button variant="primary" onClick={detectLocation} className="mt-3">Detect My Location</Button>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            {mosques.map(m => (
              <div key={m.id} style={{ padding: '12px 14px', borderRadius: 12, border: '0.5px solid var(--t-border)', background: 'var(--t-bg-card)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                  <div>
                    <p style={{ fontWeight: 600, fontSize: 14, color: 'var(--t-text)' }}>
                      {m.name}
                      {m.is_verified && <span style={{ marginLeft: 6, fontSize: 10, color: 'var(--t-primary)', background: 'rgba(20,168,96,0.1)', padding: '2px 6px', borderRadius: 99 }}>✓ Verified</span>}
                    </p>
                    {m.address && <p style={{ fontSize: 12, color: 'var(--t-text-muted)', marginTop: 2 }}>{m.address}</p>}
                    <div style={{ display: 'flex', gap: 6, marginTop: 4, flexWrap: 'wrap' }}>
                      {m.has_jumuah && <span style={{ fontSize: 10, padding: '2px 6px', borderRadius: 99, background: 'rgba(201,135,10,0.1)', color: 'var(--t-accent)' }}>Jumu'ah</span>}
                      {m.madhab && <span style={{ fontSize: 10, padding: '2px 6px', borderRadius: 99, background: 'var(--t-border)', color: 'var(--t-text-muted)', textTransform: 'capitalize' }}>{m.madhab}</span>}
                    </div>
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--t-text-muted)', whiteSpace: 'nowrap', marginLeft: 8 }}>{m.distance_km} km</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Seed sample data button */}
      <button onClick={() => api.post('/prayer/mosques/seed').then(() => refetch())}
        style={{ width: '100%', padding: '10px', borderRadius: 10, border: '1px dashed var(--t-border)', background: 'transparent', color: 'var(--t-text-muted)', fontSize: 12, cursor: 'pointer' }}>
        + Load sample mosque data
      </button>
    </div>
  )
}

// ─── Travel Mode Tab ───────────────────────────────────────────────────────────

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
      <Card>
        <h3 className="font-display font-semibold mb-2" style={{ color: 'var(--t-text)' }}>Travel Mode (Qasr)</h3>
        <p style={{ fontSize: 13, color: 'var(--t-text-muted)', marginBottom: 16 }}>
          Detect your current location to check if you qualify for Qasr (shortening 4-rakah prayers to 2).
        </p>
        <Button variant="primary" onClick={detect} loading={detecting} className="w-full">
          <Plane size={16} style={{ marginRight: 6 }} />
          Detect My Position
        </Button>
      </Card>

      {isLoading && <Skeleton className="h-32" />}

      {travelInfo && (
        <Card>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16, padding: '12px 14px', borderRadius: 12,
            background: travelInfo.is_travelling ? 'rgba(59,130,246,0.1)' : 'rgba(20,168,96,0.1)',
            border: `1px solid ${travelInfo.is_travelling ? '#3b82f6' : 'var(--t-primary)'}`,
          }}>
            <span style={{ fontSize: 28 }}>{travelInfo.is_travelling ? '✈️' : '🏠'}</span>
            <div>
              <p style={{ fontWeight: 700, color: 'var(--t-text)' }}>
                {travelInfo.is_travelling ? 'You are travelling' : 'You are at home'}
              </p>
              <p style={{ fontSize: 13, color: 'var(--t-text-muted)', marginTop: 2 }}>
                {travelInfo.distance_from_home_km} km from home location
              </p>
            </div>
          </div>

          {travelInfo.is_travelling && (
            <div style={{ marginBottom: 16 }}>
              <div style={{ padding: '10px 14px', borderRadius: 10, background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.2)', marginBottom: 8 }}>
                <p style={{ fontWeight: 600, fontSize: 13, color: '#3b82f6' }}>Qasr Prayers (2 rakat)</p>
                <p style={{ fontSize: 12, color: 'var(--t-text-muted)', marginTop: 4 }}>Dhuhr, Asr, and Isha may be shortened to 2 rakat while travelling.</p>
              </div>
              <div style={{ padding: '10px 14px', borderRadius: 10, background: 'rgba(168,85,247,0.08)', border: '1px solid rgba(168,85,247,0.2)' }}>
                <p style={{ fontWeight: 600, fontSize: 13, color: '#a855f7' }}>Jam' (Combining)</p>
                <p style={{ fontSize: 12, color: 'var(--t-text-muted)', marginTop: 4 }}>You may combine Dhuhr+Asr and Maghrib+Isha when needed while travelling.</p>
              </div>
            </div>
          )}

          <div style={{ padding: '12px 14px', borderRadius: 10, background: 'var(--t-bg-card)', border: '0.5px solid var(--t-border)' }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--t-text-muted)', textTransform: 'uppercase', marginBottom: 6, letterSpacing: '0.05em' }}>
              {user?.madhab || 'Hanafi'} Scholar Notes
            </p>
            <p style={{ fontSize: 13, color: 'var(--t-text)', lineHeight: 1.6 }}>{travelInfo.madhab_notes}</p>
          </div>
        </Card>
      )}

      {!travelInfo && !isLoading && (
        <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--t-text-muted)' }}>
          <span style={{ fontSize: 40 }}>✈️</span>
          <p style={{ marginTop: 12, fontSize: 14 }}>Tap "Detect My Position" above to check your travel status.</p>
          <p style={{ marginTop: 6, fontSize: 12 }}>Your home location is set in Settings.</p>
        </div>
      )}
    </div>
  )
}

function StatisticsPanel() {
  const { data: stats,   isLoading: sl  } = useQuery({ queryKey: ['prayer','stats'],   queryFn: () => api.get('/prayer/stats').then(r=>r.data).catch(()=>[]) })
  const { data: heatmap, isLoading: hl  } = useQuery({ queryKey: ['prayer','heatmap'], queryFn: () => api.get('/prayer/heatmap').then(r=>r.data).catch(()=>[]) })
  const { data: weekly               }    = useQuery({ queryKey: ['prayer','weekly'],   queryFn: () => api.get('/prayer/weekly-summary').then(r=>r.data).catch(()=>null) })
  return (
    <div className="space-y-4">
      {weekly && (
        <Card>
          <h3 className="font-display font-semibold mb-3" style={{ color: 'var(--t-text)' }}>This week</h3>
          <div className="grid grid-cols-3 gap-3 mb-3">
            {[['Prayed', weekly.total_prayed, weekly.total_prayers_possible], ['On time', weekly.total_on_time, weekly.total_prayers_possible], ["Jama'ah", weekly.congregation_count, Math.max(weekly.total_prayed, 1)]].map(([label, val, max]) => (
              <div key={label} className="text-center">
                <ProgressRing value={val} max={max} size={52} strokeWidth={4} color="var(--t-primary)">
                  <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--t-text)' }}>{val}</span>
                </ProgressRing>
                <p style={{ fontSize: 10, color: 'var(--t-text-muted)', marginTop: 4 }}>{label}</p>
              </div>
            ))}
          </div>
          <p style={{ fontSize: 13, textAlign: 'center', color: 'var(--t-text-muted)' }}>
            {weekly.total_on_time}/{weekly.total_prayers_possible} on time ({weekly.on_time_pct}%)
            {weekly.best_prayer && <> · Best: <span style={{ color: 'var(--t-primary)', textTransform: 'capitalize' }}>{weekly.best_prayer}</span></>}
          </p>
        </Card>
      )}
      <Card>
        <h3 className="font-display font-semibold mb-4" style={{ color: 'var(--t-text)' }}>30-day on-time rates</h3>
        {sl ? PRAYERS.map(p => <Skeleton key={p} className="h-5 mb-3" />) : PRAYERS.map(name => {
          const s = stats?.find(r => r.prayer_name === name)
          return s ? <StatsBar key={name} label={name} value={s.on_time_count} max={s.total_days || 1} /> : null
        })}
      </Card>
      <Card>
        <h3 className="font-display font-semibold mb-1" style={{ color: 'var(--t-text)' }}>52-week record</h3>
        <p style={{ fontSize: 12, color: 'var(--t-text-muted)', marginBottom: 12 }}>Darker = more on-time prayers that day</p>
        {hl ? <Skeleton className="h-20" /> : <PrayerHeatmap data={heatmap} />}
      </Card>
    </div>
  )
}

export default function Prayer() {
  const qc = useQueryClient()
  const { user, hasLocation } = useAuthStore()
  const today    = format(new Date(), 'yyyy-MM-dd')
  const [tab,      setTab]      = useState('times')
  const [logModal, setLogModal] = useState(null)
  const times     = useOfflineTimes(user)
  const nextPrayer = useMemo(() => times ? getNextPrayer(times) : null, [times])
  const ctx = getIslamicContext()

  const { data: summary, isLoading: sumLoading } = useQuery({ queryKey: ['prayer','today', today],  queryFn: () => api.get(`/prayer/summary/today?date=${today}`).then(r=>r.data).catch(()=>null) })
  const { data: streak }                          = useQuery({ queryKey: ['prayer','streak'], queryFn: () => api.get('/prayer/streak').then(r=>r.data).catch(()=>null) })

  const { mutate: logPrayer, isPending } = useMutation({
    mutationFn: (fields) => api.post('/prayer/log', { prayer_name: logModal, log_date: today, prayed_at: fields.status !== 'missed' ? new Date().toISOString() : null, ...fields }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['prayer'] }); toast.success(`${PRAYER_DISPLAY[logModal] || logModal} logged ✓`); setLogModal(null) },
    onError: () => toast.error('Could not save.'),
  })

  return (
    <div className="max-w-2xl mx-auto px-4 py-5">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div>
          <h1 className="font-display text-2xl font-bold" style={{ color: 'var(--t-text)' }}>Prayer</h1>
          <p style={{ fontSize: 13, color: 'var(--t-accent)' }}>{ctx.formatted}</p>
        </div>
      </div>

      {/* Tab bar */}
      <div style={{ display: 'flex', gap: 2, padding: 4, borderRadius: 12, background: 'var(--t-bg-card)', border: '0.5px solid var(--t-border)', marginBottom: 16, overflowX: 'auto' }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{ padding: '8px 16px', borderRadius: 9, fontSize: 13, fontWeight: 500, background: tab === t.id ? 'var(--t-primary)' : 'transparent', color: tab === t.id ? 'white' : 'var(--t-text-muted)', border: 'none', cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all 0.15s' }}>{t.label}</button>
        ))}
      </div>

      {tab === 'times' && <>
        {!hasLocation() && (
          <div style={{ borderRadius: 12, padding: '12px 16px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 10, background: 'rgba(201,135,10,0.1)', border: '1px solid var(--t-accent)' }}>
            <MapPin size={16} style={{ color: 'var(--t-accent)', flexShrink: 0 }} />
            <p style={{ fontSize: 13, color: 'var(--t-text)' }}>Set your location in <a href="/settings" style={{ color: 'var(--t-accent)' }}>Settings</a> for accurate times.</p>
          </div>
        )}
        <SeasonBanner times={times} ctx={ctx} />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, marginBottom: 16 }}>
          {[['Current streak', streak?.current_streak ?? '—', 'days'], ['Today', `${summary?.total_on_time ?? 0}/5`, 'on time'], ['This week', streak ? `${Math.round(streak.this_week_completion)}%` : '—', 'completion']].map(([label, value, sub]) => (
            <div key={label} style={{ borderRadius: 12, padding: '12px 8px', textAlign: 'center', background: 'var(--t-bg-card)', border: '0.5px solid var(--t-border)' }}>
              <p style={{ fontSize: 20, fontWeight: 700, color: 'var(--t-text)' }}>{value}</p>
              <p style={{ fontSize: 10, color: 'var(--t-text-muted)' }}>{sub}</p>
              <p style={{ fontSize: 9, color: 'var(--t-text-muted)', marginTop: 2 }}>{label}</p>
            </div>
          ))}
        </div>
        <Card className="mb-4">
          <div className="space-y-2">
            {sumLoading ? PRAYERS.map(p => <Skeleton key={p} className="h-14" />) : PRAYERS.map(name => {
              const timeName = name.charAt(0).toUpperCase() + name.slice(1)
              return <PrayerRow key={name} name={name} time={times?.[timeName] || null} log={summary?.[name] || null} isNext={nextPrayer?.name?.toLowerCase() === name} onLog={setLogModal} />
            })}
          </div>
        </Card>
        {times && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8, marginBottom: 16 }}>
            {[['🌄 Sunrise', times.Sunrise], ['🌞 Sunset', times.Sunset], ['🕛 Midnight', times.Midnight]].map(([l, t]) => (
              <div key={l} style={{ textAlign: 'center', borderRadius: 10, padding: '8px 4px', background: 'var(--t-bg-card)', border: '0.5px solid var(--t-border)', fontSize: 11, color: 'var(--t-text-muted)' }}>
                <p>{l}</p><p style={{ fontWeight: 600, color: 'var(--t-text)', marginTop: 2 }}>{t}</p>
              </div>
            ))}
          </div>
        )}
        {user?.prayer_method && <p style={{ textAlign: 'center', fontSize: 11, color: 'var(--t-text-muted)', marginBottom: 12 }}>{CALCULATION_METHODS[user.prayer_method]?.label || user.prayer_method} · Asr: {user.madhab === 'hanafi' ? 'Hanafi (later)' : 'Standard'}</p>}
        <p style={{ textAlign: 'center', fontSize: 11, color: 'var(--t-text-muted)', marginBottom: 16 }}>Also track: {['jumuah','tahajjud','duha'].map((p,i) => <React.Fragment key={p}>{i > 0 && ' · '}<button onClick={() => setLogModal(p)} style={{ color: 'var(--t-primary)', textTransform: 'capitalize' }}>{p}</button></React.Fragment>)}</p>
      </>}

      {tab === 'mosques' && <MosqueTab user={user} />}
      {tab === 'travel'  && <TravelTab user={user} />}
      {tab === 'stats'   && <StatisticsPanel />}

      <LogModal prayerName={logModal} onClose={() => setLogModal(null)} onSave={logPrayer} isPending={isPending} />
    </div>
  )
}
