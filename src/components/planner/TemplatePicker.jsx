import React, { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { tasksApi } from '@/lib/api'
import { X, Layers } from 'lucide-react'
import { cn } from '@/lib/utils'
import toast from 'react-hot-toast'

const TODAY = new Date().toISOString().slice(0, 10)

const TEMPLATES = [
  {
    id: 'student',
    label: 'Student Day',
    icon: '📚',
    tasks: [
      { title: 'Quran recitation', category: 'ibadah', time_block: 'after_fajr', estimated_minutes: 15 },
      { title: 'Study session 1', category: 'learning', time_block: 'morning', estimated_minutes: 90 },
      { title: 'Review notes', category: 'learning', time_block: 'after_dhuhr', estimated_minutes: 30 },
      { title: 'Study session 2', category: 'learning', time_block: 'after_asr', estimated_minutes: 60 },
      { title: 'Dhikr + reflection', category: 'ibadah', time_block: 'after_maghrib', estimated_minutes: 20 },
    ],
  },
  {
    id: 'ramadan',
    label: 'Ramadan Day',
    icon: '🌙',
    tasks: [
      { title: 'Suhoor prep', category: 'personal', time_block: 'after_isha', estimated_minutes: 20 },
      { title: "Quran juz'", category: 'ibadah', time_block: 'after_fajr', estimated_minutes: 45 },
      { title: 'Light work', category: 'work', time_block: 'morning', estimated_minutes: 60 },
      { title: 'Rest', category: 'personal', time_block: 'after_dhuhr', estimated_minutes: 30 },
      { title: 'Quran review', category: 'ibadah', time_block: 'after_asr', estimated_minutes: 20 },
      { title: 'Iftar prep', category: 'family', time_block: 'after_maghrib', estimated_minutes: 30 },
      { title: 'Taraweeh', category: 'ibadah', time_block: 'after_isha', estimated_minutes: 60 },
    ],
  },
  {
    id: 'wfh',
    label: 'Work From Home',
    icon: '💼',
    tasks: [
      { title: 'Deep work block 1', category: 'work', time_block: 'after_fajr', estimated_minutes: 90 },
      { title: 'Admin + email', category: 'work', time_block: 'after_dhuhr', estimated_minutes: 45 },
      { title: 'Deep work block 2', category: 'work', time_block: 'after_asr', estimated_minutes: 60 },
      { title: 'Family time', category: 'family', time_block: 'after_maghrib', estimated_minutes: 60 },
    ],
  },
  {
    id: 'travel',
    label: 'Travel Day',
    icon: '✈️',
    tasks: [
      { title: 'Quran', category: 'ibadah', time_block: 'after_fajr', estimated_minutes: 15, islamic_context: 'Qasr prayer applies today' },
      { title: 'Light tasks only', category: 'errand', time_block: 'morning', estimated_minutes: 30 },
    ],
  },
  {
    id: 'ceo',
    label: 'Executive Day',
    icon: '📊',
    tasks: [
      { title: 'Review key metrics', category: 'work', time_block: 'morning', estimated_minutes: 30 },
      { title: 'Deep work block', category: 'work', time_block: 'morning', estimated_minutes: 90 },
      { title: 'Meetings & syncs', category: 'work', time_block: 'after_dhuhr', estimated_minutes: 60 },
      { title: 'Inbox zero', category: 'errand', time_block: 'after_asr', estimated_minutes: 30 },
      { title: 'Plan tomorrow', category: 'personal', time_block: 'evening', estimated_minutes: 15 },
    ],
  },
  {
    id: 'developer',
    label: 'Deep Work Focus',
    icon: '💻',
    tasks: [
      { title: 'Code review', category: 'work', time_block: 'morning', estimated_minutes: 30 },
      { title: 'Deep work (Sprint task)', category: 'work', time_block: 'morning', estimated_minutes: 120 },
      { title: 'Deep work (Bug fixing)', category: 'work', time_block: 'after_dhuhr', estimated_minutes: 90 },
      { title: 'Learning / Tech docs', category: 'learning', time_block: 'after_asr', estimated_minutes: 45 },
    ],
  },
  {
    id: 'weekend',
    label: 'Weekend Reset',
    icon: '☕',
    tasks: [
      { title: 'Slow morning + Reading', category: 'personal', time_block: 'morning', estimated_minutes: 60 },
      { title: 'Household chores', category: 'errand', time_block: 'after_dhuhr', estimated_minutes: 90 },
      { title: 'Family time / Outing', category: 'family', time_block: 'after_asr', estimated_minutes: 180 },
      { title: 'Weekly review', category: 'personal', time_block: 'evening', estimated_minutes: 30 },
    ],
  },
]

export function TemplatePicker({ onClose }) {
  const [selected, setSelected] = useState(null)
  const qc = useQueryClient()

  const { mutate: apply, isPending } = useMutation({
    mutationFn: async () => {
      const template = TEMPLATES.find(t => t.id === selected)
      if (!template) return
      for (const task of template.tasks) {
        await tasksApi.create({ ...task, due_date: TODAY, priority: 'medium' })
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tasks'] })
      toast.success('Template applied!')
      onClose()
    },
    onError: () => toast.error('Could not apply template'),
  })

  const template = TEMPLATES.find(t => t.id === selected)

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl bg-background border border-border shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 pt-5 pb-3">
          <div className="flex items-center gap-2">
            <Layers className="h-5 w-5 text-primary" />
            <h2 className="font-bold">Day Templates</h2>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-muted"><X className="h-4 w-4" /></button>
        </div>

        <div className="px-6 pb-6 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            {TEMPLATES.map(t => (
              <button
                key={t.id}
                onClick={() => setSelected(t.id)}
                className={cn(
                  'rounded-2xl border p-4 text-left transition-all',
                  selected === t.id
                    ? 'border-primary bg-primary/10'
                    : 'border-border/60 bg-card hover:border-primary/40',
                )}
              >
                <p className="text-2xl mb-1">{t.icon}</p>
                <p className="font-bold text-sm">{t.label}</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">{t.tasks.length} tasks</p>
              </button>
            ))}
          </div>

          {template && (
            <div className="rounded-xl bg-muted/40 border border-border/50 p-3 space-y-1.5">
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Preview</p>
              {template.tasks.map((task, i) => (
                <div key={i} className="flex items-center gap-2 text-xs">
                  <span className="text-muted-foreground w-24 shrink-0">{task.time_block?.replace(/_/g, ' ')}</span>
                  <span className="text-foreground">{task.title}</span>
                  <span className="text-muted-foreground ml-auto shrink-0">{task.estimated_minutes}m</span>
                </div>
              ))}
            </div>
          )}

          <button
            onClick={() => {
              if (!selected) return toast.error('Pick a template first')
              if (window.confirm(`This will add ${template?.tasks.length} tasks to today. Continue?`)) {
                apply()
              }
            }}
            disabled={isPending || !selected}
            className="w-full rounded-xl bg-primary text-primary-foreground py-2.5 text-sm font-bold disabled:opacity-50 hover:opacity-90"
          >
            {isPending ? 'Creating tasks…' : 'Apply template →'}
          </button>
        </div>
      </div>
    </div>
  )
}
