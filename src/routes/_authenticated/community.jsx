import { createFileRoute } from '@tanstack/react-router'
import Community from '@/pages/Community'

export const Route = createFileRoute('/_authenticated/community')({
  component: Community,
})
