import React from 'react'
import { useThemeStore } from '@/store/themeStore'
import { Sparkles, X } from 'lucide-react'

const SEASON_LABELS = {
  ramadan:        { title: 'Ramadan Mubarak 🌙', desc: 'Switch to the Ramadan theme for an immersive spiritual experience.' },
  eid_fitr:       { title: 'Eid Mubarak! ✨',    desc: 'Celebrate Eid al-Fitr with a festive theme.' },
  eid_adha:       { title: 'Eid Mubarak! 🐑',    desc: 'Celebrate Eid al-Adha with a festive theme.' },
  dhul_hijjah_10: { title: 'Dhul Hijjah 🕋',     desc: 'Apply the sacred Dhul Hijjah theme for these blessed days.' },
}

export function SeasonalPrompt() {
  const { pendingSeasonalTheme, acceptSeasonalTheme, declineSeasonalTheme } = useThemeStore()
  if (!pendingSeasonalTheme) return null

  const labels = SEASON_LABELS[pendingSeasonalTheme.season]
  if (!labels) return null

  return (
    <div className="fixed bottom-20 md:bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 z-50 animate-slide-up">
      <div className="rounded-2xl border border-primary/20 bg-card p-4 shadow-xl">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-primary/15 flex items-center justify-center shrink-0">
            <Sparkles className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-foreground text-sm">{labels.title}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{labels.desc}</p>
            <div className="flex gap-2 mt-3">
              <button
                onClick={acceptSeasonalTheme}
                className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                Apply Theme
              </button>
              <button
                onClick={declineSeasonalTheme}
                className="inline-flex items-center gap-1.5 rounded-lg bg-muted px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-accent transition-colors"
              >
                No thanks
              </button>
            </div>
          </div>
          <button onClick={declineSeasonalTheme} className="text-muted-foreground hover:text-foreground transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
