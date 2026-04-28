import React, { useState } from 'react'
import { createFileRoute, Link } from '@tanstack/react-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { X, Star, Flame, ArrowLeft } from 'lucide-react'
import api from '@/lib/api'
import { cn } from '@/lib/utils'
import toast from 'react-hot-toast'

export const Route = createFileRoute('/_authenticated/me/children/kids-mode')({
  component: KidsModePage,
})

const ACTIVITIES = [
  { key:'morning_dua',   name:'Morning Dua',     category:'dua',    xp:10, icon:'🌅', gradient:'from-orange-400 to-amber-500' },
  { key:'quran_reading', name:'Read Quran',       category:'quran',  xp:25, icon:'📖', gradient:'from-emerald-400 to-green-600' },
  { key:'salah',         name:'Pray Salah',       category:'salah',  xp:20, icon:'🕌', gradient:'from-blue-400 to-indigo-600' },
  { key:'evening_dua',   name:'Evening Adhkar',   category:'dua',    xp:10, icon:'🌙', gradient:'from-violet-400 to-purple-600' },
  { key:'islamic_story', name:'Islamic Story',    category:'story',  xp:15, icon:'📚', gradient:'from-pink-400 to-rose-500' },
  { key:'good_deed',     name:'Good Deed',        category:'akhlaq', xp:20, icon:'⭐', gradient:'from-yellow-400 to-orange-500' },
  { key:'help_family',   name:'Help Family',      category:'akhlaq', xp:15, icon:'🏠', gradient:'from-teal-400 to-cyan-600' },
  { key:'dua_practice',  name:'Learn a Dua',      category:'dua',    xp:15, icon:'🤲', gradient:'from-red-400 to-rose-600' },
]

const LEVEL_NAMES = {
  1:'Little Star',2:'Tiny Explorer',3:'Dua Learner',4:'Quran Buddy',
  5:'Salah Helper',6:'Seerah Seeker',7:'Akhlaq Champion',
  8:'Hafiz Helper',9:'Shining Star',10:'Young Scholar',
}
const LEVEL_THRESHOLDS = [0,50,150,300,500,800,1200,1800,2500,3500,Infinity]

function CelebrationBurst({ show }) {
  if (!show) return null
  return (
    <div className="fixed inset-0 pointer-events-none z-50 flex items-center justify-center">
      <div className="text-8xl animate-bounce">🎉</div>
      {['🌟','⭐','✨','💫','🎊'].map((e, i) => (
        <span key={i} className="fixed text-4xl animate-ping"
          style={{
            top: `${20 + Math.random() * 60}%`,
            left: `${10 + Math.random() * 80}%`,
            animationDelay: `${i * 0.1}s`,
            animationDuration: '0.8s'
          }}>{e}</span>
      ))}
    </div>
  )
}

export default function KidsModePage() {
  const qc = useQueryClient()
  const [activeChildId, setActiveChildId] = useState(null)
  const [celebrating, setCelebrating] = useState(false)
  const [doneTodayKeys, setDoneTodayKeys] = useState([])

  const { data: children = [] } = useQuery({
    queryKey: ['children'],
    queryFn: () => api.get('/children').then(r => r.data).catch(() => []),
  })

  const activeChild = children.find(c => c.id === activeChildId) || children[0]

  const { mutate: logActivity, isPending } = useMutation({
    mutationFn: (tmpl) => api.post(`/children/${activeChild.id}/activities`, {
      activity_key: tmpl.key,
      activity_name: tmpl.name,
      activity_category: tmpl.category,
      xp_earned: tmpl.xp,
      logged_by: 'child',
    }).then(r => r.data),
    onSuccess: (data, tmpl) => {
      qc.invalidateQueries({ queryKey: ['children'] })
      qc.invalidateQueries({ queryKey: ['child', activeChild?.id] })
      setDoneTodayKeys(prev => [...prev, tmpl.key])
      setCelebrating(true)
      setTimeout(() => setCelebrating(false), 1200)

      if (data.leveled_up) {
        setTimeout(() => toast.success(`🎉 LEVEL UP! You are now a ${data.level_name}!`, { duration: 4000 }), 500)
      } else {
        toast.success(`+${data.xp_gained} XP! MashaaAllah! 🌟`, { duration: 2000 })
      }
      data.new_badges?.forEach(b =>
        setTimeout(() => toast.success(`🏅 New badge: ${b.badge_name}!`, { duration: 3000 }), 800)
      )
    },
  })

  const xp = activeChild?.xp_total || 0
  const level = activeChild?.level || 1
  const thisXp = LEVEL_THRESHOLDS[level - 1] || 0
  const nextXp = LEVEL_THRESHOLDS[level] || LEVEL_THRESHOLDS[level - 1]
  const pct = nextXp === Infinity ? 100 : Math.round(((xp - thisXp) / (nextXp - thisXp)) * 100)
  const levelName = LEVEL_NAMES[level] || 'Scholar'

  if (children.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-400 via-teal-500 to-blue-600 flex flex-col items-center justify-center text-white p-8 text-center">
        <div className="text-7xl mb-6">👶</div>
        <h1 className="text-3xl font-black mb-3">Kids Mode</h1>
        <p className="text-white/80 mb-6">Ask a parent to add your profile first!</p>
        <Link to="/me/children/" className="bg-white text-teal-600 font-black px-6 py-3 rounded-2xl">
          Go to Parent View
        </Link>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-400 via-teal-500 to-blue-600 relative overflow-hidden">
      <CelebrationBurst show={celebrating} />

      {/* Background decoration */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {['🌟','⭐','💫','✨'].map((e, i) => (
          <span key={i} className="absolute text-white/10 text-6xl select-none"
            style={{ top:`${10 + i*22}%`, left:`${5 + i*25}%`, transform:`rotate(${i*30}deg)` }}>{e}</span>
        ))}
      </div>

      {/* Header */}
      <div className="relative z-10 px-4 pt-6 pb-4">
        <div className="flex items-center justify-between mb-6">
          <Link to="/me/children/" className="bg-white/20 backdrop-blur-sm rounded-2xl p-2.5">
            <ArrowLeft className="h-5 w-5 text-white" />
          </Link>
          <h1 className="text-2xl font-black text-white drop-shadow">🌟 Kids Mode</h1>
          <div className="w-10" />
        </div>

        {/* Child selector */}
        {children.length > 1 && (
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none justify-center mb-4">
            {children.map(c => (
              <button key={c.id} onClick={() => { setActiveChildId(c.id); setDoneTodayKeys([]) }}
                className={cn(
                  'shrink-0 flex flex-col items-center gap-1 p-2.5 rounded-2xl transition-all border-2',
                  (activeChild?.id === c.id)
                    ? 'border-white bg-white/30 scale-105 shadow-lg'
                    : 'border-white/30 bg-white/10'
                )}
              >
                <span className="text-3xl">{c.avatar_emoji}</span>
                <span className="text-[11px] font-black text-white">{c.name}</span>
              </button>
            ))}
          </div>
        )}

        {/* Active child hero */}
        {activeChild && (
          <div className="bg-white/20 backdrop-blur-md rounded-3xl p-5 border border-white/30 shadow-lg">
            <div className="flex items-center gap-3 mb-4">
              <div className="text-4xl">{activeChild.avatar_emoji}</div>
              <div className="flex-1">
                <p className="text-xl font-black text-white">{activeChild.name}</p>
                <p className="text-white/80 text-sm font-bold">Level {level} · {levelName}</p>
              </div>
              {activeChild.current_streak > 0 && (
                <div className="flex items-center gap-1 bg-orange-500/30 px-3 py-1.5 rounded-xl border border-orange-300/30">
                  <Flame className="h-4 w-4 text-orange-200" />
                  <span className="text-sm font-black text-white">{activeChild.current_streak}</span>
                </div>
              )}
            </div>

            {/* XP Bar */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-black text-white/90">
                <span>⭐ {xp} XP</span>
                <span>{nextXp === Infinity ? 'MAX LEVEL!' : `${nextXp - xp} to Level ${level + 1}`}</span>
              </div>
              <div className="h-4 rounded-full bg-white/20 overflow-hidden border border-white/30">
                <div className="h-full rounded-full bg-gradient-to-r from-yellow-300 to-orange-400 transition-all duration-700 shadow-[0_0_10px_rgba(251,191,36,0.6)]"
                  style={{ width: `${Math.min(100, pct)}%` }} />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Activities grid */}
      <div className="relative z-10 px-4 pb-12">
        <h2 className="text-lg font-black text-white mb-4 drop-shadow">Today's Activities</h2>
        <div className="grid grid-cols-2 gap-3">
          {ACTIVITIES.map(act => {
            const done = doneTodayKeys.includes(act.key)
            return (
              <button
                key={act.key}
                disabled={isPending || !activeChild}
                onClick={() => !done && logActivity(act)}
                className={cn(
                  'relative flex flex-col items-center gap-2 p-5 rounded-3xl transition-all border-2 border-white/20',
                  'shadow-lg active:scale-95',
                  done
                    ? 'opacity-70 bg-white/20 cursor-default'
                    : `bg-gradient-to-br ${act.gradient} hover:scale-105 hover:shadow-xl`
                )}
              >
                {done && (
                  <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-white/90 flex items-center justify-center">
                    <span className="text-green-500 text-xs font-black">✓</span>
                  </div>
                )}
                <span className="text-5xl drop-shadow-md">{act.icon}</span>
                <span className="text-sm font-black text-white leading-tight text-center drop-shadow">{act.name}</span>
                <div className={cn(
                  'px-3 py-0.5 rounded-full text-[11px] font-black',
                  done ? 'bg-white/20 text-white' : 'bg-black/20 text-white'
                )}>
                  {done ? '✓ Done!' : `+${act.xp} XP`}
                </div>
              </button>
            )
          })}
        </div>

        {/* Motivation message */}
        <div className="mt-6 bg-white/20 backdrop-blur-sm rounded-2xl p-4 border border-white/30 text-center">
          {doneTodayKeys.length === 0 ? (
            <p className="text-white font-bold text-sm">Tap an activity to earn XP! 🌟</p>
          ) : doneTodayKeys.length < 4 ? (
            <p className="text-white font-bold text-sm">MashaaAllah! Keep going! 💪</p>
          ) : (
            <p className="text-white font-bold text-sm">SubhanAllah! You are amazing today! 🏆</p>
          )}
        </div>
      </div>
    </div>
  )
}
