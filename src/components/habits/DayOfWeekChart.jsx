import React from 'react'

const DOW = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

export function DayOfWeekChart({ rates }) {
  const max = Math.max(1, ...rates)
  return (
    <div className="grid grid-cols-7 gap-2 items-end h-32">
      {DOW.map((d, i) => {
        const v = rates[i] ?? 0
        const h = (v / max) * 100
        return (
          <div key={d} className="flex flex-col items-center gap-1 h-full">
            <div className="flex-1 w-full flex items-end">
              <div
                className="w-full rounded-t-md bg-gradient-to-t from-primary to-primary/60 transition-all"
                style={{ height: `${h}%` }}
                title={`${Math.round(v * 100)}%`}
              />
            </div>
            <span className="text-[10px] font-bold text-muted-foreground">{d}</span>
          </div>
        )
      })}
    </div>
  )
}
