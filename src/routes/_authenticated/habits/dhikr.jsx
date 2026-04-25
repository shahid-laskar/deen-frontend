import React, { useState, useCallback, useRef, useEffect } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { format, subDays, startOfWeek, eachDayOfInterval } from 'date-fns'
import { RotateCcw, Check, Sparkles } from 'lucide-react'
import api from '@/lib/api'
import { cn } from '@/lib/utils'
import toast from 'react-hot-toast'

export const Route = createFileRoute('/_authenticated/habits/dhikr')({
  component: DhikrPage,
})

// ── Heatmap component ────────────────────────────────────────────────────────
function Heatmap({ data = [] }) {
  const today = new Date()
  const start = subDays(today, 364)
  const weeks = []
  let day = startOfWeek(start, { weekStartsOn: 0 })
  while (day <= today) {
    const end = new Date(Math.min(day.getTime() + 6 * 86400000, today.getTime()))
    weeks.push(eachDayOfInterval({ start: day, end }))
    day = new Date(day.getTime() + 7 * 86400000)
  }
  const byDate = {}
  data.forEach(d => { byDate[d.date] = d })

  return (
    <div className="overflow-x-auto pb-2 scrollbar-none">
      <div className="flex gap-1 min-w-max">
        {weeks.map((week, wi) => (
          <div key={wi} className="flex flex-col gap-1">
            {week.map((d, di) => {
              const k = format(d, 'yyyy-MM-dd')
              const cell = byDate[k]
              return (
                <div key={di} title={k}
                  className={cn('w-3 h-3 rounded-sm transition-transform hover:scale-125',
                    cell?.completed ? 'bg-primary' : 'bg-muted')}
                  style={cell?.completed ? { opacity: Math.max(0.3, (cell.count || 1) / 10) } : {}} />
              )
            })}
          </div>
        ))}
      </div>
      <div className="flex items-center gap-2 mt-3 text-[10px] uppercase font-bold text-muted-foreground w-max ml-auto">
        <span>Less</span>
        {[0.2, 0.4, 0.6, 0.8, 1].map((v, i) => (
          <div key={i} className="w-3 h-3 rounded-sm bg-primary" style={{ opacity: v }} />
        ))}
        <span>More</span>
      </div>
    </div>
  )
}

// ── Tasbih counter ───────────────────────────────────────────────────────────
function TasbihCounter({ session, preset, onTap, onReset, onPause }) {
  const pct = session ? (session.current_count / session.target_count) * 100 : 0
  const r = 92
  const circ = 2 * Math.PI * r

  return (
    <div className="flex flex-col items-center gap-6 min-h-[55vh] justify-center animate-slide-up">
      <div className="text-center">
        <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-2">{preset?.label}</p>
        <p className="font-amiri text-5xl leading-relaxed text-primary" dir="rtl">{preset?.arabic}</p>
        {preset?.transliteration && (
          <p className="text-sm text-muted-foreground mt-1 italic">{preset.transliteration}</p>
        )}
      </div>

      <button
        onClick={onTap}
        onMouseDown={e => e.currentTarget.style.transform = 'scale(0.95)'}
        onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
        onTouchStart={e => e.currentTarget.style.transform = 'scale(0.95)'}
        onTouchEnd={e => { e.currentTarget.style.transform = 'scale(1)'; e.preventDefault() }}
        className="group relative h-56 w-56 rounded-full bg-gradient-to-br from-primary to-warm text-primary-foreground shadow-glow-primary hover:scale-105 active:scale-95 transition-all duration-150 select-none"
      >
        <svg className="absolute inset-0 -rotate-90 w-full h-full" viewBox="0 0 200 200">
          <circle cx="100" cy="100" r={r} fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="5" />
          <circle cx="100" cy="100" r={r} fill="none" stroke="var(--color-gold)" strokeWidth="5"
            strokeLinecap="round"
            strokeDasharray={`${circ}`}
            strokeDashoffset={`${circ * (1 - Math.min(pct, 100) / 100)}`}
            className="transition-all duration-300" />
        </svg>
        <div className="relative flex flex-col items-center justify-center h-full">
          <span className="text-[10px] uppercase tracking-widest opacity-80 font-bold">Count</span>
          <span className="text-7xl font-bold tabular-nums mt-1">{session?.current_count ?? 0}</span>
          <span className="text-xs opacity-80 mt-1">of {session?.target_count}</span>
        </div>
      </button>

      <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Tap to count · Feel the remembrance</p>

      <div className="flex gap-3">
        <button onClick={onReset}
          className="flex items-center gap-2 rounded-2xl glass-card shadow-soft px-4 py-2 text-sm font-bold hover:shadow-elevated transition-all">
          <RotateCcw className="h-3.5 w-3.5" /> Reset
        </button>
        <button onClick={onPause}
          className="flex items-center gap-2 rounded-2xl bg-primary/10 text-primary px-4 py-2 text-sm font-bold hover:bg-primary hover:text-primary-foreground transition-all">
          ← Save & Back
        </button>
      </div>
    </div>
  )
}

// ── Main Dhikr Page ──────────────────────────────────────────────────────────
function DhikrPage() {
  const qc = useQueryClient()
  const [activeSession, setActiveSession] = useState(null)
  const [activePreset, setActivePreset] = useState(null)
  const [customTarget, setCustomTarget] = useState(33)

  const { data: presets = [] } = useQuery({
    queryKey: ['dhikr', 'presets'],
    queryFn: () => api.get('/dhikr/presets').then(r => r.data).catch(() => []),
  })

  const { data: sessions = [] } = useQuery({
    queryKey: ['dhikr', 'sessions'],
    queryFn: () => api.get('/dhikr/sessions').then(r => r.data).catch(() => []),
  })

  const { data: history = [] } = useQuery({
    queryKey: ['dhikr', 'history'],
    queryFn: () => api.get('/dhikr/history').then(r => r.data).catch(() => []),
  })

  const { mutate: startSession } = useMutation({
    mutationFn: (preset) => api.post('/dhikr/sessions', {
      dhikr_type: preset.type,
      target_count: customTarget,
    }),
    onSuccess: (res, preset) => {
      setActiveSession(res.data)
      setActivePreset(preset)
      qc.invalidateQueries({ queryKey: ['dhikr'] })
    },
  })

  const { mutate: increment } = useMutation({
    mutationFn: () => api.post(`/dhikr/sessions/${activeSession.id}/increment`, { increment: 1 }),
    onSuccess: (res) => {
      setActiveSession(res.data)
      if (res.data.is_completed) {
        if (window.navigator?.vibrate) window.navigator.vibrate([50, 30, 100])
        toast.success('Alhamdulillah! Session complete 🤲')
        qc.invalidateQueries({ queryKey: ['dhikr'] })
        setTimeout(() => { setActiveSession(null); setActivePreset(null) }, 1500)
      }
    },
  })

  const tap = useCallback(() => {
    if (window.navigator?.vibrate) window.navigator.vibrate(8)
    if (activeSession && !activeSession.is_completed) increment()
  }, [activeSession, increment])

  const handleReset = () => {
    setActiveSession(prev => prev ? { ...prev, current_count: 0 } : prev)
  }

  const todaySessions = sessions.filter(s => s.session_date === format(new Date(), 'yyyy-MM-dd'))

  if (activeSession && !activeSession.is_completed) {
    return (
      <TasbihCounter
        session={activeSession}
        preset={activePreset}
        onTap={tap}
        onReset={handleReset}
        onPause={() => { setActiveSession(null); setActivePreset(null) }}
      />
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="animate-slide-up">
        <p className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground font-bold">Remembrance</p>
        <h1 className="font-amiri text-4xl md:text-5xl font-bold mt-2 text-gradient-primary">Dhikr & Tasbih</h1>
        <p className="text-sm text-muted-foreground mt-2">
          "Verily, in the remembrance of Allah do hearts find rest" · 13:28
        </p>
      </div>

      {/* Target selector */}
      <div className="rounded-2xl glass-card shadow-soft p-5 animate-slide-up stagger-1">
        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-3">Target count</p>
        <div className="flex gap-2 mb-3">
          {[33, 99, 100, 1000].map(n => (
            <button key={n} onClick={() => setCustomTarget(n)}
              className={cn('flex-1 py-2 rounded-xl text-sm font-bold transition-all',
                customTarget === n
                  ? 'bg-primary/10 text-primary border border-primary/30'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80')}>
              {n}
            </button>
          ))}
        </div>
        <input
          type="number"
          placeholder="Custom target"
          value={customTarget}
          onChange={e => setCustomTarget(Number(e.target.value) || 33)}
          className="w-full rounded-xl bg-muted/50 border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
        />
      </div>

      {/* Preset grid */}
      <div className="animate-slide-up stagger-2">
        <h2 className="text-sm font-black uppercase tracking-widest text-muted-foreground mb-3">Choose a Dhikr</h2>
        <div className="grid gap-3">
          {(presets.length === 0
            ? [
              { type: 'subhanallah', label: 'SubhanAllah', arabic: 'سُبْحَانَ اللَّهِ', transliteration: 'Glory be to Allah' },
              { type: 'alhamdulillah', label: 'Alhamdulillah', arabic: 'الْحَمْدُ لِلَّهِ', transliteration: 'All praise to Allah' },
              { type: 'allahu_akbar', label: 'Allahu Akbar', arabic: 'اللَّهُ أَكْبَرُ', transliteration: 'Allah is Greatest' },
              { type: 'la_ilaha_illallah', label: 'La ilaha illallah', arabic: 'لَا إِلَهَ إِلَّا اللَّهُ', transliteration: 'There is no god but Allah' },
              { type: 'istighfar', label: 'Istighfar', arabic: 'أَسْتَغْفِرُ اللَّهَ', transliteration: 'I seek forgiveness from Allah' },
              { type: 'salawat', label: 'Salawat', arabic: 'اللَّهُمَّ صَلِّ عَلَى مُحَمَّدٍ', transliteration: 'Blessing upon the Prophet ﷺ' },
            ]
            : presets
          ).map(preset => (
            <button key={preset.type}
              onClick={() => startSession(preset)}
              className="relative overflow-hidden w-full flex items-center gap-4 p-4 rounded-2xl glass-card shadow-soft hover:shadow-elevated card-hover text-left group">
              <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative flex-1 min-w-0">
                <p className="font-bold text-sm text-foreground">{preset.label}</p>
                {preset.transliteration && (
                  <p className="text-xs text-muted-foreground mt-0.5">{preset.transliteration}</p>
                )}
                <p className="font-amiri text-xl text-primary text-right mt-2" dir="rtl">{preset.arabic}</p>
              </div>
              <div className="relative shrink-0 flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">×{customTarget}</span>
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-all">
                  <Sparkles className="h-4 w-4" />
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Today's sessions */}
      {todaySessions.length > 0 && (
        <div className="animate-slide-up stagger-3">
          <h2 className="text-sm font-black uppercase tracking-widest text-muted-foreground mb-3">Today's Sessions</h2>
          <div className="space-y-2">
            {todaySessions.map(s => (
              <div key={s.id} className="flex items-center justify-between p-3 rounded-xl glass-card shadow-soft">
                <span className="text-sm font-bold text-foreground capitalize">{s.dhikr_type?.replace(/_/g, ' ')}</span>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-muted-foreground">{s.current_count}/{s.target_count}</span>
                  {s.is_completed && <Check className="h-4 w-4 text-sage" />}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* History totals */}
      {history.length > 0 && (
        <div className="animate-slide-up stagger-4">
          <div className="rounded-2xl glass-card shadow-soft p-5">
            <h2 className="text-sm font-black uppercase tracking-widest text-muted-foreground mb-4">30-Day History</h2>
            <div className="space-y-3">
              {history.map(h => (
                <div key={h.dhikr_type} className="flex items-center justify-between">
                  <span className="text-sm font-bold text-foreground capitalize">{h.dhikr_type?.replace(/_/g, ' ')}</span>
                  <div className="flex items-center gap-3">
                    <div className="w-24 h-1.5 rounded-full bg-muted overflow-hidden">
                      <div className="h-full bg-primary rounded-full" style={{ width: `${Math.min((h.total_count / 3000) * 100, 100)}%` }} />
                    </div>
                    <span className="text-xs font-bold text-muted-foreground tabular-nums w-12 text-right">
                      {h.total_count.toLocaleString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
