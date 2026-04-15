import { createFileRoute } from '@tanstack/react-router'
import { Settings } from 'lucide-react'
import { WipPage } from '@/components/common/WipPage'

export const Route = createFileRoute('/_authenticated/settings')({
  component: () => (
    <WipPage icon={Settings} title="Settings" phase="Phase 7"
      description="Profile, notification preferences, theme, font, and privacy controls." />
  ),
})
