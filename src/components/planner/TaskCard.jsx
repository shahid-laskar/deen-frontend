import React, { useState } from 'react'
import { Check, GripVertical, Moon, ChevronDown, ChevronRight, MoreVertical, Clock, AlertTriangle, Star, Trash2, Edit2, MoveRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { CATEGORY_META, categoryBg } from '@/lib/planner/category'

const PRIORITY_BORDER = {
  urgent: 'border-l-red-500',
  high:   'border-l-orange-500',
  medium: 'border-l-blue-500',
  low:    'border-l-zinc-300 dark:border-l-zinc-600',
}

const PRIORITY_LABEL = { urgent: 'P1', high: 'P2', medium: 'P3', low: 'P4' }
const PRIORITY_PILL_CLS = {
  urgent: 'bg-red-500/15 text-red-700 dark:text-red-300',
  high:   'bg-orange-500/15 text-orange-700 dark:text-orange-300',
  medium: 'bg-blue-500/15 text-blue-700 dark:text-blue-300',
  low:    'bg-zinc-200 text-zinc-600 dark:bg-zinc-700 dark:text-zinc-400',
}

export function CategoryChip({ category, variant = 'full', className }) {
  const meta = CATEGORY_META[category]
  if (!meta) return null
  return (
    <span className={cn('inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full', categoryBg(category), className)}>
      {variant === 'full' && meta.label}
    </span>
  )
}

export function PriorityPill({ priority, className }) {
  if (!priority) return null
  return (
    <span className={cn('inline-flex items-center text-[10px] font-bold px-1.5 py-0.5 rounded', PRIORITY_PILL_CLS[priority], className)}>
      {PRIORITY_LABEL[priority]}
    </span>
  )
}

export function TaskCard({ task, onComplete, onEdit, onDelete, onDefer, isDragging, showBlock, allTasks = [], onCreateSub, dragHandleProps }) {
  const [expanded, setExpanded] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  const children = allTasks.filter(t => t.parent_task_id === task.id)
  const hasChildren = children.length > 0
  const doneChildren = children.filter(t => t.completed).length

  const isIndented = !!task.parent_task_id

  return (
    <div className={cn(
      'group relative flex flex-col border-l-4 rounded-r-xl bg-card border border-border/60 transition-all',
      PRIORITY_BORDER[task.priority] ?? 'border-l-zinc-300',
      task.completed && 'opacity-50',
      isDragging && 'shadow-2xl rotate-1 scale-105',
      isIndented && 'ml-6',
    )}>
      <div className="flex items-center gap-2 px-3 py-2.5">
        {/* Drag handle */}
        {!isIndented && (
          <button
            {...(dragHandleProps || {})}
            className="h-8 w-5 flex items-center justify-center text-muted-foreground/30 shrink-0 opacity-0 group-hover:opacity-100 cursor-grab active:cursor-grabbing touch-none"
            aria-label="Drag to reorder"
          >
            <GripVertical className="h-4 w-4" />
          </button>
        )}

        {/* Checkbox */}
        <button
          onClick={() => onComplete(task.id)}
          className={cn(
            'w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all',
            task.completed
              ? 'bg-emerald-500 border-emerald-500 text-white'
              : 'border-muted-foreground/40 hover:border-primary'
          )}
        >
          {task.completed && <Check className="h-3 w-3" />}
        </button>

        {/* Title + niyyah */}
        <button onClick={() => onEdit(task.id)} className="flex-1 min-w-0 text-left">
          <p className={cn('text-sm font-medium truncate', task.completed && 'line-through text-muted-foreground')}>
            {task.title}
          </p>
        </button>

        {/* Islamic context icon */}
        {task.islamic_context && (
          <span title={task.islamic_context} className="text-amber-500 shrink-0">
            <Moon className="h-3 w-3" />
          </span>
        )}

        {/* Expand if has children */}
        {hasChildren && (
          <button onClick={() => setExpanded(e => !e)} className="text-muted-foreground hover:text-foreground">
            {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </button>
        )}

        {/* Context menu */}
        <div className="relative">
          <button
            onClick={() => setMenuOpen(m => !m)}
            className="opacity-0 group-hover:opacity-100 p-1 rounded text-muted-foreground hover:text-foreground"
          >
            <MoreVertical className="h-3.5 w-3.5" />
          </button>
          {menuOpen && (
            <div
              className="absolute right-0 top-6 z-50 w-36 rounded-xl bg-popover border border-border shadow-elevated py-1"
              onMouseLeave={() => setMenuOpen(false)}
            >
              {[
                { icon: Edit2, label: 'Edit', action: () => { onEdit(task.id); setMenuOpen(false) } },
                { icon: Check, label: 'Complete', action: () => { onComplete(task.id); setMenuOpen(false) } },
                { icon: MoveRight, label: 'Defer', action: () => { onDefer(task.id); setMenuOpen(false) } },
                { icon: Trash2, label: 'Delete', action: () => { onDelete(task.id); setMenuOpen(false) }, cls: 'text-destructive' },
              ].map(item => (
                <button
                  key={item.label}
                  onClick={item.action}
                  className={cn('flex items-center gap-2 w-full px-3 py-1.5 text-xs font-medium hover:bg-muted transition-colors', item.cls)}
                >
                  <item.icon className="h-3 w-3" /> {item.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Meta chips */}
      <div className="flex flex-wrap items-center gap-1.5 px-10 pb-2">
        {task.category && <CategoryChip category={task.category} />}
        {task.priority && <PriorityPill priority={task.priority} />}
        {task.estimated_minutes > 0 && (
          <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground">
            <Clock className="h-3 w-3" />{task.estimated_minutes}m
          </span>
        )}
        {showBlock && task.time_block && (
          <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
            {task.time_block.replace(/_/g, ' ')}
          </span>
        )}
        {task.is_urgent && (
          <span className="text-[10px] text-red-600 dark:text-red-400 flex items-center gap-0.5">
            <AlertTriangle className="h-3 w-3" />Urgent
          </span>
        )}
        {task.is_important && (
          <span className="text-[10px] text-amber-600 dark:text-amber-400 flex items-center gap-0.5">
            <Star className="h-3 w-3" />Important
          </span>
        )}
        {hasChildren && (
          <span className="text-[10px] text-muted-foreground">{doneChildren}/{children.length} sub-tasks</span>
        )}
      </div>

      {/* Sub-task list */}
      {expanded && hasChildren && (
        <div className="px-4 pb-3 space-y-1.5 border-t border-border/30 pt-2">
          {children.map(child => (
            <TaskCard
              key={child.id}
              task={child}
              onComplete={onComplete}
              onEdit={onEdit}
              onDelete={onDelete}
              onDefer={onDefer}
              allTasks={allTasks}
              showBlock={false}
            />
          ))}
          {onCreateSub && (
            <button
              onClick={() => onCreateSub(task.id)}
              className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1 mt-1"
            >
              + Add sub-task
            </button>
          )}
        </div>
      )}
    </div>
  )
}
