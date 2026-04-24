import React, { useState } from 'react'
import { Link } from '@tanstack/react-router'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import {
  MoreHorizontal,
  NotebookPen,
  ListTodo,
  Compass,
  Brain,
  Droplets,
  Users,
  Trophy,
  HandCoins,
  Mic,
  UtensilsCrossed,
  Dumbbell,
  Baby,
  GraduationCap,
  Wallet,
  Settings,
  HeartPulse,
} from 'lucide-react'

const groups = (isFemale) => [
  {
    label: 'Spiritual',
    items: [
      { title: 'Journal', to: '/journal', icon: NotebookPen },
      { title: 'Tasks', to: '/tasks', icon: ListTodo },
      { title: 'AI Guide', to: '/ai', icon: Brain },
      { title: 'Qibla', to: '/qibla', icon: Compass },
      { title: 'Recitation', to: '/recitation', icon: Mic },
    ],
  },
  {
    label: 'Wellness',
    items: [
      { title: 'Wellness', to: '/wellness', icon: Droplets },
      { title: 'Meal', to: '/meal', icon: UtensilsCrossed },
      { title: 'Workout', to: '/workout', icon: Dumbbell },
      ...(isFemale ? [{ title: 'Cycles & Fasting', to: '/wellness/cycles', icon: HeartPulse }] : []),
    ],
  },
  {
    label: 'Family & Community',
    items: [
      { title: 'Children', to: '/children', icon: Baby },
      { title: 'Family', to: '/family', icon: Users },
      { title: 'Community', to: '/community', icon: Users },
    ],
  },
  {
    label: 'Growth',
    items: [
      { title: 'Quests', to: '/gamification', icon: Trophy },
      { title: 'Learning', to: '/learning', icon: GraduationCap },
      { title: 'Waqf', to: '/waqf', icon: HandCoins },
      { title: 'Finance', to: '/finance', icon: Wallet },
    ],
  },
  {
    label: 'Account',
    items: [{ title: 'Settings', to: '/settings', icon: Settings }],
  },
]

export function MoreSheet({ user }) {
  const [open, setOpen] = useState(false)
  const isFemale = !!user?.is_female || user?.gender === 'female'
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button className="relative flex flex-col items-center gap-0.5 px-4 py-1.5 rounded-2xl text-muted-foreground">
          <div className="p-1.5 rounded-xl">
            <MoreHorizontal className="h-5 w-5" strokeWidth={1.8} />
          </div>
          <span className="text-[10px] font-semibold">More</span>
        </button>
      </SheetTrigger>
      <SheetContent side="bottom" className="rounded-t-3xl max-h-[85vh] overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="font-amiri text-2xl">All features</SheetTitle>
        </SheetHeader>
        <div className="space-y-6 py-4">
          {groups(isFemale).map((g) => (
            <section key={g.label}>
              <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-muted-foreground mb-2">
                {g.label}
              </p>
              <div className="grid grid-cols-3 gap-2">
                {g.items.map((it) => {
                  const Icon = it.icon
                  return (
                    <Link
                      key={it.to}
                      to={it.to}
                      onClick={() => setOpen(false)}
                      className="flex flex-col items-center gap-1.5 rounded-2xl border border-border/60 bg-card p-3 hover:bg-accent transition-colors"
                    >
                      <Icon className="h-5 w-5 text-primary" />
                      <span className="text-[11px] font-semibold text-center leading-tight">
                        {it.title}
                      </span>
                    </Link>
                  )
                })}
              </div>
            </section>
          ))}
        </div>
      </SheetContent>
    </Sheet>
  )
}
