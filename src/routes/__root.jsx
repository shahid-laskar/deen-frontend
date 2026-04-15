import React, { useEffect } from 'react'
import { createRootRoute, Outlet } from '@tanstack/react-router'
import { useThemeStore } from '@/store/themeStore'

export const Route = createRootRoute({
  component: RootLayout,
})

function RootLayout() {
  const { applyToDOM } = useThemeStore()

  useEffect(() => {
    applyToDOM()
  }, [])

  return <Outlet />
}
