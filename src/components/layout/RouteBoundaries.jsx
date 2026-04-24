import React from 'react'
import { Link, useRouter } from '@tanstack/react-router'
import { AlertTriangle, Home } from 'lucide-react'

export function RouteError({ error, reset }) {
  const router = useRouter()
  return (
    <div className="mx-auto max-w-md px-6 py-16 text-center">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
        <AlertTriangle className="h-7 w-7" />
      </div>
      <h2 className="mt-5 text-xl font-bold tracking-tight">Something went wrong</h2>
      <p className="mt-2 text-sm text-muted-foreground">
        {error.message || "We couldn't load this page."}
      </p>
      <div className="mt-6 flex justify-center gap-3">
        <button
          onClick={() => {
            router.invalidate()
            reset()
          }}
          className="rounded-xl bg-primary px-4 py-2 text-sm font-bold text-primary-foreground shadow-glow-primary"
        >
          Try again
        </button>
        <Link
          to="/dashboard"
          className="rounded-xl border border-border px-4 py-2 text-sm font-bold hover:bg-accent"
        >
          Dashboard
        </Link>
      </div>
    </div>
  )
}

export function RouteNotFound({ label = 'Page' }) {
  return (
    <div className="mx-auto max-w-md px-6 py-16 text-center">
      <h2 className="font-amiri text-5xl font-bold text-gradient-primary">404</h2>
      <p className="mt-3 text-sm text-muted-foreground">{label} not found.</p>
      <Link
        to="/dashboard"
        className="mt-6 inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-bold text-primary-foreground shadow-glow-primary"
      >
        <Home className="h-4 w-4" /> Back to dashboard
      </Link>
    </div>
  )
}

export function RouteSkeleton({ rows = 4 }) {
  return (
    <div className="mx-auto max-w-4xl px-4 py-6 md:px-8 md:py-10 space-y-6">
      <div className="space-y-2">
        <div className="h-3 w-24 rounded-full bg-muted/60 animate-pulse" />
        <div className="h-10 w-56 rounded-xl bg-muted/60 animate-pulse" />
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="h-24 rounded-2xl bg-muted/40 animate-pulse" />
        ))}
      </div>
    </div>
  )
}
