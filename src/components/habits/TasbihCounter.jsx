import React, { useState, useRef, useEffect } from 'react'
import { RotateCcw, Check } from 'lucide-react'

export function TasbihCounter({
  arabic,
  transliteration,
  meaning,
  target,
  onIncrement,
  onComplete,
}) {
  const [count, setCount] = useState(0)
  const completedRef = useRef(false)

  useEffect(() => {
    completedRef.current = false
    setCount(0)
  }, [arabic])

  useEffect(() => {
    if (count >= target && !completedRef.current) {
      completedRef.current = true
      onComplete?.()
      try {
        if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
          navigator.vibrate?.([20, 40, 20])
        }
      } catch {
        // ignore
      }
    }
  }, [count, target, onComplete])

  const progress = Math.min(100, (count / target) * 100)
  const r = 120
  const c = 2 * Math.PI * r

  function tap() {
    setCount((n) => {
      const next = n + 1
      onIncrement?.(next)
      try {
        if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
          navigator.vibrate?.(8)
        }
      } catch {
        // ignore
      }
      return next
    })
  }

  return (
    <div className="flex flex-col items-center gap-6 select-none">
      <div className="text-center">
        <p className="font-amiri text-5xl md:text-6xl font-bold leading-tight text-foreground">{arabic}</p>
        <p className="text-base font-bold mt-3 text-primary">{transliteration}</p>
        {meaning && <p className="text-xs text-muted-foreground mt-1">{meaning}</p>}
      </div>

      <button
        onClick={tap}
        className="group relative h-64 w-64 rounded-full bg-gradient-to-br from-primary to-warm text-primary-foreground shadow-glow-primary active:scale-[0.97] transition-transform duration-100"
      >
        <svg className="absolute inset-0 -rotate-90" viewBox="0 0 256 256">
          <circle cx="128" cy="128" r={r} fill="none" stroke="rgba(255,255,255,0.18)" strokeWidth="6" />
          <circle
            cx="128"
            cy="128"
            r={r}
            fill="none"
            stroke="var(--color-gold)"
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={c}
            strokeDashoffset={c * (1 - progress / 100)}
            className="transition-all duration-200"
          />
        </svg>
        <div className="relative h-full grid place-items-center">
          <div className="text-center">
            <div className="text-[10px] uppercase tracking-widest opacity-80 font-bold">Count</div>
            <div className="text-7xl font-bold tabular-nums leading-none mt-1">{count}</div>
            <div className="text-xs opacity-80 mt-1">of {target}</div>
            {count >= target && (
              <div className="mt-2 inline-flex items-center gap-1 text-xs font-bold">
                <Check className="h-3.5 w-3.5" /> Complete
              </div>
            )}
          </div>
        </div>
      </button>

      <button
        onClick={() => {
          setCount(0)
          completedRef.current = false
        }}
        className="flex items-center gap-2 rounded-2xl glass-card px-4 py-2 text-sm font-bold shadow-soft hover:shadow-elevated transition-all"
      >
        <RotateCcw className="h-3.5 w-3.5" />
        Reset
      </button>
    </div>
  )
}
