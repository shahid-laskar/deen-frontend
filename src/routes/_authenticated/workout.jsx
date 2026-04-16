import { createFileRoute } from '@tanstack/react-router'
import Workout from '@/pages/Workout'

export const Route = createFileRoute('/_authenticated/workout')({
  component: Workout,
})
