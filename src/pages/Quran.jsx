import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { BookOpen, Search, Heart, Star, Plus, Check, RefreshCw, Trash2 } from 'lucide-react'
import { quranApi } from '../lib/api'
import { Card, Button, Input, Modal, Badge, EmptyState, Skeleton } from '../components/ui/index'
import toast from 'react-hot-toast'
import { clsx } from 'clsx'
import { format } from 'date-fns'

const TABS = ['Reader', 'Hifz Tracker', 'Duas']

const SM2_LABELS = ['Forgot', 'Wrong', 'Hard', 'OK', 'Good', 'Perfect']
const SM2_COLORS = ['bg-red-600', 'bg-red-400', 'bg-gold-500', 'bg-blue-500', 'bg-emerald-600', 'bg-emerald-700']

// ─── Surah List ───────────────────────────────────────────────────────────────
function SurahList({ onSelect }) {
  const [search, setSearch] = useState('')
  const { data: surahs, isLoading } = useQuery({
    queryKey: ['quran', 'surahs'],
    queryFn: () => quranApi.getSurahs().then((r) => r.data),
  })

  const filtered = surahs?.filter((s) =>
    s.name_simple.toLowerCase().includes(search.toLowerCase()) ||
    String(s.id).includes(search)
  ) || []

  return (
    <div className="space-y-4">
      <Input placeholder="Search surah..." value={search} onChange={(e) => setSearch(e.target.value)} />
      {isLoading ? (
        <div className="space-y-2">
          {[...Array(8)].map((_, i) => <Skeleton key={i} className="h-14" />)}
        </div>
      ) : (
        <div className="space-y-1 max-h-[60vh] overflow-y-auto pr-1">
          {filtered.map((s) => (
            <button
              key={s.id}
              onClick={() => onSelect(s)}
              className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-parchment-50 dark:hover:bg-emerald-900/30 transition-colors text-left group"
            >
              <div className="w-9 h-9 bg-emerald-100 dark:bg-emerald-900/50 rounded-lg flex items-center justify-center text-xs font-bold text-emerald-700 dark:text-emerald-400 flex-shrink-0">
                {s.id}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-emerald-900 dark:text-emerald-200">{s.name_simple}</p>
                <p className="text-xs text-muted">{s.translated_name?.name} • {s.verses_count} verses</p>
              </div>
              <span className="font-arabic text-base text-emerald-700 dark:text-emerald-400">{s.name_arabic}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Surah Reader ─────────────────────────────────────────────────────────────
function SurahReader({ surah, onBack }) {
  const { data, isLoading } = useQuery({
    queryKey: ['quran', 'surah', surah.id],
    queryFn: () => quranApi.getSurah(surah.id).then((r) => r.data),
  })

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <button onClick={onBack} className="btn-ghost px-3 py-2 text-sm">← Back</button>
        <div>
          <h2 className="font-display text-xl font-semibold text-emerald-900 dark:text-emerald-100">{surah.name_simple}</h2>
          <p className="text-xs text-muted">{surah.translated_name?.name} • {surah.verses_count} verses</p>
        </div>
        <span className="font-arabic text-2xl text-emerald-700 dark:text-emerald-400 ml-auto">{surah.name_arabic}</span>
      </div>

      {isLoading ? (
        <div className="space-y-4">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-20" />)}</div>
      ) : (
        <div className="space-y-1">
          {surah.id !== 1 && surah.id !== 9 && (
            <p className="font-arabic text-2xl text-center text-emerald-800 dark:text-emerald-200 py-4">
              بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
            </p>
          )}
          {data?.verses?.map((v) => (
            <div key={v.id} className="group py-4 border-b border-parchment-100 dark:border-emerald-900/30">
              <div className="flex items-start gap-3">
                <span className="w-8 h-8 flex-shrink-0 bg-emerald-100 dark:bg-emerald-900/40 rounded-lg flex items-center justify-center text-xs font-bold text-emerald-700 dark:text-emerald-400 mt-1">
                  {v.verse_number}
                </span>
                <div className="flex-1">
                  <p className="font-arabic text-2xl text-right leading-loose text-emerald-950 dark:text-emerald-50 mb-3">
                    {v.text_uthmani}
                  </p>
                  {v.translations?.[0] && (
                    <p className="text-sm text-parchment-600 dark:text-emerald-500 leading-relaxed">
                      {v.translations[0].text}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Hifz Tracker ────────────────────────────────────────────────────────────
function HifzTracker() {
  const qc = useQueryClient()
  const [addModal, setAddModal] = useState(false)
  const [form, setForm] = useState({ surah_number: '', surah_name: '', ayah_from: 1, ayah_to: 7, total_ayahs: 7 })

  const { data: hifz, isLoading } = useQuery({
    queryKey: ['quran', 'hifz'],
    queryFn: () => quranApi.getHifz().then((r) => r.data),
  })

  const { data: dueToday } = useQuery({
    queryKey: ['quran', 'hifz', 'due'],
    queryFn: () => quranApi.getHifzDueToday().then((r) => r.data),
  })

  const { mutate: addHifz, isPending: adding } = useMutation({
    mutationFn: () => quranApi.addHifz(form),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['quran', 'hifz'] })
      setAddModal(false)
      toast.success('Added to Hifz tracker!')
    },
  })

  const { mutate: review } = useMutation({
    mutationFn: ({ id, quality }) => quranApi.reviewHifz(id, quality),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['quran', 'hifz'] })
      toast.success('Review saved! InshaaAllah you\'ll remember it.')
    },
  })

  const { mutate: deleteHifz } = useMutation({
    mutationFn: (id) => quranApi.deleteHifz(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['quran', 'hifz'] }),
  })

  const statusColor = {
    not_started: 'bg-parchment-200 dark:bg-emerald-900/30',
    in_progress: 'bg-gold-100 dark:bg-gold-900/20',
    memorised: 'bg-emerald-100 dark:bg-emerald-900/30',
    needs_review: 'bg-red-100 dark:bg-red-900/20',
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="section-title">Hifz Progress</h2>
          {dueToday?.length > 0 && (
            <p className="text-sm text-gold-600 mt-0.5">
              ⚡ {dueToday.length} surah{dueToday.length > 1 ? 's' : ''} due for review today
            </p>
          )}
        </div>
        <Button variant="primary" size="sm" onClick={() => setAddModal(true)}>
          <Plus size={16} /> Add surah
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-3">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-24" />)}</div>
      ) : hifz?.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="No surahs tracked yet"
          description="Add your first surah to start your Hifz journey. May Allah make it easy for you."
          action={<Button variant="primary" onClick={() => setAddModal(true)}>Add first surah</Button>}
        />
      ) : (
        <div className="space-y-3">
          {hifz?.map((entry) => {
            const isDue = dueToday?.some((d) => d.id === entry.id)
            return (
              <Card key={entry.id} className={clsx(isDue && 'ring-2 ring-gold-400')}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-medium text-emerald-900 dark:text-emerald-200">
                        {entry.surah_name || `Surah ${entry.surah_number}`}
                      </h3>
                      <span className="text-xs text-muted">({entry.ayah_from}:{entry.ayah_to})</span>
                      {isDue && <Badge variant="gold">Review due</Badge>}
                    </div>
                    <div className="flex items-center gap-3 mt-1">
                      <span className={clsx('text-xs px-2 py-0.5 rounded-full capitalize', statusColor[entry.status])}>
                        {entry.status.replace('_', ' ')}
                      </span>
                      {entry.next_review && (
                        <span className="text-xs text-muted">
                          Next: {format(new Date(entry.next_review), 'd MMM')}
                        </span>
                      )}
                      <span className="text-xs text-muted">×{entry.review_count} reviews</span>
                    </div>
                  </div>
                  <button onClick={() => deleteHifz(entry.id)} className="text-parchment-400 hover:text-red-500 transition-colors p-1">
                    <Trash2 size={14} />
                  </button>
                </div>

                {isDue && (
                  <div className="mt-3 pt-3 border-t border-parchment-200 dark:border-emerald-900/30">
                    <p className="text-xs text-muted mb-2">How well did you remember it?</p>
                    <div className="flex gap-1 flex-wrap">
                      {SM2_LABELS.map((label, quality) => (
                        <button
                          key={quality}
                          onClick={() => review({ id: entry.id, quality })}
                          className={clsx(
                            'px-3 py-1.5 rounded-lg text-xs text-white font-medium transition-opacity hover:opacity-90',
                            SM2_COLORS[quality]
                          )}
                        >
                          {quality} — {label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </Card>
            )
          })}
        </div>
      )}

      <Modal open={addModal} onClose={() => setAddModal(false)} title="Add to Hifz">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Input label="Surah number" type="number" min="1" max="114" value={form.surah_number}
              onChange={(e) => setForm({ ...form, surah_number: parseInt(e.target.value) })} />
            <Input label="Surah name" value={form.surah_name}
              onChange={(e) => setForm({ ...form, surah_name: e.target.value })} />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <Input label="From Ayah" type="number" min="1" value={form.ayah_from}
              onChange={(e) => setForm({ ...form, ayah_from: parseInt(e.target.value) })} />
            <Input label="To Ayah" type="number" min="1" value={form.ayah_to}
              onChange={(e) => setForm({ ...form, ayah_to: parseInt(e.target.value) })} />
            <Input label="Total ayahs" type="number" min="1" value={form.total_ayahs}
              onChange={(e) => setForm({ ...form, total_ayahs: parseInt(e.target.value) })} />
          </div>
          <div className="flex gap-3">
            <Button variant="secondary" onClick={() => setAddModal(false)} className="flex-1">Cancel</Button>
            <Button variant="primary" onClick={() => addHifz()} loading={adding} className="flex-1">Add</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

// ─── Dua Library ─────────────────────────────────────────────────────────────
function DuaLibrary() {
  const qc = useQueryClient()
  const [category, setCategory] = useState(null)
  const [search, setSearch] = useState('')
  const [expanded, setExpanded] = useState(null)

  const { data: duas } = useQuery({
    queryKey: ['quran', 'duas', category],
    queryFn: () => quranApi.getDuas(category).then((r) => r.data),
  })

  const { data: favs } = useQuery({
    queryKey: ['quran', 'duas', 'favorites'],
    queryFn: () => quranApi.getFavDuas().then((r) => r.data),
  })

  const { mutate: addFav } = useMutation({
    mutationFn: (dua_key) => quranApi.addFavDua({ dua_key }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['quran', 'duas', 'favorites'] }); toast.success('Added to favourites') },
  })

  const { mutate: removeFav } = useMutation({
    mutationFn: (id) => quranApi.removeFavDua(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['quran', 'duas', 'favorites'] }),
  })

  const categories = ['morning_evening', 'food', 'travel', 'distress', 'guidance']
  const isFav = (key) => favs?.some((f) => f.dua_key === key)
  const getFavId = (key) => favs?.find((f) => f.dua_key === key)?.id

  const filtered = duas?.filter((d) =>
    !search || d.title.toLowerCase().includes(search.toLowerCase())
  ) || []

  return (
    <div className="space-y-5">
      <Input placeholder="Search duas..." value={search} onChange={(e) => setSearch(e.target.value)} />

      {/* Category pills */}
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => setCategory(null)}
          className={clsx('px-3 py-1.5 rounded-full text-xs font-medium border transition-all',
            !category ? 'bg-emerald-800 text-white border-emerald-800' : 'border-parchment-300 dark:border-emerald-700 text-parchment-600 dark:text-emerald-500'
          )}
        >All</button>
        {categories.map((c) => (
          <button key={c} onClick={() => setCategory(c === category ? null : c)}
            className={clsx('px-3 py-1.5 rounded-full text-xs font-medium border transition-all capitalize',
              category === c ? 'bg-emerald-800 text-white border-emerald-800' : 'border-parchment-300 dark:border-emerald-700 text-parchment-600 dark:text-emerald-500'
            )}
          >{c.replace('_', '/')}</button>
        ))}
      </div>

      <div className="space-y-3">
        {filtered.map((dua) => (
          <Card key={dua.key} hover onClick={() => setExpanded(expanded === dua.key ? null : dua.key)}>
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-medium text-emerald-900 dark:text-emerald-200">{dua.title}</h3>
                  <Badge variant="gray" className="text-xs">{dua.category?.replace('_', '/')}</Badge>
                </div>
                {expanded === dua.key && (
                  <div className="mt-3 space-y-3">
                    <p className="font-arabic text-xl text-right leading-loose text-emerald-900 dark:text-emerald-100">
                      {dua.arabic}
                    </p>
                    <p className="text-xs text-parchment-500 dark:text-emerald-600 italic">{dua.transliteration}</p>
                    <p className="text-sm text-emerald-800 dark:text-emerald-300">{dua.translation}</p>
                    <p className="text-xs text-muted">Ref: {dua.reference}</p>
                  </div>
                )}
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  isFav(dua.key) ? removeFav(getFavId(dua.key)) : addFav(dua.key)
                }}
                className={clsx('p-1.5 rounded-lg transition-colors flex-shrink-0',
                  isFav(dua.key) ? 'text-red-500' : 'text-parchment-400 hover:text-red-400'
                )}
              >
                <Heart size={16} fill={isFav(dua.key) ? 'currentColor' : 'none'} />
              </button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function Quran() {
  const [tab, setTab] = useState(0)
  const [selectedSurah, setSelectedSurah] = useState(null)

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="page-title mb-6">Quran</h1>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-parchment-100 dark:bg-emerald-900/30 rounded-xl mb-6">
        {TABS.map((t, i) => (
          <button key={t} onClick={() => { setTab(i); setSelectedSurah(null) }}
            className={clsx('flex-1 py-2 rounded-lg text-sm font-medium transition-all',
              tab === i ? 'bg-white dark:bg-emerald-900 text-emerald-900 dark:text-white shadow-sm'
                : 'text-parchment-500 dark:text-emerald-600 hover:text-emerald-700'
            )}
          >{t}</button>
        ))}
      </div>

      {tab === 0 && (
        selectedSurah
          ? <SurahReader surah={selectedSurah} onBack={() => setSelectedSurah(null)} />
          : <SurahList onSelect={setSelectedSurah} />
      )}
      {tab === 1 && <HifzTracker />}
      {tab === 2 && <DuaLibrary />}
    </div>
  )
}
