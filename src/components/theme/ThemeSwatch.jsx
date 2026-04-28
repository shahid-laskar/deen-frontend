import React, { memo } from 'react'
import { cn } from '@/lib/utils'

const ICON_PACK_LABELS = {
  'lucide': 'Lucide',
  'lucide-filled': 'Lucide Filled',
  'phosphor': 'Phosphor',
  'phosphor-duotone': 'Phosphor Duotone',
  'tabler': 'Tabler',
  'hugeicons': 'Hugeicons',
  'remix': 'Remix',
  'iconoir': 'Iconoir',
}

const MOTIF_GLYPHS = {
  'rub-el-hizb': '✦',
  'zellige': '⬡',
  'lattice': '⊞',
  'kufic': '⊓',
  'star-8': '✴',
  'arabesque': '❋',
  'quatrefoil': '❀',
  'hex': '⬢',
}

const TYPESET_LABELS = {
  classic: 'Classic Scholar',
  editorial: 'Editorial',
  royal: 'Royal',
  modern: 'Modern',
  geometric: 'Geometric',
  soft: 'Soft',
}

/**
 * ThemeSwatch — one card in the ThemeGallery grid.
 */
export const ThemeSwatch = memo(function ThemeSwatch({ theme, isActive, onSelect }) {
  const [s0, s1, s2, s3] = theme.swatches

  return (
    <button
      onClick={() => onSelect(theme.id)}
      className={cn(
        'group relative flex flex-col rounded-2xl border text-left overflow-hidden transition-all duration-200',
        'hover:-translate-y-1 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
        isActive
          ? 'border-primary shadow-md shadow-primary/20 ring-2 ring-primary'
          : 'border-border hover:border-primary/40'
      )}
    >
      {/* Mini hero preview */}
      <div
        className="relative h-20 w-full overflow-hidden"
        style={{ background: `linear-gradient(135deg, ${s0}, ${s2}, ${s3})` }}
      >
        {/* Subtle pattern overlay */}
        <svg className="absolute inset-0 w-full h-full opacity-[0.08]" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id={`swatch-pat-${theme.id}`} x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
              <circle cx="10" cy="10" r="3" fill="none" stroke="white" strokeWidth="0.5" />
              <line x1="0" y1="0" x2="20" y2="20" stroke="white" strokeWidth="0.3" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill={`url(#swatch-pat-${theme.id})`} />
        </svg>

        {/* Motif glyph badge */}
        <span
          className="absolute top-2 right-2 text-white/70 text-xl leading-none"
          title={theme.motif}
        >
          {MOTIF_GLYPHS[theme.motif] || '◆'}
        </span>

        {/* Active check */}
        {isActive && (
          <div className="absolute top-2 left-2 flex h-5 w-5 items-center justify-center rounded-full bg-white shadow-sm">
            <svg viewBox="0 0 12 12" className="h-3 w-3" fill="none">
              <path d="M2 6l3 3 5-5" stroke={s0} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        )}

        {/* Preferred mode badge */}
        {theme.preferredMode === 'dark' && (
          <div className="absolute bottom-2 left-2 rounded-full bg-black/40 px-1.5 py-0.5 text-[9px] font-semibold text-white/80 backdrop-blur-sm">
            Dark-first
          </div>
        )}
      </div>

      {/* Color dots row */}
      <div className="flex gap-1.5 px-3 pt-3">
        {theme.swatches.map((color, i) => (
          <div
            key={i}
            className="h-4 w-4 rounded-full ring-1 ring-border/30 transition-transform group-hover:scale-110"
            style={{ backgroundColor: color }}
            title={color}
          />
        ))}
      </div>

      {/* Info */}
      <div className="flex-1 space-y-1 px-3 pb-3 pt-2">
        <p className="text-sm font-semibold leading-tight text-foreground">{theme.name}</p>
        <p className="text-[10px] text-muted-foreground leading-snug line-clamp-2">{theme.tagline}</p>

        {/* Badges row */}
        <div className="flex flex-wrap gap-1 pt-1">
          <span className="inline-flex items-center rounded-full border border-border/60 bg-muted/60 px-1.5 py-0.5 text-[9px] font-medium text-muted-foreground">
            {ICON_PACK_LABELS[theme.icons] || theme.icons}
          </span>
          <span className="inline-flex items-center rounded-full border border-border/60 bg-muted/60 px-1.5 py-0.5 text-[9px] font-medium text-muted-foreground">
            {TYPESET_LABELS[theme.typeset] || theme.typeset}
          </span>
        </div>
      </div>
    </button>
  )
})
