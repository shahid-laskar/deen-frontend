import React, { useState, useEffect, useRef } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Compass, MapPin, Navigation, Phone, Clock, ExternalLink } from 'lucide-react'
import api from '../lib/api'
import { useAuthStore } from '../store/authStore'
import { Card, Button, Skeleton, Badge } from '../components/ui/index'
import { clsx } from 'clsx'

function CompassNeedle({ bearing }) {
  return (
    <div className="relative flex items-center justify-center">
      <div className="w-52 h-52 rounded-full border-4 border-emerald-800/30 dark:border-emerald-700/40 relative flex items-center justify-center bg-parchment-50 dark:bg-emerald-950/50">
        {/* Cardinal points */}
        {['N', 'E', 'S', 'W'].map((d, i) => {
          const angle = i * 90
          const rad = (angle - 90) * (Math.PI / 180)
          const r = 88
          return (
            <span key={d} className="absolute text-xs font-bold text-emerald-700 dark:text-emerald-500"
              style={{ left: `calc(50% + ${r * Math.cos(rad)}px - 6px)`, top: `calc(50% + ${r * Math.sin(rad)}px - 8px)` }}>
              {d}
            </span>
          )
        })}
        {/* Degree ticks */}
        {[...Array(36)].map((_, i) => {
          const angle = i * 10
          const rad = (angle - 90) * (Math.PI / 180)
          const isMajor = angle % 90 === 0
          const r1 = 72, r2 = isMajor ? 62 : 68
          return (
            <div key={i} className={clsx('absolute w-px bg-emerald-400/30 origin-bottom', isMajor ? 'h-3' : 'h-1.5')}
              style={{
                left: `calc(50% + ${r1 * Math.cos(rad)}px)`,
                top: `calc(50% + ${r1 * Math.sin(rad)}px)`,
                transform: `rotate(${angle}deg)`,
              }} />
          )
        })}
        {/* Qibla arrow */}
        <div className="absolute inset-0 flex items-center justify-center"
          style={{ transform: `rotate(${bearing}deg)`, transition: 'transform 1s ease' }}>
          <div className="w-1 bg-gradient-to-t from-transparent via-gold-500 to-gold-500 rounded-full"
            style={{ height: '80px', marginBottom: '0px' }} />
        </div>
        {/* Center dot */}
        <div className="absolute w-4 h-4 bg-emerald-700 rounded-full z-10 flex items-center justify-center">
          <div className="w-2 h-2 bg-gold-400 rounded-full" />
        </div>
      </div>
    </div>
  )
}

function MosqueCard({ mosque }) {
  const dist = mosque.distance_m >= 1000
    ? `${(mosque.distance_m / 1000).toFixed(1)} km`
    : `${mosque.distance_m} m`

  return (
    <Card className="p-4">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-900/40 rounded-xl flex items-center justify-center text-xl flex-shrink-0">🕌</div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="font-medium text-emerald-900 dark:text-emerald-200 truncate">{mosque.name}</p>
            {mosque.female_prayer_room && <Badge variant="green" className="text-xs flex-shrink-0">Sisters' area</Badge>}
          </div>
          {mosque.arabic_name && <p className="font-arabic text-sm text-emerald-700 dark:text-emerald-400 text-right">{mosque.arabic_name}</p>}
          {mosque.address && <p className="text-xs text-muted truncate mt-0.5">{mosque.address}</p>}
          <div className="flex items-center gap-3 mt-1.5">
            <span className="text-xs text-emerald-600 flex items-center gap-1"><MapPin size={10} />{dist}</span>
            {mosque.phone && <a href={`tel:${mosque.phone}`} className="text-xs text-blue-600 flex items-center gap-1"><Phone size={10} />{mosque.phone}</a>}
            {mosque.website && <a href={mosque.website} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 flex items-center gap-1"><ExternalLink size={10} />Website</a>}
          </div>
        </div>
      </div>
    </Card>
  )
}

export default function Qibla() {
  const { user, hasLocation } = useAuthStore()
  const [manualLat, setManualLat] = useState('')
  const [manualLng, setManualLng] = useState('')
  const [useManual, setUseManual] = useState(false)
  const [radius, setRadius] = useState(5000)

  const lat = useManual ? parseFloat(manualLat) : user?.latitude
  const lng = useManual ? parseFloat(manualLng) : user?.longitude
  const hasCoords = lat && lng && !isNaN(lat) && !isNaN(lng)

  const { data: qibla, isLoading: qiblaLoading } = useQuery({
    queryKey: ['qibla', lat, lng],
    queryFn: () => api.get('/qibla', { params: { lat, lng } }).then(r => r.data),
    enabled: !!hasCoords,
  })

  const { data: mosques, isLoading: mosquesLoading } = useQuery({
    queryKey: ['mosques', lat, lng, radius],
    queryFn: () => api.get('/qibla/mosques', { params: { lat, lng, radius_m: radius } }).then(r => r.data),
    enabled: !!hasCoords,
  })

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="page-title mb-2">Qibla & Mosques</h1>
      <p className="text-muted mb-6">Direction toward the Kaaba in Mecca</p>

      {/* Location source */}
      {!hasLocation() && !useManual && (
        <Card className="mb-5 border-gold-300 bg-gold-50 dark:bg-gold-900/10 p-4">
          <div className="flex items-start gap-3">
            <MapPin size={18} className="text-gold-600 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-gold-800 dark:text-gold-300">Location not set in profile</p>
              <p className="text-xs text-gold-600 dark:text-gold-500 mt-1">Enter coordinates manually or update your profile.</p>
              <div className="flex gap-2 mt-3">
                <input className="input text-sm py-2 w-28" placeholder="Latitude" value={manualLat} onChange={e => setManualLat(e.target.value)} />
                <input className="input text-sm py-2 w-28" placeholder="Longitude" value={manualLng} onChange={e => setManualLng(e.target.value)} />
                <Button variant="secondary" size="sm" onClick={() => setUseManual(true)}>Find Qibla</Button>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Compass */}
      {hasCoords && (
        <div className="flex flex-col items-center mb-8">
          {qiblaLoading ? <Skeleton className="w-52 h-52 rounded-full" /> : qibla ? (
            <>
              <CompassNeedle bearing={qibla.qibla_bearing} />
              <div className="mt-5 text-center">
                <p className="font-display text-3xl font-bold text-emerald-900 dark:text-emerald-100">
                  {qibla.qibla_bearing}°
                </p>
                <p className="text-emerald-600 dark:text-emerald-400 text-lg font-medium">{qibla.compass_direction}</p>
                <p className="text-muted text-sm mt-1">
                  {qibla.distance_to_kaaba_km.toLocaleString()} km from Mecca
                </p>
                <div className="mt-3 font-arabic text-2xl text-emerald-800 dark:text-emerald-200">
                  بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
                </div>
              </div>
            </>
          ) : null}
        </div>
      )}

      {/* Mosque finder */}
      {hasCoords && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="section-title">Nearby Mosques</h2>
            <div className="flex gap-2">
              {[2000, 5000, 10000].map(r => (
                <button key={r} onClick={() => setRadius(r)}
                  className={clsx('px-3 py-1.5 rounded-lg text-xs font-medium border transition-all',
                    radius === r ? 'bg-emerald-800 text-white border-emerald-800' : 'border-parchment-300 dark:border-emerald-800 text-parchment-600 dark:text-emerald-500')}>
                  {r >= 1000 ? `${r / 1000}km` : `${r}m`}
                </button>
              ))}
            </div>
          </div>

          {mosquesLoading ? <div className="space-y-3">{[...Array(4)].map((_, i) => <Skeleton key={i} className="h-20" />)}</div>
            : mosques?.mosques?.length === 0 ? (
              <Card className="text-center py-8 text-muted">
                <p>🕌 No mosques found within {radius / 1000}km.</p>
                <p className="text-xs mt-1">Try increasing the radius.</p>
              </Card>
            ) : (
              <div className="space-y-3">
                {mosques?.mosques?.map(m => <MosqueCard key={m.id} mosque={m} />)}
              </div>
            )}
        </div>
      )}
    </div>
  )
}
