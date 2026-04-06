import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { MapPin, User, Target, CheckCircle, ChevronRight } from 'lucide-react'
import { userApi } from '../../lib/api'
import { useAuthStore } from '../../store/authStore'
import { Button, Input } from '../../components/ui/index'
import toast from 'react-hot-toast'
import { clsx } from 'clsx'

const STEPS = [
  { id: 'name', title: 'What shall we call you?', icon: User },
  { id: 'location', title: 'Your location', icon: MapPin },
  { id: 'goals', title: 'Your daily goals', icon: Target },
  { id: 'done', title: 'All set!', icon: CheckCircle },
]

export default function OnboardingPage() {
  const navigate = useNavigate()
  const { updateUser, user } = useAuthStore()
  const [step, setStep] = useState(0)
  const [data, setData] = useState({
    display_name: '',
    latitude: null,
    longitude: null,
    quran_daily_goal_minutes: 15,
    city: '',
  })
  const [locLoading, setLocLoading] = useState(false)

  const { mutate: saveProfile, isPending } = useMutation({
    mutationFn: async () => {
      await userApi.updateProfile({ display_name: data.display_name, quran_daily_goal_minutes: data.quran_daily_goal_minutes })
      await userApi.updateMe({ latitude: data.latitude, longitude: data.longitude, onboarding_completed: true })
    },
    onSuccess: () => {
      updateUser({ ...user, onboarding_completed: true })
      setStep(3)
    },
    onError: () => toast.error('Could not save. Please try again.'),
  })

  const getLocation = () => {
    setLocLoading(true)
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        setData({ ...data, latitude: pos.coords.latitude, longitude: pos.coords.longitude })
        setLocLoading(false)
        toast.success('Location saved!')
      },
      () => {
        setLocLoading(false)
        toast.error('Could not get location. You can set it later in Settings.')
      }
    )
  }

  const handleNext = () => {
    if (step === 2) return saveProfile()
    if (step === 3) return navigate('/dashboard')
    setStep(step + 1)
  }

  const progress = ((step + 1) / STEPS.length) * 100

  return (
    <div className="min-h-screen bg-parchment-50 dark:bg-emerald-950 flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        {/* Progress */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-9 h-9 bg-gold-700 rounded-xl flex items-center justify-center">
              <span className="font-arabic text-white font-bold text-lg leading-none">د</span>
            </div>
            <span className="font-display text-emerald-900 dark:text-white font-semibold text-xl">Deen</span>
          </div>
          <div className="h-1.5 bg-parchment-200 dark:bg-emerald-900/50 rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-700 rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-xs text-muted mt-2">Step {step + 1} of {STEPS.length}</p>
        </div>

        <div className="card p-8 animate-fade-up">
          {step === 0 && (
            <div className="space-y-6">
              <div>
                <h2 className="font-display text-2xl font-bold text-emerald-900 dark:text-white mb-1">
                  Welcome to Deen
                </h2>
                <p className="text-muted">Let's personalise your experience.</p>
              </div>
              <Input
                label="Your name or nickname"
                placeholder="e.g. Ahmad, Sister Fatima..."
                value={data.display_name}
                onChange={(e) => setData({ ...data, display_name: e.target.value })}
              />
            </div>
          )}

          {step === 1 && (
            <div className="space-y-6">
              <div>
                <h2 className="font-display text-2xl font-bold text-emerald-900 dark:text-white mb-1">
                  Set your location
                </h2>
                <p className="text-muted">Used for accurate prayer times. We never share your location.</p>
              </div>
              {data.latitude ? (
                <div className="flex items-center gap-3 px-4 py-3 bg-emerald-50 dark:bg-emerald-900/30 rounded-xl border border-emerald-200 dark:border-emerald-800">
                  <CheckCircle size={18} className="text-emerald-600" />
                  <span className="text-sm text-emerald-700 dark:text-emerald-300">
                    Location saved ({data.latitude.toFixed(4)}, {data.longitude.toFixed(4)})
                  </span>
                </div>
              ) : (
                <Button variant="outline" onClick={getLocation} loading={locLoading} className="w-full">
                  <MapPin size={16} />
                  Use my current location
                </Button>
              )}
              <p className="text-xs text-muted text-center">
                You can also set it manually in Settings → Prayer times
              </p>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <div>
                <h2 className="font-display text-2xl font-bold text-emerald-900 dark:text-white mb-1">
                  Daily Quran goal
                </h2>
                <p className="text-muted">How many minutes of Quran would you like to read daily?</p>
              </div>
              <div className="grid grid-cols-4 gap-2">
                {[10, 15, 20, 30].map((mins) => (
                  <button
                    key={mins}
                    type="button"
                    onClick={() => setData({ ...data, quran_daily_goal_minutes: mins })}
                    className={clsx(
                      'py-4 rounded-xl text-sm font-semibold border transition-all',
                      data.quran_daily_goal_minutes === mins
                        ? 'bg-emerald-800 text-white border-emerald-800'
                        : 'border-parchment-300 dark:border-emerald-800 text-parchment-600 dark:text-emerald-500'
                    )}
                  >
                    {mins}m
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="text-center space-y-4 py-4">
              <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-900/40 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle size={40} className="text-emerald-600" />
              </div>
              <div>
                <h2 className="font-display text-2xl font-bold text-emerald-900 dark:text-white mb-2">
                  You're all set, {data.display_name || 'friend'}!
                </h2>
                <p className="text-muted">
                  BismAllah — your Deen journey begins now.
                  May Allah make it easy for you. 🌙
                </p>
              </div>
            </div>
          )}

          <div className="mt-8 flex justify-between items-center">
            {step > 0 && step < 3 ? (
              <button
                onClick={() => setStep(step - 1)}
                className="text-sm text-muted hover:text-emerald-700 transition-colors"
              >
                Back
              </button>
            ) : <span />}

            <Button
              variant="primary"
              onClick={handleNext}
              loading={isPending}
              className="flex items-center gap-2"
            >
              {step === 3 ? 'Go to Dashboard' : step === 2 ? 'Finish setup' : 'Continue'}
              {step < 3 && <ChevronRight size={16} />}
            </Button>
          </div>
        </div>

        {step < 3 && (
          <button
            onClick={() => { if (step < 2) setStep(step + 1); else saveProfile(); }}
            className="w-full text-center text-sm text-muted hover:text-emerald-700 mt-4 transition-colors"
          >
            Skip for now
          </button>
        )}
      </div>
    </div>
  )
}
