import { createFileRoute } from '@tanstack/react-router'
import Gamification from '@/pages/Gamification'

export const Route = createFileRoute('/_authenticated/gamification')({
  component: Gamification,
})
