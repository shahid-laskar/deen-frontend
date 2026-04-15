import { createFileRoute } from '@tanstack/react-router'
import { DollarSign } from 'lucide-react'
import { WipPage } from '@/components/common/WipPage'

export const Route = createFileRoute('/_authenticated/finance')({
  component: () => (
    <WipPage icon={DollarSign} title="Islamic Finance" phase="Phase 9"
      description="Zakat calculator, halal investment tracker, and financial planning." />
  ),
})
