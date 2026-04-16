import React, { useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { format } from 'date-fns'
import { Plus, CheckSquare, Check, Trash2, Clock, Grid3X3, Layers } from 'lucide-react'
import { tasksApi } from '@/lib/api'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/compat'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import toast from 'react-hot-toast'

export const Route = createFileRoute('/_authenticated/tasks')({
  component: TasksPage,
})

const TIME_BLOCKS = [
  { key: 'after_fajr', label: 'After Fajr', icon: '🌅', desc: 'The blessed morning hours' },
  { key: 'morning', label: 'Morning', icon: '☀️', desc: '8am — 12pm' },
  { key: 'after_dhuhr', label: 'After Dhuhr', icon: '🕐', desc: 'Post-Dhuhr window' },
  { key: 'afternoon', label: 'Afternoon', icon: '🌤️', desc: '2pm — Asr' },
  { key: 'after_asr', label: 'After Asr', icon: '🌆', desc: 'After Asr prayer' },
  { key: 'evening', label: 'Evening', icon: '🌙', desc: 'Maghrib — Isha' },
  { key: 'after_isha', label: 'After Isha', icon: '⭐', desc: 'Night time' },
  { key: null, label: 'Unscheduled', icon: '📋', desc: '' },
]

const PRIORITY_COLORS = {
  urgent: 'border-l-destructive',
  high: 'border-l-orange-500',
  medium: 'border-l-primary',
  low: 'border-l-muted-foreground/30',
}

const QUADRANTS = [
  { id: 'do', label: 'Do First', subtitle: 'Urgent + Important', color: 'text-destructive', bg: 'bg-destructive/10', border: 'border-destructive/30', emoji: '🔥', filter: t => t.priority === 'urgent' },
  { id: 'schedule', label: 'Schedule', subtitle: 'Not Urgent + Important', color: 'text-orange-500', bg: 'bg-orange-500/10', border: 'border-orange-500/30', emoji: '📅', filter: t => t.priority === 'high' },
  { id: 'delegate', label: 'Delegate', subtitle: 'Urgent + Not Important', color: 'text-primary', bg: 'bg-primary/10', border: 'border-primary/30', emoji: '🤝', filter: t => t.priority === 'medium' },
  { id: 'eliminate', label: 'Eliminate', subtitle: 'Not Urgent + Not Important', color: 'text-muted-foreground', bg: 'bg-muted', border: 'border-border', emoji: '🗑️', filter: t => t.priority === 'low' },
]

function TaskItem({ task, onComplete, onDelete }) {
  return (
    <div className={cn('group flex items-center gap-3 px-4 py-3 rounded-xl border border-l-4 bg-card transition-all', task.completed ? 'opacity-50 border-l-border bg-muted/50' : PRIORITY_COLORS[task.priority], !task.completed && 'hover:shadow-sm')}>
      <button onClick={() => onComplete(task.id)} disabled={task.completed} className={cn('w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all', task.completed ? 'bg-primary border-primary text-primary-foreground' : 'border-muted-foreground hover:border-primary')}>
        {task.completed && <Check className="h-3 w-3" />}
      </button>
      <div className="flex-1 min-w-0">
        <p className={cn('text-sm font-medium truncate', task.completed ? 'line-through text-muted-foreground' : 'text-foreground')}>{task.title}</p>
        {task.description && <p className="text-xs text-muted-foreground truncate">{task.description}</p>}
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {task.estimated_minutes && <span className="text-xs text-muted-foreground flex items-center gap-1"><Clock className="h-3 w-3" />{task.estimated_minutes}m</span>}
        <Badge variant="muted" className="text-[10px] uppercase font-bold tracking-wider hidden sm:inline-flex">{task.priority}</Badge>
        <button onClick={() => onDelete(task.id)} className="opacity-0 group-hover:opacity-100 p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-md transition-all">
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  )
}

function EisenhowerMatrix({ tasks, onComplete, onDelete }) {
  return (
    <div className="space-y-4">
      <div className="p-3 rounded-xl bg-orange-500/10 border border-orange-500/20 text-xs text-orange-700 dark:text-orange-300">
        <p><strong>Sort tasks by priority:</strong> <span className="text-destructive font-medium">Urgent</span> → Do First, <span className="text-orange-500 font-medium whitespace-nowrap">High</span> → Schedule, <span className="text-primary font-medium">Medium</span> → Delegate, <span className="text-muted-foreground font-medium">Low</span> → Eliminate.</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {QUADRANTS.map(q => {
          const qTasks = tasks?.filter(t => !t.completed && q.filter(t)) || []
          return (
            <div key={q.id} className={cn('rounded-2xl p-4 border min-h-[140px]', q.bg, q.border)}>
              <div className="mb-3">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-lg">{q.emoji}</span>
                  <p className={cn('font-semibold text-sm', q.color)}>{q.label}</p>
                </div>
                <p className="text-[10px] text-muted-foreground uppercase tracking-widest">{q.subtitle}</p>
              </div>
              {qTasks.length === 0 ? (
                <p className="text-xs text-muted-foreground italic mt-4 text-center">No tasks here</p>
              ) : (
                <div className="space-y-2">
                  {qTasks.slice(0, 4).map(task => (
                    <div key={task.id} className="group flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-background/60 border border-border/50 text-xs">
                      <button onClick={() => onComplete(task.id)} className={cn('w-4 h-4 rounded-full border flex shrink-0', q.color.replace('text-', 'border-').replace('text-muted-foreground', 'border-muted-foreground'))} />
                      <p className="font-medium text-foreground truncate flex-1">{task.title}</p>
                      <button onClick={() => onDelete(task.id)} className="opacity-0 group-hover:opacity-100 p-1 text-muted-foreground hover:text-destructive"><Trash2 className="h-3 w-3" /></button>
                    </div>
                  ))}
                  {qTasks.length > 4 && <p className="text-[10px] text-muted-foreground text-center font-medium">+{qTasks.length - 4} more</p>}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

function TasksPage() {
  const qc = useQueryClient()
  const [modalOpen, setModalOpen] = useState(false)
  const [viewMode, setViewMode] = useState('today')
  const [form, setForm] = useState({ title: '', description: '', priority: 'medium', category: 'personal', due_date: format(new Date(), 'yyyy-MM-dd'), time_block: '', estimated_minutes: '' })

  const { data: todayTasks, isLoading } = useQuery({ queryKey: ['tasks', 'today'], queryFn: () => tasksApi.today().then(r => r.data), enabled: viewMode === 'today' })
  const { data: allTasks, isLoading: allLoading } = useQuery({ queryKey: ['tasks', 'all'], queryFn: () => tasksApi.list({ completed: false }).then(r => r.data), enabled: viewMode !== 'today' })

  const tasks = viewMode === 'today' ? todayTasks : allTasks
  const loading = viewMode === 'today' ? isLoading : allLoading

  const { mutate: createTask, isPending } = useMutation({
    mutationFn: () => tasksApi.create({ ...form, estimated_minutes: form.estimated_minutes ? parseInt(form.estimated_minutes) : null }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['tasks'] }); setModalOpen(false); resetForm(); toast.success('Task added!') },
  })
  const { mutate: completeTask } = useMutation({ mutationFn: (id) => tasksApi.complete(id), onSuccess: () => { qc.invalidateQueries({ queryKey: ['tasks'] }); toast.success('Task completed! MashaaAllah 🌙') } })
  const { mutate: deleteTask } = useMutation({ mutationFn: (id) => tasksApi.delete(id), onSuccess: () => qc.invalidateQueries({ queryKey: ['tasks'] }) })
  
  const resetForm = () => setForm({ title: '', description: '', priority: 'medium', category: 'personal', due_date: format(new Date(), 'yyyy-MM-dd'), time_block: '', estimated_minutes: '' })

  const grouped = {}
  tasks?.forEach(t => { const key = t.time_block || 'unscheduled'; if (!grouped[key]) grouped[key] = []; grouped[key].push(t) })
  const completedCount = tasks?.filter(t => t.completed).length || 0
  const totalCount = tasks?.length || 0

  return (
    <div className="p-4 md:p-8 max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Planner</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{completedCount}/{totalCount} tasks done</p>
        </div>
        <Button onClick={() => { resetForm(); setModalOpen(true) }}><Plus className="h-4 w-4 mr-1.5" /> Add</Button>
      </div>

      <div className="flex gap-1 p-1 bg-muted rounded-xl w-fit">
        {[{id:'today',label:'Today', icon: Clock},{id:'all',label:'All tasks', icon: Layers},{id:'matrix',label:'Matrix', icon: Grid3X3}].map(v => (
          <button key={v.id} onClick={() => setViewMode(v.id)}
            className={cn('flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all', viewMode === v.id ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground')}>
            <v.icon className="h-4 w-4" />{v.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">{[...Array(4)].map((_, i) => <Skeleton key={i} className="h-[60px] rounded-xl" />)}</div>
      ) : viewMode === 'matrix' ? (
        <EisenhowerMatrix tasks={allTasks} onComplete={completeTask} onDelete={deleteTask} />
      ) : totalCount === 0 ? (
        <div className="text-center py-16 px-4 border-2 border-dashed border-border rounded-2xl bg-muted/30">
          <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4 text-primary">
            <CheckSquare className="h-8 w-8" />
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-1">No tasks {viewMode === 'today' ? 'today' : 'yet'}</h3>
          <p className="text-sm text-muted-foreground mb-6">Plan your day with the barakah of structure.</p>
          <Button onClick={() => { resetForm(); setModalOpen(true) }}>Create your first task</Button>
        </div>
      ) : (
        <div className="space-y-8">
          {TIME_BLOCKS.map(({ key, label, icon, desc }) => {
            const blockTasks = grouped[key ?? 'unscheduled'] || []
            if (blockTasks.length === 0) return null
            return (
              <div key={key ?? 'unscheduled'} className="space-y-3">
                <div className="flex items-center gap-2 px-1">
                  <span className="text-xl">{icon}</span>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-sm text-foreground">{label}</h3>
                    {desc && <p className="text-[10px] text-muted-foreground capitalize">{desc}</p>}
                  </div>
                  <Badge variant="muted" className="shrink-0">{blockTasks.length}</Badge>
                </div>
                <div className="space-y-2">
                  {blockTasks.map(task => <TaskItem key={task.id} task={task} onComplete={completeTask} onDelete={deleteTask} />)}
                </div>
              </div>
            )
          })}
        </div>
      )}

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>New Task</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <label className="text-xs font-medium text-foreground block mb-1">Task Title <span className="text-destructive">*</span></label>
              <Input placeholder="What needs to be done?" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} autoFocus />
            </div>
            <div>
              <label className="text-xs font-medium text-foreground block mb-1">Description</label>
              <Input placeholder="Add details..." value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-foreground block mb-1">Priority</label>
                <Select value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })} options={[
                  { value: 'urgent', label: '🔥 Urgent (Do First)' },
                  { value: 'high', label: '📅 High (Schedule)' },
                  { value: 'medium', label: '🤝 Medium (Delegate)' },
                  { value: 'low', label: '🗑️ Low (Eliminate)' },
                ]} />
              </div>
              <div>
                <label className="text-xs font-medium text-foreground block mb-1">Time Block</label>
                <Select value={form.time_block} onChange={e => setForm({ ...form, time_block: e.target.value })} options={[
                  { value: '', label: 'Unscheduled' },
                  ...TIME_BLOCKS.filter(b => b.key).map(b => ({ value: b.key, label: `${b.icon} ${b.label}` }))
                ]} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-foreground block mb-1">Due Date</label>
                <Input type="date" value={form.due_date} onChange={e => setForm({ ...form, due_date: e.target.value })} />
              </div>
              <div>
                <label className="text-xs font-medium text-foreground block mb-1">Duration (mins)</label>
                <Input type="number" min="5" placeholder="e.g. 30" value={form.estimated_minutes} onChange={e => setForm({ ...form, estimated_minutes: e.target.value })} />
              </div>
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0 mt-4">
            <DialogClose asChild>
              <Button type="button" variant="outline">Cancel</Button>
            </DialogClose>
            <Button onClick={() => createTask()} disabled={isPending || !form.title.trim()}>
              {isPending ? 'Adding...' : 'Add Task'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
