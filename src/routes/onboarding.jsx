import React, { useState } from 'react'
import { createFileRoute, redirect, useNavigate } from '@tanstack/react-router'
import { useAuthStore } from '@/store/authStore'
import { userApi } from '@/lib/api'
import { cn } from '@/lib/utils'
import { Loader2, MapPin, Bell, BookOpen, Clock } from 'lucide-react'

export const Route = createFileRoute('/onboarding')({
  beforeLoad: () => {
    const { isAuthenticated, user } = useAuthStore.getState()
    if (!isAuthenticated) throw redirect({ to: '/login' })
    if (user?.onboarding_completed) throw redirect({ to: '/dashboard' })
  },
  component: OnboardingPage,
})

const STEPS = ['Welcome', 'Location', 'Prayer', 'Done']

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

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }))

  const detectLocation = () => {
    setLocLoading(true)
    navigator.geolocation?.getCurrentPosition(
      ({ coords }) => {
        setForm(f => ({ ...f, latitude: coords.latitude.toFixed(6), longitude: coords.longitude.toFixed(6) }))
        setLocLoading(false)
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

  const inputCls = 'w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring transition-colors'

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4 py-10">
      <div className="w-full max-w-md animate-fade-up">
        {/* Logo */}
        <div className="flex flex-col items-center gap-2 mb-8">
          <div className="w-14 h-14 rounded-2xl bg-primary flex items-center justify-center shadow-lg">
            <span className="font-amiri text-3xl text-primary-foreground leading-none">د</span>
          </div>
          <h1 className="text-2xl font-semibold text-foreground tracking-tight">Setup your Deen</h1>
          <p className="text-sm text-muted-foreground">Just a few steps to personalise your experience</p>
        </div>

        {/* Step indicators */}
        <div className="flex items-center gap-1 justify-center mb-8">
          {STEPS.map((s, i) => (
            <React.Fragment key={s}>
              <div className={cn(
                'h-1.5 rounded-full transition-all duration-300',
                i < step ? 'bg-primary w-8' : i === step ? 'bg-primary w-12' : 'bg-border w-8'
              )} />
            </React.Fragment>
          ))}
        </div>

        <div className="rounded-2xl border border-border bg-card shadow-sm p-6">
          {/* Step 0: Welcome */}
          {step === 0 && (
            <div className="space-y-4 text-center">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
                <BookOpen className="h-8 w-8 text-primary" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-foreground">
                  Welcome, {user?.profile?.display_name || user?.email?.split('@')[0]}!
                </h2>
                <p className="text-sm text-muted-foreground mt-2">
                  Deen helps you track prayers, read Quran, build Islamic habits, and much more — all in one place.
                </p>
              </div>
              <p className="text-xs text-muted-foreground">Free forever. No subscriptions required for core features.</p>
              <button onClick={() => setStep(1)} className="w-full rounded-xl bg-primary py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors">
                Get started
              </button>
            </div>
          )}

          {/* Step 1: Location */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <MapPin className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h2 className="text-base font-semibold text-foreground">Your location</h2>
                  <p className="text-xs text-muted-foreground">Needed for accurate prayer times</p>
                </div>
              </div>
              <button
                onClick={detectLocation}
                disabled={locLoading}
                className="w-full flex items-center justify-center gap-2 rounded-lg border border-border py-2.5 text-sm font-medium text-foreground hover:bg-muted transition-colors"
              >
                {locLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <MapPin className="h-4 w-4" />}
                Auto-detect location
              </button>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-foreground">Latitude</label>
                  <input value={form.latitude} onChange={set('latitude')} placeholder="51.5074" className={inputCls} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-foreground">Longitude</label>
                  <input value={form.longitude} onChange={set('longitude')} placeholder="-0.1278" className={inputCls} />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground">City (optional)</label>
                <input value={form.city} onChange={set('city')} placeholder="London" className={inputCls} />
              </div>
              <div className="flex gap-3">
                <button onClick={() => setStep(0)} className="flex-1 rounded-xl border border-border py-2.5 text-sm font-medium text-foreground hover:bg-muted transition-colors">Back</button>
                <button onClick={() => setStep(2)} className="flex-1 rounded-xl bg-primary py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors">Continue</button>
              </div>
            </div>
          )}

          {/* Step 2: Prayer settings */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Clock className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h2 className="text-base font-semibold text-foreground">Prayer preferences</h2>
                  <p className="text-xs text-muted-foreground">Calculation method and school of thought</p>
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground">Calculation method</label>
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
                <label className="text-xs font-medium text-foreground">School (Asr calculation)</label>
                <select value={form.madhab} onChange={set('madhab')} className={inputCls}>
                  <option value="hanafi">Hanafi</option>
                  <option value="maliki">Maliki</option>
                  <option value="shafi">Shafi'i</option>
                  <option value="hanbali">Hanbali</option>
                </select>
              </div>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.notifications_enabled}
                  onChange={e => setForm(f => ({ ...f, notifications_enabled: e.target.checked }))}
                  className="w-4 h-4 rounded text-primary"
                />
                <span className="text-sm text-foreground">Enable prayer time notifications</span>
              </label>
              <div className="flex gap-3">
                <button onClick={() => setStep(1)} className="flex-1 rounded-xl border border-border py-2.5 text-sm font-medium text-foreground hover:bg-muted transition-colors">Back</button>
                <button onClick={() => setStep(3)} className="flex-1 rounded-xl bg-primary py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors">Continue</button>
              </div>
            </div>
          )}

          {/* Step 3: Done */}
          {step === 3 && (
            <div className="space-y-4 text-center">
              <div className="w-16 h-16 rounded-2xl bg-sage/15 flex items-center justify-center mx-auto">
                <Bell className="h-8 w-8 text-sage" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-foreground">You're all set! 🎉</h2>
                <p className="text-sm text-muted-foreground mt-2">
                  Your Deen journey begins now. May Allah make it easy for you.
                </p>
              </div>
              <button
                onClick={finish}
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Go to my Dashboard'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
