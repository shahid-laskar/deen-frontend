import * as React from 'react'
import { cn } from '@/lib/utils'

/**
 * Enhanced Skeleton primitive with multiple variants.
 * Uses shimmer animation matching final layout geometry.
 * Replaces all <Spinner /> usage per enhanced-ui spec §1.3.
 */
const Skeleton = ({ className, variant = 'default', ...props }) => {
  const variantClasses = {
    default: 'h-4 w-full rounded-md',
    card: 'h-40 w-full rounded-2xl',
    hero: 'h-48 w-full rounded-2xl',
    avatar: 'h-10 w-10 rounded-full shrink-0',
    line: 'h-3 w-3/4 rounded-md',
    'line-short': 'h-3 w-1/2 rounded-md',
    button: 'h-10 w-24 rounded-lg',
    ring: 'h-36 w-36 rounded-full',
    icon: 'h-6 w-6 rounded-md',
  }

  return (
    <div
      className={cn(
        'skeleton bg-muted/40',
        variantClasses[variant] || variantClasses.default,
        className
      )}
      {...props}
    />
  )
}
Skeleton.displayName = 'Skeleton'

/** Pre-composed skeleton layouts */

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton variant="line" className="w-40" />
        <Skeleton variant="default" className="h-8 w-64" />
        <Skeleton variant="line-short" className="w-48" />
      </div>
      <Skeleton variant="hero" />
      <div className="flex gap-3">
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} variant="icon" className="h-11 w-11 rounded-xl" />
        ))}
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        <Skeleton variant="card" />
        <Skeleton variant="card" />
      </div>
    </div>
  )
}

function CardSkeleton({ lines = 3 }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-6 space-y-3">
      <Skeleton variant="line" className="w-32" />
      {[...Array(lines)].map((_, i) => (
        <Skeleton key={i} variant="line" className={i === lines - 1 ? 'w-1/2' : 'w-full'} />
      ))}
    </div>
  )
}

function PrayerHeroSkeleton() {
  return (
    <div className="relative overflow-hidden rounded-2xl bg-muted/30 p-6 h-48">
      <div className="flex items-center gap-8">
        <Skeleton variant="ring" />
        <div className="flex-1 space-y-3">
          <Skeleton variant="line" className="w-24" />
          <Skeleton variant="default" className="h-10 w-32" />
          <Skeleton variant="default" className="h-8 w-48" />
          <Skeleton variant="line" className="w-36" />
        </div>
      </div>
    </div>
  )
}

export { Skeleton, DashboardSkeleton, CardSkeleton, PrayerHeroSkeleton }
