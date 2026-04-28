import React from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { Flame, BookOpen, BarChart2 } from 'lucide-react'
import { quranApi } from '@/lib/api'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import CalendarHeatmap from 'react-calendar-heatmap'
import 'react-calendar-heatmap/dist/styles.css'

export const Route = createFileRoute('/_authenticated/worship/quran/stats')({
  component: StatsTab,
})

function getReadingStreak(readingLogs = []) {
  const uniqueDays = [...new Set(readingLogs.map(l => l.log_date))].sort().reverse()
  if (!uniqueDays.length) return 0
  let streak = 0
  const today = new Date(); today.setHours(0, 0, 0, 0)
  for (let i = 0; i < uniqueDays.length; i++) {
    const expected = new Date(today); expected.setDate(today.getDate() - i)
    if (i === 0 && uniqueDays[0] !== expected.toISOString().slice(0, 10)) {
      const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1)
      if (uniqueDays[0] !== yesterday.toISOString().slice(0, 10)) break
      today.setDate(today.getDate() - 1)
    }
    const adj = new Date(today); adj.setDate(today.getDate() - i)
    if (uniqueDays[i] !== adj.toISOString().slice(0, 10)) break
    streak++
  }
  return streak
}

function StatCard({ label, value, sub, highlight }) {
  return (
    <Card className={cn('p-3 text-center flex flex-col items-center', highlight && 'border-primary/30 bg-primary/5')}>
      <p className={cn('text-2xl font-black mb-0.5', highlight ? 'text-primary' : 'text-foreground')}>{value}</p>
      <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{label}</p>
      {sub && <p className="text-[9px] font-bold text-muted-foreground/70 uppercase tracking-widest mt-0.5">{sub}</p>}
    </Card>
  )
}

function StatsTab() {
  const { data: stats }            = useQuery({ queryKey: ['quran','stats'],        queryFn: quranApi.stats,               staleTime: 60_000 })
  const { data: hifz = [] }        = useQuery({ queryKey: ['quran','hifz'],         queryFn: quranApi.hifz,                staleTime: 60_000 })
  const { data: readingLogs = [] } = useQuery({ queryKey: ['quran','reading-log'],  queryFn: () => quranApi.readingLogs(120), staleTime: 60_000 })

  const memorised  = hifz.filter(h => h.status === 'memorised').length
  const inProgress = hifz.filter(h => h.status === 'in_progress').length
  const streak     = getReadingStreak(readingLogs)
  const hasData    = (stats?.total_verses_read || 0) > 0 || readingLogs.length > 0

  const heatmapData = Object.entries(
    readingLogs.reduce((acc, log) => {
      acc[log.log_date] = (acc[log.log_date] || 0) + (log.verses_read || 0)
      return acc
    }, {})
  ).map(([date, count]) => ({ date, count }))

  if (!hasData) {
    return (
      <div className="animate-in fade-in slide-in-from-bottom-2 pt-4">
        <div className="text-center py-20 px-4 border-2 border-dashed border-border rounded-3xl bg-muted/20">
          <BarChart2 className="h-14 w-14 text-muted-foreground mx-auto mb-4 opacity-40" />
          <p className="text-lg font-bold text-foreground mb-2">No reading data yet</p>
          <p className="text-sm text-muted-foreground mb-6 max-w-xs mx-auto">
            Start reading surahs to build your stats, streak, and Khatam progress.
          </p>
          <div className="flex flex-col items-center gap-2 text-xs font-medium text-muted-foreground">
            <p className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-primary" /> Open Browse and tap any Surah</p>
            <p className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-primary" /> Play an ayah to log listening time</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 pt-4">

      {/* Khatam progress */}
      <Card className="p-5 sm:p-6 bg-gradient-to-br from-primary/10 to-teal-500/5 border-primary/20">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-sm font-black uppercase tracking-widest text-primary">Khatam Progress</h3>
          <div className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 bg-red-500/10 text-red-500">
            <Flame className="h-4 w-4" />
            <span className="text-[10px] font-black uppercase tracking-widest">{streak} day streak</span>
          </div>
        </div>
        <div className="flex items-center gap-6">
          {/* Circular progress ring */}
          <div className="shrink-0 relative w-24 h-24 flex items-center justify-center">
            <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 96 96">
              <circle cx="48" cy="48" r="42" fill="none" stroke="currentColor" strokeWidth="8" className="text-muted" />
              <circle
                cx="48" cy="48" r="42" fill="none" stroke="currentColor" strokeWidth="8"
                className="text-primary transition-all duration-1000 ease-out"
                strokeDasharray={263.9}
                strokeDashoffset={263.9 - (263.9 * (stats?.khatam_progress_pct || 0)) / 100}
                strokeLinecap="round"
              />
            </svg>
            <span className="text-xl font-black text-foreground relative z-10">
              {Math.round(stats?.khatam_progress_pct || 0)}%
            </span>
          </div>
          <div>
            <p className="text-3xl font-black text-foreground">
              {(stats?.total_verses_read || 0).toLocaleString()}
              <span className="text-sm font-bold text-muted-foreground ml-2 px-2 py-0.5 bg-muted rounded-md">/ 6,236</span>
            </p>
            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mt-2">
              Verses read all-time
            </p>
            {stats?.projected_khatam_days && (
              <Badge className="mt-3 bg-primary text-primary-foreground border-0 text-[9px] uppercase font-black">
                At your pace: ~{stats.projected_khatam_days} days
              </Badge>
            )}
          </div>
        </div>
      </Card>

      {/* Quick stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard label="Verses"   value={(stats?.verses_this_month  || 0).toLocaleString()} sub="this month" />
        <StatCard label="Minutes"  value={stats?.minutes_this_month  || 0}                    sub="reading" />
        <StatCard label="Sessions" value={stats?.sessions_this_month || 0}                    sub="this month" />
        <StatCard label="Avg/day"  value={`${stats?.avg_daily_minutes || 0}m`}                sub="reading" highlight />
      </div>

      {/* Reading heatmap */}
      <Card className="p-5 sm:p-6 overflow-hidden">
        <h3 className="text-sm font-black uppercase tracking-widest text-foreground mb-4 flex items-center gap-2">
          <BookOpen className="h-4 w-4 text-primary" /> Reading Activity (120 days)
        </h3>
        {heatmapData.length > 0 ? (
          <>
            <div className="w-full overflow-x-auto">
              <div className="min-w-[500px]">
                <CalendarHeatmap
                  startDate={new Date(Date.now() - 119 * 24 * 60 * 60 * 1000)}
                  endDate={new Date()}
                  values={heatmapData}
                  classForValue={(value) => {
                    if (!value || value.count === 0) return 'fill-muted opacity-30'
                    if (value.count < 25)  return 'fill-primary opacity-30'
                    if (value.count < 75)  return 'fill-primary opacity-55'
                    if (value.count < 150) return 'fill-primary opacity-75'
                    return 'fill-primary opacity-100'
                  }}
                />
              </div>
            </div>
            <div className="flex items-center justify-between mt-3">
              <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Less</span>
              <div className="flex gap-1 items-center">
                {['opacity-30', 'opacity-55', 'opacity-75', 'opacity-100'].map((op, i) => (
                  <span key={i} className={cn('w-3 h-3 rounded-sm bg-primary', op)} />
                ))}
              </div>
              <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">More</span>
            </div>
          </>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-6">No reading activity yet.</p>
        )}
      </Card>

      {/* Hifz summary */}
      <Card className="p-5">
        <h3 className="text-sm font-black uppercase tracking-widest text-foreground mb-4">Hifz Summary</h3>
        <div className="grid grid-cols-2 gap-3">
          {[
            ['Memorised',   memorised,   'text-green-600 bg-green-500/10 border-green-500/20'],
            ['In Progress', inProgress,  'text-orange-500 bg-orange-500/10 border-orange-500/20'],
          ].map(([label, count, cls]) => (
            <div key={label} className={cn('text-center p-4 rounded-2xl border', cls)}>
              <p className="text-3xl font-black mb-1">{count}</p>
              <p className="text-[10px] font-black uppercase tracking-widest opacity-80">{label}</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}
