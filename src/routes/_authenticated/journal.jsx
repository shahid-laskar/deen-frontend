import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { format } from 'date-fns'
import { Plus, Lock, Unlock, Trash2, ChevronDown, Sparkles, Heart, NotebookPen, ScrollText, CalendarDays, Search, ChevronRight, BookOpen, Flame, Calendar as CalendarIcon, Feather, Sun, Lightbulb, Activity, CloudRain, Waves, Meh } from 'lucide-react'
import api from '@/lib/api'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { getIslamicContext } from '@/lib/hijri'
import { cn } from '@/lib/utils'
import toast from 'react-hot-toast'

export const Route = createFileRoute('/_authenticated/journal')({
  component: JournalPage,
})

const TABS = ['write', 'entries', 'insights', 'analytics', 'letters']
const TAB_LABELS = { write: 'Write', entries: 'Entries', insights: 'Insights', analytics: 'Stats', letters: 'Letters' }

const MOODS = [
  { value: 'grateful',     icon: Heart,       label: 'Grateful' },
  { value: 'peaceful',     icon: Feather,     label: 'Peaceful' },
  { value: 'hopeful',      icon: Sun,         label: 'Hopeful' },
  { value: 'motivated',    icon: Flame,       label: 'Motivated' },
  { value: 'reflective',   icon: Lightbulb,   label: 'Reflective' },
  { value: 'anxious',      icon: Activity,    label: 'Anxious' },
  { value: 'sad',          icon: CloudRain,   label: 'Sad' },
  { value: 'overwhelmed',  icon: Waves,       label: 'Overwhelmed' },
  { value: 'neutral',      icon: Meh,         label: 'Neutral' },
]

const JOURNAL_MODES = [
  { id: 'free_write',        label: 'Free Write',       icon: NotebookPen,  desc: "Open canvas — write whatever's on your heart." },
  { id: 'guided_reflection', label: 'Guided',           icon: Sparkles,     desc: 'Pick a theme — gratitude, sabr, tawakkul — and answer prompts.' },
  { id: 'muhasabah',         label: 'Muhasabah',        icon: ScrollText,   desc: 'Self-accountability — review the day before Allah.' },
  { id: 'gratitude',         label: 'Gratitude',        icon: Heart,        desc: "Three things you're grateful for today." },
  { id: 'weekly_review',     label: 'Weekly Review',    icon: CalendarDays, desc: 'Wins, struggles, intentions for the next week.' },
]

// ─── E2E Encryption helpers ───
const enc = new TextEncoder()
const dec = new TextDecoder()
async function deriveKey(password, salt) {
  const keyMaterial = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveBits','deriveKey'])
  return crypto.subtle.deriveKey({ name: 'PBKDF2', salt, iterations: 200000, hash: 'SHA-256' }, keyMaterial, { name: 'AES-GCM', length: 256 }, false, ['encrypt','decrypt'])
}
async function encryptText(plaintext, password) {
  const salt = crypto.getRandomValues(new Uint8Array(16))
  const iv   = crypto.getRandomValues(new Uint8Array(12))
  const key  = await deriveKey(password, salt)
  const cipherBuf = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, enc.encode(plaintext))
  const toB64 = buf => btoa(String.fromCharCode(...new Uint8Array(buf)))
  return { ciphertext: toB64(cipherBuf), iv: toB64(iv), salt: toB64(salt) }
}
async function decryptText(ciphertext, iv, salt, password) {
  const fromB64 = s => Uint8Array.from(atob(s), c => c.charCodeAt(0))
  const key = await deriveKey(password, fromB64(salt))
  try {
    const plain = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: fromB64(iv) }, key, fromB64(ciphertext))
    return dec.decode(plain)
  } catch { return null }
}
const keyStore = { key: null, expiry: null }
function storeKey(password) { keyStore.key = password; keyStore.expiry = Date.now() + 5*60*1000 }
function getKey() { if (keyStore.key && keyStore.expiry > Date.now()) return keyStore.key; keyStore.key = null; return null }

function EncryptionSetup({ onSet }) {
  const [pass, setPass] = useState('')
  const [confirm, setConfirm] = useState('')
  return (
    <div className="space-y-4 py-2">
      <div className="p-4 rounded-xl bg-primary/10 border border-primary/20 text-center">
        <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-3">
          <Lock className="h-6 w-6 text-primary" />
        </div>
        <p className="font-bold text-foreground mb-1">End-to-end encrypted</p>
        <p className="text-xs text-muted-foreground">Your reflections are known only to you and Allah</p>
      </div>
      <div><label className="text-xs font-bold text-foreground mb-1 block">Journal password</label><Input type="password" value={pass} onChange={e=>setPass(e.target.value)} placeholder="Choose a strong password" /></div>
      <div><label className="text-xs font-bold text-foreground mb-1 block">Confirm</label><Input type="password" value={confirm} onChange={e=>setConfirm(e.target.value)} placeholder="Repeat password" /></div>
      <Button className="w-full mt-2 rounded-xl" onClick={() => { if (pass.length < 8) return toast.error('Password must be 8+ characters'); if (pass !== confirm) return toast.error('Passwords do not match'); storeKey(pass); onSet() }}>
        Enable encryption
      </Button>
    </div>
  )
}

function MoodSelector({ value, onChange }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {MOODS.map((m) => {
        const active = value === m.value;
        const Icon = m.icon;
        return (
          <button
            key={m.value}
            type="button"
            title={m.label}
            onClick={() => onChange(active ? null : m.value)}
            className={cn('h-10 w-10 rounded-xl flex items-center justify-center transition-all', active ? "bg-primary/15 ring-1 ring-primary/40 scale-110 text-primary" : "bg-muted/50 hover:bg-muted text-muted-foreground")}
          >
            <Icon className="h-5 w-5" />
          </button>
        );
      })}
    </div>
  )
}

function EditEntryDialog({ entry, open, onOpenChange, onSaved, decryptedContent }) {
  const qc = useQueryClient()
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [mood, setMood] = useState(null)
  
  useEffect(() => {
    if (open && entry) {
      setTitle(entry.title || '')
      setMood(entry.mood || null)
      if (entry.is_encrypted) {
        setContent(decryptedContent[entry.id] || '')
      } else {
        setContent(entry.content || '')
      }
    }
  }, [open, entry, decryptedContent])

  const { mutate: updateEntry, isPending } = useMutation({
    mutationFn: async (payload) => {
      let finalPayload = { ...payload }
      if (entry.is_encrypted) {
        const pass = getKey()
        if (!pass) throw new Error('Enter your journal password first to edit encrypted entries.')
        const { ciphertext, iv, salt } = await encryptText(payload.content, pass)
        finalPayload = { ...payload, content: ciphertext, iv, salt }
      }
      return api.patch(`/journal/${entry.id}`, finalPayload).then(r => r.data)
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['journal'] })
      toast.success('Entry updated')
      onSaved(data, content)
      onOpenChange(false)
    },
    onError: (err) => toast.error(err.message || 'Could not update entry')
  })

  const handleSave = (e) => {
    e.preventDefault()
    if (!content.trim()) return toast.error('Content cannot be empty')
    updateEntry({ title: title || null, content, mood })
  }

  if (!entry) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl rounded-3xl p-6 bg-background/95 backdrop-blur-xl border-primary/20">
        <DialogHeader>
          <DialogTitle>Edit Entry</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSave} className="space-y-4 pt-4">
          <input 
            placeholder="Title (optional)" 
            value={title} 
            onChange={e=>setTitle(e.target.value)} 
            className="w-full bg-transparent border-b border-border/40 pb-2 text-lg font-bold focus:outline-none focus:border-primary/50" 
          />
          <textarea 
            placeholder="Write freely…" 
            rows={8} 
            value={content} 
            onChange={e=>setContent(e.target.value)} 
            className="w-full bg-transparent text-base focus:outline-none resize-none border-l-2 border-primary/30 pl-4 min-h-[200px]" 
            disabled={entry.is_encrypted && !decryptedContent[entry.id]}
          />
          {entry.is_encrypted && !decryptedContent[entry.id] && (
            <p className="text-xs text-destructive font-bold flex items-center gap-1.5"><Lock className="h-3 w-3" /> Please decrypt the entry from the list before editing.</p>
          )}
          <div className="flex items-center justify-between flex-wrap gap-3 pt-2">
            <div className="flex items-center gap-3">
              <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Mood</span>
              <MoodSelector value={mood} onChange={setMood} />
            </div>
            <div className="flex gap-2">
              <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button type="submit" disabled={isPending || (entry.is_encrypted && !decryptedContent[entry.id])} className="rounded-xl bg-primary text-primary-foreground hover:opacity-90">
                {isPending ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function FreeWriteMode({ onSave, encrypted }) {
  const [content, setContent] = useState(''); const [title, setTitle] = useState(''); const [mood, setMood] = useState(null); const [ayahRef, setAyahRef] = useState(''); const [saving, setSaving] = useState(false)
  const handleSave = async (e) => {
    e?.preventDefault()
    if (!content.trim()) return toast.error('Write something first')
    setSaving(true)
    let payload = { content, title: title||null, mood, quran_ayah_ref: ayahRef||null, journal_mode: 'free_write' }
    if (encrypted) {
      const pass = getKey()
      if (!pass) { setSaving(false); return toast.error('Enter your journal password first') }
      const { ciphertext, iv, salt } = await encryptText(content, pass)
      payload = { ...payload, content: ciphertext, is_encrypted: true, iv, salt }
    }
    onSave(payload, () => { setContent(''); setTitle(''); setMood(null); setAyahRef('') })
    setSaving(false)
  }
  return (
    <form onSubmit={handleSave} className="relative overflow-hidden rounded-3xl glass-card shadow-elevated p-6 md:p-8">
      <div className="absolute inset-0 bg-gradient-to-br from-gold/8 via-transparent to-primary/8" />
      <div className="relative space-y-4">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <p className="text-[10px] uppercase tracking-widest font-bold text-primary">Free Write</p>
          {encrypted && <span className="flex items-center gap-1.5 rounded-full bg-primary text-primary-foreground px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest"><Lock className="h-3 w-3"/> Encrypted</span>}
        </div>
        <input placeholder="Title (optional)" value={title} onChange={e=>setTitle(e.target.value)} className="w-full bg-transparent border-b border-border/40 pb-2 text-lg font-bold focus:outline-none focus:border-primary/50" />
        <textarea placeholder="Write freely… your thoughts, reflections, intentions, duas." rows={6} value={content} onChange={e=>setContent(e.target.value)} className="w-full bg-transparent text-base placeholder:text-muted-foreground/60 focus:outline-none resize-none border-l-2 border-primary/30 pl-4 min-h-[150px]" />
        
        <div><p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-3">Quran verse (optional)</p><input placeholder="e.g. 2:286" value={ayahRef} onChange={e=>setAyahRef(e.target.value)} className="w-full bg-transparent border-b border-border/40 pb-2 text-sm focus:outline-none focus:border-primary/50" /></div>
        
        <div className="flex items-center justify-between flex-wrap gap-3 pt-2">
          <div className="flex items-center gap-3">
            <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Mood</span>
            <MoodSelector value={mood} onChange={setMood} />
          </div>
          <button type="submit" disabled={saving} className="flex items-center gap-1.5 rounded-xl bg-primary text-primary-foreground px-4 py-2 text-sm font-bold shadow-soft hover:shadow-glow-primary disabled:opacity-50">
            <NotebookPen className="h-3.5 w-3.5" />
            {saving ? 'Saving...' : 'Save entry'}
          </button>
        </div>
      </div>
    </form>
  )
}

function GuidedMode({ onSave }) {
  const [category, setCategory] = useState('gratitude'); const [promptIdx, setPromptIdx] = useState(0); const [content, setContent] = useState(''); const [mood, setMood] = useState(null)
  const { data: promptsData } = useQuery({ queryKey: ['journal','prompts', category], queryFn: () => api.get('/journal/guided-prompts', { params: { category } }).then(r => r.data) })
  const prompts = promptsData?.prompts || []; const currentPrompt = prompts[promptIdx] || ''
  const cats = ['gratitude','prayer','quran','accountability','muhasabah','sabr','tawakkul']
  
  const handleSave = (e) => {
    e?.preventDefault()
    if (!content.trim()) return toast.error('Write your reflection first')
    onSave({ content, mood, journal_mode:'guided_reflection', ai_prompt_used: currentPrompt }, () => setContent(''))
  }

  return (
    <form onSubmit={handleSave} className="relative overflow-hidden rounded-3xl glass-card shadow-elevated p-6 md:p-8">
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/8 via-transparent to-primary/8" />
      <div className="relative space-y-4">
        <p className="text-[10px] uppercase tracking-widest font-bold text-blue-500">Guided Reflection</p>
        <div className="flex flex-wrap gap-1.5">
          {cats.map(c => (
            <button key={c} type="button" onClick={() => { setCategory(c); setPromptIdx(0); setContent('') }} className={cn('text-[10px] uppercase tracking-widest font-bold px-2.5 py-1 rounded-full transition-all', category === c ? 'bg-blue-500 text-white' : 'bg-muted/50 text-muted-foreground hover:bg-muted')}>{c}</button>
          ))}
        </div>
        {currentPrompt && (
          <div className="rounded-xl bg-muted/40 p-3 text-sm transition-all group">
            <p className="font-medium text-foreground">{currentPrompt}</p>
            {prompts.length > 1 && <button type="button" onClick={() => setPromptIdx(i => (i+1) % prompts.length)} className="mt-2 text-[10px] font-bold text-blue-500 uppercase tracking-wider flex items-center gap-1 opacity-70 hover:opacity-100">Try another <ChevronDown className="h-3 w-3 -rotate-90"/></button>}
          </div>
        )}
        <textarea placeholder="Your reflection…" rows={5} value={content} onChange={e=>setContent(e.target.value)} className="w-full bg-transparent text-base focus:outline-none resize-none border-l-2 border-blue-500/30 pl-4" />
        <div className="flex items-center justify-between flex-wrap gap-3 pt-2">
          <div className="flex items-center gap-3">
            <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Mood</span>
            <MoodSelector value={mood} onChange={setMood} />
          </div>
          <button type="submit" className="flex items-center gap-1.5 rounded-xl bg-blue-500 text-white px-4 py-2 text-sm font-bold shadow-soft">
            <Sparkles className="h-3.5 w-3.5" /> Save reflection
          </button>
        </div>
      </div>
    </form>
  )
}

function MuhasabahMode({ onSave }) {
  const { data: promptData } = useQuery({ queryKey:['journal','muhasabah-prompt'], queryFn: () => api.get('/journal/muhasabah-prompt').then(r=>r.data) })
  const [answers, setAnswers] = useState({})
  const [content, setContent] = useState('')
  const sections = promptData?.sections || []
  const setAnswer = (key, val) => setAnswers(a => ({...a, [key]: val}))

  const handleSave = (e) => {
    e?.preventDefault()
    const summary = Object.entries(answers).map(([k,v])=>`${k}: ${v}`).join(', ')
    if (!summary && !content) return toast.error('Write something first')
    const finalContent = content ? `${summary}\n\nNotes: ${content}` : summary
    onSave({ content: finalContent, journal_mode:'muhasabah', muhasabah_data: answers }, () => { setAnswers({}); setContent('') })
  }

  return (
    <form onSubmit={handleSave} className="relative overflow-hidden rounded-3xl glass-card shadow-elevated p-6 md:p-8">
      <div className="absolute inset-0 bg-gradient-to-br from-purple-500/8 via-transparent to-primary/8" />
      <div className="relative space-y-4">
        <p className="text-[10px] uppercase tracking-widest font-bold text-purple-500">Muhasabah</p>
        <div className="grid md:grid-cols-2 gap-3">
          {sections.map(s => (
            <div key={s.key}>
              {s.type === 'boolean' ? (
                <label className="flex items-start gap-2 rounded-xl bg-muted/30 p-3 cursor-pointer">
                  <input type="checkbox" checked={Boolean(answers[s.key])} onChange={e=>setAnswer(s.key, e.target.checked)} className="mt-1" />
                  <span className="text-sm">{s.label}</span>
                </label>
              ) : s.type === 'number' ? (
                <div><p className="text-xs text-muted-foreground mb-1">{s.label}</p><input type="number" min={0} max={s.max||100} value={answers[s.key]||''} onChange={e=>setAnswer(s.key, Number(e.target.value))} className="w-full rounded-xl bg-muted/30 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-purple-500/40" /></div>
              ) : s.type === 'textarea' ? (
                <div className="md:col-span-2"><p className="text-xs text-muted-foreground mb-1">{s.label}</p><textarea rows={2} value={answers[s.key]||''} onChange={e=>setAnswer(s.key, e.target.value)} className="w-full rounded-xl bg-muted/30 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-purple-500/40 resize-none" /></div>
              ) : (
                <div><p className="text-xs text-muted-foreground mb-1">{s.label}</p><input type="text" value={answers[s.key]||''} onChange={e=>setAnswer(s.key, e.target.value)} className="w-full rounded-xl bg-muted/30 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-purple-500/40" /></div>
              )}
            </div>
          ))}
          <textarea placeholder="Anything else (optional)" rows={3} value={content} onChange={e=>setContent(e.target.value)} className="md:col-span-2 mt-2 w-full bg-transparent text-sm focus:outline-none resize-none border-l-2 border-purple-500/30 pl-4" />
        </div>
        <div className="flex justify-end pt-2">
          <button type="submit" className="flex items-center gap-1.5 rounded-xl bg-purple-500 text-white px-4 py-2 text-sm font-bold shadow-soft">
            <ScrollText className="h-3.5 w-3.5" /> Save muhasabah
          </button>
        </div>
      </div>
    </form>
  )
}

function GratitudeMode({ onSave }) {
  const [items, setItems] = useState(['', '', ''])
  
  const handleSave = (e) => {
    e?.preventDefault()
    const filled = items.filter(it => it.trim())
    if (!filled.length) return toast.error('Add at least one blessing')
    const content = filled.join('\n')
    onSave({ content, journal_mode:'gratitude', gratitude_items: filled }, () => setItems(['', '', '']))
  }

  return (
    <form onSubmit={handleSave} className="relative overflow-hidden rounded-3xl glass-card shadow-elevated p-6 md:p-8">
      <div className="absolute inset-0 bg-gradient-to-br from-gold/8 via-transparent to-primary/8" />
      <div className="relative space-y-4">
        <p className="text-[10px] uppercase tracking-widest font-bold text-gold">Gratitude</p>
        <div className="space-y-3">
          <p className="font-amiri text-base text-gold">"If you are grateful, I will surely increase you in favour." — 14:7</p>
          {items.map((g, i) => (
            <input key={i} value={g} placeholder={`I am grateful for… (${i + 1})`} onChange={e => { const next = [...items]; next[i] = e.target.value; setItems(next) }} className="w-full rounded-xl bg-muted/30 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-gold/40" />
          ))}
        </div>
        <div className="flex justify-end pt-2">
          <button type="submit" className="flex items-center gap-1.5 rounded-xl bg-gold text-gold-foreground px-4 py-2 text-sm font-bold shadow-soft">
            <Heart className="h-3.5 w-3.5" /> Save gratitude
          </button>
        </div>
      </div>
    </form>
  )
}

function WeeklyReviewMode({ onSave }) {
  const [weekly, setWeekly] = useState({})
  
  const handleSave = (e) => {
    e?.preventDefault()
    const has = Object.values(weekly).some(v => v && String(v).trim())
    if (!has) return toast.error('Write something first')
    const content = Object.entries(weekly).map(([k,v]) => `${k}:\n${v}`).join('\n\n')
    onSave({ content, journal_mode:'weekly_review', weekly_data: weekly }, () => setWeekly({}))
  }

  return (
    <form onSubmit={handleSave} className="relative overflow-hidden rounded-3xl glass-card shadow-elevated p-6 md:p-8">
      <div className="absolute inset-0 bg-gradient-to-br from-orange-500/8 via-transparent to-primary/8" />
      <div className="relative space-y-4">
        <p className="text-[10px] uppercase tracking-widest font-bold text-orange-500">Weekly Review</p>
        <div className="grid md:grid-cols-2 gap-3">
          {[['wins', 'Wins this week'], ['struggles', 'Struggles I faced'], ['lessons', 'Lessons learnt'], ['next_week_intention', 'Intention for next week'], ['spiritual_high', 'Spiritual high'], ['spiritual_low', 'Spiritual low']].map(([k, label]) => (
            <div key={k}>
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold mb-1">{label}</p>
              <textarea rows={2} value={weekly[k]||''} onChange={e=>setWeekly(w=>({...w, [k]: e.target.value}))} className="w-full rounded-xl bg-muted/30 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-orange-500/40 resize-none" />
            </div>
          ))}
        </div>
        <div className="flex justify-end pt-2">
          <button type="submit" className="flex items-center gap-1.5 rounded-xl bg-orange-500 text-white px-4 py-2 text-sm font-bold shadow-soft">
            <CalendarDays className="h-3.5 w-3.5" /> Save week review
          </button>
        </div>
      </div>
    </form>
  )
}

function WriteTab() {
  const qc = useQueryClient(); const [mode, setMode] = useState('free_write'); const [encrypted, setEncrypted] = useState(false); const [showEncSetup, setShowEncSetup] = useState(false); const [suggestedVerses, setSuggestedVerses] = useState(null)
  
  const { mutate: saveEntry } = useMutation({
    mutationFn: (data) => api.post('/journal', data),
    onSuccess: async (res, data) => {
      qc.invalidateQueries({ queryKey: ['journal'] })
      toast.success('Entry saved 🤲')
      if (!data.is_encrypted && mode !== 'muhasabah') {
        try { const verseResp = await api.post(`/journal/ai-suggest-verses?entry_id=${res.data.id}`); if (verseResp.data.verses?.length) setSuggestedVerses(verseResp.data.verses) } catch {}
      }
    },
    onError: () => toast.error('Could not save entry'),
  })
  
  const handleSave = (payload, reset) => { saveEntry(payload); reset?.() }

  return (
    <div className="space-y-6 animate-slide-up mt-4">
      <div className="flex flex-wrap gap-2 mb-4">
        <button onClick={() => encrypted ? (setEncrypted(false), storeKey(null)) : setShowEncSetup(true)} className={cn('flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition-all', encrypted ? 'bg-primary text-primary-foreground' : 'bg-muted/40 hover:bg-muted')}>
          <Lock className="h-3 w-3" /> {encrypted ? 'Encrypted' : 'Encrypt'}
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
        {JOURNAL_MODES.map(m => {
          const Icon = m.icon;
          const active = mode === m.id;
          return (
            <button key={m.id} type="button" onClick={() => setMode(m.id)} className={cn('text-left rounded-2xl p-3 transition-all border', active ? 'border-primary bg-primary/10 shadow-soft' : 'border-border/40 bg-card hover:bg-muted/40')}>
              <div className="flex items-center gap-2">
                <Icon className={cn("h-4 w-4", active ? "text-primary" : "text-muted-foreground")} />
                <span className="text-xs font-bold">{m.label}</span>
              </div>
              <p className="text-[10px] text-muted-foreground mt-1 leading-snug line-clamp-2">{m.desc}</p>
            </button>
          )
        })}
      </div>

      <div className="pt-2">
        {mode === 'free_write' && <FreeWriteMode onSave={handleSave} encrypted={encrypted} />}
        {mode === 'guided_reflection' && <GuidedMode onSave={handleSave} />}
        {mode === 'muhasabah' && <MuhasabahMode onSave={handleSave} />}
        {mode === 'gratitude' && <GratitudeMode onSave={handleSave} />}
        {mode === 'weekly_review' && <WeeklyReviewMode onSave={handleSave} />}
      </div>

      {suggestedVerses && (
        <div className="p-5 rounded-3xl glass-card shadow-elevated border border-primary/20 space-y-4 animate-in fade-in">
          <p className="text-sm font-bold text-primary flex items-center gap-2"><Sparkles className="h-4 w-4" /> Relevant verses for you</p>
          {suggestedVerses.map((v, i) => (
            <div key={i} className="p-3 bg-muted/40 rounded-xl">
              <p className="text-xs font-bold text-gold mb-1">{v.ref}</p>
              <p className="text-sm text-foreground italic leading-relaxed">"{v.text}"</p>
            </div>
          ))}
          <Button variant="outline" size="sm" onClick={() => setSuggestedVerses(null)} className="h-8 rounded-xl">Dismiss</Button>
        </div>
      )}

      <Dialog open={showEncSetup} onOpenChange={setShowEncSetup}>
        <DialogContent className="sm:max-w-md rounded-3xl p-6">
          <DialogHeader><DialogTitle>Enable Encryption</DialogTitle></DialogHeader>
          <EncryptionSetup onSet={() => { setEncrypted(true); setShowEncSetup(false); toast.success('Encryption enabled 🔒') }} />
        </DialogContent>
      </Dialog>
    </div>
  )
}

function EntriesTab() {
  const qc = useQueryClient()
  const [q, setQ] = useState('')
  const [moodFilter, setMoodFilter] = useState('all')
  const [modeFilter, setModeFilter] = useState('all')
  const [decryptedContent, setDecryptedContent] = useState({})
  const [editingEntry, setEditingEntry] = useState(null)

  const { data: entries = [], isLoading } = useQuery({
    queryKey: ['journal', moodFilter, modeFilter],
    queryFn: () => { const params = {}; if (moodFilter !== 'all') params.mood = moodFilter; if (modeFilter !== 'all') params.journal_mode = modeFilter; return api.get('/journal', { params }).then(r => r.data).catch(() => []) },
  })
  const { mutate: deleteEntry } = useMutation({ mutationFn: (id) => api.delete(`/journal/${id}`), onSuccess: () => { qc.invalidateQueries({ queryKey:['journal'] }); toast.success('Entry deleted') } })

  const handleDecrypt = async (entry) => {
    const pass = getKey()
    if (!pass) { const p = prompt('Enter journal password:'); if (!p) return; storeKey(p) }
    const plaintext = await decryptText(entry.content, entry.iv, entry.salt, getKey())
    if (plaintext) setDecryptedContent(d => ({...d, [entry.id]: plaintext}))
    else toast.error('Wrong password or corrupted entry')
  }

  const moodIcon = (mood) => { const Icon = MOODS.find(m=>m.value===mood)?.icon; return Icon ? <Icon className="h-4 w-4" /> : null }
  const moodLabel = (mood) => MOODS.find(m=>m.value===mood)?.label || mood
  const modeObj = (mode) => JOURNAL_MODES.find(m=>m.id===mode) || { label: mode, icon: NotebookPen }

  const filtered = useMemo(() => {
    if (!q.trim()) return entries;
    const needle = q.toLowerCase();
    return entries.filter(e => (e.title ?? "").toLowerCase().includes(needle) || (!e.is_encrypted && (e.content ?? "").toLowerCase().includes(needle)));
  }, [entries, q]);

  const groupedEntries = useMemo(() => {
    const groups = {}
    filtered.forEach(entry => {
      const month = format(new Date(entry.entry_date), 'MMMM yyyy')
      if (!groups[month]) groups[month] = []
      groups[month].push(entry)
    })
    return groups
  }, [filtered])

  return (
    <div className="space-y-6 animate-slide-up pt-4">
      <div className="rounded-2xl glass-card p-4 space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input value={q} onChange={e=>setQ(e.target.value)} placeholder="Search title or content…" className="w-full rounded-xl bg-muted/40 pl-10 pr-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary" />
        </div>
        <div className="flex flex-wrap gap-1.5">
          <button onClick={() => setMoodFilter('all')} className={cn("text-[11px] font-bold px-2.5 py-1 rounded-full transition-all", moodFilter === 'all' ? "bg-primary text-primary-foreground" : "bg-muted/50 text-muted-foreground hover:bg-muted")}>All moods</button>
          {MOODS.map(m => {
            const Icon = m.icon;
            return (
              <button key={m.value} onClick={() => setMoodFilter(m.value)} className={cn("text-[11px] font-bold px-2.5 py-1 rounded-full transition-all flex items-center gap-1.5", moodFilter === m.value ? "bg-primary text-primary-foreground" : "bg-muted/50 text-muted-foreground hover:bg-muted")}>
                <Icon className="h-3 w-3" /> {m.label}
              </button>
            )
          })}
        </div>
        <div className="flex flex-wrap gap-1.5">
          <button onClick={() => setModeFilter('all')} className={cn("text-[11px] font-bold px-2.5 py-1 rounded-full transition-all", modeFilter === 'all' ? "bg-primary text-primary-foreground" : "bg-muted/50 text-muted-foreground hover:bg-muted")}>All modes</button>
          {JOURNAL_MODES.map(m => (
            <button key={m.id} onClick={() => setModeFilter(m.id)} className={cn("text-[11px] font-bold px-2.5 py-1 rounded-full transition-all", modeFilter === m.id ? "bg-primary text-primary-foreground" : "bg-muted/50 text-muted-foreground hover:bg-muted")}>{m.label}</button>
          ))}
        </div>
      </div>

      {isLoading ? <div className="space-y-3">{[...Array(3)].map((_,i)=><div key={i} className="h-32 bg-muted/40 animate-pulse rounded-2xl glass-card" />)}</div> :
       filtered.length === 0 ? (
        <div className="rounded-2xl glass-card p-10 text-center flex flex-col items-center">
          <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
            <NotebookPen className="h-8 w-8 text-primary opacity-80" />
          </div>
          <p className="text-base font-bold text-foreground mb-1">{entries.length === 0 ? "No entries yet" : "No matches"}</p>
          <p className="text-sm text-muted-foreground">{entries.length === 0 ? "Start writing — even a few lines is muhasabah." : "Try a different search or filter."}</p>
        </div>
      ) : (
        <div className="space-y-8">
          {Object.entries(groupedEntries).map(([month, monthEntries]) => (
            <div key={month} className="space-y-3">
              <h2 className="text-sm font-black uppercase tracking-widest text-muted-foreground/80 pl-2">{month}</h2>
              <div className="space-y-3">
                {monthEntries.map(entry => {
                  const isEnc = entry.is_encrypted
                  const showContent = isEnc ? (decryptedContent[entry.id] || null) : entry.content
                  const modeItem = modeObj(entry.journal_mode)
                  const Icon = modeItem.icon
                  
                  return (
                    <div key={entry.id} className="group block rounded-2xl glass-card shadow-soft hover:shadow-elevated card-hover p-5 transition-all">
                      <div className="flex items-start justify-between gap-3 flex-wrap">
                        <div className="flex items-center gap-2 flex-wrap">
                          {entry.mood && <span className="text-primary p-1.5 rounded-xl bg-primary/10">{moodIcon(entry.mood)}</span>}
                          {entry.title && <h3 className="text-base font-bold">{entry.title}</h3>}
                          {isEnc && (
                            <span className="flex items-center gap-1 text-[10px] uppercase tracking-widest font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                              <Lock className="h-2.5 w-2.5" /> Encrypted
                            </span>
                          )}
                          {entry.journal_mode && (
                            <span className="flex items-center gap-1 text-[10px] uppercase tracking-widest font-bold text-muted-foreground bg-muted/50 px-2 py-0.5 rounded-full">
                              {Icon && <Icon className="h-3 w-3" />} {modeItem?.label ?? entry.journal_mode}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wide">
                            {format(new Date(entry.entry_date), 'MMM d, yyyy')}
                          </span>
                          <button onClick={(ev) => { ev.preventDefault(); ev.stopPropagation(); setEditingEntry(entry) }} className="p-1.5 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors" title="Edit entry">
                            <NotebookPen className="h-3.5 w-3.5" />
                          </button>
                          <button onClick={(ev) => { ev.preventDefault(); ev.stopPropagation(); if (confirm('Delete this entry?')) deleteEntry(entry.id) }} className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors" title="Delete entry">
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                      
                      {isEnc && !showContent ? (
                        <div className="flex items-center justify-between p-3 rounded-xl bg-muted/40 border border-border/50 mt-3">
                          <p className="text-xs font-medium text-muted-foreground flex items-center gap-2"><Lock className="h-3 w-3" /> Encrypted Content</p>
                          <Button variant="outline" size="sm" onClick={(ev) => { ev.preventDefault(); handleDecrypt(entry) }} className="h-8 text-xs font-bold text-primary border-primary hover:bg-primary/10 rounded-xl">Decrypt</Button>
                        </div>
                      ) : (
                        <p className="text-sm text-foreground mt-3 whitespace-pre-wrap font-medium leading-relaxed">
                          {showContent}
                        </p>
                      )}
                      
                      {entry.mood && (
                        <p className="text-[10px] text-muted-foreground mt-3 font-semibold uppercase tracking-widest">
                          Mood · {moodLabel(entry.mood)}
                        </p>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {editingEntry && (
        <EditEntryDialog 
          entry={editingEntry} 
          open={!!editingEntry} 
          onOpenChange={(v) => !v && setEditingEntry(null)}
          decryptedContent={decryptedContent}
          onSaved={(updated, unencryptedContent) => {
            if (updated.is_encrypted) {
              setDecryptedContent(prev => ({ ...prev, [updated.id]: unencryptedContent }))
            }
          }}
        />
      )}
    </div>
  )
}

function Stat({ icon, label, value }) {
  return (
    <div className="rounded-2xl bg-muted/40 px-3 py-2 min-w-[68px]">
      <div className="flex items-center justify-center gap-1 text-muted-foreground">
        {icon}
        <span className="text-[9px] uppercase tracking-widest font-bold">{label}</span>
      </div>
      <p className="text-lg font-bold tabular-nums mt-0.5 text-center">{value}</p>
    </div>
  );
}

function JournalPage() {
  const [tab, setTab] = useState('write')
  const ctx = getIslamicContext()
  const { data: stats } = useQuery({ queryKey:['journal','analytics'], queryFn: () => api.get('/journal/analytics').then(r=>r.data).catch(()=>null) })

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 md:py-8 space-y-6">
      {/* Hero */}
      <div className="rounded-3xl glass-card shadow-elevated p-5 md:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground">
              {format(new Date(), 'EEEE, MMMM d, yyyy')}
            </p>
            <p className="font-amiri text-lg md:text-xl text-gold mt-0.5">{ctx?.formatted || ''}</p>
            <p className="text-sm text-foreground/80 mt-2 italic">
              "What did Allah reveal to you today?"
            </p>
          </div>
          <div className="grid grid-cols-3 gap-3 text-center">
            <Stat icon={<Flame className="h-3.5 w-3.5" />} label="Streak" value={stats?.current_streak ?? 0} />
            <Stat icon={<BookOpen className="h-3.5 w-3.5" />} label="Total" value={stats?.total_entries ?? 0} />
            <Stat icon={<CalendarIcon className="h-3.5 w-3.5" />} label="Month" value={stats?.entries_this_month ?? 0} />
          </div>
        </div>
      </div>

      <div className="flex overflow-x-auto p-1.5 rounded-2xl bg-muted/50 gap-1 scrollbar-none backdrop-blur-sm">
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={cn('flex-1 min-w-[80px] px-3 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap', tab === t ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground')}>
            {TAB_LABELS[t]}
          </button>
        ))}
      </div>

      <div className="pt-2">
        {tab === 'write'     && <WriteTab />}
        {tab === 'entries'   && <EntriesTab />}
        {tab === 'insights'  && <div className="text-center p-12 text-muted-foreground glass-card rounded-3xl">Insights (View-Only Mode) — Needs 14 days of data</div>}
        {tab === 'analytics' && <div className="text-center p-12 text-muted-foreground glass-card rounded-3xl">Stats Dashboard View</div>}
        {tab === 'letters'   && <div className="text-center p-12 text-muted-foreground glass-card rounded-3xl">Monthly Letters View</div>}
      </div>
    </div>
  )
}
