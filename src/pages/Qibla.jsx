import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Compass, MapPin, Navigation, Phone, ExternalLink, AlertTriangle, Heart, RefreshCw } from 'lucide-react'
import api from '../lib/api'
import { useAuthStore } from '../store/authStore'
import { Card, Button, Skeleton, Badge, Toggle } from '../components/ui/index'
import { clsx } from 'clsx'

// ─── Great-circle bearing from (lat1,lng1) to (lat2,lng2) ────────────────────
function calcBearing(lat1, lng1, lat2, lng2) {
  const φ1 = (lat1 * Math.PI) / 180, φ2 = (lat2 * Math.PI) / 180
  const Δλ = ((lng2 - lng1) * Math.PI) / 180
  const y = Math.sin(Δλ) * Math.cos(φ2)
  const x = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ)
  return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360
}

// ─── Haversine distance in km ─────────────────────────────────────────────────
function calcDistKm(lat1, lng1, lat2, lng2) {
  const R = 6371
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLng = ((lng2 - lng1) * Math.PI) / 180
  const a = Math.sin(dLat / 2) ** 2 + Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

// Kaaba coordinates
const KAABA = { lat: 21.4225, lng: 39.8262 }

// ─── Compass rose SVG ────────────────────────────────────────────────────────
function CompassRose({ qiblaBearing, deviceHeading }) {
  // If we have device heading, rotate the whole rose so N points to actual North
  // and the qibla needle shows true direction
  const roseRotation = deviceHeading !== null ? -deviceHeading : 0
  const needleBearing = qiblaBearing ?? 0

  return (
    <div className="relative flex items-center justify-center select-none">
      <div
        className="relative rounded-full"
        style={{
          width: 220, height: 220,
          border: '2px solid var(--t-border)',
          background: 'var(--t-bg-card)',
          boxShadow: 'var(--shadow-2)',
        }}
      >
        {/* Rotating rose — only rotates when we have device heading */}
        <div style={{ position: 'absolute', inset: 0, transform: `rotate(${roseRotation}deg)`, transition: 'transform 0.3s ease' }}>
          {/* Cardinal labels */}
          {[['N', 0], ['E', 90], ['S', 180], ['W', 270]].map(([label, angle]) => {
            const rad = ((angle - 90) * Math.PI) / 180
            const r = 90
            return (
              <span key={label} style={{
                position: 'absolute', fontWeight: 700, fontSize: 13,
                color: label === 'N' ? 'var(--t-primary)' : 'var(--t-text-muted)',
                left: `calc(50% + ${r * Math.cos(rad)}px - 6px)`,
                top:  `calc(50% + ${r * Math.sin(rad)}px - 8px)`,
              }}>{label}</span>
            )
          })}
          {/* Degree tick marks */}
          {[...Array(72)].map((_, i) => {
            const angle = i * 5
            const rad = ((angle - 90) * Math.PI) / 180
            const isMajor = angle % 45 === 0
            const r1 = 74, r2 = isMajor ? 62 : 69
            return (
              <div key={i} style={{
                position: 'absolute',
                width: isMajor ? 1.5 : 0.5,
                height: `${r1 - r2}px`,
                background: `var(--t-border${isMajor ? '-strong' : ''})`,
                left: `calc(50% + ${r1 * Math.cos(rad)}px)`,
                top:  `calc(50% + ${r1 * Math.sin(rad)}px)`,
                transformOrigin: 'top center',
                transform: `rotate(${angle + 90}deg)`,
              }} />
            )
          })}
        </div>

        {/* Qibla needle — always points toward Mecca regardless of rose rotation */}
        <div style={{
          position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
          transform: `rotate(${needleBearing}deg)`, transition: 'transform 0.8s cubic-bezier(0.34,1.56,0.64,1)',
        }}>
          {/* Arrow shaft */}
          <div style={{ position: 'relative', height: 90, width: 4, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            {/* Kaaba icon at tip */}
            <div style={{ width: 22, height: 22, borderRadius: 4, background: 'var(--t-accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 2, flexShrink: 0 }}>
              <span style={{ fontSize: 13 }}>🕋</span>
            </div>
            {/* Gold shaft */}
            <div style={{ flex: 1, width: 3, background: 'var(--t-accent)', borderRadius: 2 }} />
          </div>
        </div>

        {/* Center dot */}
        <div style={{
          position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
          width: 14, height: 14, borderRadius: '50%', background: 'var(--t-accent)',
          border: '2px solid var(--t-bg-card)', zIndex: 10,
        }} />
      </div>
    </div>
  )
}

// ─── Mosque card ──────────────────────────────────────────────────────────────
function MosqueCard({ mosque, isFavourite, onToggleFav }) {
  const dist = mosque.distance_m >= 1000
    ? `${(mosque.distance_m / 1000).toFixed(1)} km`
    : `${mosque.distance_m} m`

  return (
    <Card className="p-4">
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
        <div style={{ width: 40, height: 40, borderRadius: 10, background: 'var(--t-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>🕌</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
            <p style={{ fontWeight: 500, fontSize: 14, color: 'var(--t-text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>{mosque.name}</p>
            <button onClick={() => onToggleFav(mosque)} style={{ color: isFavourite ? 'var(--t-accent)' : 'var(--t-text-muted)', background: 'none', border: 'none', cursor: 'pointer', flexShrink: 0 }}>
              <Heart size={15} fill={isFavourite ? 'currentColor' : 'none'} />
            </button>
          </div>
          {mosque.address && <p style={{ fontSize: 12, color: 'var(--t-text-muted)', marginBottom: 6 }}>{mosque.address}</p>}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 12, color: 'var(--t-text-muted)' }}>
            <span><MapPin size={10} style={{ display: 'inline', marginRight: 3 }} />{dist}</span>
            {mosque.phone && <a href={`tel:${mosque.phone}`} style={{ color: 'var(--t-primary)' }}><Phone size={10} style={{ display: 'inline', marginRight: 3 }} />{mosque.phone}</a>}
            {mosque.website && <a href={mosque.website} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--t-primary)' }}><ExternalLink size={10} style={{ display: 'inline', marginRight: 3 }} />Website</a>}
          </div>
        </div>
      </div>
    </Card>
  )
}

// ─── Main Qibla Page ──────────────────────────────────────────────────────────
export default function Qibla() {
  const { user, hasLocation } = useAuthStore()
  const [radius,         setRadius]         = useState(5000)
  const [deviceHeading,  setDeviceHeading]  = useState(null)
  const [compassActive,  setCompassActive]  = useState(false)
  const [calibWarning,   setCalibWarning]   = useState(false)
  const [favourites,     setFavourites]     = useState(() => {
    try { return JSON.parse(localStorage.getItem('deen-fav-mosques') || '[]') } catch { return [] }
  })

  const lat = user?.latitude
  const lng = user?.longitude
  const hasCoords = !!(lat && lng)

  // Computed values from user location
  const qiblaBearing = hasCoords ? calcBearing(lat, lng, KAABA.lat, KAABA.lng) : null
  const distKm       = hasCoords ? calcDistKm(lat, lng, KAABA.lat, KAABA.lng)  : null

  // Compass direction label
  const bearingLabel = (b) => {
    const dirs = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW']
    return dirs[Math.round(b / 45) % 8]
  }

  // ─── Device magnetometer ────────────────────────────────────────────────────
  const handleOrientation = useCallback((e) => {
    if (e.webkitCompassHeading !== undefined) {
      setDeviceHeading(e.webkitCompassHeading)   // iOS
    } else if (e.alpha !== null) {
      setDeviceHeading((360 - e.alpha) % 360)    // Android
    }
    // Calibration warning: iOS provides accuracy, warn if > 30°
    if (e.webkitCompassAccuracy > 30 || e.webkitCompassAccuracy < 0) {
      setCalibWarning(true)
    } else {
      setCalibWarning(false)
    }
  }, [])

  const toggleCompass = async () => {
    if (compassActive) {
      window.removeEventListener('deviceorientationabsolute', handleOrientation)
      window.removeEventListener('deviceorientation', handleOrientation)
      setCompassActive(false)
      setDeviceHeading(null)
      return
    }
    // iOS 13+ requires permission
    if (typeof DeviceOrientationEvent?.requestPermission === 'function') {
      try {
        const perm = await DeviceOrientationEvent.requestPermission()
        if (perm !== 'granted') return
      } catch { return }
    }
    window.addEventListener('deviceorientationabsolute', handleOrientation, true)
    window.addEventListener('deviceorientation', handleOrientation, true)
    setCompassActive(true)
  }

  useEffect(() => () => {
    window.removeEventListener('deviceorientationabsolute', handleOrientation)
    window.removeEventListener('deviceorientation', handleOrientation)
  }, [handleOrientation])

  // ─── Mosque data ────────────────────────────────────────────────────────────
  const { data: mosquesData, isLoading: mosquesLoading } = useQuery({
    queryKey: ['mosques', lat, lng, radius],
    queryFn: () => api.get('/qibla/mosques', { params: { lat, lng, radius_m: radius } }).then(r => r.data),
    enabled: hasCoords,
  })

  const toggleFav = (mosque) => {
    setFavourites(prev => {
      const next = prev.some(m => m.id === mosque.id)
        ? prev.filter(m => m.id !== mosque.id)
        : [...prev, mosque]
      localStorage.setItem('deen-fav-mosques', JSON.stringify(next))
      return next
    })
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-5">
      <h1 className="font-display text-2xl font-bold mb-1" style={{ color: 'var(--t-text)' }}>Qibla & Mosques</h1>
      <p style={{ fontSize: 13, color: 'var(--t-text-muted)', marginBottom: 20 }}>Direction toward the Kaaba in Makkah</p>

      {/* No location warning */}
      {!hasCoords && (
        <div style={{ borderRadius: 12, padding: '12px 16px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 10, background: 'rgba(201,135,10,0.1)', border: '1px solid var(--t-accent)' }}>
          <MapPin size={16} style={{ color: 'var(--t-accent)', flexShrink: 0 }} />
          <p style={{ fontSize: 13, color: 'var(--t-text)' }}>
            Set your location in <a href="/settings" style={{ color: 'var(--t-accent)' }}>Settings</a> to find your Qibla.
          </p>
        </div>
      )}

      {/* Compass section */}
      {hasCoords && (
        <Card className="mb-5 flex flex-col items-center py-6">
          {/* Calibration warning */}
          {calibWarning && compassActive && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', borderRadius: 8, background: 'rgba(239,68,68,0.1)', border: '1px solid #ef4444', marginBottom: 12, fontSize: 12, color: '#ef4444' }}>
              <AlertTriangle size={14} />
              Compass may be inaccurate. Move your device in a figure-8 to calibrate.
            </div>
          )}

          <CompassRose qiblaBearing={qiblaBearing} deviceHeading={compassActive ? deviceHeading : null} />

          <div style={{ textAlign: 'center', marginTop: 20 }}>
            <p style={{ fontFamily: 'var(--font-display)', fontSize: 32, fontWeight: 700, color: 'var(--t-text)', lineHeight: 1 }}>
              {qiblaBearing !== null ? `${Math.round(qiblaBearing)}°` : '—'}
            </p>
            <p style={{ fontSize: 16, color: 'var(--t-accent)', fontWeight: 600 }}>
              {qiblaBearing !== null ? bearingLabel(qiblaBearing) : ''}
            </p>
            <p style={{ fontSize: 13, color: 'var(--t-text-muted)', marginTop: 4 }}>
              {distKm !== null ? `${Math.round(distKm).toLocaleString()} km from the Kaaba` : ''}
            </p>
            {compassActive && deviceHeading !== null && (
              <p style={{ fontSize: 12, color: 'var(--t-primary)', marginTop: 4 }}>
                Live compass active · heading {Math.round(deviceHeading)}°
              </p>
            )}
          </div>

          <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
            <button
              onClick={toggleCompass}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '8px 16px', borderRadius: 10, fontSize: 13, fontWeight: 500,
                background: compassActive ? 'var(--t-primary)' : 'var(--t-bg)',
                color: compassActive ? 'white' : 'var(--t-text)',
                border: '1px solid var(--t-border)', cursor: 'pointer',
              }}
            >
              <Navigation size={14} />
              {compassActive ? 'Compass on' : 'Use live compass'}
            </button>
          </div>

          {/* Arabic bismillah */}
          <div style={{ fontFamily: 'Amiri, serif', fontSize: 18, color: 'var(--t-accent)', marginTop: 16, direction: 'rtl' }}>
            وَلِلَّهِ الْمَشْرِقُ وَالْمَغْرِبُ فَأَيْنَمَا تُوَلُّوا فَثَمَّ وَجْهُ اللَّهِ
          </div>
          <p style={{ fontSize: 11, color: 'var(--t-text-muted)', marginTop: 4 }}>"Wherever you turn, there is the Face of Allah." — 2:115</p>
        </Card>
      )}

      {/* Favourites */}
      {favourites.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          <h2 className="font-display font-semibold mb-3" style={{ color: 'var(--t-text)' }}>⭐ Favourite mosques</h2>
          <div className="space-y-2">
            {favourites.map(m => <MosqueCard key={m.id} mosque={m} isFavourite={true} onToggleFav={toggleFav} />)}
          </div>
        </div>
      )}

      {/* Mosque finder */}
      {hasCoords && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <h2 className="font-display font-semibold" style={{ color: 'var(--t-text)' }}>Nearby mosques</h2>
            <div style={{ display: 'flex', gap: 4 }}>
              {[2000, 5000, 10000].map(r => (
                <button key={r} onClick={() => setRadius(r)}
                  style={{ padding: '4px 10px', borderRadius: 8, fontSize: 11, fontWeight: 500, cursor: 'pointer', background: radius === r ? 'var(--t-primary)' : 'var(--t-bg-card)', color: radius === r ? 'white' : 'var(--t-text-muted)', border: `1px solid ${radius === r ? 'var(--t-primary)' : 'var(--t-border)'}` }}>
                  {r >= 1000 ? `${r / 1000}km` : `${r}m`}
                </button>
              ))}
            </div>
          </div>

          {mosquesLoading ? (
            <div className="space-y-3">{[...Array(4)].map((_, i) => <Skeleton key={i} className="h-20" />)}</div>
          ) : mosquesData?.mosques?.length === 0 ? (
            <Card className="text-center py-8">
              <p style={{ color: 'var(--t-text-muted)' }}>🕌 No mosques found within {radius / 1000}km.</p>
              <p style={{ fontSize: 12, color: 'var(--t-text-muted)', marginTop: 4 }}>Try a larger radius.</p>
            </Card>
          ) : (
            <div className="space-y-3">
              {mosquesData?.mosques?.map(m => (
                <MosqueCard
                  key={m.id}
                  mosque={m}
                  isFavourite={favourites.some(f => f.id === m.id)}
                  onToggleFav={toggleFav}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
