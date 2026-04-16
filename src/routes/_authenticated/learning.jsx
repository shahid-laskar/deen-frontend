import { createFileRoute } from '@tanstack/react-router'
import Learning from '@/pages/Learning'

export const Route = createFileRoute('/_authenticated/learning')({
  component: Learning,
})
