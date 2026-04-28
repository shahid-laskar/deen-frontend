/**
 * Typed localStorage wrapper for planner preferences.
 * All keys are namespaced under "planner:".
 */

const DEFAULTS = {
  lastTab: 'today',
  pomodoroLength: 25,      // minutes: 25 | 50 | 90
  weekStart: 0,            // 0 = Sunday, 1 = Monday
  soundOn: true,
  ramadanMode: 'auto',     // 'auto' | 'on' | 'off'
  jumuhaMosqueTime: null,  // 'HH:MM' or null
  bufferPerPrayer: 10,     // minutes
}

const KEY = 'planner:prefs'

function load() {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return { ...DEFAULTS }
    return { ...DEFAULTS, ...JSON.parse(raw) }
  } catch {
    return { ...DEFAULTS }
  }
}

function save(prefs) {
  try {
    localStorage.setItem(KEY, JSON.stringify(prefs))
  } catch {
    // storage disabled — silent fail
  }
}

export function getPrefs() {
  return load()
}

export function setPref(key, value) {
  const prefs = load()
  prefs[key] = value
  save(prefs)
}

// ── Day niyyah ────────────────────────────────────────────────────────────────

export function getDayNiyyah(dateStr) {
  try { return localStorage.getItem(`planner:day-niyyah-${dateStr}`) ?? null } catch { return null }
}

export function setDayNiyyah(dateStr, text) {
  try { localStorage.setItem(`planner:day-niyyah-${dateStr}`, text) } catch {}
}

// ── Week niyyah ───────────────────────────────────────────────────────────────

function isoWeek(date = new Date()) {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  d.setDate(d.getDate() + 3 - ((d.getDay() + 6) % 7))
  const week1 = new Date(d.getFullYear(), 0, 4)
  return `${d.getFullYear()}-W${String(1 + Math.round(((d - week1) / 86400000 - 3 + ((week1.getDay() + 6) % 7)) / 7)).padStart(2, '0')}`
}

export function getWeekNiyyah() {
  try { return localStorage.getItem(`planner:week-niyyah-${isoWeek()}`) ?? null } catch { return null }
}

export function setWeekNiyyah(text) {
  try { localStorage.setItem(`planner:week-niyyah-${isoWeek()}`, text) } catch {}
}

// ── Ritual tracking ───────────────────────────────────────────────────────────

export function getLastRitual(dateStr) {
  try { return localStorage.getItem(`planner:last-ritual-${dateStr}`) ?? null } catch { return null }
}

export function setLastRitual(dateStr, value) {
  // value: 'fajr' | 'isha'
  try { localStorage.setItem(`planner:last-ritual-${dateStr}`, value) } catch {}
}

// ── Reflection & Shukr ───────────────────────────────────────────────────────

export function getReflection(dateStr) {
  try { return localStorage.getItem(`planner:reflection-${dateStr}`) ?? null } catch { return null }
}

export function setReflection(dateStr, text) {
  try { localStorage.setItem(`planner:reflection-${dateStr}`, text) } catch {}
}

export function getShukr(dateStr) {
  try { return localStorage.getItem(`planner:shukr-${dateStr}`) ?? null } catch { return null }
}

export function setShukr(dateStr, text) {
  try { localStorage.setItem(`planner:shukr-${dateStr}`, text) } catch {}
}

// ── Focus log ─────────────────────────────────────────────────────────────────

export function getFocusLog() {
  try {
    const raw = localStorage.getItem('planner:focus-log')
    return raw ? JSON.parse(raw) : []
  } catch { return [] }
}

export function appendFocusSession(session) {
  try {
    const log = getFocusLog()
    log.push(session)
    localStorage.setItem('planner:focus-log', JSON.stringify(log))
  } catch {}
}

// ── Dismissed banners ─────────────────────────────────────────────────────────

export function isBannerDismissed(key) {
  try { return localStorage.getItem(`planner:dismissed-${key}`) === '1' } catch { return false }
}

export function dismissBanner(key) {
  try { localStorage.setItem(`planner:dismissed-${key}`, '1') } catch {}
}
