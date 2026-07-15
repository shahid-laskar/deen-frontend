import React, { useState } from 'react'
import { createFileRoute, Link, redirect, useNavigate } from '@tanstack/react-router'
import { useAuthStore } from '@/store/authStore'
import { authApi } from '@/lib/api'
import { cn } from '@/lib/utils'
import { Mail, Lock, User, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

export const Route = createFileRoute('/register')({
  beforeLoad: () => {
    const { isAuthenticated } = useAuthStore.getState()
    if (isAuthenticated) throw redirect({ to: '/dashboard' })
  },
  component: RegisterPage,
})

const MADHHABS = [
  { value: 'hanafi',  label: 'Hanafi'  },
  { value: 'maliki',  label: 'Maliki'  },
  { value: 'shafi',   label: "Shafi'i" },
  { value: 'hanbali', label: 'Hanbali' },
]

// ─── Password strength ────────────────────────────────────────────────────────
function getStrength(pw) {
  let score = 0
  if (pw.length >= 8)  score++
  if (/[A-Z]/.test(pw)) score++
  if (/[0-9]/.test(pw)) score++
  if (/[^A-Za-z0-9]/.test(pw)) score++
  return score
}

const STRENGTH_LABEL = ['', 'Weak', 'Fair', 'Good', 'Strong']
const STRENGTH_COLOR = ['', 'bg-destructive', 'bg-gold', 'bg-primary/70', 'bg-primary']

function PasswordStrength({ password }) {
  const score = getStrength(password)
  if (!password) return null
  return (
    <motion.div
      className="space-y-1.5 mt-2"
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
    >
      <div className="flex gap-1">
        {[1, 2, 3, 4].map(i => (
          <div
            key={i}
            className={cn(
              'h-1 flex-1 rounded-full transition-all duration-300',
              i <= score ? STRENGTH_COLOR[score] : 'bg-muted'
            )}
          />
        ))}
      </div>
      <p className={cn('text-[11px] font-semibold', score >= 3 ? 'text-primary' : score === 2 ? 'text-gold' : 'text-destructive')}>
        {STRENGTH_LABEL[score]}
      </p>
    </motion.div>
  )
}

// ─── Islamic SVG ornament ─────────────────────────────────────────────────────
function GeomGrid({ className }) {
  return (
    <svg width="200" height="200" viewBox="0 0 200 200" className={className} fill="none">
      <path d="M200 0L100 100L200 200M0 0L100 100L0 200" stroke="currentColor" strokeWidth="0.6" />
      <circle cx="200" cy="0" r="90" stroke="currentColor" strokeWidth="0.4" />
      <circle cx="200" cy="0" r="60" stroke="currentColor" strokeWidth="0.3" />
    </svg>
  )
}

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

  const inputCls = 'w-full rounded-xl border border-input bg-background/60 px-3.5 py-3 text-sm text-foreground placeholder:text-muted-foreground input-premium'

  return (
    <div className="min-h-screen flex flex-col items-center justify-center auth-hero-bg bg-background px-4 py-10 relative overflow-hidden">

      {/* Ambient glow blobs */}
      <div className="ambient-blob w-80 h-80 top-0 right-0 translate-x-1/3 -translate-y-1/3"
        style={{ background: 'var(--color-gold)' }} />
      <div className="ambient-blob w-96 h-96 bottom-0 left-0 -translate-x-1/3 translate-y-1/3"
        style={{ background: 'var(--color-primary)' }} />

      {/* Corner ornaments */}
      <div className="fixed top-0 right-0 text-gold/10 pointer-events-none">
        <GeomGrid className="w-64 h-64" />
      </div>
      <div className="fixed bottom-0 left-0 text-primary/8 pointer-events-none rotate-180">
        <GeomGrid className="w-64 h-64" />
      </div>

      <motion.div
        className="w-full max-w-sm relative z-10"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
      >
        {/* Logo */}
        <div className="flex flex-col items-center gap-4 mb-8">
          <motion.div
            className="relative"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1, duration: 0.4, ease: [0.34, 1.56, 0.64, 1] }}
          >
            <div className="absolute inset-0 rounded-2xl bg-primary blur-xl opacity-30 scale-110" />
            <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-glow-primary">
              <span className="font-amiri text-4xl text-primary-foreground leading-none">د</span>
            </div>
          </motion.div>
          <div className="text-center space-y-1">
            <h1 className="text-2xl font-bold tracking-tight heading-gradient">Join Deen</h1>
            <p className="text-sm text-muted-foreground">Your Islamic companion — free forever</p>
          </div>
        </div>

        {/* Card */}
        <div className="glass-card shadow-elevated rounded-3xl p-7 space-y-5">
          {/* Error */}
          <AnimatePresence>
            {error && (
              <motion.div
                className="flex items-start gap-2.5 rounded-xl bg-destructive/10 border border-destructive/25 px-3.5 py-3 text-sm text-destructive"
                initial={{ opacity: 0, y: -8, height: 0 }}
                animate={{ opacity: 1, y: 0, height: 'auto' }}
                exit={{ opacity: 0, y: -8, height: 0 }}
              >
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name */}
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-foreground">Full name</label>
              <div className="relative group">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground transition-colors group-focus-within:text-primary" />
                <input
                  type="text" value={form.full_name} onChange={set('full_name')}
                  placeholder="Your name" required
                  className={cn(inputCls, 'pl-10')}
                />
              </div>
            </div>

            {/* Email */}
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-foreground">Email</label>
              <div className="relative group">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground transition-colors group-focus-within:text-primary" />
                <input
                  type="email" value={form.email} onChange={set('email')}
                  placeholder="you@example.com" required
                  className={cn(inputCls, 'pl-10')}
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-foreground">Password</label>
              <div className="relative group">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground transition-colors group-focus-within:text-primary" />
                <input
                  type="password" value={form.password} onChange={set('password')}
                  placeholder="Min 8 characters" required minLength={8}
                  className={cn(inputCls, 'pl-10')}
                />
              </div>
              <AnimatePresence>
                {form.password && <PasswordStrength password={form.password} />}
              </AnimatePresence>
            </div>

            {/* Gender + Madhab */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-foreground">Gender</label>
                <select value={form.gender} onChange={set('gender')} className={inputCls}>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-foreground">School</label>
                <select value={form.madhab} onChange={set('madhab')} className={inputCls}>
                  {MADHHABS.map((m) => (
                    <option key={m.value} value={m.value}>{m.label}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Benefits row */}
            <div className="flex items-center gap-4 text-xs text-muted-foreground py-1">
              {['Free forever', 'No ads', 'Private'].map(b => (
                <span key={b} className="flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3 text-primary" />
                  {b}
                </span>
              ))}
            </div>

            {/* Submit */}
            <motion.button
              type="submit"
              disabled={loading}
              className={cn(
                'w-full flex items-center justify-center gap-2 rounded-xl px-4 py-3.5 text-sm font-bold text-primary-foreground',
                'bg-gradient-to-r from-primary to-primary/80 shadow-glow-primary',
                'disabled:opacity-60 disabled:cursor-not-allowed'
              )}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.97 }}
              transition={{ type: 'spring', stiffness: 400, damping: 17 }}
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Create account'}
            </motion.button>
          </form>

          <p className="text-center text-sm text-muted-foreground">
            Already have an account?{' '}
            <Link to="/login" className="font-bold text-primary hover:text-primary/80 transition-colors">
              Sign in
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  )
}
