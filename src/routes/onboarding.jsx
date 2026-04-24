import React, { useState } from 'react'
import { createFileRoute, useNavigate, redirect } from '@tanstack/react-router'
import { useMutation } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { ArrowLeft, ArrowRight, Bell, Compass, MapPin, Moon } from 'lucide-react'
import { tokenStore, usersApi } from '@/lib/api'
import { useAuthStore } from '@/store/authStore'

export const Route = createFileRoute('/onboarding')({
  beforeLoad: () => {
    if (typeof window === 'undefined') return
    if (!tokenStore.getAccess()) {
      throw redirect({ to: '/login' })
    }
  },
  component: OnboardingPage,
})

const METHODS = [
  { key: 'MWL', label: 'Muslim World League' },
  { key: 'ISNA', label: 'ISNA (North America)' },
  { key: 'Egypt', label: 'Egyptian General Authority' },
  { key: 'Makkah', label: 'Umm al-Qura, Makkah' },
  { key: 'Karachi', label: 'University of Karachi' },
]

const MADHABS = ['Hanafi', 'Shafi', 'Maliki', 'Hanbali']

function OnboardingPage() {
  const navigate = useNavigate()
  const updateUser = useAuthStore((s) => s.updateUser)
  const user = useAuthStore((s) => s.user)

  const [step, setStep] = useState(0)
  const [city, setCity] = useState('')
  const [country, setCountry] = useState('')
  const [coords, setCoords] = useState({})
  const [method, setMethod] = useState('MWL')
  const [madhab, setMadhab] = useState('Hanafi')
  const [notifications, setNotifications] = useState({
    prayer: true,
    habits: true,
    daily_verse: true,
  })
  const tz = typeof Intl !== 'undefined' ? Intl.DateTimeFormat().resolvedOptions().timeZone : 'UTC'

  const saveProfile = useMutation({
    mutationFn: () =>
      usersApi.updateProfile({
        city,
        country,
        latitude: coords.lat,
        longitude: coords.lng,
        prayer_calculation_method: method,
        madhab,
        timezone: tz,
      }),
  })

  const completeOnboarding = useMutation({
    mutationFn: () =>
      usersApi.completeOnboarding({
        notification_preferences: notifications,
      }),
    onSuccess: async () => {
      if (typeof window !== 'undefined') {
        localStorage.setItem('deen_onboarded', '1')
      }
      updateUser({ ...user, onboarding_completed: true })
      toast.success('All set — welcome!')
      navigate({ to: '/' })
    },
    onError: () => {
      if (typeof window !== 'undefined') {
        localStorage.setItem('deen_onboarded', '1')
      }
      navigate({ to: '/' })
    },
  })

  function detectLocation() {
    if (!navigator.geolocation) {
      toast.error('Geolocation not available')
      return
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude })
        toast.success('Location detected')
      },
      () => toast.error('Permission denied'),
      { enableHighAccuracy: false, timeout: 8000 }
    )
  }

  async function next() {
    if (step === 2) {
      try {
        await saveProfile.mutateAsync()
      } catch (e) {
        // continue anyway
      }
    }
    if (step === 3) {
      completeOnboarding.mutate()
      return
    }
    setStep((s) => Math.min(3, s + 1))
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background via-primary/5 to-gold/5 px-4 py-10">
      <div className="w-full max-w-lg space-y-8">
        <div className="flex items-center justify-between">
          <span className="font-amiri text-2xl text-gradient-primary font-bold">Deen</span>
          <span className="text-xs text-muted-foreground font-bold">Step {step + 1} / 4</span>
        </div>
        <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-primary to-gold transition-all duration-500"
            style={{ width: `${((step + 1) / 4) * 100}%` }}
          />
        </div>

        <div className="rounded-3xl glass-card shadow-elevated p-8 space-y-6 animate-slide-up">
          {step === 0 && <WelcomeStep />}
          {step === 1 && (
            <LocationStep
              city={city}
              country={country}
              coords={coords}
              setCity={setCity}
              setCountry={setCountry}
              detect={detectLocation}
            />
          )}
          {step === 2 && (
            <PrayerStep method={method} setMethod={setMethod} madhab={madhab} setMadhab={setMadhab} />
          )}
          {step === 3 && (
            <NotificationStep prefs={notifications} setPrefs={setNotifications} />
          )}

          <div className="flex items-center justify-between pt-4">
            {step > 0 ? (
              <button
                onClick={() => setStep((s) => s - 1)}
                className="flex items-center gap-2 text-sm font-bold text-muted-foreground hover:text-foreground"
              >
                <ArrowLeft className="h-4 w-4" /> Back
              </button>
            ) : (
              <span />
            )}
            <button
              onClick={next}
              disabled={completeOnboarding.isPending || saveProfile.isPending}
              className="flex items-center gap-2 rounded-xl bg-primary text-primary-foreground px-5 py-2.5 text-sm font-bold shadow-glow-primary disabled:opacity-60"
            >
              {step === 3 ? 'Finish' : 'Continue'} <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        <button
          onClick={() => completeOnboarding.mutate()}
          className="mx-auto block text-xs text-muted-foreground/70 hover:text-muted-foreground"
        >
          Skip for now
        </button>
      </div>
    </div>
  )
}

function WelcomeStep() {
  return (
    <div className="text-center space-y-4">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-gradient-to-br from-primary to-gold text-primary-foreground shadow-glow-primary">
        <span className="font-amiri text-3xl font-bold">د</span>
      </div>
      <h2 className="font-amiri text-3xl font-bold text-gradient-primary">Bismillah, welcome</h2>
      <p className="font-amiri text-xl text-foreground/80 italic">بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ</p>
      <p className="text-sm text-muted-foreground leading-relaxed">
        Let's set up your spiritual companion in 3 quick steps — your prayer location, calculation method, and what reminders you want.
      </p>
    </div>
  )
}

function LocationStep({ city, country, coords, setCity, setCountry, detect }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <MapPin className="h-5 w-5" />
        </div>
        <h2 className="text-xl font-bold">Where do you pray?</h2>
      </div>
      <p className="text-sm text-muted-foreground">
        We use this to compute accurate prayer times and Qibla direction.
      </p>
      <button
        onClick={detect}
        className="w-full rounded-xl border border-primary/30 bg-primary/5 px-4 py-3 text-sm font-bold text-primary hover:bg-primary/10"
      >
        Detect my location
      </button>
      {coords.lat && (
        <p className="text-xs text-sage font-semibold">
          ✓ {coords.lat.toFixed(3)}, {coords.lng?.toFixed(3)}
        </p>
      )}
      <div className="grid grid-cols-2 gap-3">
        <input
          placeholder="City"
          value={city}
          onChange={(e) => setCity(e.target.value)}
          className="rounded-xl bg-background border border-border px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
        <input
          placeholder="Country"
          value={country}
          onChange={(e) => setCountry(e.target.value)}
          className="rounded-xl bg-background border border-border px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
      </div>
    </div>
  )
}

function PrayerStep({ method, setMethod, madhab, setMadhab }) {
  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gold/10 text-gold-foreground">
          <Compass className="h-5 w-5" />
        </div>
        <h2 className="text-xl font-bold">Prayer preferences</h2>
      </div>
      <div>
        <label className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground">
          Calculation Method
        </label>
        <select
          value={method}
          onChange={(e) => setMethod(e.target.value)}
          className="w-full mt-2 rounded-xl bg-background border border-border px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
        >
          {METHODS.map((m) => (
            <option key={m.key} value={m.key}>
              {m.label}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground">
          Madhab (for Asr time)
        </label>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-2">
          {MADHABS.map((m) => (
            <button
              key={m}
              onClick={() => setMadhab(m)}
              className={`rounded-xl px-3 py-2 text-sm font-bold transition-all ${
                madhab === m
                  ? 'bg-primary text-primary-foreground shadow-glow-primary'
                  : 'bg-muted/50 text-muted-foreground hover:bg-muted'
              }`}
            >
              {m}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

function NotificationStep({ prefs, setPrefs }) {
  function toggle(k) {
    setPrefs({ ...prefs, [k]: !prefs[k] })
  }
  const items = [
    { k: 'prayer', label: 'Prayer reminders', desc: 'Adhan times for the 5 prayers' },
    { k: 'habits', label: 'Habit nudges', desc: 'Gentle reminders for your daily habits' },
    { k: 'daily_verse', label: 'Daily verse', desc: 'A morning verse from the Quran' },
  ]
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sage/10 text-sage">
          <Bell className="h-5 w-5" />
        </div>
        <h2 className="text-xl font-bold">Stay on track</h2>
      </div>
      <div className="space-y-2">
        {items.map((it) => (
          <button
            key={it.k}
            onClick={() => toggle(it.k)}
            className={`w-full flex items-center justify-between rounded-2xl border px-4 py-3.5 text-left transition-all ${
              prefs[it.k]
                ? 'border-primary/30 bg-primary/5'
                : 'border-border bg-card hover:bg-muted/40'
            }`}
          >
            <div>
              <p className="font-bold text-sm">{it.label}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{it.desc}</p>
            </div>
            <div
              className={`h-6 w-11 rounded-full transition-all relative ${
                prefs[it.k] ? 'bg-primary' : 'bg-muted'
              }`}
            >
              <div
                className={`absolute top-0.5 h-5 w-5 rounded-full bg-background shadow transition-all ${
                  prefs[it.k] ? 'left-5' : 'left-0.5'
                }`}
              />
            </div>
          </button>
        ))}
      </div>
      <p className="text-xs text-muted-foreground/70 text-center pt-2">
        <Moon className="h-3 w-3 inline mr-1" />
        You can change these anytime in Settings.
      </p>
    </div>
  )
}
