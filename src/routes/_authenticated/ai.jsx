import { createFileRoute } from '@tanstack/react-router'
import AIGuide from '@/pages/AIGuide'

export const Route = createFileRoute('/_authenticated/ai')({
  component: AIGuide,
})
