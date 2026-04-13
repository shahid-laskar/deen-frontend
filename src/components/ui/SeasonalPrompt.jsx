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
        className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
        style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(6px)' }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div
          className="w-full max-w-sm rounded-2xl overflow-hidden"
          style={{ background: 'var(--t-bg-card)', border: '0.5px solid var(--t-border)' }}
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
            <h2 className="font-display text-xl font-bold mb-2" style={{ color: 'var(--t-text)' }}>
              {msg.title}
            </h2>
            <p className="text-sm mb-6" style={{ color: 'var(--t-text-muted)' }}>
              {msg.body}
            </p>
            <div className="flex gap-3">
              <button
                onClick={declineSeasonalTheme}
                className="flex-1 py-3 rounded-xl text-sm font-medium border"
                style={{
                  borderColor: 'var(--t-border-strong)',
                  color: 'var(--t-text-muted)',
                  background: 'transparent',
                }}
              >
                Keep current
              </button>
              <button
                onClick={acceptSeasonalTheme}
                className="flex-1 py-3 rounded-xl text-sm font-medium text-white"
                style={{ background: 'var(--t-accent)' }}
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
