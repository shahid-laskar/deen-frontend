import React, { useState } from 'react'
import { createFileRoute, Link } from '@tanstack/react-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { differenceInMonths } from 'date-fns'
import {
  ArrowLeft, Star, Flame, Trophy, BookOpen, Heart, CheckCircle,
  Circle, Sparkles, Zap, Target, BarChart2, Medal, Plus, Trash2
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

function OverviewTab({ child, stats, activities, badges }) {
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
    { id:'stories',     label:'Stories',    icon: BookOpen },
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

  return (
    <div className="space-y-6 animate-slide-up">
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
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gold/15 border border-gold/20 shrink-0">
            <Star className="h-4 w-4 text-gold fill-gold" />
            <span className="text-sm font-black text-gold">Lv {child.level || 1}</span>
          </div>
        </div>
      </div>

      {/* Sub-tabs */}
      <div className="flex gap-1 p-1 bg-muted/50 rounded-2xl">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button key={id} onClick={() => setTab(id)}
            className={cn(
              'flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold transition-all',
              tab === id ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <Icon className="h-3.5 w-3.5" /> {label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div>
        {tab === 'overview'   && <OverviewTab child={child} stats={stats} activities={activities} badges={badges} />}
        {tab === 'stories'    && <StoriesTab child={child} />}
        {tab === 'milestones' && <MilestonesTab child={child} />}
        {tab === 'duas'       && <DuasTab child={child} />}
      </div>
    </div>
  )
}
