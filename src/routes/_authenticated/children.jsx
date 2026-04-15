import { createFileRoute } from '@tanstack/react-router'
import { Baby } from 'lucide-react'
import { WipPage } from '@/components/common/WipPage'

export const Route = createFileRoute('/_authenticated/children')({
  component: () => (
    <WipPage icon={Baby} title="Child Upbringing" phase="Phase 9"
      description="Islamic parenting tools, child profiles, and activity tracking." />
  ),
})
