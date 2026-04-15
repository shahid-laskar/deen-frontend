import { createFileRoute } from '@tanstack/react-router'
import { Clock } from 'lucide-react'
import { WipPage } from '@/components/common/WipPage'

export const Route = createFileRoute('/_authenticated/prayer')({
  component: () => (
    <WipPage icon={Clock} title="Prayer Times" phase="Phase 5"
      description="Full prayer tracker with logs, heatmap, mosque finder, and travel mode." />
  ),
})
