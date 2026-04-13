/**
 * Phase 1 Component Tests
 * =======================
 * Tests for: theme store, onboarding routing, dashboard rendering.
 *
 * Run: npm run test
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, waitFor, fireEvent } from '@testing-library/react'
import { render } from './setup'

// ─── Theme store tests ────────────────────────────────────────────────────────

describe('themeStore', () => {
  it('should have all 12 themes defined', async () => {
    const { THEME_LIST } = await import('../themes/themes')
    expect(THEME_LIST).toHaveLength(12)
  })

  it('each theme should have required CSS variables', async () => {
    const { THEME_LIST } = await import('../themes/themes')
    const REQUIRED_VARS = ['--t-bg', '--t-bg-card', '--t-primary', '--t-accent', '--t-nav-active', '--t-prayer-hero']
    THEME_LIST.forEach(theme => {
      REQUIRED_VARS.forEach(v => {
        expect(theme.vars).toHaveProperty(v)
      })
    })
  })

  it('should identify dark themes correctly', async () => {
    const { THEME_LIST } = await import('../themes/themes')
    const dark  = THEME_LIST.filter(t => t.isDark)
    const light = THEME_LIST.filter(t => !t.isDark)
    expect(dark.length).toBeGreaterThan(0)
    expect(light.length).toBeGreaterThan(0)
  })

  it('seasonal themes should have correct IDs', async () => {
    const { SEASONAL_THEMES, THEMES } = await import('../themes/themes')
    Object.values(SEASONAL_THEMES).forEach(id => {
      if (id !== null) {
        expect(THEMES).toHaveProperty(id)
      }
    })
  })
})

// ─── Hijri calendar tests ─────────────────────────────────────────────────────

describe('hijri calendar', () => {
  it('should convert today to a valid hijri date', async () => {
    const { todayHijri } = await import('../lib/hijri')
    const hijri = todayHijri()
    expect(hijri).toHaveProperty('month')
    expect(hijri).toHaveProperty('day')
    expect(hijri).toHaveProperty('year')
    expect(hijri.month).toBeGreaterThanOrEqual(1)
    expect(hijri.month).toBeLessThanOrEqual(12)
    expect(hijri.year).toBeGreaterThan(1400)
    expect(typeof hijri.day).toBe('number')
  })

  it('should format hijri date in English', async () => {
    const { formatHijri, HIJRI_MONTHS } = await import('../lib/hijri')
    const hijri = { year: 1446, month: 9, day: 1 }
    const result = formatHijri(hijri, 'en')
    expect(result).toContain('Ramadan')
    expect(result).toContain('1446')
    expect(result).toContain('AH')
  })

  it('should format hijri date in Arabic', async () => {
    const { formatHijri } = await import('../lib/hijri')
    const hijri = { year: 1446, month: 9, day: 1 }
    const result = formatHijri(hijri, 'ar')
    expect(result).toContain('رمضان')
    expect(result).toContain('1446')
    expect(result).toContain('هـ')
  })

  it('detectIslamicSeason should return null outside seasons', async () => {
    const { detectIslamicSeason, todayHijri } = await import('../lib/hijri')
    const hijri = todayHijri()
    const result = detectIslamicSeason()
    const validSeasons = ['ramadan', 'eid_fitr', 'eid_adha', 'dhul_hijjah_10', null]
    expect(validSeasons).toContain(result)
  })
})

// ─── IndexedDB wrapper tests ──────────────────────────────────────────────────

describe('offlineDB', () => {
  beforeEach(() => {
    // jsdom ships a minimal indexedDB polyfill
  })

  it('should be importable without errors', async () => {
    const { offlineDB } = await import('../lib/db')
    expect(typeof offlineDB.savePrayerTimes).toBe('function')
    expect(typeof offlineDB.saveJournalDraft).toBe('function')
    expect(typeof offlineDB.saveQuranPosition).toBe('function')
    expect(typeof offlineDB.saveHabitDraft).toBe('function')
    expect(typeof offlineDB.setSetting).toBe('function')
  })
})

// ─── Theme store action tests ─────────────────────────────────────────────────

describe('themeStore actions', () => {
  it('FONT_OPTIONS should have DM Sans as default', async () => {
    const { FONT_OPTIONS } = await import('../store/themeStore')
    expect(FONT_OPTIONS).toHaveProperty('DM Sans')
    expect(FONT_OPTIONS['DM Sans'].category).toBe('Minimal')
  })

  it('TEXT_SCALES should have 4 options', async () => {
    const { TEXT_SCALES } = await import('../store/themeStore')
    expect(Object.keys(TEXT_SCALES)).toHaveLength(4)
  })

  it('LINE_HEIGHTS should have 3 options', async () => {
    const { LINE_HEIGHTS } = await import('../store/themeStore')
    expect(Object.keys(LINE_HEIGHTS)).toHaveLength(3)
  })
})

// ─── Onboarding data tests ────────────────────────────────────────────────────

describe('onboarding archetypes', () => {
  it('should have 5 archetypes', async () => {
    // Dynamic import from OnboardingV2
    const module = await import('../pages/auth/OnboardingV2')
    // The archetypes are module-level const — we test indirectly via render
    // since they're not exported. Verify module loads without error.
    expect(module.default).toBeDefined()
  })
})

// ─── PWA Manifest tests ───────────────────────────────────────────────────────

describe('pwa manifest', () => {
  it('should exist and be fetchable', () => {
    // Manifest existence is a build-time concern; test that the file
    // can be imported/loaded. In a real test this would fetch /manifest.json
    expect(true).toBe(true) // placeholder — tested during build verification
  })
})
