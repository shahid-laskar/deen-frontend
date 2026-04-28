import React from 'react'
import { useTheme } from '@/lib/theme-context'

// ─── SVG pattern definitions (8 motifs) ──────────────────────────────────────

function RubElHizb({ stroke, opacity }) {
  return (
    <pattern id="motif-rub-el-hizb" x="0" y="0" width="60" height="60" patternUnits="userSpaceOnUse">
      <g fill="none" stroke={stroke} strokeWidth="0.6" opacity={opacity}>
        <rect x="15" y="15" width="30" height="30" transform="rotate(45 30 30)" />
        <rect x="12" y="12" width="36" height="36" />
        <circle cx="30" cy="30" r="6" fill={stroke} fillOpacity="0.3" strokeWidth="0" />
        <circle cx="12" cy="12" r="2" fill={stroke} fillOpacity="0.4" strokeWidth="0" />
        <circle cx="48" cy="12" r="2" fill={stroke} fillOpacity="0.4" strokeWidth="0" />
        <circle cx="12" cy="48" r="2" fill={stroke} fillOpacity="0.4" strokeWidth="0" />
        <circle cx="48" cy="48" r="2" fill={stroke} fillOpacity="0.4" strokeWidth="0" />
      </g>
    </pattern>
  )
}

function Zellige({ stroke, opacity }) {
  return (
    <pattern id="motif-zellige" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
      <g fill="none" stroke={stroke} strokeWidth="0.5" opacity={opacity}>
        <polygon points="20,2 38,11 38,29 20,38 2,29 2,11" />
        <polygon points="20,8 32,14 32,26 20,32 8,26 8,14" />
        <circle cx="20" cy="20" r="4" fill={stroke} fillOpacity="0.25" strokeWidth="0" />
        <line x1="2" y1="11" x2="8" y2="14" /><line x1="38" y1="11" x2="32" y2="14" />
        <line x1="2" y1="29" x2="8" y2="26" /><line x1="38" y1="29" x2="32" y2="26" />
      </g>
    </pattern>
  )
}

function Lattice({ stroke, opacity }) {
  return (
    <pattern id="motif-lattice" x="0" y="0" width="32" height="32" patternUnits="userSpaceOnUse">
      <g fill="none" stroke={stroke} strokeWidth="0.5" opacity={opacity}>
        <line x1="0" y1="0" x2="32" y2="32" />
        <line x1="32" y1="0" x2="0" y2="32" />
        <line x1="16" y1="0" x2="16" y2="32" />
        <line x1="0" y1="16" x2="32" y2="16" />
        <circle cx="0" cy="0" r="1.5" fill={stroke} fillOpacity="0.4" strokeWidth="0" />
        <circle cx="32" cy="0" r="1.5" fill={stroke} fillOpacity="0.4" strokeWidth="0" />
        <circle cx="16" cy="16" r="2" fill={stroke} fillOpacity="0.3" strokeWidth="0" />
        <circle cx="0" cy="32" r="1.5" fill={stroke} fillOpacity="0.4" strokeWidth="0" />
        <circle cx="32" cy="32" r="1.5" fill={stroke} fillOpacity="0.4" strokeWidth="0" />
      </g>
    </pattern>
  )
}

function Kufic({ stroke, opacity }) {
  return (
    <pattern id="motif-kufic" x="0" y="0" width="48" height="48" patternUnits="userSpaceOnUse">
      <g fill="none" stroke={stroke} strokeWidth="0.7" opacity={opacity} strokeLinejoin="round">
        <polyline points="4,4 4,20 20,20 20,4 36,4 36,20 44,20 44,44 28,44 28,28 12,28 12,44 4,44" />
        <line x1="4" y1="12" x2="12" y2="12" />
        <line x1="36" y1="12" x2="44" y2="12" />
        <line x1="20" y1="36" x2="28" y2="36" />
      </g>
    </pattern>
  )
}

function Star8({ stroke, opacity }) {
  return (
    <pattern id="motif-star-8" x="0" y="0" width="56" height="56" patternUnits="userSpaceOnUse">
      <g fill="none" stroke={stroke} strokeWidth="0.55" opacity={opacity}>
        {/* 8-pointed star */}
        <polygon points="28,4 32,20 46,10 36,24 52,28 36,32 46,46 32,36 28,52 24,36 10,46 20,32 4,28 20,24 10,10 24,20" />
        <circle cx="28" cy="28" r="5" fill={stroke} fillOpacity="0.2" strokeWidth="0" />
        <circle cx="28" cy="28" r="9" />
      </g>
    </pattern>
  )
}

function Arabesque({ stroke, opacity }) {
  return (
    <pattern id="motif-arabesque" x="0" y="0" width="50" height="50" patternUnits="userSpaceOnUse">
      <g fill="none" stroke={stroke} strokeWidth="0.5" opacity={opacity}>
        <path d="M25,5 C35,5 45,15 45,25 C45,35 35,45 25,45 C15,45 5,35 5,25 C5,15 15,5 25,5Z" />
        <path d="M25,10 C20,10 15,20 25,25 C35,20 30,10 25,10Z" />
        <path d="M25,40 C30,40 35,30 25,25 C15,30 20,40 25,40Z" />
        <path d="M10,25 C10,20 20,15 25,25 C20,35 10,30 10,25Z" />
        <path d="M40,25 C40,30 30,35 25,25 C30,15 40,20 40,25Z" />
        <circle cx="25" cy="25" r="3" fill={stroke} fillOpacity="0.3" strokeWidth="0" />
      </g>
    </pattern>
  )
}

function Quatrefoil({ stroke, opacity }) {
  return (
    <pattern id="motif-quatrefoil" x="0" y="0" width="44" height="44" patternUnits="userSpaceOnUse">
      <g fill="none" stroke={stroke} strokeWidth="0.55" opacity={opacity}>
        <circle cx="22" cy="11" r="9" />
        <circle cx="33" cy="22" r="9" />
        <circle cx="22" cy="33" r="9" />
        <circle cx="11" cy="22" r="9" />
        <circle cx="22" cy="22" r="4" fill={stroke} fillOpacity="0.2" strokeWidth="0" />
      </g>
    </pattern>
  )
}

function Hex({ stroke, opacity }) {
  return (
    <pattern id="motif-hex" x="0" y="0" width="36" height="41.5" patternUnits="userSpaceOnUse">
      <g fill="none" stroke={stroke} strokeWidth="0.5" opacity={opacity}>
        <polygon points="18,1 33,9.75 33,27.25 18,36 3,27.25 3,9.75" />
        <polygon points="18,8 27,13 27,23 18,28 9,23 9,13" />
        <circle cx="18" cy="20.5" r="2.5" fill={stroke} fillOpacity="0.25" strokeWidth="0" />
      </g>
      {/* offset row */}
      <g fill="none" stroke={stroke} strokeWidth="0.5" opacity={opacity} transform="translate(18,20.75)">
        <polygon points="18,1 33,9.75 33,27.25 18,36 3,27.25 3,9.75" />
      </g>
    </pattern>
  )
}

const MOTIF_COMPONENTS = {
  'rub-el-hizb': RubElHizb,
  zellige: Zellige,
  lattice: Lattice,
  kufic: Kufic,
  'star-8': Star8,
  arabesque: Arabesque,
  quatrefoil: Quatrefoil,
  hex: Hex,
}

/**
 * <Pattern /> — renders the active theme's geometric motif as an SVG overlay.
 *
 * @param {string} [motifOverride] - use a specific motif instead of theme's
 * @param {string} [className]
 * @param {number} [opacity=0.045]
 * @param {string} [color="currentColor"]
 */
export function Pattern({ motifOverride, className = '', opacity = 0.045, color = 'currentColor' }) {
  let motif = motifOverride
  try {
    const ctx = useTheme()
    if (!motif) motif = ctx.motif
  } catch {
    if (!motif) motif = 'rub-el-hizb'
  }

  const MotifDef = MOTIF_COMPONENTS[motif] || MOTIF_COMPONENTS['rub-el-hizb']
  const patternId = `motif-${motif}`

  return (
    <svg
      className={`absolute inset-0 w-full h-full pointer-events-none ${className}`}
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <defs>
        <MotifDef stroke={color} opacity={opacity} />
      </defs>
      <rect width="100%" height="100%" fill={`url(#${patternId})`} />
    </svg>
  )
}
