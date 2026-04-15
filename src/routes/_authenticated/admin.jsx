import { createFileRoute } from '@tanstack/react-router'
import { Shield } from 'lucide-react'
import { WipPage } from '@/components/common/WipPage'

export const Route = createFileRoute('/_authenticated/admin')({
  component: () => (
    <WipPage icon={Shield} title="Admin Panel" phase="Phase 10"
      description="User moderation, content management, GDPR tools, and analytics." />
  ),
})
