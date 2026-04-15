import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { format } from 'date-fns'
import { Plus, CheckSquare, Check, Trash2, Clock, Grid3X3 } from 'lucide-react'
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

// Eisenhower Matrix quadrant definitions
const QUADRANTS = [
  { id: 'do', label: 'Do First', subtitle: 'Urgent + Important', color: '#ef4444', bg: 'rgba(239,68,68,0.08)', border: 'rgba(239,68,68,0.3)', emoji: '🔥', filter: (t) => t.priority === 'urgent' },
  { id: 'schedule', label: 'Schedule', subtitle: 'Not Urgent + Important', color: '#3b82f6', bg: 'rgba(59,130,246,0.08)', border: 'rgba(59,130,246,0.3)', emoji: '📅', filter: (t) => t.priority === 'high' },
  { id: 'delegate', label: 'Delegate', subtitle: 'Urgent + Not Important', color: '#f59e0b', bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.3)', emoji: '🤝', filter: (t) => t.priority === 'medium' },
  { id: 'eliminate', label: 'Eliminate', subtitle: 'Not Urgent + Not Important', color: '#6b7280', bg: 'rgba(107,114,128,0.08)', border: 'rgba(107,114,128,0.3)', emoji: '🗑️', filter: (t) => t.priority === 'low' },
]

function TaskItem({ task, onComplete, onDelete }) {
  return (
    <div className={clsx(
      'flex items-center gap-3 px-4 py-3 rounded-xl border border-parchment-200 dark:border-emerald-900/30 bg-white dark:bg-emerald-950/30 transition-all',
      task.completed && 'opacity-60',
      PRIORITY_STYLES[task.priority]
    )}>
      <button onClick={() => onComplete(task.id)} disabled={task.completed}
        className={clsx('w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-all',
          task.completed ? 'bg-emerald-700 border-emerald-700 text-white' : 'border-parchment-400 dark:border-emerald-700 hover:border-emerald-600'
        )}>
        {task.completed && <Check size={12} />}
      </button>
      <div className="flex-1 min-w-0">
        <p className={clsx('text-sm font-medium', task.completed ? 'line-through text-parchment-400 dark:text-emerald-700' : 'text-emerald-900 dark:text-emerald-200')}>{task.title}</p>
        {task.description && <p className="text-xs text-muted truncate">{task.description}</p>}
      </div>
      <div className="flex items-center gap-1.5 flex-shrink-0">
        {task.estimated_minutes && <span className="text-xs text-muted flex items-center gap-1"><Clock size={10} />{task.estimated_minutes}m</span>}
        <Badge variant="gray" className="text-xs capitalize">{task.priority}</Badge>
        <button onClick={() => onDelete(task.id)} className="p-1 text-parchment-400 hover:text-red-500 transition-colors rounded"><Trash2 size={13} /></button>
      </div>
    </div>
  )
}

function EisenhowerMatrix({ tasks, onComplete, onDelete }) {
  return (
    <div>
      <div style={{ marginBottom: 12, padding: '10px 14px', borderRadius: 10, background: 'rgba(107,114,128,0.06)', border: '0.5px solid var(--t-border)' }}>
        <p style={{ fontSize: 13, color: 'var(--t-text-muted)', lineHeight: 1.6 }}>
          Sort tasks by priority: <strong style={{ color: '#ef4444' }}>Urgent</strong> → Do First, <strong style={{ color: '#3b82f6' }}>High</strong> → Schedule, <strong style={{ color: '#f59e0b' }}>Medium</strong> → Delegate, <strong style={{ color: '#6b7280' }}>Low</strong> → Eliminate.
        </p>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        {QUADRANTS.map(q => {
          const qTasks = tasks?.filter(t => !t.completed && q.filter(t)) || []
          return (
            <div key={q.id} style={{ borderRadius: 12, padding: '12px 14px', background: q.bg, border: `1px solid ${q.border}`, minHeight: 120 }}>
              <div style={{ marginBottom: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                  <span style={{ fontSize: 16 }}>{q.emoji}</span>
                  <p style={{ fontWeight: 700, fontSize: 13, color: q.color }}>{q.label}</p>
                </div>
                <p style={{ fontSize: 10, color: 'var(--t-text-muted)' }}>{q.subtitle}</p>
              </div>
              {qTasks.length === 0 ? (
                <p style={{ fontSize: 11, color: 'var(--t-text-muted)', fontStyle: 'italic' }}>No tasks here</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {qTasks.slice(0, 4).map(task => (
                    <div key={task.id} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 8px', borderRadius: 8, background: 'rgba(255,255,255,0.6)' }}>
                      <button onClick={() => onComplete(task.id)} style={{ width: 16, height: 16, borderRadius: '50%', border: `1.5px solid ${q.color}`, background: 'transparent', cursor: 'pointer', flexShrink: 0 }} />
                      <p style={{ fontSize: 11, fontWeight: 500, color: '#1f2937', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{task.title}</p>
                      <button onClick={() => onDelete(task.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', padding: 2 }}><Trash2 size={10} /></button>
                    </div>
                  ))}
                  {qTasks.length > 4 && <p style={{ fontSize: 10, color: 'var(--t-text-muted)', textAlign: 'center' }}>+{qTasks.length - 4} more</p>}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default function Tasks() {
  const qc = useQueryClient()
  const [modal, setModal] = useState(false)
  const [viewMode, setViewMode] = useState('today')
  const [form, setForm] = useState({ title: '', description: '', priority: 'medium', category: 'personal', due_date: format(new Date(), 'yyyy-MM-dd'), time_block: '', estimated_minutes: '' })

  const { data: todayTasks, isLoading } = useQuery({ queryKey: ['tasks', 'today'], queryFn: () => tasksApi.today().then(r => r.data), enabled: viewMode === 'today' })
  const { data: allTasks, isLoading: allLoading } = useQuery({ queryKey: ['tasks', 'all'], queryFn: () => tasksApi.list({ completed: false }).then(r => r.data), enabled: viewMode !== 'today' })

  const tasks = viewMode === 'today' ? todayTasks : allTasks
  const loading = viewMode === 'today' ? isLoading : allLoading

  const { mutate: createTask, isPending } = useMutation({
    mutationFn: () => tasksApi.create({ ...form, estimated_minutes: form.estimated_minutes ? parseInt(form.estimated_minutes) : null }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['tasks'] }); setModal(false); resetForm(); toast.success('Task added!') },
  })
  const { mutate: completeTask } = useMutation({ mutationFn: (id) => tasksApi.complete(id), onSuccess: () => { qc.invalidateQueries({ queryKey: ['tasks'] }); toast.success('Task completed! MashaaAllah 🌙') } })
  const { mutate: deleteTask } = useMutation({ mutationFn: (id) => tasksApi.delete(id), onSuccess: () => qc.invalidateQueries({ queryKey: ['tasks'] }) })
  const resetForm = () => setForm({ title: '', description: '', priority: 'medium', category: 'personal', due_date: format(new Date(), 'yyyy-MM-dd'), time_block: '', estimated_minutes: '' })

  const grouped = {}
  tasks?.forEach(t => { const key = t.time_block || 'unscheduled'; if (!grouped[key]) grouped[key] = []; grouped[key].push(t) })
  const completedCount = tasks?.filter(t => t.completed).length || 0
  const totalCount = tasks?.length || 0

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="page-title">Planner</h1>
          <p className="text-muted mt-1">{completedCount}/{totalCount} tasks done</p>
        </div>
        <Button variant="primary" onClick={() => { resetForm(); setModal(true) }}><Plus size={16} /> Add task</Button>
      </div>

      <div className="flex gap-1 p-1 bg-parchment-100 dark:bg-emerald-900/30 rounded-xl mb-5 w-fit">
        {[{id:'today',label:'Today'},{id:'all',label:'All tasks'},{id:'matrix',label:'⊞ Matrix'}].map(v => (
          <button key={v.id} onClick={() => setViewMode(v.id)}
            className={clsx('px-4 py-1.5 rounded-lg text-sm font-medium transition-all', viewMode === v.id ? 'bg-white dark:bg-emerald-900 text-emerald-900 dark:text-white shadow-sm' : 'text-parchment-500 dark:text-emerald-600')}>{v.label}</button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">{[...Array(4)].map((_, i) => <Skeleton key={i} className="h-14" />)}</div>
      ) : viewMode === 'matrix' ? (
        <EisenhowerMatrix tasks={allTasks} onComplete={completeTask} onDelete={deleteTask} />
      ) : totalCount === 0 ? (
        <EmptyState icon={CheckSquare} title="No tasks yet" description="Plan your day with the barakah of structure." action={<Button variant="primary" onClick={() => { resetForm(); setModal(true) }}>Add your first task</Button>} />
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
                  {blockTasks.map(task => <TaskItem key={task.id} task={task} onComplete={completeTask} onDelete={deleteTask} />)}
                </div>
              </div>
            )
          })}
        </div>
      )}

      <Modal open={modal} onClose={() => setModal(false)} title="New task">
        <div className="space-y-4">
          <Input label="Task title" placeholder="What needs to be done?" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
          <Input label="Description (optional)" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
          <div className="grid grid-cols-2 gap-3">
            <Select label="Priority" value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })}>
              <option value="low">Low (Eliminate)</option>
              <option value="medium">Medium (Delegate)</option>
              <option value="high">High (Schedule)</option>
              <option value="urgent">Urgent (Do First)</option>
            </Select>
            <Select label="Time block" value={form.time_block} onChange={e => setForm({ ...form, time_block: e.target.value })}>
              <option value="">No block</option>
              {TIME_BLOCKS.filter(b => b.key).map(({ key, label, icon }) => <option key={key} value={key}>{icon} {label}</option>)}
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Due date" type="date" value={form.due_date} onChange={e => setForm({ ...form, due_date: e.target.value })} />
            <Input label="Estimated time (mins)" type="number" min="5" placeholder="e.g. 30" value={form.estimated_minutes} onChange={e => setForm({ ...form, estimated_minutes: e.target.value })} />
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
