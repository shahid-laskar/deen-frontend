import React, { useState } from 'react'
import { createFileRoute, Link, redirect, useNavigate } from '@tanstack/react-router'
import { useAuthStore } from '@/store/authStore'
import { authApi } from '@/lib/api'
import { cn } from '@/lib/utils'
import { Mail, Lock, Loader2, Eye, EyeOff, AlertCircle } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

export const Route = createFileRoute('/login')({
  beforeLoad: () => {
    const { isAuthenticated } = useAuthStore.getState()
    if (isAuthenticated) throw redirect({ to: '/dashboard' })
  },
  component: LoginPage,
})

// ─── Islamic 8-point star ornament ───────────────────────────────────────────
function StarOrnament({ className, size = 120 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 120 120" className={className} fill="none">
      <path d="M60 5 L67 45 L105 30 L80 60 L105 90 L67 75 L60 115 L53 75 L15 90 L40 60 L15 30 L53 45 Z"
        stroke="currentColor" strokeWidth="0.6" fill="currentColor" fillOpacity="0.08" />
      <circle cx="60" cy="60" r="18" stroke="currentColor" strokeWidth="0.5" />
      <circle cx="60" cy="60" r="30" stroke="currentColor" strokeWidth="0.3" />
      <circle cx="60" cy="60" r="50" stroke="currentColor" strokeWidth="0.2" />
    </svg>
  )
}

// ─── Geometric grid ornament ──────────────────────────────────────────────────
function GeomGrid({ className }) {
  return (
    <svg width="200" height="200" viewBox="0 0 200 200" className={className} fill="none">
      <path d="M0 0L100 100L0 200M200 0L100 100L200 200" stroke="currentColor" strokeWidth="0.6" />
      <circle cx="0" cy="0" r="90" stroke="currentColor" strokeWidth="0.4" />
      <circle cx="0" cy="0" r="60" stroke="currentColor" strokeWidth="0.3" />
      <path d="M50 0L0 50M100 0L0 100M150 0L0 150" stroke="currentColor" strokeWidth="0.2" />
    </svg>
  )
}

function LoginPage() {
  const navigate = useNavigate()
  const { setAuth } = useAuthStore()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const { data } = await authApi.login({ email, password })
      setAuth(data)
      if (!data.user?.onboarding_completed) {
        navigate({ to: '/onboarding' })
      } else {
        navigate({ to: '/dashboard' })
      }
    } catch (err) {
      const msg = err?.response?.data?.detail || 'Invalid email or password.'
      setError(Array.isArray(msg) ? msg[0]?.msg || String(msg) : String(msg))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center auth-hero-bg bg-background px-4 py-10 relative overflow-hidden">

      {/* Ambient glow blobs */}
      <div className="ambient-blob w-96 h-96 top-0 left-0 -translate-x-1/2 -translate-y-1/2"
        style={{ background: 'var(--color-primary)' }} />
      <div className="ambient-blob w-80 h-80 bottom-0 right-0 translate-x-1/2 translate-y-1/2"
        style={{ background: 'var(--color-gold)' }} />

      {/* Corner ornaments */}
      <div className="fixed top-0 left-0 text-primary/10 pointer-events-none">
        <GeomGrid className="w-64 h-64" />
      </div>
      <div className="fixed bottom-0 right-0 text-gold/10 pointer-events-none rotate-180">
        <GeomGrid className="w-64 h-64" />
      </div>
      <div className="fixed top-1/2 right-8 -translate-y-1/2 text-primary/5 pointer-events-none hidden lg:block">
        <StarOrnament size={160} />
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
            <h1 className="text-2xl font-bold tracking-tight heading-gradient">Welcome back</h1>
            <p className="font-amiri text-base text-primary/70">بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ</p>
          </div>
        </div>

        {/* Card */}
        <div className="glass-card shadow-elevated rounded-3xl p-7 space-y-6">
          {/* Error */}
          <AnimatePresence>
            {error && (
              <motion.div
                className="flex items-start gap-2.5 rounded-xl bg-destructive/10 border border-destructive/25 px-3.5 py-3 text-sm text-destructive"
                initial={{ opacity: 0, y: -8, height: 0 }}
                animate={{ opacity: 1, y: 0, height: 'auto' }}
                exit={{ opacity: 0, y: -8, height: 0 }}
                transition={{ duration: 0.2 }}
              >
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email */}
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-foreground">Email</label>
              <div className="relative group">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground transition-colors group-focus-within:text-primary" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  className="w-full rounded-xl border border-input bg-background/60 pl-10 pr-4 py-3 text-sm text-foreground placeholder:text-muted-foreground input-premium"
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-foreground">Password</label>
              <div className="relative group">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground transition-colors group-focus-within:text-primary" />
                <input
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full rounded-xl border border-input bg-background/60 pl-10 pr-11 py-3 text-sm text-foreground placeholder:text-muted-foreground input-premium"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(v => !v)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <motion.button
              type="submit"
              disabled={loading}
              className={cn(
                'relative w-full flex items-center justify-center gap-2 rounded-xl px-4 py-3.5 text-sm font-bold text-primary-foreground transition-all overflow-hidden',
                'bg-gradient-to-r from-primary to-primary/80 shadow-glow-primary',
                'disabled:opacity-60 disabled:cursor-not-allowed'
              )}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.97 }}
              transition={{ type: 'spring', stiffness: 400, damping: 17 }}
            >
              {/* Shimmer overlay */}
              {!loading && (
                <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
              )}
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Sign in'}
            </motion.button>
          </form>

          <div className="relative flex items-center gap-3">
            <div className="h-px flex-1 bg-border" />
            <span className="text-xs text-muted-foreground px-1">or</span>
            <div className="h-px flex-1 bg-border" />
          </div>

          <p className="text-center text-sm text-muted-foreground">
            New to Deen?{' '}
            <Link to="/register" className="font-bold text-primary hover:text-primary/80 transition-colors">
              Create account
            </Link>
          </p>
        </div>

        {/* Footer verse */}
        <p className="text-center font-amiri text-sm text-muted-foreground/60 mt-6">
          وَاللَّهُ وَلِيُّ الْمُؤْمِنِينَ
        </p>
      </motion.div>
    </div>
  )
}
