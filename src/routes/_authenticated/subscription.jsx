import React, { useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { Check, Zap, Heart, GraduationCap, Crown } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import toast from 'react-hot-toast'

export const Route = createFileRoute('/_authenticated/subscription')({
  component: SubscriptionPage,
})

const PLANS = [
  {
    id: 'free',
    name: 'Seeker',
    price: { monthly: 0, yearly: 0 },
    icon: Heart,
    color: 'from-slate-500 to-slate-700',
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
    color: 'from-primary to-emerald-700',
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
    color: 'from-gold to-amber-700',
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

function SubscriptionPage() {
  const [billing, setBilling] = useState('yearly')
  const [selected, setSelected] = useState('premium')
  const [showRegional, setShowRegional] = useState(false)

  const currentPlan = 'free'

  const handleSubscribe = (planId) => {
    if (planId === 'free') return
    toast.success('Redirecting to secure checkout...', { icon: '🔒' })
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 md:px-8 md:py-8 space-y-6">
      <div className="text-center space-y-4">
        <div>
          <h1 className="text-3xl font-semibold text-foreground mb-1">Choose Your Journey</h1>
          <p className="text-sm text-muted-foreground">Every plan includes a free tier. Cancel anytime.</p>
        </div>

        <div className="inline-flex bg-muted p-1 rounded-xl">
          <button onClick={() => setBilling('monthly')}
            className={cn('px-5 py-2 rounded-lg text-sm font-medium transition-all',
              billing === 'monthly' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground')}>
            Monthly
          </button>
          <button onClick={() => setBilling('yearly')}
            className={cn('flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-medium transition-all',
              billing === 'yearly' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground')}>
            Yearly <Badge variant="default" className="text-[10px] uppercase bg-green-500/20 text-green-700 hover:bg-green-500/20 px-1.5 border-0">Save 30%</Badge>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {PLANS.map(plan => {
          const price = billing === 'yearly' ? plan.price.yearly : plan.price.monthly
          const isActive = currentPlan === plan.id
          const isSelected = selected === plan.id

          return (
            <div key={plan.id} onClick={() => setSelected(plan.id)}
              className={cn('group relative overflow-hidden cursor-pointer rounded-3xl border-2 transition-all hover:-translate-y-1 hover:shadow-md',
                isSelected ? 'border-primary ring-4 ring-primary/10' : 'border-border')}>
              
              {plan.popular && (
                <div className="absolute top-0 inset-x-0 flex justify-center -translate-y-1/2 mt-3 z-10">
                  <span className="bg-primary text-primary-foreground text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full shadow-sm">
                    Most Popular
                  </span>
                </div>
              )}

              <div className={cn(`p-6 bg-gradient-to-br text-white`, plan.color)}>
                <div className="flex items-center justify-between mb-4">
                  <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm"><plan.icon className="h-5 w-5" /></div>
                  {isActive && <Badge variant="secondary" className="bg-white/20 text-white hover:bg-white/30 border-0">Current Plan</Badge>}
                </div>
                <h3 className="text-2xl font-bold">{plan.name}</h3>
                <p className="text-sm text-white/80 font-medium">{plan.description}</p>
                <div className="mt-4">
                  {price === 0 ? (
                    <span className="text-4xl font-bold">Free</span>
                  ) : (
                    <div className="flex items-end gap-1">
                      <span className="text-4xl font-bold">${price}</span>
                      <span className="text-sm text-white/80 mb-1">/{billing === 'yearly' ? 'yr' : 'mo'}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="p-6 bg-card space-y-3">
                {plan.features.map(f => (
                  <div key={f} className="flex items-start gap-2.5">
                    <Check className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                    <span className="text-sm text-foreground">{f}</span>
                  </div>
                ))}
                {plan.limits.length > 0 && <div className="h-px bg-border my-2" />}
                {plan.limits.map(l => (
                  <div key={l} className="flex items-start gap-2.5 text-muted-foreground">
                    <span className="h-4 w-4 flex items-center justify-center shrink-0 mt-0.5 text-[10px]">✕</span>
                    <span className="text-sm">{l}</span>
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>

      {selected !== 'free' && (
        <div className="max-w-md mx-auto space-y-4 pt-4">
          <Button size="lg" className="w-full text-base h-14" onClick={() => handleSubscribe(selected)}>
            Start {PLANS.find(p => p.id === selected)?.name} — ${billing === 'yearly' ? PLANS.find(p => p.id === selected)?.price.yearly : PLANS.find(p => p.id === selected)?.price.monthly}/{billing === 'yearly' ? 'yr' : 'mo'} 🔒
          </Button>
          <p className="text-center text-xs text-muted-foreground">
            Secure payment · Cancel anytime in Settings · No dark patterns
          </p>
        </div>
      )}

      <div className="pt-8">
        <button onClick={() => setShowRegional(!showRegional)} className="text-sm text-primary font-medium hover:underline mx-auto block">
          {showRegional ? 'Hide' : 'View'} regional pricing
        </button>
        
        {showRegional && (
          <Card className="mt-4 p-5">
            <h3 className="font-semibold text-sm text-foreground mb-4">Regional Pricing (Devoted Plan)</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {REGIONAL.map(r => (
                <div key={r.country} className="flex items-center justify-between text-sm p-3 rounded-xl bg-muted">
                  <span className="font-medium text-foreground">{r.country}</span>
                  <span className="text-muted-foreground text-xs">{r.price}</span>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>

      <div className="text-center pt-4">
        <p className="text-xs text-muted-foreground max-w-lg mx-auto leading-relaxed">
          Deen is built for the Ummah. We keep free features generous because spiritual tools should be accessible to all.
          Subscribers make that mission possible. BarakAllahu feekum.
        </p>
      </div>
    </div>
  )
}
