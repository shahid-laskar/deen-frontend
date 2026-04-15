import { createFileRoute } from '@tanstack/react-router'
import { Heart } from 'lucide-react'
import { WipPage } from '@/components/common/WipPage'

export const Route = createFileRoute('/_authenticated/female')({
  component: () => (
    <WipPage icon={Heart} title="Sister's Space" phase="Phase 9"
      description="Cycle tracking, missed prayer/fast management, and Islamic guidance for sisters." />
  ),
})
