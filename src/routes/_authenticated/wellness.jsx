import { createFileRoute } from '@tanstack/react-router'
import Wellness from '@/pages/Wellness'

export const Route = createFileRoute('/_authenticated/wellness')({
  component: Wellness,
})
