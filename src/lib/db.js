/**
 * IndexedDB wrapper — Offline Foundation
 * =======================================
 * Typed key-value store for offline-first data:
 *   - Prayer time cache (7 days ahead)
 *   - Habit log drafts
 *   - Journal drafts
 *   - Quran reading position
 *   - Hifz review queue
 *
 * Phase 1 scaffold: DB is opened and ready. Data population
 * happens in subsequent phases as offline sync is built.
 */

const DB_NAME    = 'deen-offline'
const DB_VERSION = 2

// Object store definitions
const STORES = {
  prayerTimes:   { keyPath: 'date' },           // { date: 'YYYY-MM-DD', timings: {...} }
  habitDrafts:   { keyPath: 'habit_id' },        // { habit_id, count, notes, timestamp }
  journalDrafts: { keyPath: 'draft_id' },        // { draft_id, content, mood, created_at }
  quranPosition: { keyPath: 'user_id' },         // { user_id, surah, ayah, juz, updated_at }
  hifzQueue:     { keyPath: 'entry_id' },        // { entry_id, surah, ayah_from, due_date }
  settings:      { keyPath: 'key' },             // generic key-value store
  recordings:    { keyPath: 'id', autoIncrement: true }, // { id, surah_id, ayah_id, blob, created_at, uploaded }
}

let _db = null

/** Open the IndexedDB, creating/upgrading stores as needed */
async function openDB() {
  if (_db) return _db

  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION)

    req.onupgradeneeded = (e) => {
      const db = e.target.result
      Object.entries(STORES).forEach(([storeName, opts]) => {
        if (!db.objectStoreNames.contains(storeName)) {
          db.createObjectStore(storeName, opts)
        }
      })
    }

    req.onsuccess = (e) => { _db = e.target.result; resolve(_db) }
    req.onerror   = (e) => reject(e.target.error)
  })
}

/** Generic get */
async function get(storeName, key) {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx  = db.transaction(storeName, 'readonly')
    const req = tx.objectStore(storeName).get(key)
    req.onsuccess = () => resolve(req.result)
    req.onerror   = (e) => reject(e.target.error)
  })
}

/** Generic put (insert or update) */
async function put(storeName, value) {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx  = db.transaction(storeName, 'readwrite')
    const req = tx.objectStore(storeName).put(value)
    req.onsuccess = () => resolve(req.result)
    req.onerror   = (e) => reject(e.target.error)
  })
}

/** Generic delete */
async function del(storeName, key) {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx  = db.transaction(storeName, 'readwrite')
    const req = tx.objectStore(storeName).delete(key)
    req.onsuccess = () => resolve()
    req.onerror   = (e) => reject(e.target.error)
  })
}

/** Get all records from a store */
async function getAll(storeName) {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx  = db.transaction(storeName, 'readonly')
    const req = tx.objectStore(storeName).getAll()
    req.onsuccess = () => resolve(req.result)
    req.onerror   = (e) => reject(e.target.error)
  })
}

/** Clear an entire store */
async function clear(storeName) {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx  = db.transaction(storeName, 'readwrite')
    const req = tx.objectStore(storeName).clear()
    req.onsuccess = () => resolve()
    req.onerror   = (e) => reject(e.target.error)
  })
}

// ─── Domain-specific helpers ─────────────────────────────────────────────────

export const offlineDB = {
  // ── Prayer Times ──────────────────────────────────────────────────────────
  async savePrayerTimes(date, timings) {
    return put('prayerTimes', { date, timings, saved_at: Date.now() })
  },
  async getPrayerTimes(date) {
    const record = await get('prayerTimes', date)
    return record?.timings ?? null
  },
  async clearOldPrayerTimes() {
    const all   = await getAll('prayerTimes')
    const cutoff = Date.now() - 8 * 24 * 60 * 60 * 1_000 // 8 days ago
    const stale  = all.filter(r => r.saved_at < cutoff)
    await Promise.all(stale.map(r => del('prayerTimes', r.date)))
  },

  // ── Journal Drafts ────────────────────────────────────────────────────────
  async saveJournalDraft(draft) {
    return put('journalDrafts', { ...draft, draft_id: draft.draft_id || 'default', updated_at: Date.now() })
  },
  async getJournalDraft(draftId = 'default') {
    return get('journalDrafts', draftId)
  },
  async deleteJournalDraft(draftId = 'default') {
    return del('journalDrafts', draftId)
  },

  // ── Quran Position ────────────────────────────────────────────────────────
  async saveQuranPosition(userId, surah, ayah, juz) {
    return put('quranPosition', { user_id: userId, surah, ayah, juz, updated_at: Date.now() })
  },
  async getQuranPosition(userId) {
    return get('quranPosition', userId)
  },

  // ── Habit Drafts ──────────────────────────────────────────────────────────
  async saveHabitDraft(habitId, count, notes = '') {
    return put('habitDrafts', { habit_id: habitId, count, notes, timestamp: Date.now() })
  },
  async getHabitDraft(habitId) {
    return get('habitDrafts', habitId)
  },
  async getAllHabitDrafts() {
    return getAll('habitDrafts')
  },
  async clearHabitDrafts() {
    return clear('habitDrafts')
  },

  // ── Settings ──────────────────────────────────────────────────────────────
  async setSetting(key, value) {
    return put('settings', { key, value, updated_at: Date.now() })
  },
  async getSetting(key) {
    const record = await get('settings', key)
    return record?.value ?? null
  },

  // ── Recitation Recordings ────────────────────────────────────────────────
  async saveRecitation(recording) {
    return put('recordings', {
      ...recording,
      created_at: recording.created_at || Date.now(),
      uploaded: Boolean(recording.uploaded),
    })
  },
  async getRecentRecitations(limit = 20) {
    const records = await getAll('recordings')
    return records
      .sort((a, b) => (b.created_at || 0) - (a.created_at || 0))
      .slice(0, limit)
  },
  async deleteRecitation(id) {
    return del('recordings', id)
  },

  // ── Utility ───────────────────────────────────────────────────────────────
  async isAvailable() {
    try { await openDB(); return true } catch { return false }
  },
}

export default offlineDB
