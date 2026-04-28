import { BookOpen, Brain, BarChart3, Hand, Quote, Search, Bookmark, Mic } from 'lucide-react'
import { Link, useRouterState } from '@tanstack/react-router'

const TABS = [
  { to: '/worship/quran',           label: 'Browse',    icon: BookOpen,  exact: true },
  { to: '/worship/quran/search',    label: 'Search',    icon: Search },
  { to: '/worship/quran/bookmarks', label: 'Bookmarks', icon: Bookmark },
  { to: '/worship/quran/hifz',      label: 'Hifz',      icon: Brain },
  { to: '/worship/quran/stats',     label: 'Stats',     icon: BarChart3 },
  { to: '/worship/quran/duas',      label: 'Duas',      icon: Hand },
  { to: '/worship/quran/hadith',    label: 'Hadith',    icon: Quote },
  { to: '/worship/quran/practice',  label: 'Practice',  icon: Mic },
]

export function QuranTabs() {
  const { location } = useRouterState()
  const pathname = location.pathname

  return (
    <div className="overflow-x-auto -mx-4 px-4 md:mx-0 md:px-0 scrollbar-none">
      <div className="flex gap-1 min-w-max bg-muted/40 rounded-2xl p-1">
        {TABS.map((t) => {
          const active = t.exact ? pathname === t.to : (
            pathname.startsWith(t.to) && t.to !== '/worship/quran'
          ) || (t.to === '/worship/quran' && pathname === '/worship/quran')
          const Icon = t.icon
          return (
            <Link
              key={t.to}
              to={t.to}
              className={`flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-bold transition-all whitespace-nowrap ${
                active
                  ? 'bg-background text-primary shadow-soft'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              {t.label}
            </Link>
          )
        })}
      </div>
    </div>
  )
}
