/**
 * Client-side recurrence template system.
 * Templates are stored in localStorage under "planner:templates".
 */

const STORAGE_KEY = 'planner:templates'

function loadTemplates() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch { return [] }
}

function saveTemplates(templates) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(templates)) } catch {}
}

export function getTemplates() {
  return loadTemplates()
}

export function saveTemplate(template) {
  const templates = loadTemplates()
  const idx = templates.findIndex(t => t.id === template.id)
  if (idx >= 0) {
    templates[idx] = template
  } else {
    templates.push(template)
  }
  saveTemplates(templates)
}

export function deleteTemplate(id) {
  const templates = loadTemplates().filter(t => t.id !== id)
  saveTemplates(templates)
}

/**
 * Determines if a template should fire today.
 * rrule format:
 *   'DAILY'           → every day
 *   'WEEKLY:1,3,5'    → Mon/Wed/Fri (JS day numbers, 0=Sun)
 *   'MONTHLY:1'       → 1st of month
 */
function templateMatchesToday(template) {
  const today = new Date()
  const dayOfWeek = today.getDay()   // 0=Sun
  const dayOfMonth = today.getDate()
  const { rrule } = template

  if (rrule === 'DAILY') return true

  if (rrule.startsWith('WEEKLY:')) {
    const days = rrule.slice(7).split(',').map(Number)
    return days.includes(dayOfWeek)
  }

  if (rrule.startsWith('MONTHLY:')) {
    const day = Number(rrule.slice(8))
    return dayOfMonth === day
  }

  return false
}

/**
 * Called once on app load. Creates tasks for templates whose rrule matches
 * today, provided no task with the same title already exists for today's date.
 *
 * @param {(payload: object) => Promise<object>} createTask
 * @param {Array} existingTodayTasks
 */
export async function materializeTemplates(createTask, existingTodayTasks = []) {
  const templates = loadTemplates()
  const todayStr = new Date().toISOString().slice(0, 10)
  const existingTitles = new Set(existingTodayTasks.map(t => t.title.toLowerCase()))

  for (const template of templates) {
    if (!templateMatchesToday(template)) continue
    if (existingTitles.has(template.title.toLowerCase())) continue

    try {
      const payload = {
        title: template.title,
        category: template.category,
        priority: template.priority || 'medium',
        time_block: template.time_block,
        estimated_minutes: template.estimated_minutes,
        islamic_context: template.islamic_context,
        linked_habit_id: template.linked_habit_id,
        due_date: todayStr,
      }
      await createTask(payload)
    } catch {
      // Silent — don't break app load
    }
  }
}
