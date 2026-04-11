import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { format } from 'date-fns'
import { Plus, BookMarked, Trash2, ChevronDown, ChevronUp } from 'lucide-react'
import { journalApi } from '../lib/api'
import { Card, Button, Input, Textarea, Select, Modal, Badge, EmptyState, Skeleton } from '../components/ui/index'
import toast from 'react-hot-toast'
import { clsx } from 'clsx'

const MOODS = [
  { value: 'grateful', emoji: '🤲', label: 'Grateful' },
  { value: 'peaceful', emoji: '😌', label: 'Peaceful' },
  { value: 'hopeful', emoji: '🌟', label: 'Hopeful' },
  { value: 'motivated', emoji: '💪', label: 'Motivated' },
  { value: 'reflective', emoji: '🤔', label: 'Reflective' },
  { value: 'anxious', emoji: '😟', label: 'Anxious' },
  { value: 'sad', emoji: '😔', label: 'Sad' },
  { value: 'overwhelmed', emoji: '😰', label: 'Overwhelmed' },
  { value: 'neutral', emoji: '😐', label: 'Neutral' },
]

const MOOD_COLORS = {
  grateful: 'bg-emerald-100 text-emerald-700',
  peaceful: 'bg-teal-100 text-teal-700',
  hopeful: 'bg-gold-100 text-gold-700',
  motivated: 'bg-blue-100 text-blue-700',
  reflective: 'bg-purple-100 text-purple-700',
  anxious: 'bg-orange-100 text-orange-700',
  sad: 'bg-blue-100 text-blue-600',
  overwhelmed: 'bg-red-100 text-red-600',
  neutral: 'bg-parchment-100 text-parchment-600',
}

const JOURNAL_PROMPTS = [
  'What am I most grateful for today?',
  'How did I connect with Allah today?',
  'What challenged me, and what did I learn?',
  'What do I want to do differently tomorrow?',
  'What made me smile today?',
]

function EntryCard({ entry, onDelete }) {
  const [expanded, setExpanded] = useState(false)
  const mood = MOODS.find((m) => m.value === entry.mood)

  return (
    <Card>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className="text-xs text-muted">{format(new Date(entry.entry_date), 'EEEE, d MMMM yyyy')}</span>
            {mood && (
              <span className={clsx('text-xs px-2 py-0.5 rounded-full', MOOD_COLORS[mood.value])}>
                {mood.emoji} {mood.label}
              </span>
            )}
          </div>
          {entry.title && (
            <h3 className="font-display font-semibold text-emerald-900 dark:text-emerald-200 mb-2">{entry.title}</h3>
          )}
          <p className={clsx('text-sm text-emerald-800 dark:text-emerald-300 leading-relaxed',
            !expanded && 'line-clamp-3')}>
            {entry.content}
          </p>

          {expanded && (
            <div className="mt-4 space-y-3">
              {entry.gratitude && (
                <div className="pl-3 border-l-2 border-gold-400">
                  <p className="text-xs font-medium text-gold-700 mb-1">Gratitude</p>
                  <p className="text-sm text-emerald-700 dark:text-emerald-400">{entry.gratitude}</p>
                </div>
              )}
              {entry.intentions && (
                <div className="pl-3 border-l-2 border-emerald-400">
                  <p className="text-xs font-medium text-emerald-700 mb-1">Intentions</p>
                  <p className="text-sm text-emerald-700 dark:text-emerald-400">{entry.intentions}</p>
                </div>
              )}
              {entry.reflection && (
                <div className="pl-3 border-l-2 border-blue-400">
                  <p className="text-xs font-medium text-blue-700 mb-1">Reflection</p>
                  <p className="text-sm text-emerald-700 dark:text-emerald-400">{entry.reflection}</p>
                </div>
              )}
              {entry.quran_ayah_ref && (
                <p className="text-xs text-muted">📖 Ayah: {entry.quran_ayah_ref}</p>
              )}
            </div>
          )}
        </div>

        <div className="flex gap-1 flex-shrink-0">
          <button onClick={() => setExpanded(!expanded)} className="p-2 text-parchment-400 hover:text-emerald-700 transition-colors rounded-lg">
            {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
          <button onClick={() => onDelete(entry.id)} className="p-2 text-parchment-400 hover:text-red-500 transition-colors rounded-lg">
            <Trash2 size={14} />
          </button>
        </div>
      </div>
    </Card>
  )
}

export default function Journal() {
  const qc = useQueryClient()
  const [modal, setModal] = useState(false)
  const [randomPrompt] = useState(JOURNAL_PROMPTS[Math.floor(Math.random() * JOURNAL_PROMPTS.length)])
  const [form, setForm] = useState({
    title: '',
    content: '',
    mood: '',
    entry_date: format(new Date(), 'yyyy-MM-dd'),
    gratitude: '',
    intentions: '',
    reflection: '',
    quran_ayah_ref: '',
  })

  const { data: entries, isLoading } = useQuery({
    queryKey: ['journal'],
    queryFn: () => journalApi.list().then((r) => r.data),
  })

  const { mutate: createEntry, isPending } = useMutation({
    mutationFn: () => journalApi.create(form),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['journal'] })
      setModal(false)
      resetForm()
      toast.success('Journal entry saved. JazakAllahu Khayran for reflecting.')
    },
    onError: () => toast.error('Could not save entry.'),
  })

  const { mutate: deleteEntry } = useMutation({
    mutationFn: (id) => journalApi.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['journal'] }),
  })

  const resetForm = () => setForm({
    title: '', content: '', mood: '',
    entry_date: format(new Date(), 'yyyy-MM-dd'),
    gratitude: '', intentions: '', reflection: '', quran_ayah_ref: '',
  })

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="page-title">Journal</h1>
          <p className="text-muted mt-1">Reflect, record, and grow.</p>
        </div>
        <Button variant="primary" onClick={() => setModal(true)}>
          <Plus size={16} /> New entry
        </Button>
      </div>

      {/* Daily prompt */}
      <div className="mb-6 px-5 py-4 bg-emerald-950 rounded-xl">
        <p className="text-xs text-emerald-500 mb-1">Today's reflection prompt</p>
        <p className="text-emerald-100 font-display text-lg">"{randomPrompt}"</p>
        <button onClick={() => setModal(true)} className="text-gold-400 text-sm mt-2 hover:text-gold-300 transition-colors">
          Write your answer →
        </button>
      </div>

      {isLoading ? (
        <div className="space-y-4">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-32" />)}</div>
      ) : entries?.length === 0 ? (
        <EmptyState
          icon={BookMarked}
          title="Your journal is empty"
          description="Start writing. Even a few lines of gratitude can shift your day."
          action={<Button variant="primary" onClick={() => setModal(true)}>Write your first entry</Button>}
        />
      ) : (
        <div className="space-y-4">
          {entries?.map((entry) => (
            <EntryCard key={entry.id} entry={entry} onDelete={deleteEntry} />
          ))}
        </div>
      )}

      {/* New Entry Modal */}
      <Modal open={modal} onClose={() => setModal(false)} title="New journal entry" size="lg">
        <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
          <Input label="Date" type="date" value={form.entry_date}
            onChange={(e) => setForm({ ...form, entry_date: e.target.value })} />
          <Input label="Title (optional)" placeholder="e.g. A day of gratitude" value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })} />

          {/* Mood */}
          <div>
            <label className="label">How are you feeling?</label>
            <div className="flex gap-2 flex-wrap">
              {MOODS.map(({ value, emoji, label }) => (
                <button key={value} type="button"
                  onClick={() => setForm({ ...form, mood: value === form.mood ? '' : value })}
                  className={clsx('px-3 py-2 rounded-xl text-sm border transition-all',
                    form.mood === value ? 'border-emerald-700 bg-emerald-50 dark:bg-emerald-900/30' : 'border-parchment-200 dark:border-emerald-800'
                  )}>
                  {emoji} {label}
                </button>
              ))}
            </div>
          </div>

          <Textarea label="Your thoughts" placeholder={randomPrompt} rows={5} value={form.content}
            onChange={(e) => setForm({ ...form, content: e.target.value })} />

          <Textarea label="Gratitude — What are you thankful for?" placeholder="Alhamdulillah for..." rows={2} value={form.gratitude}
            onChange={(e) => setForm({ ...form, gratitude: e.target.value })} />

          <Textarea label="Intentions for tomorrow" placeholder="Tomorrow I intend to..." rows={2} value={form.intentions}
            onChange={(e) => setForm({ ...form, intentions: e.target.value })} />

          <Input label="Quran reference (optional)" placeholder="e.g. 2:286" value={form.quran_ayah_ref}
            onChange={(e) => setForm({ ...form, quran_ayah_ref: e.target.value })} />

          <div className="flex gap-3 pt-2">
            <Button variant="secondary" onClick={() => setModal(false)} className="flex-1">Cancel</Button>
            <Button variant="primary" onClick={() => createEntry()} loading={isPending} className="flex-1">Save entry</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
