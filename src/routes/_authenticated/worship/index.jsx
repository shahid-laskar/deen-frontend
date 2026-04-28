import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/_authenticated/worship/')({
  beforeLoad: () => {
    throw redirect({ to: '/worship/prayer' })
  },
})
