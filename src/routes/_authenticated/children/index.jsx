import React, { useState } from 'react'
import { createFileRoute, Link } from '@tanstack/react-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { differenceInMonths, format } from 'date-fns'
import {
  Plus, Star, Flame, Sparkles, Baby, ChevronRight, Trophy,
  BookOpen, Heart, MoonStar, Users, Shield, Feather, Zap
} from 'lucide-react'
import api from '@/lib/api'
import { cn } from '@/lib/utils'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import toast from 'react-hot-toast'

export const Route = createFileRoute('/_authenticated/children/')({
  component: ChildrenIndexPage,
})

// ── Constants ─────────────────────────────────────────────────────────────────
const EMOJIS = ['🌟', '🌙', '📖', '🕊️', '🌸', '🦋', '🌺', '⭐', '💫', '🎯', '🌿', '🏔️']

const LEVEL_NAMES = {
  1: 'Little Star', 2: 'Tiny Explorer', 3: 'Dua Learner', 4: 'Quran Buddy',
  5: 'Salah Helper', 6: 'Seerah Seeker', 7: 'Akhlaq Champion',
  8: 'Hafiz Helper', 9: 'Shining Star', 10: 'Young Scholar',
}

const LEVEL_THRESHOLDS = [0, 50, 150, 300, 500, 800, 1200, 1800, 2500, 3500, Infinity]

const CAT_COLORS = {
  aqeedah: 'text-emerald-500 bg-emerald-500/10',
  salah:   'text-blue-500   bg-blue-500/10',
  quran:   'text-amber-500  bg-amber-500/10',
  arabic:  'text-purple-500 bg-purple-500/10',
  akhlaq:  'text-pink-500   bg-pink-500/10',
  seerah:  'text-teal-500   bg-teal-500/10',
  fiqh:    'text-orange-500 bg-orange-500/10',
  dua:     'text-rose-500   bg-rose-500/10',
}

const AGE_GROUP_LABEL = {
  toddler: 'Toddler (2–4)',
  young:   'Young (4–6)',
  middle:  'Middle (7–9)',
  preteen: 'Pre-teen (10–12)',
  teen:    'Teen (13+)',
}

// ── XP Bar ────────────────────────────────────────────────────────────────────
function XpBar({ xp, level }) {
  const thisLevelXp = LEVEL_THRESHOLDS[level - 1] || 0
  const nextLevelXp = LEVEL_THRESHOLDS[level] || LEVEL_THRESHOLDS[level - 1]
  const pct = nextLevelXp === Infinity
    ? 100
    : Math.round(((xp - thisLevelXp) / (nextLevelXp - thisLevelXp)) * 100)

  return (
    <div className="space-y-1">
      <div className="flex justify-between text-[10px] font-bold text-muted-foreground">
        <span>Lv {level} — {LEVEL_NAMES[level] || 'Scholar'}</span>
        <span className="text-primary">{xp} XP</span>
      </div>
      <div className="h-2 rounded-full bg-muted overflow-hidden">
        <div
          className="h-full rounded-full bg-gradient-to-r from-primary to-gold transition-all duration-700"
          style={{ width: `${Math.min(100, pct)}%` }}
        />
      </div>
    </div>
  )
}

// ── Child Card ────────────────────────────────────────────────────────────────
function ChildCard({ child }) {
  const ageMonths = child.date_of_birth
    ? differenceInMonths(new Date(), new Date(child.date_of_birth))
    : null

  return (
    <Link
      to="/children/$childId"
      params={{ childId: child.id }}
      className="group block relative overflow-hidden rounded-3xl glass-card shadow-soft hover:shadow-elevated card-hover transition-all"
    >
      {/* Gradient accent */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/8 via-transparent to-gold/8 pointer-events-none" />

      <div className="relative p-5">
        {/* Header row */}
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex items-center gap-3">
            {/* Avatar */}
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/20 to-gold/20 flex items-center justify-center text-3xl shadow-soft border border-primary/10 shrink-0">
              {child.avatar_emoji}
            </div>
            <div>
              <h3 className="font-black text-lg text-foreground">{child.name}</h3>
              {ageMonths !== null && (
                <p className="text-xs text-muted-foreground font-bold">
                  {Math.floor(ageMonths / 12)}y {ageMonths % 12}m
                  {child.age_group && (
                    <span className="ml-2 text-primary/70">· {AGE_GROUP_LABEL[child.age_group] || child.age_group}</span>
                  )}
                </p>
              )}
            </div>
          </div>

          {/* Level badge */}
          <div className="flex flex-col items-end gap-1 shrink-0">
            <div className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-gold/15 border border-gold/20">
              <Star className="h-3.5 w-3.5 text-gold fill-gold" strokeWidth={1.5} />
              <span className="text-[11px] font-black text-gold">Lv {child.level}</span>
            </div>
            {child.current_streak > 0 && (
              <div className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-orange-500/10">
                <Flame className="h-3 w-3 text-orange-500" />
                <span className="text-[10px] font-black text-orange-500">{child.current_streak}d</span>
              </div>
            )}
          </div>
        </div>

        {/* XP bar */}
        <XpBar xp={child.xp_total || 0} level={child.level || 1} />

        {/* Quick stats row */}
        <div className="flex items-center gap-3 mt-3 pt-3 border-t border-border/40">
          <div className="flex items-center gap-1 text-[11px] font-bold text-muted-foreground">
            <Trophy className="h-3.5 w-3.5 text-primary" />
            <span className="text-foreground">{child.xp_total || 0}</span> XP
          </div>
          <div className="flex items-center gap-1 text-[11px] font-bold text-muted-foreground">
            <Flame className="h-3.5 w-3.5 text-orange-500" />
            <span className="text-foreground">{child.current_streak || 0}</span> streak
          </div>
          <div className="ml-auto flex items-center gap-1 text-[11px] font-bold text-muted-foreground group-hover:text-primary transition-colors">
            View profile <ChevronRight className="h-3.5 w-3.5" />
          </div>
        </div>
      </div>
    </Link>
  )
}

// ── Add Child Modal ────────────────────────────────────────────────────────────
function AddChildModal({ open, onClose }) {
  const qc = useQueryClient()
  const [form, setForm] = useState({ name: '', date_of_birth: '', gender: 'male', avatar_emoji: '🌟' })

  const { mutate: createChild, isPending } = useMutation({
    mutationFn: () => api.post('/children', form),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['children'] })
      onClose()
      toast.success(`${form.name}'s profile created! 🌟`)
      setForm({ name: '', date_of_birth: '', gender: 'male', avatar_emoji: '🌟' })
    },
    onError: () => toast.error('Could not create profile'),
  })

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md rounded-3xl p-6 bg-background/95 backdrop-blur-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg font-black">
            <Baby className="h-5 w-5 text-primary" /> Add a Child Profile
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div>
            <label className="text-xs font-bold text-foreground mb-1.5 block">Child's Name *</label>
            <Input
              value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. Ibrahim, Fatimah"
              autoFocus
              className="rounded-xl"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-foreground mb-1.5 block">Date of Birth (optional)</label>
            <Input
              type="date"
              value={form.date_of_birth}
              onChange={e => setForm({ ...form, date_of_birth: e.target.value })}
              className="rounded-xl"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-foreground mb-1.5 block">Gender</label>
            <div className="flex gap-2">
              {['male', 'female'].map(g => (
                <button
                  key={g}
                  onClick={() => setForm({ ...form, gender: g })}
                  className={cn(
                    'flex-1 py-2 rounded-xl text-sm font-bold capitalize transition-all border-2',
                    form.gender === g
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border bg-muted/40 text-muted-foreground hover:bg-muted'
                  )}
                >
                  {g === 'male' ? '👦 Boy' : '👧 Girl'}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-foreground mb-2 block">Choose Avatar</label>
            <div className="flex gap-2 flex-wrap">
              {EMOJIS.map(e => (
                <button
                  key={e}
                  onClick={() => setForm({ ...form, avatar_emoji: e })}
                  className={cn(
                    'w-11 h-11 rounded-xl text-2xl flex items-center justify-center transition-all border-2',
                    form.avatar_emoji === e
                      ? 'bg-primary/15 border-primary scale-110 shadow-sm'
                      : 'bg-muted border-transparent hover:border-border hover:bg-muted/80'
                  )}
                >
                  {e}
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
            onClick={() => createChild()}
            disabled={isPending || !form.name.trim()}
            className="rounded-xl bg-primary hover:opacity-90"
          >
            {isPending ? 'Creating…' : `Add ${form.name || 'Child'} 🌟`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function ChildrenIndexPage() {
  const [addOpen, setAddOpen] = useState(false)

  const { data: children = [], isLoading } = useQuery({
    queryKey: ['children'],
    queryFn: () => api.get('/children').then(r => r.data).catch(() => []),
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-end justify-between flex-wrap gap-4 animate-slide-up">
        <div>
          <p className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground font-bold">Tarbiyah</p>
          <h1 className="font-amiri text-4xl md:text-5xl font-bold mt-2 text-gradient-primary">Child Upbringing</h1>
          <p className="text-sm text-muted-foreground mt-2">Nurture their deen, one day at a time</p>
        </div>
        <button
          onClick={() => setAddOpen(true)}
          className="flex items-center gap-2 rounded-2xl bg-primary text-primary-foreground px-5 py-3 text-sm font-bold shadow-glow-primary hover:opacity-90 transition-all"
        >
          <Plus className="h-4 w-4" /> Add Child
        </button>
      </div>

      {/* Hadith quote */}
      <div className="relative overflow-hidden rounded-2xl glass-card shadow-soft p-5 animate-slide-up stagger-1">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-gold/10" />
        <div className="relative">
          <p className="text-sm font-bold text-foreground leading-relaxed italic">
            "Every one of you is a shepherd and is responsible for his flock."
          </p>
          <p className="text-[10px] font-black text-primary uppercase tracking-widest mt-2">
            — Prophet Muhammad ﷺ · Bukhari
          </p>
        </div>
      </div>

      {/* Children list */}
      <div className="animate-slide-up stagger-2">
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2].map(i => (
              <div key={i} className="h-40 rounded-3xl bg-muted/40 animate-pulse" />
            ))}
          </div>
        ) : children.length === 0 ? (
          <div className="rounded-3xl glass-card shadow-soft p-12 flex flex-col items-center text-center">
            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-5">
              <Baby className="h-10 w-10 text-primary/60" />
            </div>
            <h3 className="text-lg font-black text-foreground mb-2">No children added yet</h3>
            <p className="text-sm text-muted-foreground mb-6 max-w-sm">
              Add your children to start tracking their Islamic milestones, Quran progress, duas, and activities.
            </p>
            <button
              onClick={() => setAddOpen(true)}
              className="flex items-center gap-2 rounded-2xl bg-primary text-primary-foreground px-6 py-3 text-sm font-bold shadow-glow-primary hover:opacity-90 transition-all"
            >
              <Plus className="h-4 w-4" /> Add your first child
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {children.map(child => (
              <ChildCard key={child.id} child={child} />
            ))}
          </div>
        )}
      </div>

      <AddChildModal open={addOpen} onClose={() => setAddOpen(false)} />
    </div>
  )
}
