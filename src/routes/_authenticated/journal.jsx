import { createFileRoute } from '@tanstack/react-router'
import { BookMarked } from 'lucide-react'
import { WipPage } from '@/components/common/WipPage'

export const Route = createFileRoute('/_authenticated/journal')({
  component: () => (
    <WipPage icon={BookMarked} title="Journal" phase="Phase 6"
      description="Mood-aware journal with gratitude tracking and AI reflections." />
  ),
})
