import React, { useState, useEffect } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { tasksApi, prayerApi, habitsApi } from '@/lib/api'
import { getPrefs, getLastRitual, getDayNiyyah } from '@/lib/planner/prefs'
import { cn } from '@/lib/utils'
import {
  Sun, Inbox, CalendarDays, Grid3X3, Timer, BarChart2, ListTodo,
} from 'lucide-react'
import { TodayView }      from '@/components/planner/TodayView'
import { InboxView }      from '@/components/planner/InboxView'
import { UpcomingView }   from '@/components/planner/UpcomingView'
import { CalendarView }   from '@/components/planner/CalendarView'
import { MatrixView }     from '@/components/planner/MatrixView'
import { FocusView }      from '@/components/planner/FocusView'
import { ReviewView }     from '@/components/planner/ReviewView'
import { TaskEditModal }  from '@/components/planner/TaskEditModal'
import { FajrOpeningModal } from '@/components/planner/FajrOpeningModal'
import { IshaModal }      from '@/components/planner/IshaModal'
import { ShortcutsHelp } from '@/components/planner/ShortcutsHelp'
import { TemplatePicker } from '@/components/planner/TemplatePicker'
import { materializeTemplates } from '@/lib/planner/recurrence'

export const Route = createFileRoute('/_authenticated/tasks')({
  component: PlannerPage,
})

const TABS = [
  { id: 'today',    label: 'Today',    icon: Sun,          hint: 'g t' },
  { id: 'inbox',    label: 'Inbox',    icon: Inbox,        hint: 'g i' },
  { id: 'upcoming', label: 'Upcoming', icon: ListTodo,     hint: 'g u' },
  { id: 'calendar', label: 'Calendar', icon: CalendarDays, hint: 'g c' },
  { id: 'matrix',   label: 'Matrix',   icon: Grid3X3,      hint: 'g m' },
  { id: 'focus',    label: 'Focus',    icon: Timer,        hint: 'g f' },
  { id: 'review',   label: 'Review',   icon: BarChart2,    hint: 'g r' },
]

const TODAY = new Date().toISOString().slice(0, 10)

function PlannerPage() {
  const [tab, setTab]             = useState(() => getPrefs().lastTab || 'today')
  const [editingId, setEditingId] = useState(null)
  const [showFajr, setShowFajr]   = useState(false)
  const [showIsha, setShowIsha]   = useState(false)
  const [showHelp, setShowHelp]   = useState(false)
  const [showTemplate, setShowTemplate] = useState(false)

  const qc = useQueryClient()
  const initRef = React.useRef(false)
  const [todayLoaded, setTodayLoaded] = useState(false)

  // ── Data queries ─────────────────────────────────────────────────────────
  const { data: todayRaw  = [], isSuccess: isTodayLoaded } = useQuery({
    queryKey: ['tasks', 'today'],
    queryFn: () => tasksApi.today().then(r => r.data ?? []),
  })

  useEffect(() => {
    if (isTodayLoaded) setTodayLoaded(true)
  }, [isTodayLoaded])

  const { data: allRaw = [] } = useQuery({
    queryKey: ['tasks', 'list'],
    queryFn: () => tasksApi.list({ completed: false }).then(r => r.data ?? []),
  })
  const { data: prayerTimes } = useQuery({
    queryKey: ['prayer', 'today'],
    queryFn: () => prayerApi.getTimes({}).then(r => r.data),
    staleTime: 1000 * 60 * 60,
  })
  const { data: prayerSummary } = useQuery({
    queryKey: ['prayer', 'summary'],
    queryFn: () => prayerApi.getTodaySummary().then(r => r.data),
  })
  const { data: habits = [] } = useQuery({
    queryKey: ['habits', 'list'],
    queryFn: () => habitsApi.list().then(r => (Array.isArray(r) ? r : r.data ?? [])),
    staleTime: 1000 * 60 * 5,
  })


  useEffect(() => {
    if (initRef.current || !todayLoaded) return
    initRef.current = true

    // 1. Materialize templates
    materializeTemplates((payload) => tasksApi.create(payload), todayRaw).then(() => {
      qc.invalidateQueries({ queryKey: ['tasks'] })
    })

    // 2. Auto-trigger rituals
    const ritual = getLastRitual(TODAY)
    if (!ritual) {
      const t = setTimeout(() => setShowFajr(true), 2000)
      return () => clearTimeout(t)
    } else if (ritual === 'fajr' && prayerTimes?.Maghrib) {
      const now = new Date()
      const [h, m] = prayerTimes.Maghrib.split(':').map(Number)
      const maghribDate = new Date(now)
      maghribDate.setHours(h, m, 0, 0)
      
      if (now > maghribDate) {
        const t = setTimeout(() => setShowIsha(true), 2000)
        return () => clearTimeout(t)
      }
    }
  }, [todayLoaded, todayRaw, qc, prayerTimes])

  // ── Global keyboard shortcuts ─────────────────────────────────────────────
  useEffect(() => {
    let gPressed = false
    let gTimer   = null
    const NAV = { t:'today', i:'inbox', u:'upcoming', c:'calendar', m:'matrix', f:'focus', r:'review' }

    const handler = (e) => {
      const tag = document.activeElement?.tagName
      if (['INPUT','TEXTAREA','SELECT'].includes(tag)) return

      // g-prefix navigation
      if (e.key === 'g' && !e.shiftKey) {
        gPressed = true
        gTimer = setTimeout(() => { gPressed = false }, 500)
        return
      }
      if (gPressed && NAV[e.key]) {
        setTab(NAV[e.key])
        gPressed = false
        clearTimeout(gTimer)
        return
      }

      // Single-key shortcuts
      if (e.key === '?')              { setShowHelp(h => !h); return }
      if (e.key === 'F' && e.shiftKey){ setShowFajr(true);    return }
      if (e.key === 'I' && e.shiftKey){ setShowIsha(true);    return }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])


  // ── Mutations ─────────────────────────────────────────────────────────────
  const { mutate: completeTask } = useMutation({
    mutationFn: (id) => tasksApi.complete(id),
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: ['tasks'] })
      const prev = qc.getQueryData(['tasks', 'today'])
      qc.setQueryData(['tasks', 'today'], old =>
        (old || []).map(t => t.id === id ? { ...t, completed: true } : t)
      )
      return { prev }
    },
    onError: (_, __, ctx) => qc.setQueryData(['tasks', 'today'], ctx?.prev),
    onSettled: () => qc.invalidateQueries({ queryKey: ['tasks'] }),
  })

  const { mutate: deleteTask } = useMutation({
    mutationFn: (id) => tasksApi.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tasks'] }),
  })

  const { mutate: updateTask } = useMutation({
    mutationFn: ({ id, patch }) => tasksApi.update(id, patch),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tasks'] }),
  })

  const deferTask = (id) => updateTask({ id, patch: { due_date: null, time_block: null } })

  const shared = {
    todayTasks:  todayRaw,
    allTasks:    allRaw,
    prayerTimes,
    prayerSummary,
    habits,
    onComplete:  completeTask,
    onDelete:    deleteTask,
    onDefer:     deferTask,
    onUpdate:    updateTask,
    onEdit:      setEditingId,
    onCreateSub: (parentId) => setEditingId(`new:${parentId}`),
  }

  const niyyah = getDayNiyyah(TODAY)

  return (
    <div className="flex flex-col h-full">
      {/* Sub-nav */}
      <div className="border-b border-border/50 bg-background/80 backdrop-blur-sm px-2 md:px-4 shrink-0">
        <div className="flex overflow-x-auto scrollbar-none gap-0.5 max-w-5xl mx-auto">
          {TABS.map(({ id, label, icon: Icon, hint }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              title={`${label} (${hint})`}
              className={cn(
                'group flex items-center gap-1.5 px-3 py-3 text-xs font-semibold whitespace-nowrap border-b-2 transition-all',
                tab === id
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border/60',
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">{label}</span>
              <kbd className="ml-1 hidden group-hover:inline-block text-[9px] font-mono bg-muted px-1 py-0.5 rounded opacity-60">
                {hint}
              </kbd>
            </button>
          ))}

          {/* Template launcher */}
          <button
            onClick={() => setShowTemplate(true)}
            className="ml-auto flex items-center gap-1 px-3 py-3 text-xs text-muted-foreground hover:text-foreground whitespace-nowrap"
            title="Start from template"
          >
            ⋯ Templates
          </button>
        </div>
      </div>

      {/* View */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-5xl mx-auto px-3 md:px-6 py-5 md:py-6">
          {tab === 'today'    && <TodayView    {...shared} onOpenFajr={() => setShowFajr(true)} onOpenIsha={() => setShowIsha(true)} />}
          {tab === 'inbox'    && <InboxView    {...shared} />}
          {tab === 'upcoming' && <UpcomingView {...shared} />}
          {tab === 'calendar' && <CalendarView {...shared} />}
          {tab === 'matrix'   && <MatrixView   {...shared} />}
          {tab === 'focus'    && <FocusView    {...shared} />}
          {tab === 'review'   && <ReviewView   {...shared} />}
        </div>
      </div>

      {/* Modals */}
      {editingId && (
        <TaskEditModal taskId={editingId} habits={habits} onClose={() => setEditingId(null)} />
      )}
      {showFajr && (
        <FajrOpeningModal prayerTimes={prayerTimes} onClose={() => setShowFajr(false)} />
      )}
      {showIsha && (
        <IshaModal todayTasks={todayRaw} niyyah={niyyah} onClose={() => setShowIsha(false)} />
      )}
      {showHelp && (
        <ShortcutsHelp onClose={() => setShowHelp(false)} />
      )}
      {showTemplate && (
        <TemplatePicker onClose={() => setShowTemplate(false)} />
      )}
    </div>
  )
}
