import React, { useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { Palette, User, Globe, Bell, Lock, Check, Shield, Crown, Download } from 'lucide-react'
import api from '../lib/api'
import { useAuthStore } from '../store/authStore'
import { useThemeStore, FONT_OPTIONS, TEXT_SCALES, LINE_HEIGHTS } from '../store/themeStore'
import { THEME_LIST } from '../themes/themes'
import { Card, Button, Input, Toggle } from '../components/ui/index'
import toast from 'react-hot-toast'

const TABS = [
  { id: 'appearance',    label: 'Appearance',    icon: Palette },
  { id: 'profile',       label: 'Profile',       icon: User },
  { id: 'prayer',        label: 'Prayer',        icon: Globe },
  { id: 'notifications', label: 'Alerts',        icon: Bell },
  { id: 'privacy',       label: 'Privacy',       icon: Lock },
  { id: 'subscription',  label: 'Plan',          icon: Crown },
]

function ThemeGrid({ themeId, setTheme }) {
  return (
    <div className="grid grid-cols-3 gap-3">
      {THEME_LIST.map(theme => {
        const active = themeId === theme.id
        return (
          <button key={theme.id} onClick={() => setTheme(theme.id)}
            className="relative rounded-xl overflow-hidden border-2 transition-all text-left"
            style={{ borderColor: active ? 'var(--t-accent)' : 'var(--t-border)' }} title={theme.name}>
            <div className="h-10 w-full" style={{ background: `linear-gradient(135deg, ${theme.preview[0]}, ${theme.preview[1]}, ${theme.preview[2]})` }} />
            <div className="px-2 py-1" style={{ background: theme.vars['--t-bg-card'] }}>
              <p className="text-[10px] font-medium truncate" style={{ color: theme.vars['--t-text'] }}>{theme.name}</p>
            </div>
            {active && <div className="absolute top-1 right-1 w-4 h-4 rounded-full flex items-center justify-center" style={{ background: 'var(--t-accent)' }}><Check size={9} color="white" /></div>}
          </button>
        )
      })}
    </div>
  )
}

function AppearanceTab() {
  const store = useThemeStore()
  const { themeId, setTheme, typography, setTypography, autoDarkAfterMaghrib, toggleAutoDark } = store

  return (
    <div className="space-y-8">
      <section>
        <h3 className="font-display font-semibold mb-3" style={{ color: 'var(--t-text)' }}>Theme — {THEME_LIST.length} built-in</h3>
        <ThemeGrid themeId={themeId} setTheme={setTheme} />
      </section>
      <section>
        <h3 className="font-display font-semibold mb-3" style={{ color: 'var(--t-text)' }}>Automatic</h3>
        <Card className="space-y-4">
          <div className="flex items-center justify-between">
            <div><p className="text-sm font-medium" style={{ color: 'var(--t-text)' }}>Dark after Maghrib</p><p className="text-xs" style={{ color: 'var(--t-text-muted)' }}>Switches to dark theme after sunset</p></div>
            <Toggle checked={autoDarkAfterMaghrib} onChange={e => toggleAutoDark(e.target.checked)} />
          </div>
          <div className="flex items-center justify-between" style={{ borderTop: '0.5px solid var(--t-border)', paddingTop: 12 }}>
            <div><p className="text-sm font-medium" style={{ color: 'var(--t-text)' }}>Seasonal themes</p><p className="text-xs" style={{ color: 'var(--t-text-muted)' }}>Auto-activate for Ramadan, Eid, Dhul Hijjah</p></div>
            <Toggle checked={useThemeStore.getState().seasonalEnabled} onChange={e => useThemeStore.setState({ seasonalEnabled: e.target.checked })} />
          </div>
        </Card>
      </section>
      <section className="space-y-5">
        <h3 className="font-display font-semibold" style={{ color: 'var(--t-text)' }}>Typography</h3>
        <div>
          <p className="text-sm font-medium mb-2" style={{ color: 'var(--t-text)' }}>Font</p>
          <div className="grid grid-cols-2 gap-2">
            {Object.entries(FONT_OPTIONS).slice(0,6).map(([key, opt]) => (
              <button key={key} onClick={() => setTypography({ fontFamily: key })}
                className="px-3 py-2.5 rounded-xl text-sm text-left border transition-all"
                style={{ fontFamily: `'${key}',system-ui`, background: typography.fontFamily === key ? 'var(--t-bg-input)' : 'var(--t-bg-card)', borderColor: typography.fontFamily === key ? 'var(--t-primary)' : 'var(--t-border)', color: 'var(--t-text)' }}>
                <div className="font-medium">{opt.label}</div>
                <div className="text-[10px] opacity-60">Aa Bb — بسم الله</div>
              </button>
            ))}
          </div>
        </div>
        <div>
          <p className="text-sm font-medium mb-2" style={{ color: 'var(--t-text)' }}>Text size</p>
          <div className="flex gap-2 flex-wrap">
            {Object.entries(TEXT_SCALES).map(([key, opt]) => (
              <button key={key} onClick={() => setTypography({ textScale: key })} className="px-4 py-2 rounded-xl text-sm border transition-all"
                style={{ background: typography.textScale === key ? 'var(--t-primary)' : 'var(--t-bg-card)', borderColor: typography.textScale === key ? 'var(--t-primary)' : 'var(--t-border)', color: typography.textScale === key ? 'white' : 'var(--t-text)' }}>{opt.label}</button>
            ))}
          </div>
        </div>
        <div>
          <p className="text-sm font-medium mb-2" style={{ color: 'var(--t-text)' }}>Line height</p>
          <div className="flex gap-2 flex-wrap">
            {Object.entries(LINE_HEIGHTS).map(([key, opt]) => (
              <button key={key} onClick={() => setTypography({ lineHeight: key })} className="px-4 py-2 rounded-xl text-sm border transition-all"
                style={{ background: typography.lineHeight === key ? 'var(--t-primary)' : 'var(--t-bg-card)', borderColor: typography.lineHeight === key ? 'var(--t-primary)' : 'var(--t-border)', color: typography.lineHeight === key ? 'white' : 'var(--t-text)' }}>{opt.label}</button>
            ))}
          </div>
        </div>
        <div>
          <p className="text-sm font-medium mb-2" style={{ color: 'var(--t-text)' }}>Quran font size</p>
          <div className="flex items-center gap-4">
            <input type="range" min="0.8" max="2" step="0.1" value={typography.quranScale}
              onChange={e => setTypography({ quranScale: parseFloat(e.target.value) })} className="flex-1" />
            <span className="text-sm font-mono w-12" style={{ color: 'var(--t-text)' }}>{Math.round(typography.quranScale * 100)}%</span>
          </div>
          <div className="font-arabic text-center py-3 rounded-xl mt-2" style={{ background: 'var(--t-bg-card)', border: '0.5px solid var(--t-border)' }}>
            بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
          </div>
        </div>
      </section>
    </div>
  )
}

function ProfileTab() {
  const { user, updateUser } = useAuthStore()
  const [form, setForm] = useState({ display_name: user?.profile?.display_name || '', city: user?.profile?.city || '', country: user?.profile?.country || '' })
  const { mutate: save, isPending } = useMutation({
    mutationFn: () => api.patch('/users/me/profile', form),
    onSuccess: () => { updateUser({ ...user, profile: { ...user.profile, ...form } }); toast.success('Profile updated!') },
  })
  return (
    <div className="space-y-4">
      <Input label="Display name" value={form.display_name} onChange={e => setForm({ ...form, display_name: e.target.value })} />
      <Input label="City" value={form.city} onChange={e => setForm({ ...form, city: e.target.value })} />
      <Input label="Country" value={form.country} onChange={e => setForm({ ...form, country: e.target.value })} />
      <Button variant="primary" onClick={() => save()} loading={isPending} className="w-full">Save changes</Button>
    </div>
  )
}

function PrayerTab() {
  const { user, updateUser } = useAuthStore()
  const [form, setForm] = useState({
    city: user?.profile?.city || '',
    country: user?.profile?.country || '',
    madhab: user?.madhab || 'shafi',
    calculation_method: user?.prayer_method || 2, // ISNA
    latitude: user?.latitude || '',
    longitude: user?.longitude || '',
  })
  const [detecting, setDetecting] = useState(false)

  const handleDetect = () => {
    setDetecting(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setForm(prev => ({
          ...prev,
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude
        }))
        setDetecting(false)
        toast.success('Coordinates detected!')
      },
      (err) => {
        console.error(err)
        toast.error('Could not get position. Check permissions.')
        setDetecting(false)
      }
    )
  }

  const { mutate: save, isPending } = useMutation({
    mutationFn: async () => {
      // Update profile bits
      await api.patch('/users/me/profile', { city: form.city, country: form.country })
      // Update user bits
      const res = await api.patch('/users/me', {
        madhab: form.madhab,
        prayer_method: `${form.calculation_method}`,
        latitude: form.latitude ? parseFloat(form.latitude) : null,
        longitude: form.longitude ? parseFloat(form.longitude) : null,
      })
      return res.data
    },
    onSuccess: (updatedUser) => {
      updateUser(updatedUser)
      toast.success('Prayer settings updated!')
    },
    onError: () => toast.error('Failed to update prayer settings')
  })

  return (
    <div className="space-y-6">
      <Card>
        <h3 className="font-display font-semibold mb-4" style={{ color: 'var(--t-text)' }}>Location settings</h3>
        <div className="space-y-4">
          <Input label="City" value={form.city} onChange={e => setForm({ ...form, city: e.target.value })} placeholder="e.g. London" />
          <Input label="Country" value={form.country} onChange={e => setForm({ ...form, country: e.target.value })} placeholder="e.g. United Kingdom" />
          <div className="pt-2">
            <p className="text-sm font-medium mb-2" style={{ color: 'var(--t-text)' }}>Coordinates</p>
            <div className="flex items-center gap-2 mb-2">
              <Input placeholder="Latitude" value={form.latitude} onChange={e => setForm({ ...form, latitude: e.target.value })} className="flex-1" />
              <Input placeholder="Longitude" value={form.longitude} onChange={e => setForm({ ...form, longitude: e.target.value })} className="flex-1" />
            </div>
            <Button size="sm" onClick={handleDetect} loading={detecting} className="w-full bg-blue-500/10 text-blue-500 border border-blue-500/20">
              📍 Auto-Detect Location
            </Button>
            <p className="text-xs mt-2" style={{ color: 'var(--t-text-muted)' }}>Coordinates are heavily required to fetch extremely accurate timings for offline processing and calculations.</p>
          </div>
        </div>
      </Card>
      
      <Card>
        <h3 className="font-display font-semibold mb-4" style={{ color: 'var(--t-text)' }}>Calculation methods</h3>
        <div className="space-y-4">
          <div>
            <p className="text-sm font-medium mb-1" style={{ color: 'var(--t-text)' }}>Asr Madhab</p>
            <select className="w-full px-3 py-2.5 rounded-xl border text-sm"
              style={{ background: 'var(--t-bg-input)', borderColor: 'var(--t-border)', color: 'var(--t-text)' }}
              value={form.madhab} onChange={e => setForm({ ...form, madhab: e.target.value })}>
              <option value="shafi">Standard (Shafi'i, Maliki, Hanbali)</option>
              <option value="hanafi">Hanafi</option>
            </select>
          </div>
          <div>
            <p className="text-sm font-medium mb-1" style={{ color: 'var(--t-text)' }}>Calculation Authority</p>
            <select className="w-full px-3 py-2.5 rounded-xl border text-sm"
              style={{ background: 'var(--t-bg-input)', borderColor: 'var(--t-border)', color: 'var(--t-text)' }}
              value={form.calculation_method} onChange={e => setForm({ ...form, calculation_method: e.target.value })}>
              <option value="1">University of Islamic Sciences, Karachi</option>
              <option value="2">Islamic Society of North America (ISNA)</option>
              <option value="3">Muslim World League</option>
              <option value="4">Umm Al-Qura University, Makkah</option>
              <option value="5">Egyptian General Authority of Survey</option>
              <option value="7">Institute of Geophysics, University of Tehran</option>
              <option value="12">Union Organization islamic de France</option>
              <option value="13">Diyanet İşleri Başkanlığı, Turkey</option>
            </select>
          </div>
        </div>
      </Card>
      
      <Button variant="primary" onClick={() => save()} loading={isPending} className="w-full">Save Prayer Settings</Button>
    </div>
  )
}

function NotificationsTab() {
  const [prefs, setPrefs] = useState({
    prayer_adhan: true, prayer_pre_adhan: true, prayer_qada_reminder: true,
    quran_daily_reminder: true, hifz_review_due: true, habit_streaks: true,
    islamic_calendar: true, zakat_reminders: true, journal_wellbeing: true,
    community_replies: true, dnd_start: '22:00', dnd_end: '07:00',
  })

  const { mutate: save, isPending } = useMutation({
    mutationFn: () => api.put('/notifications/preferences', prefs),
    onSuccess: () => toast.success('Notification preferences saved!'),
  })

  const toggle = (key) => setPrefs(p => ({ ...p, [key]: !p[key] }))

  const GROUPS = [
    { label: 'Prayer', keys: ['prayer_adhan', 'prayer_pre_adhan', 'prayer_qada_reminder'], labels: ['Adhan reminder', 'Pre-adhan (10 min)', 'Missed prayer reminder'] },
    { label: 'Quran & Hifz', keys: ['quran_daily_reminder', 'hifz_review_due'], labels: ['Daily Quran reminder', 'Hifz review due'] },
    { label: 'Habits & Streaks', keys: ['habit_streaks'], labels: ['Habit streak alerts'] },
    { label: 'Islamic Calendar', keys: ['islamic_calendar', 'zakat_reminders'], labels: ['Ramadan, Eid & events', 'Zakat hawl reminder'] },
    { label: 'Wellbeing', keys: ['journal_wellbeing', 'community_replies'], labels: ['Journal nudges', 'Community replies'] },
  ]

  return (
    <div className="space-y-6">
      {GROUPS.map(group => (
        <Card key={group.label} className="space-y-0">
          <p className="text-xs font-semibold uppercase tracking-wider text-emerald-600 mb-3">{group.label}</p>
          {group.keys.map((key, i) => (
            <div key={key} className="flex items-center justify-between py-3 border-b last:border-0" style={{ borderColor: 'var(--t-border)' }}>
              <span className="text-sm" style={{ color: 'var(--t-text)' }}>{group.labels[i]}</span>
              <Toggle checked={prefs[key]} onChange={() => toggle(key)} />
            </div>
          ))}
        </Card>
      ))}
      <Card className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-wider text-emerald-600">Do Not Disturb</p>
        <p className="text-xs" style={{ color: 'var(--t-text-muted)' }}>Prayer adhan will always override DND.</p>
        <div className="flex gap-3">
          <div className="flex-1">
            <label className="label text-xs">DND Start</label>
            <input type="time" className="input" value={prefs.dnd_start} onChange={e => setPrefs(p => ({ ...p, dnd_start: e.target.value }))} />
          </div>
          <div className="flex-1">
            <label className="label text-xs">DND End</label>
            <input type="time" className="input" value={prefs.dnd_end} onChange={e => setPrefs(p => ({ ...p, dnd_end: e.target.value }))} />
          </div>
        </div>
      </Card>
      <Button variant="primary" className="w-full" onClick={() => save()} loading={isPending}>Save Alert Settings</Button>
    </div>
  )
}

function PrivacyTab() {
  const { logout } = useAuthStore()
  const [analyticsOptOut, setAnalyticsOptOut] = useState(false)
  const [exportPending, setExportPending] = useState(false)

  const requestExport = async () => {
    setExportPending(true)
    try {
      await api.post('/user/data-export')
      toast.success('✅ Export queued! You\'ll receive a download link within 10 minutes.')
    } catch { toast.error('Export failed. Please try again.') }
    finally { setExportPending(false) }
  }

  const deleteAccount = () => {
    if (window.confirm('This will permanently delete your account after 30 days. Are you sure?')) {
      api.delete('/user/account').then(() => { toast.success('Account scheduled for deletion.'); logout() })
    }
  }

  return (
    <div className="space-y-6">
      <Card className="space-y-4">
        <p className="text-xs font-semibold uppercase tracking-wider text-emerald-600">Analytics</p>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium" style={{ color: 'var(--t-text)' }}>Usage analytics</p>
            <p className="text-xs" style={{ color: 'var(--t-text-muted)' }}>Anonymous usage data to improve the app. No PII ever shared.</p>
          </div>
          <Toggle checked={!analyticsOptOut} onChange={() => setAnalyticsOptOut(p => !p)} />
        </div>
      </Card>

      <Card className="space-y-4">
        <p className="text-xs font-semibold uppercase tracking-wider text-emerald-600">Your Data (GDPR)</p>
        <p className="text-sm" style={{ color: 'var(--t-text-muted)' }}>
          You own your data. Export everything or permanently delete your account.
        </p>
        <Button variant="secondary" className="w-full flex items-center gap-2 justify-center"
          onClick={requestExport} loading={exportPending}>
          <Download size={15} /> Export All My Data (ZIP)
        </Button>
        <p className="text-xs text-center" style={{ color: 'var(--t-text-muted)' }}>Includes: prayer logs, journal, habits, Quran progress, health data and more in JSON format</p>
      </Card>

      <Card className="space-y-4 border-red-200 dark:border-red-900/30">
        <p className="text-xs font-semibold uppercase tracking-wider text-red-500">Danger Zone</p>
        <p className="text-sm" style={{ color: 'var(--t-text-muted)' }}>Deleting your account is permanent after 30 days. Your data will be fully erased.</p>
        <Button variant="secondary" className="w-full text-red-500 border-red-200 hover:bg-red-50" onClick={deleteAccount}>
          🗑️ Delete My Account
        </Button>
      </Card>
    </div>
  )
}

function SubscriptionTab() {
  const currentPlan = 'free'
  return (
    <div className="space-y-5">
      <Card className="p-5">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 bg-emerald-700 rounded-xl flex items-center justify-center"><Crown size={18} className="text-white" /></div>
          <div>
            <p className="font-semibold" style={{ color: 'var(--t-text)' }}>Current Plan: <span className="capitalize">{currentPlan}</span></p>
            <p className="text-xs" style={{ color: 'var(--t-text-muted)' }}>Seeker — free forever</p>
          </div>
        </div>
        <Button variant="primary" className="w-full" onClick={() => window.location.href = '/subscription'}>
          Upgrade to Devoted ✨
        </Button>
      </Card>
      <Card>
        <p className="text-xs font-semibold uppercase tracking-wider text-emerald-600 mb-3">Your Entitlements</p>
        {['Prayer times & Qibla', 'Basic Quran Reader', '3 Habits', '3 Journal entries/month', 'Community feed'].map(f => (
          <div key={f} className="flex items-center gap-2 py-2 border-b last:border-0 text-sm" style={{ borderColor: 'var(--t-border)', color: 'var(--t-text)' }}>
            <Check size={13} className="text-emerald-500" /> {f}
          </div>
        ))}
      </Card>
    </div>
  )
}

export default function Settings() {
  const [activeTab, setActiveTab] = useState('appearance')
  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <h1 className="page-title mb-6">Settings</h1>
      <div className="flex gap-1 p-1 rounded-xl mb-6 overflow-x-auto" style={{ background: 'var(--t-bg-card)', border: '0.5px solid var(--t-border)' }}>
        {TABS.map(({ id, label, icon: Icon }) => (
          <button key={id} onClick={() => setActiveTab(id)} className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap flex-1"
            style={{ background: activeTab === id ? 'var(--t-primary)' : 'transparent', color: activeTab === id ? 'white' : 'var(--t-text-muted)' }}>
            <Icon size={14} />{label}
          </button>
        ))}
      </div>
      {activeTab === 'appearance'    && <AppearanceTab />}
      {activeTab === 'profile'       && <ProfileTab />}
      {activeTab === 'prayer'        && <PrayerTab />}
      {activeTab === 'notifications' && <NotificationsTab />}
      {activeTab === 'privacy'       && <PrivacyTab />}
      {activeTab === 'subscription'  && <SubscriptionTab />}
    </div>
  )
}
