import React from 'react'
import { cn } from '@/lib/utils'

/**
 * SVG Circular Progress Ring — matches the enhanced dashboard PrayerHero ring.
 *
 * Props:
 *   value        {number}  0–100
 *   size         {number}  SVG diameter in px (default 80)
 *   strokeWidth  {number}  stroke width (default 6)
 *   className    {string}  extra classes applied to the outer svg
 *   trackClass   {string}  classes for the track circle (default text-primary/20)
 *   fillClass    {string}  classes for the fill arc (default text-primary)
 *   children     {node}    content rendered in the centre
 */
export function ProgressRing({
  value = 0,
  size = 80,
  strokeWidth = 6,
  className,
  trackClass = 'text-primary/20',
  fillClass = 'text-primary',
  children,
}) {
  const r = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * r
  const offset = circumference * (1 - Math.min(Math.max(value, 0), 100) / 100)

  return (
    <div className={cn('relative inline-flex items-center justify-center', className)}>
      <svg width={size} height={size} className="-rotate-90" aria-hidden="true">
        {/* Track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          strokeWidth={strokeWidth}
          className={cn('stroke-current', trackClass)}
        />
        {/* Fill arc */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className={cn('stroke-current transition-all duration-700', fillClass)}
        />
      </svg>
      {/* Centre content */}
      {children && (
        <div className="absolute inset-0 flex items-center justify-center">
          {children}
        </div>
      )}
    </div>
  )
}
