import React, { useState, useRef, useEffect } from 'react'
import { Plus, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { parseQuickAdd, describeTokens } from '@/lib/planner/parser'
import { tasksApi } from '@/lib/api'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'

export function QuickAddBar({ defaultTimeBlock, defaultDueDate, onCreated }) {
  const [value, setValue] = useState('')
  const [parsed, setParsed] = useState({})
  const inputRef = useRef(null)
  const qc = useQueryClient()

  // Focus on 'n' keypress (handled in parent via ref forwarding, or here)
  useEffect(() => {
    const handler = (e) => {
      const tag = document.activeElement?.tagName
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(tag)) return
      if (e.key === 'n' && !e.ctrlKey && !e.metaKey) {
        e.preventDefault()
        inputRef.current?.focus()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  const { mutate: create, isPending } = useMutation({
    mutationFn: (payload) => tasksApi.create(payload),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ['tasks'] })
      setValue('')
      setParsed({})
      onCreated?.(res.data)
      toast.success('Task added ✓')
    },
    onError: () => toast.error('Could not create task'),
  })

  const handleChange = (e) => {
    setValue(e.target.value)
    setParsed(parseQuickAdd(e.target.value))
  }

  const handleSubmit = (e) => {
    e?.preventDefault()
    const p = parseQuickAdd(value)
    if (!p.title.trim()) return
    const payload = {
      title: p.title,
      priority: p.priority ?? 'medium',
      category: p.category,
      estimated_minutes: p.estimated_minutes,
      time_block: p.time_block ?? defaultTimeBlock,
      due_date: p.due_date ?? defaultDueDate,
      is_urgent: p.is_urgent ?? false,
      is_important: p.is_important ?? false,
    }
    create(payload)
  }

  const chips = value.trim() ? describeTokens(parsed) : []

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <div className="flex items-center gap-2 rounded-2xl bg-card border border-border/60 shadow-sm px-4 py-3 focus-within:border-primary/50 focus-within:shadow-soft transition-all">
        <Plus className="h-4 w-4 text-muted-foreground shrink-0" />
        <input
          ref={inputRef}
          value={value}
          onChange={handleChange}
          onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
          placeholder="Add task… (try: Buy groceries #errand ~30m @tomorrow p2)"
          className="flex-1 bg-transparent text-sm placeholder:text-muted-foreground/50 focus:outline-none"
        />
        {isPending
          ? <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          : value.trim() && (
            <button type="submit" className="text-xs font-bold text-primary px-2 py-1 rounded-lg hover:bg-primary/10 transition-colors">
              Add
            </button>
          )
        }
      </div>
      {chips.length > 0 && (
        <div className="flex flex-wrap gap-1.5 px-1">
          {chips.map((chip, i) => (
            <span key={i} className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-primary/10 text-primary">
              {chip}
            </span>
          ))}
        </div>
      )}
    </form>
  )
}
