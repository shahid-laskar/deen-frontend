import React, { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { format, startOfWeek, endOfWeek, addDays, subWeeks, addWeeks, eachDayOfInterval } from 'date-fns'
import { BarChart2, ChevronLeft, ChevronRight } from 'lucide-react'
import { tasksApi, aiApi } from '@/lib/api'
import { getFocusLog, getWeekNiyyah, getReflection, getShukr } from '@/lib/planner/prefs'
import { CATEGORY_META, categoryDot } from '@/lib/planner/category'
import { gregorianToHijri, formatHijri } from '@/lib/hijri'
import { cn } from '@/lib/utils'
import toast from 'react-hot-toast'

function KpiCard({ label, value, sub }) {
  return (
    <div className="rounded-2xl bg-card border border-border/60 p-4 text-center">
      <p className="text-2xl font-bold text-foreground">{value}</p>
      <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mt-1">{label}</p>
      {sub && <p className="text-[11px] text-muted-foreground/60 mt-0.5">{sub}</p>}
    </div>
  )
}

function CategoryDonut({ tasks }) {
  const cats = Object.keys(CATEGORY_META)
  const counts = {}
  tasks.forEach(t => { if (t.category) counts[t.category] = (counts[t.category] || 0) + 1 })
  const total = Object.values(counts).reduce((s, c) => s + c, 0)
  if (!total) return <p className="text-xs text-muted-foreground italic text-center">No category data</p>

  // Simple horizontal bar representation (no SVG library)
  return (
    <div className="space-y-2">
      {cats.filter(c => counts[c]).map(cat => {
        const pct = Math.round((counts[cat] / total) * 100)
        const { label } = CATEGORY_META[cat]
        return (
          <div key={cat} className="flex items-center gap-2">
            <span className={cn('h-2.5 w-2.5 rounded-full shrink-0', categoryDot(cat))} />
            <span className="text-xs text-muted-foreground w-16 shrink-0">{label}</span>
            <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
              <div className={cn('h-full rounded-full', categoryDot(cat))} style={{ width: `${pct}%` }} />
            </div>
            <span className="text-xs text-muted-foreground w-8 text-right">{counts[cat]}</span>
          </div>
        )
      })}
    </div>
  )
}

function MuhasabaScore({ weekTasks }) {
  const [selfScore, setSelfScore] = useState(3)
  const completed  = weekTasks.filter(t => t.completed).length
  const total      = weekTasks.length
  const ibadah     = weekTasks.filter(t => t.category === 'ibadah')
  const ibadahDone = ibadah.filter(t => t.completed).length

  const compPts    = total ? Math.round((completed / total) * 25) : 0
  const ibadahPts  = ibadah.length ? Math.round((ibadahDone / ibadah.length) * 25) : 12
  const selfPts    = Math.round(((selfScore - 1) / 4) * 25)
  const capPts     = 15 // default middle score
  const score      = compPts + ibadahPts + selfPts + capPts

  const label = score >= 80 ? 'A week of barakah — أسبوع مبارك'
    : score >= 60 ? 'Steady progress — تقدم ثابت'
    : score >= 40 ? 'Room to grow — هناك مجال للنمو'
    : 'Begin again with intention — ابدأ من جديد'

  return (
    <div className="rounded-2xl border border-border/60 bg-card p-5 space-y-4">
      <h3 className="font-bold text-sm">Muhasaba Score</h3>
      <div className="flex items-center gap-4">
        <div className="relative h-20 w-20 shrink-0">
          <svg viewBox="0 0 80 80" className="w-full h-full -rotate-90">
            <circle cx="40" cy="40" r="32" fill="none" stroke="currentColor" strokeWidth="8" className="text-muted/30" />
            <circle cx="40" cy="40" r="32" fill="none" stroke="currentColor" strokeWidth="8"
              className="text-primary" strokeDasharray={`${2*Math.PI*32}`} strokeDashoffset={`${2*Math.PI*32*(1-score/100)}`} strokeLinecap="round" />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-lg font-bold">{score}</span>
          </div>
        </div>
        <div>
          <p className="font-amiri text-base text-foreground">{label}</p>
          <p className="text-xs text-muted-foreground mt-1">Out of 100</p>
        </div>
      </div>
      <div>
        <label className="text-xs font-bold text-muted-foreground block mb-2">How did this week feel? (self-rating)</label>
        <div className="flex gap-2">
          {[1,2,3,4,5].map(s => (
            <button key={s} onClick={() => setSelfScore(s)}
              className={cn('h-8 w-8 rounded-full text-sm font-bold border transition-all',
                selfScore >= s ? 'bg-amber-400 border-amber-400 text-white' : 'border-border text-muted-foreground hover:border-amber-400')}>
              ★
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

export function ReviewView({ allTasks }) {
  const qc = useQueryClient()
  const [weekOffset, setWeekOffset] = useState(0)
  const [aiSummary, setAiSummary] = useState(null)
  const [aiLoading, setAiLoading] = useState(false)

  const referenceDate = addWeeks(new Date(), weekOffset)
  const weekStart = startOfWeek(referenceDate, { weekStartsOn: 0 })
  const weekEnd   = endOfWeek(referenceDate,   { weekStartsOn: 0 })

  const weekStr = `${format(weekStart,'MMM d')} – ${format(weekEnd,'MMM d, yyyy')}`
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd })

  const weekTasks = allTasks.filter(t => {
    if (!t.due_date) return false
    return t.due_date >= format(weekStart,'yyyy-MM-dd') && t.due_date <= format(weekEnd,'yyyy-MM-dd')
  })

  const completed  = weekTasks.filter(t => t.completed)
  const incomplete = weekTasks.filter(t => !t.completed)
  const compRate   = weekTasks.length ? Math.round((completed.length / weekTasks.length) * 100) : 0

  const focusLog = getFocusLog()
  const weekFocusMin = focusLog
    .filter(s => s.completedAt >= format(weekStart,'yyyy-MM-dd'))
    .reduce((sum, s) => sum + (s.minutes || 0), 0)

  const onTime = completed.filter(t => t.due_date && t.completed_at && t.completed_at.slice(0,10) <= t.due_date).length
  const onTimeRate = completed.length ? Math.round((onTime / completed.length) * 100) : 0

  const weekNiyyah   = getWeekNiyyah()
  const reflections  = weekDays.map(d => getReflection(format(d,'yyyy-MM-dd'))).filter(Boolean)
  const shukrEntries = weekDays.map(d => ({ date: d, text: getShukr(format(d,'yyyy-MM-dd')) })).filter(e => e.text)

  const { mutate: carryOver, isPending: carrying } = useMutation({
    mutationFn: async () => {
      for (const task of incomplete) {
        const newDate = addDays(new Date(task.due_date), 7).toISOString().slice(0,10)
        await tasksApi.update(task.id, { due_date: newDate })
      }
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['tasks'] }); toast.success('Tasks moved to next week') },
  })

  const askAI = async () => {
    setAiLoading(true)
    try {
      const res = await aiApi.chat({
        prompt: `Summarize this week's productivity from an Islamic perspective.\nNiyyah: "${weekNiyyah || 'Not set'}"\nTasks completed: ${completed.length}/${weekTasks.length} (${compRate}%)\nFocus minutes: ${weekFocusMin}\nReflections: ${reflections.join(' | ')}\nBe concise, encouraging, and mention barakah and tawakkul.`,
      })
      setAiSummary(res.data?.response || res.data?.message)
    } catch {
      toast.error('AI summary unavailable')
    } finally {
      setAiLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Week picker */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold flex items-center gap-2"><BarChart2 className="h-5 w-5" />Weekly Review</h2>
        <div className="flex items-center gap-2">
          <button onClick={() => setWeekOffset(o => o-1)} className="p-2 rounded-lg hover:bg-muted"><ChevronLeft className="h-4 w-4" /></button>
          <span className="text-sm font-medium text-muted-foreground">{weekStr}</span>
          <button onClick={() => setWeekOffset(o => Math.min(0, o+1))} className="p-2 rounded-lg hover:bg-muted disabled:opacity-30" disabled={weekOffset >= 0}><ChevronRight className="h-4 w-4" /></button>
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KpiCard label="Completion" value={`${compRate}%`} sub={`${completed.length}/${weekTasks.length}`} />
        <KpiCard label="Tasks Done" value={completed.length} />
        <KpiCard label="Focus Mins" value={weekFocusMin} />
        <KpiCard label="On-time" value={`${onTimeRate}%`} />
      </div>

      {/* Niyyah */}
      {weekNiyyah && (
        <div className="rounded-2xl bg-primary/8 border border-primary/20 p-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-primary mb-1">Week Niyyah</p>
          <p className="font-amiri text-base text-foreground/90 italic">"{weekNiyyah}"</p>
        </div>
      )}

      {/* Muhasaba score */}
      <MuhasabaScore weekTasks={weekTasks} />

      {/* Category breakdown */}
      <div className="rounded-2xl border border-border/60 bg-card p-5 space-y-3">
        <h3 className="font-bold text-sm">Category Breakdown</h3>
        <CategoryDonut tasks={weekTasks} />
      </div>

      {/* Gratitude & Reflections */}
      {shukrEntries.length > 0 && (
        <div className="rounded-2xl border border-amber-500/20 bg-amber-50/30 dark:bg-amber-900/10 p-5 space-y-2">
          <p className="text-[10px] font-bold uppercase tracking-widest text-amber-600">Gratitude Log</p>
          {shukrEntries.map((e, i) => (
            <p key={i} className="text-sm text-foreground/90">
              <span className="text-[10px] text-muted-foreground">{format(e.date,'EEE')} · </span>
              {e.text}
            </p>
          ))}
        </div>
      )}

      {reflections.length > 0 && (
        <div className="rounded-2xl border border-border/60 bg-card p-5 space-y-2">
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Reflections</p>
          {reflections.map((r, i) => (
            <p key={i} className="text-sm text-foreground/80 border-l-2 border-primary/30 pl-3">{r}</p>
          ))}
        </div>
      )}

      {/* Carry-over CTA */}
      {incomplete.length > 0 && (
        <div className="rounded-2xl border border-border/60 bg-card p-4 flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-bold">{incomplete.length} incomplete tasks</p>
            <p className="text-xs text-muted-foreground mt-0.5">Move all to next week?</p>
          </div>
          <button
            onClick={() => { if (confirm(`Move ${incomplete.length} tasks to next week?`)) carryOver() }}
            disabled={carrying}
            className="text-sm font-bold text-primary hover:underline disabled:opacity-50"
          >
            Move all →
          </button>
        </div>
      )}

      {/* AI Summary */}
      <div className="space-y-3">
        <button
          onClick={askAI}
          disabled={aiLoading}
          className="w-full rounded-2xl border border-primary/30 bg-primary/5 py-3 text-sm font-bold text-primary hover:bg-primary/10 transition-colors disabled:opacity-50"
        >
          {aiLoading ? 'Reflecting…' : '✦ Reflect on my week with AI →'}
        </button>
        {aiSummary && (
          <div className="rounded-2xl border border-border/60 bg-card p-5">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">AI Reflection</p>
            <p className="text-sm text-foreground/90 leading-relaxed">{aiSummary}</p>
          </div>
        )}
      </div>
    </div>
  )
}
