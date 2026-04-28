import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/_authenticated/grow/')({
  beforeLoad: () => {
    throw redirect({ to: '/grow/habits' })
  },
})
