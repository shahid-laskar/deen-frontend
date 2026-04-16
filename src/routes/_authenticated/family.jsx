import React, { useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Users, Plus, Baby, Shield, Eye, Star, Heart, BookOpen, Zap, Award } from 'lucide-react'
import api from '@/lib/api'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import toast from 'react-hot-toast'

export const Route = createFileRoute('/_authenticated/family')({
  component: FamilyPage,
})

const TABS = [
  { id: 'overview', label: 'Family', icon: Users },
  { id: 'children', label: "Children's Mode", icon: Baby },
  { id: 'finance', label: 'Budget', icon: Zap },
]

function ChildrenMode() {
  const [activeChild, setActiveChild] = useState(null)
  const { data: children = [] } = useQuery({ queryKey: ['children'], queryFn: () => api.get('/children').then(r => r.data).catch(() => []) })

  const mockActivities = [
    { id: 1, label: 'Learn a New Dua', icon: '🤲', color: 'from-green-400 to-green-600', xp: 20 },
    { id: 2, label: 'Read Quran', icon: '📖', color: 'from-orange-400 to-orange-600', xp: 30 },
    { id: 3, label: 'Morning Adhkar', icon: '🌅', color: 'from-blue-400 to-blue-600', xp: 15 },
    { id: 4, label: 'Salah Tracker', icon: '🕌', color: 'from-purple-400 to-purple-600', xp: 25 },
    { id: 5, label: 'Islamic Story', icon: '📚', color: 'from-pink-400 to-pink-600', xp: 20 },
    { id: 6, label: 'Good Deed', icon: '⭐', color: 'from-teal-400 to-teal-600', xp: 35 },
  ]
  const [earnedXP, setEarnedXP] = useState(0)

  const doActivity = (act) => {
    setEarnedXP(p => p + act.xp)
    toast.success(`MashaaAllah! +${act.xp} XP 🌟`, { icon: act.icon })
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
      <Card className="p-6 bg-gradient-to-br from-green-400 via-green-500 to-teal-600 text-white border-0 shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-20"><Star className="h-24 w-24 fill-current" /></div>
        <div className="flex items-center justify-between relative z-10">
          <div>
            <h2 className="text-2xl font-black mb-1">Children's Corner 🌟</h2>
            <p className="text-green-50 text-sm font-medium">Learning Islam, one deed at a time!</p>
          </div>
          <div className="text-right">
            <div className="text-4xl font-black drop-shadow-md">{earnedXP}</div>
            <div className="text-green-50 text-[10px] uppercase font-black tracking-widest mt-1">Total XP</div>
          </div>
        </div>
        <div className="mt-6 h-3 bg-black/10 rounded-full overflow-hidden border border-white/20">
          <div className="h-full bg-white transition-all duration-500 rounded-full shadow-[0_0_10px_rgba(255,255,255,0.8)]" style={{ width: `${Math.min(100, (earnedXP / 200) * 100)}%` }} />
        </div>
        <p className="text-green-50 text-[11px] uppercase font-bold tracking-wider mt-2 text-center">{Math.max(0, 200 - earnedXP)} XP to next reward!</p>
      </Card>

      {children.length > 0 && (
        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none">
          {children.map(child => (
            <button key={child.id} onClick={() => setActiveChild(child.id === activeChild ? null : child.id)}
              className={cn('shrink-0 flex flex-col items-center gap-2 p-3 rounded-2xl transition-all w-20 border-2', activeChild === child.id ? 'border-primary bg-primary/10 shadow-sm scale-105' : 'border-border bg-card hover:bg-muted')}>
              <div className="text-3xl drop-shadow-sm">{child.avatar_emoji}</div>
              <div className="text-[11px] font-bold text-foreground truncate w-full text-center">{child.name}</div>
            </button>
          ))}
        </div>
      )}

      <div>
        <h3 className="text-base font-bold text-foreground mb-4">Today's Activities</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {mockActivities.map(act => (
            <button key={act.id} onClick={() => doActivity(act)} className={`relative p-5 rounded-3xl bg-gradient-to-br ${act.color} text-white text-center shadow-md hover:shadow-lg transition-all hover:scale-[1.02] active:scale-95 border border-white/20`}>
              <div className="text-4xl mb-2 drop-shadow-md">{act.icon}</div>
              <div className="font-bold text-sm leading-tight mb-1">{act.label}</div>
              <Badge className="bg-black/20 text-white border-0 text-[10px] uppercase font-black hover:bg-black/20">+{act.xp} XP</Badge>
            </button>
          ))}
        </div>
      </div>

      <Card className="p-5">
        <h3 className="text-base font-bold text-foreground flex items-center gap-2 mb-4"><BookOpen className="h-5 w-5 text-primary" /> Islamic Stories</h3>
        <div className="space-y-3">
          {[ { title: 'The Story of Prophet Yusuf (AS)', age: '6+', duration: '5 min', icon: '🌙' }, { title: 'Ibrahim (AS) and the Stars', age: '5+', duration: '4 min', icon: '⭐' }, { title: 'The Companions of the Cave', age: '8+', duration: '7 min', icon: '🏔️' } ].map(story => (
            <div key={story.title} className="flex items-center gap-3 p-3 rounded-2xl bg-muted/50 border border-border transition-colors hover:border-primary/30">
              <div className="w-12 h-12 bg-background rounded-xl flex items-center justify-center text-2xl shadow-sm border border-border shrink-0">{story.icon}</div>
              <div className="flex-1 min-w-0">
                <div className="font-bold text-sm text-foreground truncate">{story.title}</div>
                <div className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mt-0.5">Age {story.age} <span className="opacity-50 mx-1">•</span> {story.duration}</div>
              </div>
              <Button size="sm" className="shrink-0 rounded-xl" onClick={() => toast.success('Loading story...')}>Read</Button>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}

function FamilyOverview() {
  const [inviteModal, setInviteModal] = useState(false)
  const [inviteForm, setInviteForm] = useState({ user_id: '', account_type: 'adult' })

  const mockFamily = {
    id: '1', plan_type: 'Family Premium',
    members: [ { id: 1, name: 'Ahmad (You)', account_type: 'adult', role: 'admin', xp: 2450, avatar: '👨' }, { id: 2, name: 'Fatimah', account_type: 'adult', role: 'member', xp: 1870, avatar: '👩' }, { id: 3, name: 'Ibrahim', account_type: 'teen', role: 'member', xp: 980, avatar: '👦' }, { id: 4, name: 'Maryam', account_type: 'child', role: 'member', xp: 420, avatar: '👧' } ]
  }
  const ACCOUNT_TYPE_CONFIG = { adult: { color: 'green', label: 'Adult', icon: Users }, teen: { color: 'blue', label: 'Teen (13-17)', icon: Star }, child: { color: 'gold', label: 'Child (<13)', icon: Baby } }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
      <Card className="p-6 bg-gradient-to-br from-primary to-green-700 text-primary-foreground border-0 shadow-md">
        <div className="flex items-center gap-2 mb-4 text-primary-foreground/90 font-bold uppercase tracking-widest text-[11px]"><Heart className="h-4 w-4" /> Family Quran Goal</div>
        <div className="flex items-end gap-2 mb-3">
          <span className="text-5xl font-black">18</span><span className="text-sm font-bold text-primary-foreground/80 mb-1 uppercase tracking-wider">/ 30 Juz together</span>
        </div>
        <div className="h-3 bg-black/20 rounded-full overflow-hidden border border-white/20"><div className="h-full bg-white rounded-full transition-all" style={{ width: '60%' }} /></div>
        <p className="text-xs font-bold text-primary-foreground/90 mt-3 pt-3 border-t border-white/10 uppercase tracking-widest">12 more Juz to complete a family Khatam 🎉</p>
      </Card>

      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-bold text-foreground">Family Members</h3>
          <Button size="sm" onClick={() => setInviteModal(true)}><Plus className="h-4 w-4 mr-1.5" /> Invite</Button>
        </div>
        <div className="grid gap-3">
          {mockFamily.members.map(m => (
            <Card key={m.id} className="p-4 flex items-center gap-4">
              <div className="w-12 h-12 bg-muted rounded-2xl flex items-center justify-center text-3xl shadow-inner shrink-0">{m.avatar}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-base text-foreground">{m.name}</span>
                    {m.role === 'admin' && <Badge className="bg-gold text-gold-foreground text-[9px] uppercase border-0 font-black">Admin</Badge>}
                  </div>
                  {m.role !== 'admin' && <button className="text-muted-foreground hover:text-primary transition-colors bg-muted p-1.5 rounded-lg"><Eye className="h-4 w-4" /></button>}
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant="secondary" className="text-[10px] uppercase font-bold">{ACCOUNT_TYPE_CONFIG[m.account_type].label}</Badge>
                  <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest">⭐ {m.xp} XP</span>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      <Card className="p-5">
        <h3 className="text-base font-bold text-foreground mb-4 flex justify-between items-center">Family Prayer Board <Badge variant="outline" className="text-[10px] uppercase tracking-widest">Today</Badge></h3>
        <div className="grid grid-cols-5 gap-2 text-center text-[10px] font-black uppercase text-muted-foreground mb-3 pb-2 border-b border-border">
          {['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'].map(p => <div key={p}>{p}</div>)}
        </div>
        <div className="space-y-3">
          {mockFamily.members.map(m => (
            <div key={m.id} className="flex items-center gap-3">
              <span className="text-xs font-bold text-foreground w-16 truncate" title={m.name}>{m.name.split(' ')[0]}</span>
              <div className="grid grid-cols-5 gap-2 flex-1">
                {[true, true, true, false, true].map((prayed, i) => (
                  <div key={i} className={cn('h-8 rounded-xl border border-transparent transition-all', prayed ? 'bg-primary border-primary/20 shadow-sm' : 'bg-muted border-border/50')} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Dialog open={inviteModal} onOpenChange={setInviteModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Invite Family Member</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div><label className="text-xs font-bold text-foreground mb-1 block">Member's Email</label><Input placeholder="family@email.com" value={inviteForm.user_id} onChange={e => setInviteForm({ ...inviteForm, user_id: e.target.value })} /></div>
            <div>
              <label className="text-xs font-bold text-foreground mb-2 block">Account Type</label>
              <div className="grid grid-cols-3 gap-2">
                {Object.entries(ACCOUNT_TYPE_CONFIG).map(([key, cfg]) => (
                  <button key={key} onClick={() => setInviteForm({ ...inviteForm, account_type: key })}
                    className={cn('p-3 rounded-xl border-2 text-center text-xs font-bold transition-all', inviteForm.account_type === key ? 'border-primary bg-primary/10 text-primary' : 'border-border bg-card text-muted-foreground hover:bg-muted')}>
                    <div className="text-2xl mb-1">{key === 'adult' ? '👨' : key === 'teen' ? '👦' : '👧'}</div>
                    {cfg.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0 mt-4">
            <DialogClose asChild><Button type="button" variant="outline">Cancel</Button></DialogClose>
            <Button onClick={() => { toast.success('Invitation sent!'); setInviteModal(false) }} disabled={!inviteForm.user_id}>Send Invite</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function BudgetTracker() {
  const CATEGORIES = [ { name: 'Necessities', pct: 50, color: 'bg-green-500' }, { name: 'Needs', pct: 30, color: 'bg-blue-500' }, { name: 'Charity', pct: 10, color: 'bg-orange-500' }, { name: 'Savings', pct: 10, color: 'bg-purple-500' } ]
  const [income, setIncome] = useState('5000')

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
      <Card className="p-5 sm:p-6 space-y-6">
        <div>
          <h3 className="text-lg font-bold text-foreground">Barakah Budget</h3>
          <p className="text-sm font-medium text-muted-foreground mt-1">Islamic financial allocation — 50/30/10/10</p>
        </div>
        <div><label className="text-[11px] uppercase font-bold text-muted-foreground block mb-1">Monthly Halal Income (USD)</label><Input type="number" value={income} onChange={e => setIncome(e.target.value)} placeholder="5000" className="h-11 font-bold text-lg" /></div>
        <div className="space-y-4">
          {CATEGORIES.map(cat => {
            const amount = ((parseFloat(income) || 0) * cat.pct) / 100
            return (
              <div key={cat.name} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-bold text-foreground">{cat.name}</span>
                  <span className="font-bold text-muted-foreground uppercase tracking-widest text-[11px]">{cat.pct}% <span className="mx-1 opacity-50">•</span> ${amount.toLocaleString()}</span>
                </div>
                <div className="h-3 bg-muted rounded-full overflow-hidden border border-border/50">
                  <div className={cn("h-full rounded-full transition-all duration-1000", cat.color)} style={{ width: `${cat.pct}%` }} />
                </div>
              </div>
            )
          })}
        </div>
      </Card>

      <Card className="p-5 sm:p-6">
        <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2"><Badge variant="destructive" className="h-6 px-2 text-[10px] uppercase font-black tracking-widest">Alerts</Badge> Spending</h3>
        <div className="space-y-3">
          {[ { label: 'Entertainment', spent: 320, budget: 200, alert: true }, { label: 'Dining Out', spent: 180, budget: 200, alert: false }, { label: 'Subscriptions', spent: 95, budget: 100, alert: false } ].map(item => (
            <div key={item.label} className={cn('p-4 rounded-xl border', item.alert ? 'bg-red-500/5 border-red-500/30' : 'bg-muted/30 border-transparent')}>
              <div className="flex items-center justify-between mb-2">
                <span className={cn("font-bold text-sm", item.alert ? 'text-red-500' : 'text-foreground')}>{item.label}</span>
                <span className={cn("text-xs font-bold uppercase tracking-wider", item.alert ? 'text-red-500' : 'text-muted-foreground')}>${item.spent} / ${item.budget}</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden border border-border/50"><div className={cn('h-full rounded-full transition-all', item.alert ? 'bg-red-500 text-red-500 shadow-[0_0_8px_currentColor]' : 'bg-primary')} style={{ width: `${Math.min(100, (item.spent / item.budget) * 100)}%` }} /></div>
              {item.alert && <p className="text-[11px] font-bold text-red-500 mt-2 uppercase tracking-widest opacity-80">Over budget — wasteful spending is disliked in Islam.</p>}
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}

export default function FamilyPage() {
  const [tab, setTab] = useState('overview')

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 md:py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">Family & Home <Users className="h-6 w-6 text-primary" /></h1>
          <p className="text-sm font-medium text-muted-foreground mt-0.5">Manage your family's spiritual journey together.</p>
        </div>
      </div>

      <div className="flex overflow-x-auto p-1 rounded-xl bg-muted gap-1 scrollbar-none w-fit">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={cn('flex-1 min-w-[120px] px-3 py-2.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2', tab === t.id ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground')}>
            <t.icon className="h-4 w-4" /> {t.label}
          </button>
        ))}
      </div>

      <div className="pt-2">
        {tab === 'overview' && <FamilyOverview />}
        {tab === 'children' && <ChildrenMode />}
        {tab === 'finance' && <BudgetTracker />}
      </div>
    </div>
  )
}
