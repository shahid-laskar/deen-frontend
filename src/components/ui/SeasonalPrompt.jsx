import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useThemeStore } from '../../store/themeStore'
import { THEMES } from '../../themes/themes'
import { getIslamicContext } from '../../lib/hijri'

const SEASON_MESSAGES = {
  ramadan: {
    emoji:   '🌙',
    title:   'Ramadan Mubarak!',
    body:    'The blessed month is here. Shall we switch to the Ramadan Night theme?',
  },
  eid_fitr: {
    emoji:   '🎉',
    title:   'Eid ul-Fitr Mubarak!',
    body:    'Taqabbal Allahu minna wa minkum. Switch to a festive Eid theme?',
  },
  eid_adha: {
    emoji:   '🐑',
    title:   'Eid ul-Adha Mubarak!',
    body:    'May Allah accept your sacrifices. Switch to the Golden Mosque theme?',
  },
  dhul_hijjah_10: {
    emoji:   '🕌',
    title:   'Blessed Days of Dhul Hijjah',
    body:    'These are the ten best days of the year. Activate the special Dhul Hijjah accent?',
  },
}

export default function SeasonalPrompt() {
  const { pendingSeasonalTheme, acceptSeasonalTheme, declineSeasonalTheme } = useThemeStore()
  if (!pendingSeasonalTheme) return null

  const { season, themeId } = pendingSeasonalTheme
  const msg   = SEASON_MESSAGES[season] || SEASON_MESSAGES.ramadan
  const theme = THEMES[themeId]

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div
          className="relative w-[340px] max-w-[90vw] rounded-[24px] overflow-hidden bg-card border border-border shadow-2xl flex flex-col pointer-events-auto"
          initial={{ y: 40, opacity: 0 }}
          animate={{ y: 0, opacity: 1, transition: { type: 'spring', damping: 22, stiffness: 300 } }}
          exit={{ y: 40, opacity: 0 }}
        >
          {/* Theme preview strip */}
          {theme && (
            <div
              className="h-2 w-full"
              style={{
                background: `linear-gradient(90deg, ${theme.preview[0]}, ${theme.preview[1]}, ${theme.preview[2]})`,
              }}
            />
          )}

          <div className="p-6">
            <div className="text-4xl mb-3">{msg.emoji}</div>
            <h2 className="font-display text-xl font-bold mb-2 text-foreground">
              {msg.title}
            </h2>
            <p className="text-sm mb-6 text-muted-foreground">
              {msg.body}
            </p>
            <div className="flex gap-3">
              <button
                onClick={declineSeasonalTheme}
                className="flex-1 py-3.5 rounded-xl font-semibold text-sm transition-all border border-border text-muted-foreground hover:bg-muted"
              >
                Keep current
              </button>
              <button
                onClick={acceptSeasonalTheme}
                className="flex-1 py-3.5 rounded-xl font-bold text-sm text-white transition-all bg-accent hover:brightness-110"
              >
                Yes, switch! ✨
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
