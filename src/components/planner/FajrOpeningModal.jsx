import React, { useState, useEffect } from 'react'
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query'
import { format, subDays } from 'date-fns'
import { X, MoveRight, Trash2, CalendarPlus, Moon } from 'lucide-react'
import { tasksApi, habitsApi } from '@/lib/api'
import { setDayNiyyah, setLastRitual, setWeekNiyyah } from '@/lib/planner/prefs'
import { BLOCK_META } from '@/lib/planner/prayer-blocks'
import { cn } from '@/lib/utils'
import toast from 'react-hot-toast'

const TODAY = new Date().toISOString().slice(0, 10)
const YESTERDAY = subDays(new Date(), 1).toISOString().slice(0, 10)
const IS_SUNDAY = new Date().getDay() === 0

const NIYYAH_SUGGESTIONS = [
  'Providing for my family',
  'Seeking Allah\'s pleasure',
  'Fulfilling a trust',
  'Seeking knowledge',
]

function StepIndicator({ current, total }) {
  return (
    <div className="flex items-center justify-center gap-1.5">
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          className={cn(
            'h-1.5 rounded-full transition-all',
            i === current ? 'w-6 bg-primary' : i < current ? 'w-3 bg-primary/50' : 'w-3 bg-muted',
          )}
        />
      ))}
    </div>
  )
}

// Step 1 — Murajaa: review yesterday's incomplete tasks
function MurajaaStep({ onDone }) {
  const qc = useQueryClient()
  const { data: yesterdayTasks = [], isLoading } = useQuery({
    queryKey: ['tasks', 'yesterday-incomplete'],
    queryFn: () => tasksApi.list({ due_date: YESTERDAY, completed: false }).then(r => r.data ?? []),
  })

  const { mutate: carryToToday } = useMutation({
    mutationFn: (id) => tasksApi.update(id, { due_date: TODAY }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tasks'] }),
  })
  const { mutate: moveToInbox } = useMutation({
    mutationFn: (id) => tasksApi.update(id, { due_date: null, time_block: null }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tasks'] }),
  })
  const { mutate: remove } = useMutation({
    mutationFn: (id) => tasksApi.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tasks'] }),
  })

  if (isLoading) return <div className="py-8 text-center text-muted-foreground">Loading…</div>

  if (yesterdayTasks.length === 0) {
    return (
      <div className="py-8 text-center space-y-3">
        <p className="text-4xl">✅</p>
        <p className="font-bold text-foreground">No incomplete tasks from yesterday</p>
        <p className="text-sm text-muted-foreground">MashaaAllah — a clean slate!</p>
        <button onClick={onDone} className="mt-2 rounded-xl bg-primary text-primary-foreground px-6 py-2 text-sm font-bold">Next →</button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">{yesterdayTasks.length} tasks from yesterday — what to do with each?</p>
      <div className="space-y-2 max-h-64 overflow-y-auto">
        {yesterdayTasks.map(task => (
          <div key={task.id} className="flex items-center gap-2 p-3 rounded-xl bg-muted/40 border border-border/50">
            <p className="flex-1 text-sm font-medium truncate">{task.title}</p>
            <div className="flex items-center gap-1 shrink-0">
              <button onClick={() => carryToToday(task.id)} title="Carry to today"
                className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-500/10 text-xs font-bold">
                <CalendarPlus className="h-4 w-4" />
              </button>
              <button onClick={() => moveToInbox(task.id)} title="Move to inbox"
                className="p-1.5 rounded-lg text-blue-500 hover:bg-blue-500/10">
                <MoveRight className="h-4 w-4" />
              </button>
              <button onClick={() => remove(task.id)} title="Remove"
                className="p-1.5 rounded-lg text-destructive hover:bg-destructive/10">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
      <button onClick={onDone} className="w-full rounded-xl bg-primary text-primary-foreground py-2.5 text-sm font-bold">Next →</button>
    </div>
  )
}

// Step 2 — Niyyah
function NiyyahStep({ onDone }) {
  const [niyyah, setNiyyahText] = useState('')

  const save = () => {
    setDayNiyyah(TODAY, niyyah.trim() || 'Seeking Allah\'s pleasure')
    if (IS_SUNDAY) setWeekNiyyah(niyyah.trim() || 'Seeking Allah\'s pleasure')
    onDone()
  }

  return (
    <div className="space-y-4">
      <div className="text-center space-y-1">
        <p className="font-amiri text-xl text-amber-500">النية</p>
        <p className="text-sm text-muted-foreground">What is your intention for today?</p>
      </div>
      <textarea
        value={niyyah}
        onChange={e => setNiyyahText(e.target.value)}
        placeholder="I intend to…"
        rows={3}
        className="w-full rounded-xl border border-border bg-muted/30 px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary resize-none"
        autoFocus
      />
      <div className="flex flex-wrap gap-1.5">
        {NIYYAH_SUGGESTIONS.map(s => (
          <button key={s} onClick={() => setNiyyahText(s)}
            className="text-[11px] px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-300 hover:bg-amber-500/20 font-medium">
            {s}
          </button>
        ))}
      </div>
      <button onClick={save} className="w-full rounded-xl bg-primary text-primary-foreground py-2.5 text-sm font-bold">
        Set intention →
      </button>
    </div>
  )
}

// Step 3 — Ihtisar: pick from inbox
function IhtisarStep({ onDone, selectedIds, setSelectedIds }) {
  const { data: inbox = [] } = useQuery({
    queryKey: ['tasks', 'inbox-planning'],
    queryFn: () => tasksApi.list({ completed: false }).then(r =>
      (r.data ?? []).filter(t => !t.due_date && !t.time_block)
    ),
  })
  const { data: habits = [] } = useQuery({
    queryKey: ['habits', 'list'],
    queryFn: () => habitsApi.list().then(r => Array.isArray(r) ? r : r.data ?? []),
  })

  const toggle = (id) => setSelectedIds(s => {
    const n = new Set(s)
    n.has(id) ? n.delete(id) : n.add(id)
    return n
  })

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">Select tasks from your inbox to plan today</p>
      <div className="max-h-52 overflow-y-auto space-y-1.5">
        {inbox.length === 0 ? (
          <p className="text-sm text-muted-foreground italic text-center py-4">Inbox is empty</p>
        ) : inbox.map(task => (
          <label key={task.id} className={cn(
            'flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all',
            selectedIds.has(task.id) ? 'border-primary bg-primary/8' : 'border-border/50 bg-muted/30 hover:bg-muted/50',
          )}>
            <input type="checkbox" checked={selectedIds.has(task.id)} onChange={() => toggle(task.id)} className="accent-primary" />
            <span className="text-sm font-medium">{task.title}</span>
          </label>
        ))}
      </div>
      {habits.length > 0 && (
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1.5">Habits with today's target</p>
          {habits.slice(0,5).map(h => (
            <div key={h.id} className="flex items-center gap-2 py-1.5 text-sm text-muted-foreground">
              <Moon className="h-3.5 w-3.5 text-primary" />
              <span>{h.title}</span>
              {h.streak > 0 && <span className="text-amber-500 text-xs">🔥{h.streak}</span>}
            </div>
          ))}
        </div>
      )}
      <button onClick={onDone} className="w-full rounded-xl bg-primary text-primary-foreground py-2.5 text-sm font-bold">
        Next ({selectedIds.size} selected) →
      </button>
    </div>
  )
}

// Step 4 — Tawzi: assign to blocks
function TawziStep({ selectedIds, onDone }) {
  const qc = useQueryClient()
  const { data: allTasks = [] } = useQuery({
    queryKey: ['tasks', 'inbox-planning'],
    queryFn: () => tasksApi.list({ completed: false }).then(r => (r.data ?? []).filter(t => !t.due_date && !t.time_block)),
  })
  const selectedTasks = allTasks.filter(t => selectedIds.has(t.id))
  const [assignments, setAssignments] = useState({})

  const { mutate: assignAll, isPending } = useMutation({
    mutationFn: async () => {
      for (const [id, block] of Object.entries(assignments)) {
        await tasksApi.update(id, { time_block: block, due_date: TODAY })
      }
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['tasks'] }); onDone() },
  })

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">Assign tasks to prayer blocks</p>
      <div className="space-y-2 max-h-64 overflow-y-auto">
        {selectedTasks.map(task => (
          <div key={task.id} className="flex items-center gap-2 p-2 rounded-xl bg-muted/30 border border-border/50">
            <p className="flex-1 text-sm font-medium truncate">{task.title}</p>
            <select
              value={assignments[task.id] || ''}
              onChange={e => setAssignments(a => ({ ...a, [task.id]: e.target.value }))}
              className="text-xs rounded-lg border border-border bg-background px-2 py-1 focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="">Unscheduled</option>
              {BLOCK_META.map(b => <option key={b.key} value={b.key}>{b.label}</option>)}
            </select>
          </div>
        ))}
      </div>
      <button onClick={() => assignAll()} disabled={isPending}
        className="w-full rounded-xl bg-primary text-primary-foreground py-2.5 text-sm font-bold disabled:opacity-50">
        {isPending ? 'Saving…' : 'Assign & continue →'}
      </button>
    </div>
  )
}

// Step 5 — Muqadara: capacity summary
function MuqadaraStep({ onDone, prayerTimes }) {
  const { data: todayTasks = [] } = useQuery({
    queryKey: ['tasks', 'today'],
    queryFn: () => tasksApi.today().then(r => r.data ?? []),
  })
  const planned = todayTasks.reduce((s, t) => s + (t.estimated_minutes || 0), 0)

  return (
    <div className="space-y-4 text-center">
      <p className="text-4xl">🌅</p>
      <div>
        <p className="font-bold text-foreground text-lg">Your day is planned</p>
        <p className="text-sm text-muted-foreground mt-1">
          {todayTasks.length} tasks · {planned} minutes planned
        </p>
      </div>
      <p className="font-amiri text-base text-amber-500">
        اللهم بارك لنا في أوقاتنا
      </p>
      <p className="text-xs text-muted-foreground italic">
        "O Allah, bless us in our time"
      </p>
      <button
        onClick={() => { setLastRitual(TODAY, 'fajr'); onDone() }}
        className="w-full rounded-xl bg-emerald-500 text-white py-3 text-sm font-bold hover:opacity-90"
      >
        بِسْمِ اللَّهِ — Start my day
      </button>
    </div>
  )
}

const STEPS = ['Murajaa', 'Niyyah', 'Ihtisar', 'Tawzi', 'Muqadara']

export function FajrOpeningModal({ prayerTimes, onClose }) {
  const [step, setStep] = useState(0)
  const [selectedIds, setSelectedIds] = useState(new Set())

  const next = () => setStep(s => Math.min(s + 1, STEPS.length - 1))

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full sm:max-w-lg rounded-t-3xl sm:rounded-3xl bg-background border border-border shadow-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-3">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-amber-500">
              Morning Planning — الفجر
            </p>
            <h2 className="font-bold text-lg text-foreground">{STEPS[step]}</h2>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-muted"><X className="h-4 w-4" /></button>
        </div>

        <div className="px-2 pb-2">
          <StepIndicator current={step} total={STEPS.length} />
        </div>

        <div className="px-6 pb-6 pt-3">
          {step === 0 && <MurajaaStep onDone={next} />}
          {step === 1 && <NiyyahStep onDone={next} />}
          {step === 2 && <IhtisarStep onDone={next} selectedIds={selectedIds} setSelectedIds={setSelectedIds} />}
          {step === 3 && <TawziStep selectedIds={selectedIds} onDone={next} />}
          {step === 4 && <MuqadaraStep onDone={onClose} prayerTimes={prayerTimes} />}
        </div>
      </div>
    </div>
  )
}
