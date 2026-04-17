import React, { useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { format, subDays, startOfWeek, eachDayOfInterval } from 'date-fns'
import { Plus, Flame, Trash2, Check, BarChart2, Library, Layers, ChevronDown } from 'lucide-react'
import api from '@/lib/api'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import toast from 'react-hot-toast'

export const Route = createFileRoute('/_authenticated/habits')({
  component: HabitsPage,
})

const TABS = ['today', 'library', 'analytics', 'dhikr']
const TAB_LABELS = { today: 'Today', library: 'Library', analytics: 'Analytics', dhikr: 'Dhikr' }

const CAT_ICONS = { ibadah:'🕌', quran:'📖', dhikr:'📿', sunnah:'🌙', health:'💪', learning:'📚', personal:'✅', family:'👨‍👩‍👧', fasting:'🌙', sadaqah:'💚', avoid:'🚫' }
const DIFF_COLOR = { easy:'text-green-500 bg-green-500/10', medium:'text-orange-500 bg-orange-500/10', hard:'text-red-500 bg-red-500/10', epic:'text-purple-500 bg-purple-500/10' }
const TYPE_BADGE = { binary:'✓', quantity:'#', duration:'⏱', avoid:'✗', checklist:'☑' }
const HABIT_TYPES = ['binary','quantity','duration','avoid','checklist']
const DIFFICULTIES = ['easy','medium','hard','epic']
const CATEGORIES = ['ibadah','quran','dhikr','sunnah','health','learning','personal','family','fasting','sadaqah','avoid']

function Heatmap52({ data }) {
  const today = new Date()
  const start = subDays(today, 364)
  const weeks = []
  let day = startOfWeek(start, { weekStartsOn: 0 })
  while (day <= today) {
    const end = new Date(Math.min(day.getTime() + 6*86400000, today.getTime()))
    weeks.push(eachDayOfInterval({ start: day, end }))
    day = new Date(day.getTime() + 7*86400000)
  }
  const byDate = {}
  data?.forEach(d => { byDate[d.date] = d })

  return (
    <div className="overflow-x-auto pb-2 scrollbar-none">
      <div className="flex gap-1 min-w-max">
        {weeks.map((week, wi) => (
          <div key={wi} className="flex flex-col gap-1">
            {week.map((d, di) => {
              const k = format(d, 'yyyy-MM-dd')
              const cell = byDate[k]
              return <div key={di} title={k} className={cn("w-3 h-3 rounded-sm", cell?.completed ? "bg-primary" : "bg-muted")} />
            })}
          </div>
        ))}
      </div>
      <div className="flex items-center gap-2 mt-3 text-[10px] uppercase font-bold text-muted-foreground w-max ml-auto">
        <span>Less</span>
        {[0.15, 0.35, 0.6, 0.85, 1].map((v, i) => <div key={i} className="w-3 h-3 rounded-sm bg-primary" style={{ opacity: v }} />)}
        <span>More</span>
      </div>
    </div>
  )
}

function HabitRow({ habit, onLog, onDelete }) {
  const [expanded, setExpanded] = useState(false)
  const qc = useQueryClient()
  const done = habit.completed_today
  const tokens = habit.rahmah_tokens || 0

  const { data: checklistItems = [] } = useQuery({
    queryKey: ['habits', habit.id, 'checklist'],
    queryFn: () => api.get(`/habits/${habit.id}/checklist`).then(r => r.data).catch(() => []),
    enabled: habit.habit_type === 'checklist',
  })

  const { mutate: toggleItem } = useMutation({
    mutationFn: (itemId) => api.post(`/habits/${habit.id}/checklist/${itemId}/log`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['habits'] }),
  })

  const { mutate: useToken } = useMutation({
    mutationFn: () => api.post(`/habits/${habit.id}/use-token`),
    onSuccess: () => { qc.invalidateQueries({ queryKey:['habits'] }); toast.success('Rahmah Token used — streak protected') },
    onError: (e) => toast.error(e.response?.data?.detail || 'No tokens available'),
  })

  return (
    <div className={cn("rounded-2xl border transition-all overflow-hidden", done ? "bg-primary/5 border-primary/30" : "bg-card border-border shadow-sm")}>
      <div className="p-3 sm:p-4 flex items-center gap-3 sm:gap-4">
        <button onClick={() => onLog(habit)} className={cn("w-10 h-10 rounded-full border-2 flex items-center justify-center shrink-0 transition-all", done ? "bg-primary border-primary text-primary-foreground" : "border-muted-foreground/30 bg-background hover:border-primary")}>
          {done && <Check className="h-5 w-5" />}
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-xl shrink-0">{habit.icon || CAT_ICONS[habit.category] || '✅'}</span>
            <p className="font-bold text-sm text-foreground truncate">{habit.name}</p>
            <span className={cn("text-[9px] font-black uppercase px-1.5 py-0.5 rounded-sm shrink-0", DIFF_COLOR[habit.difficulty])}>{TYPE_BADGE[habit.habit_type]}</span>
          </div>
          <div className="flex items-center gap-3 mt-1.5 overflow-x-auto scrollbar-none pb-0.5">
            {habit.current_streak > 0 && <span className="flex items-center gap-1 text-[10px] font-bold text-orange-500 uppercase"><Flame className="h-3 w-3" /> {habit.current_streak}d streak</span>}
            {tokens > 0 && <span className="text-[10px] font-bold text-purple-500 uppercase flex items-center gap-1">☪️ ×{tokens} token</span>}
            <span className="text-[10px] font-bold text-muted-foreground uppercase">{habit.completion_rate_30d}% (30d)</span>
          </div>
        </div>
        <div className="flex gap-1.5 shrink-0">
          {habit.habit_type === 'checklist' && <Button variant="secondary" size="icon" className="h-8 w-8" onClick={() => setExpanded(!expanded)}><ChevronDown className={cn("h-4 w-4 transition-transform", expanded && "rotate-180")} /></Button>}
          {!done && tokens > 0 && <Button size="icon" className="h-8 w-8 bg-purple-500-10 text-purple-600 hover:bg-purple-500-20" onClick={() => useToken()}>☪️</Button>}
          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:bg-destructive/10 hover:text-destructive" onClick={() => onDelete(habit.id)}><Trash2 className="h-4 w-4" /></Button>
        </div>
      </div>
      {expanded && checklistItems.length > 0 && (
        <div className="border-t border-border p-3 sm:p-4 bg-muted/30 space-y-2">
          {checklistItems.map(item => (
            <div key={item.id} className="flex items-center gap-3">
              <button onClick={() => toggleItem(item.id)} className={cn("w-6 h-6 rounded-md border-2 flex items-center justify-center shrink-0", "border-primary/50 text-primary")}>
                <Check className="h-3.5 w-3.5 pointer-events-none opacity-60" />
              </button>
              <span className="text-xs font-semibold text-foreground">{item.label}</span>
              {item.repetition_count > 1 && <Badge variant="secondary" className="text-[9px] uppercase">×{item.repetition_count}</Badge>}
              {item.arabic_text && <span className="font-amiri text-base text-primary ml-auto" dir="rtl">{item.arabic_text}</span>}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function HabitsPage() {
  const qc = useQueryClient()
  const searchParams = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '')
  const tTab = searchParams.get('tab')
  const initialTab = TABS.includes(tTab) ? tTab : 'today'
  const [tab, setTab] = useState(initialTab)
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState({ name: '', category: 'ibadah', difficulty: 'easy', habit_type: 'binary', target_value: 1, icon: '' })
  
  const { data: habits = [] } = useQuery({ queryKey:['habits'], queryFn: () => api.get('/habits').then(r=>r.data).catch(()=>[]) })
  const { data: analytics } = useQuery({ queryKey:['habits','analytics'], queryFn: () => api.get('/habits/analytics/summary').then(r=>r.data).catch(()=>null) })
  
  const { mutate: logHabit } = useMutation({
    mutationFn: (habit) => api.post('/habits/log', {
      habit_id: habit.id,
      log_date: format(new Date(), 'yyyy-MM-dd'),
      count: 1,
      completed: true
    }),
    onSuccess: () => { qc.invalidateQueries({ queryKey:['habits'] }); toast.success('Alhamdulillah, habit logged!') },
    onError: (e) => toast.error(e.response?.data?.detail || 'Failed to log habit')
  })

  const { mutate: createHabit, isPending: creating } = useMutation({
    mutationFn: () => api.post('/habits', form),
    onSuccess: () => { qc.invalidateQueries({ queryKey:['habits'] }); setModal(false); toast.success('Habit created!') }
  })

  const { mutate: deleteHabit } = useMutation({
    mutationFn: (id) => api.delete(`/habits/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey:['habits'] }); toast.success('Habit deleted') }
  })

  const doneCount = habits.filter(h => h.completed_today).length
  const pct = habits.length ? Math.round((doneCount / habits.length)*100) : 0

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 md:py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Habits</h1>
          <p className="text-sm font-medium text-muted-foreground mt-0.5">Build consistency, step by step.</p>
        </div>
        <Button size="sm" onClick={() => setModal(true)} className="h-9 font-bold bg-primary text-primary-foreground">
          <Plus className="h-4 w-4 mr-1.5" /> New Habit
        </Button>
      </div>

      <div className="flex gap-1 p-1 bg-muted rounded-xl w-fit">
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)} className={cn("px-4 py-2 rounded-lg text-xs font-bold transition-all", tab === t ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}>
            {TAB_LABELS[t]}
          </button>
        ))}
      </div>

      <div className="pt-2 animate-in fade-in slide-in-from-bottom-2">
        {tab === 'today' && (
          <div className="space-y-6">
            <Card className="p-4 flex items-center justify-between border-primary/20 bg-primary/5">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-primary mb-1">Today's Progress</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-black text-foreground">{doneCount}</span>
                  <span className="text-sm font-bold text-muted-foreground uppercase">/ {habits.length} done</span>
                </div>
              </div>
              <div className="relative w-16 h-16 rounded-full border-4 border-muted flex items-center justify-center shrink-0">
                <svg className="absolute inset-0 w-full h-full -rotate-90">
                  <circle cx="28" cy="28" r="28" fill="none" stroke="currentColor" strokeWidth="4" className="text-primary transition-all duration-1000 ease-out" strokeDasharray={175.92} strokeDashoffset={175.92 - (175.92 * pct) / 100} />
                </svg>
                <span className="text-xs font-black text-foreground">{pct}%</span>
              </div>
            </Card>

            {habits.length === 0 ? (
              <div className="text-center py-16 px-4 border-2 border-dashed border-border rounded-3xl bg-card">
                <span className="text-5xl block mb-4">🌱</span>
                <h3 className="text-base font-bold text-foreground mb-1">Start small</h3>
                <p className="text-sm text-muted-foreground mb-6 max-w-sm mx-auto">"The most beloved of deeds to Allah are those that are most consistent, even if it is small." — Bukhari</p>
                <Button onClick={() => setModal(true)}>Add your first habit</Button>
              </div>
            ) : (
              <div className="space-y-3">
                {habits.map(h => <HabitRow key={h.id} habit={h} onLog={logHabit} onDelete={deleteHabit} />)}
              </div>
            )}
          </div>
        )}

        {tab === 'analytics' && analytics && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-3">
              <Card className="p-4 border-orange-500/20 bg-orange-500/5">
                <p className="text-[10px] uppercase font-black tracking-wider text-orange-600 mb-1 flex items-center gap-1.5"><Flame className="h-3 w-3" /> Best Streak</p>
                <p className="text-2xl font-black text-foreground">{analytics.longest_streak_all_time}<span className="text-sm text-muted-foreground font-medium ml-1">days</span></p>
              </Card>
              <Card className="p-4 border-primary/20 bg-primary/5">
                <p className="text-[10px] uppercase font-black tracking-wider text-primary mb-1 flex items-center gap-1.5"><Check className="h-3 w-3" /> Total Checked</p>
                <p className="text-2xl font-black text-foreground">{analytics.total_completions}</p>
              </Card>
            </div>
            
            <Card className="p-5">
              <h3 className="text-sm font-bold text-foreground mb-6">Annual Consistency</h3>
              <Heatmap52 data={analytics.heatmap_data || []} />
            </Card>
            
            <Card className="p-5">
              <h3 className="text-sm font-bold text-foreground mb-4">Habit Breakdown</h3>
              <div className="space-y-3">
                {CATEGORIES.filter(c => analytics[c + '_count'] > 0).map(c => (
                  <div key={c} className="flex items-center justify-between text-sm py-1 border-b border-border/50 last:border-0">
                    <span className="font-medium text-foreground capitalize flex items-center gap-2"><span>{CAT_ICONS[c]}</span> {c}</span>
                    <span className="font-bold text-muted-foreground">{analytics[c + '_count']}</span>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        )}

        {tab === 'dhikr' && <DhikrTab />}

        {tab === 'library' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              { n: 'Morning Adhkar', c: 'dhikr', d: 'easy', t: 'checklist', i: '🌅' },
              { n: 'Read 1 Page Quran', c: 'quran', d: 'easy', t: 'binary', i: '📖' },
              { n: 'Pray Fajr in Mosque', c: 'ibadah', d: 'hard', t: 'binary', i: '🕌' },
              { n: 'No Backbiting', c: 'avoid', d: 'epic', t: 'binary', i: '🤐' },
            ].map((tmpl, j) => (
              <Card key={j} className="p-4 hover:border-primary/50 transition-colors text-left cursor-pointer" onClick={() => { setForm({ ...form, name: tmpl.n, category: tmpl.c, difficulty: tmpl.d, habit_type: tmpl.t, icon: tmpl.i }); setModal(true) }}>
                <div className="flex items-start gap-3">
                  <span className="text-2xl mt-0.5">{tmpl.i}</span>
                  <div>
                    <h3 className="font-bold text-sm text-foreground">{tmpl.n}</h3>
                    <div className="flex gap-1 mt-2">
                      <Badge variant="secondary" className="text-[9px] uppercase">{tmpl.c}</Badge>
                      <Badge variant="outline" className={cn("text-[9px] uppercase border-0", DIFF_COLOR[tmpl.d])}>{tmpl.d}</Badge>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      <Dialog open={modal} onOpenChange={setModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Create a Habit</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div><label className="text-xs font-bold text-foreground mb-1.5 block">Name</label><Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} autoFocus /></div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-foreground mb-1.5 block">Category</label>
                <select className="flex h-10 w-full items-center justify-between rounded-xl border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring capitalize" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-foreground mb-1.5 block">Difficulty</label>
                <select className="flex h-10 w-full items-center justify-between rounded-xl border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring capitalize" value={form.difficulty} onChange={e => setForm({ ...form, difficulty: e.target.value })}>
                  {DIFFICULTIES.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="text-xs font-bold text-foreground mb-1.5 block">Type</label>
              <div className="grid grid-cols-3 gap-2">
                {HABIT_TYPES.map(t => (
                  <button key={t} onClick={() => setForm({ ...form, habit_type: t })} className={cn("py-2 rounded-xl text-xs font-bold capitalize transition-all border", form.habit_type === t ? "bg-primary/10 border-primary text-primary" : "bg-card border-border text-muted-foreground hover:bg-muted")}>{t}</button>
                ))}
              </div>
            </div>
            {form.habit_type !== 'binary' && form.habit_type !== 'checklist' && (
              <div><label className="text-xs font-bold text-foreground mb-1.5 block">Target</label><Input type="number" min="1" value={form.target_value} onChange={e => setForm({ ...form, target_value: parseInt(e.target.value) || 1 })} /></div>
            )}
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <DialogClose asChild><Button type="button" variant="outline">Cancel</Button></DialogClose>
            <Button onClick={() => createHabit()} disabled={creating || !form.name.trim()}>{creating ? 'Creating...' : 'Create'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function DhikrTab() {
  const qc = useQueryClient()
  const [activeSession, setActiveSession] = useState(null)
  const [customTarget, setCustomTarget] = useState(33)

  const { data: presets = [] } = useQuery({ queryKey: ['dhikr','presets'], queryFn: () => api.get('/dhikr/presets').then(r => r.data).catch(() => []) })
  const { data: sessions = [] } = useQuery({ queryKey: ['dhikr','sessions'], queryFn: () => api.get('/dhikr/sessions').then(r => r.data).catch(() => []) })
  const { data: history = [] } = useQuery({ queryKey: ['dhikr','history'], queryFn: () => api.get('/dhikr/history').then(r => r.data).catch(() => []) })

  const { mutate: startSession } = useMutation({
    mutationFn: (preset) => api.post('/dhikr/sessions', { dhikr_type: preset.type, target_count: customTarget }),
    onSuccess: (data) => { setActiveSession(data.data); qc.invalidateQueries({ queryKey: ['dhikr'] }) },
  })

  const { mutate: increment } = useMutation({
    mutationFn: () => api.post(`/dhikr/sessions/${activeSession.id}/increment`, { increment: 1 }),
    onSuccess: (data) => {
      setActiveSession(data.data)
      if (data.data.is_completed) { toast.success('Alhamdulillah! Session complete 🤲'); qc.invalidateQueries({ queryKey: ['dhikr'] }) }
    },
  })

  const tap = React.useCallback(() => {
    if (window.navigator?.vibrate) window.navigator.vibrate(8)
    if (activeSession && !activeSession.is_completed) increment()
  }, [activeSession, increment])

  const pct = activeSession ? (activeSession.current_count / activeSession.target_count) * 100 : 0

  if (activeSession && !activeSession.is_completed) {
    const preset = presets.find(p => p.type === activeSession.dhikr_type)
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-8 animate-in zoom-in-95 sequence">
        <div className="text-center">
          <p className="text-xs font-bold text-muted-foreground mb-2 uppercase tracking-widest">{preset?.label}</p>
          <p className="font-amiri text-5xl leading-relaxed text-primary" dir="rtl">{preset?.arabic}</p>
        </div>

        <button onClick={tap} onMouseDown={e => e.currentTarget.style.transform = 'scale(0.95)'} onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'} className="relative w-56 h-56 rounded-full border-0 cursor-pointer flex items-center justify-center shadow-md transition-transform duration-75 select-none" style={{ background: `conic-gradient(var(--t-primary) ${pct}%, oklch(var(--border)) ${pct}%)` }}>
          <div className="w-48 h-48 rounded-full bg-card flex flex-col items-center justify-center border-4 border-background">
            <span className="text-6xl font-black text-foreground leading-none mb-1">{activeSession.current_count}</span>
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">of {activeSession.target_count}</span>
          </div>
        </button>

        <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mt-4">Tap the circle to count</p>

        <Button variant="outline" onClick={() => setActiveSession(null)}>← Save & Pause</Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-foreground">Dhikr Counter</h2>
        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mt-0.5">Keep your tongue moist with remembrance</p>
      </div>

      <Card className="p-5">
        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-3 block">Target count</p>
        <div className="flex gap-2 mb-4">
          {[33, 99, 100, 1000].map(n => (
            <button key={n} onClick={() => setCustomTarget(n)} className={cn("flex-1 py-2 rounded-lg text-sm font-bold transition-all", customTarget===n ? 'bg-primary/10 text-primary border border-primary/30' : 'bg-muted text-muted-foreground hover:bg-muted/80')}>{n}</button>
          ))}
        </div>
        <Input type="number" placeholder="Custom target" value={customTarget} onChange={e => setCustomTarget(Number(e.target.value) || 33)} />
      </Card>

      <div className="grid gap-3">
        {presets.map(preset => (
          <button key={preset.type} onClick={() => startSession(preset)} className="w-full flex items-center gap-4 p-4 rounded-xl border border-border bg-card hover:border-primary/40 transition-colors text-left group">
            <div className="flex-1 min-w-0">
              <p className="font-bold text-sm text-foreground">{preset.label}</p>
              <p className="font-amiri text-xl text-primary text-right rtl mt-2">{preset.arabic}</p>
            </div>
            <Badge variant="secondary" className="shrink-0 text-[10px] uppercase tracking-widest font-black">×{customTarget}</Badge>
          </button>
        ))}
      </div>

      {sessions.length > 0 && (
        <div className="pt-4 border-t border-border mt-4">
          <h3 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-3">Today's active/completed</h3>
          <div className="space-y-2">
            {sessions.filter(s => s.session_date === format(new Date(), 'yyyy-MM-dd')).map(s => (
              <Card key={s.id} className="p-3 flex items-center justify-between">
                <span className="text-sm font-bold text-foreground capitalize truncate">{s.dhikr_type.replace(/_/g,' ')}</span>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">{s.current_count}/{s.target_count}</span>
                  {s.is_completed && <Check className="h-4 w-4 text-primary" />}
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

