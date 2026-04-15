import { createFileRoute } from '@tanstack/react-router'
import { Dumbbell } from 'lucide-react'
import { WipPage } from '@/components/common/WipPage'

export const Route = createFileRoute('/_authenticated/workout')({
  component: () => (
    <WipPage icon={Dumbbell} title="Workout" phase="Phase 10"
      description="Exercise planner with Islamic-conscious workout routines." />
  ),
})
