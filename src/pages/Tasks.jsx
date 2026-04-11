import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { format } from 'date-fns'
import { Plus, CheckSquare, Check, Trash2, Clock } from 'lucide-react'
import { tasksApi } from '../lib/api'
import { Card, Button, Input, Select, Modal, Badge, EmptyState, Skeleton } from '../components/ui/index'
import toast from 'react-hot-toast'
import { clsx } from 'clsx'

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

const PRIORITY_STYLES = {
  urgent: 'border-l-4 border-red-500',
  high: 'border-l-4 border-gold-500',
  medium: 'border-l-4 border-emerald-500',
  low: 'border-l-4 border-parchment-300',
}

function TaskItem({ task, onComplete, onDelete }) {
  return (
    <div className={clsx(
      'flex items-center gap-3 px-4 py-3 rounded-xl border border-parchment-200 dark:border-emerald-900/30 bg-white dark:bg-emerald-950/30 transition-all',
      task.completed && 'opacity-60',
      PRIORITY_STYLES[task.priority]
    )}>
      <button
        onClick={() => onComplete(task.id)}
        disabled={task.completed}
        className={clsx(
          'w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-all',
          task.completed
            ? 'bg-emerald-700 border-emerald-700 text-white'
            : 'border-parchment-400 dark:border-emerald-700 hover:border-emerald-600'
        )}
      >
        {task.completed && <Check size={12} />}
      </button>
      <div className="flex-1 min-w-0">
        <p className={clsx('text-sm font-medium', task.completed ? 'line-through text-parchment-400 dark:text-emerald-700' : 'text-emerald-900 dark:text-emerald-200')}>
          {task.title}
        </p>
        {task.description && <p className="text-xs text-muted truncate">{task.description}</p>}
      </div>
      <div className="flex items-center gap-1.5 flex-shrink-0">
        {task.estimated_minutes && (
          <span className="text-xs text-muted flex items-center gap-1"><Clock size={10} />{task.estimated_minutes}m</span>
        )}
        <Badge variant="gray" className="text-xs capitalize">{task.priority}</Badge>
        <button onClick={() => onDelete(task.id)} className="p-1 text-parchment-400 hover:text-red-500 transition-colors rounded">
          <Trash2 size={13} />
        </button>
      </div>
    </div>
  )
}

export default function Tasks() {
  const qc = useQueryClient()
  const [modal, setModal] = useState(false)
  const [viewMode, setViewMode] = useState('today') // 'today' | 'all'
  const [form, setForm] = useState({
    title: '', description: '', priority: 'medium', category: 'personal',
    due_date: format(new Date(), 'yyyy-MM-dd'), time_block: '', estimated_minutes: ''
  })

  const { data: todayTasks, isLoading } = useQuery({
    queryKey: ['tasks', 'today'],
    queryFn: () => tasksApi.today().then((r) => r.data),
    enabled: viewMode === 'today',
  })

  const { data: allTasks, isLoading: allLoading } = useQuery({
    queryKey: ['tasks', 'all'],
    queryFn: () => tasksApi.list({ completed: false }).then((r) => r.data),
    enabled: viewMode === 'all',
  })

  const tasks = viewMode === 'today' ? todayTasks : allTasks
  const loading = viewMode === 'today' ? isLoading : allLoading

  const { mutate: createTask, isPending } = useMutation({
    mutationFn: () => tasksApi.create({
      ...form,
      estimated_minutes: form.estimated_minutes ? parseInt(form.estimated_minutes) : null,
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tasks'] })
      setModal(false)
      resetForm()
      toast.success('Task added!')
    },
  })

  const { mutate: completeTask } = useMutation({
    mutationFn: (id) => tasksApi.complete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tasks'] })
      toast.success('Task completed! MashaaAllah 🌙')
    },
  })

  const { mutate: deleteTask } = useMutation({
    mutationFn: (id) => tasksApi.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tasks'] }),
  })

  const resetForm = () => setForm({
    title: '', description: '', priority: 'medium', category: 'personal',
    due_date: format(new Date(), 'yyyy-MM-dd'), time_block: '', estimated_minutes: ''
  })

  // Group tasks by time block
  const grouped = {}
  tasks?.forEach((t) => {
    const key = t.time_block || 'unscheduled'
    if (!grouped[key]) grouped[key] = []
    grouped[key].push(t)
  })

  const completedCount = tasks?.filter((t) => t.completed).length || 0
  const totalCount = tasks?.length || 0

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="page-title">Planner</h1>
          <p className="text-muted mt-1">
            {completedCount}/{totalCount} tasks done
          </p>
        </div>
        <Button variant="primary" onClick={() => { resetForm(); setModal(true) }}>
          <Plus size={16} /> Add task
        </Button>
      </div>

      {/* View toggle */}
      <div className="flex gap-1 p-1 bg-parchment-100 dark:bg-emerald-900/30 rounded-xl mb-5 w-fit">
        {['today', 'all'].map((v) => (
          <button key={v} onClick={() => setViewMode(v)}
            className={clsx('px-4 py-1.5 rounded-lg text-sm font-medium transition-all capitalize',
              viewMode === v ? 'bg-white dark:bg-emerald-900 text-emerald-900 dark:text-white shadow-sm'
                : 'text-parchment-500 dark:text-emerald-600'
            )}>{v === 'today' ? "Today" : "All tasks"}</button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">{[...Array(4)].map((_, i) => <Skeleton key={i} className="h-14" />)}</div>
      ) : totalCount === 0 ? (
        <EmptyState
          icon={CheckSquare}
          title="No tasks yet"
          description="Plan your day with the barakah of structure. Block tasks around your prayer times."
          action={<Button variant="primary" onClick={() => { resetForm(); setModal(true) }}>Add your first task</Button>}
        />
      ) : (
        <div className="space-y-6">
          {TIME_BLOCKS.map(({ key, label, icon, desc }) => {
            const blockTasks = grouped[key ?? 'unscheduled'] || []
            if (blockTasks.length === 0) return null
            return (
              <div key={key ?? 'unscheduled'}>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-lg">{icon}</span>
                  <h3 className="font-medium text-emerald-900 dark:text-emerald-200 text-sm">{label}</h3>
                  {desc && <span className="text-xs text-muted">{desc}</span>}
                  <Badge variant="gray" className="ml-auto">{blockTasks.length}</Badge>
                </div>
                <div className="space-y-2">
                  {blockTasks.map((task) => (
                    <TaskItem key={task.id} task={task} onComplete={completeTask} onDelete={deleteTask} />
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Create Task Modal */}
      <Modal open={modal} onClose={() => setModal(false)} title="New task">
        <div className="space-y-4">
          <Input label="Task title" placeholder="What needs to be done?" value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })} />
          <Input label="Description (optional)" value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })} />
          <div className="grid grid-cols-2 gap-3">
            <Select label="Priority" value={form.priority}
              onChange={(e) => setForm({ ...form, priority: e.target.value })}>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </Select>
            <Select label="Time block" value={form.time_block}
              onChange={(e) => setForm({ ...form, time_block: e.target.value })}>
              <option value="">No block</option>
              {TIME_BLOCKS.filter((b) => b.key).map(({ key, label, icon }) => (
                <option key={key} value={key}>{icon} {label}</option>
              ))}
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Due date" type="date" value={form.due_date}
              onChange={(e) => setForm({ ...form, due_date: e.target.value })} />
            <Input label="Estimated time (mins)" type="number" min="5" placeholder="e.g. 30" value={form.estimated_minutes}
              onChange={(e) => setForm({ ...form, estimated_minutes: e.target.value })} />
          </div>
          <div className="flex gap-3 mt-2">
            <Button variant="secondary" onClick={() => setModal(false)} className="flex-1">Cancel</Button>
            <Button variant="primary" onClick={() => createTask()} loading={isPending} className="flex-1">Add task</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
