import React, { useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { X, Check } from 'lucide-react'
import api from '@/lib/api'
import { cn } from '@/lib/utils'
import toast from 'react-hot-toast'

export function ChecklistSheet({ habitId, habitName, onClose }) {
  const qc = useQueryClient()

  const { data: items = [], isLoading } = useQuery({
    queryKey: ['habits', habitId, 'checklist'],
    queryFn: () => api.get(`/habits/${habitId}/checklist`).then(r => r.data).catch(() => []),
  })

  const { mutate: toggleItem } = useMutation({
    mutationFn: (itemId) => api.post(`/habits/${habitId}/checklist/${itemId}/log`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['habits', habitId, 'checklist'] }),
    onError: () => toast.error('Could not toggle item'),
  })

  // Close on Escape
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose])

  const doneCount = items.filter(i => i.completed_today).length
  const pct = items.length ? Math.round((doneCount / items.length) * 100) : 0

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-foreground/30 backdrop-blur-sm" onClick={onClose} />

      {/* Bottom sheet */}
      <div className="relative w-full max-w-lg rounded-t-3xl glass-card shadow-elevated border-t border-border/50 animate-slide-up">
        {/* Handle bar */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-border" />
        </div>

        {/* Header */}
        <div className="px-6 pt-3 pb-4 border-b border-border/50">
          <div className="flex items-center justify-between">
            <div className="min-w-0">
              <p className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground">Checklist</p>
              <h2 className="text-base font-bold text-foreground mt-0.5 truncate">{habitName}</h2>
            </div>
            <button onClick={onClose}
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-muted/60 hover:bg-destructive/10 hover:text-destructive transition-all shrink-0">
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Progress bar */}
          {items.length > 0 && (
            <div className="mt-3">
              <div className="flex justify-between text-[10px] font-bold text-muted-foreground mb-1.5">
                <span>{doneCount}/{items.length} completed</span>
                <span className="text-primary">{pct}%</span>
              </div>
              <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                <div className="h-full bg-gradient-to-r from-primary to-gold rounded-full transition-all duration-500"
                  style={{ width: `${pct}%` }} />
              </div>
            </div>
          )}
        </div>

        {/* Items */}
        <div className="px-6 py-4 space-y-2 max-h-[60vh] overflow-y-auto">
          {isLoading && (
            <div className="space-y-2">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-12 rounded-xl bg-muted animate-pulse" />
              ))}
            </div>
          )}

          {!isLoading && items.length === 0 && (
            <div className="text-center py-8">
              <p className="text-sm text-muted-foreground">No checklist items yet.</p>
              <p className="text-xs text-muted-foreground mt-1">
                Go to the habit detail page to add items.
              </p>
            </div>
          )}

          {items.map(item => (
            <button
              key={item.id}
              onClick={() => toggleItem(item.id)}
              className={cn(
                'w-full flex items-center gap-3 p-3 rounded-2xl text-left transition-all',
                item.completed_today
                  ? 'bg-primary/8 ring-1 ring-primary/20'
                  : 'bg-muted/40 hover:bg-muted/70'
              )}
            >
              {/* Checkbox */}
              <div className={cn(
                'flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border-2 transition-all',
                item.completed_today
                  ? 'bg-primary border-primary text-primary-foreground'
                  : 'border-border hover:border-primary'
              )}>
                {item.completed_today && <Check className="h-3.5 w-3.5" strokeWidth={3} />}
              </div>

              {/* Label */}
              <div className="flex-1 min-w-0">
                <p className={cn('text-sm font-semibold transition-colors',
                  item.completed_today ? 'line-through text-muted-foreground' : 'text-foreground')}>
                  {item.label}
                </p>
                {item.repetition_count > 1 && (
                  <p className="text-[10px] font-bold text-muted-foreground">×{item.repetition_count}</p>
                )}
              </div>

              {/* Arabic */}
              {item.arabic_text && (
                <span className="font-amiri text-lg text-primary/80 shrink-0" dir="rtl">
                  {item.arabic_text}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Footer */}
        {doneCount === items.length && items.length > 0 && (
          <div className="px-6 pb-6 pt-2 text-center">
            <p className="text-sm font-bold text-sage animate-slide-up">
              🤲 Alhamdulillah! All done!
            </p>
          </div>
        )}
        {doneCount < items.length && items.length > 0 && (
          <div className="px-6 pb-6 pt-2">
            <button onClick={onClose}
              className="w-full py-3 rounded-2xl bg-primary/10 text-primary text-sm font-bold hover:bg-primary hover:text-primary-foreground hover:shadow-glow-primary transition-all">
              Done for Now
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
