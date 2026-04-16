import React, { useState, useEffect, useRef, useCallback } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { format } from 'date-fns'
import { Plus, Lock, Unlock, Trash2, ChevronDown, Sparkles, Heart } from 'lucide-react'
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
  { value: 'grateful',     emoji: '🤲', label: 'Grateful' },
  { value: 'peaceful',     emoji: '😌', label: 'Peaceful' },
  { value: 'hopeful',      emoji: '🌟', label: 'Hopeful' },
  { value: 'motivated',    emoji: '💪', label: 'Motivated' },
  { value: 'reflective',   emoji: '🤔', label: 'Reflective' },
  { value: 'anxious',      emoji: '😟', label: 'Anxious' },
  { value: 'sad',          emoji: '😔', label: 'Sad' },
  { value: 'overwhelmed',  emoji: '😰', label: 'Overwhelmed' },
  { value: 'neutral',      emoji: '😐', label: 'Neutral' },
]

const JOURNAL_MODES = [
  { id: 'free_write',        label: 'Free Write',       icon: '✍️',  desc: 'Your thoughts, unfiltered', colorClass: 'text-primary bg-primary/10 border-primary/20 bg-primary hover:bg-primary/90' },
  { id: 'guided_reflection', label: 'Guided',           icon: '💭',  desc: 'AI-curated reflection prompts', colorClass: 'text-blue-500 bg-blue-500/10 border-blue-500/20 bg-blue-500 hover:bg-blue-500/90' },
  { id: 'muhasabah',         label: 'Muhasabah',        icon: '⚖️',  desc: 'Daily self-accountability', colorClass: 'text-purple-500 bg-purple-500/10 border-purple-500/20 bg-purple-500 hover:bg-purple-500/90' },
  { id: 'gratitude',         label: 'Gratitude',        icon: '🤲',  desc: '3 blessings with why', colorClass: 'text-gold bg-gold/10 border-gold/20 bg-gold hover:bg-gold/90' },
  { id: 'weekly_review',     label: 'Weekly Review',    icon: '📊',  desc: 'Week-in-review summary', colorClass: 'text-orange-500 bg-orange-500/10 border-orange-500/20 bg-orange-500 hover:bg-orange-500/90' },
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
      <Button className="w-full mt-2" onClick={() => { if (pass.length < 8) return toast.error('Password must be 8+ characters'); if (pass !== confirm) return toast.error('Passwords do not match'); storeKey(pass); onSet() }}>
        Enable encryption
      </Button>
    </div>
  )
}

function MoodSelector({ value, onChange }) {
  return (
    <div className="flex gap-2 flex-wrap">
      {MOODS.map(m => (
        <button key={m.value} onClick={() => onChange(value === m.value ? null : m.value)}
          className={cn('flex flex-col items-center gap-1.5 px-3 py-2.5 rounded-xl border-2 transition-all cursor-pointer', value === m.value ? 'border-primary bg-primary/10' : 'border-border bg-card hover:border-primary/30')}>
          <span className="text-2xl drop-shadow-sm leading-none">{m.emoji}</span>
          <span className={cn('text-[10px] font-bold', value === m.value ? 'text-primary' : 'text-muted-foreground')}>{m.label}</span>
        </button>
      ))}
    </div>
  )
}

function FreeWriteMode({ onSave, encrypted }) {
  const [content, setContent] = useState(''); const [title, setTitle] = useState(''); const [mood, setMood] = useState(null); const [ayahRef, setAyahRef] = useState(''); const [saving, setSaving] = useState(false)
  const handleSave = async () => {
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
    <div className="space-y-6">
      <Input placeholder="Title (optional)" value={title} onChange={e=>setTitle(e.target.value)} className="font-bold text-lg h-12" />
      <textarea className="w-full rounded-2xl border border-input bg-background px-4 py-3 text-base shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none font-medium leading-relaxed min-h-[250px]" placeholder="Write freely... your thoughts, reflections, intentions, duas." value={content} onChange={e=>setContent(e.target.value)} />
      <div><p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">How do you feel?</p><MoodSelector value={mood} onChange={setMood} /></div>
      <div><p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">Quran verse (optional)</p><Input placeholder="e.g. 2:286" value={ayahRef} onChange={e=>setAyahRef(e.target.value)} /></div>
      {encrypted && <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground"><Lock className="h-3.5 w-3.5 text-primary"/> Will be encrypted before saving</div>}
      <Button size="lg" className="w-full text-base" onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : 'Save entry'}</Button>
    </div>
  )
}

function GuidedMode({ onSave }) {
  const [category, setCategory] = useState('gratitude'); const [promptIdx, setPromptIdx] = useState(0); const [content, setContent] = useState(''); const [mood, setMood] = useState(null)
  const { data: promptsData } = useQuery({ queryKey: ['journal','prompts', category], queryFn: () => api.get('/journal/guided-prompts', { params: { category } }).then(r => r.data) })
  const prompts = promptsData?.prompts || []; const currentPrompt = prompts[promptIdx] || ''
  const cats = ['gratitude','prayer','quran','accountability','muhasabah','sabr','tawakkul']
  return (
    <div className="space-y-6">
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
        {cats.map(c => (
          <button key={c} onClick={() => { setCategory(c); setPromptIdx(0); setContent('') }} className={cn('px-3.5 py-1.5 rounded-full border text-xs font-bold capitalize whitespace-nowrap transition-colors', category === c ? 'border-blue-500 bg-blue-500/10 text-blue-600' : 'border-border bg-card text-muted-foreground hover:bg-muted')}>{c}</button>
        ))}
      </div>
      {currentPrompt && (
        <div className="p-5 rounded-2xl bg-blue-500/5 border border-blue-500/20">
          <p className="text-base font-bold text-foreground leading-relaxed flex items-start gap-3"><span className="text-xl">💭</span> {currentPrompt}</p>
          {prompts.length > 1 && <button onClick={() => setPromptIdx(i => (i+1) % prompts.length)} className="mt-4 text-xs font-bold text-blue-500 hover:underline flex items-center gap-1">Try another prompt <ChevronDown className="h-3 w-3 -rotate-90"/></button>}
        </div>
      )}
      <textarea className="w-full rounded-2xl border border-input bg-background px-4 py-3 text-base shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none font-medium leading-relaxed min-h-[200px]" placeholder="Reflect on this prompt..." value={content} onChange={e=>setContent(e.target.value)} />
      <div><p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">How do you feel? (optional)</p><MoodSelector value={mood} onChange={setMood} /></div>
      <Button size="lg" className="w-full text-base bg-blue-600 hover:bg-blue-700 text-white" onClick={() => { if (!content.trim()) return toast.error('Write your reflection first'); onSave({ content, mood, journal_mode:'guided_reflection', ai_prompt_used: currentPrompt }, () => setContent('')) }}>Save reflection</Button>
    </div>
  )
}

function MuhasabahMode({ onSave }) {
  const { data: promptData } = useQuery({ queryKey:['journal','muhasabah-prompt'], queryFn: () => api.get('/journal/muhasabah-prompt').then(r=>r.data) })
  const [answers, setAnswers] = useState({})
  const sections = promptData?.sections || []
  const setAnswer = (key, val) => setAnswers(a => ({...a, [key]: val}))

  return (
    <div className="space-y-6">
      <div className="p-4 rounded-xl bg-purple-500/10 border border-purple-500/20 text-center">
        <p className="text-sm font-bold text-purple-600">⚖️ Daily Muhasabah</p>
        <p className="text-[11px] text-muted-foreground mt-1 font-medium italic">Account yourself before you are accounted — Umar ibn al-Khattab (RA)</p>
      </div>
      <div className="space-y-5">
        {sections.map(s => (
          <div key={s.key} className="p-4 rounded-2xl border border-border bg-card">
            <p className="text-sm font-bold text-foreground mb-3">{s.label}</p>
            {s.type === 'boolean' ? (
              <div className="flex gap-2">
                {['Yes','No'].map(opt => (
                  <button key={opt} onClick={() => setAnswer(s.key, opt==='Yes')} className={cn('flex-1 py-2.5 rounded-xl border-2 text-sm font-bold transition-all', answers[s.key]===(opt==='Yes') ? 'border-purple-500 bg-purple-500/10 text-purple-600' : 'border-border bg-background text-muted-foreground')}>{opt}</button>
                ))}
              </div>
            ) : s.type === 'number' ? <Input type="number" min={0} max={s.max||100} value={answers[s.key]||''} onChange={e=>setAnswer(s.key, Number(e.target.value))} />
              : s.type === 'textarea' ? <textarea className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm resize-none" rows={3} value={answers[s.key]||''} onChange={e=>setAnswer(s.key, e.target.value)} />
              : <Input value={answers[s.key]||''} onChange={e=>setAnswer(s.key, e.target.value)} />}
          </div>
        ))}
      </div>
      <Button size="lg" className="w-full text-base bg-purple-600 hover:bg-purple-700 text-white" onClick={() => { const summary = Object.entries(answers).map(([k,v])=>`${k}: ${v}`).join(', '); onSave({ content: summary, journal_mode:'muhasabah', muhasabah_data: answers }, () => setAnswers({})) }}>Save muhasabah</Button>
    </div>
  )
}

function GratitudeMode({ onSave }) {
  const [items, setItems] = useState([{text:'',why:''},{text:'',why:''},{text:'',why:''}])
  const setItem = (i, field, val) => setItems(arr => arr.map((it,j) => j===i ? {...it,[field]:val} : it))
  const ordinals = ['First','Second','Third']
  return (
    <div className="space-y-6">
      <div className="p-4 rounded-xl bg-gold/10 border border-gold/20 text-center">
        <p className="text-sm font-bold text-gold">🤲 Gratitude Journal</p>
        <p className="text-[11px] text-muted-foreground mt-1 font-medium italic">Ibrahim 14:7 — If you are grateful, I will surely increase you</p>
      </div>
      <div className="space-y-4">
        {items.map((item, i) => (
          <div key={i} className="p-5 rounded-2xl border border-border bg-card space-y-3">
            <p className="text-xs font-bold uppercase tracking-wider text-gold flex items-center gap-2"><span className="w-5 h-5 rounded-full bg-gold/20 flex items-center justify-center text-gold">{i+1}</span> {ordinals[i]} Blessing</p>
            <Input placeholder="I am grateful for..." value={item.text} onChange={e=>setItem(i,'text',e.target.value)} className="h-11 font-medium" />
            <Input placeholder="Because..." value={item.why} onChange={e=>setItem(i,'why',e.target.value)} className="h-10 text-sm" />
          </div>
        ))}
      </div>
      <Button size="lg" className="w-full text-base bg-gold text-gold-foreground hover:bg-gold/90" onClick={() => {
        const filled = items.filter(it => it.text.trim())
        if (!filled.length) return toast.error('Add at least one blessing')
        const content = filled.map(it => `${it.text}${it.why ? ` — because ${it.why}` : ''}`).join('\n')
        onSave({ content, journal_mode:'gratitude', gratitude_items: filled }, () => setItems([{text:'',why:''},{text:'',why:''},{text:'',why:''}]))
      }}>Save gratitude</Button>
    </div>
  )
}

function WeeklyReviewMode({ onSave }) {
  const [notes, setNotes] = useState(''); const [rating, setRating] = useState(3)
  const { data: stats } = useQuery({ queryKey:['journal','analytics'], queryFn: () => api.get('/journal/analytics').then(r=>r.data).catch(()=>null) })
  const { data: habits } = useQuery({ queryKey:['habits','weekly'], queryFn: () => api.get('/habits/analytics/weekly').then(r=>r.data).catch(()=>null) })

  return (
    <div className="space-y-6">
      <div className="p-5 rounded-2xl bg-orange-500/10 border border-orange-500/20 text-center space-y-2">
        <p className="text-sm font-bold text-orange-600 flex items-center justify-center gap-2">📊 Week in Review</p>
        <div className="flex divide-x divide-orange-500/20 justify-center text-[11px] font-medium text-orange-700/80">
          {stats && <span className="px-3">Journal streak: {stats.current_streak}</span>}
          {habits && <span className="px-3">Habits: {habits.completion_rate}%</span>}
        </div>
      </div>
      <div>
        <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">How was your week spiritually? (1–5)</p>
        <div className="flex gap-2">
          {[1,2,3,4,5].map(n => (
            <button key={n} onClick={() => setRating(n)} className={cn('flex-1 py-3 rounded-2xl border-2 text-2xl transition-all flex justify-center items-center', rating===n?'border-orange-500 bg-orange-500/10':'border-border bg-card opacity-50 grayscale hover:grayscale-0 hover:opacity-100')}>
              {['😔','😐','🙂','😊','🤲'][n-1]}
            </button>
          ))}
        </div>
      </div>
      <div>
        <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">Reflections</p>
        <textarea className="w-full rounded-2xl border border-input bg-background px-4 py-3 text-base shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none font-medium leading-relaxed min-h-[160px]" placeholder="What went well? What will I improve? What am I taking into next week?" value={notes} onChange={e=>setNotes(e.target.value)} />
      </div>
      <Button size="lg" className="w-full text-base bg-orange-500 hover:bg-orange-600 text-white" onClick={() => { if (!notes.trim()) return toast.error('Add your reflections'); onSave({ content: notes, journal_mode:'weekly_review', weekly_data: { spiritual_rating: rating } }, () => { setNotes(''); setRating(3) }) }}>Save week review</Button>
    </div>
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
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
        {JOURNAL_MODES.map(m => (
          <button key={m.id} onClick={() => setMode(m.id)} className={cn('flex flex-col items-center justify-center p-3 sm:px-4 sm:py-3 rounded-2xl border-2 transition-all min-w-[90px] shrink-0', mode===m.id ? m.colorClass.split(' ').slice(0,3).join(' ') : 'border-border bg-card hover:border-border/80')}>
            <span className="text-2xl drop-shadow-sm mb-1 line-clamp-1">{m.icon}</span>
            <span className={cn('text-[10px] font-bold uppercase tracking-wider', mode===m.id ? '' : 'text-muted-foreground')}>{m.label}</span>
          </button>
        ))}
      </div>

      <div className="flex items-center justify-between px-1">
        <p className="text-sm text-foreground font-medium">{JOURNAL_MODES.find(m=>m.id===mode)?.desc}</p>
        {mode === 'free_write' && (
          <button onClick={() => encrypted ? (setEncrypted(false), storeKey(null)) : setShowEncSetup(true)} className={cn('flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-bold transition-colors', encrypted ? 'bg-primary/10 border-primary text-primary' : 'bg-muted border-transparent text-muted-foreground hover:bg-muted/80')}>
            {encrypted ? <Lock className="h-3 w-3" /> : <Unlock className="h-3 w-3" />}
            {encrypted ? 'Encrypted' : 'Encrypt'}
          </button>
        )}
      </div>

      <div className="pt-2">
        {mode === 'free_write' && <FreeWriteMode onSave={handleSave} encrypted={encrypted} />}
        {mode === 'guided_reflection' && <GuidedMode onSave={handleSave} />}
        {mode === 'muhasabah' && <MuhasabahMode onSave={handleSave} />}
        {mode === 'gratitude' && <GratitudeMode onSave={handleSave} />}
        {mode === 'weekly_review' && <WeeklyReviewMode onSave={handleSave} />}
      </div>

      {suggestedVerses && (
        <div className="p-5 rounded-2xl bg-primary/5 border border-primary/20 space-y-4 animate-in fade-in">
          <p className="text-sm font-bold text-primary flex items-center gap-2"><Sparkles className="h-4 w-4" /> Relevant verses for you</p>
          {suggestedVerses.map((v, i) => (
            <div key={i} className="p-3 bg-card border border-border rounded-xl">
              <p className="text-xs font-bold text-gold mb-1">{v.ref}</p>
              <p className="text-sm text-foreground italic leading-relaxed">"{v.text}"</p>
            </div>
          ))}
          <Button variant="outline" size="sm" onClick={() => setSuggestedVerses(null)} className="h-8">Dismiss</Button>
        </div>
      )}

      <Dialog open={showEncSetup} onOpenChange={setShowEncSetup}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Enable Encryption</DialogTitle></DialogHeader>
          <EncryptionSetup onSet={() => { setEncrypted(true); setShowEncSetup(false); toast.success('Encryption enabled 🔒') }} />
        </DialogContent>
      </Dialog>
    </div>
  )
}

function EntriesTab() {
  const qc = useQueryClient()
  const [moodFilter, setMoodFilter] = useState(''); const [modeFilter, setModeFilter] = useState('')
  const [decryptedContent, setDecryptedContent] = useState({})

  const { data: entries = [], isLoading } = useQuery({
    queryKey: ['journal', moodFilter, modeFilter],
    queryFn: () => { const params = {}; if (moodFilter) params.mood = moodFilter; if (modeFilter) params.journal_mode = modeFilter; return api.get('/journal', { params }).then(r => r.data).catch(() => []) },
  })
  const { mutate: deleteEntry } = useMutation({ mutationFn: (id) => api.delete(`/journal/${id}`), onSuccess: () => { qc.invalidateQueries({ queryKey:['journal'] }); toast.success('Entry deleted') } })

  const handleDecrypt = async (entry) => {
    const pass = getKey()
    if (!pass) { const p = prompt('Enter journal password:'); if (!p) return; storeKey(p) }
    const plaintext = await decryptText(entry.content, entry.iv, entry.salt, getKey())
    if (plaintext) setDecryptedContent(d => ({...d, [entry.id]: plaintext}))
    else toast.error('Wrong password or corrupted entry')
  }

  const moodEmoji = (mood) => MOODS.find(m=>m.value===mood)?.emoji || '•'
  const modeObj = (mode) => JOURNAL_MODES.find(m=>m.id===mode)

  return (
    <div className="space-y-4 animate-in fade-in pt-2">
      <div className="flex flex-col sm:flex-row gap-3">
        <select className="flex h-11 w-full items-center justify-between rounded-xl border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring" value={moodFilter} onChange={e=>setMoodFilter(e.target.value)}>
          <option value="">All moods</option>{MOODS.map(m => <option key={m.value} value={m.value}>{m.emoji} {m.label}</option>)}
        </select>
        <select className="flex h-11 w-full items-center justify-between rounded-xl border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring" value={modeFilter} onChange={e=>setModeFilter(e.target.value)}>
          <option value="">All modes</option>{JOURNAL_MODES.map(m => <option key={m.id} value={m.id}>{m.icon} {m.label}</option>)}
        </select>
      </div>

      {isLoading ? <div className="space-y-3 pt-4">{[...Array(3)].map((_,i)=><div key={i} className="h-32 bg-muted animate-pulse rounded-2xl" />)}</div> :
       entries.length === 0 ? (
        <div className="text-center py-20 px-4 border-2 border-dashed border-border rounded-3xl bg-muted/30 mt-4">
          <span className="text-5xl drop-shadow-md block mb-4">📓</span>
          <p className="text-base font-bold text-foreground mb-1">No entries yet</p>
          <p className="text-sm text-muted-foreground">Start writing — even a few lines is muhasabah</p>
        </div>
      ) : (
        <div className="space-y-4 pt-2">
          {entries.map(entry => {
            const isEnc = entry.is_encrypted
            const showContent = isEnc ? (decryptedContent[entry.id] || null) : entry.content
            const modeItem = modeObj(entry.journal_mode)
            
            return (
              <div key={entry.id} className="rounded-2xl border border-border bg-card overflow-hidden hover:shadow-md transition-shadow">
                <div className="p-5">
                  <div className="flex items-center justify-between mb-4 border-b border-border/50 pb-3">
                    <div className="flex items-center gap-2">
                      <span className={cn("px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5", modeItem?.colorClass.split(' ').slice(0,2).join(' '))}>
                        <span className="text-xs">{modeItem?.icon}</span> {modeItem?.label}
                      </span>
                      {entry.mood && <span className="text-xl" title={entry.mood}>{moodEmoji(entry.mood)}</span>}
                      {isEnc && <Lock className="h-4 w-4 text-primary ml-1" />}
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">{format(new Date(entry.entry_date), 'MMM d, yyyy')}</span>
                      <button onClick={() => deleteEntry(entry.id)} className="p-1.5 rounded-md text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"><Trash2 className="h-3.5 w-3.5" /></button>
                    </div>
                  </div>
                  {entry.title && <p className="font-bold text-base text-foreground mb-2">{entry.title}</p>}
                  {isEnc && !showContent ? (
                    <div className="flex items-center justify-between p-3 rounded-xl bg-muted border border-border mt-2">
                      <p className="text-xs font-medium text-muted-foreground flex items-center gap-2"><Lock className="h-3 w-3" /> Encrypted Content</p>
                      <Button variant="outline" size="sm" onClick={() => handleDecrypt(entry)} className="h-8 text-xs font-bold text-primary border-primary hover:bg-primary/10">Decrypt</Button>
                    </div>
                  ) : (
                    <p className="text-sm text-foreground leading-relaxed font-medium whitespace-pre-wrap">{showContent}</p>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

function JournalPage() {
  const [tab, setTab] = useState('write')
  const ctx = getIslamicContext()

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 md:py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Journal</h1>
          <p className="text-sm font-medium text-gold mt-0.5">{ctx.formatted}</p>
        </div>
        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
          <Lock className="h-5 w-5 text-primary" />
        </div>
      </div>

      <div className="flex overflow-x-auto p-1 rounded-xl bg-muted gap-1 scrollbar-none">
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={cn('flex-1 min-w-[80px] px-3 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap', tab === t ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground')}>
            {TAB_LABELS[t]}
          </button>
        ))}
      </div>

      <div className="pt-2">
        {tab === 'write'     && <WriteTab />}
        {tab === 'entries'   && <EntriesTab />}
        {tab === 'insights'  && <div className="text-center p-12 text-muted-foreground bg-card border rounded-2xl">Insights (View-Only Mode) — Needs 14 days of data</div>}
        {tab === 'analytics' && <div className="text-center p-12 text-muted-foreground bg-card border rounded-2xl">Stats Dashboard View</div>}
        {tab === 'letters'   && <div className="text-center p-12 text-muted-foreground bg-card border rounded-2xl">Monthly Letters View</div>}
      </div>
    </div>
  )
}
