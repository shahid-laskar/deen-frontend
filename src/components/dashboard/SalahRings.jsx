import React from 'react'
import { cn } from '@/lib/utils'

/**
 * Salah Rings — 5 concentric/separate prayer rings.
 * Per enhanced-ui spec §1.2:
 *   - 5 small rings (Fajr→Isha)
 *   - Filled = prayed on time, half = qaza, empty = missed/upcoming
 *   - Distinct prayer hues
 *   - Center number: prayed count / 5
 *   - 300ms ease-out fill animation
 */

const PRAYERS = [
  { name: 'Fajr',    arabic: 'الفجر',   hue: 'var(--prayer-fajr,    220 60% 55%)' },
  { name: 'Dhuhr',   arabic: 'الظهر',   hue: 'var(--prayer-dhuhr,   42 85% 55%)' },
  { name: 'Asr',     arabic: 'العصر',   hue: 'var(--prayer-asr,     28 75% 55%)' },
  { name: 'Maghrib', arabic: 'المغرب',  hue: 'var(--prayer-maghrib, 12 70% 50%)' },
  { name: 'Isha',    arabic: 'العشاء',  hue: 'var(--prayer-isha,    250 50% 45%)' },
]

const PRAYER_COLORS = [
  '#4A90D9', // Fajr - blue
  '#D4A843', // Dhuhr - golden
  '#D48043', // Asr - orange
  '#D44A3E', // Maghrib - red-orange
  '#7B5FBF', // Isha - purple
]

function SingleRing({ name, arabic, color, status, index, size = 52 }) {
  const radius = (size - 8) / 2
  const circumference = 2 * Math.PI * radius
  const center = size / 2

  // status: 'on_time' | 'late' | 'qadha' | 'missed' | 'upcoming' | null
  const fillPercent = status === 'on_time' ? 100
    : status === 'late' ? 100
    : status === 'qadha' ? 50
    : 0

  const strokeOffset = circumference - (fillPercent / 100) * circumference

  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          {/* Background track */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth="3.5"
            className="text-border"
          />
          {/* Progress arc */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth="4"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeOffset}
            className="transition-all duration-500 ease-out"
            style={{
              filter: fillPercent > 0 ? `drop-shadow(0 0 4px ${color}40)` : 'none',
            }}
          />
        </svg>
        {/* Status indicator */}
        <div className="absolute inset-0 flex items-center justify-center">
          {status === 'on_time' ? (
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M3 7L6 10L11 4" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          ) : status === 'qadha' || status === 'late' ? (
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color, opacity: 0.6 }} />
          ) : (
            <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground/20" />
          )}
        </div>
      </div>
      <div className="text-center">
        <p className="text-[9px] font-bold uppercase tracking-tight text-muted-foreground leading-none">
          {name}
        </p>
      </div>
    </div>
  )
}

export function SalahRings({ summary, className }) {
  // Count logged prayers
  const logged = PRAYERS.reduce((acc, p) => {
    const key = p.name.toLowerCase()
    const status = summary?.[key]?.status
    if (status === 'on_time' || status === 'late' || status === 'qadha') return acc + 1
    return acc
  }, 0)

  return (
    <div className={cn(
      'rounded-2xl border border-border bg-card p-5 space-y-4',
      className
    )}>
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
            Salah Progress
          </h3>
          <p className="text-xs text-muted-foreground/70 mt-0.5">Today's prayers</p>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-2xl font-black text-foreground tabular-nums">{logged}</span>
          <span className="text-sm text-muted-foreground font-medium">/ 5</span>
        </div>
      </div>

      {/* 5 prayer rings */}
      <div className="flex items-center justify-between px-2">
        {PRAYERS.map((prayer, i) => (
          <SingleRing
            key={prayer.name}
            name={prayer.name}
            arabic={prayer.arabic}
            color={PRAYER_COLORS[i]}
            status={summary?.[prayer.name.toLowerCase()]?.status}
            index={i}
          />
        ))}
      </div>

      {/* Overall progress bar */}
      <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700 ease-out"
          style={{
            width: `${(logged / 5) * 100}%`,
            background: `linear-gradient(90deg, ${PRAYER_COLORS[0]}, ${PRAYER_COLORS[2]}, ${PRAYER_COLORS[4]})`,
          }}
        />
      </div>
    </div>
  )
}
