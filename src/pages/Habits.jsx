import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { format, subDays, eachDayOfInterval } from 'date-fns'
import { Plus, Flame, Trash2, Edit3, Check } from 'lucide-react'
import { habitsApi } from '../lib/api'
import { Card, Button, Input, Select, Modal, Badge, EmptyState, Skeleton } from '../components/ui/index'
import toast from 'react-hot-toast'
import { clsx } from 'clsx'

const CATEGORIES = ['ibadah', 'quran', 'dhikr', 'sunnah', 'health', 'learning', 'personal', 'family']
const CATEGORY_COLORS = {
  ibadah: 'text-emerald-600', quran: 'text-emerald-700', dhikr: 'text-teal-600',
  sunnah: 'text-blue-600', health: 'text-red-500', learning: 'text-purple-600',
  personal: 'text-parchment-600', family: 'text-gold-600',
}
const ICONS = ['🕌', '📖', '📿', '🌙', '💪', '🧠', '✅', '👨‍👩‍👧', '🏃', '💧', '🌱', '📝']

function HeatmapCell({ date, completed }) {
  const intensity = completed ? 'bg-emerald-600' : 'bg-parchment-200 dark:bg-emerald-900/30'
  return (
    <div
      title={format(date, 'MMM d')}
      className={clsx('heatmap-cell w-3 h-3', intensity)}
    />
  )
}

function HabitHeatmap({ habitId }) {
  const { data: logs } = useQuery({
    queryKey: ['habits', habitId, 'logs'],
    queryFn: () => habitsApi.getLogs(habitId, 84).then((r) => r.data),
  })

  const days = eachDayOfInterval({ start: subDays(new Date(), 83), end: new Date() })
  const completedDates = new Set(logs?.filter((l) => l.completed).map((l) => l.log_date))

  return (
    <div className="flex gap-0.5 flex-wrap">
      {days.map((d) => (
        <HeatmapCell key={d.toISOString()} date={d} completed={completedDates.has(format(d, 'yyyy-MM-dd'))} />
      ))}
    </div>
  )
}

export default function Habits() {
  const qc = useQueryClient()
  const [modal, setModal] = useState(null) // 'create' | 'edit' | null
  const [editHabit, setEditHabit] = useState(null)
  const [form, setForm] = useState({ name: '', category: 'personal', frequency: 'daily', target_count: 1, icon: '✅', color: '#0d6b3d' })

  const { data: habits, isLoading } = useQuery({
    queryKey: ['habits'],
    queryFn: () => habitsApi.list().then((r) => r.data),
  })

  const { mutate: createHabit, isPending: creating } = useMutation({
    mutationFn: () => habitsApi.create(form),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['habits'] })
      setModal(null)
      resetForm()
      toast.success('Habit created!')
    },
  })

  const { mutate: updateHabit, isPending: updating } = useMutation({
    mutationFn: () => habitsApi.update(editHabit.id, form),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['habits'] })
      setModal(null)
      toast.success('Habit updated!')
    },
  })

  const { mutate: deleteHabit } = useMutation({
    mutationFn: (id) => habitsApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['habits'] })
      toast.success('Habit deleted.')
    },
  })

  const { mutate: logHabit } = useMutation({
    mutationFn: ({ habit_id, completed }) =>
      habitsApi.log({ habit_id, log_date: format(new Date(), 'yyyy-MM-dd'), completed, count: 1 }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['habits'] }),
    onError: () => toast.error('Could not log habit.'),
  })

  const resetForm = () => setForm({ name: '', category: 'personal', frequency: 'daily', target_count: 1, icon: '✅', color: '#0d6b3d' })

  const openEdit = (h) => {
    setEditHabit(h)
    setForm({ name: h.name, category: h.category, frequency: h.frequency, target_count: h.target_count, icon: h.icon || '✅', color: h.color || '#0d6b3d' })
    setModal('edit')
  }

  const submitForm = () => modal === 'create' ? createHabit() : updateHabit()

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="page-title">Habits</h1>
          <p className="text-muted mt-1">
            {habits?.filter((h) => h.completed_today).length ?? 0}/{habits?.length ?? 0} completed today
          </p>
        </div>
        <Button variant="primary" onClick={() => { resetForm(); setModal('create') }}>
          <Plus size={16} /> New habit
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-4">{[...Array(4)].map((_, i) => <Skeleton key={i} className="h-36" />)}</div>
      ) : habits?.length === 0 ? (
        <EmptyState
          icon={Flame}
          title="No habits yet"
          description="Build consistency. Start with one small ibadah habit — the Prophet ﷺ loved consistent deeds even if small."
          action={<Button variant="primary" onClick={() => { resetForm(); setModal('create') }}>Create your first habit</Button>}
        />
      ) : (
        <div className="space-y-4">
          {habits?.map((habit) => (
            <Card key={habit.id} className="animate-fade-up">
              <div className="flex items-start gap-3">
                {/* Complete button */}
                <button
                  onClick={() => logHabit({ habit_id: habit.id, completed: !habit.completed_today })}
                  className={clsx(
                    'w-10 h-10 rounded-xl border-2 flex items-center justify-center flex-shrink-0 transition-all duration-200',
                    habit.completed_today
                      ? 'bg-emerald-700 border-emerald-700 text-white'
                      : 'border-parchment-300 dark:border-emerald-700 hover:border-emerald-500'
                  )}
                >
                  {habit.completed_today ? <Check size={18} /> : <span className="text-lg">{habit.icon || '✅'}</span>}
                </button>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className={clsx('font-medium', habit.completed_today ? 'line-through text-parchment-400 dark:text-emerald-700' : 'text-emerald-900 dark:text-emerald-200')}>
                      {habit.name}
                    </h3>
                    <Badge variant="gray" className={clsx('text-xs capitalize', CATEGORY_COLORS[habit.category])}>{habit.category}</Badge>
                    {habit.current_streak > 0 && (
                      <span className="text-xs text-gold-600 flex items-center gap-0.5">
                        <Flame size={12} /> {habit.current_streak} day streak
                      </span>
                    )}
                  </div>

                  <div className="mt-3">
                    <HabitHeatmap habitId={habit.id} />
                  </div>

                  <div className="flex items-center gap-4 mt-2">
                    <span className="text-xs text-muted">{Math.round(habit.completion_rate_30d)}% last 30d</span>
                    <span className="text-xs text-muted">Best: {habit.longest_streak} days</span>
                  </div>
                </div>

                <div className="flex gap-1 flex-shrink-0">
                  <button onClick={() => openEdit(habit)} className="p-2 text-parchment-400 hover:text-emerald-700 transition-colors rounded-lg">
                    <Edit3 size={14} />
                  </button>
                  <button onClick={() => deleteHabit(habit.id)} className="p-2 text-parchment-400 hover:text-red-500 transition-colors rounded-lg">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      <Modal open={!!modal} onClose={() => setModal(null)} title={modal === 'create' ? 'New habit' : 'Edit habit'}>
        <div className="space-y-4">
          <Input label="Habit name" placeholder="e.g. Read 2 pages of Quran" value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <div className="grid grid-cols-2 gap-3">
            <Select label="Category" value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}>
              {CATEGORIES.map((c) => <option key={c} value={c} className="capitalize">{c}</option>)}
            </Select>
            <Select label="Frequency" value={form.frequency}
              onChange={(e) => setForm({ ...form, frequency: e.target.value })}>
              <option value="daily">Daily</option>
              <option value="weekdays">Weekdays</option>
              <option value="weekends">Weekends</option>
            </Select>
          </div>
          <div>
            <label className="label">Icon</label>
            <div className="flex gap-2 flex-wrap">
              {ICONS.map((icon) => (
                <button key={icon} type="button" onClick={() => setForm({ ...form, icon })}
                  className={clsx('w-10 h-10 rounded-xl text-xl flex items-center justify-center transition-all',
                    form.icon === icon ? 'bg-emerald-700 ring-2 ring-emerald-600' : 'bg-parchment-100 dark:bg-emerald-900/30 hover:bg-parchment-200'
                  )}>{icon}</button>
              ))}
            </div>
          </div>
          <div className="flex gap-3 mt-2">
            <Button variant="secondary" onClick={() => setModal(null)} className="flex-1">Cancel</Button>
            <Button variant="primary" onClick={submitForm} loading={creating || updating} className="flex-1">
              {modal === 'create' ? 'Create habit' : 'Save changes'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
