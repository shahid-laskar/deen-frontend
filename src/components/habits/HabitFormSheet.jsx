import React, { useState, useEffect } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { X, Plus } from 'lucide-react'
import api from '@/lib/api'
import { cn } from '@/lib/utils'
import toast from 'react-hot-toast'
import { format } from 'date-fns'

const HABIT_TYPES = ['binary', 'quantity', 'duration', 'avoid', 'checklist']
const DIFFICULTIES = ['easy', 'medium', 'hard', 'epic']
const CATEGORIES = ['ibadah', 'quran', 'dhikr', 'sunnah', 'health', 'learning', 'personal', 'family', 'fasting', 'sadaqah', 'avoid']
const PRAYERS = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha']
const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const DAY_VALUES = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
const ICONS = ['🕌', '📖', '📿', '🌙', '💪', '📚', '✅', '👨‍👩‍👧', '💚', '🚫', '🌅', '🤲', '🫀', '🧘', '💧', '🌿', '☕', '🍎', '📝', '🎯']

const DIFF_STYLE = {
  easy: 'border-green-500/40 text-green-600 bg-green-500/10',
  medium: 'border-orange-500/40 text-orange-600 bg-orange-500/10',
  hard: 'border-red-500/40 text-red-600 bg-red-500/10',
  epic: 'border-purple-500/40 text-purple-600 bg-purple-500/10',
}

const DEFAULT_FORM = {
  name: '',
  category: 'ibadah',
  difficulty: 'easy',
  habit_type: 'binary',
  target_count: 1,
  unit: '',
  icon: '',
  anchor_prayer: '',
  days_of_week: [],
  implementation_intention: '',
  temptation_bundle: '',
  is_active: true,
}

export function HabitFormSheet({ habit = null, onClose }) {
  const qc = useQueryClient()
  const isEdit = Boolean(habit?.id)

  const [form, setForm] = useState(() => ({
    ...DEFAULT_FORM,
    ...(habit ? {
      name: habit.name || '',
      category: habit.category || 'ibadah',
      difficulty: habit.difficulty || 'easy',
      habit_type: habit.habit_type || 'binary',
      target_count: habit.target_count || 1,
      unit: habit.unit || '',
      icon: habit.icon || '',
      anchor_prayer: habit.anchor_prayer || '',
      days_of_week: habit.days_of_week || [],
      implementation_intention: habit.implementation_intention || '',
      temptation_bundle: habit.temptation_bundle || '',
    } : {}),
  }))

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }))

  const { mutate: saveHabit, isPending } = useMutation({
    mutationFn: () => isEdit
      ? api.patch(`/habits/${habit.id}`, form)
      : api.post('/habits', form),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['habits'] })
      if (isEdit) qc.invalidateQueries({ queryKey: ['habit', habit.id] })
      toast.success(isEdit ? 'Habit updated!' : 'Habit created! 🌱')
      onClose()
    },
    onError: (e) => toast.error(e.response?.data?.detail || 'Could not save habit'),
  })

  const toggleDay = (day) => {
    set('days_of_week', form.days_of_week.includes(day)
      ? form.days_of_week.filter(d => d !== day)
      : [...form.days_of_week, day])
  }

  // Close on Escape
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose])

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-foreground/30 backdrop-blur-sm" onClick={onClose} />

      {/* Sheet */}
      <div className="relative w-full sm:max-w-lg max-h-[92vh] overflow-y-auto rounded-t-3xl sm:rounded-3xl glass-card shadow-elevated border border-border/50 animate-slide-up">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-card/90 backdrop-blur-xl px-6 pt-6 pb-4 border-b border-border/50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground">
                {isEdit ? 'Edit' : 'New'} Habit
              </p>
              <h2 className="text-xl font-bold text-foreground mt-0.5">
                {isEdit ? habit.name : 'Create a Habit'}
              </h2>
            </div>
            <button onClick={onClose}
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-muted/60 hover:bg-destructive/10 hover:text-destructive transition-all">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="px-6 py-5 space-y-6">
          {/* Name */}
          <div>
            <label className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-2 block">Name</label>
            <input
              autoFocus
              value={form.name}
              onChange={e => set('name', e.target.value)}
              placeholder="e.g. Read Quran after Fajr"
              className="w-full px-4 py-3 rounded-xl bg-muted/50 border border-border text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>

          {/* Icon picker */}
          <div>
            <label className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-2 block">Icon</label>
            <div className="flex flex-wrap gap-2">
              {ICONS.map(icon => (
                <button key={icon} onClick={() => set('icon', form.icon === icon ? '' : icon)}
                  className={cn('w-9 h-9 rounded-xl text-lg transition-all',
                    form.icon === icon
                      ? 'bg-primary/15 ring-2 ring-primary scale-110'
                      : 'bg-muted/60 hover:bg-muted')}>
                  {icon}
                </button>
              ))}
            </div>
          </div>

          {/* Category */}
          <div>
            <label className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-2 block">Category</label>
            <div className="flex flex-wrap gap-1.5">
              {CATEGORIES.map(c => (
                <button key={c} onClick={() => set('category', c)}
                  className={cn('px-3 py-1.5 rounded-xl text-xs font-bold capitalize transition-all',
                    form.category === c
                      ? 'bg-primary/10 text-primary border border-primary/30'
                      : 'bg-muted text-muted-foreground hover:text-foreground')}>
                  {c}
                </button>
              ))}
            </div>
          </div>

          {/* Difficulty */}
          <div>
            <label className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-2 block">Difficulty</label>
            <div className="grid grid-cols-4 gap-2">
              {DIFFICULTIES.map(d => (
                <button key={d} onClick={() => set('difficulty', d)}
                  className={cn('py-2 rounded-xl text-xs font-bold capitalize border transition-all',
                    form.difficulty === d ? DIFF_STYLE[d] : 'border-border text-muted-foreground hover:border-primary/30')}>
                  {d}
                </button>
              ))}
            </div>
          </div>

          {/* Type */}
          <div>
            <label className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-2 block">Type</label>
            <div className="grid grid-cols-3 gap-2">
              {HABIT_TYPES.map(t => (
                <button key={t} onClick={() => set('habit_type', t)}
                  className={cn('py-2 rounded-xl text-xs font-bold capitalize border transition-all',
                    form.habit_type === t
                      ? 'bg-primary/10 border-primary/30 text-primary'
                      : 'border-border text-muted-foreground hover:border-primary/30')}>
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Target (for quantity/duration) */}
          {(form.habit_type === 'quantity' || form.habit_type === 'duration') && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-2 block">Target</label>
                <input type="number" min="1" value={form.target_count}
                  onChange={e => set('target_count', parseInt(e.target.value) || 1)}
                  className="w-full px-4 py-2.5 rounded-xl bg-muted/50 border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/40" />
              </div>
              <div>
                <label className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-2 block">
                  Unit {form.habit_type === 'duration' ? '(min)' : ''}
                </label>
                <input value={form.unit} onChange={e => set('unit', e.target.value)}
                  placeholder={form.habit_type === 'duration' ? 'minutes' : 'pages, rakat…'}
                  className="w-full px-4 py-2.5 rounded-xl bg-muted/50 border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/40" />
              </div>
            </div>
          )}

          {/* Anchor prayer */}
          <div>
            <label className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-2 block">
              Anchor Prayer <span className="normal-case text-muted-foreground font-normal">(optional)</span>
            </label>
            <div className="flex gap-1.5 flex-wrap">
              <button onClick={() => set('anchor_prayer', '')}
                className={cn('px-3 py-1.5 rounded-xl text-xs font-bold transition-all',
                  !form.anchor_prayer ? 'bg-primary/10 text-primary border border-primary/30' : 'bg-muted text-muted-foreground')}>
                None
              </button>
              {PRAYERS.map(p => (
                <button key={p} onClick={() => set('anchor_prayer', form.anchor_prayer === p ? '' : p)}
                  className={cn('px-3 py-1.5 rounded-xl text-xs font-bold capitalize transition-all',
                    form.anchor_prayer === p ? 'bg-primary/10 text-primary border border-primary/30' : 'bg-muted text-muted-foreground')}>
                  {p}
                </button>
              ))}
            </div>
          </div>

          {/* Days of week */}
          <div>
            <label className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-2 block">
              Days <span className="normal-case text-muted-foreground font-normal">(leave empty = daily)</span>
            </label>
            <div className="flex gap-1.5">
              {DAYS.map((d, i) => (
                <button key={d} onClick={() => toggleDay(DAY_VALUES[i])}
                  className={cn('flex-1 py-2 rounded-xl text-xs font-bold transition-all',
                    form.days_of_week.includes(DAY_VALUES[i])
                      ? 'bg-primary/10 text-primary border border-primary/30'
                      : 'bg-muted text-muted-foreground')}>
                  {d[0]}
                </button>
              ))}
            </div>
          </div>

          {/* Implementation intention */}
          <div>
            <label className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-2 block">
              "When I…" Intention <span className="normal-case font-normal">(optional)</span>
            </label>
            <textarea value={form.implementation_intention}
              onChange={e => set('implementation_intention', e.target.value)}
              placeholder='e.g. "When I finish Fajr, I will read 1 page of Quran before leaving the prayer mat"'
              rows={2}
              className="w-full px-4 py-3 rounded-xl bg-muted/50 border border-border text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/40" />
          </div>

          {/* Temptation bundle */}
          <div>
            <label className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-2 block">
              Reward Bundle <span className="normal-case font-normal">(optional)</span>
            </label>
            <input value={form.temptation_bundle} onChange={e => set('temptation_bundle', e.target.value)}
              placeholder='e.g. "While reciting, I can listen to beneficial podcast"'
              className="w-full px-4 py-3 rounded-xl bg-muted/50 border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/40" />
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-card/90 backdrop-blur-xl px-6 py-4 border-t border-border/50 flex gap-3">
          <button onClick={onClose}
            className="flex-1 py-3 rounded-2xl border border-border text-sm font-bold text-muted-foreground hover:bg-muted/60 transition-all">
            Cancel
          </button>
          <button onClick={() => saveHabit()} disabled={isPending || !form.name.trim()}
            className="flex-1 py-3 rounded-2xl bg-primary text-primary-foreground text-sm font-bold shadow-glow-primary hover:opacity-90 transition-all disabled:opacity-50">
            {isPending ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Habit'}
          </button>
        </div>
      </div>
    </div>
  )
}
