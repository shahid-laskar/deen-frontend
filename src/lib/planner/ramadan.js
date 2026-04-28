/**
 * Ramadan detection and utilities.
 * Uses src/lib/hijri.js — no new date libraries.
 */

import { gregorianToHijri } from '@/lib/hijri'
import { getPrefs } from './prefs'

/**
 * Returns true if today is Ramadan, respecting the ramadanMode pref.
 */
export function isRamadan() {
  const { ramadanMode } = getPrefs()
  if (ramadanMode === 'off') return false
  if (ramadanMode === 'on') return true
  // 'auto' — check Hijri calendar
  const { month } = gregorianToHijri(new Date())
  return month === 9
}

/**
 * Returns the night number (1–30) during Ramadan, null otherwise.
 * Islamic nights begin at Maghrib, so after Maghrib we are on the
 * next Hijri day. We use a simple approximation: same Gregorian day.
 */
export function ramadanNight() {
  if (!isRamadan()) return null
  const { day } = gregorianToHijri(new Date())
  return day
}

/**
 * Returns true for nights 21, 23, 25, 27, 29 of Ramadan
 * (possible Laylat al-Qadr nights).
 */
export function isLaylatulQadrPossible() {
  const night = ramadanNight()
  if (!night) return false
  return [21, 23, 25, 27, 29].includes(night)
}
