import React, { useState } from 'react'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, startOfWeek, endOfWeek, isSameMonth, isToday, addMonths, subMonths } from 'date-fns'
import { ChevronLeft, ChevronRight, X } from 'lucide-react'
import { gregorianToHijri, formatHijri } from '@/lib/hijri'
import { TaskCard } from '@/components/planner/TaskCard'
import { BLOCK_META } from '@/lib/planner/prayer-blocks'
import { categoryDot } from '@/lib/planner/category'
import { cn } from '@/lib/utils'

function DayDrawer({ date, tasks, allTasks, onComplete, onEdit, onDelete, onDefer, onClose }) {
  const dateStr = format(date, 'yyyy-MM-dd')
  const dayTasks = tasks.filter(t => t.due_date === dateStr && !t.parent_task_id)
  const hijri = gregorianToHijri(date)
  const totalMin = dayTasks.reduce((s, t) => s + (t.estimated_minutes || 0), 0)

  const grouped = {}
  dayTasks.forEach(t => {
    const key = t.time_block || 'unscheduled'
    if (!grouped[key]) grouped[key] = []
    grouped[key].push(t)
  })

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full sm:max-w-md h-full bg-background border-l border-border shadow-2xl overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-border/50 sticky top-0 bg-background/95 backdrop-blur-sm">
          <div>
            <p className="font-bold text-foreground">{format(date, 'EEEE, MMMM d')}</p>
            <p className="font-amiri text-sm text-amber-500">{formatHijri(hijri)}</p>
            {totalMin > 0 && <p className="text-xs text-muted-foreground mt-0.5">{totalMin}m planned</p>}
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-muted"><X className="h-4 w-4" /></button>
        </div>

        <div className="p-4 space-y-4">
          {dayTasks.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              <p className="text-4xl mb-3">📅</p>
              <p className="text-sm">No tasks scheduled</p>
            </div>
          ) : (
            <>
              {/* Unscheduled */}
              {grouped.unscheduled?.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Unscheduled</p>
                  {grouped.unscheduled.map(t => (
                    <TaskCard key={t.id} task={t} allTasks={allTasks}
                      onComplete={onComplete} onEdit={onEdit} onDelete={onDelete} onDefer={onDefer}
                      showBlock={false} />
                  ))}
                </div>
              )}
              {/* Grouped by block */}
              {BLOCK_META.filter(b => grouped[b.key]?.length > 0).map(b => (
                <div key={b.key} className="space-y-2">
                  <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{b.label}</p>
                  {grouped[b.key].map(t => (
                    <TaskCard key={t.id} task={t} allTasks={allTasks}
                      onComplete={onComplete} onEdit={onEdit} onDelete={onDelete} onDefer={onDefer}
                      showBlock={false} />
                  ))}
                </div>
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export function CalendarView({ allTasks, onComplete, onEdit, onDelete, onDefer }) {
  const [month, setMonth] = useState(new Date())
  const [selectedDay, setSelectedDay] = useState(null)

  const monthStart = startOfMonth(month)
  const monthEnd   = endOfMonth(month)
  const calStart   = startOfWeek(monthStart, { weekStartsOn: 0 })
  const calEnd     = endOfWeek(monthEnd,     { weekStartsOn: 0 })
  const days       = eachDayOfInterval({ start: calStart, end: calEnd })

  const tasksByDate = {}
  allTasks.forEach(t => {
    if (!t.due_date) return
    if (!tasksByDate[t.due_date]) tasksByDate[t.due_date] = []
    tasksByDate[t.due_date].push(t)
  })

  return (
    <div className="space-y-4">
      {/* Month nav */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold">{format(month, 'MMMM yyyy')}</h2>
        <div className="flex items-center gap-1">
          <button onClick={() => setMonth(m => subMonths(m, 1))} className="p-2 rounded-lg hover:bg-muted"><ChevronLeft className="h-4 w-4" /></button>
          <button onClick={() => setMonth(new Date())} className="px-3 py-1.5 text-xs font-bold rounded-lg hover:bg-muted text-muted-foreground">Today</button>
          <button onClick={() => setMonth(m => addMonths(m, 1))} className="p-2 rounded-lg hover:bg-muted"><ChevronRight className="h-4 w-4" /></button>
        </div>
      </div>

      {/* Day-of-week headers */}
      <div className="grid grid-cols-7 text-center">
        {['Su','Mo','Tu','We','Th','Fr','Sa'].map(d => (
          <div key={d} className={cn('text-[11px] font-bold uppercase tracking-wider py-2 text-muted-foreground', d === 'Fr' && 'text-emerald-600 dark:text-emerald-400')}>{d}</div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-px bg-border/30 rounded-2xl overflow-hidden border border-border/30">
        {days.map(day => {
          const dateStr = format(day, 'yyyy-MM-dd')
          const dayTasks = tasksByDate[dateStr] || []
          const hijri = gregorianToHijri(day)
          const isCurrentMonth = isSameMonth(day, month)
          const isT = isToday(day)
          const isFri = day.getDay() === 5
          const cats = [...new Set(dayTasks.map(t => t.category).filter(Boolean))].slice(0, 3)

          return (
            <button
              key={dateStr}
              onClick={() => setSelectedDay(day)}
              className={cn(
                'relative min-h-[70px] p-1.5 text-left bg-background transition-colors hover:bg-muted/60',
                !isCurrentMonth && 'opacity-35',
                isFri && isCurrentMonth && 'border-l-2 border-emerald-500/40',
              )}
            >
              {/* Day number */}
              <div className="flex items-start justify-between mb-1">
                <span className={cn(
                  'h-6 w-6 flex items-center justify-center rounded-full text-xs font-bold',
                  isT && 'bg-primary text-primary-foreground',
                  !isT && 'text-foreground/80',
                )}>
                  {format(day, 'd')}
                </span>
              </div>

              {/* Category pips */}
              {cats.length > 0 && (
                <div className="flex gap-0.5 flex-wrap">
                  {cats.map(cat => (
                    <span key={cat} className={cn('h-1.5 w-1.5 rounded-full', categoryDot(cat))} />
                  ))}
                  {dayTasks.length > 3 && (
                    <span className="text-[9px] text-muted-foreground font-bold">+{dayTasks.length - 3}</span>
                  )}
                </div>
              )}

              {/* Hijri date — bottom right */}
              <span className="absolute bottom-1 right-1.5 font-amiri text-[9px] text-muted-foreground/50 leading-none">
                {hijri.day}
              </span>
            </button>
          )
        })}
      </div>

      {/* Day drawer */}
      {selectedDay && (
        <DayDrawer
          date={selectedDay}
          tasks={allTasks}
          allTasks={allTasks}
          onComplete={onComplete}
          onEdit={onEdit}
          onDelete={onDelete}
          onDefer={onDefer}
          onClose={() => setSelectedDay(null)}
        />
      )}
    </div>
  )
}
