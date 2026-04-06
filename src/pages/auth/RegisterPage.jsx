import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { Eye, EyeOff, User, Users } from 'lucide-react'
import { authApi } from '../../lib/api'
import { useAuthStore } from '../../store/authStore'
import { Button, Input, Select } from '../../components/ui/index'
import { clsx } from 'clsx'
import toast from 'react-hot-toast'

const MADHABS = [
  { value: 'hanafi', label: 'Hanafi', region: 'South Asia, Central Asia, Turkey' },
  { value: 'shafii', label: "Shafi'i", region: 'East Africa, Southeast Asia' },
  { value: 'maliki', label: 'Maliki', region: 'West Africa, North Africa' },
  { value: 'hanbali', label: 'Hanbali', region: 'Arabian Peninsula' },
]

export default function RegisterPage() {
  const navigate = useNavigate()
  const { setAuth } = useAuthStore()
  const [form, setForm] = useState({
    email: '', password: '', gender: '', madhab: 'hanafi', timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  })
  const [showPwd, setShowPwd] = useState(false)
  const [errors, setErrors] = useState({})

  const { mutate, isPending } = useMutation({
    mutationFn: () => authApi.register(form),
    onSuccess: ({ data }) => {
      setAuth({ user: data.user, access_token: data.access_token, refresh_token: data.refresh_token })
      toast.success('Account created! Welcome to Deen 🌙')
      navigate('/onboarding')
    },
    onError: (err) => {
      const detail = err.response?.data?.detail
      if (typeof detail === 'string') setErrors({ general: detail })
      else setErrors({ general: 'Registration failed. Please try again.' })
    },
  })

  const validate = () => {
    const e = {}
    if (!form.email) e.email = 'Email is required.'
    if (form.password.length < 8) e.password = 'At least 8 characters.'
    if (!form.gender) e.gender = 'Please select your gender.'
    return e
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const e2 = validate()
    if (Object.keys(e2).length) return setErrors(e2)
    setErrors({})
    mutate()
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-parchment-50 dark:bg-emerald-950/20">
      <div className="w-full max-w-lg animate-fade-up">
        {/* Header */}
        <div className="flex items-center gap-3 mb-10">
          <div className="w-10 h-10 bg-gold-700 rounded-xl flex items-center justify-center">
            <span className="font-arabic text-white font-bold text-xl leading-none">د</span>
          </div>
          <span className="font-display text-emerald-900 dark:text-white font-semibold text-2xl">Deen</span>
        </div>

        <div className="mb-8">
          <h1 className="font-display text-3xl font-bold text-emerald-900 dark:text-white mb-2">
            Begin your journey
          </h1>
          <p className="text-parchment-600 dark:text-emerald-500">Free forever — no payment, no data selling.</p>
        </div>

        {errors.general && (
          <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
            {errors.general}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <Input
            label="Email address"
            type="email"
            placeholder="you@email.com"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            error={errors.email}
          />

          <div className="space-y-1.5">
            <label className="label">Password</label>
            <div className="relative">
              <input
                type={showPwd ? 'text' : 'password'}
                className={clsx('input pr-12', errors.password && 'border-red-400')}
                placeholder="Min. 8 characters, one uppercase, one number"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-parchment-500 hover:text-emerald-700"
                onClick={() => setShowPwd(!showPwd)}
              >
                {showPwd ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {errors.password && <p className="text-xs text-red-500">{errors.password}</p>}
          </div>

          {/* Gender */}
          <div className="space-y-2">
            <label className="label">Gender <span className="text-parchment-400">(affects some features)</span></label>
            <div className="grid grid-cols-3 gap-3">
              {[
                { value: 'male', icon: User, label: 'Male' },
                { value: 'female', icon: Users, label: 'Female' },
                { value: 'prefer_not_to_say', icon: null, label: 'Prefer not to say' },
              ].map(({ value, label }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setForm({ ...form, gender: value })}
                  className={clsx(
                    'px-3 py-3 rounded-xl text-sm font-medium border transition-all duration-150',
                    form.gender === value
                      ? 'bg-emerald-800 text-white border-emerald-800'
                      : 'border-parchment-300 dark:border-emerald-800 text-parchment-600 dark:text-emerald-500 hover:border-emerald-600'
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
            {errors.gender && <p className="text-xs text-red-500">{errors.gender}</p>}
          </div>

          {/* Madhab */}
          <div className="space-y-2">
            <label className="label">School of thought (Madhab)</label>
            <div className="grid grid-cols-2 gap-2">
              {MADHABS.map(({ value, label, region }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setForm({ ...form, madhab: value })}
                  className={clsx(
                    'px-3 py-3 rounded-xl text-left border transition-all duration-150',
                    form.madhab === value
                      ? 'bg-emerald-50 dark:bg-emerald-900/40 border-emerald-700 dark:border-emerald-600'
                      : 'border-parchment-300 dark:border-emerald-800 hover:border-emerald-500'
                  )}
                >
                  <p className={clsx('text-sm font-medium', form.madhab === value ? 'text-emerald-800 dark:text-emerald-200' : 'text-parchment-700 dark:text-emerald-400')}>{label}</p>
                  <p className="text-xs text-parchment-500 dark:text-emerald-600 mt-0.5">{region}</p>
                </button>
              ))}
            </div>
          </div>

          <Button type="submit" variant="primary" size="lg" loading={isPending} className="w-full mt-2">
            Create free account
          </Button>
        </form>

        <p className="mt-6 text-center text-parchment-600 dark:text-emerald-500 text-sm">
          Already have an account?{' '}
          <Link to="/login" className="text-emerald-700 dark:text-emerald-400 font-medium hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
