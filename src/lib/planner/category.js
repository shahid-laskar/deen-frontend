/**
 * Category metadata for the Islamic Planner.
 * Maps each TaskCategory to display label, Tailwind colour token, and Lucide icon name.
 */

export const CATEGORY_META = {
  work:     { label: 'Work',     color: 'blue',    icon: 'Briefcase'   },
  personal: { label: 'Personal', color: 'violet',  icon: 'User'        },
  ibadah:   { label: 'Ibadah',   color: 'emerald', icon: 'Moon'        },
  family:   { label: 'Family',   color: 'rose',    icon: 'Heart'       },
  health:   { label: 'Health',   color: 'amber',   icon: 'Activity'    },
  learning: { label: 'Learning', color: 'sky',     icon: 'BookOpen'    },
  errand:   { label: 'Errand',   color: 'zinc',    icon: 'ShoppingBag' },
}

// Returns the Tailwind colour token string (e.g. "blue") for use in bg- and text- classes
export function categoryColor(cat) {
  return CATEGORY_META[cat]?.color ?? 'zinc'
}

/** Returns the full Tailwind bg class for a category */
export function categoryBg(cat) {
  const color = categoryColor(cat)
  const map = {
    blue:    'bg-blue-500/15 text-blue-700 dark:text-blue-300',
    violet:  'bg-violet-500/15 text-violet-700 dark:text-violet-300',
    emerald: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300',
    rose:    'bg-rose-500/15 text-rose-700 dark:text-rose-300',
    amber:   'bg-amber-500/15 text-amber-700 dark:text-amber-300',
    sky:     'bg-sky-500/15 text-sky-700 dark:text-sky-300',
    zinc:    'bg-zinc-500/15 text-zinc-700 dark:text-zinc-300',
  }
  return map[color] ?? map.zinc
}

/** Returns a dot colour class for calendar pips */
export function categoryDot(cat) {
  const color = categoryColor(cat)
  const map = {
    blue:    'bg-blue-500',
    violet:  'bg-violet-500',
    emerald: 'bg-emerald-500',
    rose:    'bg-rose-500',
    amber:   'bg-amber-500',
    sky:     'bg-sky-500',
    zinc:    'bg-zinc-400',
  }
  return map[color] ?? map.zinc
}
