import { createFileRoute } from '@tanstack/react-router'
import Waqf from '@/pages/Waqf'

export const Route = createFileRoute('/_authenticated/waqf')({
  component: Waqf,
})
