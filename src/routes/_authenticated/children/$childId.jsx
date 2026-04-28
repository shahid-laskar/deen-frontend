import React, { useState } from 'react'
import { createFileRoute, Link } from '@tanstack/react-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { differenceInMonths } from 'date-fns'
import {
  ArrowLeft, Star, Flame, Trophy, BookOpen, Book, Heart, CheckCircle,
  Circle, Sparkles, Zap, Target, BarChart2, Medal, Plus, Trash2, Lightbulb
} from 'lucide-react'
import api from '@/lib/api'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import toast from 'react-hot-toast'

export const Route = createFileRoute('/_authenticated/children/$childId')({
  component: ChildDetailPage,
})

const LEVEL_NAMES = {
  1:'Little Star',2:'Tiny Explorer',3:'Dua Learner',4:'Quran Buddy',
  5:'Salah Helper',6:'Seerah Seeker',7:'Akhlaq Champion',
  8:'Hafiz Helper',9:'Shining Star',10:'Young Scholar',
}
const LEVEL_THRESHOLDS = [0,50,150,300,500,800,1200,1800,2500,3500,Infinity]

const CAT_COLORS = {
  quran:'bg-amber-500/15 text-amber-600',  salah:'bg-blue-500/15 text-blue-600',
  dua:'bg-rose-500/15 text-rose-600',      story:'bg-purple-500/15 text-purple-600',
  akhlaq:'bg-pink-500/15 text-pink-600',   aqeedah:'bg-emerald-500/15 text-emerald-600',
}

const MILESTONE_CATS = ['aqeedah','salah','quran','arabic','akhlaq','seerah','fiqh','dua']

function XpBar({ xp, level }) {
  const thisXp  = LEVEL_THRESHOLDS[level - 1] || 0
  const nextXp  = LEVEL_THRESHOLDS[level] || LEVEL_THRESHOLDS[level - 1]
  const pct = nextXp === Infinity ? 100 : Math.round(((xp - thisXp) / (nextXp - thisXp)) * 100)
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between text-xs font-bold">
        <span className="text-muted-foreground">Lv {level} — {LEVEL_NAMES[level] || 'Scholar'}</span>
        <span className="text-primary">{xp} XP</span>
      </div>
      <div className="h-3 rounded-full bg-muted overflow-hidden">
        <div className="h-full rounded-full bg-gradient-to-r from-primary to-gold transition-all duration-700"
          style={{ width: `${Math.min(100, pct)}%` }} />
      </div>
      {nextXp !== Infinity && (
        <p className="text-[10px] text-muted-foreground font-bold text-right">
          {nextXp - xp} XP to next level
        </p>
      )}
    </div>
  )
}

function OverviewTab({ child, stats, analytics, activities, badges }) {
  const qc = useQueryClient()
  const { childId } = Route.useParams()

  const { data: activityTemplates = [] } = useQuery({
    queryKey: ['activity-library', child?.age_group],
    queryFn: () => api.get('/children/activity-library', { params: { age_group: child?.age_group } }).then(r => r.data),
    enabled: !!child?.age_group,
  })

  const { data: badgeLibrary = [] } = useQuery({
    queryKey: ['badge-library'],
    queryFn: () => api.get('/children/badge-library').then(r => r.data),
  })

  const { mutate: logActivity, isPending } = useMutation({
    mutationFn: (tmpl) => api.post(`/children/${childId}/activities`, {
      activity_key: tmpl.key, activity_name: tmpl.name,
      activity_category: tmpl.category, xp_earned: tmpl.xp,
    }).then(r => r.data),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['child', childId] })
      qc.invalidateQueries({ queryKey: ['children'] })
      if (data.leveled_up) toast.success(`🎉 Level up! Now ${data.level_name}!`)
      else toast.success(`+${data.xp_gained} XP earned! 🌟`)
      if (data.new_badges?.length) {
        data.new_badges.forEach(b => toast.success(`🏅 Badge earned: ${b.badge_name}!`))
      }
    },
    onError: () => toast.error('Could not log activity'),
  })

  return (
    <div className="space-y-6">
      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label:'Total XP',    value: stats?.xp_total || 0,          icon: Zap,      color:'text-primary' },
          { label:'Level',       value: stats?.level || 1,             icon: Star,     color:'text-gold' },
          { label:'Streak',      value:`${stats?.current_streak || 0}d`, icon: Flame,    color:'text-orange-500' },
          { label:'Badges',      value: stats?.badge_count || 0,       icon: Medal,    color:'text-purple-500' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="rounded-2xl glass-card shadow-soft p-4 flex flex-col items-center gap-1">
            <Icon className={cn('h-5 w-5', color)} />
            <p className={cn('text-2xl font-black', color)}>{value}</p>
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{label}</p>
          </div>
        ))}
      </div>

      {/* XP bar */}
      <div className="rounded-2xl glass-card shadow-soft p-5">
        <XpBar xp={child.xp_total || 0} level={child.level || 1} />
      </div>

      {/* Today's activities */}
      <div>
        <h3 className="text-sm font-black uppercase tracking-widest text-muted-foreground mb-3">
          Log Today's Activity
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {activityTemplates.slice(0, 8).map(tmpl => (
            <button
              key={tmpl.key}
              disabled={isPending}
              onClick={() => logActivity(tmpl)}
              className="flex flex-col items-center gap-1.5 p-3 rounded-2xl glass-card shadow-soft hover:shadow-elevated hover:border-primary/30 border border-transparent transition-all active:scale-95 disabled:opacity-50"
            >
              <span className="text-2xl">{tmpl.icon}</span>
              <span className="text-xs font-bold text-foreground text-center leading-tight">{tmpl.name}</span>
              <span className="text-[10px] font-black text-primary">+{tmpl.xp} XP</span>
            </button>
          ))}
        </div>
      </div>

      {/* Recent activities */}
      {activities?.length > 0 && (
        <div>
          <h3 className="text-sm font-black uppercase tracking-widest text-muted-foreground mb-3">Recent Activities</h3>
          <div className="space-y-2">
            {activities.slice(0, 8).map(a => (
              <div key={a.id} className="flex items-center justify-between p-3 rounded-xl glass-card shadow-soft">
                <div className="flex items-center gap-2.5">
                  <span className={cn('text-[10px] font-black px-2 py-0.5 rounded-full', CAT_COLORS[a.activity_category] || 'bg-muted text-muted-foreground')}>
                    {a.activity_category}
                  </span>
                  <span className="text-sm font-semibold text-foreground">{a.activity_name}</span>
                </div>
                <span className="text-xs font-black text-primary">+{a.xp_earned}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Parent AI Nudge (Phase 10 Notification Suggestions) */}
      {stats && stats.current_streak === 0 && stats.total_activities > 0 && (
        <div className="rounded-2xl glass-card shadow-soft p-4 border border-orange-500/30 bg-orange-500/5 animate-fade-up">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 w-8 h-8 rounded-full bg-orange-500/20 flex items-center justify-center shrink-0">
              <Sparkles className="h-4 w-4 text-orange-600" />
            </div>
            <div>
              <p className="text-sm font-bold text-foreground mb-1">Gentle Reminder</p>
              <p className="text-xs text-muted-foreground leading-relaxed">{child.name} hasn't logged any activities recently and their streak was lost. Would you like to sit down and read a Story or practice a Dua together today to get them back on track?</p>
              <div className="flex gap-2 mt-3">
                <Button variant="outline" size="sm" className="h-7 text-[10px] rounded-lg border-orange-500/30 text-orange-600 hover:bg-orange-500/10" onClick={() => document.getElementById('stories-tab-btn')?.click()}>Read a Story</Button>
                <Button variant="outline" size="sm" className="h-7 text-[10px] rounded-lg border-orange-500/30 text-orange-600 hover:bg-orange-500/10" onClick={() => document.getElementById('quran-tab-btn')?.click()}>Read Quran Together</Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Parent Analytics Dashboard (Phase 9) */}
      {analytics && (
        <div className="grid md:grid-cols-2 gap-4">
          <div className="rounded-2xl glass-card shadow-soft p-5 border border-emerald-500/20 bg-emerald-500/5">
            <h3 className="text-sm font-black uppercase tracking-widest text-emerald-700 mb-3 flex items-center gap-2"><Book className="h-4 w-4" /> Quran & Duas</h3>
            <div className="space-y-4">
              <div>
                <p className="text-xs font-bold text-muted-foreground mb-1">Hifz Tracking</p>
                <div className="flex justify-between items-end">
                  <span className="text-2xl font-black text-emerald-600">{analytics.quran_progress.surahs_memorized} <span className="text-sm text-emerald-700/70">Surahs</span></span>
                  <span className="text-xs font-bold text-muted-foreground">{analytics.quran_progress.total_ayahs} Ayahs Total</span>
                </div>
              </div>
              <div className="h-px bg-emerald-500/10 w-full" />
              <div>
                <p className="text-xs font-bold text-muted-foreground mb-1">Dua Library</p>
                <div className="flex justify-between items-end">
                  <span className="text-2xl font-black text-emerald-600">{analytics.duas_progress.mastered} <span className="text-sm text-emerald-700/70">Mastered</span></span>
                  <span className="text-xs font-bold text-muted-foreground">{analytics.duas_progress.learning} Learning</span>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-2xl glass-card shadow-soft p-5 border border-blue-500/20 bg-blue-500/5">
            <h3 className="text-sm font-black uppercase tracking-widest text-blue-700 mb-3 flex items-center gap-2"><Target className="h-4 w-4" /> Development</h3>
            <div className="space-y-4">
              <div>
                <p className="text-xs font-bold text-muted-foreground mb-1">Milestones Achieved</p>
                <div className="flex items-center gap-3">
                  <span className="text-2xl font-black text-blue-600">{analytics.milestones_progress.achieved}<span className="text-sm text-blue-700/70">/{analytics.milestones_progress.total}</span></span>
                  <div className="flex-1 h-2 bg-blue-500/20 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-500 rounded-full" style={{ width: `${(analytics.milestones_progress.achieved / (analytics.milestones_progress.total || 1)) * 100}%` }} />
                  </div>
                </div>
              </div>
              <div className="h-px bg-blue-500/10 w-full" />
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-muted-foreground">Stories Read</span>
                <span className="text-lg font-black text-blue-600 flex items-center gap-1.5"><BookOpen className="h-4 w-4" /> {analytics.stories_read}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Badge Collection */}
      <div>
        <h3 className="text-sm font-black uppercase tracking-widest text-muted-foreground mb-3">Badge Collection</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {badgeLibrary.map(tmpl => {
            const earned = badges?.find(b => b.badge_key === tmpl.key)
            return (
              <div key={tmpl.key} className={cn(
                "flex flex-col items-center gap-2 p-4 rounded-2xl glass-card transition-all",
                earned ? "shadow-soft border-gold/20 bg-gold/5" : "opacity-50 grayscale border-transparent"
              )}>
                <div className={cn(
                  "w-12 h-12 rounded-full flex items-center justify-center text-xl shadow-inner",
                  earned ? "bg-gradient-to-br from-gold/30 to-orange-500/30 text-gold" : "bg-muted text-muted-foreground"
                )}>
                  <Medal className="h-6 w-6" />
                </div>
                <div className="text-center">
                  <p className="text-xs font-bold text-foreground leading-tight">{tmpl.name}</p>
                  {earned && <p className="text-[9px] font-black text-gold mt-0.5">EARNED</p>}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'

function MilestonesTab({ child }) {
  const qc = useQueryClient()
  const childId = child.id
  const [libraryOpen, setLibraryOpen] = useState(false)
  const [customOpen, setCustomOpen] = useState(false)
  const [customForm, setCustomForm] = useState({ title: '', category: 'akhlaq' })

  const { data: milestones = [] } = useQuery({
    queryKey: ['child', childId, 'milestones'],
    queryFn: () => api.get(`/children/${childId}/milestones`).then(r => r.data).catch(() => []),
  })

  const { data: library = [] } = useQuery({
    queryKey: ['milestone-library', child.age_group],
    queryFn: () => api.get('/children/milestone-library', { params: { age_group: child.age_group } }).then(r => r.data),
    enabled: libraryOpen && !!child.age_group,
  })

  const { mutate: toggleMs } = useMutation({
    mutationFn: ({ msId, achieved }) => api.patch(`/children/${childId}/milestones/${msId}`, {
      achieved, achieved_date: achieved ? new Date().toISOString().split('T')[0] : null
    }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['child', childId, 'milestones'] }),
  })

  const { mutate: seedAll, isPending: isSeeding } = useMutation({
    mutationFn: () => api.post(`/children/${childId}/milestones/seed-age-group`),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['child', childId, 'milestones'] })
      toast.success(`Seeded ${data.length} age-appropriate milestones!`)
      setLibraryOpen(false)
    },
    onError: () => toast.error('Failed to seed milestones.'),
  })

  const { mutate: addFromLibrary, isPending: isAdding } = useMutation({
    mutationFn: (key) => api.post(`/children/${childId}/milestones/from-library`, null, { params: { key } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['child', childId, 'milestones'] })
      toast.success('Milestone added!')
    },
    onError: () => toast.error('Already added or failed to add.'),
  })

  const { mutate: addCustom, isPending: isAddingCustom } = useMutation({
    mutationFn: (data) => api.post(`/children/${childId}/milestones`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['child', childId, 'milestones'] })
      toast.success('Custom milestone added!')
      setCustomOpen(false)
      setCustomForm({ title: '', category: 'akhlaq' })
    },
    onError: () => toast.error('Failed to add custom milestone.'),
  })

  const achieved = milestones.filter(m => m.achieved).length

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between p-4 rounded-2xl glass-card shadow-soft">
        <div>
          <p className="text-2xl font-black text-primary">{achieved}<span className="text-base text-muted-foreground">/{milestones.length}</span></p>
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Milestones achieved</p>
        </div>
        <div className="w-24 h-24">
          <svg viewBox="0 0 36 36" className="rotate-[-90deg]">
            <circle cx="18" cy="18" r="15.9" fill="none" stroke="currentColor" strokeWidth="2" className="text-muted/30" />
            <circle cx="18" cy="18" r="15.9" fill="none" stroke="currentColor" strokeWidth="2.5"
              className="text-primary transition-all duration-700"
              strokeDasharray={`${milestones.length ? Math.round((achieved / milestones.length) * 100) : 0} 100`}
              strokeLinecap="round"
            />
          </svg>
        </div>
      </div>

      <div className="flex justify-end gap-2 mb-2">
        <button onClick={() => setCustomOpen(true)} className="flex items-center gap-1.5 px-4 py-2 bg-muted/50 text-muted-foreground hover:bg-muted/80 rounded-xl text-xs font-bold transition-colors">
          <Plus className="h-4 w-4" /> Custom
        </button>
        <button onClick={() => setLibraryOpen(true)} className="flex items-center gap-1.5 px-4 py-2 bg-primary/10 text-primary hover:bg-primary/20 rounded-xl text-xs font-bold transition-colors">
          <BookOpen className="h-4 w-4" /> Browse Library
        </button>
      </div>

      {milestones.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Target className="h-10 w-10 mx-auto mb-3 opacity-30" />
          <p className="font-bold">No milestones yet</p>
          <p className="text-sm">Milestones library coming in Phase 2!</p>
        </div>
      ) : (
        MILESTONE_CATS.map(cat => {
          const items = milestones.filter(m => m.category === cat)
          if (!items.length) return null
          return (
            <div key={cat}>
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-2 pl-1">{cat}</p>
              <div className="space-y-1.5">
                {items.map(ms => (
                  <button key={ms.id} onClick={() => toggleMs({ msId: ms.id, achieved: !ms.achieved })}
                    className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-muted/40 transition-colors text-left group">
                    {ms.achieved
                      ? <CheckCircle className="h-5 w-5 text-green-500 shrink-0" />
                      : <Circle className="h-5 w-5 text-muted-foreground/30 group-hover:text-muted-foreground/60 shrink-0" />
                    }
                    <p className={cn('text-sm font-semibold flex-1', ms.achieved && 'text-muted-foreground/50 line-through')}>
                      {ms.title}
                    </p>
                    {ms.achieved && <Star className="h-4 w-4 text-gold fill-gold shrink-0" />}
                  </button>
                ))}
              </div>
            </div>
          )
        })
      )}

      {/* Library Modal */}
      <Dialog open={libraryOpen} onOpenChange={setLibraryOpen}>
        <DialogContent className="sm:max-w-xl max-h-[80vh] overflow-hidden flex flex-col rounded-3xl p-0 bg-background/95 backdrop-blur-xl">
          <div className="p-6 pb-4 border-b border-border/50 flex justify-between items-center bg-muted/20">
            <div>
              <DialogTitle className="text-xl font-black">Milestone Library</DialogTitle>
              <p className="text-sm text-muted-foreground font-bold capitalize mt-1">Recommended for: {child.age_group} ({child.name})</p>
            </div>
            <Button onClick={() => seedAll()} disabled={isSeeding} className="rounded-xl shadow-glow-primary">
              {isSeeding ? 'Seeding...' : 'Seed All'} <Sparkles className="ml-1.5 h-4 w-4" />
            </Button>
          </div>
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {library.length === 0 && <p className="text-muted-foreground text-center py-8">No milestones found for this age group.</p>}
            {library.map(tmpl => {
              const alreadyAdded = milestones.some(m => m.title === tmpl.title)
              return (
                <div key={tmpl.key} className="flex items-center justify-between gap-3 p-4 rounded-2xl glass-card shadow-soft">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-foreground leading-tight">{tmpl.title}</p>
                    {tmpl.description && <p className="text-[11px] text-muted-foreground mt-1">{tmpl.description}</p>}
                    <span className={cn('text-[10px] font-black px-2 py-0.5 rounded-full inline-block mt-2', CAT_COLORS[tmpl.category] || 'bg-muted text-muted-foreground')}>
                      {tmpl.category}
                    </span>
                  </div>
                  <Button
                    variant={alreadyAdded ? "secondary" : "default"}
                    size="sm"
                    className="rounded-xl shrink-0"
                    disabled={alreadyAdded || isAdding}
                    onClick={() => addFromLibrary(tmpl.key)}
                  >
                    {alreadyAdded ? 'Added' : <Plus className="h-4 w-4" />}
                  </Button>
                </div>
              )
            })}
          </div>
        </DialogContent>
      </Dialog>

      {/* Custom Milestone Modal */}
      <Dialog open={customOpen} onOpenChange={setCustomOpen}>
        <DialogContent className="sm:max-w-md rounded-3xl p-6 bg-background/95 backdrop-blur-xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-black flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" /> Add Custom Milestone
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div>
              <label className="text-xs font-bold text-foreground mb-1.5 block">Milestone Title</label>
              <Input
                value={customForm.title}
                onChange={e => setCustomForm({ ...customForm, title: e.target.value })}
                placeholder="e.g. Can tie their shoes"
                className="rounded-xl"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-foreground mb-1.5 block">Category</label>
              <div className="grid grid-cols-2 gap-2">
                {MILESTONE_CATS.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setCustomForm({ ...customForm, category: cat })}
                    className={cn(
                      'py-2 rounded-xl text-xs font-bold capitalize transition-all border-2 text-left px-3',
                      customForm.category === cat
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border bg-muted/40 text-muted-foreground hover:bg-muted'
                    )}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2 mt-4">
            <DialogClose asChild>
              <Button variant="outline" className="rounded-xl">Cancel</Button>
            </DialogClose>
            <Button
              onClick={() => addCustom(customForm)}
              disabled={isAddingCustom || !customForm.title.trim()}
              className="rounded-xl bg-primary hover:opacity-90"
            >
              {isAddingCustom ? 'Adding...' : 'Add Milestone'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function DuasTab({ child }) {
  const qc = useQueryClient()
  const childId = child.id
  const [libraryOpen, setLibraryOpen] = useState(false)
  
  const { data: duas = [] } = useQuery({
    queryKey: ['child', childId, 'duas'],
    queryFn: () => api.get(`/children/${childId}/duas`).then(r => r.data).catch(() => []),
  })

  const { data: library = [] } = useQuery({
    queryKey: ['dua-library', child.age_group],
    queryFn: () => api.get('/children/dua-library', { params: { age_group: child.age_group } }).then(r => r.data),
    enabled: !!child.age_group,
  })

  const { mutate: addFromLibrary, isPending: isAdding } = useMutation({
    mutationFn: (key) => api.post(`/children/${childId}/duas/from-library`, null, { params: { key } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['child', childId, 'duas'] })
      toast.success('Dua added to tracker!')
      setLibraryOpen(false)
    },
  })

  const { mutate: practiceDua } = useMutation({
    mutationFn: (id) => api.post(`/children/${childId}/duas/${id}/practice`),
    onSuccess: () => { 
      qc.invalidateQueries({ queryKey: ['child', childId, 'duas'] })
      qc.invalidateQueries({ queryKey: ['child', childId] })
      toast.success('Practice logged! +XP 🌟') 
    },
  })

  const { mutate: updateDua } = useMutation({
    mutationFn: ({ id, status }) => api.patch(`/children/${childId}/duas/${id}`, {
      status, mastered_date: status === 'mastered' ? new Date().toISOString().split('T')[0] : null
    }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['child', childId, 'duas'] }); toast.success('Status updated!') },
  })

  const STATUS_CONFIG = {
    not_started: { label:'Not Started', color:'bg-muted/50 text-muted-foreground' },
    learning:    { label:'Learning',    color:'bg-blue-500/15 text-blue-600' },
    reciting:    { label:'Reciting',    color:'bg-amber-500/15 text-amber-600' },
    mastered:    { label:'Mastered',    color:'bg-green-500/15 text-green-600' },
  }
  const STATUS_ORDER = ['not_started','learning','reciting','mastered']

  const mastered = duas.filter(d => d.status === 'mastered').length

  return (
    <div className="space-y-6">
      <div className="p-4 rounded-2xl glass-card shadow-soft flex items-center justify-between">
        <div>
          <p className="text-2xl font-black text-green-500">{mastered}</p>
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Duas Mastered</p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-black text-primary">{duas.length}</p>
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Total Tracked</p>
        </div>
      </div>

      <div className="flex justify-between items-center">
        <h2 className="text-lg font-black text-foreground">Learning List</h2>
        <Button onClick={() => setLibraryOpen(true)} className="rounded-xl shadow-glow-primary bg-primary hover:bg-primary/90 text-white font-bold h-9 px-4">
          <Plus className="h-4 w-4 mr-1.5" /> Browse Library
        </Button>
      </div>

      {duas.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground bg-muted/20 rounded-3xl border border-dashed border-border/50">
          <Heart className="h-10 w-10 mx-auto mb-3 opacity-30" />
          <p className="font-bold">No duas tracked yet</p>
          <p className="text-sm mt-1">Start by adding a simple dua from the library.</p>
          <Button onClick={() => setLibraryOpen(true)} variant="outline" className="mt-4 rounded-xl font-bold bg-background">
            Open Dua Library
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {duas.map(d => {
            const cfg = STATUS_CONFIG[d.status] || STATUS_CONFIG.not_started
            const currentIdx = STATUS_ORDER.indexOf(d.status)
            const nextStatus = STATUS_ORDER[currentIdx + 1]
            const libDua = library.find(l => l.key === d.dua_key)

            return (
              <div key={d.id} className="p-5 rounded-2xl glass-card shadow-soft space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-black text-lg text-foreground">{d.dua_name}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={cn('text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest', cfg.color)}>
                        {cfg.label}
                      </span>
                      {d.practice_count > 0 && (
                        <span className="text-[10px] font-bold text-muted-foreground">
                          Practiced {d.practice_count} time{d.practice_count !== 1 && 's'}
                        </span>
                      )}
                    </div>
                  </div>
                  {nextStatus && (
                    <button onClick={() => updateDua({ id: d.id, status: nextStatus })}
                      className="text-xs font-bold text-primary hover:text-primary/80 px-3 py-1.5 rounded-lg bg-primary/10 hover:bg-primary/20 transition-colors">
                      Mark as {STATUS_CONFIG[nextStatus].label}
                    </button>
                  )}
                </div>

                {libDua && (
                  <div className="p-4 rounded-xl bg-purple-500/5 border border-purple-500/10 space-y-3">
                    <p className="text-2xl font-arabic text-gold text-right leading-loose" dir="rtl">{libDua.arabic}</p>
                    <div>
                      <p className="text-sm font-bold text-foreground mb-0.5">{libDua.transliteration}</p>
                      <p className="text-xs text-muted-foreground italic">"{libDua.translation}"</p>
                    </div>
                  </div>
                )}

                <div className="flex justify-end pt-2 border-t border-border/50">
                  <Button onClick={() => practiceDua(d.id)} variant="ghost" className="h-8 rounded-lg font-bold text-primary hover:bg-primary/10 hover:text-primary">
                    <BookOpen className="h-4 w-4 mr-2" /> Practice (+5 XP)
                  </Button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Library Modal */}
      <Dialog open={libraryOpen} onOpenChange={setLibraryOpen}>
        <DialogContent className="sm:max-w-xl max-h-[85vh] overflow-hidden flex flex-col rounded-3xl p-0">
          <DialogHeader className="p-6 pb-4 border-b border-border/50">
            <DialogTitle className="text-xl font-black">Dua Library</DialogTitle>
            <p className="text-sm text-muted-foreground font-medium">Age-appropriate duas for {child.name}</p>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-muted/10">
            {library.map(lib => {
              const isTracking = duas.some(d => d.dua_key === lib.key)
              return (
                <div key={lib.key} className="p-4 rounded-2xl bg-background border border-border/50 shadow-sm">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-bold text-foreground">{lib.name}</h3>
                    <span className="text-[10px] uppercase tracking-wider font-black text-muted-foreground px-2 py-0.5 bg-muted rounded-full">
                      {lib.difficulty} • +{lib.xp} XP
                    </span>
                  </div>
                  <p className="text-xl font-arabic text-right mb-2" dir="rtl">{lib.arabic}</p>
                  <p className="text-xs text-muted-foreground mb-4">{lib.translation}</p>
                  
                  <Button 
                    onClick={() => addFromLibrary(lib.key)} 
                    disabled={isTracking || isAdding}
                    variant={isTracking ? "secondary" : "default"}
                    className="w-full rounded-xl font-bold"
                  >
                    {isTracking ? 'Already Tracking' : 'Add to Tracker'}
                  </Button>
                </div>
              )
            })}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function StoriesTab({ child }) {
  const qc = useQueryClient()
  const childId = child.id
  const [readingStory, setReadingStory] = useState(null)

  const { data: stories = [] } = useQuery({
    queryKey: ['story-library', child.age_group],
    queryFn: () => api.get('/children/story-library', { params: { age_group: child.age_group } }).then(r => r.data),
    enabled: !!child.age_group,
  })

  const { data: progress = [] } = useQuery({
    queryKey: ['child', childId, 'stories-progress'],
    queryFn: () => api.get(`/children/${childId}/stories/progress`).then(r => r.data).catch(() => []),
  })

  const { mutate: completeStory, isPending: isCompleting } = useMutation({
    mutationFn: (key) => api.post(`/children/${childId}/stories/${key}/complete`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['child', childId, 'stories-progress'] })
      qc.invalidateQueries({ queryKey: ['child', childId] })
      toast.success('Story completed! XP Earned 🌟')
      setReadingStory(null)
    },
  })

  return (
    <div className="space-y-4">
      {stories.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <BookOpen className="h-10 w-10 mx-auto mb-3 opacity-30" />
          <p className="font-bold">No stories available yet</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {stories.map(s => {
            const prog = progress.find(p => p.story_key === s.key)
            const isCompleted = prog?.times_read > 0
            return (
              <button key={s.key} onClick={() => setReadingStory(s.key)}
                className="flex flex-col text-left p-4 rounded-2xl glass-card shadow-soft hover:shadow-elevated transition-all group">
                <div className="flex justify-between items-start mb-2">
                  <div className="p-2 rounded-xl bg-purple-500/10 text-purple-500">
                    <BookOpen className="h-5 w-5" />
                  </div>
                  {isCompleted && <div className="px-2 py-1 rounded-full bg-green-500/10 text-green-600 text-[10px] font-black">Read x{prog.times_read}</div>}
                </div>
                <h3 className="font-bold text-foreground mb-1 leading-tight group-hover:text-primary transition-colors">{s.title}</h3>
                <p className="text-xs text-muted-foreground mb-3 flex-1">{s.moral}</p>
                <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-wider text-muted-foreground mt-auto pt-3 border-t border-border/50">
                  <span>{s.estimated_minutes} min read</span>
                  <span>•</span>
                  <span className="capitalize">{s.category}</span>
                </div>
              </button>
            )
          })}
        </div>
      )}

      <Dialog open={!!readingStory} onOpenChange={(v) => !v && setReadingStory(null)}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-hidden flex flex-col rounded-3xl p-0 bg-background/95 backdrop-blur-xl border-purple-500/20">
          <StoryReader
            storyKey={readingStory}
            onComplete={() => completeStory(readingStory)}
            isCompleting={isCompleting}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}

function StoryReader({ storyKey, onComplete, isCompleting }) {
  const { data: story, isLoading } = useQuery({
    queryKey: ['story', storyKey],
    queryFn: () => api.get(`/children/story-library/${storyKey}`).then(r => r.data),
    enabled: !!storyKey,
  })

  if (isLoading) return <div className="p-12 text-center text-muted-foreground animate-pulse">Loading story...</div>
  if (!story) return null

  return (
    <>
      <div className="p-6 pb-4 border-b border-border/50 bg-purple-500/5">
        <DialogTitle className="text-2xl font-black text-foreground leading-tight mb-2">
          {story.title}
        </DialogTitle>
        <p className="text-sm font-bold text-purple-600 flex items-center gap-1.5">
          <Star className="h-4 w-4" /> Lesson: {story.moral}
        </p>
      </div>
      
      <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6">
        <div className="prose prose-lg dark:prose-invert max-w-none text-foreground/90 font-medium leading-relaxed" style={{ fontSize: '1.1rem' }}>
          {story.content.split('\n\n').map((para, i) => (
            <p key={i} className="mb-4">{para}</p>
          ))}
        </div>

        {story.arabic_dua && (
          <div className="mt-8 p-6 rounded-2xl bg-gold/10 border border-gold/20 text-center">
            <p className="text-2xl md:text-3xl font-arabic text-gold leading-loose mb-3" dir="rtl">
              {story.arabic_dua}
            </p>
            <p className="text-sm font-bold text-muted-foreground">{story.related_dua}</p>
          </div>
        )}
      </div>

      <DialogFooter className="p-4 border-t border-border/50 bg-background">
        <DialogClose asChild>
          <Button variant="ghost" className="rounded-xl font-bold">Close</Button>
        </DialogClose>
        <Button 
          onClick={onComplete} 
          disabled={isCompleting}
          className="rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold shadow-glow-primary px-8"
        >
          {isCompleting ? 'Saving...' : 'I Finished Reading! 🎉'}
        </Button>
      </DialogFooter>
    </>
  )
}

function QuranTab({ child }) {
  const qc = useQueryClient()
  const childId = child.id
  const [libraryOpen, setLibraryOpen] = useState(false)
  const [surahList, setSurahList] = useState([])
  const [isLoadingSurahs, setIsLoadingSurahs] = useState(false)

  const { data: progress = [] } = useQuery({
    queryKey: ['child', childId, 'quran'],
    queryFn: () => api.get(`/children/${childId}/quran`).then(r => r.data).catch(() => []),
  })

  const loadSurahs = async () => {
    if (surahList.length > 0) {
      setLibraryOpen(true)
      return
    }
    setIsLoadingSurahs(true)
    try {
      const res = await api.get('/quran/surahs')
      setSurahList(res.data)
      setLibraryOpen(true)
    } catch (e) {
      toast.error('Failed to load Surah list')
    } finally {
      setIsLoadingSurahs(false)
    }
  }

  const { mutate: trackSurah, isPending: isTracking } = useMutation({
    mutationFn: (surah) => api.post(`/children/${childId}/quran`, {
      surah_number: surah.id || surah.number,
      surah_name: surah.name_simple || surah.name,
      total_ayahs: surah.verses_count || surah.ayahCount
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['child', childId, 'quran'] })
      toast.success('Started tracking Surah!')
      setLibraryOpen(false)
    },
    onError: (err) => {
      toast.error(err.response?.data?.detail || 'Failed to track Surah')
    }
  })

  const { mutate: updateSurah } = useMutation({
    mutationFn: ({ surah_number, ...data }) => api.patch(`/children/${childId}/quran/${surah_number}`, data),
    onSuccess: () => { 
      qc.invalidateQueries({ queryKey: ['child', childId, 'quran'] })
      toast.success('Progress updated!') 
    },
  })

  const STATUS_CONFIG = {
    not_started: { label:'Not Started', color:'bg-muted/50 text-muted-foreground' },
    learning:    { label:'Learning',    color:'bg-blue-500/15 text-blue-600' },
    memorizing:  { label:'Memorizing',  color:'bg-amber-500/15 text-amber-600' },
    reviewing:   { label:'Reviewing',   color:'bg-purple-500/15 text-purple-600' },
    memorized:   { label:'Memorized',   color:'bg-green-500/15 text-green-600' },
  }
  
  const STATUS_ORDER = ['not_started','learning','memorizing','reviewing','memorized']
  const memorizedCount = progress.filter(p => p.status === 'memorized').length

  return (
    <div className="space-y-6">
      <div className="p-4 rounded-2xl glass-card shadow-soft flex items-center justify-between bg-gradient-to-br from-emerald-500/5 to-emerald-500/10 border border-emerald-500/20">
        <div>
          <p className="text-3xl font-black text-emerald-600">{memorizedCount}</p>
          <p className="text-xs font-bold text-emerald-700/70 uppercase tracking-wider">Surahs Memorized</p>
        </div>
        <div className="text-right">
          <p className="text-3xl font-black text-primary">{progress.length}</p>
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Currently Tracking</p>
        </div>
      </div>

      <div className="flex justify-between items-center">
        <h2 className="text-lg font-black text-foreground">Hifz Tracker</h2>
        <div className="flex gap-2">
          <Link to="/quran" className="flex items-center gap-1.5 px-4 h-9 rounded-xl border border-border/50 text-xs font-bold text-muted-foreground hover:bg-muted/50 transition-colors">
            <BookOpen className="h-3.5 w-3.5" /> Read Together
          </Link>
          <Button onClick={loadSurahs} disabled={isLoadingSurahs} className="rounded-xl shadow-glow-primary bg-primary hover:bg-primary/90 text-white font-bold h-9 px-4">
            <Plus className="h-4 w-4 mr-1.5" /> Track New Surah
          </Button>
        </div>
      </div>

      {progress.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground bg-muted/20 rounded-3xl border border-dashed border-border/50">
          <BookOpen className="h-10 w-10 mx-auto mb-3 opacity-30" />
          <p className="font-bold">No Surahs tracked yet</p>
          <p className="text-sm mt-1">Start by tracking Surah Al-Fatihah or short Surahs from Juz 30.</p>
          <Button onClick={loadSurahs} disabled={isLoadingSurahs} variant="outline" className="mt-4 rounded-xl font-bold bg-background">
            Open Surah List
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {progress.map(p => {
            const cfg = STATUS_CONFIG[p.status] || STATUS_CONFIG.not_started
            const currentIdx = STATUS_ORDER.indexOf(p.status)
            const nextStatus = STATUS_ORDER[currentIdx + 1]

            return (
              <div key={p.id} className="p-5 rounded-2xl glass-card shadow-soft space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-black text-lg text-foreground flex items-center gap-2">
                      <span className="text-muted-foreground text-sm font-bold w-6">{p.surah_number}.</span>
                      {p.surah_name}
                    </h3>
                    <div className="flex items-center gap-2 mt-1.5">
                      <span className={cn('text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest', cfg.color)}>
                        {cfg.label}
                      </span>
                      <span className="text-[10px] font-bold text-muted-foreground">
                        {p.ayahs_memorized} / {p.total_ayahs} Ayahs
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {nextStatus && (
                      <button onClick={() => updateSurah({ surah_number: p.surah_number, status: nextStatus })}
                        className="text-xs font-bold text-primary hover:text-primary/80 px-3 py-1.5 rounded-lg bg-primary/10 hover:bg-primary/20 transition-colors">
                        Mark as {STATUS_CONFIG[nextStatus].label}
                      </button>
                    )}
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-xs font-bold text-muted-foreground">
                    <span>Memorization Progress</span>
                    <span>{Math.round((p.ayahs_memorized / p.total_ayahs) * 100)}%</span>
                  </div>
                  <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-emerald-500 transition-all duration-500 rounded-full" 
                      style={{ width: `${Math.min(100, Math.max(0, (p.ayahs_memorized / p.total_ayahs) * 100))}%` }} 
                    />
                  </div>
                </div>

                <div className="flex justify-between items-center pt-2 border-t border-border/50">
                  <div className="flex gap-2">
                    <Button onClick={() => updateSurah({ surah_number: p.surah_number, ayahs_memorized: Math.max(0, p.ayahs_memorized - 1) })} variant="ghost" className="h-8 w-8 p-0 rounded-lg text-muted-foreground">
                      -
                    </Button>
                    <div className="h-8 px-3 flex items-center justify-center rounded-lg bg-muted/50 font-bold text-sm">
                      {p.ayahs_memorized} Ayahs
                    </div>
                    <Button onClick={() => updateSurah({ surah_number: p.surah_number, ayahs_memorized: Math.min(p.total_ayahs, p.ayahs_memorized + 1) })} variant="ghost" className="h-8 w-8 p-0 rounded-lg text-emerald-600 hover:text-emerald-700 hover:bg-emerald-500/10">
                      +
                    </Button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Surah List Modal */}
      <Dialog open={libraryOpen} onOpenChange={setLibraryOpen}>
        <DialogContent className="sm:max-w-xl max-h-[85vh] overflow-hidden flex flex-col rounded-3xl p-0">
          <DialogHeader className="p-6 pb-4 border-b border-border/50">
            <DialogTitle className="text-xl font-black">Quran Index</DialogTitle>
            <p className="text-sm text-muted-foreground font-medium">Select a Surah to start tracking</p>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto p-4 space-y-2 bg-muted/10">
            {surahList.map(surah => {
              const surahNum = surah.id || surah.number;
              const surahName = surah.name_simple || surah.name;
              const totalAyahs = surah.verses_count || surah.ayahCount;
              const isTracking = progress.some(p => p.surah_number === surahNum)
              return (
                <div key={surahNum} className="flex items-center justify-between p-3 rounded-xl bg-background border border-border/50 shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center text-xs font-bold text-muted-foreground">
                      {surahNum}
                    </div>
                    <div>
                      <h3 className="font-bold text-foreground leading-tight">{surahName}</h3>
                      <p className="text-[10px] uppercase font-bold text-muted-foreground mt-0.5">{totalAyahs} Ayahs</p>
                    </div>
                  </div>
                  
                  <Button 
                    onClick={() => trackSurah(surah)} 
                    disabled={isTracking || isTracking}
                    variant={isTracking ? "secondary" : "default"}
                    className="rounded-lg font-bold h-8 text-xs"
                  >
                    {isTracking ? 'Tracking' : 'Track'}
                  </Button>
                </div>
              )
            })}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function LessonsTab({ child }) {
  const qc = useQueryClient()
  const childId = child.id
  
  const { data: curriculum = [] } = useQuery({
    queryKey: ['curriculum', child.age_group],
    queryFn: () => api.get('/children/curriculum', { params: { age_group: child.age_group || 'young' } }).then(r => r.data),
  })

  const { data: lessons = [] } = useQuery({
    queryKey: ['child', childId, 'lessons'],
    queryFn: () => api.get(`/children/${childId}/lessons`).then(r => r.data).catch(() => []),
  })

  const { data: stats } = useQuery({
    queryKey: ['child', childId, 'lessons', 'stats'],
    queryFn: () => api.get(`/children/${childId}/lessons/stats`).then(r => r.data).catch(() => null),
  })

  const [customLessonOpen, setCustomLessonOpen] = useState(false)
  const [customForm, setCustomForm] = useState({ subject: 'Akhlaq', topic: '', duration_minutes: 15 })

  const { mutate: logLesson, isPending: isLogging } = useMutation({
    mutationFn: (data) => api.post(`/children/${childId}/lessons`, data).then(r => r.data),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['child', childId] })
      
      if (data.leveled_up) {
        toast.success(`🎉 LEVEL UP! The child is now a ${data.level_name}!`, { duration: 4000 })
      } else {
        toast.success(`Lesson logged successfully! +${data.xp_gained} XP! 🌟`)
      }
      data.new_badges?.forEach(b =>
        setTimeout(() => toast.success(`🏅 New badge earned: ${b.badge_name}!`, { duration: 3000 }), 800)
      )
    },
    onError: (e) => toast.error(e.response?.data?.detail || 'Failed to log lesson')
  })

  const handleLog = (subject, topic) => {
    logLesson({
      lesson_date: new Date().toISOString().split('T')[0],
      subject,
      topic,
      duration_minutes: 15,
      rating: 5
    })
  }

  const handleCustomLog = (e) => {
    e.preventDefault()
    if (!customForm.topic.trim()) return
    logLesson({
      lesson_date: new Date().toISOString().split('T')[0],
      subject: customForm.subject,
      topic: customForm.topic,
      duration_minutes: parseInt(customForm.duration_minutes) || 15,
      rating: 5
    })
    setCustomLessonOpen(false)
    setCustomForm({ subject: 'Akhlaq', topic: '', duration_minutes: 15 })
  }

  return (
    <div className="space-y-6">
      <div className="p-4 rounded-2xl glass-card shadow-soft flex items-center justify-between bg-gradient-to-br from-blue-500/5 to-blue-500/10 border border-blue-500/20">
        <div>
          <p className="text-3xl font-black text-blue-600">{stats?.total_lessons || 0}</p>
          <p className="text-xs font-bold text-blue-700/70 uppercase tracking-wider">Lessons Completed</p>
        </div>
        <div className="text-right">
          <p className="text-3xl font-black text-primary">{Math.round((stats?.total_minutes || 0) / 60)}h</p>
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Learning Time</p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-black text-foreground flex items-center gap-2">
              <div className="p-1.5 rounded-xl bg-blue-500/10"><Lightbulb className="h-5 w-5 text-blue-500" /></div>
              Curriculum Roadmap
            </h2>
            <Button onClick={() => setCustomLessonOpen(true)} size="sm" variant="outline" className="rounded-xl border-blue-500/30 text-blue-600 hover:bg-blue-500/10 font-bold">
              <Plus className="h-4 w-4 mr-1" /> Custom
            </Button>
          </div>
          {curriculum.map((group, i) => (
            <div key={i} className="p-5 rounded-3xl glass-card border border-border/50 shadow-sm relative overflow-hidden">
              {/* Background accent */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-blue-500/5 to-transparent rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none" />
              
              <h3 className="font-black text-blue-600 mb-4 text-sm uppercase tracking-widest flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-blue-500" /> {group.subject}
              </h3>
              <div className="space-y-3">
                {group.topics.map((topic, j) => {
                  const isDone = lessons.some(l => l.subject === group.subject && l.topic === topic)
                  return (
                    <div key={j} className={cn("group flex items-center justify-between p-3 rounded-2xl transition-all border", 
                      isDone ? "bg-muted/30 border-transparent" : "bg-card hover:border-blue-500/30 hover:shadow-sm border-border/50")}>
                      <div className="flex items-center gap-3 flex-1">
                        <div className={cn("shrink-0 h-8 w-8 rounded-full border-2 flex items-center justify-center transition-all shadow-sm", 
                          isDone ? "bg-emerald-500 border-emerald-500 text-white" : "border-muted-foreground/20 bg-background")}>
                          {isDone ? <CheckCircle className="h-5 w-5" /> : <div className="h-2.5 w-2.5 rounded-full bg-muted-foreground/20" />}
                        </div>
                        <p className={cn("text-sm font-bold leading-snug", isDone ? "text-muted-foreground line-through" : "text-foreground")}>{topic}</p>
                      </div>
                      {!isDone && (
                        <Button 
                          size="sm" 
                          disabled={isLogging}
                          onClick={() => handleLog(group.subject, topic)}
                          className="shrink-0 h-8 rounded-xl font-bold bg-blue-500/10 text-blue-600 hover:bg-blue-500 hover:text-white shadow-none opacity-0 group-hover:opacity-100 transition-all"
                        >
                          Log
                        </Button>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>

        <div className="space-y-4">
          <h2 className="text-lg font-black text-foreground flex items-center gap-2">
            <div className="p-1.5 rounded-xl bg-gold/10"><Star className="h-5 w-5 text-gold" /></div>
            Recent Logs
          </h2>
          {lessons.length === 0 ? (
            <div className="text-center py-10 bg-muted/20 rounded-2xl border border-dashed border-border/50">
              <p className="text-sm font-bold text-muted-foreground">No lessons logged yet.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {lessons.slice(0, 5).map(l => (
                <div key={l.id} className="p-3 rounded-xl bg-background border border-border/50 shadow-sm flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-primary">{l.subject}</span>
                    <p className="text-sm font-bold text-foreground">{l.topic}</p>
                  </div>
                  <div className="text-right">
                    <div className="flex text-gold">
                      {[...Array(5)].map((_, i) => <Star key={i} className={cn("h-3 w-3", i < (l.rating || 5) ? "fill-gold" : "opacity-30")} />)}
                    </div>
                    <span className="text-[10px] font-bold text-muted-foreground">{l.duration_minutes || 15} min</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Custom Lesson Modal */}
      <Dialog open={customLessonOpen} onOpenChange={setCustomLessonOpen}>
        <DialogContent className="sm:max-w-md rounded-3xl p-6">
          <DialogHeader className="mb-4">
            <DialogTitle className="text-xl font-black">Log Custom Lesson</DialogTitle>
            <p className="text-sm text-muted-foreground font-medium">Record a lesson that isn't in the curriculum.</p>
          </DialogHeader>
          <form onSubmit={handleCustomLog} className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-foreground">Subject</label>
              <select 
                className="w-full flex h-10 rounded-xl border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                value={customForm.subject}
                onChange={e => setCustomForm({ ...customForm, subject: e.target.value })}
              >
                {['Aqeedah', 'Akhlaq', 'Salah', 'Seerah', 'Fiqh', 'Quran', 'Arabic', 'Other'].map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-foreground">Topic Description</label>
              <Input 
                autoFocus
                placeholder="e.g. Discussing honesty with parents" 
                value={customForm.topic} 
                onChange={e => setCustomForm({ ...customForm, topic: e.target.value })} 
                className="rounded-xl h-10" 
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-foreground">Duration (Minutes)</label>
              <Input 
                type="number"
                min="1"
                placeholder="15" 
                value={customForm.duration_minutes} 
                onChange={e => setCustomForm({ ...customForm, duration_minutes: e.target.value })} 
                className="rounded-xl h-10" 
              />
            </div>
            <div className="pt-2 flex gap-3">
              <Button type="button" variant="outline" className="flex-1 rounded-xl font-bold" onClick={() => setCustomLessonOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={!customForm.topic.trim() || isLogging} className="flex-1 rounded-xl font-bold bg-primary hover:bg-primary/90 text-white shadow-glow-primary">
                {isLogging ? 'Logging...' : 'Log Lesson'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default function ChildDetailPage() {
  const { childId } = Route.useParams()
  const [tab, setTab] = useState('overview')

  const { data: child, isLoading } = useQuery({
    queryKey: ['child', childId],
    queryFn: () => api.get(`/children/${childId}`).then(r => r.data),
  })
  const { data: stats } = useQuery({
    queryKey: ['child', childId, 'stats'],
    queryFn: () => api.get(`/children/${childId}/stats`).then(r => r.data).catch(() => null),
  })
  const { data: analytics } = useQuery({
    queryKey: ['child', childId, 'analytics'],
    queryFn: () => api.get(`/children/${childId}/analytics`).then(r => r.data).catch(() => null),
  })
  const { data: activities = [] } = useQuery({
    queryKey: ['child', childId, 'activities'],
    queryFn: () => api.get(`/children/${childId}/activities`).then(r => r.data).catch(() => []),
  })
  const { data: badges = [] } = useQuery({
    queryKey: ['child', childId, 'badges'],
    queryFn: () => api.get(`/children/${childId}/badges`).then(r => r.data).catch(() => []),
  })

  const TABS = [
    { id:'overview',    label:'Overview',   icon: BarChart2 },
    { id:'lessons',     label:'Lessons',    icon: Lightbulb },
    { id:'stories',     label:'Stories',    icon: BookOpen },
    { id:'quran',       label:'Quran',      icon: Book },
    { id:'milestones',  label:'Milestones', icon: Target },
    { id:'duas',        label:'Duas',       icon: Heart },
  ]

  if (isLoading) return (
    <div className="space-y-4">
      {[1,2,3].map(i => <div key={i} className="h-24 rounded-2xl bg-muted/40 animate-pulse" />)}
    </div>
  )

  if (!child) return (
    <div className="text-center py-20 text-muted-foreground">
      <p className="font-bold">Child not found</p>
      <Link to="/children/" className="text-primary font-bold text-sm mt-2 block">← Back to children</Link>
    </div>
  )

  const ageMonths = child.date_of_birth
    ? differenceInMonths(new Date(), new Date(child.date_of_birth))
    : null

  const AGE_THEMES = {
    toddler: 'bg-gradient-to-br from-pink-500/10 via-rose-400/5 to-orange-400/10 border-pink-200/50',
    young: 'bg-gradient-to-br from-blue-500/10 via-cyan-400/5 to-teal-400/10 border-blue-200/50',
    middle: 'bg-gradient-to-br from-indigo-500/10 via-purple-500/5 to-fuchsia-500/10 border-indigo-200/50',
    preteen: 'bg-gradient-to-br from-slate-500/10 via-zinc-400/5 to-stone-400/10 border-slate-200/50',
    default: 'bg-gradient-to-br from-primary/5 to-transparent'
  }
  const themeClass = AGE_THEMES[child.age_group] || AGE_THEMES.default

  return (
    <div className={cn("space-y-6 animate-slide-up p-4 sm:p-6 rounded-3xl border border-border/40 min-h-screen", themeClass)}>
      {/* Back + Header */}
      <div>
        <Link to="/children/" className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground hover:text-foreground mb-4">
          <ArrowLeft className="h-3.5 w-3.5" /> All Children
        </Link>
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-gold/20 flex items-center justify-center text-4xl shadow-soft border border-primary/10 shrink-0">
            {child.avatar_emoji}
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-black text-foreground">{child.name}</h1>
            {ageMonths !== null && (
              <p className="text-sm text-muted-foreground font-bold">
                {Math.floor(ageMonths / 12)}y {ageMonths % 12}m old
                {child.age_group && <span className="ml-2 text-primary/80 capitalize">· {child.age_group}</span>}
              </p>
            )}
          </div>
          <div className="flex flex-col items-end gap-2 shrink-0">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gold/15 border border-gold/20">
              <Star className="h-4 w-4 text-gold fill-gold" />
              <span className="text-sm font-black text-gold">Lv {child.level || 1}</span>
            </div>
            <Link to="/children/kids-mode" className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary hover:bg-primary/90 text-white shadow-glow-primary transition-all hover:scale-105 active:scale-95">
              <Sparkles className="h-4 w-4" />
              <span className="text-sm font-black">Kids Mode</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Sub-tabs */}
      <div className="flex gap-1 p-1 bg-muted/50 rounded-2xl overflow-x-auto scrollbar-none">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button key={id} id={`${id}-tab-btn`} onClick={() => setTab(id)}
            className={cn(
              'flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-bold transition-all shrink-0 min-w-max',
              tab === id ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <Icon className="h-3.5 w-3.5" /> {label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div>
        {tab === 'overview'   && <OverviewTab child={child} stats={stats} analytics={analytics} activities={activities} badges={badges} />}
        {tab === 'lessons'    && <LessonsTab child={child} />}
        {tab === 'stories'    && <StoriesTab child={child} />}
        {tab === 'quran'      && <QuranTab child={child} />}
        {tab === 'milestones' && <MilestonesTab child={child} />}
        {tab === 'duas'       && <DuasTab child={child} />}
      </div>
    </div>
  )
}
