import { createFileRoute } from '@tanstack/react-router'
import Meal from '@/pages/Meal'

export const Route = createFileRoute('/_authenticated/meal')({
  component: Meal,
})
