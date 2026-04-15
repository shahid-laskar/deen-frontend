import { createFileRoute } from '@tanstack/react-router'
import { BookOpen } from 'lucide-react'
import { WipPage } from '@/components/common/WipPage'

export const Route = createFileRoute('/_authenticated/quran')({
  component: () => (
    <WipPage icon={BookOpen} title="Quran & Hifz" phase="Phase 5"
      description="Quran reader with tafsir, grammar, audio, bookmarks, hifz tracker, and duas." />
  ),
})
