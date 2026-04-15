import React, { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { Star, Zap, Trophy, Target, ChevronRight, Lock } from 'lucide-react'
import api from '../lib/api'
import { Card, Button, Skeleton, ProgressRing } from '../components/ui/index'
import toast from 'react-hot-toast'

// ─── XP Level colors ──────────────────────────────────────────────────────────
const LEVEL_COLORS = [
  '#6b7280','#22c55e','#3b82f6','#a855f7','#f59e0b',
  '#ef4444','#06b6d4','#f97316','#84cc16','#ec4899','#14b8a6','#8b5cf6',
]
const RARITY_STYLES = {
  common:    { color: '#6b7280', bg: 'rgba(107,114,128,0.1)',  label: 'Common'    },
  rare:      { color: '#3b82f6', bg: 'rgba(59,130,246,0.1)',   label: 'Rare'      },
  epic:      { color: '#a855f7', bg: 'rgba(168,85,247,0.1)',   label: 'Epic'      },
  legendary: { color: '#f59e0b', bg: 'rgba(245,158,11,0.1)',   label: 'Legendary' },
}

// ─── Level card ───────────────────────────────────────────────────────────────
function LevelCard({ profile }) {
  if (!profile) return <Skeleton className="h-48 mb-4" />
  const color = LEVEL_COLORS[Math.min(profile.level - 1, LEVEL_COLORS.length - 1)] || '#22c55e'
  return (
    <div style={{ borderRadius: 20, padding: '20px', marginBottom: 16, background: `linear-gradient(135deg, ${color}22, ${color}08)`, border: `1.5px solid ${color}44`, position: 'relative', overflow: 'hidden' }}>
      {/* bg glow */}
      <div style={{ position: 'absolute', top: -40, right: -40, width: 120, height: 120, borderRadius: '50%', background: `radial-gradient(circle, ${color}22, transparent)`, pointerEvents: 'none' }} />
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <span style={{ fontSize: 30 }}>{profile.icon}</span>
            <div>
              <p style={{ fontSize: 12, color, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Level {profile.level}</p>
              <h2 style={{ fontSize: 22, fontWeight: 800, color: 'var(--t-text)', lineHeight: 1.1 }}>{profile.title}</h2>
            </div>
          </div>
          <p style={{ fontSize: 13, color: 'var(--t-text-muted)' }}>{profile.total_xp.toLocaleString()} XP total · {profile.xp_to_next.toLocaleString()} to next level</p>
        </div>
        <div style={{ textAlign: 'center' }}>
          <ProgressRing value={profile.level_progress_pct} max={100} size={64} strokeWidth={5} color={color}>
            <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--t-text)' }}>{profile.level_progress_pct}%</span>
          </ProgressRing>
        </div>
      </div>
      {/* XP progress bar */}
      <div style={{ height: 8, background: 'var(--t-border)', borderRadius: 4, overflow: 'hidden' }}>
        <motion.div initial={{ width: 0 }} animate={{ width: `${profile.level_progress_pct}%` }} transition={{ duration: 1, ease: 'easeOut' }} style={{ height: '100%', background: color, borderRadius: 4 }} />
      </div>
    </div>
  )
}

// ─── Badge card ───────────────────────────────────────────────────────────────
function BadgeCard({ badge, earned }) {
  const rarity = RARITY_STYLES[badge.rarity] || RARITY_STYLES.common
  return (
    <div style={{ borderRadius: 12, padding: '12px', textAlign: 'center', background: earned ? rarity.bg : 'var(--t-bg-card)', border: `1px solid ${earned ? rarity.color + '44' : 'var(--t-border)'}`, opacity: earned ? 1 : 0.45, transition: 'all 0.2s', position: 'relative' }}>
      {!earned && <div style={{ position: 'absolute', top: 6, right: 6 }}><Lock size={10} style={{ color: 'var(--t-text-muted)' }} /></div>}
      <div style={{ fontSize: 28, marginBottom: 4 }}>{badge.icon}</div>
      <p style={{ fontSize: 11, fontWeight: 600, color: earned ? 'var(--t-text)' : 'var(--t-text-muted)', lineHeight: 1.3 }}>{badge.name}</p>
      {earned && <p style={{ fontSize: 9, color: rarity.color, fontWeight: 700, textTransform: 'uppercase', marginTop: 3 }}>{rarity.label}</p>}
    </div>
  )
}

// ─── Quest card ───────────────────────────────────────────────────────────────
function QuestCard({ quest, isActive, onStart, onSeed }) {
  const pct = isActive ? Math.min(100, Math.round((isActive.progress / isActive.target) * 100)) : 0
  const completed = isActive?.status === 'completed'
  return (
    <div style={{ borderRadius: 14, padding: '14px 16px', border: `1px solid ${completed ? 'rgba(20,168,96,0.4)' : isActive ? 'rgba(59,130,246,0.3)' : 'var(--t-border)'}`, background: completed ? 'rgba(20,168,96,0.06)' : isActive ? 'rgba(59,130,246,0.04)' : 'var(--t-bg-card)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: 10 }}>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <span style={{ fontSize: 22 }}>{quest.icon}</span>
          <div>
            <p style={{ fontWeight: 600, fontSize: 14, color: 'var(--t-text)' }}>{quest.title}</p>
            <p style={{ fontSize: 11, color: 'var(--t-text-muted)', marginTop: 2 }}>{quest.description}</p>
          </div>
        </div>
        <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: 8 }}>
          <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--t-accent)' }}>+{quest.xp_reward} XP</p>
          <p style={{ fontSize: 10, color: 'var(--t-text-muted)', marginTop: 2 }}>{quest.quest_type}</p>
        </div>
      </div>
      {isActive && (
        <div style={{ marginBottom: 10 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--t-text-muted)', marginBottom: 4 }}>
            <span>Progress</span><span>{isActive.progress}/{isActive.target}</span>
          </div>
          <div style={{ height: 6, background: 'var(--t-border)', borderRadius: 3, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${pct}%`, background: completed ? 'var(--t-primary)' : '#3b82f6', borderRadius: 3, transition: 'width 0.5s' }} />
          </div>
        </div>
      )}
      {!isActive && (
        <button onClick={() => onStart(quest.id)} style={{ width: '100%', padding: '8px', borderRadius: 10, background: 'var(--t-primary)', color: 'white', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
          Start Quest
        </button>
      )}
      {completed && <p style={{ textAlign: 'center', fontSize: 12, color: 'var(--t-primary)', fontWeight: 600 }}>✓ Completed!</p>}
    </div>
  )
}

// ─── XP History ───────────────────────────────────────────────────────────────
function XPHistory() {
  const { data: history = [] } = useQuery({
    queryKey: ['gamification', 'xp-history'],
    queryFn: () => api.get('/gamification/xp/history', { params: { limit: 20 } }).then(r => r.data).catch(() => []),
  })
  const SOURCE_LABELS = {
    prayer_logged: '🕌 Prayer Logged',
    prayer_streak: '🔥 Prayer Streak',
    quran_read: '📖 Quran Read',
    hifz_review: '🧠 Hifz Review',
    habit_complete: '✅ Habit Done',
    habit_streak: '⚡ Habit Streak',
    journal_entry: '📓 Journal Entry',
    dhikr_session: '📿 Dhikr',
    fasting: '🌙 Fasting',
    quest_complete: '⚔️ Quest Done',
    badge_earned: '🏅 Badge Earned',
    daily_login: '🌅 Daily Login',
  }
  if (history.length === 0) return <p style={{ textAlign: 'center', color: 'var(--t-text-muted)', fontSize: 13, padding: 16 }}>No XP earned yet. Start logging your deeds!</p>
  return (
    <div style={{ maxHeight: 320, overflowY: 'auto' }}>
      {history.map((e, i) => (
        <div key={e.id || i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: '0.5px solid var(--t-border)' }}>
          <span style={{ fontSize: 14, width: 22, textAlign: 'center' }}>{SOURCE_LABELS[e.source]?.split(' ')[0] || '⭐'}</span>
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: 13, color: 'var(--t-text)', fontWeight: 500 }}>{SOURCE_LABELS[e.source]?.slice(2) || e.source}</p>
            {e.note && <p style={{ fontSize: 11, color: 'var(--t-text-muted)', marginTop: 1 }}>{e.note}</p>}
          </div>
          <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--t-accent)', whiteSpace: 'nowrap' }}>+{e.amount} XP</p>
        </div>
      ))}
    </div>
  )
}

const TABS = ['Progress', 'Quests', 'Badges', 'History']

export default function Gamification() {
  const qc = useQueryClient()
  const [tab, setTab] = useState('Progress')

  const { data: profile, isLoading } = useQuery({
    queryKey: ['gamification', 'profile'],
    queryFn: () => api.get('/gamification/profile').then(r => r.data).catch(() => null),
  })
  const { data: allBadges = [] } = useQuery({
    queryKey: ['gamification', 'badges'],
    queryFn: () => api.get('/gamification/badges').then(r => r.data).catch(() => []),
  })
  const { data: myBadges = [] } = useQuery({
    queryKey: ['gamification', 'my-badges'],
    queryFn: () => api.get('/gamification/badges/mine').then(r => r.data).catch(() => []),
  })
  const { data: quests = [] } = useQuery({
    queryKey: ['gamification', 'quests'],
    queryFn: () => api.get('/gamification/quests').then(r => r.data).catch(() => []),
  })
  const { data: activeQuests = [] } = useQuery({
    queryKey: ['gamification', 'quests-active'],
    queryFn: () => api.get('/gamification/quests/active').then(r => r.data).catch(() => []),
  })

  const { mutate: startQuest } = useMutation({
    mutationFn: (questId) => api.post(`/gamification/quests/${questId}/start`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['gamification'] }); toast.success('Quest started! 🎯') },
    onError: (e) => toast.error(e.response?.data?.detail || 'Could not start quest'),
  })

  const { mutate: seedBadges } = useMutation({
    mutationFn: () => api.post('/gamification/badges/seed'),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['gamification'] }); toast.success('Badge catalogue loaded!') },
  })
  const { mutate: seedQuests } = useMutation({
    mutationFn: () => api.post('/gamification/quests/seed'),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['gamification'] }); toast.success('Quests loaded!') },
  })

  const myBadgeSlugs = new Set(myBadges.map(b => b.slug))

  return (
    <div className="max-w-2xl mx-auto px-4 py-5">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div>
          <h1 className="font-display text-2xl font-bold" style={{ color: 'var(--t-text)' }}>Journey</h1>
          <p style={{ fontSize: 13, color: 'var(--t-text-muted)', marginTop: 2 }}>Your Islamic growth gamified</p>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <Trophy size={22} style={{ color: 'var(--t-accent)' }} />
          <Zap size={22} style={{ color: 'var(--t-primary)' }} />
        </div>
      </div>

      {/* Level card always visible */}
      <LevelCard profile={profile} />

      {/* Stats row */}
      {profile && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, marginBottom: 16 }}>
          {[
            ['🏅 Badges', profile.badge_count || myBadges.length, 'earned'],
            ['⚔️ Quests', activeQuests.length, 'active'],
            ['✨ Rank', `#${profile.level}`, 'ladder'],
          ].map(([icon, val, sub]) => (
            <div key={icon} style={{ textAlign: 'center', borderRadius: 12, padding: '10px 4px', background: 'var(--t-bg-card)', border: '0.5px solid var(--t-border)' }}>
              <p style={{ fontSize: 16 }}>{typeof val !== 'string' ? val.toLocaleString() : val}</p>
              <p style={{ fontSize: 10, color: 'var(--t-text-muted)', marginTop: 2 }}>{sub}</p>
              <p style={{ fontSize: 9, color: 'var(--t-text-muted)' }}>{icon}</p>
            </div>
          ))}
        </div>
      )}

      {/* Tab bar */}
      <div style={{ display: 'flex', gap: 2, padding: 4, borderRadius: 12, background: 'var(--t-bg-card)', border: '0.5px solid var(--t-border)', marginBottom: 16 }}>
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)} style={{ flex: 1, padding: '8px 4px', borderRadius: 9, fontSize: 12, fontWeight: 500, background: tab === t ? 'var(--t-primary)' : 'transparent', color: tab === t ? 'white' : 'var(--t-text-muted)', border: 'none', cursor: 'pointer', transition: 'all 0.15s' }}>{t}</button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={tab} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.15 }}>

          {/* PROGRESS TAB */}
          {tab === 'Progress' && (
            <div className="space-y-4">
              <Card>
                <h3 style={{ fontWeight: 700, fontSize: 15, color: 'var(--t-text)', marginBottom: 12 }}>Active Quests</h3>
                {activeQuests.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '16px 0', color: 'var(--t-text-muted)' }}>
                    <p style={{ fontSize: 28 }}>⚔️</p>
                    <p style={{ fontSize: 13, marginTop: 6 }}>No active quests. Go to Quests tab to start one!</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {activeQuests.map(aq => (
                      <div key={aq.id} style={{ padding: '10px 12px', borderRadius: 10, background: 'rgba(59,130,246,0.05)', border: '1px solid rgba(59,130,246,0.2)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                          <p style={{ fontWeight: 600, fontSize: 13, color: 'var(--t-text)' }}>{aq.icon} {aq.title}</p>
                          <p style={{ fontSize: 12, color: 'var(--t-accent)', fontWeight: 700 }}>+{aq.xp_reward} XP</p>
                        </div>
                        <div style={{ height: 6, background: 'var(--t-border)', borderRadius: 3, overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${aq.pct}%`, background: '#3b82f6', borderRadius: 3 }} />
                        </div>
                        <p style={{ fontSize: 10, color: 'var(--t-text-muted)', marginTop: 4 }}>{aq.progress}/{aq.target} · {aq.pct}%</p>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
              <Card>
                <h3 style={{ fontWeight: 700, fontSize: 15, color: 'var(--t-text)', marginBottom: 12 }}>Recent Badges</h3>
                {myBadges.length === 0 ? (
                  <p style={{ textAlign: 'center', color: 'var(--t-text-muted)', fontSize: 13 }}>No badges yet — keep logging your deeds!</p>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10 }}>
                    {myBadges.slice(0, 8).map(b => <BadgeCard key={b.slug} badge={b} earned={true} />)}
                  </div>
                )}
              </Card>
            </div>
          )}

          {/* QUESTS TAB */}
          {tab === 'Quests' && (
            <div className="space-y-3">
              {quests.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '32px 0' }}>
                  <p style={{ fontSize: 40 }}>⚔️</p>
                  <p style={{ color: 'var(--t-text-muted)', fontSize: 14, marginTop: 8 }}>No quests available yet.</p>
                  <button onClick={() => seedQuests()} style={{ marginTop: 12, padding: '10px 20px', borderRadius: 10, background: 'var(--t-primary)', color: 'white', border: 'none', cursor: 'pointer', fontWeight: 600 }}>Load Quests</button>
                </div>
              ) : quests.map(quest => {
                const activeInstance = activeQuests.find(aq => aq.quest_id === quest.id)
                return <QuestCard key={quest.id} quest={quest} isActive={activeInstance} onStart={startQuest} />
              })}
            </div>
          )}

          {/* BADGES TAB */}
          {tab === 'Badges' && (
            <div>
              {allBadges.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '32px 0' }}>
                  <p style={{ fontSize: 40 }}>🏅</p>
                  <p style={{ color: 'var(--t-text-muted)', fontSize: 14, marginTop: 8 }}>Badge catalogue not loaded yet.</p>
                  <button onClick={() => seedBadges()} style={{ marginTop: 12, padding: '10px 20px', borderRadius: 10, background: 'var(--t-primary)', color: 'white', border: 'none', cursor: 'pointer', fontWeight: 600 }}>Load Badges</button>
                </div>
              ) : (
                <>
                  <p style={{ fontSize: 13, color: 'var(--t-text-muted)', marginBottom: 12 }}>{myBadges.length} / {allBadges.length} badges earned</p>
                  {['prayer', 'quran', 'habits', 'journal', 'fasting', 'special'].map(cat => {
                    const catBadges = allBadges.filter(b => b.category === cat)
                    if (catBadges.length === 0) return null
                    return (
                      <div key={cat} style={{ marginBottom: 20 }}>
                        <p style={{ fontWeight: 700, fontSize: 13, color: 'var(--t-text)', marginBottom: 8, textTransform: 'capitalize' }}>{cat} ({catBadges.filter(b => myBadgeSlugs.has(b.slug)).length}/{catBadges.length})</p>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8 }}>
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
            <Card>
              <h3 style={{ fontWeight: 700, fontSize: 15, color: 'var(--t-text)', marginBottom: 12 }}>XP History</h3>
              <XPHistory />
            </Card>
          )}

        </motion.div>
      </AnimatePresence>
    </div>
  )
}
