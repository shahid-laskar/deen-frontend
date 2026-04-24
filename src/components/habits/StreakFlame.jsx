import React from 'react'
import { Flame } from 'lucide-react'

export function StreakFlame({ streak }) {
  if (!streak) return null
  const hot = streak >= 7
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${
        hot ? 'bg-gold/20 text-gold-foreground shadow-glow-gold' : 'bg-muted/60 text-muted-foreground'
      }`}
    >
      <Flame className={`h-3 w-3 ${hot ? 'text-gold' : ''}`} strokeWidth={2.5} />
      {streak}
    </span>
  )
}
