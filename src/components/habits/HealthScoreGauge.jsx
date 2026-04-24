import React from 'react'

export function HealthScoreGauge({ score, label, size = 96 }) {
  const r = (size - 8) / 2
  const c = 2 * Math.PI * r
  const pct = Math.max(0, Math.min(100, score))
  const color = pct >= 75 ? 'var(--primary)' : pct >= 50 ? 'var(--gold)' : 'var(--muted-foreground)'
  return (
    <div className="relative inline-flex flex-col items-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--muted)" strokeWidth={6} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={6}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - pct / 100)}
          className="transition-all duration-700"
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center">
        <div className="text-center">
          <div className="text-xl font-bold tabular-nums leading-none">{Math.round(pct)}</div>
          {label && <div className="text-[9px] uppercase tracking-widest font-bold text-muted-foreground mt-0.5">{label}</div>}
        </div>
      </div>
    </div>
  )
}
