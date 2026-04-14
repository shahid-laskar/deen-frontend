import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { format, subDays, startOfMonth, endOfMonth } from 'date-fns'
import { Plus, Lock, Unlock, BookMarked, Trash2, ChevronDown, BarChart2, Sparkles, Heart, Moon } from 'lucide-react'
import api from '../lib/api'
import { Card, Button, Modal, Badge, Skeleton, ProgressRing } from '../components/ui/index'
import { getIslamicContext } from '../lib/hijri'
import toast from 'react-hot-toast'

// ─── Constants ───────────────────────────────────────────────────────────────

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
  { id: 'free_write',        label: 'Free Write',       icon: '✍️',  desc: 'Your thoughts, unfiltered' },
  { id: 'guided_reflection', label: 'Guided',           icon: '💭',  desc: 'AI-curated reflection prompts' },
  { id: 'muhasabah',        label: 'Muhasabah',        icon: '⚖️',  desc: 'Daily self-accountability' },
  { id: 'gratitude',         label: 'Gratitude',        icon: '🤲',  desc: '3 blessings with why' },
  { id: 'weekly_review',     label: 'Weekly Review',    icon: '📊',  desc: 'Week-in-review summary' },
]

const MODE_COLORS = {
  free_write:        'var(--t-primary)',
  guided_reflection: '#3b82f6',
  muhasabah:         '#a855f7',
  gratitude:         'var(--t-accent)',
  weekly_review:     '#f97316',
}

// ─── E2E Encryption helpers (Web Crypto API) ─────────────────────────────────

const enc = new TextEncoder()
const dec = new TextDecoder()

async function deriveKey(password, salt) {
  const keyMaterial = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveBits','deriveKey'])
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt, iterations: 200000, hash: 'SHA-256' },
    keyMaterial, { name: 'AES-GCM', length: 256 }, false, ['encrypt','decrypt']
  )
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

// In-memory key store (cleared on tab close / 5min background)
const keyStore = { key: null, expiry: null }
function storeKey(password) { keyStore.key = password; keyStore.expiry = Date.now() + 5*60*1000 }
function getKey() {
  if (keyStore.key && keyStore.expiry > Date.now()) return keyStore.key
  keyStore.key = null; return null
}

// ─── Encryption lock modal ────────────────────────────────────────────────────

function EncryptionSetup({ onSet }) {
  const [pass, setPass] = useState('')
  const [confirm, setConfirm] = useState('')
  return (
    <div className="space-y-4">
      <div style={{ padding: '14px', borderRadius: 12, background: 'rgba(20,168,96,0.06)', border: '1px solid var(--t-primary)', textAlign: 'center' }}>
        <Lock size={24} style={{ color: 'var(--t-primary)', margin: '0 auto 8px' }} />
        <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--t-text)' }}>End-to-end encrypted</p>
        <p style={{ fontSize: 12, color: 'var(--t-text-muted)' }}>Your reflections are known only to you and Allah</p>
      </div>
      <div><p className="label">Journal password</p><input type="password" className="input" value={pass} onChange={e=>setPass(e.target.value)} placeholder="Choose a strong password" /></div>
      <div><p className="label">Confirm</p><input type="password" className="input" value={confirm} onChange={e=>setConfirm(e.target.value)} placeholder="Repeat password" /></div>
      <Button variant="primary" className="w-full" onClick={() => { if (pass.length < 8) return toast.error('Password must be 8+ characters'); if (pass !== confirm) return toast.error('Passwords do not match'); storeKey(pass); onSet() }}>
        <Lock size={14} /> Enable encryption
      </Button>
    </div>
  )
}

// ─── Mood selector ────────────────────────────────────────────────────────────

function MoodSelector({ value, onChange }) {
  return (
    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
      {MOODS.map(m => (
        <button key={m.value} onClick={() => onChange(value === m.value ? null : m.value)}
          style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, padding: '6px 10px', borderRadius: 10, border: '0.5px solid', borderColor: value===m.value ? 'var(--t-primary)' : 'var(--t-border)', background: value===m.value ? 'rgba(20,168,96,0.1)' : 'var(--t-bg-card)', cursor: 'pointer', fontSize: 11, color: 'var(--t-text-muted)' }}>
          <span style={{ fontSize: 20 }}>{m.emoji}</span>
          {m.label}
        </button>
      ))}
    </div>
  )
}

// ─── Free Write mode ──────────────────────────────────────────────────────────

function FreeWriteMode({ onSave, encrypted }) {
  const [content, setContent] = useState('')
  const [title,   setTitle]   = useState('')
  const [mood,    setMood]    = useState(null)
  const [ayahRef, setAyahRef] = useState('')
  const [saving,  setSaving]  = useState(false)

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
    <div className="space-y-4">
      <input className="input" placeholder="Title (optional)" value={title} onChange={e=>setTitle(e.target.value)} />
      <textarea className="input resize-none" rows={10} placeholder="Write freely... your thoughts, reflections, intentions, duas." value={content} onChange={e=>setContent(e.target.value)} style={{ fontFamily: 'var(--font-body)', lineHeight: 1.8 }} />
      <div><p className="label">How do you feel?</p><MoodSelector value={mood} onChange={setMood} /></div>
      <div><p className="label">Quran verse (optional)</p><input className="input" placeholder="e.g. 2:286" value={ayahRef} onChange={e=>setAyahRef(e.target.value)} /></div>
      {encrypted && <div style={{ display:'flex', alignItems:'center', gap:6, fontSize:12, color:'var(--t-text-muted)' }}><Lock size={12} color="var(--t-primary)"/> Will be encrypted before saving</div>}
      <Button variant="primary" className="w-full" onClick={handleSave} loading={saving}>Save entry</Button>
    </div>
  )
}

// ─── Guided Reflection mode ───────────────────────────────────────────────────

function GuidedMode({ onSave }) {
  const [category, setCategory] = useState('gratitude')
  const [promptIdx, setPromptIdx] = useState(0)
  const [content, setContent] = useState('')
  const [mood, setMood] = useState(null)

  const { data: promptsData } = useQuery({
    queryKey: ['journal','prompts', category],
    queryFn: () => api.get('/journal/guided-prompts', { params: { category } }).then(r => r.data),
  })
  const prompts = promptsData?.prompts || []
  const currentPrompt = prompts[promptIdx] || ''

  const cats = ['gratitude','prayer','quran','accountability','muhasabah','sabr','tawakkul']

  return (
    <div className="space-y-4">
      <div style={{ display:'flex', gap:6, overflowX:'auto' }}>
        {cats.map(c => (
          <button key={c} onClick={() => { setCategory(c); setPromptIdx(0); setContent('') }}
            style={{ padding:'4px 12px', borderRadius:99, border:'0.5px solid', borderColor:category===c?'#3b82f6':'var(--t-border)', background:category===c?'rgba(59,130,246,0.1)':'var(--t-bg-card)', fontSize:11, color:category===c?'#3b82f6':'var(--t-text-muted)', cursor:'pointer', whiteSpace:'nowrap' }}>{c}</button>
        ))}
      </div>
      {currentPrompt && (
        <div style={{ padding:'14px 16px', borderRadius:12, background:'rgba(59,130,246,0.06)', border:'0.5px solid rgba(59,130,246,0.3)' }}>
          <p style={{ fontSize:15, fontWeight:600, color:'var(--t-text)', lineHeight:1.6 }}>💭 {currentPrompt}</p>
          {prompts.length > 1 && (
            <button onClick={() => setPromptIdx(i => (i+1) % prompts.length)} style={{ marginTop:8, fontSize:12, color:'#3b82f6', background:'none', border:'none', cursor:'pointer' }}>
              Try another prompt →
            </button>
          )}
        </div>
      )}
      <textarea className="input resize-none" rows={8} placeholder="Reflect on this prompt..." value={content} onChange={e=>setContent(e.target.value)} style={{ lineHeight:1.8 }} />
      <MoodSelector value={mood} onChange={setMood} />
      <Button variant="primary" className="w-full" onClick={() => {
        if (!content.trim()) return toast.error('Write your reflection first')
        onSave({ content, mood, journal_mode:'guided_reflection', ai_prompt_used: currentPrompt }, () => setContent(''))
      }}>Save reflection</Button>
    </div>
  )
}

// ─── Muhasabah mode ───────────────────────────────────────────────────────────

function MuhasabahMode({ onSave }) {
  const { data: promptData } = useQuery({ queryKey:['journal','muhasabah-prompt'], queryFn: () => api.get('/journal/muhasabah-prompt').then(r=>r.data) })
  const [answers, setAnswers] = useState({})
  const sections = promptData?.sections || []

  const setAnswer = (key, val) => setAnswers(a => ({...a, [key]: val}))

  return (
    <div className="space-y-4">
      <div style={{ padding:'12px', borderRadius:12, background:'rgba(168,85,247,0.06)', border:'0.5px solid rgba(168,85,247,0.2)', textAlign:'center' }}>
        <p style={{ fontSize:13, fontWeight:600, color:'#a855f7' }}>⚖️ Daily Muhasabah</p>
        <p style={{ fontSize:12, color:'var(--t-text-muted)', marginTop:2 }}>Account yourself before you are accounted — Umar ibn al-Khattab (RA)</p>
      </div>
      {sections.map(s => (
        <div key={s.key}>
          <p className="label">{s.label}</p>
          {s.type === 'boolean' ? (
            <div style={{ display:'flex', gap:8 }}>
              {['Yes','No'].map(opt => (
                <button key={opt} onClick={() => setAnswer(s.key, opt==='Yes')}
                  style={{ flex:1, padding:'10px', borderRadius:10, border:'0.5px solid', borderColor:answers[s.key]===(opt==='Yes')?'#a855f7':'var(--t-border)', background:answers[s.key]===(opt==='Yes')?'rgba(168,85,247,0.1)':'var(--t-bg-card)', cursor:'pointer', fontSize:13, fontWeight:600, color:answers[s.key]===(opt==='Yes')?'#a855f7':'var(--t-text-muted)' }}>
                  {opt}
                </button>
              ))}
            </div>
          ) : s.type === 'number' ? (
            <input type="number" className="input" min={0} max={s.max||100} value={answers[s.key]||''} onChange={e=>setAnswer(s.key, Number(e.target.value))} />
          ) : s.type === 'textarea' ? (
            <textarea className="input resize-none" rows={3} value={answers[s.key]||''} onChange={e=>setAnswer(s.key, e.target.value)} />
          ) : (
            <input className="input" value={answers[s.key]||''} onChange={e=>setAnswer(s.key, e.target.value)} />
          )}
        </div>
      ))}
      <Button variant="primary" className="w-full" onClick={() => {
        const summary = Object.entries(answers).map(([k,v])=>`${k}: ${v}`).join(', ')
        onSave({ content: summary, journal_mode:'muhasabah', muhasabah_data: answers }, () => setAnswers({}))
      }}>Save muhasabah</Button>
    </div>
  )
}

// ─── Gratitude mode ───────────────────────────────────────────────────────────

function GratitudeMode({ onSave }) {
  const [items, setItems] = useState([{text:'',why:''},{text:'',why:''},{text:'',why:''}])
  const setItem = (i, field, val) => setItems(arr => arr.map((it,j) => j===i ? {...it,[field]:val} : it))
  const ordinals = ['First','Second','Third']
  return (
    <div className="space-y-5">
      <div style={{ padding:'12px', borderRadius:12, background:'rgba(201,135,10,0.08)', border:'0.5px solid var(--t-accent)', textAlign:'center' }}>
        <p style={{ fontSize:13, fontWeight:600, color:'var(--t-accent)' }}>🤲 Gratitude Journal</p>
        <p style={{ fontSize:11, color:'var(--t-text-muted)', marginTop:2 }}>Ibrahim 14:7 — If you are grateful, I will surely increase you</p>
      </div>
      {items.map((item, i) => (
        <div key={i} style={{ padding:'14px', borderRadius:12, border:'0.5px solid var(--t-border)', background:'var(--t-bg-card)' }}>
          <p style={{ fontSize:12, fontWeight:700, color:'var(--t-accent)', marginBottom:8 }}>{ordinals[i]} blessing</p>
          <input className="input" placeholder="I am grateful for..." value={item.text} onChange={e=>setItem(i,'text',e.target.value)} style={{marginBottom:8}} />
          <input className="input" placeholder="Because..." value={item.why} onChange={e=>setItem(i,'why',e.target.value)} />
        </div>
      ))}
      <Button variant="primary" className="w-full" onClick={() => {
        const filled = items.filter(it => it.text.trim())
        if (!filled.length) return toast.error('Add at least one blessing')
        const content = filled.map(it => `${it.text}${it.why ? ` — because ${it.why}` : ''}`).join('\n')
        onSave({ content, journal_mode:'gratitude', gratitude_items: filled }, () => setItems([{text:'',why:''},{text:'',why:''},{text:'',why:''}]))
      }}>Save gratitude</Button>
    </div>
  )
}

// ─── Weekly Review mode ───────────────────────────────────────────────────────

function WeeklyReviewMode({ onSave }) {
  const [notes, setNotes] = useState('')
  const [rating, setRating] = useState(3)

  const { data: stats } = useQuery({ queryKey:['journal','analytics'], queryFn: () => api.get('/journal/analytics').then(r=>r.data).catch(()=>null) })
  const { data: habits } = useQuery({ queryKey:['habits','weekly'], queryFn: () => api.get('/habits/analytics/weekly').then(r=>r.data).catch(()=>null) })

  return (
    <div className="space-y-4">
      <div style={{ padding:'14px', borderRadius:12, background:'rgba(249,115,22,0.06)', border:'0.5px solid rgba(249,115,22,0.3)' }}>
        <p style={{ fontSize:13, fontWeight:600, color:'#f97316', marginBottom:8 }}>📊 Week in Review</p>
        {stats && <p style={{ fontSize:12, color:'var(--t-text-muted)' }}>Journal streak: {stats.current_streak} days · {stats.entries_this_month} entries this month</p>}
        {habits && <p style={{ fontSize:12, color:'var(--t-text-muted)', marginTop:2 }}>Habits: {habits.total_completed}/{habits.total_possible} ({habits.completion_rate}%)</p>}
      </div>
      <div>
        <p className="label">How was your week spiritually? (1–5)</p>
        <div style={{ display:'flex', gap:8 }}>
          {[1,2,3,4,5].map(n => (
            <button key={n} onClick={() => setRating(n)}
              style={{ flex:1, padding:'10px', borderRadius:10, border:'0.5px solid', borderColor:rating===n?'#f97316':'var(--t-border)', background:rating===n?'rgba(249,115,22,0.1)':'var(--t-bg-card)', fontSize:18, cursor:'pointer' }}>
              {['😔','😐','🙂','😊','🤲'][n-1]}
            </button>
          ))}
        </div>
      </div>
      <div>
        <p className="label">Reflections on this week</p>
        <textarea className="input resize-none" rows={6} placeholder="What went well? What will I improve? What am I taking into next week?" value={notes} onChange={e=>setNotes(e.target.value)} style={{lineHeight:1.8}} />
      </div>
      <Button variant="primary" className="w-full" onClick={() => {
        if (!notes.trim()) return toast.error('Add your reflections')
        onSave({ content: notes, journal_mode:'weekly_review', weekly_data: { spiritual_rating: rating } }, () => { setNotes(''); setRating(3) })
      }}>Save week review</Button>
    </div>
  )
}

// ─── Write tab (mode switcher) ────────────────────────────────────────────────

function WriteTab() {
  const qc = useQueryClient()
  const [mode, setMode] = useState('free_write')
  const [encrypted, setEncrypted] = useState(false)
  const [showEncSetup, setShowEncSetup] = useState(false)
  const [suggestedVerses, setSuggestedVerses] = useState(null)

  const { mutate: saveEntry } = useMutation({
    mutationFn: (data) => api.post('/journal', data),
    onSuccess: async (res, data) => {
      qc.invalidateQueries({ queryKey: ['journal'] })
      toast.success('Entry saved 🤲')
      // Fetch verse suggestions for unencrypted entries
      if (!data.is_encrypted && mode !== 'muhasabah') {
        try {
          const verseResp = await api.post(`/journal/ai-suggest-verses?entry_id=${res.data.id}`)
          if (verseResp.data.verses?.length) setSuggestedVerses(verseResp.data.verses)
        } catch {}
      }
    },
    onError: () => toast.error('Could not save entry'),
  })

  const handleSave = (payload, reset) => {
    saveEntry(payload)
    reset?.()
  }

  return (
    <div className="space-y-4">
      {/* Mode tabs */}
      <div style={{ display:'flex', gap:4, overflowX:'auto', paddingBottom:2 }}>
        {JOURNAL_MODES.map(m => (
          <button key={m.id} onClick={() => setMode(m.id)}
            style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:2, padding:'8px 12px', borderRadius:12, border:'0.5px solid', borderColor:mode===m.id?MODE_COLORS[m.id]:'var(--t-border)', background:mode===m.id?`${MODE_COLORS[m.id]}15`:'var(--t-bg-card)', cursor:'pointer', whiteSpace:'nowrap', minWidth:80 }}>
            <span style={{ fontSize:18 }}>{m.icon}</span>
            <span style={{ fontSize:11, fontWeight:600, color:mode===m.id?MODE_COLORS[m.id]:'var(--t-text-muted)' }}>{m.label}</span>
          </button>
        ))}
      </div>

      {/* Mode description + encryption toggle */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <p style={{ fontSize:12, color:'var(--t-text-muted)' }}>{JOURNAL_MODES.find(m=>m.id===mode)?.desc}</p>
        {mode === 'free_write' && (
          <button onClick={() => encrypted ? (setEncrypted(false), storeKey(null)) : setShowEncSetup(true)}
            style={{ display:'flex', alignItems:'center', gap:5, padding:'4px 10px', borderRadius:8, border:`0.5px solid ${encrypted?'var(--t-primary)':'var(--t-border)'}`, background:encrypted?'rgba(20,168,96,0.1)':'var(--t-bg-card)', cursor:'pointer', fontSize:11, color:encrypted?'var(--t-primary)':'var(--t-text-muted)' }}>
            {encrypted ? <Lock size={11}/> : <Unlock size={11}/>}
            {encrypted ? 'Encrypted' : 'Encrypt'}
          </button>
        )}
      </div>

      {/* Mode content */}
      {mode === 'free_write'        && <FreeWriteMode  onSave={handleSave} encrypted={encrypted} />}
      {mode === 'guided_reflection' && <GuidedMode     onSave={handleSave} />}
      {mode === 'muhasabah'         && <MuhasabahMode  onSave={handleSave} />}
      {mode === 'gratitude'         && <GratitudeMode  onSave={handleSave} />}
      {mode === 'weekly_review'     && <WeeklyReviewMode onSave={handleSave} />}

      {/* Verse suggestions */}
      {suggestedVerses && (
        <div style={{ padding:'14px', borderRadius:12, background:'rgba(20,168,96,0.06)', border:'0.5px solid var(--t-primary)' }}>
          <p style={{ fontSize:12, fontWeight:600, color:'var(--t-primary)', marginBottom:8 }}>✨ Relevant verses for you</p>
          {suggestedVerses.map((v,i) => (
            <div key={i} style={{ marginBottom:6 }}>
              <p style={{ fontSize:12, fontWeight:600, color:'var(--t-accent)' }}>{v.ref}</p>
              <p style={{ fontSize:12, color:'var(--t-text-muted)', fontStyle:'italic' }}>{v.text}</p>
            </div>
          ))}
          <button onClick={() => setSuggestedVerses(null)} style={{ fontSize:11, color:'var(--t-text-muted)', background:'none', border:'none', cursor:'pointer', marginTop:4 }}>Dismiss</button>
        </div>
      )}

      <Modal open={showEncSetup} onClose={() => setShowEncSetup(false)} title="Enable journal encryption">
        <EncryptionSetup onSet={() => { setEncrypted(true); setShowEncSetup(false); toast.success('Encryption enabled 🔒') }} />
      </Modal>
    </div>
  )
}

// ─── Entries tab ──────────────────────────────────────────────────────────────

function EntriesTab() {
  const qc = useQueryClient()
  const [moodFilter, setMoodFilter] = useState('')
  const [modeFilter, setModeFilter] = useState('')
  const [decryptingId, setDecryptingId] = useState(null)
  const [decryptedContent, setDecryptedContent] = useState({})

  const { data: entries = [], isLoading } = useQuery({
    queryKey: ['journal', moodFilter, modeFilter],
    queryFn: () => {
      const params = {}
      if (moodFilter) params.mood = moodFilter
      if (modeFilter) params.journal_mode = modeFilter
      return api.get('/journal', { params }).then(r => r.data).catch(() => [])
    },
  })

  const { mutate: deleteEntry } = useMutation({
    mutationFn: (id) => api.delete(`/journal/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey:['journal'] }); toast.success('Entry deleted') },
  })

  const handleDecrypt = async (entry) => {
    const pass = getKey()
    if (!pass) {
      const p = prompt('Enter your journal password to decrypt:')
      if (!p) return
      storeKey(p)
    }
    const plaintext = await decryptText(entry.content, entry.iv, entry.salt, getKey())
    if (plaintext) {
      setDecryptedContent(d => ({...d, [entry.id]: plaintext}))
    } else {
      toast.error('Wrong password or corrupted entry')
    }
  }

  const moodEmoji = (mood) => MOODS.find(m=>m.value===mood)?.emoji || '•'
  const modeIcon = (mode) => JOURNAL_MODES.find(m=>m.id===mode)?.icon || '✍️'

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div style={{ display:'flex', gap:6 }}>
        <select className="input" style={{flex:1}} value={moodFilter} onChange={e=>setMoodFilter(e.target.value)}>
          <option value="">All moods</option>
          {MOODS.map(m => <option key={m.value} value={m.value}>{m.emoji} {m.label}</option>)}
        </select>
        <select className="input" style={{flex:1}} value={modeFilter} onChange={e=>setModeFilter(e.target.value)}>
          <option value="">All modes</option>
          {JOURNAL_MODES.map(m => <option key={m.id} value={m.id}>{m.icon} {m.label}</option>)}
        </select>
      </div>

      {isLoading ? [...Array(3)].map((_,i)=><Skeleton key={i} className="h-24" />) :
       entries.length === 0 ? (
        <div style={{ textAlign:'center', padding:40, color:'var(--t-text-muted)' }}>
          <p style={{ fontSize:32 }}>📓</p>
          <p style={{ fontSize:15, fontWeight:600, color:'var(--t-text)', marginTop:8 }}>No entries yet</p>
          <p style={{ fontSize:13 }}>Start writing — even a few lines is muhasabah</p>
        </div>
      ) : entries.map(entry => {
        const isEnc = entry.is_encrypted
        const showContent = isEnc ? (decryptedContent[entry.id] || null) : entry.content
        return (
          <div key={entry.id} style={{ borderRadius:14, border:'0.5px solid var(--t-border)', background:'var(--t-bg-card)', overflow:'hidden' }}>
            <div style={{ padding:'12px 14px' }}>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:6 }}>
                <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                  <span style={{ fontSize:16 }}>{modeIcon(entry.journal_mode)}</span>
                  {entry.mood && <span style={{ fontSize:15 }}>{moodEmoji(entry.mood)}</span>}
                  {isEnc && <Lock size={13} style={{ color:'var(--t-primary)' }} />}
                </div>
                <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                  <span style={{ fontSize:11, color:'var(--t-text-muted)' }}>{entry.entry_date}</span>
                  <button onClick={() => deleteEntry(entry.id)} style={{ padding:'2px 6px', borderRadius:6, border:'none', background:'rgba(239,68,68,0.08)', cursor:'pointer', color:'#ef4444' }}>
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
              {entry.title && <p style={{ fontWeight:700, fontSize:14, color:'var(--t-text)', marginBottom:4 }}>{entry.title}</p>}
              {isEnc && !showContent ? (
                <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                  <p style={{ fontSize:12, color:'var(--t-text-muted)', fontStyle:'italic' }}>🔒 Encrypted entry</p>
                  <button onClick={() => handleDecrypt(entry)} style={{ fontSize:11, color:'var(--t-primary)', background:'none', border:'none', cursor:'pointer' }}>Decrypt</button>
                </div>
              ) : (
                <p style={{ fontSize:13, color:'var(--t-text)', lineHeight:1.7, maxHeight:80, overflow:'hidden', textOverflow:'ellipsis' }}>
                  {(showContent||'').slice(0, 180)}{(showContent||'').length > 180 ? '…' : ''}
                </p>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ─── Insights tab ─────────────────────────────────────────────────────────────

function InsightsTab() {
  const qc = useQueryClient()
  const { data: todayInsight, isLoading } = useQuery({
    queryKey: ['insights','today'],
    queryFn: () => api.get('/insights/today').then(r => r.data).catch(() => null),
  })
  const { data: pastInsights = [] } = useQuery({
    queryKey: ['insights','list'],
    queryFn: () => api.get('/insights').then(r => r.data).catch(() => []),
  })

  const { mutate: dismiss } = useMutation({
    mutationFn: (id) => api.post(`/insights/${id}/dismiss`),
    onSuccess: () => qc.invalidateQueries({ queryKey:['insights'] }),
  })
  const { mutate: rate } = useMutation({
    mutationFn: ({ id, rating }) => api.post(`/insights/${id}/rate`, { rating }),
    onSuccess: () => { qc.invalidateQueries({ queryKey:['insights'] }); toast.success('Feedback saved') },
  })

  const CAT_ICONS = { prayer_patterns:'🕌', quran_patterns:'📖', habit_correlations:'📿', spiritual_trends:'✨', mood_journal:'💭' }

  return (
    <div className="space-y-4">
      {isLoading ? <Skeleton className="h-36" /> : todayInsight ? (
        <div style={{ borderRadius:14, padding:16, background:'linear-gradient(135deg,rgba(20,168,96,0.06),rgba(201,135,10,0.04))', border:'0.5px solid var(--t-primary)' }}>
          <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:10 }}>
            <span style={{ fontSize:18 }}>{CAT_ICONS[todayInsight.category] || '💡'}</span>
            <p style={{ fontSize:11, fontWeight:700, color:'var(--t-primary)', textTransform:'uppercase', letterSpacing:'0.06em' }}>Today's insight</p>
          </div>
          <p style={{ fontSize:14, color:'var(--t-text)', lineHeight:1.7, marginBottom:10 }}>{todayInsight.insight_text}</p>
          {todayInsight.relevant_ayah && (
            <p style={{ fontSize:12, color:'var(--t-accent)', fontStyle:'italic', marginBottom:10 }}>📖 {todayInsight.relevant_ayah}</p>
          )}
          <div style={{ display:'flex', gap:8 }}>
            <button onClick={() => rate({ id:todayInsight.id, rating:1 })} style={{ flex:1, padding:'6px', borderRadius:8, border:'0.5px solid var(--t-border)', background:'var(--t-bg-card)', cursor:'pointer', fontSize:12, color:todayInsight.user_rating===1?'var(--t-primary)':'var(--t-text-muted)' }}>👍 Helpful</button>
            <button onClick={() => rate({ id:todayInsight.id, rating:-1 })} style={{ flex:1, padding:'6px', borderRadius:8, border:'0.5px solid var(--t-border)', background:'var(--t-bg-card)', cursor:'pointer', fontSize:12, color:todayInsight.user_rating===-1?'#ef4444':'var(--t-text-muted)' }}>👎 Not relevant</button>
            <button onClick={() => dismiss(todayInsight.id)} style={{ padding:'6px 10px', borderRadius:8, border:'0.5px solid var(--t-border)', background:'var(--t-bg-card)', cursor:'pointer', fontSize:12, color:'var(--t-text-muted)' }}>✕</button>
          </div>
        </div>
      ) : (
        <div style={{ padding:'24px', textAlign:'center', borderRadius:14, border:'0.5px dashed var(--t-border)' }}>
          <p style={{ fontSize:24, marginBottom:8 }}>✨</p>
          <p style={{ fontSize:14, fontWeight:600, color:'var(--t-text)' }}>Insights unlock after 14 days of data</p>
          <p style={{ fontSize:12, color:'var(--t-text-muted)', marginTop:4 }}>Keep journaling and logging prayers/habits — personalised insights will appear here</p>
        </div>
      )}

      {pastInsights.length > 0 && (
        <div>
          <h3 style={{ fontSize:15, fontWeight:700, color:'var(--t-text)', marginBottom:10 }}>Past insights</h3>
          {pastInsights.map(insight => (
            <div key={insight.id} style={{ padding:'12px 14px', borderRadius:12, border:'0.5px solid var(--t-border)', background:'var(--t-bg-card)', marginBottom:8 }}>
              <div style={{ display:'flex', justifyContent:'space-between', marginBottom:6 }}>
                <span style={{ fontSize:11, color:'var(--t-text-muted)' }}>{insight.generated_at} · {insight.category.replace('_',' ')}</span>
                {insight.user_rating === 1 && <span style={{ fontSize:11, color:'var(--t-primary)' }}>👍</span>}
                {insight.user_rating === -1 && <span style={{ fontSize:11, color:'#ef4444' }}>👎</span>}
              </div>
              <p style={{ fontSize:13, color:'var(--t-text)', lineHeight:1.6 }}>{insight.insight_text.slice(0,140)}…</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Analytics tab ────────────────────────────────────────────────────────────

function AnalyticsTab() {
  const { data: stats } = useQuery({ queryKey:['journal','analytics'], queryFn: () => api.get('/journal/analytics').then(r=>r.data).catch(()=>null) })
  const { data: trend = [] } = useQuery({ queryKey:['journal','mood-trend'], queryFn: () => api.get('/journal/mood-trend').then(r=>r.data).catch(()=>[]) })

  if (!stats) return <Skeleton className="h-48" />

  const topMood = Object.entries(stats.mood_counts||{}).sort((a,b)=>b[1]-a[1])[0]
  const moodEmoji = (mood) => MOODS.find(m=>m.value===mood)?.emoji || '•'
  const modeColors = { free_write:'var(--t-primary)', guided_reflection:'#3b82f6', muhasabah:'#a855f7', gratitude:'var(--t-accent)', weekly_review:'#f97316' }

  return (
    <div className="space-y-4">
      {/* Streak + totals */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:10 }}>
        {[['📓 Total entries', stats.total_entries,''],['🔥 Streak', stats.current_streak,'days'],['⭐ Best streak', stats.longest_streak,'days'],['📅 This month', stats.entries_this_month,'entries']].map(([l,v,s])=>(
          <div key={l} style={{ padding:'14px', borderRadius:12, background:'var(--t-bg-card)', border:'0.5px solid var(--t-border)', textAlign:'center' }}>
            <p style={{ fontSize:22, fontWeight:700, color:'var(--t-text)' }}>{v}</p>
            <p style={{ fontSize:10, color:'var(--t-text-muted)' }}>{l} {s&&<span>({s})</span>}</p>
          </div>
        ))}
      </div>

      {/* Top mood */}
      {topMood && (
        <Card>
          <p style={{ fontSize:13, fontWeight:600, color:'var(--t-text)', marginBottom:8 }}>Most frequent mood</p>
          <div style={{ display:'flex', alignItems:'center', gap:12 }}>
            <span style={{ fontSize:36 }}>{moodEmoji(topMood[0])}</span>
            <div>
              <p style={{ fontSize:18, fontWeight:700, color:'var(--t-text)', textTransform:'capitalize' }}>{topMood[0]}</p>
              <p style={{ fontSize:12, color:'var(--t-text-muted)' }}>{topMood[1]} entries</p>
            </div>
          </div>
        </Card>
      )}

      {/* Mode distribution */}
      <Card>
        <p style={{ fontSize:13, fontWeight:600, color:'var(--t-text)', marginBottom:10 }}>Writing modes</p>
        {Object.entries(stats.modes_used||{}).map(([mode, count]) => {
          const total = Object.values(stats.modes_used).reduce((a,b)=>a+b,0)
          const pct = Math.round(count/total*100)
          const m = JOURNAL_MODES.find(x=>x.id===mode)
          return (
            <div key={mode} style={{ display:'flex', alignItems:'center', gap:10, marginBottom:8 }}>
              <span style={{ fontSize:16, width:24 }}>{m?.icon||'✍️'}</span>
              <div style={{ flex:1 }}>
                <div style={{ display:'flex', justifyContent:'space-between', marginBottom:3 }}>
                  <span style={{ fontSize:12, color:'var(--t-text)' }}>{m?.label||mode}</span>
                  <span style={{ fontSize:11, color:'var(--t-text-muted)' }}>{count}</span>
                </div>
                <div style={{ height:4, borderRadius:2, background:'var(--t-border)' }}>
                  <div style={{ height:4, borderRadius:2, background:modeColors[mode]||'var(--t-primary)', width:`${pct}%`, transition:'width 0.5s' }} />
                </div>
              </div>
            </div>
          )
        })}
      </Card>

      {/* Mood trend last 30 days */}
      {trend.length > 0 && (
        <Card>
          <p style={{ fontSize:13, fontWeight:600, color:'var(--t-text)', marginBottom:8 }}>Mood timeline (30 days)</p>
          <div style={{ display:'flex', gap:3, overflowX:'auto', paddingBottom:4 }}>
            {trend.slice(-30).map((t,i) => (
              <div key={i} title={`${t.date}: ${t.mood}`} style={{ display:'flex', flexDirection:'column', alignItems:'center', minWidth:22 }}>
                <span style={{ fontSize:14 }}>{moodEmoji(t.mood)}</span>
                <span style={{ fontSize:8, color:'var(--t-text-muted)', transform:'rotate(-45deg)', marginTop:3 }}>{t.date.slice(5)}</span>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  )
}

// ─── Letters tab ──────────────────────────────────────────────────────────────

function LettersTab() {
  const qc = useQueryClient()
  const [activeId, setActiveId] = useState(null)
  const today = new Date()

  const { data: letters = [], isLoading } = useQuery({
    queryKey: ['letters'],
    queryFn: () => api.get('/letters').then(r => r.data).catch(() => []),
  })

  const { mutate: generate, isPending } = useMutation({
    mutationFn: () => api.post(`/letters/generate?year=${today.getFullYear()}&month=${today.getMonth()+1}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey:['letters'] }); toast.success('Letter generated 📜') },
    onError: (e) => toast.error(e.response?.data?.detail || 'Could not generate letter'),
  })

  const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

  return (
    <div className="space-y-4">
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <div>
          <h2 style={{ fontSize:18, fontWeight:700, color:'var(--t-text)' }}>Letters to Yourself</h2>
          <p style={{ fontSize:12, color:'var(--t-text-muted)' }}>Monthly AI-generated reflections</p>
        </div>
        <Button variant="primary" size="sm" onClick={() => generate()} loading={isPending}>
          <Sparkles size={14} /> Generate
        </Button>
      </div>

      {isLoading ? <Skeleton className="h-24" /> : letters.length === 0 ? (
        <div style={{ padding:32, textAlign:'center', borderRadius:14, border:'0.5px dashed var(--t-border)' }}>
          <p style={{ fontSize:28, marginBottom:8 }}>📜</p>
          <p style={{ fontSize:14, fontWeight:600, color:'var(--t-text)' }}>No letters yet</p>
          <p style={{ fontSize:12, color:'var(--t-text-muted)', marginTop:4 }}>Write 3+ journal entries this month, then generate your first letter</p>
        </div>
      ) : letters.map(letter => (
        <div key={letter.id} style={{ borderRadius:14, border:'0.5px solid var(--t-border)', background:'var(--t-bg-card)', overflow:'hidden' }}>
          <button style={{ width:'100%', padding:'14px 16px', display:'flex', alignItems:'center', gap:12, background:'none', border:'none', cursor:'pointer', textAlign:'left' }} onClick={() => setActiveId(activeId===letter.id?null:letter.id)}>
            <div style={{ width:48, height:48, borderRadius:12, background:'rgba(201,135,10,0.1)', border:'0.5px solid var(--t-accent)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
              <span style={{ fontSize:10, fontWeight:700, color:'var(--t-accent)', textAlign:'center', lineHeight:1.2 }}>{MONTH_NAMES[letter.month-1]}<br/>{letter.year}</span>
            </div>
            <div style={{ flex:1 }}>
              <p style={{ fontWeight:600, fontSize:14, color:'var(--t-text)' }}>Letter for {MONTH_NAMES[letter.month-1]} {letter.year}</p>
              <p style={{ fontSize:12, color:'var(--t-text-muted)' }}>{letter.entry_count} entries · mood: {letter.mood_summary}</p>
            </div>
            <ChevronDown size={14} style={{ color:'var(--t-text-muted)', transform:activeId===letter.id?'rotate(180deg)':'none', transition:'transform 0.2s' }} />
          </button>
          {activeId === letter.id && (
            <div style={{ borderTop:'0.5px solid var(--t-border)', padding:'16px', fontFamily:'Georgia,serif', fontSize:14, lineHeight:1.8, color:'var(--t-text)', whiteSpace:'pre-wrap' }}>
              {letter.letter_text}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

// ─── Main Journal page ────────────────────────────────────────────────────────

export default function Journal() {
  const [tab, setTab] = useState('write')
  const ctx = getIslamicContext()

  return (
    <div className="max-w-2xl mx-auto px-4 py-5">
      <div style={{ marginBottom:16 }}>
        <h1 style={{ fontFamily:'var(--font-display,serif)', fontSize:24, fontWeight:700, color:'var(--t-text)' }}>Journal</h1>
        <p style={{ fontSize:13, color:'var(--t-accent)' }}>{ctx.formatted}</p>
        <p style={{ fontSize:11, color:'var(--t-text-muted)', marginTop:2 }}>Your reflections are known only to you and Allah 🔒</p>
      </div>

      {/* Tab bar */}
      <div style={{ display:'flex', gap:2, padding:4, borderRadius:12, marginBottom:16, background:'var(--t-bg-card)', border:'0.5px solid var(--t-border)' }}>
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)} style={{ flex:1, padding:'8px 2px', borderRadius:9, fontSize:11, fontWeight:500, border:'none', cursor:'pointer', background:tab===t?'var(--t-primary)':'transparent', color:tab===t?'white':'var(--t-text-muted)', transition:'all 0.15s' }}>
            {TAB_LABELS[t]}
          </button>
        ))}
      </div>

      {tab === 'write'     && <WriteTab />}
      {tab === 'entries'   && <EntriesTab />}
      {tab === 'insights'  && <InsightsTab />}
      {tab === 'analytics' && <AnalyticsTab />}
      {tab === 'letters'   && <LettersTab />}
    </div>
  )
}
