import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { format, differenceInMonths } from 'date-fns'
import { Plus, Star, BookOpen, CheckCircle, Circle, Trash2, ChevronDown, ChevronUp } from 'lucide-react'
import api from '../lib/api'
import { Card, Button, Input, Select, Modal, Badge, EmptyState, Skeleton } from '../components/ui/index'
import toast from 'react-hot-toast'
import { clsx } from 'clsx'

const MILESTONE_CATS = ['aqeedah', 'salah', 'quran', 'arabic', 'akhlaq', 'seerah', 'fiqh', 'dua']
const CAT_COLORS = { aqeedah: 'text-emerald-600', salah: 'text-blue-600', quran: 'text-gold-600', arabic: 'text-purple-600', akhlaq: 'text-pink-600', seerah: 'text-teal-600', fiqh: 'text-orange-600', dua: 'text-red-500' }
const DUA_STATUS_COLORS = { not_started: 'bg-parchment-100 text-parchment-600', learning: 'bg-gold-100 text-gold-700', reciting: 'bg-blue-100 text-blue-700', mastered: 'bg-emerald-100 text-emerald-700' }

function ChildCard({ child }) {
  const qc = useQueryClient()
  const [tab, setTab] = useState('milestones')
  const ageMonths = child.date_of_birth ? differenceInMonths(new Date(), new Date(child.date_of_birth)) : null

  const { data: milestones } = useQuery({ queryKey: ['child', child.id, 'milestones'], queryFn: () => api.get(`/children/${child.id}/milestones`).then(r => r.data) })
  const { data: duas } = useQuery({ queryKey: ['child', child.id, 'duas'], queryFn: () => api.get(`/children/${child.id}/duas`).then(r => r.data) })

  const { mutate: toggleMilestone } = useMutation({
    mutationFn: ({ msId, achieved }) => api.patch(`/children/${child.id}/milestones/${msId}`, { achieved, achieved_date: achieved ? format(new Date(), 'yyyy-MM-dd') : null }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['child', child.id] }),
  })

  const { mutate: updateDua } = useMutation({
    mutationFn: ({ logId, status }) => api.patch(`/children/${child.id}/duas/${logId}`, { status, mastered_date: status === 'mastered' ? format(new Date(), 'yyyy-MM-dd') : null }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['child', child.id] }); toast.success('MashaaAllah! Progress saved 🌟') },
  })

  const achieved = milestones?.filter(m => m.achieved).length || 0
  const total = milestones?.length || 0

  return (
    <Card>
      <div className="flex items-center gap-3 mb-4">
        <div className="w-12 h-12 bg-gold-100 dark:bg-gold-900/30 rounded-2xl flex items-center justify-center text-2xl">{child.avatar_emoji}</div>
        <div className="flex-1">
          <h3 className="font-display font-semibold text-emerald-900 dark:text-emerald-200">{child.name}</h3>
          {ageMonths !== null && <p className="text-xs text-muted">{Math.floor(ageMonths / 12)}y {ageMonths % 12}m old</p>}
        </div>
        <div className="text-right">
          <p className="font-bold text-emerald-700 dark:text-emerald-400">{achieved}/{total}</p>
          <p className="text-xs text-muted">milestones</p>
        </div>
      </div>

      <div className="flex gap-1 p-1 bg-parchment-100 dark:bg-emerald-900/30 rounded-xl mb-4">
        {['milestones', 'duas'].map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={clsx('flex-1 py-1.5 rounded-lg text-xs font-medium capitalize transition-all',
              tab === t ? 'bg-white dark:bg-emerald-900 text-emerald-900 dark:text-white shadow-sm' : 'text-parchment-500 dark:text-emerald-600')}>
            {t}
          </button>
        ))}
      </div>

      {tab === 'milestones' && (
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {milestones?.length === 0 && <p className="text-xs text-muted text-center py-3">No milestones yet.</p>}
          {MILESTONE_CATS.map(cat => {
            const catItems = milestones?.filter(m => m.category === cat) || []
            if (!catItems.length) return null
            return (
              <div key={cat}>
                <p className={clsx('text-xs font-medium capitalize mb-1.5', CAT_COLORS[cat])}>{cat}</p>
                {catItems.map(ms => (
                  <div key={ms.id} className="flex items-center gap-2 py-1">
                    <button onClick={() => toggleMilestone({ msId: ms.id, achieved: !ms.achieved })} className="flex-shrink-0">
                      {ms.achieved ? <CheckCircle size={16} className="text-emerald-600" /> : <Circle size={16} className="text-parchment-400" />}
                    </button>
                    <p className={clsx('text-sm flex-1', ms.achieved && 'line-through text-parchment-400 dark:text-emerald-700')}>{ms.title}</p>
                    {ms.achieved && <Star size={12} className="text-gold-500 flex-shrink-0" />}
                  </div>
                ))}
              </div>
            )
          })}
        </div>
      )}

      {tab === 'duas' && (
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {duas?.length === 0 && <p className="text-xs text-muted text-center py-3">No duas tracked yet.</p>}
          {duas?.map(d => (
            <div key={d.id} className="flex items-center gap-3 py-1.5 border-b border-parchment-100 dark:border-emerald-900/30 last:border-0">
              <div className="flex-1">
                <p className="text-sm text-emerald-800 dark:text-emerald-300">{d.dua_name}</p>
              </div>
              <select
                className="text-xs px-2 py-1 rounded-lg border border-parchment-200 dark:border-emerald-800 bg-white dark:bg-emerald-950"
                value={d.status}
                onChange={e => updateDua({ logId: d.id, status: e.target.value })}
              >
                {['not_started', 'learning', 'reciting', 'mastered'].map(s => <option key={s} value={s} className="capitalize">{s.replace('_', ' ')}</option>)}
              </select>
            </div>
          ))}
        </div>
      )}
    </Card>
  )
}

export default function Children() {
  const qc = useQueryClient()
  const [addModal, setAddModal] = useState(false)
  const [form, setForm] = useState({ name: '', date_of_birth: '', gender: 'male', avatar_emoji: '🌟' })
  const EMOJIS = ['🌟', '🌙', '📖', '🕊️', '🌸', '🦋', '🌺', '⭐', '🎯', '💫']

  const { data: children, isLoading } = useQuery({ queryKey: ['children'], queryFn: () => api.get('/children').then(r => r.data) })

  const { mutate: createChild, isPending } = useMutation({
    mutationFn: () => api.post('/children', form),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['children'] }); setAddModal(false); toast.success(`${form.name}'s profile created! 🌟`) },
  })

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="page-title">Child Upbringing</h1>
          <p className="text-muted mt-1">Track your children's Islamic education and milestones</p>
        </div>
        <Button variant="primary" onClick={() => setAddModal(true)}><Plus size={16} /> Add child</Button>
      </div>

      <div className="mb-5 px-5 py-4 bg-emerald-950 rounded-xl">
        <p className="text-emerald-100 font-display text-lg mb-1">"Every one of you is a shepherd and is responsible for his flock."</p>
        <p className="text-emerald-500 text-xs">— Prophet Muhammad ﷺ (Bukhari)</p>
      </div>

      {isLoading ? <div className="space-y-4">{[...Array(2)].map((_, i) => <Skeleton key={i} className="h-48" />)}</div>
        : children?.length === 0 ? (
          <EmptyState icon={Star} title="No children added yet"
            description="Add your children to start tracking their Islamic milestones, Quran progress, and duas."
            action={<Button variant="primary" onClick={() => setAddModal(true)}>Add your first child</Button>} />
        ) : (
          <div className="space-y-4">{children?.map(c => <ChildCard key={c.id} child={c} />)}</div>
        )}

      <Modal open={addModal} onClose={() => setAddModal(false)} title="Add a child profile">
        <div className="space-y-4">
          <Input label="Child's name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
          <Input label="Date of birth (optional)" type="date" value={form.date_of_birth} onChange={e => setForm({ ...form, date_of_birth: e.target.value })} />
          <div>
            <label className="label">Avatar</label>
            <div className="flex gap-2 flex-wrap">
              {EMOJIS.map(e => (
                <button key={e} onClick={() => setForm({ ...form, avatar_emoji: e })}
                  className={clsx('w-10 h-10 rounded-xl text-xl flex items-center justify-center transition-all',
                    form.avatar_emoji === e ? 'bg-gold-200 ring-2 ring-gold-500' : 'bg-parchment-100 dark:bg-emerald-900/30')}>{e}</button>
              ))}
            </div>
          </div>
          <div className="flex gap-3">
            <Button variant="secondary" onClick={() => setAddModal(false)} className="flex-1">Cancel</Button>
            <Button variant="primary" onClick={() => createChild()} loading={isPending} className="flex-1">Add {form.name || 'child'}</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
