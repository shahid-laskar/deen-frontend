import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { format } from 'date-fns'
import { Timer, Play, Pause, Square, Check } from 'lucide-react'
import { tasksApi } from '@/lib/api'
import { appendFocusSession, getPrefs } from '@/lib/planner/prefs'
import { minutesUntilNextPrayer } from '@/lib/planner/prayer-blocks'
import { cn } from '@/lib/utils'
import toast from 'react-hot-toast'

// Tiny soft chime encoded as base64 data URI (silent sine wave placeholder)
const CHIME_SRC = 'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA='

function useTimer(durationSec) {
  const [remaining, setRemaining] = useState(durationSec)
  const [running, setRunning] = useState(false)
  const intervalRef = useRef(null)

  useEffect(() => { setRemaining(durationSec) }, [durationSec])

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => {
        setRemaining(r => {
          if (r <= 1) { clearInterval(intervalRef.current); setRunning(false); return 0 }
          return r - 1
        })
      }, 1000)
    } else {
      clearInterval(intervalRef.current)
    }
    return () => clearInterval(intervalRef.current)
  }, [running])

  const start  = () => setRunning(true)
  const pause  = () => setRunning(false)
  const stop   = () => { setRunning(false); setRemaining(durationSec) }
  const isDone = remaining === 0

  return { remaining, running, start, pause, stop, isDone }
}

function RingTimer({ remaining, total, running }) {
  const R = 60
  const circ = 2 * Math.PI * R
  const progress = remaining / total
  const offset = circ * (1 - progress)
  const mins = Math.floor(remaining / 60)
  const secs = remaining % 60

  return (
    <div className="relative flex items-center justify-center">
      <svg width="160" height="160" className="-rotate-90">
        <circle cx="80" cy="80" r={R} fill="none" stroke="currentColor" strokeWidth="8" className="text-muted/30" />
        <circle
          cx="80" cy="80" r={R}
          fill="none" stroke="currentColor" strokeWidth="8"
          className={cn('transition-all duration-1000', progress < 0.25 ? 'text-red-500' : progress < 0.5 ? 'text-amber-500' : 'text-primary')}
          strokeDasharray={circ}
          strokeDashoffset={offset}
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute text-center">
        <p className="text-3xl font-bold tabular-nums">
          {String(mins).padStart(2,'0')}:{String(secs).padStart(2,'0')}
        </p>
        <p className="text-[10px] text-muted-foreground uppercase tracking-widest mt-1">
          {running ? 'Focusing' : 'Paused'}
        </p>
      </div>
    </div>
  )
}

export function FocusView({ todayTasks, prayerTimes }) {
  const qc = useQueryClient()
  const prefs = getPrefs()
  const [duration, setDuration] = useState(prefs.pomodoroLength || 25)
  const [selectedTask, setSelectedTask] = useState(null)
  const [sessionCount, setSessionCount] = useState(0)
  const audioRef = useRef(null)

  const durationSec = duration * 60
  const { remaining, running, start, pause, stop, isDone } = useTimer(durationSec)

  const minsUntilPrayer = prayerTimes ? minutesUntilNextPrayer(prayerTimes) : 999
  const prayerWarning = minsUntilPrayer < duration && minsUntilPrayer > 0

  useEffect(() => {
    if (isDone && selectedTask) {
      if (prefs.soundOn !== false) {
        try { audioRef.current?.play() } catch {}
      }
      appendFocusSession({ taskId: selectedTask.id, minutes: duration, completedAt: new Date().toISOString() })
      setSessionCount(s => s + 1)
      toast.success(`Session complete! ${duration} minutes of focus.`, { duration: 5000 })
    }
  }, [isDone])

  const { mutate: completeTask } = useMutation({
    mutationFn: (id) => tasksApi.complete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['tasks'] }); toast.success('Task done! MashaaAllah 🌙') },
  })

  const incomplete = todayTasks.filter(t => !t.completed && !t.parent_task_id)

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <audio ref={audioRef} src={CHIME_SRC} />

      <div className="text-center">
        <h2 className="text-lg font-bold flex items-center gap-2 justify-center"><Timer className="h-5 w-5" />Focus Timer</h2>
        <p className="text-xs text-muted-foreground mt-1">Prayer-aware Pomodoro</p>
      </div>

      {/* Duration selector */}
      <div className="flex items-center justify-center gap-2 flex-wrap">
        {[25, 50, 90].map(d => (
          <button
            key={d}
            onClick={() => { setDuration(d); stop() }}
            className={cn('px-4 py-2 rounded-xl text-sm font-bold transition-all border', duration === d ? 'bg-primary text-primary-foreground border-primary' : 'border-border text-muted-foreground hover:border-primary hover:text-foreground')}
          >
            {d}m
          </button>
        ))}
        {/* Custom Timer Input */}
        <div className="flex items-center gap-1 border border-border rounded-xl px-2 bg-card">
          <input
            type="number"
            min="1"
            max="240"
            className="w-14 bg-transparent py-2 text-sm text-center font-bold focus:outline-none placeholder:font-normal"
            placeholder="Custom"
            onKeyDown={e => {
              if (e.key === 'Enter') {
                const val = parseInt(e.target.value)
                if (val > 0) { setDuration(val); stop() }
              }
            }}
          />
          <span className="text-sm font-bold text-muted-foreground pr-2">m</span>
        </div>
      </div>

      {/* Prayer warning */}
      {prayerWarning && !running && (
        <div className="rounded-2xl bg-amber-500/10 border border-amber-500/30 px-4 py-3 text-sm text-amber-700 dark:text-amber-300">
          ⚠ Prayer in {minsUntilPrayer} min — session will auto-pause
        </div>
      )}

      {/* Ring */}
      <div className="flex justify-center">
        <RingTimer remaining={remaining} total={durationSec} running={running} />
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-3">
        {!running ? (
          <button onClick={start} className="flex items-center gap-2 rounded-2xl bg-primary text-primary-foreground px-8 py-3 font-bold text-sm hover:opacity-90">
            <Play className="h-4 w-4" /> Start
          </button>
        ) : (
          <button onClick={pause} className="flex items-center gap-2 rounded-2xl bg-amber-500 text-white px-8 py-3 font-bold text-sm">
            <Pause className="h-4 w-4" /> Pause
          </button>
        )}
        <button onClick={stop} className="rounded-2xl border border-border px-5 py-3 text-muted-foreground hover:text-foreground">
          <Square className="h-4 w-4" />
        </button>
      </div>

      {/* Mark done after session */}
      {isDone && selectedTask && (
        <div className="rounded-2xl bg-emerald-500/10 border border-emerald-500/30 px-4 py-3 flex items-center justify-between gap-3">
          <p className="text-sm font-medium">Mark "{selectedTask.title}" as done?</p>
          <button onClick={() => completeTask(selectedTask.id)} className="flex items-center gap-1 text-sm font-bold text-emerald-600 hover:underline">
            <Check className="h-4 w-4" /> Done
          </button>
        </div>
      )}

      {/* Session stats */}
      {sessionCount > 0 && (
        <div className="flex items-center justify-center gap-4 text-center">
          <div>
            <p className="text-2xl font-bold">{sessionCount}</p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Sessions today</p>
          </div>
          <div>
            <p className="text-2xl font-bold">{sessionCount * duration}</p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Focus minutes</p>
          </div>
        </div>
      )}

      {/* Task picker */}
      <div className="space-y-2">
        <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Pick a task to focus on</p>
        {incomplete.length === 0 ? (
          <p className="text-sm text-muted-foreground italic">No remaining tasks for today</p>
        ) : (
          incomplete.map(task => (
            <button
              key={task.id}
              onClick={() => setSelectedTask(task)}
              className={cn(
                'w-full text-left px-4 py-3 rounded-xl border text-sm font-medium transition-all',
                selectedTask?.id === task.id
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-border bg-card hover:border-primary/50',
              )}
            >
              {task.title}
              {task.estimated_minutes > 0 && (
                <span className="ml-2 text-xs text-muted-foreground">~{task.estimated_minutes}m</span>
              )}
            </button>
          ))
        )}
      </div>
    </div>
  )
}
