import { createFileRoute, redirect } from '@tanstack/react-router'
import { useAuthStore } from '@/store/authStore'

export const Route = createFileRoute('/')({
  beforeLoad: () => {
    const { isAuthenticated, user } = useAuthStore.getState()
    if (!isAuthenticated) {
      throw redirect({ to: '/login' })
    }
    if (!user?.onboarding_completed) {
      throw redirect({ to: '/onboarding' })
    }
    throw redirect({ to: '/dashboard' })
  },
})
