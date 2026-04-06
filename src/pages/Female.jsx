import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { format } from 'date-fns'
import { Heart, Plus, CheckCircle, AlertCircle, Calendar, Info } from 'lucide-react'
import { femaleApi } from '../lib/api'
import { useAuthStore } from '../store/authStore'
import { Card, Button, Input, Textarea, Modal, Badge, EmptyState, Skeleton, StatCard } from '../components/ui/index'
import toast from 'react-hot-toast'
import { clsx } from 'clsx'

const TABS = ['Cycle Tracker', 'Fasting Tracker', 'Missed Fasts']

const CLASSIFICATION_INFO = {
  hayd: { color: 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400', label: 'Hayd (Menstruation)' },
  istihadah: { color: 'bg-gold-100 text-gold-700 dark:bg-gold-900/20 dark:text-gold-400', label: 'Istihadah (Irregular)' },
  tuhr: { color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400', label: 'Tuhr (Purity)' },
  uncertain: { color: 'bg-parchment-100 text-parchment-700', label: 'Uncertain' },
}

// ─── Worship Status ────────────────────────────────────────────────────────────
function WorshipStatus({ cycle }) {
  const items = [
    { label: 'Salah', allowed: cycle.can_pray },
    { label: 'Fasting', allowed: cycle.can_fast },
    { label: 'Quran', allowed: cycle.can_read_quran },
    { label: 'Ghusl required', allowed: !cycle.ghusl_required || cycle.ghusl_done },
  ]
  return (
    <div className="grid grid-cols-2 gap-2 mt-3">
      {items.map(({ label, allowed }) => (
        <div key={label} className={clsx('flex items-center gap-2 px-3 py-2 rounded-lg text-sm',
          allowed ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400'
            : 'bg-red-50 dark:bg-red-900/10 text-red-600 dark:text-red-400'
        )}>
          {allowed ? <CheckCircle size={14} /> : <AlertCircle size={14} />}
          {label}
        </div>
      ))}
    </div>
  )
}

// ─── Cycle Tracker ────────────────────────────────────────────────────────────
function CycleTracker() {
  const qc = useQueryClient()
  const { getMadhab } = useAuthStore()
  const [modal, setModal] = useState(false)
  const [closeModal, setCloseModal] = useState(false)
  const [form, setForm] = useState({ start_date: format(new Date(), 'yyyy-MM-dd'), notes: '', symptoms: '' })
  const [closeForm, setCloseForm] = useState({ end_date: format(new Date(), 'yyyy-MM-dd') })

  const { data: current, isLoading: currentLoading } = useQuery({
    queryKey: ['female', 'current'],
    queryFn: () => femaleApi.getCurrentCycle().then((r) => r.data).catch(() => null),
  })

  const { data: cycles, isLoading: cyclesLoading } = useQuery({
    queryKey: ['female', 'cycles'],
    queryFn: () => femaleApi.getCycles().then((r) => r.data),
  })

  const { mutate: startCycle, isPending: starting } = useMutation({
    mutationFn: () => femaleApi.startCycle(form),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['female'] })
      setModal(false)
      toast.success(`Cycle started. Rulings calculated for ${getMadhab()} school.`)
    },
    onError: (e) => toast.error(e.response?.data?.detail || 'Could not start cycle.'),
  })

  const { mutate: closeCycle, isPending: closing } = useMutation({
    mutationFn: () => femaleApi.updateCycle(current.id, closeForm),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['female'] })
      setCloseModal(false)
      toast.success('Cycle closed. Ghusl is required — may Allah make it easy. 💚')
    },
  })

  const { mutate: markGhusl } = useMutation({
    mutationFn: () => femaleApi.updateCycle(current.id, { ghusl_done: true, ghusl_date: format(new Date(), 'yyyy-MM-dd') }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['female'] })
      toast.success('Ghusl marked complete. Welcome back to full ibadah! 🌙')
    },
  })

  return (
    <div className="space-y-5">
      {/* Disclaimer */}
      <div className="flex items-start gap-2 px-4 py-3 bg-blue-50 dark:bg-blue-900/10 rounded-xl border border-blue-200 dark:border-blue-900/30">
        <Info size={16} className="text-blue-600 mt-0.5 flex-shrink-0" />
        <p className="text-xs text-blue-700 dark:text-blue-400">
          Rulings are calculated for the <strong>{getMadhab()}</strong> school. For your specific situation, always consult a qualified scholar. This app is a guide, not a fatwa.
        </p>
      </div>

      {/* Current cycle */}
      {currentLoading ? <Skeleton className="h-40" /> : current ? (
        <Card className="border-2 border-red-200 dark:border-red-900/40">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className={clsx('px-2.5 py-1 rounded-full text-xs font-medium', CLASSIFICATION_INFO[current.blood_classification]?.color)}>
                  {CLASSIFICATION_INFO[current.blood_classification]?.label}
                </span>
                <Badge variant="gray">Day {Math.ceil((new Date() - new Date(current.start_date)) / 86400000)}</Badge>
              </div>
              <p className="text-sm text-muted">Started {format(new Date(current.start_date), 'd MMMM yyyy')}</p>
            </div>
            <div className="flex gap-2">
              {current.ghusl_required && !current.ghusl_done && (
                <Button variant="outline" size="sm" onClick={() => markGhusl()}>
                  <CheckCircle size={14} /> Mark ghusl
                </Button>
              )}
              <Button variant="secondary" size="sm" onClick={() => setCloseModal(true)}>
                End cycle
              </Button>
            </div>
          </div>
          <WorshipStatus cycle={current} />
          {current.notes && (
            <p className="mt-3 text-sm text-emerald-700 dark:text-emerald-400 bg-parchment-50 dark:bg-emerald-900/20 rounded-lg px-3 py-2">{current.notes}</p>
          )}
        </Card>
      ) : (
        <Card className="text-center py-8">
          <Heart size={32} className="text-emerald-600 mx-auto mb-3" />
          <h3 className="font-display text-lg font-semibold text-emerald-900 dark:text-emerald-200 mb-1">
            Currently in Tuhr (purity)
          </h3>
          <p className="text-muted text-sm mb-4">All ibadah is fully open. Alhamdulillah.</p>
          <Button variant="primary" size="sm" onClick={() => setModal(true)}>
            <Plus size={14} /> Start new cycle
          </Button>
        </Card>
      )}

      {/* History */}
      <div>
        <h3 className="section-title mb-3">Cycle History</h3>
        {cyclesLoading ? (
          <div className="space-y-2">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-14" />)}</div>
        ) : cycles?.length === 0 ? (
          <p className="text-muted text-sm text-center py-4">No cycles recorded yet.</p>
        ) : (
          <div className="space-y-2">
            {cycles?.map((c) => (
              <div key={c.id} className="flex items-center gap-3 px-4 py-3 rounded-xl border border-parchment-200 dark:border-emerald-900/30">
                <div className={clsx('w-3 h-3 rounded-full', c.hayd_tuhr_status === 'hayd' ? 'bg-red-400' : 'bg-emerald-500')} />
                <div className="flex-1">
                  <p className="text-sm text-emerald-800 dark:text-emerald-300">
                    {format(new Date(c.start_date), 'd MMM')}
                    {c.end_date && ` — ${format(new Date(c.end_date), 'd MMM yyyy')}`}
                  </p>
                  {c.duration_days && <p className="text-xs text-muted">{c.duration_days} days • {c.blood_classification}</p>}
                </div>
                {c.ghusl_done && <CheckCircle size={14} className="text-emerald-600" title="Ghusl completed" />}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modals */}
      <Modal open={modal} onClose={() => setModal(false)} title="Start new cycle">
        <div className="space-y-4">
          <Input label="Start date" type="date" value={form.start_date}
            onChange={(e) => setForm({ ...form, start_date: e.target.value })} />
          <Textarea label="Notes (optional, private & encrypted)" rows={2} value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          <Textarea label="Symptoms (optional, private & encrypted)" rows={2} value={form.symptoms}
            onChange={(e) => setForm({ ...form, symptoms: e.target.value })} />
          <div className="flex gap-3">
            <Button variant="secondary" onClick={() => setModal(false)} className="flex-1">Cancel</Button>
            <Button variant="primary" onClick={() => startCycle()} loading={starting} className="flex-1">Start cycle</Button>
          </div>
        </div>
      </Modal>

      <Modal open={closeModal} onClose={() => setCloseModal(false)} title="End cycle">
        <div className="space-y-4">
          <Input label="End date" type="date" value={closeForm.end_date}
            onChange={(e) => setCloseForm({ ...closeForm, end_date: e.target.value })} />
          <p className="text-sm text-muted">After closing, ghusl will be required. The fiqh ruling will be recalculated with the full duration.</p>
          <div className="flex gap-3">
            <Button variant="secondary" onClick={() => setCloseModal(false)} className="flex-1">Cancel</Button>
            <Button variant="primary" onClick={() => closeCycle()} loading={closing} className="flex-1">End cycle</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

// ─── Fasting Tracker ──────────────────────────────────────────────────────────
function FastingTracker() {
  const qc = useQueryClient()
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState({
    fast_date: format(new Date(), 'yyyy-MM-dd'), fast_type: 'ramadan',
    completed: true, reason_missed: '', is_qadha: false,
  })
  const currentYear = new Date().getFullYear()

  const { data: summary } = useQuery({
    queryKey: ['female', 'fasting', 'summary'],
    queryFn: () => femaleApi.getMissedSummary(currentYear).then((r) => r.data),
  })

  const { data: logs } = useQuery({
    queryKey: ['female', 'fasting'],
    queryFn: () => femaleApi.getFasting({ year: currentYear }).then((r) => r.data),
  })

  const { mutate: logFast, isPending } = useMutation({
    mutationFn: () => femaleApi.logFast(form),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['female', 'fasting'] })
      setModal(false)
      toast.success('Fast logged!')
    },
  })

  return (
    <div className="space-y-5">
      {/* Summary */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard label="Missed" value={summary.total_missed} icon={AlertCircle} color="gold" />
          <StatCard label="Qadha made" value={summary.total_qadha_made} icon={CheckCircle} />
          <StatCard label="Remaining" value={summary.remaining_qadha} icon={Calendar} color="gold" />
          <StatCard label="Fidya owed" value={summary.fidya_owed} icon={Heart} color="gold" />
        </div>
      )}

      <div className="flex justify-between items-center">
        <h3 className="section-title">Fast Log {currentYear}</h3>
        <Button variant="primary" size="sm" onClick={() => setModal(true)}>
          <Plus size={14} /> Log fast
        </Button>
      </div>

      <div className="space-y-2">
        {logs?.slice(0, 20).map((log) => (
          <div key={log.id} className="flex items-center gap-3 px-4 py-3 rounded-xl border border-parchment-200 dark:border-emerald-900/30">
            <div className={clsx('w-3 h-3 rounded-full flex-shrink-0', log.completed ? 'bg-emerald-500' : 'bg-red-400')} />
            <div className="flex-1">
              <p className="text-sm text-emerald-800 dark:text-emerald-300">
                {format(new Date(log.fast_date), 'd MMMM yyyy')}
              </p>
              <p className="text-xs text-muted capitalize">
                {log.fast_type} {log.is_qadha ? '(qadha)' : ''} {log.reason_missed ? `— ${log.reason_missed}` : ''}
              </p>
            </div>
            {log.fidya_applicable && !log.fidya_paid && (
              <Badge variant="gold" className="text-xs">Fidya due</Badge>
            )}
            {log.completed && <CheckCircle size={14} className="text-emerald-600" />}
          </div>
        ))}
        {!logs?.length && <p className="text-muted text-center py-4 text-sm">No fasts logged yet.</p>}
      </div>

      <Modal open={modal} onClose={() => setModal(false)} title="Log fast">
        <div className="space-y-4">
          <Input label="Date" type="date" value={form.fast_date}
            onChange={(e) => setForm({ ...form, fast_date: e.target.value })} />
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Type</label>
              <select className="input" value={form.fast_type} onChange={(e) => setForm({ ...form, fast_type: e.target.value })}>
                <option value="ramadan">Ramadan</option>
                <option value="qadha">Qadha</option>
                <option value="voluntary">Voluntary</option>
                <option value="shawwal">Shawwal</option>
              </select>
            </div>
            <div>
              <label className="label">Status</label>
              <select className="input" value={form.completed ? 'completed' : 'missed'}
                onChange={(e) => setForm({ ...form, completed: e.target.value === 'completed' })}>
                <option value="completed">Completed</option>
                <option value="missed">Missed</option>
              </select>
            </div>
          </div>
          {!form.completed && (
            <div>
              <label className="label">Reason missed</label>
              <select className="input" value={form.reason_missed} onChange={(e) => setForm({ ...form, reason_missed: e.target.value })}>
                <option value="">Select reason</option>
                <option value="hayd">Hayd (menstruation)</option>
                <option value="nifas">Nifas (post-natal)</option>
                <option value="illness">Illness</option>
                <option value="travel">Travel</option>
                <option value="other">Other</option>
              </select>
            </div>
          )}
          <div className="flex gap-3">
            <Button variant="secondary" onClick={() => setModal(false)} className="flex-1">Cancel</Button>
            <Button variant="primary" onClick={() => logFast()} loading={isPending} className="flex-1">Save</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function Female() {
  const [tab, setTab] = useState(0)

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="page-title flex items-center gap-2">
          <Heart size={28} className="text-pink-500" />
          Sister's Space
        </h1>
        <p className="text-muted mt-1">Your private, encrypted space for women's Islamic health.</p>
      </div>

      <div className="flex gap-1 p-1 bg-parchment-100 dark:bg-emerald-900/30 rounded-xl mb-6">
        {TABS.map((t, i) => (
          <button key={t} onClick={() => setTab(i)}
            className={clsx('flex-1 py-2 rounded-lg text-sm font-medium transition-all',
              tab === i ? 'bg-white dark:bg-emerald-900 text-emerald-900 dark:text-white shadow-sm'
                : 'text-parchment-500 dark:text-emerald-600'
            )}>{t}</button>
        ))}
      </div>

      {tab === 0 && <CycleTracker />}
      {tab === 1 && <FastingTracker />}
      {tab === 2 && <FastingTracker />}
    </div>
  )
}
