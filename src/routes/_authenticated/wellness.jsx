import React, { useState, useEffect, useRef, useCallback } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { Droplets, Moon, Heart, Flame, AlertTriangle, ArrowLeft } from 'lucide-react'
import api from '@/lib/api'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { getIslamicContext } from '@/lib/hijri'
import { cn } from '@/lib/utils'

export const Route = createFileRoute('/_authenticated/wellness')({
  component: WellnessPage,
})

const BREATHING_EXERCISES = [
  { id: 'dhikr_sync', name: 'Dhikr Breathing', desc: 'SubhanAllah inhale · Alhamdulillah exhale', inhale: 4, hold: 0, exhale: 6, hold2: 0, inhale_text: 'سُبْحَانَ اللَّه', exhale_text: 'الْحَمْدُ لِلَّه', color: 'primary', rounds: 11, hadith: 'SubhanAllahi wa bihamdih — Bukhari 6405' },
  { id: 'box_breathing', name: 'Box Breathing', desc: 'Inhale 4 · Hold 4 · Exhale 4 · Hold 4 — with tasbeeh', inhale: 4, hold: 4, exhale: 4, hold2: 4, inhale_text: 'اللَّهُ أَكْبَر', exhale_text: 'أَسْتَغْفِرُ اللَّه', color: 'blue-500', rounds: 8, hadith: 'Allahu Akbar · Astaghfirullah' },
  { id: '4_7_8', name: '4-7-8 Calm', desc: 'Inhale 4 · Hold 7 · Exhale 8 — for deep calm', inhale: 4, hold: 7, exhale: 8, hold2: 0, inhale_text: 'بِسْمِ اللَّه', exhale_text: 'الْحَمْدُ لِلَّه', color: 'purple-500', rounds: 4, hadith: 'Begin with Bismillah, end with Alhamdulillah' },
]

const CRISIS_RESOURCES = [
  { country: 'Global',  name: 'Intl Assoc for Suicide Prevention', url: 'https://www.iasp.info/resources/Crisis_Centres/' },
  { country: 'UK',      name: 'Samaritans',              phone: '116 123',     url: 'https://www.samaritans.org' },
  { country: 'US',      name: '988 Suicide & Crisis',    phone: '988',         url: 'https://988lifeline.org' },
  { country: 'UAE',     name: 'Ministry of Health',      phone: '800-HOPE' },
  { country: 'Malaysia',name: 'Befrienders KL',          phone: '03-7627 2929',url: 'https://www.befrienders.org.my' },
  { country: 'India',   name: 'iCall',                   phone: '9152987821',  url: 'https://icallhelpline.org' },
]

const GRIEF_CONTENT = {
  health: {
    title: 'Facing Illness',
    ayat: [{ ref: '21:83', text: 'And he called out to his Lord: "Adversity has touched me, and You are the Most Merciful of the merciful."' }, { ref: '2:155-157', text: 'And We will surely test you with something of fear and hunger...but give good tidings to the patient.' }],
    guidance: 'Illness is an expiation of sins and an opportunity for closeness to Allah. The Prophet ﷺ was among the most severely tested. Seek medical care as a form of tawakkul, not a contradiction of it.',
  },
  loss: {
    title: 'Grief & Loss',
    ayat: [{ ref: '2:156', text: 'Indeed we belong to Allah, and indeed to Him we will return.' }, { ref: '93:3', text: 'Your Lord has not forsaken you, nor has He detested you.' }],
    guidance: 'Grief is Sunnah — the Prophet ﷺ wept at the death of his son Ibrahim. Islam does not ask you to suppress grief, but to grieve within hope. The deceased, if righteous, is in a better place.',
  },
  anxiety: {
    title: 'Anxiety & Worry',
    ayat: [{ ref: '2:286', text: 'Allah does not burden a soul beyond that it can bear.' }, { ref: '94:5', text: 'For indeed, with hardship will be ease.' }],
    guidance: 'Anxiety often comes from carrying the future in the present. The Prophet ﷺ would seek refuge in Allah from worry. Dhikr is the spiritual anchor — keep your tongue moist with Allah\'s remembrance.',
  },
  relationship: {
    title: 'Relationship Hardship',
    ayat: [{ ref: '3:134', text: 'Those who pardon people — and Allah loves the doers of good.' }, { ref: '49:10', text: 'The believers are but brothers, so make settlement between your brothers.' }],
    guidance: 'The Prophet ﷺ said: "It is not permissible for a Muslim to abandon his brother for more than three days." Where reconciliation is harmful, safe distance with dua is permissible.',
  },
  spiritual_low: {
    title: 'Spiritual Low / Waswas',
    ayat: [{ ref: '39:53', text: 'Do not despair of the mercy of Allah. Indeed, Allah forgives all sins.' }, { ref: '7:23', text: 'Our Lord, we have wronged ourselves, and if You do not forgive us and have mercy upon us... we will surely be among the losers.' }],
    guidance: 'Every saint has a past, and every sinner has a future. The door of tawbah is open until the sun rises from the west. If you feel spiritually empty, begin with gratitude — it reopens the heart.',
  },
}

const GUIDED_PROGRAMS = [
  {
    id: '30_days_calm', title: '30 Days of Calm', desc: 'Build a morning routine from 2-min adhkar to a full 20-min practice', duration: '30 days', icon: '🌅',
    days: ['Day 1–5: Morning intention + Bismillah', 'Day 6–10: Add Ayat al-Kursi after Fajr', 'Day 11–15: Morning adhkar (5 min)', 'Day 16–20: 10 min Quran + adhkar', 'Day 21–30: Full 20-min morning spiritual routine'],
  },
  {
    id: 'return_to_practice', title: 'Return to Practice', desc: 'A warm, judgment-free 14-day journey for those coming back to Islam', duration: '14 days', icon: '🌱',
    days: ['Week 1: Begin with gratitude — just 3 things daily', 'Week 1: Add Fajr, even if late — Allah accepts', 'Week 2: Choose one Sunnah habit to revive', 'Week 2: Make dua — speak to Allah as He is listening', 'End: Reflect on what you want your Islam to look like'],
  },
]

function BreathingExercise({ exercise, onClose }) {
  const [phase, setPhase] = useState('ready')
  const [seconds, setSeconds] = useState(0)
  const [round, setRound] = useState(1)
  const [scale, setScale] = useState(0.6)
  const intervalRef = useRef(null)

  const phases = [
    { id: 'inhale', label: 'Breathe in', duration: exercise.inhale, text: exercise.inhale_text, target: 1.0 },
    ...(exercise.hold  ? [{ id: 'hold',  label: 'Hold', duration: exercise.hold, text: '...', target: 1.0 }] : []),
    { id: 'exhale', label: 'Breathe out', duration: exercise.exhale, text: exercise.exhale_text, target: 0.6 },
    ...(exercise.hold2 ? [{ id: 'hold2', label: 'Hold', duration: exercise.hold2, text: '...', target: 0.6 }] : []),
  ]

  const startBreathing = useCallback(() => {
    let phaseIdx = 0
    let secInPhase = 0
    setPhase(phases[0].id)
    setSeconds(phases[0].duration)
    setScale(phases[0].target)

    intervalRef.current = setInterval(() => {
      secInPhase++
      const cur = phases[phaseIdx]
      const remaining = cur.duration - secInPhase

      setSeconds(remaining)
      const progress = secInPhase / cur.duration
      const startScale = phaseIdx === 0 ? 0.6 : phases[phaseIdx - 1]?.target || 0.6
      const endScale = cur.target
      setScale(startScale + (endScale - startScale) * progress)

      if (secInPhase >= cur.duration) {
        phaseIdx++
        secInPhase = 0
        if (phaseIdx >= phases.length) {
          phaseIdx = 0
          setRound(r => {
            const next = r + 1
            if (next > exercise.rounds) { clearInterval(intervalRef.current); setPhase('done'); return r }
            return next
          })
        }
        if (phases[phaseIdx]) {
          setPhase(phases[phaseIdx].id)
          setSeconds(phases[phaseIdx].duration)
        }
      }
    }, 1000)
  }, [exercise, phases])

  useEffect(() => () => clearInterval(intervalRef.current), [])

  const curPhase = phases.find(p => p.id === phase)

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] py-8 w-full max-w-sm mx-auto">
      <div className="text-center mb-16">
        <h2 className="text-2xl font-bold text-foreground mb-1">{exercise.name}</h2>
        <p className="text-sm text-muted-foreground">{exercise.desc}</p>
      </div>

      <div className="relative flex items-center justify-center mb-16">
        <div className={cn("rounded-full flex flex-col items-center justify-center transition-all duration-1000", `bg-${exercise.color}/10 border-2 border-${exercise.color}/20`)} style={{ width: 220, height: 220, transform: `scale(${scale})` }}>
          {phase !== 'ready' && phase !== 'done' && (
            <>
              <p className={cn("font-amiri text-2xl mb-2 text-center leading-normal", `text-${exercise.color}`)} dir="rtl">{curPhase?.text}</p>
              <p className="text-4xl font-black text-foreground">{seconds}</p>
              <p className="text-xs text-muted-foreground uppercase tracking-widest mt-1 font-bold">{curPhase?.label}</p>
            </>
          )}
          {phase === 'ready' && <p className="text-sm text-muted-foreground text-center px-4 font-medium">Press start when<br/>you're ready</p>}
          {phase === 'done' && <p className="text-lg font-bold text-primary text-center px-4 leading-tight">Alhamdulillah ✓<br/><span className="text-sm font-medium text-muted-foreground">{exercise.rounds} rounds complete</span></p>}
        </div>
        {phase !== 'ready' && (
          <div className="absolute -top-2 -right-2 w-10 h-10 rounded-full bg-primary flex items-center justify-center text-sm font-bold text-primary-foreground shadow-sm">{round}</div>
        )}
      </div>

      <p className="text-xs text-muted-foreground text-center italic mb-10 max-w-[200px]">"{exercise.hadith}"</p>

      <div className="flex gap-3 w-full">
        {phase === 'ready' && <Button size="lg" className="flex-1" onClick={startBreathing}>Begin</Button>}
        {phase === 'done' && <Button variant="secondary" size="lg" className="flex-1" onClick={() => { setPhase('ready'); setRound(1); setScale(0.6); clearInterval(intervalRef.current) }}>Again</Button>}
        <Button variant="outline" size="lg" className="flex-1" onClick={onClose}>Finish</Button>
      </div>
    </div>
  )
}

function CrisisSupport({ onClose }) {
  return (
    <div className="space-y-4">
      <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-center">
        <p className="text-base font-bold text-destructive">You are not alone 🤲</p>
        <p className="text-xs text-destructive/80 font-medium mt-1">"Do not despair of the mercy of Allah." (39:53)</p>
      </div>
      <p className="text-sm text-foreground leading-relaxed">
        If you are in crisis or experiencing thoughts of self-harm, please reach out immediately. You deserve support — from Allah and from people trained to help.
      </p>
      <div className="space-y-2">
        {CRISIS_RESOURCES.map(r => (
          <div key={r.name} className="p-3 rounded-xl bg-muted border border-border">
            <p className="text-sm font-bold text-foreground">{r.name}</p>
            <p className="text-xs text-muted-foreground">{r.country}</p>
            {r.phone && <a href={`tel:${r.phone}`} className="inline-block text-base font-bold text-primary hover:underline mt-1">📞 {r.phone}</a>}
            {r.url && <a href={r.url} target="_blank" rel="noreferrer" className="block text-xs text-blue-500 hover:underline mt-1 truncate">{r.url}</a>}
          </div>
        ))}
      </div>
      <Button variant="secondary" className="w-full mt-2" onClick={onClose}>Close</Button>
    </div>
  )
}

function GriefCompanion() {
  const [selected, setSelected] = useState(null)
  const types = Object.entries(GRIEF_CONTENT)
  const item = selected ? GRIEF_CONTENT[selected] : null

  return (
    <div className="space-y-4">
      {!selected ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {types.map(([key, val]) => (
            <button key={key} onClick={() => setSelected(key)} className="p-5 rounded-2xl border border-border bg-card text-left hover:border-primary/50 hover:bg-muted/50 transition-all group">
              <p className="text-sm font-bold text-foreground group-hover:text-primary transition-colors">{val.title}</p>
              <p className="text-xs text-muted-foreground mt-1">View Islamic guidance</p>
            </button>
          ))}
        </div>
      ) : (
        <div className="space-y-5 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <button onClick={() => setSelected(null)} className="flex items-center gap-1.5 text-xs font-bold text-primary hover:underline">
            <ArrowLeft className="h-3 w-3" /> Back to options
          </button>
          
          <h2 className="text-xl font-bold text-foreground">{item.title}</h2>
          
          <div className="p-4 rounded-xl bg-primary/5 border border-primary/20">
            <p className="text-sm text-foreground leading-relaxed font-medium">{item.guidance}</p>
          </div>
          
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">📖 Relevant Ayat</h3>
            <div className="space-y-3">
              {item.ayat.map((a, i) => (
                <div key={i} className="p-4 rounded-xl bg-card border border-border space-y-1">
                  <p className="text-xs font-bold text-primary">{a.ref}</p>
                  <p className="text-sm text-foreground leading-relaxed italic">"{a.text}"</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

const TABS = ['breathe', 'grief', 'health', 'programs']
const TAB_LABELS = { breathe: 'Breathing', grief: 'Hardship', health: 'Health', programs: 'Programs' }

function WellnessPage() {
  const [tab, setTab] = useState('breathe')
  const [activeBreathing, setActiveBreathing] = useState(null)
  const [showCrisis, setShowCrisis] = useState(false)
  const [expandedProgram, setExpandedProgram] = useState(null)
  const ctx = getIslamicContext()

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 md:py-8 space-y-6 relative">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center justify-between">
          <span>Wellness</span>
          <Heart className="h-6 w-6 text-primary" />
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">{ctx.formatted}</p>
      </div>

      <div className="flex items-center justify-between p-3.5 rounded-2xl bg-destructive/5 border border-destructive/20">
        <div className="flex items-center gap-2.5">
          <AlertTriangle className="h-4 w-4 text-destructive" />
          <p className="text-xs font-medium text-foreground">Struggling right now?</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => setShowCrisis(true)} className="h-8 text-xs border-destructive text-destructive hover:bg-destructive hover:text-white">
          Get support
        </Button>
      </div>

      <div className="flex p-1 rounded-xl bg-muted gap-1">
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={cn('flex-1 px-2 py-2 rounded-lg text-xs font-bold transition-all', tab === t ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground')}>
            {TAB_LABELS[t]}
          </button>
        ))}
      </div>

      <div className="pt-2">
        {/* BREATHE TAB */}
        {tab === 'breathe' && (
          <div className="space-y-4">
            {activeBreathing ? (
              <BreathingExercise exercise={activeBreathing} onClose={() => setActiveBreathing(null)} />
            ) : (
              <>
                <p className="text-xs font-medium text-muted-foreground leading-relaxed italic bg-muted/50 p-4 rounded-xl border border-dashed border-border mb-4">
                  The Prophet ﷺ said: "Anger comes from Shaytan, and Shaytan was created from fire. Fire is extinguished with water, so when one of you becomes angry, let him perform wudu."
                </p>
                <div className="space-y-3">
                  {BREATHING_EXERCISES.map(ex => (
                    <Card key={ex.id} className="overflow-hidden p-0">
                      <div className={cn("p-4 sm:p-5 border-l-4", `border-l-${ex.color}`)}>
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="font-bold text-base text-foreground">{ex.name}</h3>
                            <p className="text-xs text-muted-foreground mt-1">{ex.desc}</p>
                            <p className={cn("text-[10px] uppercase tracking-wider font-bold mt-3", `text-${ex.color}`)}>
                              {ex.rounds} rounds · ~{Math.round((ex.inhale + ex.hold + ex.exhale + ex.hold2) * ex.rounds / 60)} min
                            </p>
                          </div>
                          <Button size="sm" onClick={() => setActiveBreathing(ex)} className={cn(`bg-${ex.color} hover:bg-${ex.color}/90 shrink-0 ml-4`)}>
                            Begin
                          </Button>
                        </div>
                        <div className="flex gap-2 mt-4 flex-wrap">
                          {[['Inhale', ex.inhale], ex.hold ? ['Hold', ex.hold] : null, ['Exhale', ex.exhale], ex.hold2 ? ['Hold', ex.hold2] : null].filter(Boolean).map(([l, n]) => (
                            <Badge key={l} variant="secondary" className={cn("text-[9px] uppercase font-bold", `bg-${ex.color}/10 text-${ex.color}`)}>
                              {l} {n}s
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {/* GRIEF TAB */}
        {tab === 'grief' && <GriefCompanion />}

        {/* HEALTH TAB */}
        {tab === 'health' && (
          <div className="space-y-4">
            <Card className="p-4 sm:p-5">
              <h2 className="text-sm font-bold text-foreground">Water Tracking</h2>
              <p className="text-[11px] text-muted-foreground mt-1 mb-4 italic">"The best form of charity is giving someone water." — Sunan an-Nasa'i</p>
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-blue-500/10 text-blue-500 flex items-center justify-center text-2xl shrink-0"><Droplets className="h-6 w-6" /></div>
                <div className="flex-1">
                  <p className="text-sm font-bold text-foreground">4 / 8 cups today</p>
                  <div className="h-2 bg-muted rounded-full mt-2 overflow-hidden">
                    <div className="h-full w-1/2 bg-blue-500 rounded-full" />
                  </div>
                </div>
                <Button size="sm" variant="secondary" className="shrink-0 h-9 font-bold bg-blue-500/10 text-blue-600 hover:bg-blue-500/20 shadow-none border-0">+ Add</Button>
              </div>
            </Card>

            <Card className="p-4 sm:p-5">
              <h2 className="text-sm font-bold text-foreground">Sleep Tracking</h2>
              <p className="text-[11px] text-muted-foreground mt-1 mb-4 italic">"And We made your sleep for rest." (78:9)</p>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-4 rounded-xl bg-muted/50 border border-border">
                  <p className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground mb-1 flex items-center gap-1"><Moon className="h-3 w-3" /> Last Night</p>
                  <p className="text-xl font-black text-foreground">06<span className="text-sm font-medium text-muted-foreground ml-0.5 mr-1">h</span>45<span className="text-sm font-medium text-muted-foreground ml-0.5">m</span></p>
                </div>
                <div className="p-4 rounded-xl bg-primary/5 border border-primary/20">
                  <p className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground mb-1">Fajr Check</p>
                  <p className="text-xl font-black text-primary">On Time</p>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* PROGRAMS TAB */}
        {tab === 'programs' && (
          <div className="space-y-3">
            {GUIDED_PROGRAMS.map(prog => (
              <Card key={prog.id} className="p-0 overflow-hidden hover:border-primary/50 transition-colors">
                <button className="w-full p-4 sm:p-5 flex items-start gap-4 text-left focus:outline-none" onClick={() => setExpandedProgram(expandedProgram === prog.id ? null : prog.id)}>
                  <span className="text-3xl shrink-0 drop-shadow-sm">{prog.icon}</span>
                  <div className="flex-1 min-w-0 pt-0.5">
                    <h3 className="font-bold text-sm text-foreground truncate">{prog.title}</h3>
                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed line-clamp-2">{prog.desc}</p>
                    <Badge variant="secondary" className="mt-3 text-[10px] font-bold uppercase">{prog.duration}</Badge>
                  </div>
                </button>
                {expandedProgram === prog.id && (
                  <div className="px-5 pb-5 pt-0 animate-in fade-in slide-in-from-top-2">
                    <div className="pt-4 border-t border-border mt-1 space-y-3">
                      {prog.days.map((d, i) => (
                        <div key={i} className="flex gap-3 items-start">
                          <div className="w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px] font-black shrink-0 mt-0.5">{i + 1}</div>
                          <p className="text-xs text-foreground font-medium leading-relaxed">{d}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>

      {showCrisis && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-card border border-border shadow-lg rounded-2xl p-6 animate-in zoom-in-95 duration-200">
            <CrisisSupport onClose={() => setShowCrisis(false)} />
          </div>
        </div>
      )}
    </div>
  )
}
