import React, { useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { format } from 'date-fns'
import { Heart, Plus, CheckCircle, AlertCircle, Calendar, Info, ShieldAlert } from 'lucide-react'
import { femaleApi } from '@/lib/api'
import { useAuthStore } from '@/store/authStore'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Select } from '@/components/ui/compat'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import toast from 'react-hot-toast'

export const Route = createFileRoute('/_authenticated/female')({
  component: FemalePage,
})

const TABS = ['Cycle Tracker', 'Fasting Log']

const CLASSIFICATION_INFO = {
  hayd: { color: 'text-red-600 bg-red-500/10 border-red-500/20', label: 'Hayd (Menstruation)' },
  istihadah: { color: 'text-gold-600 bg-gold/10 border-gold/20', label: 'Istihadah (Irregular)' },
  tuhr: { color: 'text-green-600 bg-green-500/10 border-green-500/20', label: 'Tuhr (Purity)' },
  uncertain: { color: 'text-muted-foreground bg-muted border-border', label: 'Uncertain' },
}

function StatCard({ label, value, icon: Icon, colorClass }) {
  return (
    <Card className="p-4 sm:p-5 relative overflow-hidden">
      <div className="flex items-center justify-between mb-3">
        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{label}</p>
        <div className={cn("w-8 h-8 rounded-full flex items-center justify-center bg-muted", colorClass)}><Icon className="h-4 w-4" /></div>
      </div>
      <p className="text-2xl font-black text-foreground">{value}</p>
    </Card>
  )
}

function CycleTracker() {
  const qc = useQueryClient()
  const { getMadhab } = useAuthStore()
  const [modal, setModal] = useState(false)
  const [closeModal, setCloseModal] = useState(false)
  const [form, setForm] = useState({ start_date: format(new Date(), 'yyyy-MM-dd'), notes: '', symptoms: '' })
  const [closeForm, setCloseForm] = useState({ end_date: format(new Date(), 'yyyy-MM-dd') })

  const { data: current, isLoading: currentLoading } = useQuery({ queryKey: ['female', 'current'], queryFn: () => femaleApi.getCurrentCycle().then((r) => r.data).catch(() => null) })
  const { data: cycles = [], isLoading: cyclesLoading } = useQuery({ queryKey: ['female', 'cycles'], queryFn: () => femaleApi.getCycles().then((r) => r.data).catch(() => []) })

  const { mutate: startCycle, isPending: starting } = useMutation({
    mutationFn: () => femaleApi.startCycle(form),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['female'] }); setModal(false); toast.success(`Cycle started. Rulings calculated for ${getMadhab()} school.`) },
    onError: (e) => toast.error(e.response?.data?.detail || 'Could not start cycle.'),
  })

  const { mutate: closeCycle, isPending: closing } = useMutation({
    mutationFn: () => femaleApi.updateCycle(current.id, closeForm),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['female'] }); setCloseModal(false); toast.success('Cycle closed. Ghusl is required.') },
  })

  const { mutate: markGhusl } = useMutation({
    mutationFn: () => femaleApi.updateCycle(current.id, { ghusl_done: true, ghusl_date: format(new Date(), 'yyyy-MM-dd') }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['female'] }); toast.success('Ghusl marked complete. Welcome back to full ibadah! 🌙') },
  })

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
      <div className="flex items-start gap-3 p-4 bg-muted/50 border border-border rounded-xl">
        <ShieldAlert className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
        <p className="text-[13px] font-medium text-muted-foreground leading-relaxed">
          Rulings are calculated for the <strong className="text-foreground uppercase tracking-widest text-[11px] ml-1">{getMadhab()}</strong> school. For your specific situation, always consult a qualified scholar. This app is a guide, not a fatwa.
        </p>
      </div>

      {currentLoading ? <Skeleton className="h-48 rounded-2xl" /> : current ? (
        <Card className="p-5 sm:p-6 border-2 border-primary/20 bg-primary/5 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-6 opacity-5"><Heart className="h-32 w-32" /></div>
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 relative z-10">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <Badge variant="outline" className={cn("text-[10px] uppercase font-black px-2.5 py-1", CLASSIFICATION_INFO[current.blood_classification]?.color)}>
                  {CLASSIFICATION_INFO[current.blood_classification]?.label}
                </Badge>
                <Badge variant="secondary" className="text-[10px] uppercase font-black">Day {Math.ceil((new Date() - new Date(current.start_date)) / 86400000)}</Badge>
              </div>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Started {format(new Date(current.start_date), 'd MMM yyyy')}</p>
            </div>
            <div className="flex gap-2 shrink-0">
              {current.ghusl_required && !current.ghusl_done && <Button variant="outline" className="font-bold border-green-500/30 text-green-600 hover:bg-green-500/10" onClick={() => markGhusl()}><CheckCircle className="h-4 w-4 mr-1.5" /> Mark ghusl</Button>}
              <Button onClick={() => setCloseModal(true)} className="font-bold">End cycle</Button>
            </div>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-6">
            {[ { label: 'Salah', allowed: current.can_pray }, { label: 'Fasting', allowed: current.can_fast }, { label: 'Quran', allowed: current.can_read_quran }, { label: 'Ghusl req.', allowed: !current.ghusl_required || current.ghusl_done } ].map(({ label, allowed }) => (
              <div key={label} className={cn('flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors', allowed ? 'bg-background text-green-600 border border-green-500/20' : 'bg-background text-red-500 border border-red-500/20 opacity-70')}>
                {allowed ? <CheckCircle className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}{label}
              </div>
            ))}
          </div>
          {current.notes && <p className="mt-4 text-sm font-medium italic text-muted-foreground bg-background p-3 rounded-xl border border-border/50">"{current.notes}"</p>}
        </Card>
      ) : (
        <div className="text-center py-16 px-4 border-2 border-primary/20 rounded-3xl bg-primary/5">
          <Heart className="h-10 w-10 text-primary mx-auto mb-4" />
          <h3 className="text-lg font-bold text-foreground mb-1">Currently in Tuhr (purity)</h3>
          <p className="text-sm font-medium text-muted-foreground mb-6">All ibadah is fully open. Alhamdulillah.</p>
          <Button size="lg" className="font-bold" onClick={() => setModal(true)}><Plus className="h-4 w-4 mr-1.5" /> Start new cycle</Button>
        </div>
      )}

      <div>
        <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground mb-4">Cycle History</h3>
        {cyclesLoading ? <div className="space-y-3">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-16 rounded-2xl" />)}</div>
          : cycles.length === 0 ? <p className="text-sm font-medium text-muted-foreground text-center py-8">No cycles recorded yet.</p>
          : (
          <div className="space-y-3">
            {cycles.map((c) => (
              <Card key={c.id} className="p-4 flex items-center gap-4 transition-colors hover:border-primary/30">
                <div className={cn('w-4 h-4 rounded-full shrink-0 shadow-inner', c.hayd_tuhr_status === 'hayd' ? 'bg-red-500' : 'bg-green-500')} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-foreground mb-1">{format(new Date(c.start_date), 'd MMM')} {c.end_date && ` — ${format(new Date(c.end_date), 'd MMM yyyy')}`}</p>
                  {c.duration_days && <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{c.duration_days} days <span className="opacity-50 mx-1">•</span> {c.blood_classification}</p>}
                </div>
                {c.ghusl_done && <Badge variant="outline" className="border-green-500/30 text-green-600 bg-green-500/5 text-[9px] uppercase"><CheckCircle className="h-3 w-3 mr-1" /> Ghusl Done</Badge>}
              </Card>
            ))}
          </div>
        )}
      </div>

      <Dialog open={modal} onOpenChange={setModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Start new cycle</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div><label className="text-xs font-bold text-foreground mb-1 block">Start Date</label><Input type="date" value={form.start_date} onChange={e => setForm({ ...form, start_date: e.target.value })} /></div>
            <div><label className="text-xs font-bold text-foreground mb-1 block">Notes (Private & Encrypted)</label><Textarea rows={2} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} placeholder="Any observations..." className="resize-none" /></div>
            <div><label className="text-xs font-bold text-foreground mb-1 block">Symptoms</label><Textarea rows={2} value={form.symptoms} onChange={e => setForm({ ...form, symptoms: e.target.value })} placeholder="Headache, cramps, etc." className="resize-none" /></div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0 mt-4">
            <DialogClose asChild><Button type="button" variant="outline">Cancel</Button></DialogClose>
            <Button onClick={() => startCycle()} disabled={starting}>{starting ? 'Starting...' : 'Start cycle'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={closeModal} onOpenChange={setCloseModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>End cycle</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div><label className="text-xs font-bold text-foreground mb-1 block">End Date</label><Input type="date" value={closeForm.end_date} onChange={e => setCloseForm({ ...closeForm, end_date: e.target.value })} /></div>
            <p className="text-xs font-medium text-muted-foreground p-3 border border-border bg-muted/50 rounded-xl">After closing, ghusl will be required. The fiqh ruling will be recalculated with the full duration.</p>
          </div>
          <DialogFooter className="gap-2 sm:gap-0 mt-4">
            <DialogClose asChild><Button type="button" variant="outline">Cancel</Button></DialogClose>
            <Button onClick={() => closeCycle()} disabled={closing}>{closing ? 'Ending...' : 'End cycle'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function FastingTracker() {
  const qc = useQueryClient()
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState({ fast_date: format(new Date(), 'yyyy-MM-dd'), fast_type: 'ramadan', completed: true, reason_missed: '', is_qadha: false })
  const currentYear = new Date().getFullYear()

  const { data: summary } = useQuery({ queryKey: ['female', 'fasting', 'summary'], queryFn: () => femaleApi.getMissedSummary(currentYear).then((r) => r.data).catch(() => null) })
  const { data: logs = [] } = useQuery({ queryKey: ['female', 'fasting'], queryFn: () => femaleApi.getFasting({ year: currentYear }).then((r) => r.data).catch(() => []) })

  const { mutate: logFast, isPending } = useMutation({
    mutationFn: () => femaleApi.logFast(form),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['female', 'fasting'] }); setModal(false); toast.success('Fast logged!') },
  })

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard label="Missed" value={summary.total_missed} icon={AlertCircle} colorClass="text-red-500 bg-red-500/10" />
          <StatCard label="Qadha made" value={summary.total_qadha_made} icon={CheckCircle} colorClass="text-green-500 bg-green-500/10" />
          <StatCard label="Remaining" value={summary.remaining_qadha} icon={Calendar} colorClass="text-orange-500 bg-orange-500/10" />
          <StatCard label="Fidya Due" value={summary.fidya_owed} icon={Heart} colorClass="text-gold bg-gold/10" />
        </div>
      )}

      <div>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Fast Log {currentYear}</h3>
          <Button size="sm" onClick={() => setModal(true)} className="font-bold"><Plus className="h-4 w-4 mr-1.5" /> Log fast</Button>
        </div>

        <div className="space-y-3">
          {logs.slice(0, 20).map((log) => (
            <Card key={log.id} className="p-4 flex items-center gap-4 transition-colors hover:border-primary/30">
              <div className={cn('w-4 h-4 rounded-full shrink-0 shadow-inner', log.completed ? 'bg-primary' : 'bg-red-500')} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-foreground mb-1">{format(new Date(log.fast_date), 'd MMM yyyy')}</p>
                <div className="flex items-center gap-2 flex-wrap text-[10px] uppercase font-black tracking-widest">
                  <Badge variant="secondary" className="text-[9px]">{log.fast_type}</Badge>
                  {log.is_qadha && <Badge variant="outline" className="text-[9px] border-primary/30 text-primary bg-primary/5">Qadha</Badge>}
                  {!log.completed && log.reason_missed && <span className="text-muted-foreground">{log.reason_missed}</span>}
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {log.fidya_applicable && !log.fidya_paid && <Badge className="bg-gold text-gold-foreground border-0 text-[9px] uppercase font-black">Fidya due</Badge>}
                {log.completed && <CheckCircle className="h-5 w-5 text-primary" />}
              </div>
            </Card>
          ))}
          {logs.length === 0 && <p className="text-sm font-medium text-muted-foreground text-center py-8">No fasts logged yet.</p>}
        </div>
      </div>

      <Dialog open={modal} onOpenChange={setModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Log fast</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div><label className="text-xs font-bold text-foreground mb-1 block">Date</label><Input type="date" value={form.fast_date} onChange={e => setForm({ ...form, fast_date: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><label className="text-xs font-bold text-foreground mb-1 block">Type</label><Select value={form.fast_type} onChange={e => setForm({ ...form, fast_type: e.target.value })} options={['ramadan', 'qadha', 'voluntary', 'shawwal'].map(v => ({label: v, value: v}))} className="capitalize" /></div>
              <div><label className="text-xs font-bold text-foreground mb-1 block">Status</label><Select value={form.completed ? 'completed' : 'missed'} onChange={e => setForm({ ...form, completed: e.target.value === 'completed' })} options={['completed', 'missed'].map(v => ({label: v, value: v}))} className="capitalize" /></div>
            </div>
            {!form.completed && (
              <div><label className="text-xs font-bold text-foreground mb-1 block">Reason Missed</label><Select value={form.reason_missed} onChange={e => setForm({ ...form, reason_missed: e.target.value })} options={[{label:'Select reason',value:''}, {label:'Hayd (menstruation)',value:'hayd'}, {label:'Nifas (post-natal)',value:'nifas'}, {label:'Illness',value:'illness'}, {label:'Travel',value:'travel'}, {label:'Other',value:'other'}]} /></div>
            )}
          </div>
          <DialogFooter className="gap-2 sm:gap-0 mt-4">
            <DialogClose asChild><Button type="button" variant="outline">Cancel</Button></DialogClose>
            <Button onClick={() => logFast()} disabled={isPending}>{isPending ? 'Saving...' : 'Save Log'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default function FemalePage() {
  const [tab, setTab] = useState(0)

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 md:py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">Sister's Space <Heart className="h-6 w-6 text-pink-500 fill-current" /></h1>
          <p className="text-sm font-medium text-muted-foreground mt-0.5">Your private, encrypted space for women's Islamic health.</p>
        </div>
      </div>

      <div className="flex p-1 rounded-xl bg-muted gap-1 w-fit">
        {TABS.map((t, i) => (
          <button key={t} onClick={() => setTab(i)} className={cn('px-4 py-2.5 rounded-lg text-xs font-bold transition-all', tab === i ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground')}>
            {t}
          </button>
        ))}
      </div>

      <div className="pt-2">
        {tab === 0 && <CycleTracker />}
        {tab === 1 && <FastingTracker />}
      </div>
    </div>
  )
}
