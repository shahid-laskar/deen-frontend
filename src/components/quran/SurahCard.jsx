import { useNavigate } from '@tanstack/react-router'
import { cn } from '@/lib/utils'

/** SurahCard — glassmorphism surah card with hover lift effect */
export function SurahCard({ surah, className }) {
  const navigate = useNavigate()

  const REVELATION_COLORS = {
    Meccan:  'bg-gold/10 text-gold border-gold/20',
    Medinan: 'bg-sage/10 text-sage border-sage/20',
  }
  const typeColor = REVELATION_COLORS[surah.revelation_place] || REVELATION_COLORS.Meccan

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => navigate({ to: `/worship/quran/surah/${surah.id}` })}
      onKeyDown={(e) => e.key === 'Enter' && navigate({ to: `/worship/quran/surah/${surah.id}` })}
      className={cn(
        'rounded-2xl border border-border bg-card p-4 cursor-pointer group',
        'card-hover shadow-soft hover:shadow-elevated hover:border-primary/20',
        'transition-colors duration-200',
        className
      )}
    >
      <div className="flex items-center gap-3">
        {/* Hexagonal surah number badge */}
        <div className="relative shrink-0 w-10 h-10 flex items-center justify-center">
          <svg viewBox="0 0 44 44" className="absolute inset-0 w-full h-full text-primary/15 group-hover:text-primary/25 transition-colors" fill="currentColor">
            <path d="M22 2 L40 12 L40 32 L22 42 L4 32 L4 12 Z" />
          </svg>
          <span className="relative z-10 text-xs font-black text-primary">
            {surah.id}
          </span>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <p className="font-bold text-sm text-foreground truncate">{surah.name_simple}</p>
            <p className="font-amiri text-lg text-foreground shrink-0 leading-tight">
              {surah.name_arabic}
            </p>
          </div>
          <div className="flex items-center gap-2 mt-1">
            <span className={cn('text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-md border', typeColor)}>
              {surah.revelation_place}
            </span>
            <span className="text-[10px] font-bold text-muted-foreground">
              {surah.verses_count} verses
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
