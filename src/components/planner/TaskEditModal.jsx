import React, { useState, useEffect } from 'react'
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query'
import { tasksApi, aiApi } from '@/lib/api'
import { X, Moon, Sparkles, Loader2, Plus, Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import toast from 'react-hot-toast'

const PRIORITIES = ['low', 'medium', 'high', 'urgent']
const CATEGORIES = ['work', 'personal', 'ibadah', 'family', 'health', 'learning', 'errand']
const TIME_BLOCKS = ['after_fajr', 'morning', 'after_dhuhr', 'afternoon', 'after_asr', 'evening', 'after_maghrib', 'after_isha']
const NIYYAH_CHIPS = ['Providing for my family', 'Seeking Allah\'s pleasure', 'Fulfilling a trust', 'Seeking knowledge']

function Field({ label, children }) {
  return (
    <div>
      <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-1">{label}</label>
      {children}
    </div>
  )
}

const INPUT_CLS = 'w-full rounded-xl border border-border bg-muted/30 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary'
const SELECT_CLS = INPUT_CLS

export function TaskEditModal({ taskId, habits = [], onClose }) {
  const qc = useQueryClient()
  const isNew = String(taskId).startsWith('new:')
  const parentId = isNew ? taskId.split(':')[1] : null
  const realId = isNew ? null : taskId

  // Fetch existing task if editing
  const { data: existingTask, isLoading } = useQuery({
    queryKey: ['tasks', realId],
    queryFn: () => tasksApi.get(realId).then(r => r.data),
    enabled: !!realId,
  })

  const [form, setForm] = useState({
    title: '', description: '', priority: 'medium', category: '',
    due_date: '', time_block: '', estimated_minutes: '',
    islamic_context: '', linked_habit_id: '',
    is_urgent: false, is_important: false,
  })
  const [aiBreakdown, setAiBreakdown] = useState(null)
  const [aiLoading, setAiLoading] = useState(false)
  const [selectedSteps, setSelectedSteps] = useState(new Set())

  useEffect(() => {
    if (existingTask) {
      setForm({
        title: existingTask.title || '',
        description: existingTask.description || '',
        priority: existingTask.priority || 'medium',
        category: existingTask.category || '',
        due_date: existingTask.due_date || '',
        time_block: existingTask.time_block || '',
        estimated_minutes: existingTask.estimated_minutes || '',
        islamic_context: existingTask.islamic_context || '',
        linked_habit_id: existingTask.linked_habit_id || '',
        is_urgent: existingTask.is_urgent || false,
        is_important: existingTask.is_important || false,
      })
    }
  }, [existingTask])

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }))

  const { mutate: save, isPending } = useMutation({
    mutationFn: () => {
      const payload = {
        ...form,
        estimated_minutes: form.estimated_minutes ? parseInt(form.estimated_minutes) : undefined,
        parent_task_id: parentId || undefined,
      }
      // Remove empty strings
      Object.keys(payload).forEach(k => { if (payload[k] === '') delete payload[k] })
      if (realId) return tasksApi.update(realId, payload)
      return tasksApi.create(payload)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tasks'] })
      toast.success(realId ? 'Task updated' : 'Task created')
      onClose()
    },
    onError: () => toast.error('Could not save task'),
  })

  const { mutate: deleteTask, isPending: deleting } = useMutation({
    mutationFn: () => tasksApi.remove(realId),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['tasks'] }); onClose(); toast.success('Task deleted') },
  })

  const askAIBreakdown = async () => {
    if (!form.title.trim()) return toast.error('Add a title first')
    setAiLoading(true)
    try {
      const res = await aiApi.chat({
        prompt: `Break this task into 3 to 5 concrete, actionable steps.\nTask: "${form.title}"\nContext: "${form.description || form.islamic_context || ''}"\nReply with a JSON array of strings only. No markdown, no preamble.`,
      })
      const raw = res.data?.response || res.data?.message || '[]'
      const match = raw.match(/\[[\s\S]*\]/)
      const steps = match ? JSON.parse(match[0]) : []
      setAiBreakdown(steps)
      setSelectedSteps(new Set(steps.map((_, i) => i)))
    } catch {
      toast.error('AI breakdown unavailable')
    } finally {
      setAiLoading(false)
    }
  }

  const { mutate: acceptSteps, isPending: acceptingSteps } = useMutation({
    mutationFn: async () => {
      const today = new Date().toISOString().slice(0, 10)
      for (const idx of selectedSteps) {
        await tasksApi.create({
          title: aiBreakdown[idx],
          parent_task_id: realId,
          priority: form.priority || 'medium',
          due_date: form.due_date || today,
        })
      }
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['tasks'] }); setAiBreakdown(null); toast.success('Sub-tasks added') },
  })

  const linkedHabit = habits.find(h => h.id === form.linked_habit_id)

  if (isLoading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div
        className="w-full sm:max-w-xl max-h-[90vh] overflow-y-auto rounded-t-3xl sm:rounded-3xl bg-background border border-border shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-border/50">
          <h2 className="font-bold text-foreground">{isNew ? 'New Task' : 'Edit Task'}</h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-muted"><X className="h-4 w-4" /></button>
        </div>

        <div className="px-6 py-5 space-y-5">
          {/* Title */}
          <Field label="Title *">
            <input
              autoFocus
              value={form.title}
              onChange={e => set('title', e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') save(); if (e.key === 'Escape') onClose() }}
              placeholder="What needs to be done?"
              className={INPUT_CLS}
            />
          </Field>

          {/* Description */}
          <Field label="Description">
            <textarea
              value={form.description}
              onChange={e => set('description', e.target.value)}
              placeholder="Add details…"
              rows={2}
              className={cn(INPUT_CLS, 'resize-none')}
            />
          </Field>

          {/* Priority + Category */}
          <div className="grid grid-cols-2 gap-3">
            <Field label="Priority">
              <select value={form.priority} onChange={e => set('priority', e.target.value)} className={SELECT_CLS}>
                {PRIORITIES.map(p => <option key={p} value={p}>{p.charAt(0).toUpperCase()+p.slice(1)}</option>)}
              </select>
            </Field>
            <Field label="Category">
              <select value={form.category} onChange={e => set('category', e.target.value)} className={SELECT_CLS}>
                <option value="">None</option>
                {CATEGORIES.map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase()+c.slice(1)}</option>)}
              </select>
            </Field>
          </div>

          {/* Due date + Duration */}
          <div className="grid grid-cols-2 gap-3">
            <Field label="Due date">
              <input type="date" value={form.due_date} onChange={e => set('due_date', e.target.value)} className={INPUT_CLS} />
            </Field>
            <Field label="Duration (mins)">
              <input type="number" min="5" value={form.estimated_minutes} onChange={e => set('estimated_minutes', e.target.value)} placeholder="e.g. 30" className={INPUT_CLS} />
            </Field>
          </div>

          {/* Time block */}
          <Field label="Time block">
            <select value={form.time_block} onChange={e => set('time_block', e.target.value)} className={SELECT_CLS}>
              <option value="">Unscheduled</option>
              {TIME_BLOCKS.map(b => <option key={b} value={b}>{b.replace(/_/g,' ')}</option>)}
            </select>
          </Field>

          {/* Urgent + Important */}
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.is_urgent} onChange={e => set('is_urgent', e.target.checked)} className="rounded accent-red-500" />
              <span className="text-sm font-medium">Urgent</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.is_important} onChange={e => set('is_important', e.target.checked)} className="rounded accent-amber-500" />
              <span className="text-sm font-medium">Important</span>
            </label>
          </div>

          {/* Islamic context */}
          <Field label="Islamic context (Niyyah)">
            <div className="space-y-2">
              <div className="flex items-center gap-2 mb-1">
                <Moon className="h-3.5 w-3.5 text-amber-500" />
                <p className="text-xs text-muted-foreground font-amiri">لماذا تفعل هذا لوجه الله؟</p>
              </div>
              <textarea
                value={form.islamic_context}
                onChange={e => set('islamic_context', e.target.value)}
                placeholder="Why are you doing this for Allah's sake?"
                rows={2}
                maxLength={500}
                className={cn(INPUT_CLS, 'resize-none')}
              />
              <p className="text-[10px] text-muted-foreground text-right">{(form.islamic_context || '').length}/500</p>
              <div className="flex flex-wrap gap-1.5">
                {NIYYAH_CHIPS.map(chip => (
                  <button key={chip} type="button" onClick={() => set('islamic_context', chip)}
                    className="text-[10px] px-2 py-1 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-300 hover:bg-amber-500/20 font-medium">
                    {chip}
                  </button>
                ))}
              </div>
            </div>
          </Field>

          {/* Linked habit */}
          {habits.length > 0 && (
            <Field label="Linked habit">
              <select value={form.linked_habit_id} onChange={e => set('linked_habit_id', e.target.value)} className={SELECT_CLS}>
                <option value="">None</option>
                {habits.map(h => <option key={h.id} value={h.id}>{h.title}</option>)}
              </select>
              {linkedHabit?.streak > 0 && (
                <p className="text-xs text-amber-500 mt-1">🔥 {linkedHabit.streak}-day streak</p>
              )}
            </Field>
          )}

          {/* AI Breakdown */}
          {realId && (
            <div className="space-y-3">
              <button
                onClick={askAIBreakdown}
                disabled={aiLoading}
                className="flex items-center gap-2 text-xs font-bold text-primary hover:underline disabled:opacity-50"
              >
                {aiLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
                Break down with AI
              </button>
              {aiBreakdown && (
                <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 space-y-2">
                  <p className="text-xs font-bold text-primary">Suggested sub-tasks</p>
                  {aiBreakdown.map((step, i) => (
                    <label key={i} className="flex items-start gap-2 cursor-pointer">
                      <input type="checkbox" checked={selectedSteps.has(i)} onChange={() => {
                        setSelectedSteps(s => { const n = new Set(s); n.has(i) ? n.delete(i) : n.add(i); return n })
                      }} className="mt-0.5 accent-primary" />
                      <span className="text-sm">{step}</span>
                    </label>
                  ))}
                  <div className="flex gap-2 pt-1">
                    <button onClick={() => acceptSteps()} disabled={acceptingSteps || selectedSteps.size === 0}
                      className="text-xs font-bold text-primary hover:underline disabled:opacity-50 flex items-center gap-1">
                      <Check className="h-3 w-3" /> Accept selected ({selectedSteps.size})
                    </button>
                    <button onClick={() => { setSelectedSteps(new Set(aiBreakdown.map((_,i)=>i))); acceptSteps() }}
                      className="text-xs text-muted-foreground hover:text-foreground">
                      Accept all
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Activity log */}
          {existingTask && (
            <div className="text-[11px] text-muted-foreground space-y-0.5 border-t border-border/30 pt-3">
              <p>Created: {existingTask.created_at ? new Date(existingTask.created_at).toLocaleDateString() : '—'}</p>
              {existingTask.completed_at && <p>Completed: {new Date(existingTask.completed_at).toLocaleDateString()}</p>}
              {existingTask.updated_at && <p>Last updated: {new Date(existingTask.updated_at).toLocaleDateString()}</p>}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-3 px-6 pb-6">
          {realId ? (
            <button
              onClick={() => { if (confirm('Delete this task?')) deleteTask() }}
              disabled={deleting}
              className="text-sm font-medium text-destructive hover:underline disabled:opacity-50"
            >
              Delete
            </button>
          ) : <div />}
          <div className="flex gap-2">
            <button onClick={onClose} className="px-4 py-2 rounded-xl border border-border text-sm font-medium hover:bg-muted">
              Cancel
            </button>
            <button
              onClick={() => save()}
              disabled={isPending || !form.title.trim()}
              className="px-5 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-bold disabled:opacity-50 hover:opacity-90"
            >
              {isPending ? 'Saving…' : realId ? 'Save changes' : 'Create task'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
