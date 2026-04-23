import { BookOpen, ChevronRight } from 'lucide-react'
import { useNavigate } from '@tanstack/react-router'
import { cn } from '@/lib/utils'

/**
 * ContinueReadingHero — from my-deen-hub
 * Shows last-read position with an Islamic geometric pattern background,
 * gradient overlay, progress bar, and resume/start button.
 */
export function ContinueReadingHero({ lastRead, totalVerses = 6236, versesRead = 0 }) {
  const navigate = useNavigate()
  const { surahNumber = 1, ayahNumber = 1, surahName = 'Al-Fatihah', surahArabic = 'الفاتحة', totalAyahs = 7 } = lastRead || {}

  const pct = Math.min(100, Math.round((versesRead / totalVerses) * 100))

  const handleResume = () => {
    navigate({ to: `/quran/surah/${surahNumber}`, search: { ayah: ayahNumber } })
  }

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-3xl p-6 cursor-pointer group card-hover shadow-elevated',
        'bg-gradient-to-br from-primary/90 via-primary to-warm/80'
      )}
      onClick={handleResume}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && handleResume()}
      aria-label={`Resume reading ${surahName}`}
    >
      {/* Islamic geometric SVG background pattern */}
      <div className="absolute inset-0 opacity-10 pointer-events-none">
        <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="islamic-hero" x="0" y="0" width="60" height="60" patternUnits="userSpaceOnUse">
              <path d="M30 0L60 30L30 60L0 30Z" fill="none" stroke="white" strokeWidth="0.8"/>
              <circle cx="30" cy="30" r="10" fill="none" stroke="white" strokeWidth="0.5"/>
              <path d="M30 10L40 20L50 30L40 40L30 50L20 40L10 30L20 20Z" fill="none" stroke="white" strokeWidth="0.4"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#islamic-hero)"/>
        </svg>
      </div>

      {/* Shimmer overlay on hover */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-20 transition-opacity duration-500 bg-gradient-to-r from-transparent via-white to-transparent animate-shimmer pointer-events-none" />

      <div className="relative z-10 flex items-start justify-between gap-4">
        <div className="flex-1">
          <p className="text-[10px] font-black uppercase tracking-widest text-primary-foreground/70 mb-1.5">
            {versesRead > 0 ? 'Continue Reading' : 'Start Your Journey'}
          </p>

          {/* Arabic name */}
          <p className="font-amiri-quran text-2xl text-primary-foreground mb-1 leading-relaxed text-right">
            {surahArabic}
          </p>

          <h2 className="text-xl font-black text-primary-foreground mb-0.5">
            {surahNumber}. {surahName}
          </h2>
          <p className="text-[11px] font-bold text-primary-foreground/75 uppercase tracking-widest">
            Ayah {ayahNumber} of {totalAyahs}
          </p>

          {/* Progress bar */}
          <div className="mt-4 space-y-1.5">
            <div className="h-2 bg-primary-foreground/20 rounded-full overflow-hidden">
              <div
                className="h-full bg-primary-foreground rounded-full transition-all duration-700 ease-out"
                style={{ width: `${pct}%` }}
              />
            </div>
            <p className="text-[10px] font-bold text-primary-foreground/70">
              {pct}% of Quran · {versesRead.toLocaleString()} verses read
            </p>
          </div>
        </div>

        <div className="shrink-0 flex flex-col items-center justify-center w-14 h-14 rounded-2xl bg-primary-foreground/15 border border-primary-foreground/25 backdrop-blur-sm group-hover:bg-primary-foreground/25 transition-colors">
          <BookOpen className="h-5 w-5 text-primary-foreground mb-1" />
          <ChevronRight className="h-3 w-3 text-primary-foreground/80" />
        </div>
      </div>
    </div>
  )
}
