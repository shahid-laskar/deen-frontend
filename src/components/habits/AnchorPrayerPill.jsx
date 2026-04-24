import React from 'react'

export function AnchorPrayerPill({ prayer }) {
  if (!prayer) return null
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary">
      after {prayer}
    </span>
  )
}
