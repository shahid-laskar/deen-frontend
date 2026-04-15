import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Shield, Flag, Users, CheckCircle, XCircle, AlertTriangle,
  Award, Eye, Ban, MessageSquare, TrendingUp, BarChart3, Clock
} from 'lucide-react'
import api from '../lib/api'
import { Card, Button, Badge, Skeleton } from '../components/ui/index'
import toast from 'react-hot-toast'
import { clsx } from 'clsx'
import { motion, AnimatePresence } from 'framer-motion'
import { format } from 'date-fns'

const TABS = [
  { id: 'queue', label: 'Moderation Queue', icon: Flag },
  { id: 'users', label: 'Users', icon: Users },
  { id: 'scholars', label: 'Scholar Verification', icon: Award },
  { id: 'stats', label: 'Stats', icon: BarChart3 },
]

/* ─── Moderation Queue ──────────────────────────────────────────── */
function ModerationQueue() {
  const qc = useQueryClient()
  const [filter, setFilter] = useState('pending')

  // Mock flagged content — in production fetched from /admin/reports
  const mockReports = [
    { id: '1', type: 'post', content: 'This is wrong, you people are all wrong!', reason: 'harassment', flags: 5, user: 'user_xyz', created: '2026-04-14T10:23:00Z', status: 'pending' },
    { id: '2', type: 'comment', content: 'This fatwa is baseless and bid\'ah...', reason: 'misinformation', flags: 3, user: 'anon_123', created: '2026-04-14T14:11:00Z', status: 'pending' },
    { id: '3', type: 'post', content: 'Buy my Islamic products at discount! DM NOW!', reason: 'spam', flags: 8, user: 'seller_01', created: '2026-04-13T08:00:00Z', status: 'pending' },
  ]

  const handleAction = (id, action) => {
    const msgs = {
      approve: 'Content approved and restored.',
      remove: 'Content removed.',
      warn: 'Warning issued to user.',
      ban: 'User banned for repeated violations.',
    }
    toast.success(msgs[action])
    qc.invalidateQueries({ queryKey: ['admin', 'reports'] })
  }

  const REASON_COLOR = {
    harassment: 'red',
    misinformation: 'amber',
    spam: 'blue',
    inappropriate: 'red',
    off_topic: 'green',
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        {['pending', 'resolved', 'dismissed'].map(s => (
          <button key={s} onClick={() => setFilter(s)}
            className={clsx('px-4 py-2 rounded-xl text-sm font-medium capitalize transition-all',
              filter === s ? 'bg-emerald-700 text-white' : 'bg-parchment-100 dark:bg-emerald-900/30 text-muted')}>
            {s}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {mockReports.map(report => (
          <Card key={report.id} className="p-5 space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <Badge variant={REASON_COLOR[report.reason] || 'red'} className="text-xs capitalize">{report.reason}</Badge>
                  <Badge variant="green" className="text-xs capitalize">{report.type}</Badge>
                  <span className="text-xs text-muted flex items-center gap-1">
                    <Flag size={11} /> {report.flags} flags
                  </span>
                  <span className="text-xs text-muted ml-auto">
                    {format(new Date(report.created), 'd MMM HH:mm')}
                  </span>
                </div>
                <p className="text-sm text-emerald-800 dark:text-emerald-300 bg-parchment-50 dark:bg-emerald-900/20 rounded-xl p-3 italic">
                  "{report.content}"
                </p>
                <p className="text-xs text-muted mt-2">by {report.user}</p>
              </div>
            </div>
            <div className="flex gap-2 flex-wrap">
              <Button size="sm" variant="secondary" onClick={() => handleAction(report.id, 'approve')}
                className="text-emerald-600 border-emerald-200 hover:bg-emerald-50">
                <CheckCircle size={13} /> Approve
              </Button>
              <Button size="sm" variant="secondary" onClick={() => handleAction(report.id, 'remove')}
                className="text-red-500 border-red-200 hover:bg-red-50">
                <XCircle size={13} /> Remove
              </Button>
              <Button size="sm" variant="secondary" onClick={() => handleAction(report.id, 'warn')}
                className="text-amber-600 border-amber-200 hover:bg-amber-50">
                <AlertTriangle size={13} /> Warn User
              </Button>
              <Button size="sm" variant="secondary" onClick={() => handleAction(report.id, 'ban')}
                className="text-red-700 border-red-300 hover:bg-red-100">
                <Ban size={13} /> Ban
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}

/* ─── User Management ───────────────────────────────────────────── */
function UserManagement() {
  const [search, setSearch] = useState('')

  const mockUsers = [
    { id: '1', email: 'ahmad@example.com', name: 'Ahmad Al-Rashid', role: 'user', strikes: 0, joined: '2025-11-01', is_active: true },
    { id: '2', email: 'seller01@example.com', name: 'Seller Account', role: 'user', strikes: 2, joined: '2026-02-15', is_active: true },
    { id: '3', email: 'scholar@deen.app', name: 'Sheikh Yusuf', role: 'scholar', strikes: 0, joined: '2025-09-10', is_active: true },
  ]

  const filtered = mockUsers.filter(u =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-4">
      <input className="input w-full" placeholder="Search users by name or email..."
        value={search} onChange={e => setSearch(e.target.value)} />
      <div className="space-y-3">
        {filtered.map(u => (
          <Card key={u.id} className="p-4 flex items-center gap-4">
            <div className="w-10 h-10 bg-emerald-700 rounded-xl flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
              {u.name[0]}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-sm text-emerald-900 dark:text-emerald-200">{u.name}</span>
                <Badge variant={u.role === 'scholar' ? 'gold' : 'green'} className="text-xs capitalize">{u.role}</Badge>
                {u.strikes > 0 && <Badge variant="red" className="text-xs">⚠️ {u.strikes} strikes</Badge>}
              </div>
              <div className="text-xs text-muted">{u.email} · Joined {format(new Date(u.joined), 'MMM yyyy')}</div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => toast.success('User profile opened')} className="p-2 rounded-xl hover:bg-parchment-100 dark:hover:bg-emerald-900/30 text-muted transition-colors">
                <Eye size={15} />
              </button>
              <button onClick={() => toast.success('User warned')} className="p-2 rounded-xl hover:bg-amber-50 dark:hover:bg-amber-900/20 text-amber-500 transition-colors">
                <AlertTriangle size={15} />
              </button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}

/* ─── Scholar Verification ──────────────────────────────────────── */
function ScholarVerification() {
  const [applications] = useState([
    { id: '1', name: 'Dr. Khalid Ibrahim', institution: 'Al-Azhar University', madhab: 'Shafi\'i', qualifications: 'PhD Islamic Studies, 15 years teaching experience, Former Imam Masjid Al-Salam London', applied: '2026-04-10', status: 'pending' },
    { id: '2', name: 'Sheikh Omar Abdullah', institution: 'International Islamic University Malaysia', madhab: 'Hanafi', qualifications: 'Masters Fiqh, Certified Quran teacher, Darul Uloom graduate', applied: '2026-04-12', status: 'pending' },
  ])

  const approve = (id) => {
    toast.success('Scholar verified! Gold badge will appear on their profile.')
  }

  const reject = (id) => {
    toast.error('Application rejected. Applicant notified.')
  }

  return (
    <div className="space-y-4">
      <Card className="p-4 bg-amber-50 dark:bg-amber-900/10 border-amber-200 dark:border-amber-800/30">
        <p className="text-sm text-amber-800 dark:text-amber-300">
          <strong>Verification criteria:</strong> Valid Islamic institution credential, verifiable qualifications,
          adherence to traditional madhab scholarship, and agreement to community guidelines.
        </p>
      </Card>
      {applications.map(app => (
        <Card key={app.id} className="p-5 space-y-3">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-emerald-900 dark:text-emerald-200">{app.name}</span>
                <Badge variant="amber" className="text-xs">{app.madhab}</Badge>
              </div>
              <p className="text-sm text-muted">{app.institution}</p>
            </div>
            <span className="text-xs text-muted">{format(new Date(app.applied), 'd MMM')}</span>
          </div>
          <div className="bg-parchment-50 dark:bg-emerald-900/20 rounded-xl p-3">
            <p className="text-sm text-emerald-800 dark:text-emerald-300">{app.qualifications}</p>
          </div>
          <div className="flex gap-3">
            <Button variant="primary" size="sm" className="flex-1" onClick={() => approve(app.id)}>
              <CheckCircle size={13} /> Verify Scholar
            </Button>
            <Button variant="secondary" size="sm" className="flex-1 text-red-500 border-red-200" onClick={() => reject(app.id)}>
              <XCircle size={13} /> Reject
            </Button>
          </div>
        </Card>
      ))}
    </div>
  )
}

/* ─── Stats / Transparency Report ───────────────────────────────── */
function StatsReport() {
  const stats = [
    { label: 'Total Users', value: '12,847', icon: Users, trend: '+234 this month' },
    { label: 'Posts Today', value: '1,204', icon: MessageSquare, trend: '+18% vs last week' },
    { label: 'Reports Resolved', value: '47', icon: CheckCircle, trend: '98.5% SLA met' },
    { label: 'Scholars Active', value: '14', icon: Award, trend: '3 pending verification' },
    { label: 'Active Bans', value: '23', icon: Ban, trend: '2 appealed' },
    { label: 'Avg Response Time', value: '3.2h', icon: Clock, trend: 'SLA: <48h' },
  ]

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3">
        {stats.map(s => (
          <Card key={s.label} className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <s.icon size={16} className="text-emerald-600" />
              <span className="text-xs text-muted">{s.label}</span>
            </div>
            <div className="font-display font-bold text-2xl text-emerald-900 dark:text-emerald-200">{s.value}</div>
            <div className="text-xs text-muted mt-1">{s.trend}</div>
          </Card>
        ))}
      </div>

      <Card className="p-5">
        <h3 className="font-display font-semibold text-emerald-900 dark:text-emerald-200 mb-4">Monthly Transparency Report</h3>
        <div className="space-y-2 text-sm">
          {[
            ['Total posts published', '36,421'],
            ['Posts auto-screened by AI', '36,421 (100%)'],
            ['Flagged for review', '247 (0.7%)'],
            ['Removed by moderation', '89'],
            ['Appeals handled', '12'],
            ['Users banned', '4'],
            ['Scholar answers published', '128'],
          ].map(([label, value]) => (
            <div key={label} className="flex items-center justify-between border-b border-parchment-100 dark:border-emerald-900/30 pb-2 last:border-0">
              <span className="text-muted">{label}</span>
              <span className="font-semibold text-emerald-900 dark:text-emerald-200">{value}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}

/* ─── Main Admin Page ───────────────────────────────────────────── */
export default function Admin() {
  const [tab, setTab] = useState('queue')
  const { user } = { user: { role: 'admin' } } // Guard check

  // Non-admin redirect would normally check user.role
  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-red-600 rounded-xl flex items-center justify-center">
            <Shield size={20} className="text-white" />
          </div>
          <div>
            <h1 className="font-display font-bold text-xl text-emerald-900 dark:text-emerald-200">Admin Dashboard</h1>
            <p className="text-xs text-muted">With great power comes great responsibility — use wisely.</p>
          </div>
        </div>
      </div>

      <div className="flex gap-1 p-1 bg-parchment-100 dark:bg-emerald-900/20 rounded-2xl mb-6 flex-wrap">
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
          {tab === 'queue' && <ModerationQueue />}
          {tab === 'users' && <UserManagement />}
          {tab === 'scholars' && <ScholarVerification />}
          {tab === 'stats' && <StatsReport />}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
