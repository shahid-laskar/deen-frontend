import React, { useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { format } from 'date-fns'
import { Plus, Dumbbell, Flame, Clock, Trash2, Check } from 'lucide-react'
import api from '@/lib/api'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Select } from '@/components/ui/compat'
import { cn } from '@/lib/utils'
import toast from 'react-hot-toast'

export const Route = createFileRoute('/_authenticated/workout')({
  component: WorkoutPage,
})

const TIME_BLOCKS = ['after_fajr', 'morning', 'after_asr', 'evening', 'after_isha']
const TIME_BLOCK_LABELS = { after_fajr: '🌅 After Fajr', morning: '☀️ Morning', after_asr: '🌆 After Asr', evening: '🌙 Evening', after_isha: '⭐ After Isha' }

function StatCard({ label, value, sub, icon: Icon, color }) {
  return (
    <Card className="p-4 sm:p-5 relative overflow-hidden">
      <div className="flex items-center justify-between mb-3">
        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{label}</p>
        <div className={cn("w-8 h-8 rounded-full flex items-center justify-center bg-primary/10", color ? `text-${color}` : "text-primary")}><Icon className="h-4 w-4" /></div>
      </div>
      <div>
        <p className="text-2xl font-black text-foreground">{value}</p>
        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mt-1">{sub}</p>
      </div>
    </Card>
  )
}

function WorkoutPage() {
  const qc = useQueryClient()
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState({
    session_date: format(new Date(), 'yyyy-MM-dd'), session_name: '', duration_minutes: '', calories_burned: '', time_block: '', notes: '', rating: ''
  })

  const { data: stats } = useQuery({ queryKey: ['workout', 'stats'], queryFn: () => api.get('/workout/stats').then(r => r.data).catch(() => null) })
  const { data: sessions = [], isLoading } = useQuery({
    queryKey: ['workout', 'sessions'],
    queryFn: () => api.get('/workout/sessions', { params: { start_date: format(new Date(Date.now() - 30 * 864e5), 'yyyy-MM-dd') } }).then(r => r.data).catch(() => []),
  })
  const { data: plan } = useQuery({ queryKey: ['workout', 'active-plan'], queryFn: () => api.get('/workout/plans').then(r => r.data[0]).catch(() => null) })

  const { mutate: logSession, isPending } = useMutation({
    mutationFn: () => api.post('/workout/sessions', {
      ...form, duration_minutes: form.duration_minutes ? parseInt(form.duration_minutes) : null, calories_burned: form.calories_burned ? parseFloat(form.calories_burned) : null, rating: form.rating ? parseInt(form.rating) : null,
    }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['workout'] }); setModal(false); toast.success('Workout logged! MashaaAllah 💪'); setForm({session_date: format(new Date(), 'yyyy-MM-dd'), session_name: '', duration_minutes: '', calories_burned: '', time_block: '', notes: '', rating: ''}) },
  })

  const { mutate: deleteSession } = useMutation({
    mutationFn: (id) => api.delete(`/workout/sessions/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['workout'] }),
  })

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 md:py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">Workout Planner <Dumbbell className="h-6 w-6 text-primary" /></h1>
          <p className="text-sm font-medium text-muted-foreground mt-0.5">Strength is an amanah — use it carefully.</p>
        </div>
        <Button onClick={() => setModal(true)} className="font-bold"><Plus className="h-4 w-4 mr-1.5" /> Log workout</Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
        <StatCard label="This week" value={stats?.sessions_this_week ?? 0} sub="sessions" icon={Dumbbell} />
        <StatCard label="Total sessions" value={stats?.total_sessions ?? 0} sub="all time" icon={Check} color="green-500" />
        <div className="col-span-2 md:col-span-1"><StatCard label="Total time" value={`${Math.round((stats?.total_minutes ?? 0) / 60)}h`} sub="trained" icon={Clock} color="gold" /></div>
      </div>

      {plan && (
        <Card className="p-4 bg-primary/5 border-primary/20 shadow-none">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-primary/20 text-primary flex items-center justify-center text-2xl font-bold shrink-0 shadow-sm border border-primary/10">🏋️</div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <p className="font-bold text-base text-foreground truncate">{plan.name}</p>
                {plan.is_ramadan_mode && <Badge className="bg-gold text-gold-foreground text-[9px] uppercase border-0 shrink-0">Ramadan Mode</Badge>}
              </div>
              <p className="text-xs font-bold text-primary tracking-wide uppercase mt-1">{plan.days_per_week}x / week <span className="opacity-50 mx-1">•</span> {plan.goal || 'General fitness'}</p>
            </div>
          </div>
        </Card>
      )}

      <div>
        <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground mb-4">Recent Sessions</h3>
        {isLoading ? (
          <div className="space-y-3">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-24 rounded-2xl" />)}</div>
        ) : sessions.length === 0 ? (
          <div className="text-center py-16 px-4 border-2 border-dashed border-border rounded-3xl bg-muted/30">
            <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4 text-primary"><Dumbbell className="h-8 w-8" /></div>
            <h3 className="text-base font-bold text-foreground mb-1">No workouts logged yet</h3>
            <p className="text-sm text-muted-foreground mb-6">The Prophet ﷺ was strong and active. Log your first session today.</p>
            <Button onClick={() => setModal(true)}>Log first workout</Button>
          </div>
        ) : (
          <div className="space-y-3">
            {sessions.map(s => (
              <Card key={s.id} className="p-4 sm:p-5 group hover:border-primary/40 transition-colors">
                <div className="flex items-start gap-3 sm:gap-4">
                  <div className="w-12 h-12 bg-muted rounded-xl flex items-center justify-center text-2xl shrink-0 group-hover:scale-110 transition-transform shadow-sm border border-border">💪</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-bold text-base text-foreground mb-1 leading-tight">{s.session_name || 'Workout session'}</p>
                        <div className="flex flex-wrap items-center gap-2">
                          {s.time_block && <Badge variant="secondary" className="text-[9px] uppercase font-bold">{TIME_BLOCK_LABELS[s.time_block] || s.time_block}</Badge>}
                          {s.rating && <Badge variant="outline" className="text-[9px] border-gold/30 bg-gold/5 text-gold-foreground">{'⭐'.repeat(s.rating)}</Badge>}
                        </div>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <span className="text-[11px] font-bold text-muted-foreground uppercase">{format(new Date(s.session_date), 'd MMM')}</span>
                        <button onClick={() => deleteSession(s.id)} className="block sm:opacity-0 group-hover:opacity-100 p-1.5 rounded-md text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-all"><Trash2 className="h-4 w-4" /></button>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 mt-3 pt-3 border-t border-border/50 text-[11px] font-bold text-muted-foreground uppercase tracking-widest">
                      {s.duration_minutes && <span className="flex items-center gap-1.5 text-foreground"><Clock className="h-3.5 w-3.5 text-blue-500" /> {s.duration_minutes}m duration</span>}
                      {s.calories_burned && <span className="flex items-center gap-1.5 text-foreground"><Flame className="h-3.5 w-3.5 text-orange-500" /> {s.calories_burned} kcal</span>}
                    </div>
                    {s.notes && <p className="text-sm italic font-medium text-muted-foreground mt-3 bg-muted/50 p-2.5 rounded-lg">"{s.notes}"</p>}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      <Dialog open={modal} onOpenChange={setModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Log Workout Session</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div><label className="text-xs font-bold text-foreground mb-1 block">Date</label><Input type="date" value={form.session_date} onChange={e => setForm({ ...form, session_date: e.target.value })} /></div>
              <div><label className="text-xs font-bold text-foreground mb-1 block">Time Block</label><Select value={form.time_block} onChange={e => setForm({ ...form, time_block: e.target.value })} options={[{value:'',label:'None'}].concat(TIME_BLOCKS.map(b => ({value:b,label:TIME_BLOCK_LABELS[b]})))} /></div>
            </div>
            <div><label className="text-xs font-bold text-foreground mb-1 block">Session Name</label><Input placeholder="e.g. Push day, cardio" value={form.session_name} onChange={e => setForm({ ...form, session_name: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><label className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground mb-1 block">Duration (min)</label><Input type="number" value={form.duration_minutes} onChange={e => setForm({ ...form, duration_minutes: e.target.value })} /></div>
              <div><label className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground mb-1 block">Calories</label><Input type="number" value={form.calories_burned} onChange={e => setForm({ ...form, calories_burned: e.target.value })} /></div>
            </div>
            <div>
              <label className="text-xs font-bold text-foreground mb-2 block">Rating</label>
              <div className="flex gap-2 p-2 bg-muted/50 rounded-xl w-fit">
                {[1, 2, 3, 4, 5].map(r => (
                  <button key={r} onClick={() => setForm({ ...form, rating: r })} className={cn("text-2xl transition-all hover:scale-110", parseInt(form.rating) >= r ? "opacity-100 grayscale-0" : "opacity-30 grayscale")}>⭐</button>
                ))}
              </div>
            </div>
            <div><label className="text-xs font-bold text-foreground mb-1 block">Notes / Feelings</label><Input placeholder="How did the session feel? Any PRs?" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} /></div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0 mt-4">
            <DialogClose asChild><Button type="button" variant="outline">Cancel</Button></DialogClose>
            <Button onClick={() => logSession()} disabled={isPending}>{isPending ? 'Logging...' : 'Save Workout'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
