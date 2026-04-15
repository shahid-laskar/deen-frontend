import { createFileRoute } from '@tanstack/react-router'
import { CheckSquare } from 'lucide-react'
import { WipPage } from '@/components/common/WipPage'

export const Route = createFileRoute('/_authenticated/tasks')({
  component: () => (
    <WipPage icon={CheckSquare} title="Planner & Tasks" phase="Phase 6"
      description="Daily planner with priority tasks and category grouping." />
  ),
})
