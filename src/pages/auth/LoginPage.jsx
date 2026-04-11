import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { Eye, EyeOff, Moon } from 'lucide-react'
import { authApi } from '../../lib/api'
import { useAuthStore } from '../../store/authStore'
import { Button, Input } from '../../components/ui/index'
import toast from 'react-hot-toast'

export default function LoginPage() {
  const navigate = useNavigate()
  const { setAuth } = useAuthStore()
  const [form, setForm] = useState({ email: '', password: '' })
  const [showPwd, setShowPwd] = useState(false)
  const [errors, setErrors] = useState({})

  const { mutate, isPending } = useMutation({
    mutationFn: () => authApi.login(form),
    onSuccess: ({ data }) => {
      setAuth({ user: data.user, access_token: data.access_token, refresh_token: data.refresh_token })
      toast.success('Welcome back! Assalamu Alaikum 🌙')
      navigate('/dashboard')
    },
    onError: (err) => {
      const msg = err.response?.data?.detail || 'Invalid email or password.'
      setErrors({ general: msg })
    },
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    setErrors({})
    if (!form.email) return setErrors({ email: 'Email is required.' })
    if (!form.password) return setErrors({ password: 'Password is required.' })
    mutate()
  }

  return (
    <div className="min-h-screen grid md:grid-cols-2">
      {/* Left — decorative panel */}
      <div className="hidden md:flex flex-col justify-between bg-emerald-950 p-12 relative overflow-hidden">
        {/* Islamic geometric pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="w-full h-full bg-geometric" />
        </div>

        {/* Crescent decoration */}
        <div className="absolute -top-20 -right-20 w-80 h-80 rounded-full border-[40px] border-emerald-800/30" />
        <div className="absolute -bottom-32 -left-12 w-96 h-96 rounded-full border-[60px] border-gold-800/20" />

        <div className="relative">
          <div className="flex items-center gap-3 mb-12">
            <div className="w-10 h-10 bg-gold-700 rounded-xl flex items-center justify-center">
              <span className="font-arabic text-white font-bold text-xl leading-none">د</span>
            </div>
            <span className="font-display text-white font-semibold text-2xl">Deen</span>
          </div>

          <div className="space-y-6">
            <h2 className="font-display text-4xl text-white font-bold leading-tight">
              Your Islamic<br />
              <span className="text-gold-400">Companion</span>
            </h2>
            <p className="text-emerald-300 text-lg leading-relaxed">
              Track your prayers, memorise Quran, build habits<br />
              and grow closer to Allah — free, forever.
            </p>
          </div>
        </div>

        {/* Testimonial */}
        <div className="relative bg-emerald-900/50 rounded-2xl p-6 border border-emerald-800/50">
          <p className="text-emerald-200 text-lg font-arabic text-right leading-loose mb-3">
            إِنَّ اللَّهَ مَعَ الصَّابِرِينَ
          </p>
          <p className="text-emerald-400 text-sm">"Indeed, Allah is with the patient." — Quran 2:153</p>
        </div>
      </div>

      {/* Right — form */}
      <div className="flex items-center justify-center p-8 bg-parchment-50 dark:bg-emerald-950/20">
        <div className="w-full max-w-sm animate-fade-up">
          {/* Mobile logo */}
          <div className="flex items-center gap-3 mb-10 md:hidden">
            <div className="w-9 h-9 bg-gold-700 rounded-xl flex items-center justify-center">
              <span className="font-arabic text-white font-bold text-lg leading-none">د</span>
            </div>
            <span className="font-display text-emerald-900 font-semibold text-xl">Deen</span>
          </div>

          <div className="mb-8">
            <h1 className="font-display text-3xl font-bold text-emerald-900 dark:text-white mb-2">
              Welcome back
            </h1>
            <p className="text-parchment-600 dark:text-emerald-500">Sign in to continue your journey</p>
          </div>

          {errors.general && (
            <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
              {errors.general}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <Input
              label="Email"
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
                  className="input pr-12"
                  placeholder="Your password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-parchment-500 hover:text-emerald-700 transition-colors"
                  onClick={() => setShowPwd(!showPwd)}
                >
                  {showPwd ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {errors.password && <p className="text-xs text-red-500">{errors.password}</p>}
            </div>

            <Button type="submit" variant="primary" size="lg" loading={isPending} className="w-full mt-2">
              Sign in
            </Button>
          </form>

          <p className="mt-6 text-center text-parchment-600 dark:text-emerald-500 text-sm">
            New to Deen?{' '}
            <Link to="/register" className="text-emerald-700 dark:text-emerald-400 font-medium hover:underline">
              Create a free account
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
