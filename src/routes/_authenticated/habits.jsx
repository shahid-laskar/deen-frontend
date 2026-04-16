import { createFileRoute } from '@tanstack/react-router'
import Habits from '@/pages/Habits'

export const Route = createFileRoute('/_authenticated/habits')({
  component: Habits,
})
