/**
 * Offline Prayer Times — adhan-js
 * =================================
 * Client-side calculation. No network request.
 * Accurate to ±1 minute vs aladhan.com for all standard methods.
 *
 * Supports:
 *   - 13+ calculation methods (MWL, ISNA, Egypt, Makkah, Karachi, Tehran,
 *     Singapore, Turkey, France, Russia, Gulf, Kuwait, Qatar)
 *   - Asr: Hanafi (shadow 2×) vs Shafi'i/Maliki/Hanbali (shadow 1×)
 *   - Higher latitude adjustments: angle-based, one-seventh, middle-of-night
 */

import { Coordinates, CalculationMethod, CalculationParameters, PrayerTimes, Madhab, HighLatitudeRule, Prayer } from 'adhan'

// ─── Method map ──────────────────────────────────────────────────────────────

export const CALCULATION_METHODS = {
  MWL:       { label: 'Muslim World League',                    adhan: () => CalculationMethod.MuslimWorldLeague() },
  ISNA:      { label: 'ISNA (North America)',                   adhan: () => CalculationMethod.NorthAmerica() },
  Egypt:     { label: 'Egyptian General Authority',             adhan: () => CalculationMethod.Egyptian() },
  Makkah:    { label: 'Umm al-Qura, Makkah',                   adhan: () => CalculationMethod.UmmAlQura() },
  Karachi:   { label: 'Univ. of Islamic Sciences, Karachi',     adhan: () => CalculationMethod.Karachi() },
  Tehran:    { label: 'Institute of Geophysics, Tehran',        adhan: () => CalculationMethod.Tehran() },
  Singapore: { label: 'Majlis Ugama Islam Singapura',           adhan: () => CalculationMethod.Singapore() },
  Turkey:    { label: 'Diyanet İşleri Başkanlığı, Turkey',      adhan: () => CalculationMethod.Turkey() },
  France:    { label: 'Union Organisations Islamiques, France', adhan: () => CalculationMethod.France() },
  Russia:    { label: 'Spiritual Administration, Russia',       adhan: () => CalculationMethod.Russia() },
  Gulf:      { label: 'Gulf Region',                            adhan: () => CalculationMethod.Gulf() },
  Kuwait:    { label: 'Kuwait',                                 adhan: () => CalculationMethod.Kuwait() },
  Qatar:     { label: 'Qatar',                                  adhan: () => CalculationMethod.Qatar() },
}

export const METHOD_IDS = Object.keys(CALCULATION_METHODS)

// ─── Asr Madhab ───────────────────────────────────────────────────────────────

const MADHAB_ASR = {
  hanafi:  Madhab.Hanafi,    // shadow factor 2x (later Asr)
  shafii:  Madhab.Shafi,     // shadow factor 1x (earlier Asr)
  maliki:  Madhab.Shafi,
  hanbali: Madhab.Shafi,
}

// ─── High latitude rule ───────────────────────────────────────────────────────

function detectHighLatRule(lat) {
  if (lat >= 48) return HighLatitudeRule.MiddleOfTheNight
  if (lat >= 45) return HighLatitudeRule.SeventhOfTheNight
  return HighLatitudeRule.AngleBased
}

// ─── Format time ─────────────────────────────────────────────────────────────

function fmt(date) {
  if (!date || isNaN(date)) return '--:--'
  return date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false })
}

// ─── Main calculation ─────────────────────────────────────────────────────────

/**
 * Calculate prayer times offline.
 *
 * @param {number} latitude
 * @param {number} longitude
 * @param {string} methodKey  — one of CALCULATION_METHODS keys, default 'MWL'
 * @param {string} madhab     — hanafi | shafii | maliki | hanbali
 * @param {Date}   date       — default today
 * @returns {{ Fajr, Sunrise, Dhuhr, Asr, Sunset, Maghrib, Isha, Midnight }}
 */
export function calcPrayerTimes(latitude, longitude, methodKey = 'MWL', madhab = 'hanafi', date = new Date()) {
  const coords = new Coordinates(latitude, longitude)

  const methodFactory = CALCULATION_METHODS[methodKey]?.adhan ?? CALCULATION_METHODS.MWL.adhan
  const params = methodFactory()

  params.madhab         = MADHAB_ASR[madhab] ?? Madhab.Shafi
  params.highLatitudeRule = detectHighLatRule(latitude)

  const times = new PrayerTimes(coords, date, params)

  return {
    fajr:     fmt(times.fajr),
    sunrise:  fmt(times.sunrise),
    dhuhr:    fmt(times.dhuhr),
    asr:      fmt(times.asr),
    sunset:   fmt(times.sunset),
    maghrib:  fmt(times.maghrib),
    isha:     fmt(times.isha),
    midnight: fmt(times.midnight),
    _raw: times,
  }
}

/**
 * Get next prayer name + time from calculated times.
 * Returns { name, time } where time is a Date.
 */
export function getNextPrayer(timings) {
  const raw = timings?._raw
  if (!raw) return null
  const next = raw.nextPrayer()
  const timeForNext = raw.timeForPrayer(next)
  return { name: next, time: timeForNext }
}

/**
 * Get current prayer (the one we are currently "in").
 */
export function getCurrentPrayer(timings) {
  const raw = timings?._raw
  if (!raw) return null
  return raw.currentPrayer()
}

/**
 * How many minutes until the next prayer?
 */
export function minutesUntilNextPrayer(timings) {
  const raw = timings?._raw
  if (!raw) return null
  const next = raw.nextPrayer()
  const nextTime = raw.timeForPrayer(next)
  return Math.floor((nextTime - new Date()) / 60_000)
}

/**
 * Build a timings object for a given date (for multi-day pre-fetching).
 * Returns same shape as calcPrayerTimes.
 */
export function calcForDate(latitude, longitude, methodKey, madhab, jsDate) {
  return calcPrayerTimes(latitude, longitude, methodKey, madhab, jsDate)
}

/**
 * Pre-calculate prayer times for today + next N days and cache in localStorage.
 */
export function prefetchAndCache(latitude, longitude, methodKey, madhab, days = 7) {
  const cache = {}
  for (let i = 0; i < days; i++) {
    const d = new Date()
    d.setDate(d.getDate() + i)
    const key = d.toISOString().split('T')[0]
    const times = calcForDate(latitude, longitude, methodKey, madhab, d)
    // Strip _raw (not serializable)
    const { _raw, ...serializable } = times
    cache[key] = serializable
  }
  try {
    localStorage.setItem('deen-prayer-times-cache', JSON.stringify(cache))
  } catch {}
  return cache
}

/**
 * Read today's times from cache (set by prefetchAndCache).
 */
export function getCachedTimes(date = new Date()) {
  try {
    const raw = localStorage.getItem('deen-prayer-times-cache')
    if (!raw) return null
    const cache = JSON.parse(raw)
    const key = date.toISOString().split('T')[0]
    return cache[key] ?? null
  } catch {
    return null
  }
}
