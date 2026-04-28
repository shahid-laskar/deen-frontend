/**
 * Computes today's available work minutes given prayer times and today's tasks.
 */

function toMinutes(hhmm) {
  if (!hhmm) return null
  const [h, m] = hhmm.split(':').map(Number)
  return h * 60 + m
}

/**
 * @param {object} prayerTimes - { Fajr: "05:12", Dhuhr: "12:30", ... }
 * @param {Array}  todayTasks
 * @param {number} bufferPerPrayerMinutes - default 10
 * @returns {{ availableMinutes, plannedMinutes, overMinutes, utilizationPercent, status }}
 */
export function computeCapacity(prayerTimes, todayTasks = [], bufferPerPrayerMinutes = 10) {
  const prayers = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha']
    .map(k => toMinutes(prayerTimes?.[k]))
    .filter(Boolean)
    .sort((a, b) => a - b)

  // Work window: from Fajr to Isha, minus buffers around each prayer
  let availableMinutes = 0
  if (prayers.length >= 2) {
    const start = prayers[0]                     // Fajr
    const end   = (prayers[prayers.length - 1]) + 60 // after Isha
    const totalWindow = end - start
    // Deduct buffer on each side of each prayer (2 sides × bufferPerPrayer × prayerCount)
    const deduction = prayers.length * 2 * bufferPerPrayerMinutes
    availableMinutes = Math.max(0, totalWindow - deduction)
  } else {
    // Fallback: assume a 14-hour workday
    availableMinutes = 14 * 60 - 5 * 2 * bufferPerPrayerMinutes
  }

  const plannedMinutes = todayTasks.reduce((sum, t) => {
    return sum + (t.estimated_minutes || 0)
  }, 0)

  const overMinutes = Math.max(0, plannedMinutes - availableMinutes)
  const utilizationPercent = availableMinutes > 0
    ? Math.round((plannedMinutes / availableMinutes) * 100)
    : 0

  let status = 'ok'
  if (utilizationPercent >= 110) status = 'over'
  else if (utilizationPercent >= 90) status = 'warning'

  return { availableMinutes, plannedMinutes, overMinutes, utilizationPercent, status }
}

/** Format minutes as "Xh Ym" or "Xm" */
export function fmtMinutes(mins) {
  if (!mins || mins <= 0) return '0m'
  const h = Math.floor(mins / 60)
  const m = mins % 60
  if (h === 0) return `${m}m`
  if (m === 0) return `${h}h`
  return `${h}h ${m}m`
}
