import React, { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Users, Plus, Baby, Shield, Eye, Star, Heart,
  ChevronRight, BookOpen, Sun, Moon, Zap, Award
} from 'lucide-react'
import api from '../lib/api'
import { Card, Button, Input, Modal, Badge, EmptyState } from '../components/ui/index'
import toast from 'react-hot-toast'
import { clsx } from 'clsx'
import { motion, AnimatePresence } from 'framer-motion'

const TABS = [
  { id: 'overview', label: 'Family', icon: Users },
  { id: 'children', label: "Children's Mode", icon: Baby },
  { id: 'finance', label: 'Budget', icon: Zap },
]

/* ─── Children's Mode – bright, engaging UX ────────────────────── */
function ChildrenMode() {
  const [activeChild, setActiveChild] = useState(null)

  // Mock children for display (live data from existing /children endpoint)
  const { data: children } = useQuery({
    queryKey: ['children'],
    queryFn: () => api.get('/children').then(r => r.data).catch(() => []),
  })

  const mockActivities = [
    { id: 1, label: 'Learn a New Dua', icon: '🤲', color: 'from-emerald-400 to-emerald-600', xp: 20 },
    { id: 2, label: 'Read Quran', icon: '📖', color: 'from-amber-400 to-amber-600', xp: 30 },
    { id: 3, label: 'Morning Adhkar', icon: '🌅', color: 'from-blue-400 to-blue-600', xp: 15 },
    { id: 4, label: 'Salah Tracker', icon: '🕌', color: 'from-purple-400 to-purple-600', xp: 25 },
    { id: 5, label: 'Islamic Story', icon: '📚', color: 'from-pink-400 to-pink-600', xp: 20 },
    { id: 6, label: 'Good Deed', icon: '⭐', color: 'from-teal-400 to-teal-600', xp: 35 },
  ]

  const [earnedXP, setEarnedXP] = useState(0)
  const [celebrated, setCelebrated] = useState(null)

  const doActivity = (act) => {
    setEarnedXP(p => p + act.xp)
    setCelebrated(act)
    setTimeout(() => setCelebrated(null), 2500)
    toast.success(`MashaaAllah! +${act.xp} XP 🌟`, { icon: act.icon })
  }

  return (
    <div className="space-y-6">
      {/* Celebration overlay */}
      <AnimatePresence>
        {celebrated && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5 }}
            className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none"
          >
            <div className="text-center">
              <div className="text-8xl mb-4">{celebrated.icon}</div>
              <div className="text-3xl font-bold text-emerald-600">MashaaAllah!</div>
              <div className="text-xl text-amber-500 font-semibold">+{celebrated.xp} XP ⭐</div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header — bright, fun */}
      <div className="rounded-3xl p-6 bg-gradient-to-br from-emerald-400 via-emerald-500 to-teal-600 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-display font-bold text-2xl">Children's Corner 🌟</h2>
            <p className="text-emerald-100 text-sm mt-1">Learning Islam, one deed at a time!</p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold">{earnedXP}</div>
            <div className="text-emerald-100 text-xs">Total XP Today</div>
          </div>
        </div>
        {/* XP bar */}
        <div className="mt-4 h-3 bg-white/20 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-white rounded-full"
            animate={{ width: `${Math.min(100, (earnedXP / 200) * 100)}%` }}
            transition={{ type: 'spring', bounce: 0.3 }}
          />
        </div>
        <p className="text-emerald-100 text-xs mt-1">{200 - earnedXP} XP to next reward!</p>
      </div>

      {/* Select child */}
      {children?.length > 0 && (
        <div className="flex gap-3 overflow-x-auto pb-2">
          {children.map(child => (
            <button key={child.id} onClick={() => setActiveChild(child.id === activeChild ? null : child.id)}
              className={clsx('flex-shrink-0 flex flex-col items-center gap-2 p-3 rounded-2xl border-2 transition-all w-20',
                activeChild === child.id ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/30' : 'border-parchment-200 dark:border-emerald-900/40')}>
              <div className="text-3xl">{child.avatar_emoji}</div>
              <div className="text-xs font-medium text-emerald-900 dark:text-emerald-200 truncate w-full text-center">{child.name}</div>
            </button>
          ))}
        </div>
      )}

      {/* Activity Cards — large touch targets */}
      <div>
        <h3 className="font-display font-semibold text-lg text-emerald-900 dark:text-emerald-200 mb-3">Today's Activities</h3>
        <div className="grid grid-cols-2 gap-3">
          {mockActivities.map(act => (
            <motion.button
              key={act.id}
              whileTap={{ scale: 0.92 }}
              onClick={() => doActivity(act)}
              className={`relative p-5 rounded-3xl bg-gradient-to-br ${act.color} text-white text-center shadow-lg hover:shadow-xl transition-shadow`}
            >
              <div className="text-4xl mb-2">{act.icon}</div>
              <div className="font-semibold text-sm">{act.label}</div>
              <div className="text-xs opacity-80 mt-1">+{act.xp} XP</div>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Islamic Content for Kids */}
      <Card className="p-5 space-y-4">
        <h3 className="font-display font-semibold text-emerald-900 dark:text-emerald-200 flex items-center gap-2">
          <BookOpen size={18} /> Islamic Stories
        </h3>
        {[
          { title: 'The Story of Prophet Yusuf (AS)', age: '6+', duration: '5 min', icon: '🌙' },
          { title: 'Ibrahim (AS) and the Stars', age: '5+', duration: '4 min', icon: '⭐' },
          { title: 'The Companions of the Cave', age: '8+', duration: '7 min', icon: '🏔️' },
        ].map(story => (
          <div key={story.title} className="flex items-center gap-3 p-3 rounded-2xl bg-parchment-50 dark:bg-emerald-900/20">
            <div className="text-2xl">{story.icon}</div>
            <div className="flex-1">
              <div className="font-medium text-sm text-emerald-900 dark:text-emerald-200">{story.title}</div>
              <div className="text-xs text-muted">Age {story.age} · {story.duration}</div>
            </div>
            <Button variant="primary" size="sm" onClick={() => toast.success('Loading story...')}>
              Read
            </Button>
          </div>
        ))}
      </Card>

      {/* Parental Controls */}
      <Card className="p-5">
        <div className="flex items-center gap-2 mb-4">
          <Shield size={18} className="text-emerald-600" />
          <h3 className="font-display font-semibold text-emerald-900 dark:text-emerald-200">Parental Controls</h3>
          <Badge variant="green" className="text-xs ml-auto">Active</Badge>
        </div>
        <div className="space-y-3 text-sm">
          {[
            { label: 'Content filter', status: 'On', safe: true },
            { label: 'Screen time limit', status: '2h/day', safe: true },
            { label: 'Community access', status: 'Off', safe: true },
            { label: 'Weekly summary email', status: 'Enabled', safe: true },
          ].map(ctrl => (
            <div key={ctrl.label} className="flex items-center justify-between">
              <span className="text-muted">{ctrl.label}</span>
              <Badge variant={ctrl.safe ? 'green' : 'red'} className="text-xs">{ctrl.status}</Badge>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}

/* ─── Family Overview ───────────────────────────────────────────── */
function FamilyOverview() {
  const [createModal, setCreateModal] = useState(false)
  const [inviteModal, setInviteModal] = useState(false)
  const [form, setForm] = useState({ plan_type: 'standard' })
  const [inviteForm, setInviteForm] = useState({ user_id: '', account_type: 'adult' })

  const mockFamily = {
    id: '1',
    plan_type: 'Family Premium',
    members: [
      { id: 1, name: 'Ahmad (You)', account_type: 'adult', role: 'admin', xp: 2450, avatar: '👨' },
      { id: 2, name: 'Fatimah', account_type: 'adult', role: 'member', xp: 1870, avatar: '👩' },
      { id: 3, name: 'Ibrahim', account_type: 'teen', role: 'member', xp: 980, avatar: '👦' },
      { id: 4, name: 'Maryam', account_type: 'child', role: 'member', xp: 420, avatar: '👧' },
    ]
  }

  const ACCOUNT_TYPE_CONFIG = {
    adult: { color: 'green', label: 'Adult', icon: Users },
    teen: { color: 'blue', label: 'Teen (13-17)', icon: Star },
    child: { color: 'gold', label: 'Child (<13)', icon: Baby },
  }

  return (
    <div className="space-y-5">
      {/* Family Goal */}
      <div className="rounded-2xl p-5 bg-gradient-to-br from-emerald-800 to-emerald-950 text-white">
        <div className="flex items-center gap-2 mb-3">
          <Heart size={18} className="text-emerald-300" />
          <span className="font-semibold">Family Quran Goal</span>
        </div>
        <div className="flex items-end gap-2 mb-2">
          <span className="text-3xl font-bold">18</span>
          <span className="text-emerald-300 text-sm mb-1">/ 30 Juz completed together</span>
        </div>
        <div className="h-2 bg-white/20 rounded-full">
          <div className="h-full bg-emerald-400 rounded-full" style={{ width: '60%' }} />
        </div>
        <p className="text-emerald-300 text-xs mt-2">12 more Juz to complete a family Khatam 🎉</p>
      </div>

      {/* Members */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-display font-semibold text-emerald-900 dark:text-emerald-200">Family Members</h3>
          <Button variant="primary" size="sm" onClick={() => setInviteModal(true)}><Plus size={14} /> Invite</Button>
        </div>
        {mockFamily.members.map(m => (
          <Card key={m.id} className="p-4 flex items-center gap-4">
            <div className="text-3xl">{m.avatar}</div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-sm text-emerald-900 dark:text-emerald-200">{m.name}</span>
                {m.role === 'admin' && <Badge variant="gold" className="text-xs">Admin</Badge>}
              </div>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant={ACCOUNT_TYPE_CONFIG[m.account_type].color} className="text-xs">
                  {ACCOUNT_TYPE_CONFIG[m.account_type].label}
                </Badge>
                <span className="text-xs text-muted">⭐ {m.xp} XP</span>
              </div>
            </div>
            {m.role !== 'admin' && (
              <button className="text-muted hover:text-emerald-600 transition-colors">
                <Eye size={16} />
              </button>
            )}
          </Card>
        ))}
      </div>

      {/* Family Prayer Board */}
      <Card className="p-5">
        <h3 className="font-display font-semibold text-emerald-900 dark:text-emerald-200 mb-4">Family Prayer Board</h3>
        <div className="grid grid-cols-5 gap-2 text-center text-xs text-muted mb-2">
          {['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'].map(p => (
            <div key={p} className="font-medium">{p}</div>
          ))}
        </div>
        {mockFamily.members.map(m => (
          <div key={m.id} className="flex items-center gap-2 mb-2">
            <span className="text-sm text-emerald-900 dark:text-emerald-200 w-16 truncate text-xs">{m.name.split(' ')[0]}</span>
            <div className="grid grid-cols-5 gap-1 flex-1">
              {[true, true, true, false, true].map((prayed, i) => (
                <div key={i} className={clsx('h-6 rounded-lg', prayed ? 'bg-emerald-500' : 'bg-parchment-100 dark:bg-emerald-900/30')} />
              ))}
            </div>
          </div>
        ))}
      </Card>

      <Modal open={inviteModal} onClose={() => setInviteModal(false)} title="Invite Family Member">
        <div className="space-y-4">
          <Input label="Member's Email" placeholder="family@email.com"
            value={inviteForm.user_id} onChange={e => setInviteForm({ ...inviteForm, user_id: e.target.value })} />
          <div>
            <label className="label">Account Type</label>
            <div className="grid grid-cols-3 gap-2">
              {Object.entries(ACCOUNT_TYPE_CONFIG).map(([key, cfg]) => (
                <button key={key} onClick={() => setInviteForm({ ...inviteForm, account_type: key })}
                  className={clsx('p-3 rounded-xl border text-center text-xs font-medium transition-all',
                    inviteForm.account_type === key ? 'border-emerald-600 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-200' : 'border-parchment-200 dark:border-emerald-900/40 text-muted')}>
                  <div className="text-lg mb-1">{key === 'adult' ? '👨' : key === 'teen' ? '👦' : '👧'}</div>
                  {cfg.label}
                </button>
              ))}
            </div>
          </div>
          <div className="flex gap-3">
            <Button variant="secondary" className="flex-1" onClick={() => setInviteModal(false)}>Cancel</Button>
            <Button variant="primary" className="flex-1"
              onClick={() => { toast.success('Invitation sent!'); setInviteModal(false) }}
              disabled={!inviteForm.user_id}>
              Send Invite
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

/* ─── Personal Finance Tracker (Phase 8.6) ──────────────────────── */
function BudgetTracker() {
  const CATEGORIES = [
    { name: 'Necessities', pct: 50, color: 'bg-emerald-500', amount: 2500 },
    { name: 'Needs', pct: 30, color: 'bg-blue-500', amount: 1500 },
    { name: 'Charity (Sadaqah)', pct: 10, color: 'bg-amber-500', amount: 500 },
    { name: 'Savings / Investment', pct: 10, color: 'bg-purple-500', amount: 500 },
  ]

  const [income, setIncome] = useState('5000')

  return (
    <div className="space-y-5">
      {/* Barakah Budget */}
      <Card className="p-5 space-y-4">
        <div>
          <h3 className="font-display font-semibold text-lg text-emerald-900 dark:text-emerald-200">Barakah Budget</h3>
          <p className="text-sm text-muted">Islamic financial allocation — 50/30/10/10</p>
        </div>
        <Input label="Monthly Halal Income (USD)" type="number" value={income}
          onChange={e => setIncome(e.target.value)} placeholder="5000" />
        <div className="space-y-3">
          {CATEGORIES.map(cat => {
            const amount = ((parseFloat(income) || 0) * cat.pct) / 100
            return (
              <div key={cat.name} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-emerald-900 dark:text-emerald-200 font-medium">{cat.name}</span>
                  <span className="text-muted">{cat.pct}% · ${amount.toLocaleString()}</span>
                </div>
                <div className="h-2.5 bg-parchment-100 dark:bg-emerald-900/30 rounded-full overflow-hidden">
                  <motion.div className={`h-full ${cat.color} rounded-full`}
                    initial={{ width: 0 }} animate={{ width: `${cat.pct}%` }}
                    transition={{ duration: 0.8, delay: 0.1 }} />
                </div>
              </div>
            )
          })}
        </div>
      </Card>

      {/* Spending Alerts */}
      <Card className="p-5">
        <h3 className="font-display font-semibold text-emerald-900 dark:text-emerald-200 mb-3">
          ⚠️ Spending Alerts
        </h3>
        <div className="space-y-3 text-sm">
          {[
            { label: 'Entertainment', spent: 320, budget: 200, alert: true },
            { label: 'Dining Out', spent: 180, budget: 200, alert: false },
            { label: 'Subscriptions', spent: 95, budget: 100, alert: false },
          ].map(item => (
            <div key={item.label} className={clsx('p-3 rounded-xl', item.alert ? 'bg-red-50 dark:bg-red-900/10' : 'bg-parchment-50 dark:bg-emerald-900/20')}>
              <div className="flex items-center justify-between mb-1">
                <span className={item.alert ? 'text-red-700 dark:text-red-400 font-medium' : 'text-emerald-900 dark:text-emerald-200'}>{item.label}</span>
                <span className={item.alert ? 'text-red-600 text-xs font-bold' : 'text-muted text-xs'}>
                  ${item.spent} / ${item.budget}
                </span>
              </div>
              <div className="h-1.5 bg-parchment-200 dark:bg-emerald-900/30 rounded-full overflow-hidden">
                <div className={clsx('h-full rounded-full', item.alert ? 'bg-red-500' : 'bg-emerald-500')}
                  style={{ width: `${Math.min(100, (item.spent / item.budget) * 100)}%` }} />
              </div>
              {item.alert && <p className="text-xs text-red-500 mt-1">Over budget — remember, wasteful spending is disliked in Islam.</p>}
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-4 text-sm text-muted space-y-1">
        <p className="font-semibold text-emerald-900 dark:text-emerald-200">🌿 Islamic Economic Framework</p>
        <p>Allah's Messenger ﷺ said: "The upper hand is better than the lower hand." Earn halal, spend wisely, and give generously.</p>
      </Card>
    </div>
  )
}

/* ─── Main Family Page ──────────────────────────────────────────── */
export default function Family() {
  const [tab, setTab] = useState('overview')

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="page-title flex items-center gap-2">
          <Users size={26} className="text-emerald-600" /> Family & Home
        </h1>
        <p className="text-muted mt-1">Manage your family's spiritual journey together</p>
      </div>

      <div className="flex gap-1 p-1 bg-parchment-100 dark:bg-emerald-900/20 rounded-2xl mb-6">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={clsx('flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all flex-1 justify-center',
              tab === t.id ? 'bg-white dark:bg-emerald-800 text-emerald-900 dark:text-white shadow-sm' : 'text-parchment-500 hover:text-emerald-700')}>
            <t.icon size={15} /> {t.label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={tab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
          {tab === 'overview' && <FamilyOverview />}
          {tab === 'children' && <ChildrenMode />}
          {tab === 'finance' && <BudgetTracker />}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
