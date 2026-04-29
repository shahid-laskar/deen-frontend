import React, { useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Star, Zap, Trophy, Lock } from 'lucide-react'
import api from '@/lib/api'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { ProgressRing } from '@/components/ui/progress-ring'
import { cn } from '@/lib/utils'
import toast from 'react-hot-toast'

export const Route = createFileRoute('/_authenticated/grow/gamification')({
  component: GamificationPage,
})

const LEVEL_COLORS = [
  '#6b7280','#22c55e','#3b82f6','#a855f7','#f59e0b',
  '#ef4444','#06b6d4','#f97316','#84cc16','#ec4899','#14b8a6','#8b5cf6',
]

const RARITY_STYLES = {
  common:    { color: 'text-muted-foreground', bg: 'bg-muted', border: 'border-border', label: 'Common'    },
  rare:      { color: 'text-blue-500',         bg: 'bg-blue-500/10', border: 'border-blue-500/20', label: 'Rare'      },
  epic:      { color: 'text-purple-500',       bg: 'bg-purple-500/10', border: 'border-purple-500/20', label: 'Epic'      },
  legendary: { color: 'text-orange-500',       bg: 'bg-orange-500/10', border: 'border-orange-500/20', label: 'Legendary' },
}

function LevelCard({ profile }) {
  if (!profile) return <Skeleton className="h-48 mb-4 rounded-3xl" />
  const colorHex = LEVEL_COLORS[Math.min(profile.level - 1, LEVEL_COLORS.length - 1)] || '#22c55e'
  
  return (
    <div className="relative overflow-hidden rounded-3xl p-6 mb-4 border-2 shadow-sm" style={{ borderColor: `${colorHex}44`, background: `linear-gradient(135deg, ${colorHex}15, ${colorHex}05)` }}>
      <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full pointer-events-none" style={{ background: `radial-gradient(circle, ${colorHex}33, transparent)` }} />
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <span className="text-4xl drop-shadow-sm">{profile.icon}</span>
            <div>
              <p className="text-xs font-bold uppercase tracking-widest" style={{ color: colorHex }}>Level {profile.level}</p>
              <h2 className="text-2xl font-black text-foreground leading-tight">{profile.title}</h2>
            </div>
          </div>
          <p className="text-sm text-muted-foreground font-medium mt-1">{profile.total_xp.toLocaleString()} XP total · {profile.xp_to_next.toLocaleString()} to next</p>
        </div>
        <div className="shrink-0 bg-background/50 rounded-full p-1 backdrop-blur-sm">
          <ProgressRing value={profile.level_progress_pct} max={100} size={72} strokeWidth={6} color={colorHex}>
            <span className="text-sm font-bold text-foreground">{profile.level_progress_pct}%</span>
          </ProgressRing>
        </div>
      </div>
      <div className="h-2.5 bg-background/50 rounded-full overflow-hidden border border-border/50">
        <div className="h-full rounded-full transition-all duration-1000 ease-out" style={{ width: `${profile.level_progress_pct}%`, backgroundColor: colorHex }} />
      </div>
    </div>
  )
}

function BadgeCard({ badge, earned }) {
  const rarity = RARITY_STYLES[badge.rarity] || RARITY_STYLES.common
  return (
    <div className={cn('relative p-3 rounded-2xl text-center transition-all', earned ? rarity.bg : 'bg-card', earned ? rarity.border : 'border-border', 'border', !earned && 'opacity-50 grayscale-[50%] hover:grayscale-0')}>
      {!earned && <div className="absolute top-2 right-2"><Lock className="h-3 w-3 text-muted-foreground" /></div>}
      <div className="text-3xl mb-1.5 drop-shadow-sm">{badge.icon}</div>
      <p className={cn('text-[11px] font-bold leading-tight', earned ? 'text-foreground' : 'text-muted-foreground')}>{badge.name}</p>
      {earned && <p className={cn('text-[9px] font-black uppercase tracking-wider mt-1.5', rarity.color)}>{rarity.label}</p>}
    </div>
  )
}

function QuestCard({ quest, isActive, onStart }) {
  const pct = isActive ? Math.min(100, Math.round((isActive.progress / isActive.target) * 100)) : 0
  const completed = isActive?.status === 'completed'
  
  return (
    <div className={cn('p-4 rounded-2xl border transition-all', completed ? 'bg-primary/10 border-primary/30' : isActive ? 'bg-blue-500/5 border-blue-500/20' : 'bg-card border-border hover:border-primary/30 shadow-sm')}>
      <div className="flex justify-between items-start mb-3">
        <div className="flex gap-3">
          <span className="text-3xl shrink-0 drop-shadow-sm">{quest.icon}</span>
          <div className="min-w-0">
            <p className="font-bold text-sm text-foreground truncate">{quest.title}</p>
            <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-2 leading-relaxed">{quest.description}</p>
          </div>
        </div>
        <div className="text-right shrink-0 ml-3">
          <p className="text-xs font-black text-primary">+{quest.xp_reward} XP</p>
          <p className="text-[9px] text-muted-foreground uppercase tracking-wider font-bold mt-1">{quest.quest_type}</p>
        </div>
      </div>
      {isActive && (
        <div className="mt-4">
          <div className="flex justify-between text-[10px] font-medium text-muted-foreground mb-1.5 px-0.5">
            <span className="uppercase tracking-wider">Progress</span>
            <span>{isActive.progress} / {isActive.target}</span>
          </div>
          <div className="h-1.5 bg-background rounded-full overflow-hidden border border-border/50">
            <div className={cn('h-full rounded-full transition-all duration-500', completed ? 'bg-primary' : 'bg-blue-500')} style={{ width: `${pct}%` }} />
          </div>
        </div>
      )}
      {!isActive && (
        <Button onClick={() => onStart(quest.id)} className="w-full mt-3 h-9 text-xs">Start Quest</Button>
      )}
      {completed && <p className="text-center text-xs text-primary font-bold mt-3 bg-primary/10 py-1.5 rounded-lg">✓ Completed!</p>}
    </div>
  )
}

function XPHistory() {
  const { data: history = [] } = useQuery({
    queryKey: ['gamification', 'xp-history'],
    queryFn: () => api.get('/gamification/xp/history', { params: { limit: 20 } }).then(r => r.data).catch(() => []),
  })
  
  const SOURCE_LABELS = {
    prayer_logged: '🕌 Prayer Logged', prayer_streak: '🔥 Prayer Streak', quran_read: '📖 Quran Read',
    hifz_review: '🧠 Hifz Review', habit_complete: '✅ Habit Done', habit_streak: '⚡ Habit Streak',
    journal_entry: '📓 Journal Entry', dhikr_session: '📿 Dhikr', fasting: '🌙 Fasting',
    quest_complete: '⚔️ Quest Done', badge_earned: '🏅 Badge Earned', daily_login: '🌅 Daily Login',
  }
  
  if (history.length === 0) return <div className="text-center py-8 text-sm text-muted-foreground bg-muted/30 rounded-xl border border-dashed border-border mt-2">No XP earned yet. Start logging your deeds!</div>
  
  return (
    <div className="space-y-1">
      {history.map((e, i) => (
        <div key={e.id || i} className="flex items-center gap-3 p-3 rounded-xl hover:bg-muted/50 transition-colors">
          <span className="text-lg w-6 text-center">{SOURCE_LABELS[e.source]?.split(' ')[0] || '⭐'}</span>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-foreground truncate">{SOURCE_LABELS[e.source]?.slice(2) || e.source}</p>
            {e.note && <p className="text-[11px] text-muted-foreground mt-0.5 truncate">{e.note}</p>}
          </div>
          <p className="text-sm font-bold text-primary shrink-0">+{e.amount} XP</p>
        </div>
      ))}
    </div>
  )
}

function StreakCard() {
  const [streak, setStreak] = useState(14)
  const [insurance, setInsurance] = useState(1)
  
  return (
    <div className="relative overflow-hidden rounded-3xl p-5 mb-6 border-2 border-orange-500/30 bg-gradient-to-br from-orange-500/10 to-orange-500/5 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-orange-500/20 flex items-center justify-center text-2xl drop-shadow-sm border border-orange-500/40">🔥</div>
          <div>
            <h3 className="text-xl font-black text-foreground">{streak} Day Streak</h3>
            <p className="text-xs font-medium text-muted-foreground">Your consistency is inspiring.</p>
          </div>
        </div>
        <div className="flex flex-col items-center justify-center bg-card/80 backdrop-blur-sm px-3 py-2 rounded-2xl border border-orange-500/20 shadow-sm text-center">
          <span className="text-xl mb-0.5">☂️</span>
          <span className="text-[10px] font-black uppercase tracking-wider text-orange-500">{insurance} Shield</span>
        </div>
      </div>
      <p className="text-[10px] mt-4 font-medium text-muted-foreground bg-background/40 p-2 rounded-xl border border-border/50">
        <strong className="text-foreground">Streak Insurance active.</strong> Protects your streak if you miss 1 day this month.
      </p>
    </div>
  )
}

function MilestoneCard({ icon, title, date, flavorText }) {
  return (
    <div className="aspect-square relative p-5 rounded-3xl border-4 border-gold/30 bg-gradient-to-br from-gold/10 via-background to-gold/5 flex flex-col items-center justify-center text-center shadow-md overflow-hidden group">
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/arabesque.png')] opacity-10 mix-blend-overlay"></div>
      <div className="absolute top-3 left-3 right-3 bottom-3 border border-gold/20 rounded-2xl pointer-events-none" />
      <span className="text-4xl mb-3 drop-shadow-md group-hover:scale-110 transition-transform">{icon}</span>
      <h3 className="font-amiri text-xl font-bold text-gold-foreground mb-1">{title}</h3>
      <p className="text-[10px] font-medium text-muted-foreground z-10">{flavorText}</p>
      <div className="mt-auto z-10">
        <Badge variant="outline" className="text-[9px] uppercase tracking-widest border-gold/30 text-gold-foreground bg-gold/10">{date}</Badge>
      </div>
    </div>
  )
}

const TABS = ['Progress', 'Milestones', 'Quests', 'Badges', 'History']

function GamificationPage() {
  const qc = useQueryClient()
  const [tab, setTab] = useState('Progress')

  const { data: profile } = useQuery({ queryKey: ['gamification', 'profile'], queryFn: () => api.get('/gamification/profile').then(r => r.data).catch(() => null) })
  const { data: allBadges = [] } = useQuery({ queryKey: ['gamification', 'badges'], queryFn: () => api.get('/gamification/badges').then(r => r.data).catch(() => []) })
  const { data: myBadges = [] } = useQuery({ queryKey: ['gamification', 'my-badges'], queryFn: () => api.get('/gamification/badges/mine').then(r => r.data).catch(() => []) })
  const { data: quests = [] } = useQuery({ queryKey: ['gamification', 'quests'], queryFn: () => api.get('/gamification/quests').then(r => r.data).catch(() => []) })
  const { data: activeQuests = [] } = useQuery({ queryKey: ['gamification', 'quests-active'], queryFn: () => api.get('/gamification/quests/active').then(r => r.data).catch(() => []) })

  const { mutate: startQuest } = useMutation({
    mutationFn: (questId) => api.post(`/gamification/quests/${questId}/start`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['gamification'] }); toast.success('Quest started! 🎯') },
    onError: (e) => toast.error(e.response?.data?.detail || 'Could not start quest'),
  })

  const { mutate: seedBadges } = useMutation({ mutationFn: () => api.post('/gamification/badges/seed'), onSuccess: () => { qc.invalidateQueries({ queryKey: ['gamification'] }); toast.success('Badge catalogue loaded!') } })
  const { mutate: seedQuests } = useMutation({ mutationFn: () => api.post('/gamification/quests/seed'), onSuccess: () => { qc.invalidateQueries({ queryKey: ['gamification'] }); toast.success('Quests loaded!') } })

  const myBadgeSlugs = new Set(myBadges.map(b => b.slug))

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 md:py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Journey</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Your spiritual growth, gamified</p>
        </div>
        <div className="flex gap-2">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center"><Trophy className="h-5 w-5 text-primary" /></div>
          <div className="w-10 h-10 rounded-full bg-orange-500/10 flex items-center justify-center"><Zap className="h-5 w-5 text-orange-500" /></div>
        </div>
      </div>

      <LevelCard profile={profile} />

      {profile && (
        <div className="grid grid-cols-3 gap-3">
          {[
            ['🏅 Badges', profile.badge_count || myBadges.length, 'earned'],
            ['⚔️ Quests', activeQuests.length, 'active'],
            ['✨ Rank', `#${profile.level}`, 'ladder'],
          ].map(([icon, val, sub]) => (
            <Card key={icon} className="text-center p-3 sm:p-4 rounded-2xl shadow-sm border-border">
              <p className="text-lg sm:text-xl font-bold text-foreground">{typeof val !== 'string' ? val.toLocaleString() : val}</p>
              <p className="text-[10px] sm:text-xs font-medium text-muted-foreground uppercase tracking-wider mt-1">{sub}</p>
              <p className="text-[10px] mt-2 opacity-60 font-medium">{icon}</p>
            </Card>
          ))}
        </div>
      )}

      <div className="flex overflow-x-auto p-1 rounded-xl bg-muted gap-1">
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={cn('flex-1 px-4 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap', tab === t ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground')}>
            {t}
          </button>
        ))}
      </div>

      <div className="pt-2">
        {/* PROGRESS TAB */}
        {tab === 'Progress' && (
          <div className="space-y-6">
            <StreakCard />
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-3">Active Quests</h3>
              {activeQuests.length === 0 ? (
                <div className="text-center p-6 border-2 border-dashed border-border rounded-2xl bg-card">
                  <span className="text-3xl">⚔️</span>
                  <p className="text-sm font-medium mt-2 text-foreground">No active quests.</p>
                  <p className="text-xs text-muted-foreground mt-1">Go to the Quests tab to start one!</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {activeQuests.map(aq => (
                    <div key={aq.id} className="p-3 rounded-xl bg-blue-500/5 border border-blue-500/20">
                      <div className="flex justify-between items-center mb-2">
                        <p className="font-semibold text-sm text-foreground flex items-center gap-2"><span className="text-lg">{aq.icon}</span> {aq.title}</p>
                        <p className="text-xs font-bold text-blue-500 px-2 py-0.5 bg-blue-500/10 rounded-full">+{aq.xp_reward} XP</p>
                      </div>
                      <div className="h-1.5 bg-background rounded-full overflow-hidden border border-border/50">
                        <div className="h-full bg-blue-500 rounded-full transition-all" style={{ width: `${aq.pct}%` }} />
                      </div>
                      <p className="text-[10px] font-medium text-muted-foreground mt-2 text-right">{aq.progress} / {aq.target} · {aq.pct}%</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-3">Recent Badges</h3>
              {myBadges.length === 0 ? (
                <p className="text-center text-sm text-muted-foreground italic bg-muted/50 p-4 rounded-xl">No badges yet — keep logging your deeds!</p>
              ) : (
                <div className="grid grid-cols-4 gap-2.5">
                  {myBadges.slice(0, 8).map(b => <BadgeCard key={b.slug} badge={b} earned={true} />)}
                </div>
              )}
            </div>
          </div>
        )}

        {/* MILESTONES TAB */}
        {tab === 'Milestones' && (
          <div className="space-y-4">
            <div className="bg-gold/10 border border-gold/20 rounded-xl p-4 text-center mb-4">
              <h2 className="text-lg font-bold text-gold-foreground">Your Legacy</h2>
              <p className="text-xs text-muted-foreground">Share these monumental achievements with your friends.</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <MilestoneCard icon="🔥" title="30 Days" flavorText="A month of unwavering dedication." date="Apr 15, 2026" />
              <MilestoneCard icon="📖" title="1 Juz Read" flavorText="The first step in a lifelong journey." date="Mar 20, 2026" />
              <MilestoneCard icon="🕋" title="100 Prayers" flavorText="Established the pillar of Islam." date="Feb 05, 2026" />
            </div>
          </div>
        )}

        {/* QUESTS TAB */}
        {tab === 'Quests' && (
          <div className="space-y-3">
            {quests.length === 0 ? (
              <div className="text-center py-12 border-2 border-dashed border-border rounded-2xl bg-card">
                <span className="text-4xl block mb-2">⚔️</span>
                <p className="text-sm text-muted-foreground mb-4">No quests available yet.</p>
                <Button onClick={() => seedQuests()}>Load Quests</Button>
              </div>
            ) : quests.map(quest => {
              const activeInstance = activeQuests.find(aq => aq.quest_id === quest.id)
              return <QuestCard key={quest.id} quest={quest} isActive={activeInstance} onStart={startQuest} />
            })}
          </div>
        )}

        {/* BADGES TAB */}
        {tab === 'Badges' && (
          <div className="space-y-6">
            {allBadges.length === 0 ? (
              <div className="text-center py-12 border-2 border-dashed border-border rounded-2xl bg-card">
                <span className="text-4xl mb-2 block">🏅</span>
                <p className="text-sm text-muted-foreground mb-4">Badge catalogue not loaded yet.</p>
                <Button onClick={() => seedBadges()}>Load Badges</Button>
              </div>
            ) : (
              <>
                <div className="bg-primary/10 border border-primary/20 rounded-xl p-3 text-center">
                  <p className="text-sm font-bold text-primary">{myBadges.length} of {allBadges.length} badges earned</p>
                </div>
                {['prayer', 'quran', 'habits', 'journal', 'fasting', 'special'].map(cat => {
                  const catBadges = allBadges.filter(b => b.category === cat)
                  if (catBadges.length === 0) return null
                  const earned = catBadges.filter(b => myBadgeSlugs.has(b.slug)).length
                  return (
                    <div key={cat} className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-bold capitalize text-foreground">{cat}</h3>
                        <span className="text-xs font-medium text-muted-foreground">{earned}/{catBadges.length}</span>
                      </div>
                      <div className="grid grid-cols-4 gap-2.5">
                        {catBadges.map(b => <BadgeCard key={b.slug} badge={b} earned={myBadgeSlugs.has(b.slug)} />)}
                      </div>
                    </div>
                  )
                })}
              </>
            )}
          </div>
        )}

        {/* HISTORY TAB */}
        {tab === 'History' && (
          <Card className="p-4 sm:p-5 rounded-3xl">
            <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-4">XP History</h3>
            <XPHistory />
          </Card>
        )}
      </div>
    </div>
  )
}
