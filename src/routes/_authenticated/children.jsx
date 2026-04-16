import { createFileRoute } from '@tanstack/react-router'
import Children from '@/pages/Children'

export const Route = createFileRoute('/_authenticated/children')({
  component: Children,
})
