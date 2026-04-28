import React, { useState, useEffect } from 'react'
import { Link } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import api from '@/lib/api'
import { useAuthStore } from '@/store/authStore'
import { getIslamicContext } from '@/lib/hijri'
import { cn } from '@/lib/utils'
import { Icon } from '@/components/ui/icon'

/**
 * Contextual Top Bar — persistent across all hubs.
 * Per enhanced-ui spec §1.1:
 *   - Hijri date (left) — tap opens Hijri calendar
 *   - Next prayer + countdown (center) — tap opens prayer hub
 *   - Location chip (right) — tap opens location settings
 *
 * Hides on scroll-down, returns on scroll-up (mobile only).
 */

const PRAYER_NAMES = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha']

function parseTime(t) {
  if (!t) return null
  const [h, m] = t.split(':').map(Number)
  const d = new Date()
  d.setHours(h, m, 0, 0)
  return d
}

function findNextPrayer(times) {
  if (!times) return null
  const now = new Date()
  for (const name of PRAYER_NAMES) {
    const t = parseTime(times[name.toLowerCase()])
    if (t && t > now) return { name, time: times[name.toLowerCase()] }
  }
  return { name: 'Fajr', time: times?.fajr }
}

function formatCountdownShort(ms) {
  if (ms <= 0) return 'now'
  const h = Math.floor(ms / 3_600_000)
  const m = Math.floor((ms % 3_600_000) / 60_000)
  if (h > 0) return `${h}h ${m}m`
  return `${m}m`
}

export function ContextualTopBar({ className }) {
  const { user } = useAuthStore()
  const lat = user?.latitude
  const lng = user?.longitude
  const ctx = getIslamicContext()

  const [countdown, setCountdown] = useState('')
  const [nextPrayer, setNextPrayer] = useState(null)
  const [hidden, setHidden] = useState(false)
  const [lastScrollY, setLastScrollY] = useState(0)

  const { data: prayerTimes } = useQuery({
    queryKey: ['prayer', 'times'],
    queryFn: () => api.get('/prayer/times', lat && lng ? { params: { lat, lng } } : {}).then(r => r.data).catch(() => null),
    staleTime: 5 * 60_000,
  })

  // Update countdown every second
  useEffect(() => {
    const tick = () => {
      const np = findNextPrayer(prayerTimes)
      setNextPrayer(np)
      if (!np) return
      const target = parseTime(np.time)
      if (!target) return
      const now = new Date()
      if (target < now) target.setDate(target.getDate() + 1)
      setCountdown(formatCountdownShort(target - now))
    }
    tick()
    const id = setInterval(tick, 10_000)
    return () => clearInterval(id)
  }, [prayerTimes])

  // Hide on scroll-down, show on scroll-up (mobile only)
  useEffect(() => {
    const handleScroll = () => {
      const currentY = window.scrollY
      if (currentY > lastScrollY && currentY > 60) setHidden(true)
      else setHidden(false)
      setLastScrollY(currentY)
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [lastScrollY])

  const locationName = user?.city || user?.location_name || 'Set Location'

  return (
    <div className={cn(
      'flex items-center justify-between px-4 py-2 border-b border-border/50 bg-card/80 backdrop-blur-lg transition-transform duration-300 z-20',
      'md:px-6',
      hidden && 'md:translate-y-0 -translate-y-full',
      className
    )}>
      {/* Hijri date (left) */}
      <button className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors group">
        <Icon name="calendar" size={13} className="opacity-60 group-hover:opacity-100" />
        <span className="text-[11px] font-semibold tracking-wide">
          {ctx.formatted || 'Hijri Date'}
        </span>
      </button>

      {/* Next prayer countdown (center) */}
      <Link
        to="/worship/prayer"
        className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/8 hover:bg-primary/15 transition-colors group"
      >
        <div className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
        <span className="text-[11px] font-bold text-primary">
          {nextPrayer ? `${nextPrayer.name} in ${countdown}` : 'Prayer Times'}
        </span>
      </Link>

      {/* Location chip (right) */}
      <Link
        to="/me/settings"
        className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors group"
      >
        <Icon name="map-pin" size={12} className="opacity-60 group-hover:opacity-100" />
        <span className="text-[11px] font-semibold truncate max-w-20">
          {locationName}
        </span>
      </Link>
    </div>
  )
}
