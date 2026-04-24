import React, { useEffect, useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { Compass, MapPin, Navigation } from 'lucide-react'
import { qiblaApi } from '@/lib/api'

export const Route = createFileRoute('/_authenticated/qibla')({
  component: QiblaPage,
})

function QiblaPage() {
  const [coords, setCoords] = useState({})
  const [heading, setHeading] = useState(null)
  const [permissionAsked, setPermissionAsked] = useState(false)

  useEffect(() => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) return
    navigator.geolocation.getCurrentPosition(
      (p) => setCoords({ lat: p.coords.latitude, lng: p.coords.longitude }),
      () => {},
      { timeout: 8000 }
    )
  }, [])

  const direction = useQuery({
    queryKey: ['qibla', coords.lat, coords.lng],
    queryFn: () =>
      coords.lat && coords.lng
        ? qiblaApi.calc({ lat: coords.lat, lng: coords.lng }).catch(() => null)
        : qiblaApi.me().catch(() => null),
  })

  const mosques = useQuery({
    queryKey: ['qibla', 'mosques', coords.lat, coords.lng],
    queryFn: () =>
      coords.lat && coords.lng
        ? qiblaApi.mosquesNearby({ lat: coords.lat, lng: coords.lng, radius: 5000 }).catch(() => [])
        : Promise.resolve([]),
  })

  function enableCompass() {
    setPermissionAsked(true)
    const win = window
    const ev = win.DeviceOrientationEvent
    if (ev?.requestPermission) {
      ev.requestPermission()
        .then((res) => {
          if (res === 'granted') attachListener()
        })
        .catch(() => {})
    } else {
      attachListener()
    }
  }

  function attachListener() {
    const handler = (e) => {
      const alpha = e.alpha ?? 0
      setHeading(alpha)
    }
    window.addEventListener('deviceorientation', handler)
    return () => window.removeEventListener('deviceorientation', handler)
  }

  const dir = direction.data ?? null
  const qiblaBearing = dir?.direction ?? 0
  const compassRotation = heading != null ? -heading : 0
  const arrowRotation = qiblaBearing + (heading != null ? -heading : 0)
  const mosqueList = mosques.data ?? []

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 md:px-8 md:py-10 space-y-8">
      <div className="text-center animate-slide-up">
        <p className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground font-bold">
          Sacred Direction
        </p>
        <h1 className="font-amiri text-4xl md:text-5xl font-bold mt-2 text-gradient-primary">
          Qibla
        </h1>
        <p className="text-sm text-muted-foreground mt-2">
          Direction of the Kaaba in Makkah al-Mukarramah
        </p>
      </div>

      <div className="relative overflow-hidden rounded-3xl glass-card shadow-elevated p-8 md:p-12 animate-slide-up stagger-1">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-gold/10" />
        <div className="relative flex flex-col items-center">
          <div className="relative h-72 w-72 md:h-96 md:w-96">
            <svg
              viewBox="0 0 400 400"
              className="absolute inset-0 h-full w-full transition-transform duration-300"
              style={{ transform: `rotate(${compassRotation}deg)` }}
            >
              <circle
                cx="200"
                cy="200"
                r="190"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="text-border"
              />
              {[0, 90, 180, 270].map((deg, i) => (
                <text
                  key={deg}
                  x={200 + 165 * Math.sin((deg * Math.PI) / 180)}
                  y={200 - 165 * Math.cos((deg * Math.PI) / 180) + 5}
                  textAnchor="middle"
                  className="text-sm fill-foreground font-bold"
                >
                  {['N', 'E', 'S', 'W'][i]}
                </text>
              ))}
              <g transform={`rotate(${arrowRotation} 200 200)`}>
                <line
                  x1="200"
                  y1="200"
                  x2="200"
                  y2="60"
                  stroke="url(#qibla-grad)"
                  strokeWidth="4"
                  strokeLinecap="round"
                />
                <polygon
                  points="200,40 188,72 212,72"
                  fill="var(--color-primary)"
                  className="drop-shadow-md"
                />
              </g>
              <defs>
                <linearGradient id="qibla-grad" x1="0%" y1="100%" x2="0%" y2="0%">
                  <stop offset="0%" stopColor="var(--color-gold)" />
                  <stop offset="100%" stopColor="var(--color-primary)" />
                </linearGradient>
              </defs>
              <circle cx="200" cy="200" r="14" fill="var(--color-primary)" />
              <circle cx="200" cy="200" r="6" fill="var(--color-gold)" />
            </svg>
          </div>

          <div className="text-center mt-8">
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">
              Direction
            </p>
            <p className="text-5xl font-bold tabular-nums mt-2 text-gradient-primary">
              {Math.round(qiblaBearing)}°
            </p>
            {!permissionAsked && (
              <button
                onClick={enableCompass}
                className="mt-4 rounded-xl bg-primary text-primary-foreground px-4 py-2 text-sm font-bold shadow-glow-primary"
              >
                Enable live compass
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 animate-slide-up stagger-2">
        <div className="rounded-2xl glass-card shadow-soft p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <MapPin className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">
                Your Location
              </p>
              <p className="font-bold">
                {coords.lat
                  ? `${coords.lat.toFixed(2)}, ${coords.lng?.toFixed(2)}`
                  : 'Awaiting…'}
              </p>
            </div>
          </div>
        </div>
        <div className="rounded-2xl glass-card shadow-soft p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gold/10 text-gold-foreground">
              <Navigation className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">
                Distance
              </p>
              <p className="font-bold">
                {dir?.distance_km ? `${Math.round(dir.distance_km)} km` : '—'} to Kaaba
              </p>
            </div>
          </div>
        </div>
      </div>

      {mosqueList.length > 0 && (
        <div className="rounded-2xl glass-card shadow-soft p-6 animate-slide-up stagger-3">
          <h3 className="text-lg font-bold mb-4">Nearby mosques</h3>
          <ul className="space-y-2">
            {mosqueList.slice(0, 8).map((m) => (
              <li
                key={m.name}
                className="flex justify-between items-center rounded-xl px-3 py-2 hover:bg-muted/40"
              >
                <span className="text-sm font-medium">{m.name}</span>
                {m.distance != null && (
                  <span className="text-xs text-muted-foreground">
                    {Math.round(m.distance)}m
                  </span>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="rounded-2xl glass-card shadow-soft p-6 text-center animate-slide-up stagger-4">
        <Compass className="h-8 w-8 text-primary mx-auto" />
        <p className="text-sm text-muted-foreground mt-3 leading-relaxed">
          For best accuracy, hold your device flat and away from metal objects. Calibrate the
          compass by waving in a figure-8 motion.
        </p>
      </div>
    </div>
  )
}
