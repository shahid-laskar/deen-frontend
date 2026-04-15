import { createFileRoute } from '@tanstack/react-router'
import { LayoutDashboard } from 'lucide-react'
import { WipPage } from '@/components/common/WipPage'

export const Route = createFileRoute('/_authenticated/dashboard')({
  component: () => (
    <WipPage icon={LayoutDashboard} title="Dashboard" phase="Phase 4"
      description="Full dashboard with Prayer Hero, Daily Verse, Habits summary, and Quick Actions." />
  ),
})
