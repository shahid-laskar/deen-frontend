import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { format } from 'date-fns'
import { Plus, Dumbbell, Flame, Clock, Star, Trash2, Check } from 'lucide-react'
import api from '../lib/api'
import { Card, Button, Input, Select, Modal, Badge, EmptyState, Skeleton, StatCard } from '../components/ui/index'
import toast from 'react-hot-toast'
import { clsx } from 'clsx'

const TIME_BLOCKS = ['after_fajr', 'morning', 'after_asr', 'evening', 'after_isha']
const TIME_BLOCK_LABELS = { after_fajr: '🌅 After Fajr', morning: '☀️ Morning', after_asr: '🌆 After Asr', evening: '🌙 Evening', after_isha: '⭐ After Isha' }

export default function Workout() {
  const qc = useQueryClient()
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState({
    session_date: format(new Date(), 'yyyy-MM-dd'),
    session_name: '', duration_minutes: '', calories_burned: '',
    time_block: '', notes: '', rating: '', exercises_log: [],
  })

  const { data: stats } = useQuery({ queryKey: ['workout', 'stats'], queryFn: () => api.get('/workout/stats').then(r => r.data) })
  const { data: sessions, isLoading } = useQuery({
    queryKey: ['workout', 'sessions'],
    queryFn: () => api.get('/workout/sessions', { params: { start_date: format(new Date(Date.now() - 30 * 864e5), 'yyyy-MM-dd') } }).then(r => r.data),
  })
  const { data: plan } = useQuery({ queryKey: ['workout', 'active-plan'], queryFn: () => api.get('/workout/plans').then(r => r.data[0]).catch(() => null) })

  const { mutate: logSession, isPending } = useMutation({
    mutationFn: () => api.post('/workout/sessions', {
      ...form,
      duration_minutes: form.duration_minutes ? parseInt(form.duration_minutes) : null,
      calories_burned: form.calories_burned ? parseFloat(form.calories_burned) : null,
      rating: form.rating ? parseInt(form.rating) : null,
    }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['workout'] }); setModal(false); toast.success('Workout logged! MashaaAllah 💪') },
  })

  const { mutate: deleteSession } = useMutation({
    mutationFn: (id) => api.delete(`/workout/sessions/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['workout'] }),
  })

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="page-title flex items-center gap-2"><Dumbbell size={26} className="text-emerald-600" /> Workout Planner</h1>
          <p className="text-muted mt-1">Strength is an amanah — use it in the way of Allah</p>
        </div>
        <Button variant="primary" onClick={() => setModal(true)}><Plus size={16} /> Log workout</Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <StatCard label="This week" value={stats?.sessions_this_week ?? 0} sub="sessions" icon={Dumbbell} />
        <StatCard label="Total sessions" value={stats?.total_sessions ?? 0} sub="all time" icon={Check} />
        <StatCard label="Total time" value={`${Math.round((stats?.total_minutes ?? 0) / 60)}h`} sub="trained" icon={Clock} color="gold" />
      </div>

      {/* Active plan banner */}
      {plan && (
        <Card className="mb-5 border-emerald-300 dark:border-emerald-700 bg-emerald-50 dark:bg-emerald-900/20 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-700 rounded-xl flex items-center justify-center text-white">🏋️</div>
            <div>
              <p className="font-medium text-emerald-900 dark:text-emerald-200">{plan.name}</p>
              <p className="text-xs text-muted">{plan.days_per_week}x/week • {plan.goal || 'General fitness'}</p>
            </div>
            {plan.is_ramadan_mode && <Badge variant="gold" className="ml-auto">Ramadan mode</Badge>}
          </div>
        </Card>
      )}

      {/* Session list */}
      {isLoading ? <div className="space-y-3">{[...Array(4)].map((_, i) => <Skeleton key={i} className="h-20" />)}</div>
        : sessions?.length === 0 ? (
          <EmptyState icon={Dumbbell} title="No workouts logged"
            description="The Prophet ﷺ was strong and active. Schedule your workout around your prayer times."
            action={<Button variant="primary" onClick={() => setModal(true)}>Log first workout</Button>} />
        ) : (
          <div className="space-y-3">
            {sessions?.map(s => (
              <Card key={s.id} className="p-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-900/40 rounded-xl flex items-center justify-center text-lg flex-shrink-0">💪</div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-medium text-emerald-900 dark:text-emerald-200">{s.session_name || 'Workout session'}</p>
                      {s.time_block && <Badge variant="gray" className="text-xs">{TIME_BLOCK_LABELS[s.time_block] || s.time_block}</Badge>}
                    </div>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-xs text-muted">{format(new Date(s.session_date), 'd MMM')}</span>
                      {s.duration_minutes && <span className="text-xs text-muted flex items-center gap-1"><Clock size={10} />{s.duration_minutes}m</span>}
                      {s.calories_burned && <span className="text-xs text-muted flex items-center gap-1"><Flame size={10} />{s.calories_burned} kcal</span>}
                      {s.rating && <span className="text-xs text-gold-600">{'⭐'.repeat(s.rating)}</span>}
                    </div>
                  </div>
                  <button onClick={() => deleteSession(s.id)} className="text-parchment-400 hover:text-red-500 p-1 flex-shrink-0"><Trash2 size={14} /></button>
                </div>
                {s.notes && <p className="text-xs text-muted mt-2 pl-13">{s.notes}</p>}
              </Card>
            ))}
          </div>
        )}

      <Modal open={modal} onClose={() => setModal(false)} title="Log workout session">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Input label="Date" type="date" value={form.session_date} onChange={e => setForm({ ...form, session_date: e.target.value })} />
            <Input label="Session name" placeholder="e.g. Upper body" value={form.session_name} onChange={e => setForm({ ...form, session_name: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Duration (min)" type="number" value={form.duration_minutes} onChange={e => setForm({ ...form, duration_minutes: e.target.value })} />
            <Input label="Calories burned" type="number" value={form.calories_burned} onChange={e => setForm({ ...form, calories_burned: e.target.value })} />
          </div>
          <Select label="Time block" value={form.time_block} onChange={e => setForm({ ...form, time_block: e.target.value })}>
            <option value="">No block</option>
            {TIME_BLOCKS.map(b => <option key={b} value={b}>{TIME_BLOCK_LABELS[b]}</option>)}
          </Select>
          <div>
            <label className="label">Rating</label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map(r => (
                <button key={r} onClick={() => setForm({ ...form, rating: r })}
                  className={clsx('text-2xl transition-all', parseInt(form.rating) >= r ? 'opacity-100' : 'opacity-30')}>⭐</button>
              ))}
            </div>
          </div>
          <Input label="Notes" placeholder="How did it feel?" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
          <div className="flex gap-3">
            <Button variant="secondary" onClick={() => setModal(false)} className="flex-1">Cancel</Button>
            <Button variant="primary" onClick={() => logSession()} loading={isPending} className="flex-1">Log workout</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
