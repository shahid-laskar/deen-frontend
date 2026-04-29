import React, { useState, useEffect } from 'react'
import { Link } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import api from '@/lib/api'
import { useAuthStore } from '@/store/authStore'
import { getIslamicContext, HIJRI_MONTHS } from '@/lib/hijri'
import { cn } from '@/lib/utils'
import { Icon } from '@/components/ui/icon'

/**
 * Contextual Top Bar — persistent across all hubs.
 * Per enhanced-ui spec §1.1:
 *   - Hijri date & Gregorian Date (left)
 *   - Next prayer + countdown (center)
 *   - Location chip (right)
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
  
  const gregorianDate = new Intl.DateTimeFormat('en-US', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date())
  const shortHijri = ctx.hijri ? `${ctx.hijri.day} ${HIJRI_MONTHS[ctx.hijri.month - 1]}` : ctx.formatted

  return (
    <div className={cn(
      'flex items-center justify-between px-3 py-1.5 border-b border-border/50 bg-card/80 backdrop-blur-lg transition-transform duration-300 z-20 gap-2',
      'md:px-6 md:py-2',
      hidden && 'md:translate-y-0 -translate-y-full',
      className
    )}>
      {/* Date (left) */}
      <Link to="/today/calendar" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors group shrink-0">
        <Icon name="calendar" size={14} className="opacity-60 group-hover:opacity-100 shrink-0 hidden sm:block" />
        <div className="flex flex-col justify-center">
          <span className="text-[11px] font-bold text-foreground leading-tight tracking-tight">
            {shortHijri}
          </span>
          <span className="text-[9px] font-medium tracking-wide opacity-70 leading-tight">
            {gregorianDate}
          </span>
        </div>
      </Link>

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
