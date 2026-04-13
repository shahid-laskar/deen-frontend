/**
 * Theme Store
 * ===========
 * Manages:
 *  - Active theme (12 built-ins)
 *  - User typography preferences (font family, scale, line height)
 *  - Auto-dark-after-Maghrib logic
 *  - Seasonal theme auto-activation with user permission
 *
 * CSS variables are injected on :root. 300ms crossfade is handled in index.css.
 */

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { THEMES, SEASONAL_THEMES, DEFAULT_THEME_ID } from '../themes/themes'
import { detectIslamicSeason, isAfterMaghrib } from '../lib/hijri'

// ─── Google Fonts map ──────────────────────────────────────────────────────────
export const FONT_OPTIONS = {
  // Minimal
  'DM Sans':            { label: 'DM Sans',            category: 'Minimal', url: null }, // already loaded
  'Plus Jakarta Sans':  { label: 'Plus Jakarta Sans',  category: 'Minimal', url: 'https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600&display=swap' },
  'Inter':              { label: 'Inter',               category: 'Minimal', url: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap' },
  // Classic
  'Lora':               { label: 'Lora',                category: 'Classic', url: 'https://fonts.googleapis.com/css2?family=Lora:wght@400;500;600&display=swap' },
  'Merriweather':       { label: 'Merriweather',        category: 'Classic', url: 'https://fonts.googleapis.com/css2?family=Merriweather:wght@400;700&display=swap' },
  // Arabic-feel
  'Tajawal':            { label: 'Tajawal',             category: 'Arabic-feel', url: 'https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700&display=swap' },
  'IBM Plex Sans Arabic': { label: 'IBM Plex Arabic', category: 'Arabic-feel', url: 'https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Arabic:wght@400;500&display=swap' },
  // Bold/Strong
  'Sora':               { label: 'Sora',                category: 'Bold', url: 'https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600&display=swap' },
  'Barlow Semi Condensed': { label: 'Barlow Semi Condensed', category: 'Bold', url: 'https://fonts.googleapis.com/css2?family=Barlow+Semi+Condensed:wght@400;500;600&display=swap' },
}

// Text scale options
export const TEXT_SCALES = {
  small:      { label: 'Small',      scale: 0.875 },
  default:    { label: 'Default',    scale: 1.0 },
  large:      { label: 'Large',      scale: 1.125 },
  xlarge:     { label: 'Extra Large', scale: 1.25 },
}

// Line height options
export const LINE_HEIGHTS = {
  compact:     { label: 'Compact',     value: '1.4' },
  comfortable: { label: 'Comfortable', value: '1.6' },
  spacious:    { label: 'Spacious',    value: '1.85' },
}

// ─── Apply theme to DOM ────────────────────────────────────────────────────────
function applyThemeToDom(themeId, typography = {}) {
  const theme = THEMES[themeId] || THEMES[DEFAULT_THEME_ID]
  const root  = document.documentElement

  // Inject CSS variables
  Object.entries(theme.vars).forEach(([k, v]) => root.style.setProperty(k, v))

  // Dark class on html element
  root.classList.toggle('dark', theme.isDark)

  // Typography variables
  const { fontFamily = 'DM Sans', textScale = 'default', quranScale = 1.2, lineHeight = 'comfortable' } = typography
  root.style.setProperty('--t-font-family', `'${fontFamily}', system-ui, sans-serif`)
  root.style.setProperty('--t-font-scale',  String(TEXT_SCALES[textScale]?.scale ?? 1.0))
  root.style.setProperty('--t-quran-scale', String(quranScale))
  root.style.setProperty('--t-line-height', LINE_HEIGHTS[lineHeight]?.value ?? '1.6')
}

// ─── Font loader ───────────────────────────────────────────────────────────────
const _loadedFonts = new Set()
function loadFont(fontName) {
  const opt = FONT_OPTIONS[fontName]
  if (!opt?.url || _loadedFonts.has(fontName)) return
  const link = document.createElement('link')
  link.rel = 'stylesheet'
  link.href = opt.url
  document.head.appendChild(link)
  _loadedFonts.add(fontName)
}

// ─── Seasonal override helper ─────────────────────────────────────────────────
function getSeasonalThemeId(currentSeason, userOverride) {
  // If user explicitly opted out of seasonal themes, respect that
  if (userOverride === false) return null
  const season = currentSeason || detectIslamicSeason()
  if (!season) return null
  return SEASONAL_THEMES[season] ?? null
}

// ─── Store ────────────────────────────────────────────────────────────────────
export const useThemeStore = create(
  persist(
    (set, get) => ({
      // Active theme ID
      themeId: DEFAULT_THEME_ID,

      // Seasonal
      seasonalEnabled: true,          // user preference
      seasonalThemeActive: false,     // currently showing a seasonal theme
      seasonalPermissionAsked: {},    // {ramadan: true, eid_fitr: true, ...}
      pendingSeasonalTheme: null,     // set when we need to ask permission

      // Typography
      typography: {
        fontFamily:  'DM Sans',
        textScale:   'default',
        quranScale:  1.2,
        lineHeight:  'comfortable',
      },

      // Auto-dark toggle
      autoDarkAfterMaghrib: false,

      // ── Actions ──────────────────────────────────────────────────────────────

      setTheme(id) {
        if (!THEMES[id]) return
        set({ themeId: id, seasonalThemeActive: false })
        applyThemeToDom(id, get().typography)
      },

      setTypography(updates) {
        const next = { ...get().typography, ...updates }
        if (updates.fontFamily) loadFont(updates.fontFamily)
        set({ typography: next })
        applyThemeToDom(get().themeId, next)
      },

      toggleAutoDark(enabled) {
        set({ autoDarkAfterMaghrib: enabled })
      },

      /** Called on app init and whenever prayer times update */
      checkAutoDark() {
        if (!get().autoDarkAfterMaghrib) return
        const after = isAfterMaghrib()
        const theme = THEMES[get().themeId]
        if (after && !theme?.isDark) {
          // Switch to the user's preferred dark theme, defaulting to medina-midnight
          get().setTheme('medina-midnight')
        }
      },

      /** Call on app mount to check for seasonal themes */
      checkSeasonalTheme() {
        if (!get().seasonalEnabled) return
        const season = detectIslamicSeason()
        if (!season) {
          // If we were showing a seasonal theme, revert to user theme
          if (get().seasonalThemeActive) {
            get()._revertFromSeasonal()
          }
          return
        }
        const seasonalId = SEASONAL_THEMES[season]
        if (!seasonalId) return

        const alreadyAsked = get().seasonalPermissionAsked[season]
        if (alreadyAsked === true)  { get()._activateSeasonal(season, seasonalId); return }
        if (alreadyAsked === false) { return } // user declined

        // Ask user for permission
        set({ pendingSeasonalTheme: { season, themeId: seasonalId } })
      },

      acceptSeasonalTheme() {
        const pending = get().pendingSeasonalTheme
        if (!pending) return
        set(s => ({
          pendingSeasonalTheme: null,
          seasonalPermissionAsked: { ...s.seasonalPermissionAsked, [pending.season]: true },
        }))
        get()._activateSeasonal(pending.season, pending.themeId)
      },

      declineSeasonalTheme() {
        const pending = get().pendingSeasonalTheme
        if (!pending) return
        set(s => ({
          pendingSeasonalTheme: null,
          seasonalPermissionAsked: { ...s.seasonalPermissionAsked, [pending.season]: false },
        }))
      },

      _activateSeasonal(season, themeId) {
        set({ seasonalThemeActive: true })
        applyThemeToDom(themeId, get().typography)
      },

      _revertFromSeasonal() {
        set({ seasonalThemeActive: false })
        applyThemeToDom(get().themeId, get().typography)
      },

      /** Apply current theme + typography to DOM (call on hydration) */
      applyToDOM() {
        const { themeId, typography, seasonalThemeActive, pendingSeasonalTheme } = get()
        // Determine active theme
        const season = detectIslamicSeason()
        const seasonalId = season ? SEASONAL_THEMES[season] : null
        const asked = get().seasonalPermissionAsked[season]
        const effectiveId = (seasonalThemeActive && seasonalId && asked === true)
          ? seasonalId
          : themeId
        loadFont(typography.fontFamily)
        applyThemeToDom(effectiveId, typography)
      },
    }),

    {
      name: 'deen-theme',
      onRehydrateStorage: () => (state) => {
        if (state) {
          // Apply theme immediately on hydration to avoid flash
          setTimeout(() => state.applyToDOM(), 0)
          setTimeout(() => state.checkSeasonalTheme(), 100)
        }
      },
    }
  )
)

// Convenience: current theme object
export const getActiveTheme = () => {
  const { themeId } = useThemeStore.getState()
  return THEMES[themeId] || THEMES[DEFAULT_THEME_ID]
}
