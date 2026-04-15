import { createFileRoute } from '@tanstack/react-router'
import { Users } from 'lucide-react'
import { WipPage } from '@/components/common/WipPage'

export const Route = createFileRoute('/_authenticated/community')({
  component: () => (
    <WipPage icon={Users} title="Community" phase="Phase 8"
      description="Feed, posts, comments, and moderated Islamic community channels." />
  ),
})
