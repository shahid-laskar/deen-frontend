import { createFileRoute } from '@tanstack/react-router'
import { Crown } from 'lucide-react'
import { WipPage } from '@/components/common/WipPage'

export const Route = createFileRoute('/_authenticated/subscription')({
  component: () => (
    <WipPage icon={Crown} title="Plans & Subscription" phase="Phase 10"
      description="Free and premium plans with feature comparison and payment management." />
  ),
})
