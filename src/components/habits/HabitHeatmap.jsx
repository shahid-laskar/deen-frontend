import React, { useMemo } from 'react'

export function HabitHeatmap({ data }) {
  const grid = useMemo(() => {
    const today = new Date()
    const days = []
    for (let i = 364; i >= 0; i--) {
      const d = new Date(today)
      d.setDate(d.getDate() - i)
      const iso = d.toISOString().slice(0, 10)
      const found = data.find((x) => x.date === iso)
      days.push({ date: iso, count: found?.count ?? 0 })
    }
    return days
  }, [data])

  const max = Math.max(1, ...grid.map((g) => g.count))

  function shade(c) {
    if (!c) return 'bg-muted/30'
    const r = c / max
    if (r > 0.75) return 'bg-primary'
    if (r > 0.5) return 'bg-primary/70'
    if (r > 0.25) return 'bg-primary/50'
    return 'bg-primary/30'
  }

  return (
    <div className="overflow-x-auto">
      <div className="grid grid-rows-7 grid-flow-col gap-[3px]" style={{ gridAutoColumns: '11px' }}>
        {grid.map((d) => (
          <div
            key={d.date}
            title={`${d.date} · ${d.count}`}
            className={`h-[11px] w-[11px] rounded-[2px] ${shade(d.count)}`}
          />
        ))}
      </div>
    </div>
  )
}
