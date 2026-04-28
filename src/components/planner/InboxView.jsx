import React, { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { format, addDays } from 'date-fns'
import { Inbox, CalendarClock } from 'lucide-react'
import { tasksApi } from '@/lib/api'
import { TaskCard } from '@/components/planner/TaskCard'
import { cn } from '@/lib/utils'
import toast from 'react-hot-toast'

const TODAY = new Date().toISOString().slice(0, 10)
const TOMORROW = addDays(new Date(), 1).toISOString().slice(0, 10)

function PlanSheet({ task, onClose }) {
  const [dueDate, setDueDate] = useState('')
  const [timeBlock, setTimeBlock] = useState('')
  const qc = useQueryClient()

  const { mutate: save, isPending } = useMutation({
    mutationFn: () => tasksApi.update(task.id, {
      due_date: dueDate || undefined,
      time_block: timeBlock || undefined,
    }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['tasks'] }); onClose() },
    onError: () => toast.error('Could not update task'),
  })

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full sm:max-w-sm rounded-t-3xl sm:rounded-3xl bg-background border border-border p-6 space-y-4" onClick={e => e.stopPropagation()}>
        <p className="font-bold text-foreground truncate">{task.title}</p>
        <div className="space-y-3">
          <div>
            <label className="text-xs font-bold text-muted-foreground block mb-1">Due date</label>
            <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)}
              className="w-full rounded-xl border border-border bg-muted/30 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary" />
          </div>
          <div>
            <label className="text-xs font-bold text-muted-foreground block mb-1">Time block</label>
            <select value={timeBlock} onChange={e => setTimeBlock(e.target.value)}
              className="w-full rounded-xl border border-border bg-muted/30 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary">
              <option value="">Unscheduled</option>
              {['after_fajr','morning','after_dhuhr','afternoon','after_asr','evening','after_maghrib','after_isha'].map(b => (
                <option key={b} value={b}>{b.replace(/_/g,' ')}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 rounded-xl border border-border py-2 text-sm font-medium hover:bg-muted">Cancel</button>
          <button onClick={() => save()} disabled={isPending}
            className="flex-1 rounded-xl bg-primary text-primary-foreground py-2 text-sm font-bold disabled:opacity-50">
            {isPending ? 'Saving…' : 'Schedule'}
          </button>
        </div>
      </div>
    </div>
  )
}

export function InboxView({ allTasks, onComplete, onEdit, onDelete, onDefer }) {
  const [planningTask, setPlanningTask] = useState(null)
  const [selected, setSelected] = useState(new Set())
  const qc = useQueryClient()

  const inbox = allTasks.filter(t => !t.due_date && !t.time_block && !t.completed && !t.parent_task_id)

  const toggleSelect = (id) => setSelected(s => {
    const next = new Set(s)
    next.has(id) ? next.delete(id) : next.add(id)
    return next
  })

  const { mutate: bulkUpdate } = useMutation({
    mutationFn: async ({ patch }) => {
      for (const id of selected) await tasksApi.update(id, patch)
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['tasks'] }); setSelected(new Set()) },
  })

  const { mutate: bulkDelete } = useMutation({
    mutationFn: async () => { for (const id of selected) await tasksApi.remove(id) },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['tasks'] }); setSelected(new Set()) },
  })

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
            <Inbox className="h-5 w-5" /> Inbox
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">{inbox.length} unscheduled tasks</p>
        </div>
        {selected.size > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">{selected.size} selected</span>
            <button onClick={() => bulkUpdate({ patch: { due_date: TODAY } })} className="text-xs font-bold text-primary hover:underline">→ Today</button>
            <button onClick={() => bulkUpdate({ patch: { due_date: TOMORROW } })} className="text-xs font-bold text-primary hover:underline">→ Tomorrow</button>
            <button onClick={() => bulkDelete()} className="text-xs font-bold text-destructive hover:underline">Delete</button>
          </div>
        )}
      </div>

      {inbox.length === 0 ? (
        <div className="rounded-3xl border-2 border-dashed border-border/40 p-12 text-center">
          <Inbox className="h-10 w-10 mx-auto text-muted-foreground/30 mb-3" />
          <p className="font-bold text-foreground">Your inbox is clear</p>
          <p className="text-sm text-muted-foreground font-amiri mt-1">مبروك — Well done!</p>
        </div>
      ) : (
        <div className="space-y-2">
          {inbox.map(task => (
            <div key={task.id} className="flex items-start gap-2">
              <input
                type="checkbox"
                checked={selected.has(task.id)}
                onChange={() => toggleSelect(task.id)}
                className="mt-3 h-4 w-4 rounded accent-primary"
              />
              <div className="flex-1 min-w-0">
                <TaskCard
                  task={task}
                  allTasks={allTasks}
                  onComplete={onComplete}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  onDefer={onDefer}
                  showBlock={true}
                />
              </div>
              <button
                onClick={() => setPlanningTask(task)}
                className="mt-3 flex items-center gap-1 text-xs text-primary hover:bg-primary/10 rounded-lg px-2 py-1 shrink-0 font-medium"
              >
                <CalendarClock className="h-3.5 w-3.5" /> Plan
              </button>
            </div>
          ))}
        </div>
      )}

      {planningTask && (
        <PlanSheet task={planningTask} onClose={() => setPlanningTask(null)} />
      )}
    </div>
  )
}
