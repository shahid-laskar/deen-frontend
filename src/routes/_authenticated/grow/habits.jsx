import { createFileRoute, Outlet, Link, useMatchRoute } from '@tanstack/react-router'
import { LayoutGrid, BookOpen, BarChart2, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'

export const Route = createFileRoute('/_authenticated/grow/habits')({
  component: HabitsLayout,
})

const TABS = [
  { to: '/grow/habits/', label: 'Today', icon: LayoutGrid, exact: true },
  { to: '/grow/habits/library', label: 'Library', icon: BookOpen },
  { to: '/grow/habits/analytics', label: 'Analytics', icon: BarChart2 },
  { to: '/grow/habits/dhikr', label: 'Dhikr', icon: Sparkles },
]

function HabitsLayout() {
  const matchRoute = useMatchRoute()

  return (
    <div className="min-h-screen bg-background relative selection:bg-primary/20">
      {/* Ambient background */}
      <div className="fixed inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/5 via-transparent to-transparent -z-10" />

      {/* Sticky tab bar */}
      <div className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-b border-border/50 px-4 py-2 shadow-soft/50">
        <div className="max-w-4xl mx-auto">
          <div className="flex gap-1 overflow-x-auto scrollbar-none">
            {TABS.map(({ to, label, icon: Icon, exact }) => {
              const active = matchRoute({ to, fuzzy: !exact })
              return (
                <Link
                  key={to}
                  to={to}
                  className={cn(
                    'flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all shrink-0',
                    active
                      ? 'bg-primary/10 text-primary shadow-sm'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
                  )}
                >
                  <Icon className="h-3.5 w-3.5" strokeWidth={2.5} />
                  {label}
                </Link>
              )
            })}
          </div>
        </div>
      </div>

      <main className="max-w-4xl mx-auto p-4 md:p-8 pb-32">
        <Outlet />
      </main>
    </div>
  )
}
