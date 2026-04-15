import { createFileRoute } from '@tanstack/react-router'
import { Trophy } from 'lucide-react'
import { WipPage } from '@/components/common/WipPage'

export const Route = createFileRoute('/_authenticated/gamification')({
  component: () => (
    <WipPage icon={Trophy} title="Journey & Ranks" phase="Phase 8"
      description="Points, achievements, streaks, and Islamic leaderboard." />
  ),
})
