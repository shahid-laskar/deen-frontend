import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useQuery } from '@tanstack/react-query'
import api from '../lib/api'
import { Card, Button } from '../components/ui/index'
import { getIslamicContext } from '../lib/hijri'

// ─── Constants ────────────────────────────────────────────────────────────────

const BREATHING_EXERCISES = [
  {
    id: 'dhikr_sync',
    name: 'Dhikr Breathing',
    desc: 'SubhanAllah inhale · Alhamdulillah exhale',
    inhale: 4, hold: 0, exhale: 6, hold2: 0,
    inhale_text: 'سُبْحَانَ اللَّه',
    exhale_text: 'الْحَمْدُ لِلَّه',
    color: 'var(--t-primary)',
    rounds: 11,
    hadith: 'SubhanAllahi wa bihamdih — Bukhari 6405',
  },
  {
    id: 'box_breathing',
    name: 'Box Breathing',
    desc: 'Inhale 4 · Hold 4 · Exhale 4 · Hold 4 — with tasbeeh',
    inhale: 4, hold: 4, exhale: 4, hold2: 4,
    inhale_text: 'اللَّهُ أَكْبَر',
    exhale_text: 'أَسْتَغْفِرُ اللَّه',
    color: '#3b82f6',
    rounds: 8,
    hadith: 'Allahu Akbar · Astaghfirullah',
  },
  {
    id: '4_7_8',
    name: '4-7-8 Calm',
    desc: 'Inhale 4 · Hold 7 · Exhale 8 — for deep calm',
    inhale: 4, hold: 7, exhale: 8, hold2: 0,
    inhale_text: 'بِسْمِ اللَّه',
    exhale_text: 'الْحَمْدُ لِلَّه',
    color: '#a855f7',
    rounds: 4,
    hadith: 'Begin with Bismillah, end with Alhamdulillah',
  },
]

const CRISIS_RESOURCES = [
  { country: 'Global',  name: 'International Association for Suicide Prevention', url: 'https://www.iasp.info/resources/Crisis_Centres/', phone: null },
  { country: 'UK',      name: 'Samaritans',              phone: '116 123',     url: 'https://www.samaritans.org' },
  { country: 'US',      name: '988 Suicide & Crisis Line',phone: '988',         url: 'https://988lifeline.org' },
  { country: 'UAE',     name: 'Ministry of Health',       phone: '800-HOPE',    url: null },
  { country: 'Malaysia',name: 'Befrienders KL',           phone: '03-7627 2929',url: 'https://www.befrienders.org.my' },
  { country: 'India',   name: 'iCall',                    phone: '9152987821',  url: 'https://icallhelpline.org' },
]

const GRIEF_CONTENT = {
  health: {
    title: 'Facing Illness',
    ayat: [
      { ref: '21:83', text: 'And he called out to his Lord: "Adversity has touched me, and You are the Most Merciful of the merciful."' },
      { ref: '2:155-157', text: 'And We will surely test you with something of fear and hunger...but give good tidings to the patient.' },
    ],
    duas: ['dua_of_ayyub', 'health_shifa', 'health_ruqyah'],
    guidance: 'Illness is an expiation of sins and an opportunity for closeness to Allah. The Prophet ﷺ was among the most severely tested. Seek medical care as a form of tawakkul, not a contradiction of it.',
  },
  loss: {
    title: 'Grief & Loss',
    ayat: [
      { ref: '2:156', text: 'Indeed we belong to Allah, and indeed to Him we will return.' },
      { ref: '93:3', text: 'Your Lord has not forsaken you, nor has He detested you.' },
    ],
    duas: ['dua_hardship_patience'],
    guidance: 'Grief is Sunnah — the Prophet ﷺ wept at the death of his son Ibrahim. Islam does not ask you to suppress grief, but to grieve within hope. The deceased, if righteous, is in a better place.',
  },
  anxiety: {
    title: 'Anxiety & Worry',
    ayat: [
      { ref: '2:286', text: 'Allah does not burden a soul beyond that it can bear.' },
      { ref: '94:5', text: 'For indeed, with hardship will be ease.' },
    ],
    duas: ['anxiety_dua', 'la_ilaha_illa_anta'],
    guidance: 'Anxiety often comes from carrying the future in the present. The Prophet ﷺ would seek refuge in Allah from worry. Dhikr is the spiritual anchor — keep your tongue moist with Allah\'s remembrance.',
  },
  relationship: {
    title: 'Relationship Hardship',
    ayat: [
      { ref: '3:134', text: 'Those who pardon people — and Allah loves the doers of good.' },
      { ref: '49:10', text: 'The believers are but brothers, so make settlement between your brothers.' },
    ],
    duas: ['forgive_daily'],
    guidance: 'The Prophet ﷺ said: "It is not permissible for a Muslim to abandon his brother for more than three days." Where reconciliation is harmful, safe distance with dua is permissible.',
  },
  spiritual_low: {
    title: 'Spiritual Low / Waswas',
    ayat: [
      { ref: '39:53', text: 'Do not despair of the mercy of Allah. Indeed, Allah forgives all sins.' },
      { ref: '7:23', text: 'Our Lord, we have wronged ourselves, and if You do not forgive us and have mercy upon us, we will surely be among the losers.' },
    ],
    duas: ['tawbah_general', 'sayyid_al_istighfar'],
    guidance: 'Every saint has a past, and every sinner has a future. The door of tawbah is open until the sun rises from the west. If you feel spiritually empty, begin with gratitude — it reopens the heart.',
  },
}

// ─── Breathing Exercise ───────────────────────────────────────────────────────

function BreathingExercise({ exercise, onClose }) {
  const [phase, setPhase] = useState('ready')   // ready | inhale | hold | exhale | hold2 | done
  const [seconds, setSeconds] = useState(0)
  const [round, setRound] = useState(1)
  const [scale, setScale] = useState(0.6)
  const intervalRef = useRef(null)

  const phases = [
    { id:'inhale', label:'Breathe in', duration:exercise.inhale, text:exercise.inhale_text, target:1.0 },
    ...(exercise.hold  ? [{ id:'hold',   label:'Hold',        duration:exercise.hold,   text:'...', target:1.0 }] : []),
    { id:'exhale', label:'Breathe out', duration:exercise.exhale, text:exercise.exhale_text, target:0.6 },
    ...(exercise.hold2 ? [{ id:'hold2',  label:'Hold',        duration:exercise.hold2,  text:'...', target:0.6 }] : []),
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
      // Animate circle
      const progress = secInPhase / cur.duration
      const startScale = phaseIdx === 0 ? 0.6 : phases[phaseIdx-1]?.target || 0.6
      const endScale   = cur.target
      setScale(startScale + (endScale - startScale) * progress)

      if (secInPhase >= cur.duration) {
        phaseIdx++
        secInPhase = 0
        if (phaseIdx >= phases.length) {
          phaseIdx = 0
          setRound(r => {
            const next = r + 1
            if (next > exercise.rounds) {
              clearInterval(intervalRef.current)
              setPhase('done')
              return r
            }
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
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', padding:'24px 16px', minHeight:'70vh', justifyContent:'center', gap:32 }}>
      <div>
        <p style={{ fontSize:18, fontWeight:700, color:'var(--t-text)', textAlign:'center' }}>{exercise.name}</p>
        <p style={{ fontSize:13, color:'var(--t-text-muted)', textAlign:'center' }}>{exercise.desc}</p>
      </div>

      {/* Animated circle */}
      <div style={{ position:'relative', display:'flex', alignItems:'center', justifyContent:'center' }}>
        <div style={{
          width:200, height:200, borderRadius:'50%',
          background:`${exercise.color}18`,
          border:`2px solid ${exercise.color}44`,
          transform:`scale(${scale})`,
          transition:'transform 1s ease-in-out',
          display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
        }}>
          {phase !== 'ready' && phase !== 'done' && (
            <>
              <p style={{ fontFamily:'Amiri,serif', fontSize:22, color:exercise.color, direction:'rtl', marginBottom:4 }}>{curPhase?.text}</p>
              <p style={{ fontSize:36, fontWeight:800, color:'var(--t-text)' }}>{seconds}</p>
              <p style={{ fontSize:12, color:'var(--t-text-muted)', textTransform:'uppercase', letterSpacing:'0.1em' }}>{curPhase?.label}</p>
            </>
          )}
          {phase === 'ready' && <p style={{ fontSize:14, color:'var(--t-text-muted)', textAlign:'center', padding:16 }}>Press start when you're ready</p>}
          {phase === 'done'  && <p style={{ fontSize:16, fontWeight:700, color:'var(--t-primary)', textAlign:'center', padding:16 }}>Alhamdulillah ✓<br/>{exercise.rounds} rounds complete</p>}
        </div>
        {/* Round indicator */}
        {phase !== 'ready' && (
          <div style={{ position:'absolute', top:-16, right:-16, width:36, height:36, borderRadius:'50%', background:'var(--t-primary)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, fontWeight:700, color:'white' }}>{round}</div>
        )}
      </div>

      <p style={{ fontSize:12, color:'var(--t-text-muted)', textAlign:'center', fontStyle:'italic' }}>— {exercise.hadith}</p>

      <div style={{ display:'flex', gap:12, width:'100%', maxWidth:280 }}>
        {phase === 'ready' && <Button variant="primary" className="w-full" onClick={startBreathing}>Begin</Button>}
        {phase === 'done'  && <Button variant="primary" className="w-full" onClick={() => { setPhase('ready'); setRound(1); setScale(0.6); clearInterval(intervalRef.current) }}>Again</Button>}
        <Button className="w-full" onClick={onClose}>Done</Button>
      </div>
    </div>
  )
}

// ─── Crisis modal ─────────────────────────────────────────────────────────────

function CrisisSupport({ onClose }) {
  return (
    <div className="space-y-4">
      <div style={{ padding:14, borderRadius:12, background:'rgba(239,68,68,0.06)', border:'0.5px solid #ef4444', textAlign:'center' }}>
        <p style={{ fontSize:14, fontWeight:700, color:'#ef4444' }}>You are not alone 🤲</p>
        <p style={{ fontSize:12, color:'var(--t-text-muted)', marginTop:4 }}>Allah says: "Do not despair of the mercy of Allah." (39:53)</p>
      </div>
      <p style={{ fontSize:13, color:'var(--t-text)', lineHeight:1.7 }}>
        If you are in crisis or experiencing thoughts of self-harm, please reach out immediately. You deserve support — from Allah and from people trained to help.
      </p>
      {CRISIS_RESOURCES.map(r => (
        <div key={r.name} style={{ padding:'10px 12px', borderRadius:10, background:'var(--t-bg)', border:'0.5px solid var(--t-border)' }}>
          <p style={{ fontSize:12, fontWeight:700, color:'var(--t-text)' }}>{r.name}</p>
          <p style={{ fontSize:11, color:'var(--t-text-muted)' }}>{r.country}</p>
          {r.phone && <p style={{ fontSize:14, fontWeight:700, color:'var(--t-primary)', marginTop:4 }}>📞 {r.phone}</p>}
          {r.url && <a href={r.url} target="_blank" rel="noreferrer" style={{ fontSize:11, color:'#3b82f6' }}>{r.url}</a>}
        </div>
      ))}
      <Button className="w-full" onClick={onClose}>Close</Button>
    </div>
  )
}

// ─── Grief companion ──────────────────────────────────────────────────────────

function GriefCompanion() {
  const [selected, setSelected] = useState(null)

  const types = Object.entries(GRIEF_CONTENT)
  const item = selected ? GRIEF_CONTENT[selected] : null

  return (
    <div className="space-y-4">
      <div>
        <p style={{ fontSize:15, fontWeight:700, color:'var(--t-text)', marginBottom:4 }}>Grief & Hardship Companion</p>
        <p style={{ fontSize:12, color:'var(--t-text-muted)' }}>Select the type of hardship you are facing</p>
      </div>
      {!selected ? (
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
          {types.map(([key, val]) => (
            <button key={key} onClick={() => setSelected(key)}
              style={{ padding:'16px 12px', borderRadius:14, border:'0.5px solid var(--t-border)', background:'var(--t-bg-card)', cursor:'pointer', textAlign:'left' }}>
              <p style={{ fontSize:13, fontWeight:600, color:'var(--t-text)' }}>{val.title}</p>
            </button>
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          <button onClick={() => setSelected(null)} style={{ fontSize:13, color:'var(--t-primary)', background:'none', border:'none', cursor:'pointer' }}>← Back</button>
          <p style={{ fontSize:17, fontWeight:700, color:'var(--t-text)' }}>{item.title}</p>
          <div style={{ padding:14, borderRadius:12, background:'rgba(20,168,96,0.05)', border:'0.5px solid var(--t-primary)' }}>
            <p style={{ fontSize:12, color:'var(--t-text)', lineHeight:1.7 }}>{item.guidance}</p>
          </div>
          <div>
            <p style={{ fontSize:13, fontWeight:600, color:'var(--t-accent)', marginBottom:8 }}>📖 Relevant Ayat</p>
            {item.ayat.map((a,i) => (
              <div key={i} style={{ padding:'10px 12px', borderRadius:10, background:'var(--t-bg)', border:'0.5px solid var(--t-border)', marginBottom:8 }}>
                <p style={{ fontSize:11, fontWeight:700, color:'var(--t-accent)' }}>{a.ref}</p>
                <p style={{ fontSize:13, color:'var(--t-text)', lineHeight:1.6, fontStyle:'italic', marginTop:3 }}>{a.text}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Main Wellness page ────────────────────────────────────────────────────────

const TABS = ['breathe', 'grief', 'programs']
const TAB_LABELS = { breathe:'Breathing', grief:'Hardship', programs:'Programs' }

const GUIDED_PROGRAMS = [
  {
    id: '30_days_calm',
    title: '30 Days of Calm',
    desc: 'Build a morning routine from 2-min adhkar to a full 20-min practice',
    duration: '30 days',
    icon: '🌅',
    days: [
      'Day 1–5: Morning intention + Bismillah',
      'Day 6–10: Add Ayat al-Kursi after Fajr',
      'Day 11–15: Morning adhkar (5 min)',
      'Day 16–20: 10 min Quran + adhkar',
      'Day 21–30: Full 20-min morning spiritual routine',
    ],
  },
  {
    id: 'return_to_practice',
    title: 'Return to Practice',
    desc: 'A warm, judgment-free 14-day journey for those coming back to Islam',
    duration: '14 days',
    icon: '🌱',
    days: [
      'Week 1: Begin with gratitude — just 3 things daily',
      'Week 1: Add Fajr, even if late — Allah accepts',
      'Week 2: Choose one Sunnah habit to revive',
      'Week 2: Make dua — speak to Allah as He is listening',
      'End: Reflect on what you want your Islam to look like',
    ],
  },
]

export default function Wellness() {
  const [tab, setTab] = useState('breathe')
  const [activeBreathing, setActiveBreathing] = useState(null)
  const [showCrisis, setShowCrisis] = useState(false)
  const [expandedProgram, setExpandedProgram] = useState(null)
  const ctx = getIslamicContext()

  return (
    <div className="max-w-2xl mx-auto px-4 py-5">
      <div style={{ marginBottom:16 }}>
        <h1 style={{ fontFamily:'var(--font-display,serif)', fontSize:24, fontWeight:700, color:'var(--t-text)' }}>Wellness</h1>
        <p style={{ fontSize:13, color:'var(--t-accent)' }}>{ctx.formatted}</p>
      </div>

      {/* Crisis banner — always visible */}
      <div style={{ padding:'10px 14px', borderRadius:12, background:'rgba(239,68,68,0.06)', border:'0.5px solid rgba(239,68,68,0.3)', display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16 }}>
        <p style={{ fontSize:12, color:'var(--t-text)' }}>Struggling right now?</p>
        <button onClick={() => setShowCrisis(true)} style={{ fontSize:12, fontWeight:600, color:'#ef4444', background:'none', border:'0.5px solid #ef4444', borderRadius:8, padding:'4px 10px', cursor:'pointer' }}>Get support</button>
      </div>

      {/* Tab bar */}
      <div style={{ display:'flex', gap:2, padding:4, borderRadius:12, marginBottom:16, background:'var(--t-bg-card)', border:'0.5px solid var(--t-border)' }}>
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)} style={{ flex:1, padding:'8px 4px', borderRadius:9, fontSize:12, fontWeight:500, border:'none', cursor:'pointer', background:tab===t?'var(--t-primary)':'transparent', color:tab===t?'white':'var(--t-text-muted)', transition:'all 0.15s' }}>
            {TAB_LABELS[t]}
          </button>
        ))}
      </div>

      {/* ── Breathe tab ── */}
      {tab === 'breathe' && (
        <div className="space-y-4">
          {activeBreathing ? (
            <BreathingExercise exercise={activeBreathing} onClose={() => setActiveBreathing(null)} />
          ) : (
            <>
              <p style={{ fontSize:13, color:'var(--t-text-muted)', lineHeight:1.6 }}>
                The Prophet ﷺ said: "Anger comes from Shaytan, and Shaytan was created from fire. Fire is extinguished with water, so when one of you becomes angry, let him perform wudu." — Abu Dawud 4784
              </p>
              {BREATHING_EXERCISES.map(ex => (
                <div key={ex.id} style={{ borderRadius:14, border:'0.5px solid var(--t-border)', background:'var(--t-bg-card)', overflow:'hidden' }}>
                  <div style={{ padding:'16px 16px 12px', borderLeft:`4px solid ${ex.color}` }}>
                    <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between' }}>
                      <div>
                        <p style={{ fontWeight:700, fontSize:15, color:'var(--t-text)' }}>{ex.name}</p>
                        <p style={{ fontSize:12, color:'var(--t-text-muted)', marginTop:3 }}>{ex.desc}</p>
                        <p style={{ fontSize:11, color:ex.color, marginTop:4 }}>{ex.rounds} rounds · ~{Math.round((ex.inhale+ex.hold+ex.exhale+ex.hold2)*ex.rounds/60)} min</p>
                      </div>
                      <Button variant="primary" size="sm" onClick={() => setActiveBreathing(ex)} style={{ background:ex.color, flexShrink:0, marginLeft:12 }}>
                        Begin
                      </Button>
                    </div>
                    <div style={{ display:'flex', gap:8, marginTop:10, flexWrap:'wrap' }}>
                      {[['Inhale',ex.inhale],ex.hold?['Hold',ex.hold]:null,['Exhale',ex.exhale],ex.hold2?['Hold',ex.hold2]:null].filter(Boolean).map(([l,n]) => (
                        <span key={l} style={{ fontSize:10, padding:'3px 8px', borderRadius:99, background:`${ex.color}18`, color:ex.color, fontWeight:600 }}>{l} {n}s</span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      )}

      {/* ── Grief tab ── */}
      {tab === 'grief' && <GriefCompanion />}

      {/* ── Programs tab ── */}
      {tab === 'programs' && (
        <div className="space-y-4">
          {GUIDED_PROGRAMS.map(prog => (
            <div key={prog.id} style={{ borderRadius:14, border:'0.5px solid var(--t-border)', background:'var(--t-bg-card)', overflow:'hidden' }}>
              <button style={{ width:'100%', padding:'16px', display:'flex', alignItems:'center', gap:14, background:'none', border:'none', cursor:'pointer', textAlign:'left' }} onClick={() => setExpandedProgram(expandedProgram===prog.id?null:prog.id)}>
                <span style={{ fontSize:32 }}>{prog.icon}</span>
                <div style={{ flex:1 }}>
                  <p style={{ fontWeight:700, fontSize:15, color:'var(--t-text)' }}>{prog.title}</p>
                  <p style={{ fontSize:12, color:'var(--t-text-muted)', marginTop:3 }}>{prog.desc}</p>
                  <span style={{ fontSize:11, padding:'2px 8px', borderRadius:99, background:'var(--t-border)', color:'var(--t-text-muted)', display:'inline-block', marginTop:6 }}>{prog.duration}</span>
                </div>
              </button>
              {expandedProgram === prog.id && (
                <div style={{ borderTop:'0.5px solid var(--t-border)', padding:'12px 16px' }}>
                  {prog.days.map((d,i) => (
                    <div key={i} style={{ display:'flex', gap:10, padding:'7px 0', borderBottom:i<prog.days.length-1?'0.5px solid var(--t-border)':'none' }}>
                      <div style={{ width:20, height:20, borderRadius:'50%', background:'var(--t-primary)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:10, fontWeight:700, color:'white', flexShrink:0, marginTop:1 }}>{i+1}</div>
                      <p style={{ fontSize:13, color:'var(--t-text)', lineHeight:1.5 }}>{d}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Crisis support modal */}
      {showCrisis && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', zIndex:100, display:'flex', alignItems:'flex-end' }} onClick={() => setShowCrisis(false)}>
          <div onClick={e=>e.stopPropagation()} style={{ width:'100%', maxWidth:600, margin:'0 auto', background:'var(--t-bg-card)', borderRadius:'20px 20px 0 0', padding:'24px 16px', maxHeight:'85vh', overflowY:'auto' }}>
            <CrisisSupport onClose={() => setShowCrisis(false)} />
          </div>
        </div>
      )}
    </div>
  )
}
