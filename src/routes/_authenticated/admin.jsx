import React, { useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { format } from 'date-fns'
import { Shield, Flag, Users, CheckCircle, XCircle, AlertTriangle, Award, Eye, Ban, MessageSquare, BarChart3, Clock } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import toast from 'react-hot-toast'

export const Route = createFileRoute('/_authenticated/admin')({
  component: AdminPage,
})

const TABS = [
  { id: 'queue', label: 'Moderation', icon: Flag },
  { id: 'users', label: 'Users', icon: Users },
  { id: 'scholars', label: 'Scholars', icon: Award },
  { id: 'stats', label: 'Stats', icon: BarChart3 },
]

function ModerationQueue() {
  const qc = useQueryClient()
  const [filter, setFilter] = useState('pending')

  const mockReports = [
    { id: '1', type: 'post', content: 'This is wrong, you people are all wrong!', reason: 'harassment', flags: 5, user: 'user_xyz', created: '2026-04-14T10:23:00Z', status: 'pending' },
    { id: '2', type: 'comment', content: 'This fatwa is baseless and bid\'ah...', reason: 'misinformation', flags: 3, user: 'anon_123', created: '2026-04-14T14:11:00Z', status: 'pending' },
    { id: '3', type: 'post', content: 'Buy my Islamic products at discount! DM NOW!', reason: 'spam', flags: 8, user: 'seller_01', created: '2026-04-13T08:00:00Z', status: 'pending' },
  ]

  const handleAction = (id, action) => {
    const msgs = { approve: 'Content approved and restored.', remove: 'Content removed.', warn: 'Warning issued to user.', ban: 'User banned for repeated violations.' }
    toast.success(msgs[action])
    qc.invalidateQueries({ queryKey: ['admin', 'reports'] })
  }

  const REASON_COLOR = { harassment: 'text-red-500 bg-red-500/10', misinformation: 'text-orange-500 bg-orange-500/10', spam: 'text-blue-500 bg-blue-500/10', inappropriate: 'text-red-500 bg-red-500/10', off_topic: 'text-green-500 bg-green-500/10' }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
      <div className="flex gap-2 p-1 bg-muted rounded-xl w-fit">
        {['pending', 'resolved', 'dismissed'].map(s => (
          <button key={s} onClick={() => setFilter(s)} className={cn('px-4 py-2 rounded-lg text-xs font-bold capitalize transition-all', filter === s ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground')}>{s}</button>
        ))}
      </div>

      <div className="space-y-4">
        {mockReports.map(report => (
          <Card key={report.id} className="p-5 overflow-hidden">
            <div className="flex items-center gap-3 mb-4 flex-wrap">
              <Badge variant="outline" className={cn("text-[9px] uppercase font-black tracking-widest border-0", REASON_COLOR[report.reason] || 'text-red-500 bg-red-500/10')}>{report.reason}</Badge>
              <Badge variant="secondary" className="text-[9px] uppercase font-black tracking-widest">{report.type}</Badge>
              <div className="flex items-center gap-1.5 text-[11px] font-bold text-muted-foreground uppercase"><Flag className="h-3 w-3" /> {report.flags} flags</div>
              <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider ml-auto">{format(new Date(report.created), 'd MMM HH:mm')}</span>
            </div>
            
            <div className="p-4 bg-muted/40 rounded-xl border border-border/50 mb-4 relative">
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary/40 rounded-l-xl" />
              <p className="text-sm font-medium text-foreground italic leading-relaxed">"{report.content}"</p>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-3 pt-3 border-t border-border/50">Reported User: <span className="text-foreground">{report.user}</span></p>
            </div>

            <div className="flex flex-wrap gap-2 pt-2">
              <Button size="sm" variant="outline" onClick={() => handleAction(report.id, 'approve')} className="flex-1 border-green-500/20 text-green-600 hover:bg-green-500/10 hover:text-green-700 font-bold"><CheckCircle className="h-4 w-4 mr-1.5" /> Approve</Button>
              <Button size="sm" variant="outline" onClick={() => handleAction(report.id, 'remove')} className="flex-1 border-red-500/20 text-red-500 hover:bg-red-500/10 hover:text-red-600 font-bold"><XCircle className="h-4 w-4 mr-1.5" /> Remove</Button>
              <Button size="sm" variant="outline" onClick={() => handleAction(report.id, 'warn')} className="flex-1 border-orange-500/20 text-orange-600 hover:bg-orange-500/10 hover:text-orange-700 font-bold"><AlertTriangle className="h-4 w-4 mr-1.5" /> Warn</Button>
              <Button size="sm" variant="destructive" onClick={() => handleAction(report.id, 'ban')} className="flex-1 font-bold"><Ban className="h-4 w-4 mr-1.5" /> Ban</Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}

function UserManagement() {
  const [search, setSearch] = useState('')
  const mockUsers = [ { id: '1', email: 'ahmad@example.com', name: 'Ahmad Al-Rashid', role: 'user', strikes: 0, joined: '2025-11-01', is_active: true }, { id: '2', email: 'seller01@example.com', name: 'Seller Account', role: 'user', strikes: 2, joined: '2026-02-15', is_active: true }, { id: '3', email: 'scholar@deen.app', name: 'Sheikh Yusuf', role: 'scholar', strikes: 0, joined: '2025-09-10', is_active: true } ]
  const filtered = mockUsers.filter(u => u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase()))

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
      <Input placeholder="Search users by name or email..." value={search} onChange={e => setSearch(e.target.value)} className="h-11 font-bold bg-card" />
      <div className="space-y-3">
        {filtered.map(u => (
          <Card key={u.id} className="p-4 flex items-center gap-4 transition-colors hover:border-primary/40">
            <div className="w-12 h-12 bg-primary text-primary-foreground rounded-xl flex items-center justify-center font-black text-xl shrink-0 shadow-sm">{u.name[0]}</div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <span className="font-bold text-base text-foreground truncate">{u.name}</span>
                <Badge variant={u.role === 'scholar' ? 'default' : 'secondary'} className={cn("text-[9px] uppercase font-black", u.role === 'scholar' ? "bg-gold text-gold-foreground border-0 hover:bg-gold" : "")}>{u.role}</Badge>
                {u.strikes > 0 && <Badge variant="destructive" className="text-[9px] uppercase font-black h-5"><AlertTriangle className="h-3 w-3 mr-1" /> {u.strikes} strikes</Badge>}
              </div>
              <div className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest truncate">{u.email} <span className="opacity-50 mx-1">•</span> Joined {format(new Date(u.joined), 'MMM yyyy')}</div>
            </div>
            <div className="flex gap-2 shrink-0">
              <Button size="icon" variant="outline" onClick={() => toast.success('Profile opened')} className="h-9 w-9"><Eye className="h-4 w-4" /></Button>
              <Button size="icon" variant="outline" onClick={() => toast.success('User warned')} className="h-9 w-9 border-orange-500/20 text-orange-600 hover:bg-orange-500/10 hover:text-orange-700"><AlertTriangle className="h-4 w-4" /></Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}

function ScholarVerification() {
  const [applications] = useState([
    { id: '1', name: 'Dr. Khalid Ibrahim', institution: 'Al-Azhar University', madhab: "Shafi'i", qualifications: 'PhD Islamic Studies, 15 years teaching experience, Former Imam Masjid', applied: '2026-04-10', status: 'pending' },
    { id: '2', name: 'Sheikh Omar Abdullah', institution: 'Int. Islamic University Malaysia', madhab: 'Hanafi', qualifications: 'Masters Fiqh, Certified Quran teacher, Darul Uloom graduate', applied: '2026-04-12', status: 'pending' },
  ])

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
      <Card className="p-4 bg-orange-500/5 border-orange-500/20">
        <p className="text-xs font-medium text-orange-700 dark:text-orange-300 leading-relaxed">
          <strong className="block uppercase tracking-widest text-[10px] font-black mb-1">Verification criteria</strong>
          Valid Islamic institution credential, verifiable qualifications, adherence to traditional madhab scholarship, and agreement to community guidelines.
        </p>
      </Card>
      {applications.map(app => (
        <Card key={app.id} className="p-5 space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="font-bold text-foreground text-lg">{app.name}</span>
                <Badge variant="outline" className="bg-orange-500/10 text-orange-600 border-orange-500/20 text-[9px] uppercase font-black">{app.madhab}</Badge>
              </div>
              <p className="text-sm font-bold text-muted-foreground"><Award className="h-4 w-4 inline mr-1 -mt-0.5" />{app.institution}</p>
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground bg-muted px-2 py-1 rounded-md shrink-0">{format(new Date(app.applied), 'd MMM')}</span>
          </div>
          <div className="bg-muted/40 rounded-xl p-3 border border-border/50">
            <p className="text-sm font-medium text-foreground leading-relaxed">{app.qualifications}</p>
          </div>
          <div className="flex gap-3">
            <Button className="flex-1 font-bold bg-green-600 hover:bg-green-700" onClick={() => toast.success('Scholar verified! Gold badge will appear on their profile.')}><CheckCircle className="h-4 w-4 mr-1.5" /> Verify Scholar</Button>
            <Button variant="outline" className="flex-1 font-bold border-red-500/20 text-red-500 hover:bg-red-500/10 hover:text-red-600" onClick={() => toast.error('Application rejected. Applicant notified.')}><XCircle className="h-4 w-4 mr-1.5" /> Reject</Button>
          </div>
        </Card>
      ))}
    </div>
  )
}

function StatsReport() {
  const stats = [ { label: 'Total Users', value: '12,847', icon: Users, trend: '+234 this month' }, { label: 'Posts Today', value: '1,204', icon: MessageSquare, trend: '+18% vs last week' }, { label: 'Reports Resolved', value: '47', icon: CheckCircle, trend: '98.5% SLA met' }, { label: 'Scholars Active', value: '14', icon: Award, trend: '3 pending verification' }, { label: 'Active Bans', value: '23', icon: Ban, trend: '2 appealed' }, { label: 'Avg Response', value: '3.2h', icon: Clock, trend: 'SLA: <48h' } ]

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {stats.map(s => (
          <Card key={s.label} className="p-4 sm:p-5 relative overflow-hidden group">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{s.label}</span>
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform"><s.icon className="h-4 w-4" /></div>
            </div>
            <div className="font-black text-2xl text-foreground mb-1">{s.value}</div>
            <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest bg-muted/50 w-fit px-2 py-0.5 rounded-md">{s.trend}</div>
          </Card>
        ))}
      </div>

      <Card className="p-6">
        <h3 className="font-bold text-base text-foreground mb-5 flex items-center gap-2"><BarChart3 className="h-5 w-5 text-primary" /> Transparency Report</h3>
        <div className="space-y-1">
          {[ ['Total posts published', '36,421'], ['Posts auto-screened by AI', '36,421 (100%)'], ['Flagged for human review', '247 (0.7%)'], ['Removed by moderation', '89'], ['Appeals handled', '12'], ['Users banned', '4'], ['Scholar answers published', '128'] ].map(([label, value]) => (
            <div key={label} className="flex items-center justify-between py-3 border-b border-border/50 last:border-0 hover:bg-muted/30 px-2 rounded-lg transition-colors">
              <span className="text-sm font-semibold text-muted-foreground">{label}</span>
              <span className="font-black text-sm text-foreground bg-muted px-2 py-1 rounded-md">{value}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}

export default function AdminPage() {
  const [tab, setTab] = useState('queue')

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 md:py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-red-600 rounded-xl flex items-center justify-center shadow-lg shadow-red-500/20 shrink-0"><Shield className="h-6 w-6 text-white" /></div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Admin Portal</h1>
            <p className="text-sm font-medium text-muted-foreground mt-0.5">With great power comes great responsibility.</p>
          </div>
        </div>
      </div>

      <div className="flex overflow-x-auto p-1 rounded-xl bg-muted gap-1 scrollbar-none w-full sm:w-fit">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={cn('flex-1 min-w-[120px] px-3 py-2.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2', tab === t.id ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground')}>
            <t.icon className="h-4 w-4" /> {t.label}
          </button>
        ))}
      </div>

      <div className="pt-2">
        {tab === 'queue' && <ModerationQueue />}
        {tab === 'users' && <UserManagement />}
        {tab === 'scholars' && <ScholarVerification />}
        {tab === 'stats' && <StatsReport />}
      </div>
    </div>
  )
}
