import React from 'react'
import { Plus } from 'lucide-react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { habitsApi } from '@/lib/api'

export function LibraryCard({ item }) {
  const qc = useQueryClient()
  const add = useMutation({
    mutationFn: () => habitsApi.addFromLibrary(item.key),
    onSuccess: () => {
      toast.success(`Added "${item.name}"`)
      qc.invalidateQueries({ queryKey: ['habits'] })
    },
    onError: () => toast.error('Could not add habit'),
  })

  const diffColor =
    item.difficulty === 'EASY'
      ? 'bg-sage/30 text-sage-foreground'
      : item.difficulty === 'MEDIUM'
        ? 'bg-gold/30 text-gold-foreground'
        : 'bg-warm/30 text-warm-foreground'

  return (
    <div className="rounded-2xl glass-card shadow-soft hover:shadow-elevated card-hover p-5 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-bold">{item.name}</h3>
            <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${diffColor}`}>
              {item.difficulty}
            </span>
          </div>
          {item.description && (
            <p className="text-xs text-muted-foreground mt-1">{item.description}</p>
          )}
        </div>
      </div>

      {item.arabic_source && (
        <p className="font-amiri text-base text-primary/80 leading-relaxed">{item.arabic_source}</p>
      )}
      {item.islamic_source && (
        <p className="text-xs italic text-muted-foreground">"{item.islamic_source}"</p>
      )}

      <div className="flex items-center justify-between gap-2 pt-1">
        <div className="flex items-center gap-2 text-[10px] uppercase tracking-wider font-bold text-muted-foreground">
          <span>{item.category}</span>
          {item.target_count && <span>· {item.target_count} {item.target_unit ?? ''}</span>}
          {item.estimated_minutes && <span>· {item.estimated_minutes}m</span>}
        </div>
        <button
          onClick={() => add.mutate()}
          disabled={add.isPending}
          className="flex items-center gap-1 rounded-xl bg-primary text-primary-foreground px-3 py-1.5 text-xs font-bold shadow-glow-primary hover:opacity-90 transition-all"
        >
          <Plus className="h-3 w-3" />
          Add
        </button>
      </div>
    </div>
  )
}
