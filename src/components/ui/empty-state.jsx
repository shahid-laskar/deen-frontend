import React from 'react'
import { Link } from '@tanstack/react-router'
import { cn } from '@/lib/utils'
import { Icon } from '@/components/ui/icon'

/**
 * Reusable illustrated empty state for every list page.
 * Per enhanced-ui spec §1.3:
 *   1. Illustration (SVG, monochrome emerald, ~160px)
 *   2. Headline (text-h3)
 *   3. Subline (text-body, muted)
 *   4. Single primary CTA
 */

// ─── Islamic geometric SVG illustrations ──────────────────────────────────────
const illustrations = {
  mosque: (
    <svg viewBox="0 0 160 160" fill="none" className="w-full h-full">
      {/* Minaret left */}
      <rect x="30" y="60" width="12" height="60" rx="2" stroke="currentColor" strokeWidth="1.5" opacity="0.5" />
      <circle cx="36" cy="55" r="8" stroke="currentColor" strokeWidth="1.5" opacity="0.6" />
      {/* Main dome */}
      <path d="M50 120 L50 80 Q80 30 110 80 L110 120" stroke="currentColor" strokeWidth="1.5" fill="none" opacity="0.7" />
      {/* Door */}
      <path d="M70 120 L70 100 Q80 90 90 100 L90 120" stroke="currentColor" strokeWidth="1.5" opacity="0.5" />
      {/* Crescent */}
      <path d="M76 42 Q82 36 82 48 Q76 44 76 42" fill="currentColor" opacity="0.6" />
      {/* Minaret right */}
      <rect x="118" y="60" width="12" height="60" rx="2" stroke="currentColor" strokeWidth="1.5" opacity="0.5" />
      <circle cx="124" cy="55" r="8" stroke="currentColor" strokeWidth="1.5" opacity="0.6" />
      {/* Base line */}
      <line x1="20" y1="120" x2="140" y2="120" stroke="currentColor" strokeWidth="1.5" opacity="0.3" />
      {/* Stars */}
      <circle cx="25" cy="35" r="1.5" fill="currentColor" opacity="0.3" />
      <circle cx="135" cy="40" r="1" fill="currentColor" opacity="0.25" />
      <circle cx="50" cy="25" r="1" fill="currentColor" opacity="0.2" />
    </svg>
  ),
  book: (
    <svg viewBox="0 0 160 160" fill="none" className="w-full h-full">
      {/* Open book */}
      <path d="M40 40 L80 50 L120 40 L120 120 L80 110 L40 120Z" stroke="currentColor" strokeWidth="1.5" opacity="0.5" />
      <line x1="80" y1="50" x2="80" y2="110" stroke="currentColor" strokeWidth="1" opacity="0.4" />
      {/* Lines on pages */}
      <line x1="50" y1="60" x2="72" y2="65" stroke="currentColor" strokeWidth="0.8" opacity="0.3" />
      <line x1="50" y1="70" x2="72" y2="75" stroke="currentColor" strokeWidth="0.8" opacity="0.3" />
      <line x1="50" y1="80" x2="72" y2="85" stroke="currentColor" strokeWidth="0.8" opacity="0.3" />
      <line x1="88" y1="65" x2="110" y2="60" stroke="currentColor" strokeWidth="0.8" opacity="0.3" />
      <line x1="88" y1="75" x2="110" y2="70" stroke="currentColor" strokeWidth="0.8" opacity="0.3" />
      <line x1="88" y1="85" x2="110" y2="80" stroke="currentColor" strokeWidth="0.8" opacity="0.3" />
      {/* Decorative diamond */}
      <polygon points="80,25 86,32 80,39 74,32" stroke="currentColor" strokeWidth="1" fill="none" opacity="0.4" />
    </svg>
  ),
  heart: (
    <svg viewBox="0 0 160 160" fill="none" className="w-full h-full">
      <path d="M80 130 C40 100 15 70 40 45 C55 30 75 35 80 55 C85 35 105 30 120 45 C145 70 120 100 80 130Z" stroke="currentColor" strokeWidth="1.5" fill="none" opacity="0.5" />
      {/* Inner geometric pattern */}
      <polygon points="80,70 90,80 80,95 70,80" stroke="currentColor" strokeWidth="1" fill="none" opacity="0.3" />
      {/* Sparkle dots */}
      <circle cx="60" cy="55" r="2" fill="currentColor" opacity="0.3" />
      <circle cx="100" cy="55" r="2" fill="currentColor" opacity="0.3" />
    </svg>
  ),
  compass: (
    <svg viewBox="0 0 160 160" fill="none" className="w-full h-full">
      <circle cx="80" cy="80" r="55" stroke="currentColor" strokeWidth="1.5" opacity="0.4" />
      <circle cx="80" cy="80" r="45" stroke="currentColor" strokeWidth="0.8" opacity="0.3" />
      {/* Cardinal points */}
      <polygon points="80,30 84,70 80,65 76,70" fill="currentColor" opacity="0.5" />
      <polygon points="80,130 84,90 80,95 76,90" fill="currentColor" opacity="0.3" />
      <polygon points="30,80 70,76 65,80 70,84" fill="currentColor" opacity="0.3" />
      <polygon points="130,80 90,76 95,80 90,84" fill="currentColor" opacity="0.3" />
      {/* Center */}
      <circle cx="80" cy="80" r="4" fill="currentColor" opacity="0.4" />
    </svg>
  ),
  journal: (
    <svg viewBox="0 0 160 160" fill="none" className="w-full h-full">
      {/* Notebook */}
      <rect x="45" y="30" width="70" height="100" rx="4" stroke="currentColor" strokeWidth="1.5" opacity="0.5" />
      <line x1="55" y1="30" x2="55" y2="130" stroke="currentColor" strokeWidth="1" opacity="0.3" />
      {/* Lines */}
      <line x1="62" y1="50" x2="105" y2="50" stroke="currentColor" strokeWidth="0.8" opacity="0.3" />
      <line x1="62" y1="62" x2="100" y2="62" stroke="currentColor" strokeWidth="0.8" opacity="0.3" />
      <line x1="62" y1="74" x2="95" y2="74" stroke="currentColor" strokeWidth="0.8" opacity="0.3" />
      <line x1="62" y1="86" x2="90" y2="86" stroke="currentColor" strokeWidth="0.8" opacity="0.3" />
      {/* Pen */}
      <line x1="115" y1="95" x2="130" y2="60" stroke="currentColor" strokeWidth="1.5" opacity="0.4" />
      <polygon points="130,60 133,55 127,55" fill="currentColor" opacity="0.3" />
    </svg>
  ),
  community: (
    <svg viewBox="0 0 160 160" fill="none" className="w-full h-full">
      {/* People circles */}
      <circle cx="55" cy="60" r="15" stroke="currentColor" strokeWidth="1.5" opacity="0.4" />
      <circle cx="105" cy="60" r="15" stroke="currentColor" strokeWidth="1.5" opacity="0.4" />
      <circle cx="80" cy="50" r="15" stroke="currentColor" strokeWidth="1.5" opacity="0.5" />
      {/* Connected arc */}
      <path d="M35 110 Q55 85 80 85 Q105 85 125 110" stroke="currentColor" strokeWidth="1.5" opacity="0.3" />
      {/* Hands */}
      <path d="M65 95 Q80 100 95 95" stroke="currentColor" strokeWidth="1" opacity="0.4" />
    </svg>
  ),
}

export function EmptyState({
  illustration = 'mosque',
  title,
  description,
  ctaLabel,
  ctaTo,
  ctaOnClick,
  icon,
  className,
  children,
}) {
  const IllustrationSvg = typeof illustration === 'string' ? illustrations[illustration] : illustration

  return (
    <div className={cn(
      'flex flex-col items-center justify-center py-16 text-center animate-fade-up',
      className
    )}>
      {/* Illustration */}
      <div className="w-40 h-40 mb-6 text-primary/40">
        {IllustrationSvg || illustrations.mosque}
      </div>

      {/* Icon badge (optional, alternative to illustration) */}
      {icon && !IllustrationSvg && (
        <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-5">
          <Icon name={icon} size={32} className="text-primary/60" />
        </div>
      )}

      {/* Headline */}
      <h3 className="text-lg font-bold text-foreground mb-1.5">{title}</h3>

      {/* Subline */}
      {description && (
        <p className="text-sm text-muted-foreground max-w-xs leading-relaxed mb-5">{description}</p>
      )}

      {/* CTA */}
      {ctaTo && !children && (
        <Link
          to={ctaTo}
          className="inline-flex items-center gap-2 rounded-xl bg-primary text-primary-foreground px-5 py-2.5 text-sm font-semibold shadow-sm shadow-primary/20 hover:shadow-md hover:shadow-primary/30 transition-all hover:-translate-y-0.5"
        >
          {ctaLabel || 'Get Started'}
        </Link>
      )}
      {ctaOnClick && !ctaTo && !children && (
        <button
          onClick={ctaOnClick}
          className="inline-flex items-center gap-2 rounded-xl bg-primary text-primary-foreground px-5 py-2.5 text-sm font-semibold shadow-sm shadow-primary/20 hover:shadow-md hover:shadow-primary/30 transition-all hover:-translate-y-0.5"
        >
          {ctaLabel || 'Get Started'}
        </button>
      )}

      {/* Custom Children Actions */}
      {children && (
        <div className="mt-2 flex flex-wrap justify-center gap-3">
          {children}
        </div>
      )}
    </div>
  )
}

