import { createFileRoute } from '@tanstack/react-router'
import { Home } from 'lucide-react'
import { WipPage } from '@/components/common/WipPage'

export const Route = createFileRoute('/_authenticated/family')({
  component: () => (
    <WipPage icon={Home} title="Family & Home" phase="Phase 9"
      description="Family member profiles, shared goals, and home management." />
  ),
})
