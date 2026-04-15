import { createFileRoute } from '@tanstack/react-router'
import { Target } from 'lucide-react'
import { WipPage } from '@/components/common/WipPage'

export const Route = createFileRoute('/_authenticated/habits')({
  component: () => (
    <WipPage icon={Target} title="Habits" phase="Phase 6"
      description="Islamic habit tracker with streaks, heatmap, and custom categories." />
  ),
})
