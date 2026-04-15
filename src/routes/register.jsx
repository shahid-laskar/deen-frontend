import React, { useState } from 'react'
import { createFileRoute, Link, redirect, useNavigate } from '@tanstack/react-router'
import { useAuthStore } from '@/store/authStore'
import { authApi } from '@/lib/api'
import { cn } from '@/lib/utils'
import { Mail, Lock, User, Loader2 } from 'lucide-react'

export const Route = createFileRoute('/register')({
  beforeLoad: () => {
    const { isAuthenticated } = useAuthStore.getState()
    if (isAuthenticated) throw redirect({ to: '/dashboard' })
  },
  component: RegisterPage,
})

const MADHHABS = [
  { value: 'hanafi',   label: 'Hanafi' },
  { value: 'maliki',   label: 'Maliki' },
  { value: 'shafi',    label: "Shafi'i" },
  { value: 'hanbali',  label: 'Hanbali' },
]

function RegisterPage() {
  const navigate = useNavigate()
  const { setAuth } = useAuthStore()
  const [form, setForm] = useState({
    full_name: '',
    email: '',
    password: '',
    gender: 'male',
    madhab: 'hanafi',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const { data } = await authApi.register(form)
      setAuth(data)
      navigate({ to: '/onboarding' })
    } catch (err) {
      const msg = err?.response?.data?.detail || 'Registration failed. Please try again.'
      setError(Array.isArray(msg) ? msg[0]?.msg || String(msg) : String(msg))
    } finally {
      setLoading(false)
    }
  }

  const inputCls = 'w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-colors'

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4 py-10">
      {/* Background ornament */}
      <div className="fixed top-0 right-0 w-64 h-64 text-gold/5 pointer-events-none">
        <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M200 0L100 100L200 200" stroke="currentColor" strokeWidth="1" />
          <circle cx="200" cy="0" r="80" stroke="currentColor" strokeWidth="0.5" />
        </svg>
      </div>

      <div className="w-full max-w-sm animate-fade-up">
        {/* Logo */}
        <div className="flex flex-col items-center gap-3 mb-8">
          <div className="w-14 h-14 rounded-2xl bg-primary flex items-center justify-center shadow-lg">
            <span className="font-amiri text-3xl text-primary-foreground leading-none">د</span>
          </div>
          <div className="text-center">
            <h1 className="text-2xl font-semibold text-foreground tracking-tight">Join Deen</h1>
            <p className="text-sm text-muted-foreground mt-1">Your Islamic companion — free forever</p>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card shadow-sm p-6 space-y-5">
          {error && (
            <div className="rounded-lg bg-destructive/10 border border-destructive/20 px-3 py-2.5 text-sm text-destructive">
              {error}
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">Full name</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="text" value={form.full_name} onChange={set('full_name')}
                  placeholder="Your name" required
                  className={cn(inputCls, 'pl-9')}
                />
              </div>
            </div>

            {/* Email */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="email" value={form.email} onChange={set('email')}
                  placeholder="you@example.com" required
                  className={cn(inputCls, 'pl-9')}
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="password" value={form.password} onChange={set('password')}
                  placeholder="Min 8 characters" required minLength={8}
                  className={cn(inputCls, 'pl-9')}
                />
              </div>
            </div>

            {/* Gender + Madhab row */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">Gender</label>
                <select value={form.gender} onChange={set('gender')} className={inputCls}>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">School</label>
                <select value={form.madhab} onChange={set('madhab')} className={inputCls}>
                  {MADHHABS.map((m) => (
                    <option key={m.value} value={m.value}>{m.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <button
              type="submit" disabled={loading}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90 active:scale-[.98] disabled:opacity-60 transition-all"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Create account'}
            </button>
          </form>

          <p className="text-center text-sm text-muted-foreground">
            Already have an account?{' '}
            <Link to="/login" className="font-medium text-primary hover:underline">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
