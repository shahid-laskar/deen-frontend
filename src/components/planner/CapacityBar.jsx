import React from 'react'
import { cn } from '@/lib/utils'
import { computeCapacity, fmtMinutes } from '@/lib/planner/capacity'
import { AlertTriangle } from 'lucide-react'

export function CapacityBar({ prayerTimes, todayTasks, bufferPerPrayer = 10, onDeferSuggestions }) {
  const cap = computeCapacity(prayerTimes, todayTasks, bufferPerPrayer)
  const pct = Math.min(100, cap.utilizationPercent)

  const barColor = cap.status === 'over'
    ? 'bg-red-500'
    : cap.status === 'warning'
    ? 'bg-amber-500'
    : 'bg-emerald-500'

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-[11px] text-muted-foreground font-medium">
        <span>
          {fmtMinutes(cap.availableMinutes)} available
          {' · '}
          {fmtMinutes(cap.plannedMinutes)} planned
          {cap.overMinutes > 0 && (
            <span className="text-red-500 ml-1 font-bold">
              (+{fmtMinutes(cap.overMinutes)} over)
            </span>
          )}
        </span>
        {cap.overMinutes > 0 && onDeferSuggestions && (
          <button
            onClick={onDeferSuggestions}
            className="flex items-center gap-1 text-red-500 hover:underline"
          >
            <AlertTriangle className="h-3 w-3" />Defer
          </button>
        )}
      </div>
      <div className="relative h-1.5 w-full rounded-full bg-muted overflow-hidden">
        <div
          className={cn('h-full rounded-full transition-all duration-500', barColor)}
          style={{ width: `${pct}%` }}
        />
        {/* 100% tick */}
        <div className="absolute right-0 top-0 h-full w-px bg-foreground/20" />
      </div>
    </div>
  )
}
