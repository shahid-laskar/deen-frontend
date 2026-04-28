import React from 'react'
import { format, parseISO, isToday, isPast, isFuture } from 'date-fns'
import { ListTodo, AlertCircle } from 'lucide-react'
import { gregorianToHijri, formatHijri } from '@/lib/hijri'
import { TaskCard } from '@/components/planner/TaskCard'
import { cn } from '@/lib/utils'

const TODAY = new Date().toISOString().slice(0, 10)

export function UpcomingView({ allTasks, onComplete, onEdit, onDelete, onDefer }) {
  const upcoming = allTasks
    .filter(t => t.due_date && !t.completed && !t.parent_task_id)
    .sort((a, b) => a.due_date.localeCompare(b.due_date))

  const overdue = upcoming.filter(t => t.due_date < TODAY)
  const future  = upcoming.filter(t => t.due_date >= TODAY)

  // Group future by due_date
  const groups = {}
  future.forEach(t => {
    if (!groups[t.due_date]) groups[t.due_date] = []
    groups[t.due_date].push(t)
  })

  const totalMin = (tasks) => tasks.reduce((s, t) => s + (t.estimated_minutes || 0), 0)

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <ListTodo className="h-5 w-5" />
        <h2 className="text-lg font-bold">Upcoming</h2>
        <span className="text-sm text-muted-foreground">({upcoming.length} tasks)</span>
      </div>

      {overdue.length > 0 && (
        <details className="group" open>
          <summary className="flex items-center gap-2 cursor-pointer list-none rounded-xl px-3 py-2 bg-red-500/10 border border-red-500/20">
            <AlertCircle className="h-4 w-4 text-red-500" />
            <span className="font-bold text-sm text-red-600 dark:text-red-400">Overdue</span>
            <span className="ml-auto text-xs text-red-500 bg-red-500/20 px-2 py-0.5 rounded-full font-bold">{overdue.length}</span>
          </summary>
          <div className="mt-2 space-y-2">
            {overdue.map(task => (
              <TaskCard
                key={task.id} task={task} allTasks={allTasks}
                onComplete={onComplete} onEdit={onEdit} onDelete={onDelete} onDefer={onDefer}
                showBlock={true}
              />
            ))}
          </div>
        </details>
      )}

      {Object.keys(groups).length === 0 && overdue.length === 0 && (
        <div className="rounded-3xl border-2 border-dashed border-border/40 p-12 text-center">
          <ListTodo className="h-10 w-10 mx-auto text-muted-foreground/30 mb-3" />
          <p className="font-bold text-foreground">Nothing upcoming</p>
          <p className="text-sm text-muted-foreground mt-1">Schedule tasks from your inbox</p>
        </div>
      )}

      {Object.entries(groups).map(([date, tasks]) => {
        const dateObj = parseISO(date)
        const hijri = gregorianToHijri(dateObj)
        const isT = isToday(dateObj)
        const dayTotal = totalMin(tasks)
        const isFri = dateObj.getDay() === 5

        return (
          <div key={date} className="space-y-2">
            <div className={cn(
              'flex items-center gap-3 px-1',
              isFri && 'text-emerald-600 dark:text-emerald-400',
            )}>
              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className={cn('font-bold text-sm', isT && 'text-primary')}>
                    {isT ? 'Today' : format(dateObj, 'EEEE, MMM d')}
                    {isFri && ' 🕌'}
                  </p>
                  <span className="font-amiri text-xs text-muted-foreground">{formatHijri(hijri)}</span>
                  {dayTotal > 0 && <span className="text-xs text-muted-foreground">{dayTotal}m planned</span>}
                </div>
              </div>
              <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">{tasks.length}</span>
            </div>
            <div className="space-y-2">
              {tasks.map(task => (
                <TaskCard
                  key={task.id} task={task} allTasks={allTasks}
                  onComplete={onComplete} onEdit={onEdit} onDelete={onDelete} onDefer={onDefer}
                  showBlock={true}
                />
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}
