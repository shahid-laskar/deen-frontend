import { createFileRoute } from '@tanstack/react-router'
import { Sparkles } from 'lucide-react'
import { WipPage } from '@/components/common/WipPage'

export const Route = createFileRoute('/_authenticated/ai')({
  component: () => (
    <WipPage icon={Sparkles} title="AI Guide" phase="Phase 7"
      description="Islamic AI assistant for fatawa, tafsir explanations, and personal guidance." />
  ),
})
