import { createFileRoute } from '@tanstack/react-router'
import Family from '@/pages/Family'

export const Route = createFileRoute('/_authenticated/family')({
  component: Family,
})
