import React from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { TaskCard } from './TaskCard'
import { cn } from '@/lib/utils'

export function SortableTaskCard({ task, ...taskCardProps }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: task.id,
    data: {
      type: 'task',
      task,
      timeBlock: task.time_block,
    },
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(isDragging && 'z-50')}
    >
      <TaskCard
        task={task}
        isDragging={isDragging}
        dragHandleProps={{ ...attributes, ...listeners }}
        {...taskCardProps}
      />
    </div>
  )
}
