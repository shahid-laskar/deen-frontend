import React, { useState } from 'react'
import { Check, Zap, Heart, GraduationCap, Star, Crown } from 'lucide-react'
import { Card, Button, Badge } from '../components/ui/index'
import toast from 'react-hot-toast'
import { clsx } from 'clsx'
import { motion } from 'framer-motion'

const PLANS = [
  {
    id: 'free',
    name: 'Seeker',
    price: { monthly: 0, yearly: 0 },
    icon: Heart,
    color: 'from-slate-400 to-slate-600',
    description: 'Begin your journey',
    features: [
      'Prayer times & Qibla',
      'Basic Quran reader (1-10 Surah)',
      '3 habits',
      '3 journal entries / month',
      'Basic community feed',
      'Dua library (30 duas)',
    ],
    limits: ['Limited features', 'Ads supported'],
  },
  {
    id: 'premium',
    name: 'Devoted',
    price: { monthly: 6.99, yearly: 59.99 },
    icon: Zap,
    color: 'from-emerald-500 to-emerald-700',
    description: 'Full spiritual toolkit',
    popular: true,
    features: [
      'Everything in Seeker',
      'Full Quran + Audio (5 reciters)',
      'Unlimited habits & journal',
      'Hifz management + spaced repetition',
      'Scholar Q&A access',
      'Gamification (40 levels, quests)',
      'Learning Hub (5 paths)',
      'AI Journal Companion',
      'Zakat calculator',
      'All 12 themes + wallpapers',
      'E2E journal encryption',
      'GDPR data export',
    ],
    limits: [],
  },
  {
    id: 'family',
    name: 'Family',
    price: { monthly: 11.99, yearly: 99.99 },
    icon: Crown,
    color: 'from-amber-500 to-amber-700',
    description: 'Up to 6 family members',
    features: [
      'Everything in Devoted',
      'Up to 6 family accounts',
      'Children\'s mode & parental controls',
      'Family prayer board',
      'Family Quran goal (shared ring)',
      'Parental weekly email report',
      'Adult / Teen / Child account types',
    ],
    limits: [],
  },
  {
    id: 'student',
    name: 'Student',
    price: { monthly: 2.99, yearly: 24.99 },
    icon: GraduationCap,
    color: 'from-blue-500 to-blue-700',
    description: 'With .edu email verification',
    features: [
      'All Devoted features',
      'Requires student email verification',
      'Renews annually',
    ],
    limits: ['Student verification required'],
  },
]

const REGIONAL = [
  { country: '🇮🇳 India', price: '₹299/mo or ₹2,499/yr' },
  { country: '🇵🇰 Pakistan', price: '₨1,500/mo or ₨12,999/yr' },
  { country: '🇮🇩 Indonesia', price: 'Rp79,000/mo or Rp599,000/yr' },
  { country: '🇧🇩 Bangladesh', price: '৳499/mo or ৳3,999/yr' },
  { country: '🇳🇬 Nigeria', price: '₦4,999/mo or ₦39,999/yr' },
  { country: '🇲🇾 Malaysia', price: 'RM19/mo or RM159/yr' },
]

export default function Subscription() {
  const [billing, setBilling] = useState('yearly')
  const [selected, setSelected] = useState('premium')
  const [showRegional, setShowRegional] = useState(false)

  const currentPlan = 'free' // Would come from auth store

  const handleSubscribe = (planId) => {
    if (planId === 'free') return
    toast.success('Redirecting to secure checkout...', { icon: '🔒' })
    // In production: redirect to Stripe payment page
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <h1 className="font-display font-bold text-3xl text-emerald-900 dark:text-emerald-200 mb-2">
          Choose Your Journey
        </h1>
        <p className="text-muted">Every plan includes a free tier. No dark patterns. Cancel anytime — one tap.</p>

        {/* Billing toggle */}
        <div className="inline-flex items-center gap-1 p-1 bg-parchment-100 dark:bg-emerald-900/20 rounded-2xl mt-4">
          <button onClick={() => setBilling('monthly')}
            className={clsx('px-5 py-2 rounded-xl text-sm font-medium transition-all', billing === 'monthly' ? 'bg-white dark:bg-emerald-800 text-emerald-900 dark:text-white shadow-sm' : 'text-muted')}>
            Monthly
          </button>
          <button onClick={() => setBilling('yearly')}
            className={clsx('flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-medium transition-all', billing === 'yearly' ? 'bg-white dark:bg-emerald-800 text-emerald-900 dark:text-white shadow-sm' : 'text-muted')}>
            Yearly <Badge variant="green" className="text-xs">Save up to 30%</Badge>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        {PLANS.map(plan => {
          const price = billing === 'yearly' ? plan.price.yearly : plan.price.monthly
          const isActive = currentPlan === plan.id
          const isSelected = selected === plan.id

          return (
            <motion.div key={plan.id} whileHover={{ y: -2 }} onClick={() => setSelected(plan.id)}
              className={clsx('relative cursor-pointer rounded-3xl border-2 transition-all', isSelected ? 'border-emerald-500' : 'border-parchment-200 dark:border-emerald-900/40')}>
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge variant="green" className="text-xs px-3 py-1">⭐ Most Popular</Badge>
                </div>
              )}
              <div className={`p-5 rounded-t-3xl bg-gradient-to-br ${plan.color} text-white`}>
                <div className="flex items-center justify-between mb-3">
                  <plan.icon size={24} />
                  {isActive && <Badge variant="white" className="text-xs">Current Plan</Badge>}
                </div>
                <h3 className="font-display font-bold text-xl">{plan.name}</h3>
                <p className="text-sm opacity-80">{plan.description}</p>
                <div className="mt-3">
                  {price === 0 ? (
                    <span className="text-3xl font-bold">Free</span>
                  ) : (
                    <div>
                      <span className="text-3xl font-bold">${price}</span>
                      <span className="text-sm opacity-80">/{billing === 'yearly' ? 'yr' : 'mo'}</span>
                    </div>
                  )}
                </div>
              </div>
              <div className="p-5 bg-white dark:bg-emerald-950 rounded-b-3xl space-y-2">
                {plan.features.map(f => (
                  <div key={f} className="flex items-start gap-2 text-sm">
                    <Check size={14} className="text-emerald-500 flex-shrink-0 mt-0.5" />
                    <span className="text-emerald-800 dark:text-emerald-300">{f}</span>
                  </div>
                ))}
                {plan.limits.map(l => (
                  <div key={l} className="flex items-start gap-2 text-xs text-muted">
                    <span className="flex-shrink-0">·</span> {l}
                  </div>
                ))}
              </div>
            </motion.div>
          )
        })}
      </div>

      {/* CTA */}
      {selected !== 'free' && (
        <div className="max-w-md mx-auto space-y-4">
          <Button variant="primary" className="w-full text-base py-4" onClick={() => handleSubscribe(selected)}>
            <span>Start {PLANS.find(p => p.id === selected)?.name} — </span>
            <span>${billing === 'yearly' ? PLANS.find(p => p.id === selected)?.price.yearly : PLANS.find(p => p.id === selected)?.price.monthly}/{billing === 'yearly' ? 'yr' : 'mo'}</span>
            <span className="ml-2">🔒</span>
          </Button>
          <p className="text-center text-xs text-muted">
            Secure payment · Cancel anytime via one button in Settings · No dark patterns
          </p>
        </div>
      )}

      {/* Regional pricing */}
      <div className="mt-8">
        <button onClick={() => setShowRegional(!showRegional)}
          className="text-sm text-emerald-600 hover:underline mx-auto block">
          {showRegional ? '▲ Hide' : '▼ See'} regional pricing
        </button>
        {showRegional && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}>
            <Card className="mt-4 p-5">
              <h3 className="font-semibold text-sm text-emerald-900 dark:text-emerald-200 mb-3">Regional Pricing (Devoted Plan)</h3>
              <div className="grid grid-cols-2 gap-2">
                {REGIONAL.map(r => (
                  <div key={r.country} className="flex items-center justify-between text-sm p-2 rounded-xl bg-parchment-50 dark:bg-emerald-900/20">
                    <span className="text-emerald-900 dark:text-emerald-200">{r.country}</span>
                    <span className="text-muted text-xs">{r.price}</span>
                  </div>
                ))}
              </div>
            </Card>
          </motion.div>
        )}
      </div>

      <p className="text-center text-xs text-muted mt-6">
        Deen is built for the ummah. We keep free features generous because spiritual tools should be accessible to all.
        <br />Subscribers make that mission possible. BarakAllahu feekum.
      </p>
    </div>
  )
}
