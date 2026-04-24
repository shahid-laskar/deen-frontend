import React, { useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { dhikrApi } from '@/lib/api'
import { TasbihCounter } from '@/components/habits/TasbihCounter'
import { habitsPrefs } from '@/lib/habits-prefs'

export const Route = createFileRoute('/_authenticated/habits/dhikr')({
  component: DhikrPage,
})

const FALLBACK_PRESETS = [
  { key: 'subhanallah', arabic: 'سُبْحَانَ اللَّهِ', transliteration: 'SubhanAllah', meaning: 'Glory be to Allah', target_count: 33 },
  { key: 'alhamdulillah', arabic: 'الْحَمْدُ لِلَّهِ', transliteration: 'Alhamdulillah', meaning: 'All praise to Allah', target_count: 33 },
  { key: 'allahu_akbar', arabic: 'اللَّهُ أَكْبَرُ', transliteration: 'Allahu Akbar', meaning: 'Allah is the Greatest', target_count: 34 },
  { key: 'la_ilaha_illallah', arabic: 'لَا إِلَٰهَ إِلَّا اللَّهُ', transliteration: 'La ilaha illallah', meaning: 'There is no god but Allah', target_count: 100 },
  { key: 'istighfar', arabic: 'أَسْتَغْفِرُ اللَّهَ', transliteration: 'Astaghfirullah', meaning: "I seek Allah's forgiveness", target_count: 100 },
  { key: 'salawat', arabic: 'اللَّهُمَّ صَلِّ عَلَى مُحَمَّدٍ', transliteration: 'Allahumma salli ala Muhammad', meaning: 'O Allah, send blessings on Muhammad', target_count: 10 },
]

function DhikrPage() {
  const qc = useQueryClient()
  const [activeKey, setActiveKey] = useState('')

  const presets = useQuery({
    queryKey: ['dhikr', 'presets'],
    queryFn: () => dhikrApi.presets().catch(() => FALLBACK_PRESETS),
  })

  const history = useQuery({
    queryKey: ['dhikr', 'history'],
    queryFn: () => dhikrApi.history({ days: 14 }).catch(() => []),
  })

  const createSession = useMutation({
    mutationFn: (p) =>
      dhikrApi.createSession({ dhikr_type: p.key, target_count: p.target_count }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['dhikr'] }),
  })

  const list = presets.data ?? FALLBACK_PRESETS
  const active = list.find((p) => p.key === activeKey) ?? null

  function startSession(p) {
    setActiveKey(p.key)
    habitsPrefs.setDhikrPreset(p.key)
    createSession.mutate(p)
  }

  function onComplete(p) {
    toast.success(`${p.transliteration} complete · alhamdulillah`)
    qc.invalidateQueries({ queryKey: ['dhikr'] })
  }

  const grouped = new Map()
  for (const s of history.data ?? []) {
    const d = (s.completed_at ?? s.created_at ?? '').slice(0, 10)
    if (!d) continue
    const arr = grouped.get(d) ?? []
    arr.push(s)
    grouped.set(d, arr)
  }
  const grouping = Array.from(grouped.entries()).sort((a, b) => (a[0] < b[0] ? 1 : -1))

  return (
    <div className="space-y-6 animate-slide-up">
      {active ? (
        <div className="rounded-3xl glass-card shadow-elevated p-6 md:p-8">
          <div className="flex justify-between items-center mb-4">
            <button
              onClick={() => setActiveKey('')}
              className="text-xs font-bold text-muted-foreground hover:text-foreground"
            >
              ← Back to presets
            </button>
          </div>
          <TasbihCounter
            arabic={active.arabic}
            transliteration={active.transliteration}
            meaning={active.meaning}
            target={active.target_count}
            onComplete={() => onComplete(active)}
          />
        </div>
      ) : (
        <div>
          <h3 className="text-[10px] uppercase tracking-[0.2em] font-bold text-muted-foreground mb-3">
            Choose a dhikr
          </h3>
          <div className="grid gap-3 md:grid-cols-2">
            {list.map((p) => (
              <button
                key={p.key}
                onClick={() => startSession(p)}
                className="rounded-2xl glass-card shadow-soft hover:shadow-elevated card-hover p-5 text-left transition-all"
              >
                <p className="font-amiri text-3xl text-foreground leading-tight">{p.arabic}</p>
                <p className="text-sm font-bold text-primary mt-2">{p.transliteration}</p>
                {p.meaning && <p className="text-xs text-muted-foreground mt-0.5">{p.meaning}</p>}
                <p className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground mt-3">
                  Target · {p.target_count}
                </p>
              </button>
            ))}
          </div>
        </div>
      )}

      {grouping.length > 0 && (
        <div className="rounded-2xl glass-card shadow-soft p-5">
          <h3 className="text-[10px] uppercase tracking-[0.2em] font-bold text-muted-foreground mb-3">History</h3>
          <div className="space-y-3">
            {grouping.slice(0, 7).map(([date, sessions]) => (
              <div key={date}>
                <p className="text-xs font-bold text-muted-foreground mb-1">{date}</p>
                <div className="space-y-1">
                  {sessions.map((s) => (
                    <div key={s.id} className="flex items-center justify-between text-xs px-3 py-1.5 rounded-lg bg-muted/40">
                      <span className="font-bold">{s.custom_label ?? s.dhikr_type}</span>
                      <span className="tabular-nums text-muted-foreground">
                        {s.current_count} / {s.target_count}
                        {s.completed && <span className="ml-2 text-primary">✓</span>}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
