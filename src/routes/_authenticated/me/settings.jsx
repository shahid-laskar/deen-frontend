import React, { useState } from 'react'
import { createFileRoute, Link } from '@tanstack/react-router'
import { useMutation } from '@tanstack/react-query'
import { Palette, User, Globe, Bell, Lock, Check, Crown, Download, Navigation, Moon, Sun, Sparkles } from 'lucide-react'
import api from '@/lib/api'
import { useAuthStore } from '@/store/authStore'
import { useTheme } from '@/lib/theme-context'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { ThemeGallery } from '@/components/theme/ThemeGallery'
import toast from 'react-hot-toast'

export const Route = createFileRoute('/_authenticated/me/settings')({
  component: SettingsPage,
})

const TABS = [
  { id: 'appearance',    label: 'Appearance', icon: Palette },
  { id: 'profile',       label: 'Profile',    icon: User    },
  { id: 'prayer',        label: 'Prayer',     icon: Globe   },
  { id: 'notifications', label: 'Alerts',     icon: Bell    },
  { id: 'privacy',       label: 'Privacy',    icon: Lock    },
  { id: 'subscription',  label: 'Plan',       icon: Crown   },
]

// ─── Section wrapper ──────────────────────────────────────────────────────────
function Section({ title, children, className }) {
  return (
    <div className={cn('rounded-2xl border border-border bg-card p-5 space-y-4', className)}>
      {title && (
        <h3 className="text-xs font-semibold uppercase tracking-wider text-primary">{title}</h3>
      )}
      <div className="space-y-4">
        {children}
      </div>
    </div>
  )
}

// ─── Setting row (label + switch) ────────────────────────────────────────────
function SettingRow({ label, description, checked, onCheckedChange }) {
  return (
    <div className="flex items-center justify-between gap-4 py-1">
      <div className="min-w-0">
        <span className="text-sm font-medium text-foreground block">{label}</span>
        {description && <span className="text-xs text-muted-foreground mt-0.5 block">{description}</span>}
      </div>
      <Switch checked={checked} onCheckedChange={onCheckedChange} />
    </div>
  )
}

// ─── Appearance Tab ───────────────────────────────────────────────────────────
function AppearanceTab({ onOpenGallery }) {
  const { 
    mode, setMode, themes, themeId,
    typeset, setTypesetOverride,
    quranScale, setQuranScale,
    seasonalEnabled, setSeasonalEnabled,
    autoDarkAfterMaghrib, setAutoDarkAfterMaghrib
  } = useTheme()

  const currentTheme = themes.find(t => t.id === themeId) || themes[0]

  const TYPESET_OPTIONS = [
    { key: 'classic',   label: 'Classic',    desc: 'Amiri + Inter' },
    { key: 'editorial', label: 'Editorial',  desc: 'Fraunces + Inter' },
    { key: 'royal',     label: 'Royal',      desc: 'Cormorant + Manrope' },
    { key: 'modern',    label: 'Modern',     desc: 'Inter + Inter' },
    { key: 'geometric', label: 'Geometric',  desc: 'Space Grotesk + Jakarta' },
    { key: 'soft',      label: 'Soft',       desc: 'DM Serif + Nunito' },
  ]

  const THEME_MODES = [
    { key: 'light',  label: 'Light',  icon: Sun, color: 'text-gold' },
    { key: 'dark',   label: 'Dark',   icon: Moon, color: 'text-primary' },
    { key: 'system', label: 'System', icon: Globe, color: 'text-muted-foreground' },
  ]

  return (
    <div className="space-y-4">
      {/* Theme Selection */}
      <Section title="Theme">
        <div 
          onClick={onOpenGallery}
          className="group relative flex items-center justify-between rounded-xl border border-border bg-background p-4 cursor-pointer hover:border-primary/50 transition-all shadow-sm"
        >
          <div className="flex items-center gap-4">
            <div className="flex -space-x-2">
              {currentTheme.swatches.map((color, i) => (
                <div 
                  key={i} 
                  className="h-8 w-8 rounded-full border-2 border-background" 
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">{currentTheme.name}</p>
              <p className="text-xs text-muted-foreground">{currentTheme.tagline}</p>
            </div>
          </div>
          <Button variant="ghost" size="sm" className="group-hover:bg-primary/10 group-hover:text-primary">
            Change
          </Button>
        </div>
      </Section>

      {/* Display Mode */}
      <Section title="Mode">
        <div className="flex gap-3">
          {THEME_MODES.map(m => (
            <button
              key={m.key}
              onClick={() => setMode(m.key)}
              className={cn(
                'flex-1 flex flex-col items-center gap-2 rounded-xl border-2 p-4 transition-all cursor-pointer',
                mode === m.key ? 'border-primary bg-primary/5' : 'border-border bg-background hover:bg-muted'
              )}
            >
              <m.icon className={cn("h-5 w-5", m.color)} />
              <span className="text-xs font-medium text-foreground">{m.label}</span>
            </button>
          ))}
        </div>
      </Section>

      {/* Automatic */}
      <Section title="Automatic">
        <div className="space-y-3">
          <SettingRow
            label="Dark after Maghrib"
            description="Switches to dark mode automatically after sunset"
            checked={autoDarkAfterMaghrib}
            onCheckedChange={setAutoDarkAfterMaghrib}
          />
          <Separator />
          <SettingRow
            label="Seasonal themes"
            description="Auto-activate for Ramadan, Eid, and Dhul Hijjah"
            checked={seasonalEnabled}
            onCheckedChange={setSeasonalEnabled}
          />
        </div>
      </Section>

      {/* Typography */}
      <Section title="Typography">
        <div className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-foreground">Font Pairing</span>
              <Button variant="link" size="sm" className="h-auto p-0 text-xs" onClick={() => setTypesetOverride(null)}>
                Reset to theme default
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {TYPESET_OPTIONS.map(({ key, label, desc }) => (
                <button
                  key={key}
                  onClick={() => setTypesetOverride(key)}
                  className={cn(
                    'px-3 py-2.5 rounded-xl border text-left transition-all cursor-pointer',
                    typeset === key
                      ? 'border-primary bg-primary/8 text-foreground'
                      : 'border-border bg-background text-muted-foreground hover:bg-muted'
                  )}
                >
                  <span className="text-sm font-medium block">{label}</span>
                  <span className="text-[10px] opacity-60 truncate block">{desc}</span>
                </button>
              ))}
            </div>
          </div>

          <Separator />
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-foreground">Quran font size</span>
              <span className="text-xs font-mono text-muted-foreground">{Math.round((quranScale ?? 1) * 100)}%</span>
            </div>
            <input
              type="range" min="0.8" max="2" step="0.1"
              value={quranScale ?? 1}
              onChange={e => setQuranScale(parseFloat(e.target.value))}
              className="w-full accent-primary cursor-pointer"
            />
            <div className="font-amiri text-center py-4 rounded-xl mt-3 bg-muted/50 text-xl text-primary border border-border/50">
              بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
            </div>
          </div>
        </div>
      </Section>
    </div>
  )
}

// ─── Profile Tab ──────────────────────────────────────────────────────────────
function ProfileTab() {
  const { user, updateUser } = useAuthStore()
  const [form, setForm] = useState({
    display_name: user?.profile?.display_name || '',
    city: user?.profile?.city || '',
    country: user?.profile?.country || '',
  })
  const { mutate: save, isPending } = useMutation({
    mutationFn: () => api.patch('/users/me/profile', form),
    onSuccess: () => { updateUser({ ...user, profile: { ...user.profile, ...form } }); toast.success('Profile updated!') },
    onError: () => toast.error('Failed to update profile'),
  })

  const initials = (user?.profile?.display_name || user?.email || 'U')[0].toUpperCase()

  return (
    <div className="space-y-4">
      {/* Avatar */}
      <div className="flex justify-center py-4">
        <div className="w-20 h-20 rounded-2xl bg-primary flex items-center justify-center text-primary-foreground text-3xl font-bold shadow-glow-primary">
          {initials}
        </div>
      </div>

      <Section>
        <div className="space-y-4 pt-2">
          <div>
            <label className="text-sm font-medium text-foreground block mb-1.5">Display name</label>
            <Input value={form.display_name} onChange={e => setForm(f => ({ ...f, display_name: e.target.value }))} placeholder="Your name" />
          </div>
          <div>
            <label className="text-sm font-medium text-foreground block mb-1.5">City</label>
            <Input value={form.city} onChange={e => setForm(f => ({ ...f, city: e.target.value }))} placeholder="e.g. London" />
          </div>
          <div>
            <label className="text-sm font-medium text-foreground block mb-1.5">Country</label>
            <Input value={form.country} onChange={e => setForm(f => ({ ...f, country: e.target.value }))} placeholder="e.g. United Kingdom" />
          </div>
          <Button onClick={() => save()} disabled={isPending} className="w-full">
            {isPending ? 'Saving…' : 'Save changes'}
          </Button>
        </div>
      </Section>
    </div>
  )
}

// ─── Prayer/Location Tab ──────────────────────────────────────────────────────
function PrayerTab() {
  const { user, updateUser } = useAuthStore()
  const [form, setForm] = useState({
    city: user?.profile?.city || '',
    country: user?.profile?.country || '',
    madhab: user?.madhab || 'shafi',
    calculation_method: user?.prayer_method || '2',
    latitude: user?.latitude || '',
    longitude: user?.longitude || '',
  })
  const [detecting, setDetecting] = useState(false)

  const handleDetect = () => {
    setDetecting(true)
    navigator.geolocation.getCurrentPosition(
      pos => { setForm(p => ({ ...p, latitude: pos.coords.latitude, longitude: pos.coords.longitude })); setDetecting(false); toast.success('Location detected!') },
      () => { toast.error('Could not get position. Check permissions.'); setDetecting(false) }
    )
  }

  const { mutate: save, isPending } = useMutation({
    mutationFn: async () => {
      await api.patch('/users/me/profile', { city: form.city, country: form.country })
      const res = await api.patch('/users/me', { madhab: form.madhab, prayer_method: `${form.calculation_method}`, latitude: form.latitude ? parseFloat(form.latitude) : null, longitude: form.longitude ? parseFloat(form.longitude) : null })
      return res.data
    },
    onSuccess: (d) => { updateUser(d); toast.success('Prayer settings updated!') },
    onError: () => toast.error('Failed to update prayer settings'),
  })

  const selectCls = 'w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring'

  return (
    <div className="space-y-4">
      <Section title="Location">
        <div className="space-y-3">
          <div>
            <label className="text-sm font-medium text-foreground block mb-1.5">City</label>
            <Input value={form.city} onChange={e => setForm(f => ({ ...f, city: e.target.value }))} placeholder="e.g. London" />
          </div>
          <div>
            <label className="text-sm font-medium text-foreground block mb-1.5">Country</label>
            <Input value={form.country} onChange={e => setForm(f => ({ ...f, country: e.target.value }))} placeholder="e.g. United Kingdom" />
          </div>
          <div>
            <label className="text-sm font-medium text-foreground block mb-1.5">Coordinates</label>
            <div className="flex gap-2">
              <Input placeholder="Latitude"  value={form.latitude}  onChange={e => setForm(f => ({ ...f, latitude: e.target.value }))} className="flex-1" />
              <Input placeholder="Longitude" value={form.longitude} onChange={e => setForm(f => ({ ...f, longitude: e.target.value }))} className="flex-1" />
            </div>
            <Button size="sm" variant="outline" onClick={handleDetect} disabled={detecting} className="w-full mt-2">
              <Navigation className="h-3.5 w-3.5 mr-1.5" />
              {detecting ? 'Detecting…' : 'Auto-Detect Location'}
            </Button>
            <p className="text-xs text-muted-foreground mt-1.5">Coordinates enable accurate offline prayer time calculations.</p>
          </div>
        </div>
      </Section>

      <Section title="Calculation Method">
        <div className="space-y-3">
          <div>
            <label className="text-sm font-medium text-foreground block mb-1.5">Asr Madhab</label>
            <select className={selectCls} value={form.madhab} onChange={e => setForm(f => ({ ...f, madhab: e.target.value }))}>
              <option value="shafi">Standard (Shafi'i, Maliki, Hanbali)</option>
              <option value="hanafi">Hanafi</option>
            </select>
          </div>
          <div>
            <label className="text-sm font-medium text-foreground block mb-1.5">Calculation Authority</label>
            <select className={selectCls} value={form.calculation_method} onChange={e => setForm(f => ({ ...f, calculation_method: e.target.value }))}>
              <option value="1">University of Islamic Sciences, Karachi</option>
              <option value="2">Islamic Society of North America (ISNA)</option>
              <option value="3">Muslim World League</option>
              <option value="4">Umm Al-Qura University, Makkah</option>
              <option value="5">Egyptian General Authority of Survey</option>
              <option value="7">Institute of Geophysics, University of Tehran</option>
              <option value="12">Union Organization islamique de France</option>
              <option value="13">Diyanet İşleri Başkanlığı, Turkey</option>
            </select>
          </div>
        </div>
      </Section>

      <Button onClick={() => save()} disabled={isPending} className="w-full">
        {isPending ? 'Saving…' : 'Save Prayer Settings'}
      </Button>
    </div>
  )
}

// ─── Notifications Tab ────────────────────────────────────────────────────────
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

  const toggle = key => setPrefs(p => ({ ...p, [key]: !p[key] }))

  const GROUPS = [
    { label: 'Prayer',             keys: ['prayer_adhan', 'prayer_pre_adhan', 'prayer_qada_reminder'], labels: ['Adhan reminder', 'Pre-adhan (10 min)', 'Missed prayer reminder'] },
    { label: 'Quran & Hifz',       keys: ['quran_daily_reminder', 'hifz_review_due'],                 labels: ['Daily Quran reminder', 'Hifz review due'] },
    { label: 'Habits & Streaks',   keys: ['habit_streaks'],                                           labels: ['Habit streak alerts'] },
    { label: 'Islamic Calendar',   keys: ['islamic_calendar', 'zakat_reminders'],                     labels: ['Ramadan, Eid & events', 'Zakat hawl reminder'] },
    { label: 'Wellbeing',          keys: ['journal_wellbeing', 'community_replies'],                  labels: ['Journal nudges', 'Community replies'] },
  ]

  return (
    <div className="space-y-4">
      {GROUPS.map(group => (
        <Section key={group.label} title={group.label}>
          <div className="space-y-3">
            {group.keys.map((key, i) => (
              <React.Fragment key={key}>
                {i > 0 && <Separator />}
                <SettingRow label={group.labels[i]} checked={prefs[key]} onCheckedChange={() => toggle(key)} />
              </React.Fragment>
            ))}
          </div>
        </Section>
      ))}

      <Section title="Do Not Disturb">
        <p className="text-xs text-muted-foreground pb-2">Prayer adhan will always override DND.</p>
        <div className="flex gap-3">
          <div className="flex-1">
            <label className="text-xs font-medium text-foreground block mb-1">DND Start</label>
            <input type="time" value={prefs.dnd_start} onChange={e => setPrefs(p => ({ ...p, dnd_start: e.target.value }))}
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
          </div>
          <div className="flex-1">
            <label className="text-xs font-medium text-foreground block mb-1">DND End</label>
            <input type="time" value={prefs.dnd_end} onChange={e => setPrefs(p => ({ ...p, dnd_end: e.target.value }))}
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
          </div>
        </div>
      </Section>

      <Button onClick={() => save()} disabled={isPending} className="w-full">
        {isPending ? 'Saving…' : 'Save Alert Settings'}
      </Button>
    </div>
  )
}

// ─── Privacy Tab ──────────────────────────────────────────────────────────────
function PrivacyTab() {
  const { logout } = useAuthStore()
  const [analyticsOptOut, setAnalyticsOptOut] = useState(false)
  const [exportPending, setExportPending] = useState(false)

  const requestExport = async () => {
    setExportPending(true)
    try { await api.post('/user/data-export'); toast.success("Export queued! You'll receive a download link soon.") }
    catch { toast.error('Export failed. Please try again.') }
    finally { setExportPending(false) }
  }

  const deleteAccount = () => {
    if (window.confirm('This will permanently delete your account after 30 days. Are you sure?')) {
      api.delete('/user/account').then(() => { toast.success('Account scheduled for deletion.'); logout() })
    }
  }

  return (
    <div className="space-y-4">
      <Section title="Analytics">
        <SettingRow
          label="Usage analytics"
          description="Anonymous usage data to improve the app. No PII ever shared."
          checked={!analyticsOptOut}
          onCheckedChange={v => setAnalyticsOptOut(!v)}
        />
      </Section>

      <Section title="Your Data (GDPR)">
        <p className="text-sm text-muted-foreground">You own your data. Export everything or permanently delete your account.</p>
        <Button variant="outline" onClick={requestExport} disabled={exportPending} className="w-full">
          <Download className="h-4 w-4 mr-2" />
          {exportPending ? 'Processing…' : 'Export All My Data (ZIP)'}
        </Button>
        <p className="text-xs text-center text-muted-foreground">Includes prayer logs, journal, habits, Quran progress & more in JSON format</p>
      </Section>

      <Section className="border-destructive/30">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-destructive">Danger Zone</h3>
        <p className="text-sm text-muted-foreground">Deleting your account is permanent after 30 days. Your data will be fully erased.</p>
        <Button variant="outline" onClick={deleteAccount} className="w-full text-destructive border-destructive/30 hover:bg-destructive/5">
          🗑️ Delete My Account
        </Button>
      </Section>
    </div>
  )
}

// ─── Subscription Tab ─────────────────────────────────────────────────────────
function SubscriptionTab() {
  return (
    <div className="space-y-4">
      <Section>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-glow-primary">
            <Crown className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <p className="font-semibold text-foreground">Current Plan: <span className="text-primary font-bold">Free Seeker</span></p>
            <p className="text-xs text-muted-foreground">Free forever — upgrade for unlimited features</p>
          </div>
        </div>
        <Link to="/subscription">
          <Button className="w-full mt-2">Upgrade to Devoted ✨</Button>
        </Link>
      </Section>

      <Section title="Your Entitlements">
        <div className="space-y-2">
          {['Prayer times & Qibla', 'Basic Quran Reader', '3 Habits', '3 Journal entries/month', 'Community feed'].map(f => (
            <div key={f} className="flex items-center gap-2.5 py-2 border-b border-border last:border-0">
              <Check className="h-3.5 w-3.5 text-sage shrink-0" />
              <span className="text-sm text-foreground">{f}</span>
            </div>
          ))}
        </div>
      </Section>
    </div>
  )
}

// ─── Main Settings Page ───────────────────────────────────────────────────────
function SettingsPage() {
  const [activeTab, setActiveTab] = useState('appearance')
  const [galleryOpen, setGalleryOpen] = useState(false)

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 md:px-8 md:py-8 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Settings</h1>
        <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20">v2.0 Beta</Badge>
      </div>

      {/* Tab bar — scrollable on mobile */}
      <div className="inline-flex h-10 items-center rounded-xl bg-muted p-1 gap-1 w-full overflow-x-auto scrollbar-none shadow-inner">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={cn(
              'inline-flex flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded-lg px-4 py-1.5 text-xs font-medium transition-all cursor-pointer',
              activeTab === id
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground hover:bg-background/50'
            )}
          >
            <Icon className="h-3.5 w-3.5" />
            {label}
          </button>
        ))}
      </div>

      <div className="animate-fade-in" key={activeTab}>
        {activeTab === 'appearance'    && <AppearanceTab onOpenGallery={() => setGalleryOpen(true)} />}
        {activeTab === 'profile'       && <ProfileTab />}
        {activeTab === 'prayer'        && <PrayerTab />}
        {activeTab === 'notifications' && <NotificationsTab />}
        {activeTab === 'privacy'       && <PrivacyTab />}
        {activeTab === 'subscription'  && <SubscriptionTab />}
      </div>

      <ThemeGallery open={galleryOpen} onClose={() => setGalleryOpen(false)} />
    </div>
  )
}
