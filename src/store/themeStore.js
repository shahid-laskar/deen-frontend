/**
 * Theme Store — Phase 1 Redesign
 * ================================
 * Clean OKLCH-based theme system with:
 *  - Simple dark/light toggle
 *  - Polished seasonal themes via CSS class overrides
 *  - Font family preference
 *  - Quran text scale
 *  - Auto-dark-after-Maghrib
 *
 * Seasonal themes apply a CSS class on <html> which overrides
 * OKLCH tokens defined in index.css (.season-ramadan, .season-eid, .season-dhul-hijjah).
 */

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { detectIslamicSeason, isAfterMaghrib } from '../lib/hijri'

// ─── Season → CSS class ───────────────────────────────────────────────────────
const SEASON_CLASSES = {
  ramadan:     'season-ramadan',
  eid_fitr:    'season-eid',
  eid_adha:    'season-eid',
  dhul_hijjah_10: 'season-dhul-hijjah',
}

// ─── Font options ─────────────────────────────────────────────────────────────
export const FONT_OPTIONS = {
  'Inter':              { label: 'Inter (Default)',  url: null },
  'Plus Jakarta Sans':  { label: 'Plus Jakarta Sans', url: 'https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600&display=swap' },
  'Tajawal':            { label: 'Tajawal',          url: 'https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700&display=swap' },
  'Sora':               { label: 'Sora',             url: 'https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600&display=swap' },
  'Lora':               { label: 'Lora (Serif)',     url: 'https://fonts.googleapis.com/css2?family=Lora:wght@400;500;600&display=swap' },
}

// ─── Apply fonts to DOM ───────────────────────────────────────────────────────
const _loadedFonts = new Set(['Inter'])

function applyFontToDOM(fontFamily) {
  const opt = FONT_OPTIONS[fontFamily]
  if (opt?.url && !_loadedFonts.has(fontFamily)) {
    const link = document.createElement('link')
    link.rel = 'stylesheet'
    link.href = opt.url
    document.head.appendChild(link)
    _loadedFonts.add(fontFamily)
  }
  const root = document.documentElement
  root.style.setProperty('--font-display', `"${fontFamily}", system-ui, sans-serif`)
  document.body.style.fontFamily = `"${fontFamily}", system-ui, sans-serif`
}

// ─── Apply dark mode to DOM ───────────────────────────────────────────────────
function applyDarkToDOM(isDark) {
  document.documentElement.classList.toggle('dark', isDark)
}

// ─── Apply season class to DOM ────────────────────────────────────────────────
function applySeasonToDOM(season) {
  const html = document.documentElement
  // Remove any existing season classes
  Object.values(SEASON_CLASSES).forEach(cls => html.classList.remove(cls))
  if (season && SEASON_CLASSES[season]) {
    html.classList.add(SEASON_CLASSES[season])
  }
}

// ─── Store ────────────────────────────────────────────────────────────────────
export const useThemeStore = create(
  persist(
    (set, get) => ({
      // Core
      isDark: false,

      // Seasonal
      seasonalEnabled: true,
      seasonalPermissionAsked: {},   // {ramadan: true|false, eid: true|false, …}
      pendingSeasonalTheme: null,    // {season, cssClass} — needs user permission

      // Typography
      fontFamily:  'Inter',
      quranScale:  1.2,

      // Auto-dark after Maghrib
      autoDarkAfterMaghrib: false,

      // ── Actions ──────────────────────────────────────────────────────────────

      /** Toggle dark/light mode */
      toggleDark() {
        const next = !get().isDark
        set({ isDark: next })
        applyDarkToDOM(next)
      },

      setDark(val) {
        set({ isDark: val })
        applyDarkToDOM(val)
      },

      /** Change font family */
      setFont(fontFamily) {
        if (!FONT_OPTIONS[fontFamily]) return
        set({ fontFamily })
        applyFontToDOM(fontFamily)
      },

      /** Change Quran text scale */
      setQuranScale(scale) {
        set({ quranScale: scale })
        document.documentElement.style.setProperty('--quran-scale', String(scale))
      },

      /** Toggle auto-dark mode */
      toggleAutoDark(enabled) {
        set({ autoDarkAfterMaghrib: enabled })
      },

      /** Check and apply auto-dark after Maghrib */
      checkAutoDark() {
        if (!get().autoDarkAfterMaghrib) return
        if (isAfterMaghrib() && !get().isDark) {
          get().setDark(true)
        }
      },

      /** Called on app mount to check for seasonal themes */
      checkSeasonalTheme() {
        if (!get().seasonalEnabled) return
        const season = detectIslamicSeason()

        if (!season) {
          // Revert any active season class
          applySeasonToDOM(null)
          return
        }

        const asked = get().seasonalPermissionAsked[season]
        if (asked === true)  { applySeasonToDOM(season); return }
        if (asked === false) { return }

        // First time: ask user
        set({ pendingSeasonalTheme: { season, cssClass: SEASON_CLASSES[season] } })
      },

      acceptSeasonalTheme() {
        const pending = get().pendingSeasonalTheme
        if (!pending) return
        set(s => ({
          pendingSeasonalTheme: null,
          seasonalPermissionAsked: { ...s.seasonalPermissionAsked, [pending.season]: true },
        }))
        applySeasonToDOM(pending.season)
      },

      declineSeasonalTheme() {
        const pending = get().pendingSeasonalTheme
        if (!pending) return
        set(s => ({
          pendingSeasonalTheme: null,
          seasonalPermissionAsked: { ...s.seasonalPermissionAsked, [pending.season]: false },
        }))
      },

      /** Called on hydration — apply current state to DOM */
      applyToDOM() {
        const { isDark, fontFamily, quranScale, seasonalEnabled, seasonalPermissionAsked } = get()
        applyDarkToDOM(isDark)
        applyFontToDOM(fontFamily)
        document.documentElement.style.setProperty('--quran-scale', String(quranScale))

        // Re-apply season class if previously accepted
        if (seasonalEnabled) {
          const season = detectIslamicSeason()
          if (season && seasonalPermissionAsked[season] === true) {
            applySeasonToDOM(season)
          }
        }
      },
    }),

    {
      name: 'deen-theme-v2',
      onRehydrateStorage: () => (state) => {
        if (state) {
          setTimeout(() => state.applyToDOM(), 0)
          setTimeout(() => {
            state.checkSeasonalTheme()
            state.checkAutoDark()
          }, 100)
        }
      },
    }
  )
)
