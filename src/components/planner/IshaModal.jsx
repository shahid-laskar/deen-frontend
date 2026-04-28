import React, { useState } from 'react'
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query'
import { format, addDays } from 'date-fns'
import { X, MoveRight, Trash2 } from 'lucide-react'
import { tasksApi } from '@/lib/api'
import { setLastRitual, setReflection, setShukr } from '@/lib/planner/prefs'
import { cn } from '@/lib/utils'
import toast from 'react-hot-toast'

const TODAY = new Date().toISOString().slice(0, 10)
const TOMORROW = addDays(new Date(), 1).toISOString().slice(0, 10)

function StepIndicator({ current, total }) {
  return (
    <div className="flex items-center justify-center gap-1.5">
      {Array.from({ length: total }).map((_, i) => (
        <div key={i} className={cn('h-1.5 rounded-full transition-all',
          i === current ? 'w-6 bg-indigo-500' : i < current ? 'w-3 bg-indigo-500/50' : 'w-3 bg-muted')} />
      ))}
    </div>
  )
}

// Step 1 — Accomplishments
function AccomplishmentsStep({ todayTasks, niyyah, onNext }) {
  const done = todayTasks.filter(t => t.completed)
  return (
    <div className="space-y-4">
      {niyyah && (
        <div className="rounded-xl bg-amber-500/10 border border-amber-500/20 px-4 py-3">
          <p className="text-[10px] font-bold uppercase tracking-widest text-amber-600 mb-0.5">Today's Niyyah</p>
          <p className="font-amiri text-base text-foreground/90 italic">"{niyyah}"</p>
        </div>
      )}
      <div className="text-center py-4">
        <p className="text-5xl font-black text-foreground">{done.length}</p>
        <p className="text-sm text-muted-foreground mt-1">tasks completed today</p>
      </div>
      {done.length > 0 && (
        <div className="space-y-1.5 max-h-40 overflow-y-auto">
          {done.map(task => (
            <div key={task.id} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-500/8 text-sm">
              <span className="text-emerald-500">✓</span>
              <span className="text-foreground/80">{task.title}</span>
            </div>
          ))}
        </div>
      )}
      <button onClick={onNext} className="w-full rounded-xl bg-indigo-500 text-white py-2.5 text-sm font-bold">
        الحمد لله — Next →
      </button>
    </div>
  )
}

// Step 2 — Carry-over
function CarryOverStep({ todayTasks, onNext }) {
  const qc = useQueryClient()
  const incomplete = todayTasks.filter(t => !t.completed)

  const { mutate: deferTomorrow } = useMutation({
    mutationFn: (id) => tasksApi.update(id, { due_date: TOMORROW }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tasks'] }),
  })
  const { mutate: moveInbox } = useMutation({
    mutationFn: (id) => tasksApi.update(id, { due_date: null, time_block: null }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tasks'] }),
  })
  const { mutate: remove } = useMutation({
    mutationFn: (id) => tasksApi.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tasks'] }),
  })

  if (incomplete.length === 0) {
    return (
      <div className="text-center py-8 space-y-3">
        <p className="text-4xl">🌟</p>
        <p className="font-bold text-foreground">All tasks completed!</p>
        <p className="text-sm text-muted-foreground">MashaaAllah — what a day!</p>
        <button onClick={onNext} className="rounded-xl bg-indigo-500 text-white px-6 py-2 text-sm font-bold">Next →</button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">{incomplete.length} incomplete — what to do with each?</p>
      <div className="space-y-2 max-h-56 overflow-y-auto">
        {incomplete.map(task => (
          <div key={task.id} className="flex items-center gap-2 p-3 rounded-xl bg-muted/40 border border-border/50">
            <p className="flex-1 text-sm font-medium truncate">{task.title}</p>
            <div className="flex items-center gap-1 shrink-0">
              <button onClick={() => deferTomorrow(task.id)} title="Tomorrow"
                className="text-[10px] font-bold px-2 py-1 rounded-lg bg-blue-500/10 text-blue-600 hover:bg-blue-500/20">
                tmrw
              </button>
              <button onClick={() => moveInbox(task.id)} title="Inbox"
                className="p-1.5 rounded-lg text-muted-foreground hover:bg-muted">
                <MoveRight className="h-3.5 w-3.5" />
              </button>
              <button onClick={() => remove(task.id)} title="Delete"
                className="p-1.5 rounded-lg text-destructive hover:bg-destructive/10">
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>
      <button onClick={onNext} className="w-full rounded-xl bg-indigo-500 text-white py-2.5 text-sm font-bold">Next →</button>
    </div>
  )
}

// Step 3 — Reflection
function ReflectionStep({ onNext }) {
  const [text, setText] = useState('')
  const save = () => { if (text.trim()) setReflection(TODAY, text.trim()); onNext() }
  return (
    <div className="space-y-4">
      <div className="text-center">
        <p className="font-amiri text-xl text-indigo-400">التأمل</p>
        <p className="text-sm text-muted-foreground mt-1">What will I do differently tomorrow?</p>
      </div>
      <textarea
        value={text}
        onChange={e => setText(e.target.value)}
        placeholder="Tomorrow I will…"
        rows={4}
        autoFocus
        className="w-full rounded-xl border border-border bg-muted/30 px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 resize-none"
      />
      <button onClick={save} className="w-full rounded-xl bg-indigo-500 text-white py-2.5 text-sm font-bold">
        {text.trim() ? 'Save & next →' : 'Skip →'}
      </button>
    </div>
  )
}

// Step 4 — Shukr
function ShukrStep({ onDone }) {
  const [text, setText] = useState('')
  const save = () => {
    if (text.trim()) setShukr(TODAY, text.trim())
    setLastRitual(TODAY, 'isha')
    onDone()
  }
  return (
    <div className="space-y-4">
      <div className="text-center">
        <p className="text-4xl mb-2">🌙</p>
        <p className="font-amiri text-xl text-amber-400">الشكر</p>
        <p className="text-sm text-muted-foreground mt-1">Name one thing you're grateful for today</p>
      </div>
      <input
        value={text}
        onChange={e => setText(e.target.value)}
        placeholder="I am grateful for…"
        autoFocus
        className="w-full rounded-xl border border-border bg-muted/30 px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-amber-500"
      />
      <p className="font-amiri text-sm text-center text-muted-foreground/70">
        "وَإِن تَعُدُّوا نِعْمَتَ اللَّهِ لَا تُحْصُوهَا"
      </p>
      <button onClick={save} className="w-full rounded-xl bg-emerald-500 text-white py-2.5 text-sm font-bold hover:opacity-90">
        أستودعك الله — Good night
      </button>
    </div>
  )
}

const STEPS = ['Accomplishments', 'Carry-over', 'Reflection', 'Shukr']

export function IshaModal({ todayTasks, niyyah, onClose }) {
  const [step, setStep] = useState(0)
  const next = () => setStep(s => Math.min(s + 1, STEPS.length - 1))

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full sm:max-w-lg rounded-t-3xl sm:rounded-3xl bg-background border border-border shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 pt-6 pb-3">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-indigo-400">
              Evening Muhasaba — محاسبة
            </p>
            <h2 className="font-bold text-lg text-foreground">{STEPS[step]}</h2>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-muted"><X className="h-4 w-4" /></button>
        </div>
        <div className="px-2 pb-2">
          <StepIndicator current={step} total={STEPS.length} />
        </div>
        <div className="px-6 pb-6 pt-3">
          {step === 0 && <AccomplishmentsStep todayTasks={todayTasks} niyyah={niyyah} onNext={next} />}
          {step === 1 && <CarryOverStep todayTasks={todayTasks} onNext={next} />}
          {step === 2 && <ReflectionStep onNext={next} />}
          {step === 3 && <ShukrStep onDone={onClose} />}
        </div>
      </div>
    </div>
  )
}
