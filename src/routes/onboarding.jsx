import React, { useState } from 'react'
import { createFileRoute, redirect, useNavigate } from '@tanstack/react-router'
import { useAuthStore } from '@/store/authStore'
import { userApi } from '@/lib/api'
import { cn } from '@/lib/utils'
import { Loader2, MapPin, Bell, BookOpen, Clock, CheckCircle2, Star } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import confetti from 'canvas-confetti'

export const Route = createFileRoute('/onboarding')({
  beforeLoad: () => {
    const { isAuthenticated, user } = useAuthStore.getState()
    if (!isAuthenticated) throw redirect({ to: '/login' })
    if (user?.onboarding_completed) throw redirect({ to: '/dashboard' })
  },
  component: OnboardingPage,
})

const STEPS = ['Welcome', 'Location', 'Prayer', 'Done']

// ─── Progress Arc (SVG circular progress) ────────────────────────────────────
function ProgressArc({ step, total }) {
  const r = 28, circumference = 2 * Math.PI * r
  const progress = step / (total - 1)
  const offset = circumference - progress * circumference
  return (
    <div className="relative w-16 h-16 flex items-center justify-center">
      <svg width="64" height="64" className="-rotate-90">
        <circle cx="32" cy="32" r={r} fill="none" stroke="currentColor"
          strokeWidth="3" className="text-border" />
        <circle cx="32" cy="32" r={r} fill="none" stroke="currentColor"
          strokeWidth="3" strokeLinecap="round" className="text-primary"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 0.6s cubic-bezier(0.4,0,0.2,1)' }} />
      </svg>
      <span className="absolute text-xs font-bold text-primary">{step + 1}/{total}</span>
    </div>
  )
}

// ─── Step icon hero ───────────────────────────────────────────────────────────
function StepIcon({ icon: Icon, color, glow }) {
  return (
    <motion.div
      className="relative mx-auto w-20 h-20 flex items-center justify-center"
      initial={{ scale: 0.6, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
    >
      <div className={cn('absolute inset-0 rounded-3xl blur-xl opacity-40', glow)} />
      <div className={cn('relative w-20 h-20 rounded-3xl flex items-center justify-center shadow-soft', color)}>
        <Icon className="h-9 w-9 text-white" />
      </div>
    </motion.div>
  )
}

const STEP_META = [
  { icon: BookOpen, color: 'bg-gradient-to-br from-primary to-primary/70', glow: 'bg-primary' },
  { icon: MapPin,   color: 'bg-gradient-to-br from-blue-500 to-blue-600',   glow: 'bg-blue-500' },
  { icon: Clock,    color: 'bg-gradient-to-br from-amber-500 to-amber-600', glow: 'bg-amber-500' },
  { icon: Star,     color: 'bg-gradient-to-br from-emerald-500 to-teal-600', glow: 'bg-emerald-500' },
]

function OnboardingPage() {
  const navigate  = useNavigate()
  const { user, updateUser } = useAuthStore()
  const [step, setStep] = useState(0)
  const [form, setForm] = useState({
    city: '',
    country: '',
    latitude: '',
    longitude: '',
    madhab: user?.madhab || 'hanafi',
    calculation_method: 'MWL',
    notifications_enabled: true,
  })
  const [loading, setLoading] = useState(false)
  const [locLoading, setLocLoading] = useState(false)
  const [locDetected, setLocDetected] = useState(false)

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }))

  const detectLocation = () => {
    setLocLoading(true)
    navigator.geolocation?.getCurrentPosition(
      ({ coords }) => {
        setForm(f => ({ ...f, latitude: coords.latitude.toFixed(6), longitude: coords.longitude.toFixed(6) }))
        setLocLoading(false)
        setLocDetected(true)
      },
      () => setLocLoading(false)
    )
  }

  const finish = async () => {
    setLoading(true)
    try {
      const payload = {
        ...form,
        latitude: form.latitude ? parseFloat(form.latitude) : null,
        longitude: form.longitude ? parseFloat(form.longitude) : null,
        onboarding_completed: true,
      }
      const { data } = await userApi.updateMe(payload)
      updateUser(data)
      navigate({ to: '/dashboard' })
    } catch {
      navigate({ to: '/dashboard' })
    } finally {
      setLoading(false)
    }
  }

  const handleDone = () => {
    confetti({ particleCount: 120, spread: 80, origin: { y: 0.5 }, colors: ['#10b981','#f59e0b','#3b82f6'] })
    finish()
  }

  const inputCls = 'w-full rounded-xl border border-input bg-background/60 px-3.5 py-3 text-sm text-foreground placeholder:text-muted-foreground input-premium'

  const meta = STEP_META[step]
  const displayName = user?.profile?.display_name || user?.email?.split('@')[0] || 'there'

  return (
    <div className="min-h-screen flex flex-col items-center justify-center auth-hero-bg bg-background px-4 py-10 relative overflow-hidden">
      {/* Ambient blobs */}
      <div className="ambient-blob w-96 h-96 top-0 left-0 -translate-x-1/2 -translate-y-1/2" style={{ background: 'var(--color-primary)' }} />
      <div className="ambient-blob w-80 h-80 bottom-0 right-0 translate-x-1/3 translate-y-1/3" style={{ background: 'var(--color-gold)' }} />

      <motion.div
        className="w-full max-w-md relative z-10"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Logo + progress */}
        <div className="flex items-center justify-between mb-8 px-1">
          <div className="flex items-center gap-3">
            <div className="relative w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-glow-primary">
              <span className="font-amiri text-xl text-primary-foreground leading-none">د</span>
            </div>
            <div>
              <p className="text-sm font-bold text-foreground">Deen Setup</p>
              <p className="text-xs text-muted-foreground">{STEPS[step]}</p>
            </div>
          </div>
          <ProgressArc step={step} total={STEPS.length} />
        </div>

        {/* Card */}
        <div className="glass-card shadow-elevated rounded-3xl overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              className="p-8"
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              transition={{ duration: 0.28, ease: [0.4, 0, 0.2, 1] }}
            >
              {/* Step 0: Welcome */}
              {step === 0 && (
                <div className="space-y-6 text-center">
                  <StepIcon {...meta} />
                  <div className="space-y-2">
                    <h2 className="text-2xl font-bold heading-gradient">
                      Assalamu Alaikum, {displayName}!
                    </h2>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      Deen helps you track prayers, read Quran, build Islamic habits, and much more — all in one sacred space.
                    </p>
                  </div>
                  <div className="flex justify-center gap-6 text-xs text-muted-foreground py-2">
                    {['Free forever', 'No ads', 'Private & secure'].map(b => (
                      <span key={b} className="flex items-center gap-1.5">
                        <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
                        {b}
                      </span>
                    ))}
                  </div>
                  <motion.button
                    onClick={() => setStep(1)}
                    className="w-full rounded-xl bg-gradient-to-r from-primary to-primary/80 py-3.5 text-sm font-bold text-primary-foreground shadow-glow-primary"
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.97 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                  >
                    Get started →
                  </motion.button>
                </div>
              )}

              {/* Step 1: Location */}
              {step === 1 && (
                <div className="space-y-5">
                  <div className="text-center space-y-3">
                    <StepIcon {...meta} />
                    <div>
                      <h2 className="text-xl font-bold text-foreground">Your location</h2>
                      <p className="text-sm text-muted-foreground mt-1">Needed for accurate prayer times</p>
                    </div>
                  </div>

                  <motion.button
                    onClick={detectLocation}
                    disabled={locLoading}
                    className={cn(
                      'w-full flex items-center justify-center gap-2 rounded-xl border py-3 text-sm font-semibold transition-all',
                      locDetected
                        ? 'border-primary/40 bg-primary/8 text-primary'
                        : 'border-border bg-card hover:bg-muted text-foreground'
                    )}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {locLoading
                      ? <Loader2 className="h-4 w-4 animate-spin" />
                      : locDetected
                        ? <CheckCircle2 className="h-4 w-4" />
                        : <MapPin className="h-4 w-4" />}
                    {locDetected ? 'Location detected ✓' : 'Auto-detect location'}
                  </motion.button>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Latitude</label>
                      <input value={form.latitude} onChange={set('latitude')} placeholder="51.5074" className={inputCls} />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Longitude</label>
                      <input value={form.longitude} onChange={set('longitude')} placeholder="-0.1278" className={inputCls} />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">City (optional)</label>
                    <input value={form.city} onChange={set('city')} placeholder="London" className={inputCls} />
                  </div>
                  <NavButtons onBack={() => setStep(0)} onNext={() => setStep(2)} />
                </div>
              )}

              {/* Step 2: Prayer settings */}
              {step === 2 && (
                <div className="space-y-5">
                  <div className="text-center space-y-3">
                    <StepIcon {...meta} />
                    <div>
                      <h2 className="text-xl font-bold text-foreground">Prayer preferences</h2>
                      <p className="text-sm text-muted-foreground mt-1">Calculation method & school of thought</p>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Calculation method</label>
                    <select value={form.calculation_method} onChange={set('calculation_method')} className={inputCls}>
                      <option value="MWL">Muslim World League (MWL)</option>
                      <option value="ISNA">ISNA — North America</option>
                      <option value="Egypt">Egyptian General Authority</option>
                      <option value="Makkah">Umm al-Qura, Makkah</option>
                      <option value="Karachi">University of Islamic Sciences, Karachi</option>
                      <option value="Tehran">Institute of Geophysics, Tehran</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">School (Asr calculation)</label>
                    <select value={form.madhab} onChange={set('madhab')} className={inputCls}>
                      <option value="hanafi">Hanafi</option>
                      <option value="maliki">Maliki</option>
                      <option value="shafi">Shafi'i</option>
                      <option value="hanbali">Hanbali</option>
                    </select>
                  </div>
                  <label className="flex items-center gap-3 cursor-pointer p-3 rounded-xl border border-border hover:bg-muted/40 transition-colors">
                    <input
                      type="checkbox"
                      checked={form.notifications_enabled}
                      onChange={e => setForm(f => ({ ...f, notifications_enabled: e.target.checked }))}
                      className="w-4 h-4 rounded accent-primary"
                    />
                    <div>
                      <p className="text-sm font-medium text-foreground">Enable prayer notifications</p>
                      <p className="text-xs text-muted-foreground">Get reminded before each prayer</p>
                    </div>
                    <Bell className="h-4 w-4 text-muted-foreground ml-auto" />
                  </label>
                  <NavButtons onBack={() => setStep(1)} onNext={() => setStep(3)} />
                </div>
              )}

              {/* Step 3: Done */}
              {step === 3 && (
                <div className="space-y-6 text-center">
                  <StepIcon {...meta} />
                  <div className="space-y-2">
                    <h2 className="text-2xl font-bold heading-gradient">You're all set! 🎉</h2>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      Your Deen journey begins now.<br />May Allah make it easy and blessed for you.
                    </p>
                  </div>
                  <p className="font-amiri text-xl text-primary/80">بِسْمِ اللَّهِ نَبْدَأُ</p>
                  <motion.button
                    onClick={handleDone}
                    disabled={loading}
                    className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-primary to-primary/80 py-3.5 text-sm font-bold text-primary-foreground shadow-glow-primary"
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.97 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                  >
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Go to my Dashboard →'}
                  </motion.button>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  )
}

function NavButtons({ onBack, onNext, nextLabel = 'Continue' }) {
  return (
    <div className="flex gap-3 pt-1">
      <button
        onClick={onBack}
        className="flex-1 rounded-xl border border-border py-3 text-sm font-medium text-foreground hover:bg-muted transition-colors"
      >
        Back
      </button>
      <motion.button
        onClick={onNext}
        className="flex-1 rounded-xl bg-gradient-to-r from-primary to-primary/80 py-3 text-sm font-bold text-primary-foreground shadow-glow-primary"
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.97 }}
        transition={{ type: 'spring', stiffness: 400, damping: 17 }}
      >
        {nextLabel}
      </motion.button>
    </div>
  )
}
