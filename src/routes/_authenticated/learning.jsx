import { createFileRoute } from '@tanstack/react-router'
import { BookOpen } from 'lucide-react'
import { WipPage } from '@/components/common/WipPage'

export const Route = createFileRoute('/_authenticated/learning')({
  component: () => (
    <WipPage icon={BookOpen} title="Learning Hub" phase="Phase 8"
      description="Structured Islamic courses, quizzes, and certificates." />
  ),
})
