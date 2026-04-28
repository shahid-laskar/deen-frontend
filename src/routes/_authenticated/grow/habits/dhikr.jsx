import React, { useState, useCallback, useRef, useEffect } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { format, subDays, startOfWeek, eachDayOfInterval } from 'date-fns'
import { RotateCcw, Check, Sparkles, Heart, Shield, Feather, Plus, Play, BookOpen, Activity, Search, CalendarDays } from 'lucide-react'
import api from '@/lib/api'
import { cn } from '@/lib/utils'
import toast from 'react-hot-toast'

export const Route = createFileRoute('/_authenticated/grow/habits/dhikr')({
  component: DhikrPage,
})

const DHIKR_LIBRARY = [
  // Core
  { type: 'subhanallah', label: 'SubhanAllah', arabic: 'سُبْحَانَ اللَّهِ', transliteration: 'Glory be to Allah', category: 'core' },
  { type: 'alhamdulillah', label: 'Alhamdulillah', arabic: 'الْحَمْدُ لِلَّهِ', transliteration: 'All praise to Allah', category: 'core' },
  { type: 'allahu_akbar', label: 'Allahu Akbar', arabic: 'اللَّهُ أَكْبَرُ', transliteration: 'Allah is Greatest', category: 'core' },
  { type: 'la_ilaha_illallah', label: 'La ilaha illallah', arabic: 'لَا إِلَهَ إِلَّا اللَّهُ', transliteration: 'There is no god but Allah', category: 'core' },
  { type: 'salawat', label: 'Salawat', arabic: 'اللَّهُمَّ صَلِّ عَلَى مُحَمَّدٍ', transliteration: 'Blessing upon the Prophet ﷺ', category: 'core' },

  // Heavy on Scales / Rewards
  { type: 'subhanallahi_wa_bihamdihi', label: 'SubhanAllahi wa bihamdihi', arabic: 'سُبْحَانَ اللَّهِ وَبِحَمْدِهِ', transliteration: 'Glory be to Allah and His is the praise', category: 'rewards' },
  { type: 'subhanallahil_azeem', label: 'SubhanAllahil Azeem', arabic: 'سُبْحَانَ اللَّهِ الْعَظِيمِ', transliteration: 'Glory be to Allah, the Magnificent', category: 'rewards' },
  { type: 'hawqala', label: 'Hawqala', arabic: 'لَا حَوْلَ وَلَا قُوَّةَ إِلَّا بِاللَّهِ', transliteration: 'There is no power nor strength except by Allah', category: 'rewards' },
  { type: 'kalimatan', label: 'Kalimatan Khafifatan', arabic: 'سُبْحَانَ اللَّهِ وَبِحَمْدِهِ ، سُبْحَانَ اللَّهِ الْعَظِيمِ', transliteration: 'Two words light on the tongue...', category: 'rewards' },

  // Protection & Trust
  { type: 'hasbiyallah', label: 'Hasbiyallah', arabic: 'حَسْبُنَا اللَّهُ وَنِعْمَ الْوَكِيلُ', transliteration: 'Sufficient for us is Allah, and [He is] the best Disposer of affairs', category: 'protection' },
  { type: 'bismillah_alladhi', label: 'Bismillah illadhi...', arabic: 'بِسْمِ اللَّهِ الَّذِي لَا يَضُرُّ مَعَ اسْمِهِ شَيْءٌ', transliteration: 'In the name of Allah with whose name nothing can harm', category: 'protection' },
  
  // Forgiveness
  { type: 'istighfar', label: 'Istighfar', arabic: 'أَسْتَغْفِرُ اللَّهَ', transliteration: 'I seek forgiveness from Allah', category: 'forgiveness' },
  { type: 'sayyidul_istighfar', label: 'Sayyidul Istighfar', arabic: 'اللَّهُمَّ أَنْتَ رَبِّي لَا إِلَهَ إِلَّا أَنْتَ', transliteration: 'O Allah, You are my Lord, there is no deity except You', category: 'forgiveness' },
  { type: 'rabighfirli', label: 'Rabbighfirli', arabic: 'رَبِّ اغْفِرْ لِي', transliteration: 'My Lord, forgive me', category: 'forgiveness' },
]

const CATEGORIES = {
  core: { label: 'Essential', icon: Heart, gradient: 'from-primary/15 to-transparent', iconColor: 'text-primary' },
  rewards: { label: 'Heavy Rewards', icon: Sparkles, gradient: 'from-gold/15 to-transparent', iconColor: 'text-gold' },
  protection: { label: 'Protection', icon: Shield, gradient: 'from-sage/15 to-transparent', iconColor: 'text-sage' },
  forgiveness: { label: 'Forgiveness', icon: Feather, gradient: 'from-blue-500/15 to-transparent', iconColor: 'text-blue-500' }
}

// ── Tasbih counter ───────────────────────────────────────────────────────────
function TasbihCounter({ session, preset, onTap, onReset, onPause }) {
  const pct = session ? (session.current_count / session.target_count) * 100 : 0
  const r = 92
  const circ = 2 * Math.PI * r

  return (
    <div className="flex flex-col items-center gap-6 min-h-[65vh] justify-center animate-slide-up max-w-sm mx-auto">
      <div className="text-center">
        <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3">{preset?.label}</p>
        <p className="font-amiri text-4xl md:text-5xl leading-relaxed text-primary" dir="rtl">{preset?.arabic}</p>
        {preset?.transliteration && (
          <p className="text-sm text-muted-foreground mt-3 italic max-w-[280px] mx-auto leading-relaxed">{preset.transliteration}</p>
        )}
      </div>

      <button
        onClick={onTap}
        onMouseDown={e => e.currentTarget.style.transform = 'scale(0.95)'}
        onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
        onTouchStart={e => e.currentTarget.style.transform = 'scale(0.95)'}
        onTouchEnd={e => { e.currentTarget.style.transform = 'scale(1)'; e.preventDefault() }}
        className="group relative h-56 w-56 rounded-full bg-gradient-to-br from-primary to-warm text-primary-foreground shadow-glow-primary hover:scale-105 active:scale-95 transition-all duration-150 select-none my-4"
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

      <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Tap to count · Feel the peace</p>

      <div className="flex gap-3 mt-4">
        <button onClick={onReset} className="flex items-center gap-2 rounded-2xl glass-card shadow-soft px-5 py-3 text-sm font-bold hover:shadow-elevated transition-all">
          <RotateCcw className="h-4 w-4" /> Reset
        </button>
        <button onClick={onPause} className="flex items-center gap-2 rounded-2xl bg-primary/10 text-primary px-5 py-3 text-sm font-bold hover:bg-primary hover:text-primary-foreground transition-all">
          ← Save & Back
        </button>
      </div>
    </div>
  )
}

function TodayTab({ todaySessions, history, onResume }) {
  return (
    <div className="space-y-6 animate-slide-up">
      {todaySessions.length === 0 ? (
        <div className="rounded-3xl glass-card p-10 text-center flex flex-col items-center">
          <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
            <Activity className="h-8 w-8 text-primary opacity-80" />
          </div>
          <p className="text-base font-bold text-foreground mb-1">No Dhikr added yet</p>
          <p className="text-sm text-muted-foreground">Go to the Library to add your daily remembrances.</p>
        </div>
      ) : (
        <div className="space-y-3">
          <h2 className="text-sm font-black uppercase tracking-widest text-muted-foreground mb-3 flex items-center gap-2"><Play className="h-4 w-4" /> Active Sessions</h2>
          {todaySessions.map(s => {
            const preset = DHIKR_LIBRARY.find(p => p.type === s.dhikr_type) || { label: s.dhikr_type, arabic: '', category: 'core' }
            const cat = CATEGORIES[preset.category] || CATEGORIES.core
            const CatIcon = cat.icon
            
            return (
              <button key={s.id} onClick={() => onResume(s, preset)} className="w-full relative overflow-hidden flex items-center justify-between p-4 md:p-5 rounded-3xl glass-card shadow-soft hover:shadow-elevated transition-all group text-left">
                <div className={cn("absolute inset-0 bg-gradient-to-r opacity-0 group-hover:opacity-100 transition-opacity", cat.gradient)} />
                <div className="relative flex items-center gap-4 min-w-0">
                  <div className={cn("flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-muted/50 transition-all", cat.iconColor)}>
                    <CatIcon className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 pr-4">
                    <h3 className="text-sm font-bold text-foreground leading-snug truncate">{preset.label}</h3>
                    <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                      <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground bg-muted/50 px-2 py-0.5 rounded-full">{s.current_count} / {s.target_count}</span>
                      {s.is_completed && <span className="text-[10px] font-black uppercase tracking-widest text-sage bg-sage/10 px-2 py-0.5 rounded-full flex items-center gap-1"><Check className="h-3 w-3" /> Done</span>}
                    </div>
                  </div>
                </div>
                <div className="relative shrink-0 text-right max-w-[120px] md:max-w-none">
                  <p className="font-amiri text-lg md:text-xl text-primary opacity-80 truncate" dir="rtl">{preset.arabic}</p>
                </div>
              </button>
            )
          })}
        </div>
      )}

      {/* History totals */}
      {history.length > 0 && (
        <div className="rounded-3xl glass-card shadow-soft p-5 md:p-6 mt-6">
          <h2 className="text-sm font-black uppercase tracking-widest text-muted-foreground mb-5 flex items-center gap-2"><CalendarDays className="h-4 w-4" /> 30-Day History</h2>
          <div className="space-y-4">
            {history.map(h => {
              const preset = DHIKR_LIBRARY.find(p => p.type === h.dhikr_type) || { label: h.dhikr_type, category: 'core' }
              const cat = CATEGORIES[preset.category] || CATEGORIES.core
              return (
                <div key={h.dhikr_type} className="flex items-center justify-between gap-4">
                  <div className="min-w-[120px]">
                    <span className="text-xs font-bold text-foreground block truncate">{preset.label}</span>
                  </div>
                  <div className="flex-1 flex items-center gap-3">
                    <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                      <div className={cn("h-full rounded-full bg-primary", cat.iconColor.replace('text-', 'bg-'))} style={{ width: `${Math.min((h.total_count / 3000) * 100, 100)}%` }} />
                    </div>
                    <span className="text-[10px] font-bold text-muted-foreground tabular-nums w-12 text-right">
                      {h.total_count.toLocaleString()}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

function LibraryTab({ customTarget, setCustomTarget, onAdd, addedTypes }) {
  const [search, setSearch] = useState('')
  
  const filtered = DHIKR_LIBRARY.filter(d => !search || d.label.toLowerCase().includes(search.toLowerCase()) || d.transliteration.toLowerCase().includes(search.toLowerCase()))
  
  const groups = {}
  filtered.forEach(d => {
    if (!groups[d.category]) groups[d.category] = []
    groups[d.category].push(d)
  })

  return (
    <div className="space-y-6 animate-slide-up">
      {/* Target selector */}
      <div className="rounded-3xl glass-card shadow-soft p-5 md:p-6">
        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-3 flex items-center gap-1.5"><Sparkles className="h-3.5 w-3.5 text-primary" /> Target Count</p>
        <div className="flex gap-2 flex-wrap mb-3">
          {[33, 99, 100, 1000].map(n => (
            <button key={n} onClick={() => setCustomTarget(n)}
              className={cn('flex-1 min-w-[60px] py-2.5 rounded-xl text-sm font-bold transition-all',
                customTarget === n ? 'bg-primary/10 text-primary border border-primary/30 shadow-soft' : 'bg-muted/50 text-muted-foreground hover:bg-muted')}>
              {n}
            </button>
          ))}
        </div>
        <div className="relative">
          <input type="number" placeholder="Custom target" value={customTarget} onChange={e => setCustomTarget(Number(e.target.value) || 33)} className="w-full rounded-xl bg-muted/40 border border-border px-4 py-3 text-sm font-bold focus:outline-none focus:ring-1 focus:ring-primary/40" />
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search dhikr library…" className="w-full pl-11 pr-4 py-3 rounded-2xl glass-card shadow-soft border-0 text-sm font-medium focus:outline-none focus:ring-1 focus:ring-primary/40 bg-transparent" />
      </div>

      <div className="space-y-8 pt-2">
        {Object.entries(groups).map(([catId, items]) => {
          const cat = CATEGORIES[catId]
          const CatIcon = cat.icon
          return (
            <div key={catId}>
              <h2 className={cn("flex items-center gap-2 text-sm font-black uppercase tracking-widest mb-4", cat.iconColor)}>
                <CatIcon className="h-4 w-4" /> {cat.label}
              </h2>
              <div className="grid gap-3 md:grid-cols-2">
                {items.map(d => {
                  const isAdded = addedTypes.has(d.type)
                  return (
                    <div key={d.type} className="relative overflow-hidden rounded-3xl glass-card shadow-soft hover:shadow-elevated p-5 flex flex-col justify-between group transition-all">
                      <div className={cn("absolute inset-0 bg-gradient-to-br opacity-50 transition-opacity group-hover:opacity-100", cat.gradient)} />
                      <div className="relative z-10 mb-4">
                        <div className="flex justify-between items-start gap-4">
                          <p className="font-bold text-sm text-foreground">{d.label}</p>
                          <p className="font-amiri text-xl text-primary text-right" dir="rtl">{d.arabic}</p>
                        </div>
                        <p className="text-xs text-muted-foreground mt-2 italic line-clamp-2">{d.transliteration}</p>
                      </div>
                      <div className="relative z-10 flex justify-end mt-2">
                        <button onClick={() => !isAdded && onAdd(d)} disabled={isAdded} className={cn("flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all", isAdded ? "bg-sage/15 text-sage opacity-80" : "bg-primary text-primary-foreground shadow-soft hover:shadow-glow-primary")}>
                          {isAdded ? <><Check className="h-3.5 w-3.5" /> Added</> : <><Plus className="h-3.5 w-3.5" /> Add to Today</>}
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
        {filtered.length === 0 && (
          <div className="rounded-3xl glass-card p-10 text-center text-muted-foreground text-sm font-bold">No results found</div>
        )}
      </div>
    </div>
  )
}

function DhikrPage() {
  const qc = useQueryClient()
  const [activeSession, setActiveSession] = useState(null)
  const [activePreset, setActivePreset] = useState(null)
  const [customTarget, setCustomTarget] = useState(33)
  const [tab, setTab] = useState('today')

  const { data: sessions = [] } = useQuery({ queryKey: ['dhikr', 'sessions'], queryFn: () => api.get('/dhikr/sessions').then(r => r.data).catch(() => []) })
  const { data: history = [] } = useQuery({ queryKey: ['dhikr', 'history'], queryFn: () => api.get('/dhikr/history').then(r => r.data).catch(() => []) })

  const { mutate: startSession } = useMutation({
    mutationFn: (preset) => api.post('/dhikr/sessions', { dhikr_type: preset.type, target_count: customTarget, custom_label: preset.label }),
    onSuccess: (res, preset) => {
      toast.success(`Added ${preset.label} to Today`)
      qc.invalidateQueries({ queryKey: ['dhikr'] })
      setTab('today')
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

  const handleReset = () => { setActiveSession(prev => prev ? { ...prev, current_count: 0 } : prev) }

  const todaySessions = sessions.filter(s => s.session_date === format(new Date(), 'yyyy-MM-dd'))
  const addedTypes = new Set(todaySessions.map(s => s.dhikr_type))

  if (activeSession && !activeSession.is_completed) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-4 md:py-8">
        <TasbihCounter
          session={activeSession}
          preset={activePreset}
          onTap={tap}
          onReset={handleReset}
          onPause={() => { setActiveSession(null); setActivePreset(null); qc.invalidateQueries({ queryKey: ['dhikr'] }) }}
        />
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 md:py-8 space-y-6 md:space-y-8">
      {/* Header */}
      <div className="animate-slide-up">
        <p className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground font-bold">Remembrance</p>
        <h1 className="font-amiri text-4xl md:text-5xl font-bold mt-2 text-gradient-primary">Dhikr</h1>
        <p className="text-sm text-muted-foreground mt-2">
          "Verily, in the remembrance of Allah do hearts find rest" · 13:28
        </p>
      </div>

      {/* Tabs */}
      <div className="flex overflow-x-auto p-1.5 rounded-2xl bg-muted/50 gap-1 scrollbar-none backdrop-blur-sm animate-slide-up stagger-1">
        <button onClick={() => setTab('today')} className={cn('flex-1 min-w-[80px] px-3 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap', tab === 'today' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground')}>Today's Dhikr</button>
        <button onClick={() => setTab('library')} className={cn('flex-1 min-w-[80px] px-3 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap', tab === 'library' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground')}>Dhikr Library</button>
      </div>

      <div className="pt-2 animate-slide-up stagger-2">
        {tab === 'today' && (
          <TodayTab 
            todaySessions={todaySessions} 
            history={history} 
            onResume={(s, p) => { setActiveSession(s); setActivePreset(p) }} 
          />
        )}
        {tab === 'library' && (
          <LibraryTab 
            customTarget={customTarget} 
            setCustomTarget={setCustomTarget} 
            onAdd={(preset) => startSession(preset)} 
            addedTypes={addedTypes} 
          />
        )}
      </div>
    </div>
  )
}
