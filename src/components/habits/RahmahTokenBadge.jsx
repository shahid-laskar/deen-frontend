import React from 'react'
import { Sparkle } from 'lucide-react'

export function RahmahTokenBadge({ tokens, max = 3 }) {
  return (
    <div className="inline-flex items-center gap-1.5 rounded-full bg-gold/15 px-3 py-1.5 text-xs font-bold text-gold-foreground">
      <Sparkle className="h-3.5 w-3.5 text-gold" strokeWidth={2.5} />
      <span className="tabular-nums">{tokens}/{max}</span>
      <span className="hidden sm:inline text-muted-foreground font-medium">Rahmah</span>
    </div>
  )
}
