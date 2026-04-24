import React from 'react'
import { Check, Plus, ChevronRight, MoreVertical } from 'lucide-react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { habitsApi } from '@/lib/api'
import { Link } from '@tanstack/react-router'
import { StreakFlame } from './StreakFlame'
import { CompletionRing } from './CompletionRing'
import { AnchorPrayerPill } from './AnchorPrayerPill'

const todayISO = () => new Date().toISOString().split('T')[0]

export function HabitCard({ habit }) {
  const qc = useQueryClient()
  const type = habit.habit_type ?? 'BINARY'
  const target = habit.target_count ?? 1
  const count = habit.today_count ?? 0
  const done = habit.today_completed ?? count >= target

  const log = useMutation({
    mutationFn: (payload) =>
      habitsApi.log({
        habit_id: habit.id,
        log_date: todayISO(),
        count: payload.count,
        completed: payload.completed,
      }),
    onMutate: async (payload) => {
      await qc.cancelQueries({ queryKey: ['habits'] })
      const prev = qc.getQueryData(['habits'])
      qc.setQueryData(['habits'], (old) =>
        (old ?? []).map((h) =>
          h.id === habit.id
            ? {
                ...h,
                today_count: payload.count ?? (h.today_count ?? 0) + 1,
                today_completed: payload.completed,
              }
            : h
        )
      )
      return { prev }
    },
    onError: (_e, _v, ctx) => ctx?.prev && qc.setQueryData(['habits'], ctx.prev),
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ['habits'] })
      qc.invalidateQueries({ queryKey: ['habits', 'weekly'] })
      qc.invalidateQueries({ queryKey: ['habits', 'health'] })
    },
  })

  function onPrimaryTap() {
    if (type === 'BINARY' || type === 'AVOID') {
      log.mutate({ completed: !done, count: !done ? 1 : 0 })
    } else if (type === 'QUANTITY' || type === 'DURATION') {
      const next = count + 1
      log.mutate({ count: next, completed: next >= target })
    }
  }

  const ringSize = 56

  return (
    <div
      className={`group relative overflow-hidden rounded-2xl glass-card shadow-soft hover:shadow-elevated card-hover p-4 ${
        done ? 'ring-1 ring-primary/30' : ''
      }`}
    >
      {done && (
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-primary/8 to-transparent" />
      )}
      <div className="relative flex items-center gap-3">
        <button
          onClick={onPrimaryTap}
          disabled={log.isPending}
          className={`group/btn relative flex shrink-0 items-center justify-center transition-all active:scale-95 ${
            type === 'CHECKLIST' ? 'h-12 w-12' : ''
          }`}
          aria-label={done ? 'Completed' : 'Mark complete'}
        >
          {type === 'BINARY' || type === 'AVOID' ? (
            <div
              className={`flex h-12 w-12 items-center justify-center rounded-2xl transition-all ${
                done
                  ? 'bg-primary text-primary-foreground shadow-glow-primary'
                  : 'bg-primary/10 text-primary hover:bg-primary/20'
              }`}
            >
              <Check className="h-5 w-5" strokeWidth={2.5} />
            </div>
          ) : type === 'QUANTITY' || type === 'DURATION' ? (
            <CompletionRing value={count} target={target} size={ringSize}>
              <Plus className="h-4 w-4 text-primary" strokeWidth={2.5} />
            </CompletionRing>
          ) : (
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-muted/40 text-muted-foreground">
              <ChevronRight className="h-5 w-5" />
            </div>
          )}
        </button>

        <Link
          to="/habits/$id"
          params={{ id: habit.id }}
          className="flex-1 min-w-0 -my-2 py-2"
        >
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-bold truncate">{habit.name}</h3>
            {(habit.current_streak ?? 0) > 0 && <StreakFlame streak={habit.current_streak ?? 0} />}
            <AnchorPrayerPill prayer={habit.anchor_prayer} />
          </div>
          <div className="flex items-center gap-2 mt-1">
            {habit.category && (
              <span className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground">
                {habit.category}
              </span>
            )}
            {(type === 'QUANTITY' || type === 'DURATION') && (
              <span className="text-xs text-muted-foreground tabular-nums">
                {count} / {target} {habit.target_unit ?? ''}
              </span>
            )}
            {habit.islamic_source && (
              <span className="text-xs text-muted-foreground italic truncate">
                {habit.islamic_source}
              </span>
            )}
          </div>
        </Link>

        <Link
          to="/habits/$id"
          params={{ id: habit.id }}
          className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-all"
          aria-label="Open"
        >
          <MoreVertical className="h-4 w-4" />
        </Link>
      </div>
    </div>
  )
}
