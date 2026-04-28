import React, { useMemo } from 'react'
import { Link } from '@tanstack/react-router'
import { cn } from '@/lib/utils'
import { Icon } from '@/components/ui/icon'
import { getIslamicContext } from '@/lib/hijri'

/**
 * Smart Suggestion — AI-picked next action (rule-based first).
 * Per enhanced-ui spec §1.2:
 *   Priority order:
 *   1. Missed prayer in last hour → "Pray X qaza"
 *   2. No Quran read in 24h + evening → "Read Surah Al-Mulk"
 *   3. Habit due today + not done by 6pm → nudge
 *   4. Friday before Jumuah → "Read Surah Al-Kahf"
 *   5. Last 10 nights of Ramadan + after Isha → "Pray Tahajjud"
 *   6. Fallback: random from "always good" pool
 */

const ALWAYS_GOOD = [
  {
    icon: 'book',
    title: 'Read Surah Al-Mulk',
    desc: 'Protect yourself before sleep — 5 min read',
    to: '/worship/quran',
    color: 'bg-primary/10 text-primary',
  },
  {
    icon: 'sparkles',
    title: 'Make 100 Istighfar',
    desc: 'SubhanAllah wa bihamdihi — cleanse the heart',
    to: '/grow/habits',
    search: { tab: 'dhikr' },
    color: 'bg-gold/15 text-gold',
  },
  {
    icon: 'heart',
    title: 'Send Salawat',
    desc: 'Allahumma salli ala Muhammad — 10 times',
    to: '/grow/habits',
    search: { tab: 'dhikr' },
    color: 'bg-sage/15 text-sage',
  },
  {
    icon: 'notebook',
    title: 'Reflect on Your Day',
    desc: 'Write a brief journal entry — what are you grateful for?',
    to: '/today/journal',
    color: 'bg-warm/10 text-warm',
  },
  {
    icon: 'book',
    title: 'Read Ayatul Kursi',
    desc: 'The greatest verse in the Quran — recite with reflection',
    to: '/worship/quran',
    color: 'bg-primary/10 text-primary',
  },
]

function getSuggestion(prayerSummary, habits, quranLastRead) {
  const now = new Date()
  const hour = now.getHours()
  const dayOfWeek = now.getDay() // 0=Sun, 5=Fri
  const ctx = getIslamicContext()

  // 1. Friday before Jumuah → Read Surah Al-Kahf
  if (dayOfWeek === 5 && hour < 13) {
    return {
      icon: 'book',
      title: 'Read Surah Al-Kahf',
      desc: 'It\'s Friday! Sunnah to read Surah Al-Kahf today',
      to: '/worship/quran',
      color: 'bg-primary/10 text-primary',
      priority: 'sunnah',
    }
  }

  // 2. Ramadan — last 10 nights after Isha
  if (ctx.season === 'ramadan' && ctx.hijri.day > 20 && hour >= 21) {
    return {
      icon: 'sparkles',
      title: 'Pray Tahajjud Tonight',
      desc: 'The last 10 nights of Ramadan — seek Laylatul Qadr',
      to: '/worship/prayer',
      color: 'bg-gold/15 text-gold',
      priority: 'seasonal',
    }
  }

  // 3. Evening and no Quran read → Surah Al-Mulk
  if (hour >= 20 && !quranLastRead) {
    return {
      icon: 'book',
      title: 'Read Surah Al-Mulk',
      desc: 'Protect yourself before sleep — a nightly sunnah',
      to: '/worship/quran',
      color: 'bg-primary/10 text-primary',
      priority: 'reminder',
    }
  }

  // 4. Habits due but not completed (after 6 PM)
  if (hour >= 18 && habits?.length) {
    const incomplete = habits.filter(h => !h.completed_today)
    if (incomplete.length > 0) {
      return {
        icon: 'heart',
        title: `Complete: ${incomplete[0].name}`,
        desc: `${incomplete.length} habit${incomplete.length > 1 ? 's' : ''} remaining for today`,
        to: '/grow/habits',
        color: 'bg-warm/10 text-warm',
        priority: 'habit',
      }
    }
  }

  // 5. Morning — morning adhkar
  if (hour >= 5 && hour < 9) {
    return {
      icon: 'sparkles',
      title: 'Morning Adhkar',
      desc: 'Start your day with remembrance of Allah',
      to: '/grow/habits',
      search: { tab: 'dhikr' },
      color: 'bg-sage/15 text-sage',
      priority: 'adhkar',
    }
  }

  // 6. Fallback — random from always-good pool
  const seed = Math.floor(Date.now() / (1000 * 60 * 30)) // Changes every 30 min
  const fallback = ALWAYS_GOOD[seed % ALWAYS_GOOD.length]
  return { ...fallback, priority: 'general' }
}

export function SmartSuggestion({ prayerSummary, habits, quranLastRead, className }) {
  const suggestion = useMemo(
    () => getSuggestion(prayerSummary, habits, quranLastRead),
    [prayerSummary, habits, quranLastRead]
  )

  if (!suggestion) return null

  return (
    <Link
      to={suggestion.to}
      search={suggestion.search}
      className={cn(
        'block rounded-2xl border border-border bg-card p-4 group transition-all duration-200',
        'hover:shadow-md hover:border-primary/20 hover:-translate-y-0.5',
        className
      )}
    >
      <div className="flex items-center gap-3">
        {/* Icon */}
        <div className={cn(
          'flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition-transform group-hover:scale-110',
          suggestion.color
        )}>
          <Icon name={suggestion.icon} size={20} />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-primary/70">
              ✨ Suggested for You
            </span>
          </div>
          <h4 className="text-sm font-bold text-foreground truncate">{suggestion.title}</h4>
          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{suggestion.desc}</p>
        </div>

        {/* Arrow */}
        <Icon
          name="chevron-right"
          size={16}
          className="shrink-0 text-muted-foreground/40 group-hover:text-primary transition-colors"
        />
      </div>
    </Link>
  )
}
