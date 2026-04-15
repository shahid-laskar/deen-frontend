import { createFileRoute } from '@tanstack/react-router'
import { HandHeart } from 'lucide-react'
import { WipPage } from '@/components/common/WipPage'

export const Route = createFileRoute('/_authenticated/waqf')({
  component: () => (
    <WipPage icon={HandHeart} title="Waqf & Sadaqah" phase="Phase 10"
      description="Charitable giving tracker with verified causes and impact reports." />
  ),
})
