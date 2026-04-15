import { createFileRoute } from '@tanstack/react-router'
import { Compass } from 'lucide-react'
import { WipPage } from '@/components/common/WipPage'

export const Route = createFileRoute('/_authenticated/qibla')({
  component: () => (
    <WipPage icon={Compass} title="Qibla & Mosques" phase="Phase 7"
      description="Live Qibla compass with nearby mosque finder." />
  ),
})
