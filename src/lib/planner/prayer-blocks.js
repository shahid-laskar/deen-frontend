/**
 * Maps the 8 TimeBlock keys to display metadata and energy signatures.
 * Actual prayer times (HH:MM strings) are injected at render time from the /prayer/times API.
 */

export const BLOCK_META = [
  {
    key: 'after_fajr',
    label: 'After Fajr',
    labelAr: 'بعد الفجر',
    prayerName: 'Fajr',
    energy: 'peak-barakah',
    taskTypeHint: 'Deep work, Quran, learning',
    isBawarahWindow: true,
  },
  {
    key: 'morning',
    label: 'Morning',
    labelAr: 'الصباح',
    prayerName: '',
    energy: 'high',
    taskTypeHint: 'Complex tasks, creative work',
    isBawarahWindow: false,
  },
  {
    key: 'after_dhuhr',
    label: 'After Dhuhr',
    labelAr: 'بعد الظهر',
    prayerName: 'Dhuhr',
    energy: 'low',
    taskTypeHint: 'Admin, email, errands',
    isBawarahWindow: false,
  },
  {
    key: 'afternoon',
    label: 'Afternoon',
    labelAr: 'العصر المبكر',
    prayerName: '',
    energy: 'medium',
    taskTypeHint: 'Collaborative work, calls',
    isBawarahWindow: false,
  },
  {
    key: 'after_asr',
    label: 'After Asr',
    labelAr: 'بعد العصر',
    prayerName: 'Asr',
    energy: 'medium',
    taskTypeHint: 'Moderate focus tasks',
    isBawarahWindow: false,
  },
  {
    key: 'evening',
    label: 'Evening',
    labelAr: 'المساء',
    prayerName: '',
    energy: 'low',
    taskTypeHint: 'Review, light reading',
    isBawarahWindow: false,
  },
  {
    key: 'after_maghrib',
    label: 'After Maghrib',
    labelAr: 'بعد المغرب',
    prayerName: 'Maghrib',
    energy: 'social',
    taskTypeHint: 'Family, dhikr, light tasks',
    isBawarahWindow: false,
  },
  {
    key: 'after_isha',
    label: 'After Isha',
    labelAr: 'بعد العشاء',
    prayerName: 'Isha',
    energy: 'low',
    taskTypeHint: 'Reflection, optional work',
    isBawarahWindow: false,
  },
]

// Prayer names to match the prayerTimes response object keys
const PRAYER_KEY_MAP = {
  Fajr:    'Fajr',
  Dhuhr:   'Dhuhr',
  Asr:     'Asr',
  Maghrib: 'Maghrib',
  Isha:    'Isha',
}

/**
 * Returns the HH:MM string for when a block starts, or null if not in prayerTimes.
 * prayerTimes: { Fajr: "05:12", Dhuhr: "12:30", ... }
 */
export function resolveBlockTime(block, prayerTimes) {
  if (!prayerTimes) return null
  const meta = BLOCK_META.find(b => b.key === block)
  if (!meta || !meta.prayerName) return null
  return prayerTimes[PRAYER_KEY_MAP[meta.prayerName]] ?? null
}

/**
 * Parses "HH:MM" into total minutes since midnight.
 */
function toMinutes(hhmm) {
  if (!hhmm) return null
  const [h, m] = hhmm.split(':').map(Number)
  return h * 60 + m
}

/**
 * Returns the active TimeBlock key based on current time and prayer times.
 * Falls back to 'morning' if prayer times not available.
 */
export function currentBlock(prayerTimes) {
  if (!prayerTimes) return 'morning'

  const now = new Date()
  const nowMin = now.getHours() * 60 + now.getMinutes()

  const fajr    = toMinutes(prayerTimes.Fajr)
  const dhuhr   = toMinutes(prayerTimes.Dhuhr)
  const asr     = toMinutes(prayerTimes.Asr)
  const maghrib = toMinutes(prayerTimes.Maghrib)
  const isha    = toMinutes(prayerTimes.Isha)

  if (fajr && nowMin >= fajr && dhuhr && nowMin < dhuhr - 30) {
    return nowMin < fajr + 90 ? 'after_fajr' : 'morning'
  }
  if (dhuhr && nowMin >= dhuhr && asr && nowMin < asr) {
    return nowMin < dhuhr + 60 ? 'after_dhuhr' : 'afternoon'
  }
  if (asr && nowMin >= asr && maghrib && nowMin < maghrib) {
    return nowMin < asr + 60 ? 'after_asr' : 'evening'
  }
  if (maghrib && nowMin >= maghrib && isha && nowMin < isha) {
    return nowMin < maghrib + 60 ? 'after_maghrib' : 'evening'
  }
  if (isha && nowMin >= isha) return 'after_isha'

  return 'morning'
}

/**
 * Returns minutes from now until the next prayer.
 */
export function minutesUntilNextPrayer(prayerTimes) {
  if (!prayerTimes) return 120

  const now = new Date()
  const nowMin = now.getHours() * 60 + now.getMinutes()

  const prayers = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha']
    .map(k => toMinutes(prayerTimes[k]))
    .filter(Boolean)
    .sort((a, b) => a - b)

  const next = prayers.find(m => m > nowMin)
  if (next) return next - nowMin

  // Next prayer is tomorrow's Fajr
  const fajr = toMinutes(prayerTimes.Fajr)
  if (fajr) return 1440 - nowMin + fajr
  return 120
}
