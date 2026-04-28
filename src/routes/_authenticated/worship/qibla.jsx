import React, { useState, useEffect, useCallback } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { MapPin, Navigation, Phone, ExternalLink, AlertTriangle, Heart } from 'lucide-react'
import api from '@/lib/api'
import { useAuthStore } from '@/store/authStore'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

export const Route = createFileRoute('/_authenticated/worship/qibla')({
  component: QiblaPage,
})

const KAABA = { lat: 21.4225, lng: 39.8262 }

function calcBearing(lat1, lng1, lat2, lng2) {
  const φ1 = (lat1 * Math.PI) / 180, φ2 = (lat2 * Math.PI) / 180
  const Δλ = ((lng2 - lng1) * Math.PI) / 180
  const y = Math.sin(Δλ) * Math.cos(φ2)
  const x = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ)
  return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360
}

function calcDistKm(lat1, lng1, lat2, lng2) {
  const R = 6371
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLng = ((lng2 - lng1) * Math.PI) / 180
  const a = Math.sin(dLat / 2) ** 2 + Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

function CompassRose({ qiblaBearing, deviceHeading }) {
  const roseRotation = deviceHeading !== null ? -deviceHeading : 0
  const needleBearing = qiblaBearing ?? 0

  return (
    <div className="relative flex items-center justify-center select-none">
      <div className="relative rounded-full border-2 border-border bg-card shadow-sm" style={{ width: 220, height: 220 }}>
        <div className="absolute inset-0 transition-transform duration-300 ease-out" style={{ transform: `rotate(${roseRotation}deg)` }}>
          {[['N', 0], ['E', 90], ['S', 180], ['W', 270]].map(([label, angle]) => {
            const rad = ((angle - 90) * Math.PI) / 180
            const r = 90
            return (
              <span key={label} className={cn('absolute font-bold text-[13px]', label === 'N' ? 'text-primary' : 'text-muted-foreground')} style={{
                left: `calc(50% + ${r * Math.cos(rad)}px - 6px)`,
                top: `calc(50% + ${r * Math.sin(rad)}px - 8px)`,
              }}>{label}</span>
            )
          })}
          {[...Array(72)].map((_, i) => {
            const angle = i * 5
            const rad = ((angle - 90) * Math.PI) / 180
            const isMajor = angle % 45 === 0
            const r1 = 74, r2 = isMajor ? 62 : 69
            return (
              <div key={i} className={cn('absolute origin-top', isMajor ? 'w-[1.5px] bg-border-strong' : 'w-[0.5px] bg-border')} style={{
                height: `${r1 - r2}px`,
                left: `calc(50% + ${r1 * Math.cos(rad)}px)`,
                top: `calc(50% + ${r1 * Math.sin(rad)}px)`,
                transform: `rotate(${angle + 90}deg)`,
              }} />
            )
          })}
        </div>
        <div className="absolute inset-0 flex items-center justify-center transition-transform duration-[800ms] ease-[cubic-bezier(0.34,1.56,0.64,1)]" style={{ transform: `rotate(${needleBearing}deg)` }}>
          <div className="relative h-[90px] w-1 flex flex-col items-center">
            <div className="w-[22px] h-[22px] rounded bg-primary flex items-center justify-center mb-[2px] shrink-0 text-[13px]">🕋</div>
            <div className="flex-1 w-[3px] bg-primary rounded-[2px]" />
          </div>
        </div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded-full bg-primary border-2 border-card z-10" />
      </div>
    </div>
  )
}

function MosqueCard({ mosque, isFavourite, onToggleFav }) {
  const dist = mosque.distance_m >= 1000 ? `${(mosque.distance_m / 1000).toFixed(1)} km` : `${mosque.distance_m} m`
  return (
    <Card className="p-4">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center text-xl shrink-0">🕌</div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <p className="font-medium text-sm text-foreground truncate flex-1">{mosque.name}</p>
            <button onClick={() => onToggleFav(mosque)} className={cn('shrink-0 hover:scale-110 transition-transform', isFavourite ? 'text-primary' : 'text-muted-foreground')}>
              <Heart className="h-4 w-4" fill={isFavourite ? 'currentColor' : 'none'} />
            </button>
          </div>
          {mosque.address && <p className="text-xs text-muted-foreground mb-1.5">{mosque.address}</p>}
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{dist}</span>
            {mosque.phone && <a href={`tel:${mosque.phone}`} className="flex items-center gap-1 text-primary hover:underline"><Phone className="h-3 w-3" />{mosque.phone}</a>}
            {mosque.website && <a href={mosque.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-primary hover:underline"><ExternalLink className="h-3 w-3" />Website</a>}
          </div>
        </div>
      </div>
    </Card>
  )
}

function QiblaPage() {
  const { user, hasLocation } = useAuthStore()
  const [radius, setRadius] = useState(5000)
  const [deviceHeading, setDeviceHeading] = useState(null)
  const [compassActive, setCompassActive] = useState(false)
  const [calibWarning, setCalibWarning] = useState(false)
  const [favourites, setFavourites] = useState(() => { try { return JSON.parse(localStorage.getItem('deen-fav-mosques') || '[]') } catch { return [] } })

  const lat = user?.latitude
  const lng = user?.longitude
  const hasCoordsRaw = !!(lat && lng)
  const isMeccaDefault = lat === 21.4225 && lng === 39.8262
  const hasCoords = hasCoordsRaw && !isMeccaDefault

  const qiblaBearing = hasCoords ? calcBearing(lat, lng, KAABA.lat, KAABA.lng) : null
  const distKm = hasCoords ? calcDistKm(lat, lng, KAABA.lat, KAABA.lng) : null

  const bearingLabel = (b) => ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'][Math.round(b / 45) % 8]

  const handleOrientation = useCallback((e) => {
    if (e.webkitCompassHeading !== undefined) setDeviceHeading(e.webkitCompassHeading)
    else if (e.alpha !== null) setDeviceHeading((360 - e.alpha) % 360)
    setCalibWarning(e.webkitCompassAccuracy > 30 || e.webkitCompassAccuracy < 0)
  }, [])

  const toggleCompass = async () => {
    if (compassActive) {
      window.removeEventListener('deviceorientationabsolute', handleOrientation)
      window.removeEventListener('deviceorientation', handleOrientation)
      setCompassActive(false); setDeviceHeading(null)
      return
    }
    if (typeof DeviceOrientationEvent?.requestPermission === 'function') {
      try { const perm = await DeviceOrientationEvent.requestPermission(); if (perm !== 'granted') return }
      catch { return }
    }
    window.addEventListener('deviceorientationabsolute', handleOrientation, true)
    window.addEventListener('deviceorientation', handleOrientation, true)
    setCompassActive(true)
  }

  useEffect(() => () => {
    window.removeEventListener('deviceorientationabsolute', handleOrientation)
    window.removeEventListener('deviceorientation', handleOrientation)
  }, [handleOrientation])

  const { data: mosquesData, isLoading: mosquesLoading } = useQuery({
    queryKey: ['mosques', lat, lng, radius],
    queryFn: () => api.get('/qibla/mosques', { params: { lat, lng, radius_m: radius } }).then(r => r.data),
    enabled: hasCoords,
  })

  const toggleFav = (mosque) => {
    setFavourites(prev => {
      const next = prev.some(m => m.id === mosque.id) ? prev.filter(m => m.id !== mosque.id) : [...prev, mosque]
      localStorage.setItem('deen-fav-mosques', JSON.stringify(next))
      return next
    })
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-6 space-y-6">
      <div className="sticky top-0 z-20 bg-background/95 backdrop-blur-md -mx-4 px-4 py-2 border-b border-border/50">
        <h1 className="text-2xl font-bold text-foreground">Qibla & Mosques</h1>
        <p className="text-sm text-muted-foreground mt-1">Direction toward the Kaaba in Makkah</p>
      </div>

      {!hasCoords && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-gold/10 border border-gold/20 text-gold-foreground">
          <MapPin className="h-4 w-4 shrink-0" />
          <p className="text-sm">Set your location in <a href="/settings" className="font-medium hover:underline">Settings</a> to find your Qibla.</p>
        </div>
      )}

      {hasCoords && (
        <Card className="flex flex-col items-center py-8 px-4">
          {calibWarning && compassActive && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-xs mb-6 max-w-sm">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              Compass may be inaccurate. Move your device in a figure-8 to calibrate.
            </div>
          )}

          <CompassRose qiblaBearing={qiblaBearing} deviceHeading={compassActive ? deviceHeading : null} />

          <div className="text-center mt-8 space-y-1">
            <p className="text-4xl font-bold text-foreground">
              {qiblaBearing !== null ? `${Math.round(qiblaBearing)}°` : '—'}
            </p>
            <p className="text-lg font-medium text-primary">
              {qiblaBearing !== null ? bearingLabel(qiblaBearing) : ''}
            </p>
            <p className="text-sm text-muted-foreground pt-1">
              {distKm !== null ? `${Math.round(distKm).toLocaleString()} km from the Kaaba` : ''}
            </p>
            {compassActive && deviceHeading !== null && (
              <p className="text-xs text-primary pt-1 font-medium">Live compass active · heading {Math.round(deviceHeading)}°</p>
            )}
          </div>

          <Button onClick={toggleCompass} variant={compassActive ? 'default' : 'outline'} className="mt-6">
            <Navigation className="h-4 w-4 mr-2" />
            {compassActive ? 'Compass on' : 'Use live compass'}
          </Button>

          <div className="mt-8 text-center space-y-2">
            <p className="font-amiri text-xl text-primary" dir="rtl">وَلِلَّهِ الْمَشْرِقُ وَالْمَغْرِبُ فَأَيْنَمَا تُوَلُّوا فَثَمَّ وَجْهُ اللَّهِ</p>
            <p className="text-xs text-muted-foreground">"Wherever you turn, there is the Face of Allah." — 2:115</p>
          </div>
        </Card>
      )}

      {favourites.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-primary">⭐ Favourite mosques</h2>
          <div className="space-y-3">
            {favourites.map(m => <MosqueCard key={m.id} mosque={m} isFavourite={true} onToggleFav={toggleFav} />)}
          </div>
        </div>
      )}

      {hasCoords && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-primary">Nearby mosques</h2>
            <div className="flex gap-1 bg-muted p-1 rounded-lg">
              {[2000, 5000, 10000].map(r => (
                <button key={r} onClick={() => setRadius(r)}
                  className={cn('px-2.5 py-1 rounded-md text-xs font-medium transition-colors', radius === r ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground')}>
                  {r >= 1000 ? `${r / 1000}km` : `${r}m`}
                </button>
              ))}
            </div>
          </div>

          {mosquesLoading ? (
            <div className="space-y-3">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-24 w-full" />)}</div>
          ) : mosquesData?.mosques?.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed border-border rounded-xl">
              <span className="text-3xl mb-2 block">🕌</span>
              <p className="text-sm font-medium text-foreground">No mosques found within {radius / 1000}km.</p>
              <p className="text-xs text-muted-foreground mt-1">Try a larger radius.</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-border hover:scrollbar-thumb-muted-foreground/30 transition-colors">
              {mosquesData?.mosques?.map(m => (
                <MosqueCard key={m.id} mosque={m} isFavourite={favourites.some(f => f.id === m.id)} onToggleFav={toggleFav} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
