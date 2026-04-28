import React, { useState } from 'react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Trash2, ChevronDown, ChevronUp, BookOpen, Headphones, Eye, EyeOff, BarChart2, Award, Flame } from 'lucide-react'
import { quranApi } from '@/lib/api'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

export const Route = createFileRoute('/_authenticated/worship/quran/hifz')({
  component: HifzTab,
})

const SM2_LABELS = ['Forgot','Wrong','Hard','OK','Good','Perfect']
const SM2_COLORS = ['#ef4444','#f97316','#eab308','#3b82f6','#22c55e','#16a34a']
const LBOX_BG   = ['','bg-red-500','bg-orange-400','bg-yellow-400','bg-green-400','bg-green-600']
const STATUS_COLORS = {
  memorized:   'bg-green-500 text-white border-green-600',
  due:         'bg-blue-500 text-white border-blue-600',
  in_progress: 'bg-orange-400 text-white border-orange-500',
  not_started: 'bg-muted/50 text-muted-foreground border-border/30',
}

function HifzProgressMap({ entries, dueToday }) {
  const getStatus = (sid) => {
    const e = entries.find(h => h.surah_number === sid)
    if (!e) return 'not_started'
    if (dueToday.some(d => d.surah_number === sid)) return 'due'
    if (e.status === 'memorised') return 'memorized'
    return 'in_progress'
  }
  return (
    <Card className="p-4">
      <h3 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-3 flex items-center gap-2">
        <BarChart2 className="h-3.5 w-3.5" /> Hifz Map · 114 Surahs
      </h3>
      <div className="grid grid-cols-10 sm:grid-cols-12 gap-1 pb-2">
        {Array.from({ length: 114 }).map((_, i) => {
          const sid = i + 1
          return (
            <div
              key={sid}
              title={`Surah ${sid}`}
              className={cn('aspect-square rounded-[4px] text-[7px] font-bold flex items-center justify-center border cursor-default transition-all hover:scale-110', STATUS_COLORS[getStatus(sid)])}
            >
              {sid}
            </div>
          )
        })}
      </div>
      <div className="flex flex-wrap gap-3 mt-2 text-[9px] font-bold text-muted-foreground uppercase tracking-widest">
        {[['bg-green-500','Memorized'],['bg-blue-500','Due Today'],['bg-orange-400','In Progress'],['bg-muted/50 border border-border','Not Started']].map(([cls,lbl]) => (
          <span key={lbl} className="flex items-center gap-1.5"><span className={cn('w-2 h-2 rounded', cls)} />{lbl}</span>
        ))}
      </div>
    </Card>
  )
}

function HifzTab() {
  const qc       = useQueryClient()
  const navigate = useNavigate()
  const [addModal,     setAddModal]     = useState(false)
  const [dailyTarget,  setDailyTarget]  = useState(5)
  const [expandedId,   setExpandedId]   = useState(null)
  const [form, setForm] = useState({ surah_number: 1, surah_name: '', ayah_from: 1, ayah_to: 7, total_ayahs: 7 })

  const { data: surahs = [] } = useQuery({ queryKey: ['quran','surahs'], queryFn: quranApi.surahs, staleTime: Infinity })
  const { data: entries = [], isLoading } = useQuery({ queryKey: ['quran','hifz'], queryFn: quranApi.hifz })
  const { data: dueToday = [] } = useQuery({ queryKey: ['quran','hifz','due'], queryFn: quranApi.hifzDue })
  const { data: hifzStats }     = useQuery({ queryKey: ['quran','hifz','stats'], queryFn: quranApi.hifzStats })

  const { mutate: addEntry, isPending: adding } = useMutation({
    mutationFn: () => quranApi.addHifz(form),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['quran','hifz'] }); setAddModal(false); toast.success('Added to Hifz ✓') },
    onError: (e) => toast.error(e.response?.data?.detail || 'Already tracked'),
  })
  const { mutate: review } = useMutation({
    mutationFn: ({ id, quality }) => quranApi.reviewHifz(id, quality),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['quran','hifz'] }); toast.success('Review saved ✓') },
  })
  const { mutate: deleteEntry } = useMutation({
    mutationFn: (id) => quranApi.deleteHifz(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['quran','hifz'] }); toast.success('Entry removed') },
  })

  const memorisedCount = entries.filter(e => e.status === 'memorised').length
  const pctDone        = Math.round((memorisedCount / 114) * 100) || 0

  // Auto-fill surah name when number changes
  const onSurahNumChange = (val) => {
    const num    = parseInt(val) || 1
    const surah  = surahs.find(s => s.id === num)
    const ayahs  = surah?.verses_count || surah?.number_of_verses || 7
    setForm(f => ({ ...f, surah_number: num, surah_name: surah?.name_simple || f.surah_name, ayah_to: ayahs, total_ayahs: ayahs }))
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 pt-4">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-foreground">Hifz Tracker</h2>
          <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
            {dueToday.length} due today · {memorisedCount} memorised
          </p>
        </div>
        <Button size="sm" onClick={() => setAddModal(true)}>
          <Plus className="h-4 w-4 mr-1.5" /> Add
        </Button>
      </div>

      {/* Stats cards row */}
      {hifzStats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            ['Entries',   hifzStats.total_entries,        'total tracked'],
            ['Memorised', hifzStats.memorised_count,      'surahs done'],
            ['Due Today', hifzStats.due_today_count,      'need review'],
            ['Streak',    hifzStats.review_streak_days,   'day streak'],
          ].map(([label, val, sub]) => (
            <Card key={label} className="p-3 text-center">
              <p className="text-2xl font-black text-foreground">{val}</p>
              <p className="text-[9px] font-black uppercase tracking-widest text-primary">{label}</p>
              <p className="text-[9px] font-bold text-muted-foreground/70 mt-0.5">{sub}</p>
            </Card>
          ))}
        </div>
      )}

      {/* Leitner box distribution */}
      {hifzStats?.leitner_distribution && (
        <Card className="p-4">
          <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-3">Leitner Box Distribution</p>
          <div className="flex gap-2 items-end h-12">
            {Object.entries(hifzStats.leitner_distribution).map(([box, count]) => {
              const maxVal = Math.max(...Object.values(hifzStats.leitner_distribution), 1)
              const height = count > 0 ? Math.max(8, (count / maxVal) * 48) : 4
              return (
                <div key={box} className="flex-1 flex flex-col items-center gap-1">
                  <span className="text-[9px] font-black text-muted-foreground">{count}</span>
                  <div
                    className={cn('w-full rounded-t-sm transition-all', LBOX_BG[parseInt(box)] || 'bg-muted')}
                    style={{ height: `${height}px` }}
                  />
                  <span className="text-[9px] font-bold text-muted-foreground">B{box}</span>
                </div>
              )
            })}
          </div>
        </Card>
      )}

      {/* Khatam planner */}
      <Card className="p-5 bg-gradient-to-br from-green-500/10 to-primary/5 border-0 shadow-sm relative overflow-hidden">
        <div className="flex items-start justify-between mb-4 relative z-10">
          <div>
            <p className="font-bold text-foreground">📅 Hifz Planner</p>
            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mt-1">
              {memorisedCount} / 114 surahs · {pctDone}% complete
            </p>
          </div>
          <div className="text-right">
            <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Daily target</p>
            <div className="flex items-center gap-2 mt-1">
              <button onClick={() => setDailyTarget(t => Math.max(1, t - 1))} className="w-6 h-6 rounded-full bg-background border border-border text-xs font-bold hover:bg-muted">-</button>
              <span className="font-bold text-foreground w-5 text-center">{dailyTarget}</span>
              <button onClick={() => setDailyTarget(t => Math.min(20, t + 1))} className="w-6 h-6 rounded-full bg-background border border-border text-xs font-bold hover:bg-muted">+</button>
            </div>
          </div>
        </div>
        <div className="h-2.5 bg-background border border-border/50 rounded-full overflow-hidden mb-2 relative z-10">
          <div className="h-full bg-primary transition-all duration-700" style={{ width: `${pctDone}%` }} />
        </div>
        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest relative z-10 mt-2">
          Est. completion: <strong className="text-primary">{Math.ceil((6236 * (1 - pctDone / 100)) / dailyTarget)} days</strong> at {dailyTarget} ayahs/day
        </p>
      </Card>

      {/* Progress map */}
      <HifzProgressMap entries={entries} dueToday={dueToday} />

      {/* Due today */}
      {dueToday.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-xs font-black uppercase tracking-widest text-orange-500 flex items-center gap-2">
            <Flame className="h-3.5 w-3.5" /> Due today ({dueToday.length})
          </h3>
          {dueToday.map(e => (
            <Card key={e.id} className="p-4 border-orange-500/20 bg-orange-500/5">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="font-bold text-foreground text-sm">{e.surah_name || `Surah ${e.surah_number}`}</p>
                  <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                    Ayah {e.ayah_from}–{e.ayah_to} · Box {e.leitner_box || 1}/5 · {e.review_count || 0} reviews
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => navigate({ to: '/worship/quran/surah/$id', params: { id: String(e.surah_number) } })}
                    className="p-1.5 rounded-lg bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground transition-colors"
                    title="Open in reader"
                  >
                    <BookOpen className="h-3.5 w-3.5" />
                  </button>
                  <div className={cn('w-3 h-3 rounded-full border border-black/10', LBOX_BG[e.leitner_box || 1])} />
                </div>
              </div>
              <div className="flex gap-1 flex-wrap">
                {SM2_LABELS.map((label, q) => (
                  <button
                    key={q}
                    onClick={() => review({ id: e.id, quality: q })}
                    className="flex-1 py-1.5 rounded-md text-[9px] font-black uppercase tracking-widest border border-black/5 transition-all hover:shadow-sm"
                    style={{ backgroundColor: SM2_COLORS[q] + '22', color: SM2_COLORS[q] }}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* All entries */}
      <div>
        <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-3">
          All Entries ({entries.length})
        </h3>
        {isLoading ? (
          <div className="space-y-2">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-14 rounded-xl" />)}</div>
        ) : entries.length === 0 ? (
          <div className="text-center py-12 border-2 border-dashed border-border rounded-2xl bg-muted/30">
            <p className="text-4xl mb-3">📖</p>
            <p className="text-sm font-bold text-foreground mb-1">No Hifz entries yet</p>
            <p className="text-xs text-muted-foreground mb-4">Start tracking your memorization journey</p>
            <Button size="sm" onClick={() => setAddModal(true)}><Plus className="h-4 w-4 mr-1.5" />Add First Entry</Button>
          </div>
        ) : (
          <div className="space-y-2">
            {entries.map(e => (
              <Card key={e.id} className="overflow-hidden">
                <button
                  className="w-full p-3 flex items-center gap-3 text-left hover:bg-muted/30 transition-colors"
                  onClick={() => setExpandedId(x => x === e.id ? null : e.id)}
                >
                  <div className={cn('w-2.5 h-2.5 rounded-full shrink-0', LBOX_BG[e.leitner_box || 1])} />
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm text-foreground truncate">{e.surah_name || `Surah ${e.surah_number}`}</p>
                    <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">
                      Ayah {e.ayah_from}–{e.ayah_to} · {e.status?.replace('_', ' ')} · Box {e.leitner_box || 1}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge variant="secondary" className="text-[9px] uppercase font-black">{e.review_count || 0} reviews</Badge>
                    {expandedId === e.id ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                  </div>
                </button>

                {expandedId === e.id && (
                  <div className="px-4 pb-4 border-t border-border/50 pt-3 space-y-3 animate-in slide-in-from-top-1">
                    <div className="grid grid-cols-3 gap-2 text-center">
                      {[['Ease Factor', e.ease_factor?.toFixed(2) || '2.50'], ['Interval', `${e.interval_days || 1}d`], ['Next Review', e.next_review || '—']].map(([lbl, val]) => (
                        <div key={lbl} className="bg-muted/40 rounded-lg p-2">
                          <p className="text-sm font-black text-foreground">{val}</p>
                          <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">{lbl}</p>
                        </div>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" className="flex-1" onClick={() => navigate({ to: '/worship/quran/surah/$id', params: { id: String(e.surah_number) } })}>
                        <BookOpen className="h-3.5 w-3.5 mr-1.5" /> Open Surah
                      </Button>
                      <Button size="sm" variant="outline" className="flex-1" onClick={() => navigate({ to: '/worship/quran/surah/$id', params: { id: String(e.surah_number) }, search: { hifzMode: 'hide' } })}>
                        <EyeOff className="h-3.5 w-3.5 mr-1.5" /> Recall Mode
                      </Button>
                      <button
                        onClick={() => deleteEntry(e.id)}
                        className="p-2 rounded-lg text-red-500 hover:bg-red-500/10 transition-colors"
                        title="Delete entry"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Add modal */}
      <Dialog open={addModal} onOpenChange={setAddModal}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add to Hifz Tracker</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <label className="text-xs font-bold mb-1.5 block">Surah</label>
              <select
                className="w-full bg-muted rounded-xl px-4 py-2.5 text-sm font-medium border-none"
                value={form.surah_number}
                onChange={e => onSurahNumChange(e.target.value)}
              >
                {surahs.map(s => (
                  <option key={s.id} value={s.id}>{s.id}. {s.name_simple}</option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold mb-1 block">Ayah From</label>
                <Input type="number" min="1" value={form.ayah_from} onChange={e => setForm(f => ({ ...f, ayah_from: parseInt(e.target.value) || 1 }))} />
              </div>
              <div>
                <label className="text-xs font-bold mb-1 block">Ayah To</label>
                <Input type="number" min="1" value={form.ayah_to} onChange={e => setForm(f => ({ ...f, ayah_to: parseInt(e.target.value) || 1, total_ayahs: parseInt(e.target.value) || 1 }))} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddModal(false)}>Cancel</Button>
            <Button onClick={() => addEntry()} disabled={adding}>{adding ? 'Adding...' : 'Add Entry'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
