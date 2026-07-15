import React, { useState, useEffect } from 'react'
import { Link } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import api from '@/lib/api'
import { useAuthStore } from '@/store/authStore'
import { getIslamicContext, HIJRI_MONTHS } from '@/lib/hijri'
import { cn } from '@/lib/utils'
import { Icon } from '@/components/ui/icon'
import { motion, AnimatePresence } from 'framer-motion'

/**
 * Contextual Top Bar — persists across all hubs.
 * - Hijri date & Gregorian (left)
 * - Next prayer + countdown (center) — prayer-specific icon + color
 * - Location chip (right)
 * Hides on scroll-down, returns on scroll-up (mobile only).
 */

const PRAYER_NAMES = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha']

// Prayer-specific icon names and color classes
const PRAYER_META = {
  Fajr:    { icon: 'star',    color: 'text-blue-400',   bg: 'bg-blue-500/10'   },
  Dhuhr:   { icon: 'sun',     color: 'text-amber-500',  bg: 'bg-amber-500/10'  },
  Asr:     { icon: 'cloud',   color: 'text-orange-400', bg: 'bg-orange-500/10' },
  Maghrib: { icon: 'sunset',  color: 'text-rose-400',   bg: 'bg-rose-500/10'   },
  Isha:    { icon: 'moon',    color: 'text-indigo-400', bg: 'bg-indigo-500/10' },
}

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

  // Update countdown every 10 seconds
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
  const gregorianDate = new Intl.DateTimeFormat('en-US', { day: 'numeric', month: 'short' }).format(new Date())
  const shortHijri = ctx.hijri ? `${ctx.hijri.day} ${HIJRI_MONTHS[ctx.hijri.month - 1]}` : ctx.formatted
  const prayerMeta = nextPrayer ? PRAYER_META[nextPrayer.name] : null

  return (
    <motion.div
      className={cn(
        'flex items-center justify-between px-4 py-2 border-b border-border/30 glass-strong z-20 gap-2',
        'md:px-6 md:py-2.5',
        className
      )}
      animate={{ y: hidden ? -48 : 0 }}
      transition={{ type: 'spring', stiffness: 400, damping: 35 }}
    >
      {/* Date (left) */}
      <Link
        to="/today/calendar"
        className="flex items-center gap-2 group shrink-0 hover:opacity-80 transition-opacity"
      >
        <Icon name="calendar" size={13} className="text-muted-foreground/50 group-hover:text-primary transition-colors hidden sm:block" />
        <div className="flex flex-col justify-center">
          <span className="text-[11px] font-bold text-gradient-primary leading-tight">
            {shortHijri}
          </span>
          <span className="text-[9px] font-medium text-muted-foreground/60 leading-tight">
            {gregorianDate}
          </span>
        </div>
      </Link>

      {/* Next prayer countdown (center) */}
      <Link
        to="/worship/prayer"
        className={cn(
          'flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-transparent transition-all group',
          prayerMeta ? `${prayerMeta.bg} hover:border-current/20` : 'bg-primary/8 hover:bg-primary/15'
        )}
      >
        {prayerMeta ? (
          <Icon name={prayerMeta.icon} size={11} className={cn(prayerMeta.color)} />
        ) : (
          <div className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
        )}
        <span className={cn('text-[11px] font-bold', prayerMeta ? prayerMeta.color : 'text-primary')}>
          {nextPrayer ? `${nextPrayer.name} in ${countdown}` : 'Prayer Times'}
        </span>
      </Link>

      <div className="flex items-center gap-3">
        {/* Notification Bell */}
        <Link to="/me/settings" className="relative text-muted-foreground hover:text-foreground transition-colors group">
          <Icon name="bell" size={15} className="opacity-55 group-hover:opacity-100" />
          <span className="absolute -top-0.5 -right-0.5 h-1.5 w-1.5 rounded-full bg-red-500 border border-card" />
        </Link>

        {/* Location chip (right) */}
        <Link
          to="/me/settings"
          className="hidden sm:flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors group"
        >
          <Icon name="map-pin" size={11} className="opacity-50 group-hover:opacity-100" />
          <span className="text-[10px] font-semibold truncate max-w-[80px]">
            {locationName}
          </span>
        </Link>
      </div>
    </motion.div>
  )
}
