import { createFileRoute } from '@tanstack/react-router'
import Female from '@/pages/Female'

export const Route = createFileRoute('/_authenticated/female')({
  component: Female,
})
