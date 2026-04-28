/**
 * Natural-language quick-add parser.
 * Pure function — no side effects.
 *
 * Token grammar (left-to-right, greedy):
 *   p1/p2/p3/p4         → priority urgent/high/medium/low
 *   !urgent             → is_urgent = true
 *   *important          → is_important = true
 *   #<category>         → category (fuzzy match on first 3 chars)
 *   ~<N>m / ~<N>h       → estimated_minutes N / N*60
 *   @today / @tomorrow / @<weekday-prefix>  → due_date
 *   after_fajr / morning / after_dhuhr / afternoon /
 *   after_asr / evening / after_maghrib / after_isha  → time_block
 *
 * Title is all remaining text after tokens are stripped, trimmed.
 * If no tokens are found, returns { title: input.trim() }.
 * Never throws.
 */

const CATEGORIES = ['work', 'personal', 'ibadah', 'family', 'health', 'learning', 'errand']
const TIME_BLOCKS = [
  'after_fajr', 'morning', 'after_dhuhr', 'afternoon',
  'after_asr', 'evening', 'after_maghrib', 'after_isha',
]
const WEEKDAYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat']

function addDays(date, days) {
  const d = new Date(date)
  d.setDate(d.getDate() + days)
  return d.toISOString().slice(0, 10)
}

function toDateString(date) {
  return date.toISOString().slice(0, 10)
}

function resolveDueDate(token) {
  const today = new Date()
  const t = token.toLowerCase()
  if (t === '@today') return toDateString(today)
  if (t === '@tomorrow') return addDays(today, 1)
  // weekday prefix e.g. @mon, @fri
  const prefix = t.slice(1, 4) // strip @
  const idx = WEEKDAYS.findIndex(d => d === prefix)
  if (idx !== -1) {
    const todayDay = today.getDay()
    let diff = idx - todayDay
    if (diff <= 0) diff += 7
    return addDays(today, diff)
  }
  return null
}

/**
 * @param {string} input
 * @returns {{ title: string, priority?: string, category?: string,
 *             estimated_minutes?: number, time_block?: string,
 *             due_date?: string, is_urgent?: boolean, is_important?: boolean }}
 */
export function parseQuickAdd(input) {
  if (!input || !input.trim()) return { title: '' }

  const result = { title: '' }
  let remaining = input.trim()

  // Tokenise by splitting on spaces but keeping multi-word time_blocks intact
  // We do a single-pass regex approach
  const tokens = []
  // TIME_BLOCKS with underscores need to be matched as single tokens
  // Replace time block strings first
  for (const tb of TIME_BLOCKS) {
    if (remaining.toLowerCase().includes(tb)) {
      result.time_block = tb
      remaining = remaining.replace(new RegExp(tb, 'gi'), ' ')
    }
  }

  const words = remaining.trim().split(/\s+/)
  const titleWords = []

  for (const word of words) {
    const w = word.toLowerCase()

    // Priority tokens
    if (w === 'p1') { result.priority = 'urgent'; continue }
    if (w === 'p2') { result.priority = 'high'; continue }
    if (w === 'p3') { result.priority = 'medium'; continue }
    if (w === 'p4') { result.priority = 'low'; continue }

    // Urgent / important flags
    if (w === '!urgent') { result.is_urgent = true; continue }
    if (w === '*important') { result.is_important = true; continue }

    // Category: #<cat> fuzzy on first 3 chars
    if (w.startsWith('#')) {
      const slug = w.slice(1).toLowerCase()
      const match = CATEGORIES.find(c => c.startsWith(slug.slice(0, 3)))
      if (match) { result.category = match; continue }
    }

    // Duration: ~<N>m or ~<N>h
    if (w.startsWith('~')) {
      const durStr = w.slice(1)
      if (durStr.endsWith('h')) {
        const h = parseFloat(durStr)
        if (!isNaN(h)) { result.estimated_minutes = Math.round(h * 60); continue }
      }
      if (durStr.endsWith('m')) {
        const m = parseFloat(durStr)
        if (!isNaN(m)) { result.estimated_minutes = Math.round(m); continue }
      }
    }

    // Due date: @today, @tomorrow, @<weekday>
    if (w.startsWith('@')) {
      const date = resolveDueDate(w)
      if (date) { result.due_date = date; continue }
    }

    // Not a token — part of the title
    titleWords.push(word)
  }

  result.title = titleWords.join(' ').trim()
  return result
}

/**
 * Returns an array of human-readable chip descriptions for parsed fields.
 * e.g. ["📅 today", "⚡ high", "⏱ 25m", "🌙 ibadah"]
 */
export function describeTokens(parsed) {
  const chips = []
  if (parsed.due_date) {
    const today = new Date().toISOString().slice(0, 10)
    const tomorrow = addDays(new Date(), 1)
    const label = parsed.due_date === today ? 'today'
      : parsed.due_date === tomorrow ? 'tomorrow'
      : parsed.due_date
    chips.push(`📅 ${label}`)
  }
  if (parsed.priority) {
    const icons = { urgent: '🔴', high: '🟠', medium: '🔵', low: '⚪' }
    chips.push(`${icons[parsed.priority] ?? '•'} ${parsed.priority}`)
  }
  if (parsed.estimated_minutes) chips.push(`⏱ ${parsed.estimated_minutes}m`)
  if (parsed.category) {
    const icons = { ibadah: '🌙', work: '💼', personal: '👤', family: '❤️', health: '🏃', learning: '📖', errand: '🛒' }
    chips.push(`${icons[parsed.category] ?? '#'} ${parsed.category}`)
  }
  if (parsed.time_block) chips.push(`🕐 ${parsed.time_block.replace(/_/g, ' ')}`)
  if (parsed.is_urgent) chips.push('⚡ urgent')
  if (parsed.is_important) chips.push('★ important')
  return chips
}
