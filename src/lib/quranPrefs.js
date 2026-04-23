/**
 * quranPrefs — Local UI preference store for the Quran reader.
 * Adapted from my-deen-hub/src/lib/quran-prefs.ts
 *
 * Persists: lastRead, translationId, reciterId, fontSize,
 *           arabicOnly, showTajweed, showGrammar, showTranslit, readingMode
 */

const STORAGE_KEY = 'quran_prefs_v2'

const defaults = {
  // Reading position (local fallback for server-side last-read)
  lastRead: {
    surahNumber:  1,
    ayahNumber:   1,
    surahName:    'Al-Fatihah',
    surahArabic:  'الفاتحة',
    totalAyahs:   7,
    timestamp:    Date.now(),
  },
  // Display options
  translationId:  131,   // Clear Quran (Dr. Mustafa Khattab)
  reciterId:      7,     // Mishari Rashid Al-Afasy
  fontSize:       1,     // 0=small 1=medium 2=large 3=xl
  arabicOnly:     false,
  showTajweed:    true,
  showGrammar:    false,
  showTranslit:   false,
  // Reading mode: 'scroll' | 'page' | 'juz' | 'hifz'
  readingMode:    'scroll',
  // Hifz challenge sub-mode: 'off' | 'guided' | 'blanks' | 'hide'
  hifzMode:       'off',
  // Audio
  audioSpeed:     1.0,
  audioRepeat:    'off',   // 'off' | 'one' | 'all'
  sleepTimer:     0,       // minutes; 0 = off
}

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { ...defaults }
    return { ...defaults, ...JSON.parse(raw) }
  } catch {
    return { ...defaults }
  }
}

function save(prefs) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs))
  } catch {}
}

let _cache = null

export function getQuranPrefs() {
  if (!_cache) _cache = load()
  return { ..._cache }
}

export function setQuranPref(key, value) {
  if (!_cache) _cache = load()
  _cache[key] = value
  save(_cache)
}

export function saveLastReadLocal(surahNumber, ayahNumber, surahName, surahArabic, totalAyahs) {
  setQuranPref('lastRead', {
    surahNumber,
    ayahNumber,
    surahName:   surahName   || _cache?.lastRead?.surahName   || 'Al-Fatihah',
    surahArabic: surahArabic || _cache?.lastRead?.surahArabic || 'الفاتحة',
    totalAyahs:  totalAyahs  || _cache?.lastRead?.totalAyahs  || 7,
    timestamp: Date.now(),
  })
}

export function getLastReadLocal() {
  return getQuranPrefs().lastRead
}

export function resetQuranPrefs() {
  _cache = { ...defaults }
  save(_cache)
}

export const FONT_SIZES = ['text-2xl', 'text-3xl', 'text-4xl', 'text-5xl']
export const FONT_SIZE_LABELS = ['Small', 'Medium', 'Large', 'Extra Large']
