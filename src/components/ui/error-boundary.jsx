import React from 'react'
import { useRouter } from '@tanstack/react-router'
import { Icon } from './icon'
import { Button } from './button'

export function GlobalErrorBoundary({ error, reset }) {
  const router = useRouter()
  
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] p-6 text-center animate-fade-in">
      <div className="w-16 h-16 rounded-2xl bg-red-500/10 flex items-center justify-center mb-6">
        <Icon name="alert-triangle" size={32} className="text-red-500" />
      </div>
      <h2 className="text-xl font-bold mb-2">Something went wrong</h2>
      <p className="text-sm text-muted-foreground max-w-md mb-6">
        {error?.message || "An unexpected error occurred. Please try again."}
      </p>
      <div className="flex items-center gap-3">
        <Button onClick={() => {
          if (reset) reset()
          router.invalidate()
        }}>
          Try Again
        </Button>
      </div>
    </div>
  )
}
