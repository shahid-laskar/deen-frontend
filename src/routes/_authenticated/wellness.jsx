import { createFileRoute } from '@tanstack/react-router'
import { Activity } from 'lucide-react'
import { WipPage } from '@/components/common/WipPage'

export const Route = createFileRoute('/_authenticated/wellness')({
  component: () => (
    <WipPage icon={Activity} title="Wellness Hub" phase="Phase 9"
      description="Sleep, fasting, mood tracking and health insights." />
  ),
})
