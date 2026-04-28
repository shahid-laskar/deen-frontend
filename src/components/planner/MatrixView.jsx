import React from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { tasksApi } from '@/lib/api'
import { TaskCard } from '@/components/planner/TaskCard'
import { cn } from '@/lib/utils'
import toast from 'react-hot-toast'

// Derive urgency/importance from priority when the explicit flags aren't set.
// This prevents all tasks falling into ELIMINATE by default.
function effectiveUrgent(t) {
  if (t.is_urgent) return true
  // explicit false on both flags AND priority signals urgency
  return t.priority === 'urgent'
}

function effectiveImportant(t) {
  if (t.is_important) return true
  // treat urgent + high as important by default
  return t.priority === 'urgent' || t.priority === 'high'
}

const QUADRANTS = [
  {
    id: 'do',
    label: 'DO',
    desc: 'Urgent + Important',
    ayah: 'وَالْعَصْرِ',
    ayahTrans: '"By time, mankind is in loss" (103:1)',
    bg: 'bg-red-500/8 dark:bg-red-900/20',
    border: 'border-red-500/30',
    header: 'text-red-600 dark:text-red-400',
    dot: 'bg-red-500',
    filter: t => effectiveUrgent(t) && effectiveImportant(t),
    patch: { is_urgent: true, is_important: true },
  },
  {
    id: 'schedule',
    label: 'SCHEDULE',
    desc: 'Not Urgent + Important',
    ayah: 'وَهُوَ الَّذِي جَعَلَ اللَّيْلَ وَالنَّهَارَ',
    ayahTrans: '"He made night and day" (25:62)',
    bg: 'bg-blue-500/8 dark:bg-blue-900/20',
    border: 'border-blue-500/30',
    header: 'text-blue-600 dark:text-blue-400',
    dot: 'bg-blue-500',
    filter: t => !effectiveUrgent(t) && effectiveImportant(t),
    patch: { is_urgent: false, is_important: true },
  },
  {
    id: 'delegate',
    label: 'DELEGATE',
    desc: 'Urgent + Not Important',
    ayah: 'تَعَاوَنُوا عَلَى الْبِرِّ',
    ayahTrans: '"Help one another in righteousness"',
    bg: 'bg-amber-500/8 dark:bg-amber-900/20',
    border: 'border-amber-500/30',
    header: 'text-amber-600 dark:text-amber-400',
    dot: 'bg-amber-500',
    filter: t => effectiveUrgent(t) && !effectiveImportant(t),
    patch: { is_urgent: true, is_important: false },
  },
  {
    id: 'eliminate',
    label: 'ELIMINATE',
    desc: 'Not Urgent + Not Important',
    ayah: 'اجْتَنِبُوا كَثِيرًا مِّنَ الظَّنِّ',
    ayahTrans: '"Avoid much vain talk" (49:12)',
    bg: 'bg-zinc-500/5 dark:bg-zinc-800/40',
    border: 'border-zinc-300/40 dark:border-zinc-700/40',
    header: 'text-zinc-500 dark:text-zinc-400',
    dot: 'bg-zinc-400',
    filter: t => !effectiveUrgent(t) && !effectiveImportant(t),
    patch: { is_urgent: false, is_important: false },
  },
]

export function MatrixView({ allTasks, onComplete, onEdit, onDelete, onDefer }) {
  const qc = useQueryClient()
  const tasks = allTasks.filter(t => !t.completed && !t.parent_task_id)

  const { mutate: moveToQuadrant } = useMutation({
    mutationFn: ({ id, patch }) => tasksApi.update(id, patch),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tasks'] }),
    onError: () => toast.error('Could not move task'),
  })

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-bold">Eisenhower Matrix</h2>
        <p className="text-xs text-muted-foreground mt-0.5">Sort tasks by urgency × importance</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {QUADRANTS.map(q => {
          const qTasks = tasks.filter(q.filter)
          return (
            <div key={q.id} className={cn('rounded-2xl border p-4 min-h-[180px]', q.bg, q.border)}>
              <div className="mb-3">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className={cn('h-2.5 w-2.5 rounded-full shrink-0', q.dot)} />
                  <p className={cn('font-black text-sm tracking-wider', q.header)}>{q.label}</p>
                  <span className="ml-auto text-[11px] text-muted-foreground bg-background/60 px-2 py-0.5 rounded-full">{qTasks.length}</span>
                </div>
                <p className="text-[10px] text-muted-foreground uppercase tracking-widest">{q.desc}</p>
                <p className="font-amiri text-xs text-muted-foreground/70 mt-1">{q.ayah}</p>
                <p className="text-[10px] text-muted-foreground/50 italic">{q.ayahTrans}</p>
              </div>

              <div className="space-y-2">
                {qTasks.length === 0 ? (
                  <p className="text-xs text-muted-foreground/40 italic text-center py-4">No tasks</p>
                ) : (
                  qTasks.map(task => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      allTasks={allTasks}
                      onComplete={onComplete}
                      onEdit={onEdit}
                      onDelete={onDelete}
                      onDefer={onDefer}
                      showBlock={false}
                    />
                  ))
                )}
              </div>

              {/* Move to quadrant hints */}
              <div className="mt-3 flex flex-wrap gap-1">
                {QUADRANTS.filter(other => other.id !== q.id).map(other => (
                  <button
                    key={other.id}
                    onClick={() => {
                      if (qTasks.length === 0) return
                      // For now moves first selected — in full impl would use drag
                      toast('Select a task and use Edit to change urgency/importance', { icon: 'ℹ️' })
                    }}
                    className="text-[9px] font-bold uppercase text-muted-foreground/40 hover:text-muted-foreground px-1.5 py-0.5 rounded border border-transparent hover:border-border transition-all"
                  >
                    → {other.label}
                  </button>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
