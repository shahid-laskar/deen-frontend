import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Globe, ChevronRight, ChevronLeft, Check, MapPin, BookOpen, Target, Star, Loader2 } from 'lucide-react'
import { useAuthStore } from '../../store/authStore'
import api from '../../lib/api'
import i18n from '../../lib/i18n'
import { clsx } from 'clsx'

// ─── Data ─────────────────────────────────────────────────────────────────────

const LANGUAGES = [
  { code: 'en', label: 'English',  native: 'English',  flag: '🇬🇧' },
  { code: 'ar', label: 'Arabic',   native: 'العربية',  flag: '🇸🇦', dir: 'rtl' },
  { code: 'ur', label: 'Urdu',     native: 'اردو',     flag: '🇵🇰', dir: 'rtl' },
  { code: 'ml', label: 'Malayalam',native: 'മലയാളം',   flag: '🇮🇳' },
  { code: 'fr', label: 'French',   native: 'Français', flag: '🇫🇷' },
]

const MADHABS = [
  { id: 'hanafi',  label: 'Hanafi',  desc: 'Followed in South Asia, Turkey, Central Asia' },
  { id: 'maliki',  label: 'Maliki',  desc: 'Followed in North & West Africa, Andalusia' },
  { id: 'shafii',  label: "Shafi'i", desc: 'Followed in East Africa, Southeast Asia' },
  { id: 'hanbali', label: 'Hanbali', desc: 'Followed in the Arabian Peninsula' },
]

const PRAYER_METHODS = [
  { id: 'MWL',        label: 'Muslim World League', regions: 'Europe, Far East, parts of USA' },
  { id: 'ISNA',       label: 'ISNA (North America)', regions: 'USA, Canada' },
  { id: 'Egypt',      label: 'Egyptian General Authority', regions: 'Egypt, Africa' },
  { id: 'Makkah',     label: 'Umm al-Qura, Makkah', regions: 'Saudi Arabia' },
  { id: 'Karachi',    label: 'University of Islamic Sciences, Karachi', regions: 'Pakistan, Bangladesh' },
  { id: 'Tehran',     label: 'Institute of Geophysics, Tehran', regions: 'Iran' },
  { id: 'Singapore',  label: 'Majlis Ugama Islam Singapura', regions: 'Singapore' },
]

// ─── Archetype Quiz ──────────────────────────────────────────────────────────

const QUIZ_QUESTIONS = [
  {
    id: 'q1',
    question: 'After Fajr, you feel most drawn to:',
    options: [
      { label: 'Reading a page of Quran',  scores: { scholar: 2, devotee: 1 } },
      { label: 'Long dhikr and du\'a',      scores: { devotee: 2, seeker: 1 } },
      { label: 'Planning my day intentionally', scores: { guardian: 2, scholar: 1 } },
      { label: 'Helping someone before work', scores: { servant: 2, guardian: 1 } },
    ],
  },
  {
    id: 'q2',
    question: 'The Islamic achievement that moves you most:',
    options: [
      { label: 'Completing memorisation of the Quran', scores: { scholar: 2, devotee: 1 } },
      { label: 'Consistent Tahajjud for a whole year',  scores: { devotee: 2, seeker: 1 } },
      { label: 'Raising children with strong iman',     scores: { guardian: 2, servant: 1 } },
      { label: 'Building a waqf that outlives you',     scores: { servant: 2, guardian: 1 } },
    ],
  },
  {
    id: 'q3',
    question: 'When you feel spiritually distant, you:',
    options: [
      { label: 'Go back to the Quran and tafsir',    scores: { scholar: 2, seeker: 1 } },
      { label: 'Increase worship and seclusion',      scores: { devotee: 2, scholar: 1 } },
      { label: 'Talk to a trusted Muslim friend',     scores: { seeker: 2, servant: 1 } },
      { label: 'Volunteer and give to the community', scores: { servant: 2, guardian: 1 } },
    ],
  },
]

const ARCHETYPES = {
  scholar:  { label: 'The Scholar',  emoji: '📚', desc: 'Your path is knowledge. You seek to understand Islam deeply and share its wisdom.' },
  devotee:  { label: 'The Devotee',  emoji: '🌙', desc: 'Your path is worship. You are drawn to the depth of prayer, dhikr, and closeness to Allah.' },
  seeker:   { label: 'The Seeker',   emoji: '🌿', desc: 'Your path is growth. You are on a journey of self-improvement and spiritual development.' },
  guardian: { label: 'The Guardian', emoji: '🏡', desc: 'Your path is family. You protect and nurture the faith of those around you.' },
  servant:  { label: 'The Servant',  emoji: '🤝', desc: 'Your path is service. You find Allah in serving the ummah.' },
}

// ─── Starter Habits ──────────────────────────────────────────────────────────

const STARTER_HABITS = [
  { id: 'quran_daily',     icon: '📖', name: 'Read Quran daily',     desc: '10 min/day', category: 'quran' },
  { id: 'fajr_ontime',     icon: '🌅', name: 'Pray Fajr on time',    desc: 'Before sunrise', category: 'prayer' },
  { id: 'morning_adhkar',  icon: '📿', name: 'Morning adhkar',       desc: '5 min after Fajr', category: 'dhikr' },
  { id: 'evening_adhkar',  icon: '🌆', name: 'Evening adhkar',       desc: '5 min before Maghrib', category: 'dhikr' },
  { id: 'sadaqah_friday',  icon: '💚', name: 'Friday sadaqah',       desc: 'Give something every Jumu\'ah', category: 'charity' },
  { id: 'night_prayer',    icon: '⭐', name: 'Pray 2 raka\'at Tahajjud', desc: '3x/week', category: 'prayer' },
  { id: 'sunnah_fasts',    icon: '🌙', name: 'Monday/Thursday fast', desc: '2x/week', category: 'fasting' },
  { id: 'gratitude_3',     icon: '✨', name: '3 things I\'m grateful for', desc: 'Nightly journal', category: 'journal' },
]

// ─── Animation variants ──────────────────────────────────────────────────────

const slideVariants = {
  enter:  (dir) => ({ x: dir > 0 ?  60 : -60, opacity: 0 }),
  center: { x: 0, opacity: 1, transition: { duration: 0.28, ease: [0.4, 0, 0.2, 1] } },
  exit:   (dir) => ({ x: dir > 0 ? -60 :  60, opacity: 0, transition: { duration: 0.2 } }),
}

// ─── Shared step wrapper ──────────────────────────────────────────────────────

function StepWrap({ children, dir }) {
  return (
    <motion.div
      variants={slideVariants}
      custom={dir}
      initial="enter"
      animate="center"
      exit="exit"
      className="w-full"
    >
      {children}
    </motion.div>
  )
}

// ─── Individual steps ─────────────────────────────────────────────────────────

function Step0Welcome({ dir }) {
  return (
    <StepWrap dir={dir}>
      <div className="flex flex-col items-center text-center py-8">
        {/* Animated mosque silhouette */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className="mb-8"
        >
          <svg width="200" height="140" viewBox="0 0 200 140" fill="none">
            {/* Main dome */}
            <ellipse cx="100" cy="75" rx="38" ry="38" fill="var(--t-accent)" opacity="0.9" />
            {/* Minaret left */}
            <rect x="22" y="40" width="18" height="80" rx="3" fill="var(--t-primary)" />
            <ellipse cx="31" cy="40" rx="10" ry="12" fill="var(--t-primary)" />
            {/* Minaret right */}
            <rect x="160" y="40" width="18" height="80" rx="3" fill="var(--t-primary)" />
            <ellipse cx="169" cy="40" rx="10" ry="12" fill="var(--t-primary)" />
            {/* Crescent on main dome */}
            <motion.g
              initial={{ opacity: 0, rotate: -20 }}
              animate={{ opacity: 1, rotate: 0 }}
              transition={{ delay: 0.4, duration: 0.6 }}
              style={{ transformOrigin: '100px 37px' }}
            >
              <path d="M100 32 A10 10 0 1 1 100 52 A6 6 0 1 0 100 32Z" fill="var(--t-accent)" />
              <polygon points="100,24 102,31 98,31" fill="var(--t-accent)" />
            </motion.g>
            {/* Door */}
            <rect x="88" y="95" width="24" height="25" rx="12" fill="var(--t-bg)" opacity="0.5" />
            {/* Base */}
            <rect x="10" y="118" width="180" height="4" rx="2" fill="var(--t-primary)" opacity="0.4" />
            {/* Stars */}
            {[[30, 25], [165, 18], [50, 15], [145, 30]].map(([x, y], i) => (
              <motion.circle
                key={i}
                cx={x} cy={y} r="2"
                fill="var(--t-accent)"
                animate={{ opacity: [1, 0.3, 1] }}
                transition={{ duration: 2 + i * 0.5, repeat: Infinity, delay: i * 0.3 }}
              />
            ))}
          </svg>
        </motion.div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}>
          <div className="font-arabic text-3xl mb-3" style={{ color: 'var(--t-accent)' }}>
            بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
          </div>
          <h1 className="font-display text-3xl font-bold mb-3" style={{ color: 'var(--t-text)' }}>
            Welcome to Deen
          </h1>
          <p className="text-base max-w-xs mx-auto" style={{ color: 'var(--t-text-muted)' }}>
            Your privacy-first Islamic lifestyle companion. Free forever. Built for the ummah.
          </p>
        </motion.div>
      </div>
    </StepWrap>
  )
}

function Step1Language({ data, setData, dir }) {
  return (
    <StepWrap dir={dir}>
      <h2 className="font-display text-2xl font-bold mb-2" style={{ color: 'var(--t-text)' }}>
        Choose your language
      </h2>
      <p className="mb-6" style={{ color: 'var(--t-text-muted)' }}>
        اختر لغتك / Choose your language
      </p>
      <div className="space-y-3">
        {LANGUAGES.map(lang => (
          <button
            key={lang.code}
            onClick={() => { setData({ language: lang.code }); i18n.changeLanguage(lang.code) }}
            className={clsx(
              'w-full flex items-center gap-4 px-5 py-4 rounded-xl border text-left transition-all',
              data.language === lang.code
                ? 'border-[--t-primary] ring-2 ring-[--t-primary]/20'
                : 'border-[--t-border]'
            )}
            style={{
              background: data.language === lang.code ? 'var(--t-bg-input)' : 'var(--t-bg-card)',
              borderColor: data.language === lang.code ? 'var(--t-primary)' : 'var(--t-border)',
            }}
          >
            <span className="text-3xl">{lang.flag}</span>
            <div>
              <div className="font-medium" style={{ color: 'var(--t-text)' }}>{lang.native}</div>
              <div className="text-xs" style={{ color: 'var(--t-text-muted)' }}>{lang.label}</div>
            </div>
            {data.language === lang.code && (
              <Check size={18} className="ml-auto" style={{ color: 'var(--t-primary)' }} />
            )}
          </button>
        ))}
      </div>
    </StepWrap>
  )
}

function Step2Profile({ data, setData, dir }) {
  const COUNTRIES = ['Saudi Arabia', 'India', 'Pakistan', 'Indonesia', 'Malaysia', 'Egypt', 'Turkey', 'Nigeria', 'United Kingdom', 'United States', 'Other']
  return (
    <StepWrap dir={dir}>
      <h2 className="font-display text-2xl font-bold mb-2" style={{ color: 'var(--t-text)' }}>
        Tell us about yourself
      </h2>
      <p className="mb-6" style={{ color: 'var(--t-text-muted)' }}>
        This helps personalise your experience
      </p>
      <div className="space-y-4">
        <div>
          <label className="label">Your name</label>
          <input
            className="input"
            placeholder="How should we address you?"
            value={data.displayName || ''}
            onChange={e => setData({ displayName: e.target.value })}
          />
        </div>
        <div>
          <label className="label">Gender</label>
          <div className="grid grid-cols-2 gap-3">
            {['male', 'female'].map(g => (
              <button
                key={g}
                onClick={() => setData({ gender: g })}
                className={clsx('py-3 rounded-xl text-sm font-medium border capitalize transition-all')}
                style={{
                  background: data.gender === g ? 'var(--t-primary)' : 'var(--t-bg-card)',
                  color: data.gender === g ? 'white' : 'var(--t-text)',
                  borderColor: data.gender === g ? 'var(--t-primary)' : 'var(--t-border)',
                }}
              >{g}</button>
            ))}
          </div>
        </div>
        <div>
          <label className="label">Country</label>
          <select className="input" value={data.country || ''} onChange={e => setData({ country: e.target.value })}>
            <option value="">Select country</option>
            {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label className="label">City (optional)</label>
          <input
            className="input"
            placeholder="Your city"
            value={data.city || ''}
            onChange={e => setData({ city: e.target.value })}
          />
        </div>
      </div>
    </StepWrap>
  )
}

function Step3Quiz({ data, setData, dir }) {
  const [answers, setAnswers] = useState({})

  const computeArchetype = () => {
    const scores = { scholar: 0, devotee: 0, seeker: 0, guardian: 0, servant: 0 }
    Object.values(answers).forEach(opt => {
      if (opt?.scores) Object.entries(opt.scores).forEach(([k, v]) => { scores[k] = (scores[k] || 0) + v })
    })
    return Object.entries(scores).sort((a, b) => b[1] - a[1])[0][0]
  }

  useEffect(() => {
    if (Object.keys(answers).length === QUIZ_QUESTIONS.length) {
      const archetype = computeArchetype()
      setData({ spiritualArchetype: archetype, quizAnswers: answers })
    }
  }, [answers])

  const allAnswered = Object.keys(answers).length === QUIZ_QUESTIONS.length

  return (
    <StepWrap dir={dir}>
      <h2 className="font-display text-2xl font-bold mb-1" style={{ color: 'var(--t-text)' }}>
        Your spiritual archetype
      </h2>
      <p className="mb-6" style={{ color: 'var(--t-text-muted)' }}>
        3 quick questions to personalise your experience
      </p>
      <div className="space-y-6">
        {QUIZ_QUESTIONS.map((q, qi) => (
          <div key={q.id}>
            <p className="text-sm font-medium mb-3" style={{ color: 'var(--t-text)' }}>
              {qi + 1}. {q.question}
            </p>
            <div className="space-y-2">
              {q.options.map((opt, oi) => {
                const selected = answers[q.id] === opt
                return (
                  <button
                    key={oi}
                    onClick={() => setAnswers(a => ({ ...a, [q.id]: opt }))}
                    className="w-full text-left px-4 py-3 rounded-xl text-sm border transition-all"
                    style={{
                      background: selected ? 'var(--t-bg-input)' : 'var(--t-bg-card)',
                      borderColor: selected ? 'var(--t-primary)' : 'var(--t-border)',
                      color: 'var(--t-text)',
                    }}
                  >
                    {selected && <Check size={14} className="inline mr-2" style={{ color: 'var(--t-primary)' }} />}
                    {opt.label}
                  </button>
                )
              })}
            </div>
          </div>
        ))}
        {allAnswered && data.spiritualArchetype && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-xl p-4 border"
            style={{ background: 'var(--t-bg-input)', borderColor: 'var(--t-accent)' }}
          >
            <div className="text-2xl mb-1">{ARCHETYPES[data.spiritualArchetype]?.emoji}</div>
            <div className="font-display font-bold" style={{ color: 'var(--t-accent)' }}>
              {ARCHETYPES[data.spiritualArchetype]?.label}
            </div>
            <div className="text-xs mt-1" style={{ color: 'var(--t-text-muted)' }}>
              {ARCHETYPES[data.spiritualArchetype]?.desc}
            </div>
          </motion.div>
        )}
      </div>
    </StepWrap>
  )
}

function Step4Prayer({ data, setData, dir }) {
  return (
    <StepWrap dir={dir}>
      <h2 className="font-display text-2xl font-bold mb-2" style={{ color: 'var(--t-text)' }}>
        Prayer calculation
      </h2>
      <p className="mb-5" style={{ color: 'var(--t-text-muted)' }}>
        Select the authority that your local mosque follows
      </p>
      <div className="space-y-2.5">
        {PRAYER_METHODS.map(m => (
          <button
            key={m.id}
            onClick={() => setData({ prayerMethod: m.id })}
            className="w-full text-left px-4 py-3.5 rounded-xl border transition-all"
            style={{
              background: data.prayerMethod === m.id ? 'var(--t-bg-input)' : 'var(--t-bg-card)',
              borderColor: data.prayerMethod === m.id ? 'var(--t-primary)' : 'var(--t-border)',
            }}
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium" style={{ color: 'var(--t-text)' }}>{m.label}</span>
              {data.prayerMethod === m.id && <Check size={16} style={{ color: 'var(--t-primary)' }} />}
            </div>
            <div className="text-xs mt-0.5" style={{ color: 'var(--t-text-muted)' }}>{m.regions}</div>
          </button>
        ))}
      </div>
    </StepWrap>
  )
}

function Step5Madhab({ data, setData, dir }) {
  return (
    <StepWrap dir={dir}>
      <h2 className="font-display text-2xl font-bold mb-2" style={{ color: 'var(--t-text)' }}>
        Your madhab
      </h2>
      <p className="mb-5" style={{ color: 'var(--t-text-muted)' }}>
        This shapes fiqh guidance and female health rulings throughout the app
      </p>
      <div className="grid grid-cols-2 gap-3">
        {MADHABS.map(m => (
          <button
            key={m.id}
            onClick={() => setData({ madhab: m.id })}
            className="text-left px-4 py-4 rounded-xl border transition-all"
            style={{
              background: data.madhab === m.id ? 'var(--t-primary)' : 'var(--t-bg-card)',
              borderColor: data.madhab === m.id ? 'var(--t-primary)' : 'var(--t-border)',
              color: data.madhab === m.id ? 'white' : 'var(--t-text)',
            }}
          >
            <div className="font-display font-bold text-lg mb-0.5">{m.label}</div>
            <div className="text-xs opacity-75">{m.desc}</div>
          </button>
        ))}
      </div>
      <p className="text-xs mt-4" style={{ color: 'var(--t-text-muted)' }}>
        You can change this later in Settings → Profile.
      </p>
    </StepWrap>
  )
}

function Step6Habits({ data, setData, dir }) {
  const selected = data.starterHabits || []
  const toggle = (id) => {
    const next = selected.includes(id) ? selected.filter(x => x !== id) : [...selected, id]
    if (next.length <= 3) setData({ starterHabits: next })
  }
  return (
    <StepWrap dir={dir}>
      <h2 className="font-display text-2xl font-bold mb-1" style={{ color: 'var(--t-text)' }}>
        Start with 3 habits
      </h2>
      <p className="mb-5" style={{ color: 'var(--t-text-muted)' }}>
        Small, consistent actions build a life of worship. Choose 3 to begin.
      </p>
      <div className="space-y-2.5">
        {STARTER_HABITS.map(h => {
          const on = selected.includes(h.id)
          const disabled = !on && selected.length >= 3
          return (
            <button
              key={h.id}
              onClick={() => toggle(h.id)}
              disabled={disabled}
              className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl border text-left transition-all"
              style={{
                background: on ? 'var(--t-bg-input)' : 'var(--t-bg-card)',
                borderColor: on ? 'var(--t-accent)' : 'var(--t-border)',
                opacity: disabled ? 0.4 : 1,
              }}
            >
              <span className="text-xl">{h.icon}</span>
              <div className="flex-1">
                <div className="text-sm font-medium" style={{ color: 'var(--t-text)' }}>{h.name}</div>
                <div className="text-xs" style={{ color: 'var(--t-text-muted)' }}>{h.desc}</div>
              </div>
              <div
                className="w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0"
                style={{
                  background: on ? 'var(--t-accent)' : 'transparent',
                  borderColor: on ? 'var(--t-accent)' : 'var(--t-border-strong)',
                }}
              >
                {on && <Check size={11} color="white" />}
              </div>
            </button>
          )
        })}
      </div>
      <p className="text-xs text-center mt-3" style={{ color: 'var(--t-text-muted)' }}>
        {selected.length}/3 selected
      </p>
    </StepWrap>
  )
}

function Step7Ready({ data, dir }) {
  const archetype = ARCHETYPES[data.spiritualArchetype] || ARCHETYPES.seeker
  return (
    <StepWrap dir={dir}>
      <div className="flex flex-col items-center text-center py-6">
        {/* Animated entry */}
        <motion.div
          initial={{ scale: 0.4, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', damping: 14, stiffness: 200 }}
          className="text-6xl mb-5"
        >
          {archetype.emoji}
        </motion.div>
        <motion.h2
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="font-display text-2xl font-bold mb-3"
          style={{ color: 'var(--t-text)' }}
        >
          Your spiritual home is ready
        </motion.h2>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.35 }}
          className="space-y-3 w-full max-w-xs"
        >
          <div className="rounded-xl p-4 border" style={{ background: 'var(--t-bg-card)', borderColor: 'var(--t-border)' }}>
            <div className="text-sm font-medium mb-1" style={{ color: 'var(--t-accent)' }}>Your archetype</div>
            <div className="font-display font-bold" style={{ color: 'var(--t-text)' }}>{archetype.label}</div>
            <div className="text-xs mt-1" style={{ color: 'var(--t-text-muted)' }}>{archetype.desc}</div>
          </div>
          {data.starterHabits?.length > 0 && (
            <div className="rounded-xl p-4 border" style={{ background: 'var(--t-bg-card)', borderColor: 'var(--t-border)' }}>
              <div className="text-sm font-medium mb-2" style={{ color: 'var(--t-accent)' }}>Your starting habits</div>
              {data.starterHabits.map(id => {
                const h = STARTER_HABITS.find(h => h.id === id)
                return h ? (
                  <div key={id} className="flex items-center gap-2 text-sm" style={{ color: 'var(--t-text)' }}>
                    <span>{h.icon}</span> {h.name}
                  </div>
                ) : null
              })}
            </div>
          )}
          <div className="font-arabic text-xl py-2" style={{ color: 'var(--t-accent)' }}>
            بسم الله، توكلت على الله
          </div>
        </motion.div>
      </div>
    </StepWrap>
  )
}

// ─── Main Onboarding ─────────────────────────────────────────────────────────

const STEPS = [
  { id: 'welcome',   title: 'Welcome',           skipable: true  },
  { id: 'language',  title: 'Language',           skipable: false },
  { id: 'profile',   title: 'Profile',            skipable: false },
  { id: 'quiz',      title: 'Archetype',          skipable: false },
  { id: 'prayer',    title: 'Prayer Method',      skipable: false },
  { id: 'madhab',    title: 'Madhab',             skipable: false },
  { id: 'habits',    title: 'Starter Habits',     skipable: true  },
  { id: 'ready',     title: 'Ready!',             skipable: false },
]

export default function OnboardingV2() {
  const [step,    setStep]    = useState(0)
  const [dir,     setDir]     = useState(1)
  const [saving,  setSaving]  = useState(false)
  const [data,    setDataRaw] = useState({
    language:         'en',
    displayName:      '',
    gender:           'male',
    country:          '',
    city:             '',
    madhab:           'hanafi',
    prayerMethod:     'MWL',
    spiritualArchetype: null,
    starterHabits:    [],
  })

  const { setAuth, updateUser } = useAuthStore()
  const navigate = useNavigate()

  const setData = (updates) => setDataRaw(d => ({ ...d, ...updates }))

  const go = (delta) => {
    const next = step + delta
    if (next < 0 || next >= STEPS.length) return
    setDir(delta)
    setStep(next)
  }

  const finish = async () => {
    setSaving(true)
    try {
      // Save profile
      await api.patch('/users/me', {
        gender: data.gender,
        madhab: data.madhab,
      })
      await api.patch('/users/me/profile', {
        display_name: data.displayName || undefined,
        city:         data.city || undefined,
        country:      data.country || undefined,
        spiritual_archetype: data.spiritualArchetype || undefined,
      })
      // Mark onboarding complete
      await api.post('/users/me/complete-onboarding', {})
      // Track analytics
      try {
        await api.post('/users/me/onboarding-analytics', {
          archetype:     data.spiritualArchetype,
          language:      data.language,
          madhab:        data.madhab,
          prayer_method: data.prayerMethod,
          habits_count:  data.starterHabits.length,
        })
      } catch {} // non-critical
      // Refresh user
      const me = await api.get('/users/me')
      updateUser(me.data)
      navigate('/dashboard')
    } catch (e) {
      // If endpoints don't exist yet, just navigate
      navigate('/dashboard')
    } finally {
      setSaving(false)
    }
  }

  const isLast    = step === STEPS.length - 1
  const isFirst   = step === 0
  const progress  = ((step) / (STEPS.length - 1)) * 100

  const stepComponents = [
    <Step0Welcome dir={dir} />,
    <Step1Language data={data} setData={setData} dir={dir} />,
    <Step2Profile  data={data} setData={setData} dir={dir} />,
    <Step3Quiz     data={data} setData={setData} dir={dir} />,
    <Step4Prayer   data={data} setData={setData} dir={dir} />,
    <Step5Madhab   data={data} setData={setData} dir={dir} />,
    <Step6Habits   data={data} setData={setData} dir={dir} />,
    <Step7Ready    data={data} dir={dir} />,
  ]

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: 'var(--t-bg)' }}
    >
      {/* Progress bar */}
      <div className="h-1 w-full" style={{ background: 'var(--t-border)' }}>
        <motion.div
          className="h-full"
          style={{ background: 'var(--t-accent)' }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.3 }}
        />
      </div>

      {/* Step counter */}
      <div className="flex items-center justify-between px-6 py-4">
        <div className="flex gap-1.5">
          {STEPS.map((_, i) => (
            <div
              key={i}
              className="h-1.5 rounded-full transition-all duration-300"
              style={{
                width: i === step ? '20px' : '6px',
                background: i <= step ? 'var(--t-accent)' : 'var(--t-border)',
              }}
            />
          ))}
        </div>
        <span className="text-xs" style={{ color: 'var(--t-text-muted)' }}>
          {step + 1} / {STEPS.length}
        </span>
      </div>

      {/* Step content */}
      <div className="flex-1 px-6 pb-4 overflow-hidden">
        <AnimatePresence custom={dir} mode="wait">
          <React.Fragment key={step}>
            {stepComponents[step]}
          </React.Fragment>
        </AnimatePresence>
      </div>

      {/* Navigation */}
      <div className="px-6 pb-8 pt-3 flex gap-3" style={{ borderTop: `0.5px solid var(--t-border)` }}>
        {!isFirst && (
          <button
            onClick={() => go(-1)}
            className="flex items-center gap-1 px-4 py-3.5 rounded-xl text-sm font-medium border"
            style={{
              borderColor: 'var(--t-border)',
              color: 'var(--t-text-muted)',
              background: 'transparent',
            }}
          >
            <ChevronLeft size={16} /> Back
          </button>
        )}
        <button
          onClick={isLast ? finish : () => go(1)}
          disabled={saving}
          className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-medium text-white transition-all active:scale-95"
          style={{ background: 'var(--t-primary)' }}
        >
          {saving ? (
            <><Loader2 size={16} className="animate-spin" /> Setting up your account…</>
          ) : isLast ? (
            <>Enter Deen <Star size={16} /></>
          ) : (
            <>Continue <ChevronRight size={16} /></>
          )}
        </button>
      </div>
    </div>
  )
}
