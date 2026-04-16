import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { useQuery, useQueries, useMutation, useQueryClient } from '@tanstack/react-query'
import { BookOpen, Search, ChevronLeft, Play, Pause, Maximize2, Minimize2, BookMarked, ChevronDown, Plus, Star, Mic, Timer, ChevronRight, StopCircle, CheckCircle, AlertTriangle, Link2, ImageDown, Flame } from 'lucide-react'
import api from '@/lib/api'
import { useAuthStore } from '@/store/authStore'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { Select } from '@/components/ui/compat'
import { getIslamicContext } from '@/lib/hijri'
import { cn } from '@/lib/utils'
import offlineDB from '@/lib/db'
import toast from 'react-hot-toast'
import CalendarHeatmap from 'react-calendar-heatmap';
import 'react-calendar-heatmap/dist/styles.css';
import { useStickyState } from '@/hooks/useStickyState'
import * as Tooltip from '@radix-ui/react-tooltip'

import { useVirtualizer } from '@tanstack/react-virtual'

const TAJWEED_CSS = `
  .ham_wasl  { color: #AAAAAA; }
  .slnt      { color: #AAAAAA; }
  .madda_necessary    { color: #537FFF; }
  .madda_permissible  { color: #4050FF; }
  .madda_normal       { color: #537FFF; }
  .qalaqah   { color: #DD8B00; }
  .ikhafa    { color: #9400A8; }
  .idghaam_ghunnah    { color: #169200; }
  .idghaam_no_ghunnah { color: #169200; }
  .ghunnah   { color: #169200; }
`

export const Route = createFileRoute('/_authenticated/quran')({
  component: QuranPage,
})

const TABS = ['reader', 'hifz', 'duas', 'hadith', 'stats', 'practice']
const TAB_LABELS = { reader: 'Reader', hifz: 'Hifz', duas: 'Duas', hadith: 'Hadith', stats: 'Stats', practice: 'Practice' }

const RECITERS = [
  { id: 7,  name: 'Mishary Alafasy',      slug: 'mishary_rashid_alafasy' },
  { id: 1,  name: 'Abdul Rahman Sudais',  slug: 'abdurrahmaan_as_sudais' },
  { id: 2,  name: 'Abu Bakr al-Shatri',  slug: 'abu_bakr_ash_shatri' },
  { id: 5,  name: 'Mahmoud al-Husary',   slug: 'mahmoud_khaleel_al_husary' },
  { id: 10, name: 'Mohamed al-Minshawi', slug: 'minshawi_murattal' },
]

const READING_MODES = [ { id: 'scroll', label: 'Scroll', icon: '📜' }, { id: 'page', label: 'Page', icon: '📖' }, { id: 'hifz', label: 'Hifz', icon: '🧠' } ]
const HIGHLIGHT_COLORS = ['gold','green','blue','red','purple']
const HIFZ_MODES = ['Listen & Repeat','Read & Cover','Fill the Blank','Full Recall']
const SM2_LABELS = ['Forgot','Wrong','Hard','OK','Good','Perfect']
const SM2_COLORS = ['#ef4444','#f97316','#eab308','#3b82f6','#22c55e','#16a34a']

const GRADE_STYLES = {
  sahih:   { bg: 'bg-green-500/10 text-green-600 border-green-500/20', label: 'Sahih ✓' },
  hasan:   { bg: 'bg-blue-500/10 text-blue-600 border-blue-500/20', label: 'Hasan' },
  daif:    { bg: 'bg-orange-500/10 text-orange-600 border-orange-500/20', label: "Da'if ⚠" },
  mawdu:   { bg: 'bg-red-500/10 text-red-500 border-red-500/20', label: 'Mawdu ✗' },
  unknown: { bg: 'bg-muted text-muted-foreground border-border', label: 'Unknown' },
}

const SEARCH_TOPIC_CHIPS = ['Sabr', 'Rahmah', 'Tawakkul', 'Jannah', 'Dua']
const TRANSLATION_OPTIONS = [
  { id: 20, label: 'Sahih Intl' },
  { id: 131, label: 'Clear Quran' },
]

function stripHtml(value = '') {
  return value.replace(/<[^>]+>/g, '')
}

function normalizeArabic(value = '') {
  return value
    .normalize('NFKD')
    .replace(/[\u064B-\u065F\u0670]/g, '')
    .replace(/[^\u0621-\u064A0-9\s]/g, '')
    .trim()
}

function buildBlankMask(words, density = 0.3) {
  return words.map((word, index) => index > 0 && Math.random() < density && Boolean(word.text_uthmani || word.text))
}

function getQuranUrlState() {
  const params = new URLSearchParams(window.location.search)
  return {
    tab: params.get('tab') || 'reader',
    surahId: Number(params.get('surah')) || null,
    ayahId: Number(params.get('ayah')) || null,
  }
}

function syncQuranUrl({ tab, surahId, ayahId }) {
  const url = new URL(window.location.href)
  if (tab && tab !== 'reader') url.searchParams.set('tab', tab)
  else url.searchParams.delete('tab')
  if (surahId) url.searchParams.set('surah', String(surahId))
  else url.searchParams.delete('surah')
  if (ayahId) url.searchParams.set('ayah', String(ayahId))
  else url.searchParams.delete('ayah')
  const search = url.searchParams.toString()
  window.history.replaceState({}, '', search ? `${url.pathname}?${search}` : url.pathname)
}

function getReadingStreak(readingLogs = []) {
  const uniqueDays = [...new Set(readingLogs.map((log) => log.log_date))].sort().reverse()
  if (uniqueDays.length === 0) return 0
  let streak = 0
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  for (let index = 0; index < uniqueDays.length; index += 1) {
    const expected = new Date(today)
    expected.setDate(today.getDate() - index)
    const expectedKey = expected.toISOString().slice(0, 10)
    if (index === 0 && uniqueDays[index] !== expectedKey) {
      const yesterday = new Date(today)
      yesterday.setDate(today.getDate() - 1)
      if (uniqueDays[index] !== yesterday.toISOString().slice(0, 10)) break
      today.setDate(today.getDate() - 1)
    }
    const adjusted = new Date(today)
    adjusted.setDate(today.getDate() - index)
    if (uniqueDays[index] !== adjusted.toISOString().slice(0, 10)) break
    streak += 1
  }
  return streak
}

function downloadAyahCard({ surahName, ayahNum, arabicText, translation }) {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="1200" height="1200">
      <defs>
        <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#0f3b2f"/>
          <stop offset="100%" stop-color="#b68b2c"/>
        </linearGradient>
      </defs>
      <rect width="1200" height="1200" fill="url(#bg)"/>
      <rect x="70" y="70" width="1060" height="1060" rx="40" fill="rgba(255,255,255,0.92)"/>
      <text x="1020" y="250" text-anchor="end" font-size="64" font-family="Amiri, serif" fill="#12251d">${arabicText.replace(/&/g, '&amp;').replace(/</g, '&lt;')}</text>
      <foreignObject x="110" y="330" width="980" height="380">
        <div xmlns="http://www.w3.org/1999/xhtml" style="font-family: Georgia, serif; font-size: 36px; line-height: 1.45; color: #243b33;">${translation.replace(/&/g, '&amp;').replace(/</g, '&lt;')}</div>
      </foreignObject>
      <text x="110" y="1030" font-size="34" font-family="system-ui, sans-serif" fill="#6b7280">${surahName} • Ayah ${ayahNum}</text>
    </svg>
  `
  const blob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `${surahName.toLowerCase().replace(/\s+/g, '-')}-${ayahNum}.svg`
  link.click()
  URL.revokeObjectURL(url)
}

function useAudio() {
  const audioRef = useRef(null)
  const sleepTimerRef = useRef(null)
  const [playing,   setPlaying]   = useState(false)
  const [speed,     setSpeed]     = useState(1.0)
  const [currentV,  setCurrentV]  = useState(null)
  const [reciterId, setReciterId] = useStickyState(7, 'q_reciter_id')
  const [sleepTimer, setSleepTimer] = useState(null)

  const getUrl = useCallback((surah, ayah, reciter) => {
    const s = String(surah).padStart(3,'0')
    const a = String(ayah).padStart(3,'0')
    const r = RECITERS.find(r=>r.id===reciter)?.slug || 'mishary_rashid_alafasy'
    return `https://verses.quran.com/${r}/${s}${a}.mp3`
  },[])

  const playVerse = useCallback((surah, ayah, audioUrl) => {
    if (!audioRef.current) audioRef.current = new Audio()
    audioRef.current.src = audioUrl ? `https://verses.quran.com/${audioUrl}` : getUrl(surah, ayah, reciterId)
    audioRef.current.playbackRate = speed
    audioRef.current.play().then(()=>{ setPlaying(true); setCurrentV({surah,ayah}) }).catch(()=>{})
  },[reciterId, speed, getUrl])

  const pause  = useCallback(()=>{ audioRef.current?.pause(); setPlaying(false) },[])
  const resume = useCallback(()=>{ audioRef.current?.play().then(()=>setPlaying(true)).catch(()=>{}) },[])
  const changeSpeed = useCallback((s)=>{ setSpeed(s); if(audioRef.current) audioRef.current.playbackRate=s },[])

  const startSleepTimer = useCallback((minutes) => {
    if (sleepTimerRef.current) clearTimeout(sleepTimerRef.current)
    const label = minutes ? `${minutes} min` : 'End of surah'
    setSleepTimer({ remaining: minutes, label })
    if (minutes) {
      sleepTimerRef.current = setTimeout(() => {
        audioRef.current?.pause()
        setPlaying(false)
        setSleepTimer(null)
        toast.success('Sleep timer ended 🌙')
      }, minutes * 60 * 1000)
    }
  }, [])

  const cancelSleepTimer = useCallback(() => {
    if (sleepTimerRef.current) clearTimeout(sleepTimerRef.current)
    setSleepTimer(null)
  }, [])

  useEffect(() => {
    if (!('mediaSession' in navigator)) return
    
    if (currentV) {
      const reciterName = RECITERS.find(r=>r.id===reciterId)?.name || 'Reciter'
      navigator.mediaSession.metadata = new MediaMetadata({
        title: `Ayah ${currentV.ayah}`,
        artist: reciterName,
        album: `Surah ${currentV.surah}`
      })
      navigator.mediaSession.playbackState = playing ? 'playing' : 'paused'
      
      navigator.mediaSession.setActionHandler('play', resume)
      navigator.mediaSession.setActionHandler('pause', pause)
    }
  }, [currentV, playing, reciterId, resume, pause])

  return { playing, speed, currentV, reciterId, setReciterId, playVerse, pause, resume, changeSpeed, sleepTimer, startSleepTimer, cancelSleepTimer }
}

function MiniPlayer({ audio, surahName }) {
  if (!audio.currentV) return null
  const { surah, ayah } = audio.currentV
  return (
    <div className="fixed bottom-[calc(var(--nav-h)+8px)] left-2 right-2 z-30 bg-muted/90 backdrop-blur-md border border-border shadow-md rounded-2xl p-3 flex items-center gap-3 animate-in fade-in slide-in-from-bottom-4">
      <div className="flex-1 min-w-0">
        <p className="text-xs font-bold text-foreground truncate">{surahName || `Surah ${surah}`} — Verse {ayah}</p>
        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{RECITERS.find(r=>r.id===audio.reciterId)?.name} • {audio.speed}×</p>
      </div>
      <button onClick={audio.playing ? audio.pause : audio.resume}
        className="w-10 h-10 rounded-xl bg-primary text-primary-foreground border-none flex items-center justify-center hover:bg-primary/90 transition-colors shadow-sm shrink-0">
        {audio.playing ? <Pause className="h-4 w-4 fill-current"/> : <Play className="h-4 w-4 fill-current ml-1"/>}
      </button>
    </div>
  )
}

function SurahPicker({ onSelect }) {
  const [search, setSearch] = useState('')
  const trimmedSearch = search.trim()
  const { data: surahs=[], isLoading } = useQuery({ queryKey:['quran','surahs'], queryFn: ()=>api.get('/quran/surahs').then(r=>r.data), staleTime: 24*60*60_000 })
  const { data: searchResults = [], isFetching: searchingAyahs } = useQuery({
    queryKey:['quran','search', trimmedSearch],
    queryFn: ()=>api.get('/quran/search', { params: { q: trimmedSearch }}).then(r => r.data?.search?.results || []).catch(() => []),
    enabled: trimmedSearch.length >= 2,
    staleTime: 5*60_000,
  })
  const filtered = surahs.filter(s => s.name_simple.toLowerCase().includes(search.toLowerCase()) || String(s.id).includes(search) || s.translated_name?.name?.toLowerCase().includes(search.toLowerCase()))
  
  return (
    <div className="animate-in fade-in slide-in-from-bottom-2">
      <div className="mb-4">
        <Input placeholder="Search surah..." value={search} onChange={e=>setSearch(e.target.value)} icon={<Search className="h-4 w-4 text-muted-foreground" />} />
      </div>
      <div className="flex gap-2 overflow-x-auto scrollbar-none mb-4">
        {SEARCH_TOPIC_CHIPS.map((topic) => (
          <button key={topic} onClick={() => setSearch(topic)} className="px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest bg-card border border-border text-muted-foreground hover:text-foreground hover:border-primary/30 whitespace-nowrap">
            {topic}
          </button>
        ))}
      </div>
      {trimmedSearch.length >= 2 && (
        <Card className="p-4 mb-4 bg-primary/5 border-primary/20">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[10px] font-black uppercase tracking-widest text-primary">Ayah Search</p>
            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{searchingAyahs ? 'Searching' : `${searchResults.length} matches`}</span>
          </div>
          <div className="space-y-2">
            {searchResults.slice(0, 5).map((result) => {
              const [surahId, ayahId] = String(result.verse_key || '').split(':').map(Number)
              return (
                <button
                  key={result.verse_key}
                  onClick={() => onSelect({ surahId, ayahId })}
                  className="w-full text-left rounded-xl border border-border bg-background/80 p-3 hover:border-primary/30 transition-colors"
                >
                  <p className="text-[10px] font-black uppercase tracking-widest text-primary mb-1">{result.verse_key}</p>
                  <p className="text-sm font-medium text-foreground leading-relaxed">{stripHtml(result.text || result.translated_text || '')}</p>
                </button>
              )
            })}
            {!searchingAyahs && searchResults.length === 0 && <p className="text-sm font-medium text-muted-foreground">No ayah matches yet.</p>}
          </div>
        </Card>
      )}
      {isLoading ? <div className="space-y-2">{[...Array(8)].map((_,i)=><Skeleton key={i} className="h-14 rounded-xl" />)}</div> : (
        <div className="space-y-2 max-h-[65vh] overflow-y-auto pr-1">
          {filtered.map(s => (
            <button key={s.id} onClick={()=>onSelect({ surahId: s.id })} className="w-full flex items-center gap-3 p-3 rounded-xl border border-transparent hover:border-border hover:bg-muted/50 transition-colors text-left group">
              <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center text-xs font-bold text-muted-foreground group-hover:bg-background group-hover:text-primary transition-colors border border-border/50 shrink-0">{s.id}</div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm text-foreground">{s.name_simple}</p>
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground truncate">{s.translated_name?.name} • {s.verses_count} verses • {s.revelation_place}</p>
              </div>
              <span className="font-amiri text-2xl text-primary drop-shadow-sm">{s.name_arabic}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}



const AyahWord = ({ word, showTajweed, showTranslit }) => (
  <Tooltip.Root>
    <Tooltip.Trigger asChild>
      <button className="px-2 py-1 rounded-xl bg-primary/5 hover:bg-primary/10 border border-primary/10 flex flex-col items-center gap-1 transition-colors text-center max-w-[132px]">
        {showTajweed && word.text_tajweed
          ? <span className="font-amiri text-2xl text-foreground" dangerouslySetInnerHTML={{ __html: word.text_tajweed }} />
          : <span className="font-amiri text-2xl text-foreground">{word.text_uthmani || word.text}</span>
        }
        {showTranslit && word.transliteration?.text && <span className="text-[9px] font-bold text-primary italic truncate w-full">{word.transliteration.text}</span>}
        <span className="text-[9px] font-bold uppercase tracking-wide text-muted-foreground truncate w-full">{word.translation?.text || '—'}</span>
      </button>
    </Tooltip.Trigger>
    <Tooltip.Portal>
      <Tooltip.Content sideOffset={6} className="z-50 rounded-lg bg-popover border border-border shadow-md p-3 text-sm max-w-[220px]">
        <p className="font-amiri text-2xl text-right mb-1 text-foreground">{word.text_uthmani || word.text}</p>
        <p className="text-primary text-xs font-bold">{word.transliteration?.text || '—'}</p>
        <p className="font-medium mt-1 text-foreground">{word.translation?.text || '—'}</p>
        <p className="text-[11px] text-muted-foreground mt-2">{word.root_arabic ? `Root: ${word.root_arabic}` : 'Tap words for quick lexical context.'}{word.grammar_info ? ` · ${word.grammar_info}` : ''}</p>
        <Tooltip.Arrow className="fill-popover" />
      </Tooltip.Content>
    </Tooltip.Portal>
  </Tooltip.Root>
)

const AyahRow = ({ v, surah, audio, bookmarks, addBookmark, setTafsirVerse, readingMode, showGrammar, showTranslit, showTrans, showTajweed, translationIds, fontSize, onVerseRead }) => {
  const ayahNum = v.verse_number
  const isPlaying = audio.currentV?.surah===surah.id&&audio.currentV?.ayah===ayahNum&&audio.playing
  const isHighlighted = audio.currentV?.surah===surah.id&&audio.currentV?.ayah===ayahNum
  const isBookmarked = bookmarks.some(b=>b.surah_number===surah.id&&b.ayah_number===ayahNum)
  const [revealed, setRevealed] = useState(false)
  const [challengeMode, setChallengeMode] = useState('guided')
  const [guidedCount, setGuidedCount] = useState(1)
  const [blankMask, setBlankMask] = useState([])
  const [blankInputs, setBlankInputs] = useState({})
  const arabicText = v.text_uthmani||v.text_imlaei||''
  const words = v.words?.filter(w => w.char_type_name === 'word') || arabicText.split(' ').map(w => ({ text_uthmani: w }))
  const translationEntries = (translationIds || []).map((id) => v.translationMap?.[id]).filter(Boolean)
  const tajweedHtml = v.text_tajweed || arabicText

  useEffect(() => {
    setBlankMask(buildBlankMask(words))
    setBlankInputs({})
    setGuidedCount(1)
    setRevealed(false)
    setChallengeMode('guided')
  }, [ayahNum, words])

  const handleCopyLink = async () => {
    const url = new URL(window.location.href)
    url.searchParams.set('surah', String(surah.id))
    url.searchParams.set('ayah', String(ayahNum))
    url.searchParams.set('tab', 'reader')
    try {
      await navigator.clipboard.writeText(url.toString())
      toast.success('Ayah link copied')
    } catch {
      toast.error('Could not copy link')
    }
  }

  const onPlay = () => {
    onVerseRead?.(ayahNum)
    isPlaying ? audio.pause() : audio.playVerse(surah.id, ayahNum, v.audio?.url)
  }

  return (
    <div id={`ayah-${ayahNum}`} className={cn("py-6 border-b border-border/50 transition-colors", isHighlighted ? 'bg-gold/5' : 'bg-transparent')}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex gap-2 flex-wrap">
          <button onClick={onPlay} className={cn("w-8 h-8 rounded-full flex items-center justify-center transition-colors", isPlaying ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-border")}>
            {isPlaying ? <Pause className="h-3 w-3 fill-current"/> : <Play className="h-3 w-3 fill-current ml-0.5" />}
          </button>
          <button onClick={()=>addBookmark(surah.id,ayahNum)} className={cn("w-8 h-8 rounded-full flex items-center justify-center transition-colors", isBookmarked ? "text-primary" : "text-muted-foreground hover:bg-muted")}>
            <BookMarked className="h-4 w-4" fill={isBookmarked ? 'currentColor' : 'none'}/>
          </button>
          <button onClick={()=>setTafsirVerse({surahNum: surah.id, ayahNum, text: arabicText, trans: stripHtml(v.translations?.[0]?.text || '')})} className="w-8 h-8 rounded-full flex items-center justify-center text-xs hover:bg-muted text-muted-foreground" title="View Tafsir">📖</button>
          <button onClick={handleCopyLink} className="w-8 h-8 rounded-full flex items-center justify-center text-xs hover:bg-muted text-muted-foreground" title="Copy verse link"><Link2 className="h-4 w-4" /></button>
          <button onClick={() => downloadAyahCard({ surahName: surah.name_simple, ayahNum, arabicText, translation: translationEntries[0]?.text || stripHtml(v.translations?.[0]?.text || '') })} className="w-8 h-8 rounded-full flex items-center justify-center text-xs hover:bg-muted text-muted-foreground" title="Download verse card"><ImageDown className="h-4 w-4" /></button>
        </div>
        <div className="flex items-center gap-2">
          {(v.v1_page || v.page_number || v.page) && <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">p. {v.v1_page || v.page_number || v.page}</span>}
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-black border border-primary/20 text-primary">{ayahNum}</div>
        </div>
      </div>
      {readingMode==='hifz' ? (
        <div className="space-y-3">
          <div className="flex gap-2 flex-wrap">
            {[
              ['guided', 'Guided'],
              ['blanks', 'Blank 30%'],
              ['hidden', 'Full Hide'],
            ].map(([id, label]) => (
              <button key={id} onClick={() => setChallengeMode(id)} className={cn("px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest border transition-colors", challengeMode === id ? 'bg-primary/10 border-primary/30 text-primary' : 'bg-card border-border text-muted-foreground hover:bg-muted')}>
                {label}
              </button>
            ))}
          </div>
          {challengeMode === 'guided' && (
            <div onClick={()=>setGuidedCount((count) => Math.min(words.length, count + 1))} className="cursor-pointer text-right rtl leading-[3] flex flex-wrap flex-row-reverse gap-2">
              {words.map((word, index) => (
                <span key={index} className="font-amiri text-3xl" style={{ color: index < guidedCount ? 'inherit' : 'transparent', textShadow: index < guidedCount ? 'none' : '0 0 10px rgba(148, 163, 184, 0.9)', fontSize: `${fontSize || 30}px` }}>
                  {word.text_uthmani || word.text}
                </span>
              ))}
            </div>
          )}
          {challengeMode === 'blanks' && (
            <div className="text-right rtl leading-[3] flex flex-wrap flex-row-reverse gap-2 items-center">
              {words.map((word, index) => {
                const token = word.text_uthmani || word.text
                if (!blankMask[index]) return <span key={index} className="font-amiri text-3xl text-foreground" style={{ fontSize: `${fontSize || 30}px` }}>{token}</span>
                const answer = blankInputs[index] || ''
                const correct = answer && normalizeArabic(answer) === normalizeArabic(token)
                return (
                  <input
                    key={index}
                    value={answer}
                    onChange={(event) => setBlankInputs((current) => ({ ...current, [index]: event.target.value }))}
                    placeholder="___"
                    className={cn("w-24 rounded-lg border bg-background px-2 py-1 text-right", correct ? 'border-green-500 text-green-600' : 'border-border text-foreground')}
                  />
                )
              })}
            </div>
          )}
          {challengeMode === 'hidden' && (
            <div onClick={()=>setRevealed(r=>!r)} className="cursor-pointer">
              {revealed
                ? (showTajweed ? <div className="font-amiri leading-loose text-right rtl mb-4" style={{ fontSize: `${fontSize || 30}px` }} dangerouslySetInnerHTML={{ __html: tajweedHtml }} /> : <p className="font-amiri leading-loose text-right rtl text-foreground mb-4" style={{ fontSize: `${fontSize || 30}px` }}>{arabicText}</p>)
                : <div className="rounded-xl h-14 bg-muted/50 border border-border flex items-center justify-center text-xs font-bold text-muted-foreground uppercase tracking-widest hover:bg-muted transition-colors">Tap to reveal</div>}
            </div>
          )}
        </div>
      ) : showGrammar ? (
        <div className="text-right rtl leading-[3] flex flex-wrap flex-row-reverse gap-2 mb-4">
          <Tooltip.Provider delayDuration={150}>
            {words.map((word, index) => <AyahWord key={index} word={word} showTajweed={showTajweed} showTranslit={showTranslit} />)}
          </Tooltip.Provider>
        </div>
      ) : (
        showTajweed 
          ? <div className="font-amiri leading-[2.5] text-right rtl mb-5" style={{wordSpacing:'0.15em', fontSize: `${fontSize || 30}px`}} dangerouslySetInnerHTML={{ __html: tajweedHtml }} />
          : <p className="font-amiri leading-[2.5] text-right rtl text-foreground mb-5" style={{wordSpacing:'0.15em', fontSize: `${fontSize || 30}px`}}>{arabicText}</p>
      )}
      {showTrans && translationEntries.length > 0 && (
        <div className={cn("grid gap-3", translationEntries.length > 1 ? 'md:grid-cols-2' : 'grid-cols-1')}>
          {translationEntries.map((translation) => (
            <div key={translation.id} className="border-l-2 border-primary/30 pl-3">
              <p className="text-[10px] font-black uppercase tracking-widest text-primary mb-1">{translation.label}</p>
              <p className="text-[13px] font-medium text-muted-foreground/90 leading-relaxed">{translation.text}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

const MushafViewer = ({ verses, surah }) => {
  const pages = [...new Set(verses.map((verse) => verse.v1_page || verse.page_number || verse.page).filter(Boolean))]
  const [pageIndex, setPageIndex] = useState(0)
  const currentPage = pages[pageIndex]
  if (pages.length === 0) {
    return <Card className="p-5 text-sm font-medium text-muted-foreground">Mushaf page images are not available for this surah payload yet.</Card>
  }
  const pageUrl = `https://static.qurancdn.com/images/quran/pages/page${String(currentPage).padStart(3, '0')}.png`
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Button variant="outline" size="sm" onClick={() => setPageIndex((index) => Math.max(0, index - 1))} disabled={pageIndex === 0}>Prev Page</Button>
        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{surah.name_simple} • Page {currentPage}</p>
        <Button variant="outline" size="sm" onClick={() => setPageIndex((index) => Math.min(pages.length - 1, index + 1))} disabled={pageIndex === pages.length - 1}>Next Page</Button>
      </div>
      <Card className="p-3 bg-card">
        <img src={pageUrl} alt={`Quran page ${currentPage}`} className="w-full rounded-xl border border-border bg-background" loading="lazy" />
      </Card>
    </div>
  )
}

const VirtualAyahList = ({ verses, surah, audio, bookmarks, addBookmark, setTafsirVerse, readingMode, showGrammar, showTranslit, showTrans, showTajweed, focusMode, translationIds, fontSize, scrollToAyah, onVerseRead }) => {
  const parentRef = useRef(null)
  
  const rowVirtualizer = useVirtualizer({
    count: verses.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 200,
    overscan: 4,
  })

  useEffect(() => {
    if (!scrollToAyah) return
    const targetIndex = verses.findIndex((verse) => verse.verse_number === Number(scrollToAyah))
    if (targetIndex >= 0) rowVirtualizer.scrollToIndex(targetIndex, { align: 'center' })
  }, [rowVirtualizer, scrollToAyah, verses])

  if (readingMode === 'page') {
    return <MushafViewer verses={verses} surah={surah} />
  }

  return (
    <div ref={parentRef} className={cn("overflow-y-auto pr-2", focusMode ? "h-[80vh]" : "h-[calc(100vh-280px)]")}>
      <div style={{ height: rowVirtualizer.getTotalSize(), width: '100%', position: 'relative' }}>
        {rowVirtualizer.getVirtualItems().map((virtualItem) => {
          const v = verses[virtualItem.index]
          return (
            <div
              key={virtualItem.key}
              data-index={virtualItem.index}
              ref={rowVirtualizer.measureElement}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                transform: `translateY(${virtualItem.start}px)`,
              }}
            >
              <AyahRow 
                v={v} 
                surah={surah} 
                audio={audio} 
                bookmarks={bookmarks} 
                addBookmark={addBookmark} 
                setTafsirVerse={setTafsirVerse} 
                readingMode={readingMode} 
                showGrammar={showGrammar} 
                showTranslit={showTranslit} 
                showTrans={showTrans} 
                showTajweed={showTajweed} 
                translationIds={translationIds}
                fontSize={fontSize}
                onVerseRead={onVerseRead}
              />
            </div>
          )
        })}
      </div>
    </div>
  )
}


function SurahReader({ surah, onBack, audio, scrollToAyah }) {
  const qc = useQueryClient()
  const [showTrans, setShowTrans] = useStickyState(true, 'q_show_trans')
  const [showTranslit, setShowTranslit] = useStickyState(false, 'q_show_translit')
  const [showGrammar, setShowGrammar] = useStickyState(false, 'q_show_grammar')
  const [showTajweed, setShowTajweed] = useStickyState(true, 'q_show_tajweed')
  const [readingMode, setReadingMode] = useStickyState('scroll', 'q_reading_mode')
  const [fontSize, setFontSize] = useStickyState(30, 'q_font_size')
  const [translationIds, setTranslationIds] = useStickyState([20], 'q_translation_ids')
  const normalizedTranslationIds = Array.isArray(translationIds) ? translationIds : [Number(translationIds) || 20]
  const [focusMode, setFocusMode] = useState(false)
  const [bookmarkSheet,setBookmarkSheet]= useState(null)
  const [noteText, setNoteText] = useState('')
  const [hlColor, setHlColor] = useState('gold')
  const [tafsirVerse, setTafsirVerse] = useState(null)
  const [showSleepTimer, setShowSleepTimer] = useState(false)
  const sessionStart = useRef(Date.now())
  const versesRead = useRef(new Set())

  const surahQueries = useQueries({
    queries: normalizedTranslationIds.map((translationId) => ({
      queryKey:['quran','surah',surah.id, translationId],
      queryFn: ()=>api.get(`/quran/surah/${surah.id}?translation_id=${translationId}`).then(r=>r.data),
      staleTime:30*60_000,
    })),
  })
  const { data: bookmarks=[] } = useQuery({ queryKey:['quran','bookmarks'], queryFn: ()=>api.get('/quran/bookmarks').then(r=>r.data).catch(()=>[]) })
  const isLoading = surahQueries.some((query) => query.isLoading)
  const verseData = surahQueries[0]?.data
  const verses = useMemo(() => {
    const baseVerses = verseData?.verses || []
    return baseVerses.map((verse) => {
      const translationMap = {}
      surahQueries.forEach((query, index) => {
        const translationId = normalizedTranslationIds[index]
        const matched = query.data?.verses?.find((entry) => entry.verse_key === verse.verse_key)
        if (matched?.translations?.[0]) {
          translationMap[translationId] = {
            id: translationId,
            label: TRANSLATION_OPTIONS.find((option) => option.id === translationId)?.label || `Translation ${translationId}`,
            text: stripHtml(matched.translations[0].text),
          }
        }
      })
      return { ...verse, translationMap }
    })
  }, [normalizedTranslationIds, surahQueries, verseData])

  useEffect(()=>{
    return ()=>{
      const mins = Math.round((Date.now()-sessionStart.current)/60_000)
      const v = verses.length || 0
      if (mins<1||versesRead.current.size<1) return
      api.post('/quran/reading-log',{surah_from:surah.id,ayah_from:1,surah_to:surah.id,ayah_to:v,verses_read:Math.min(versesRead.current.size,v),minutes_read:mins,mode:'reading'}).catch(()=>{})
    }
  },[surah.id, verses])

  const addBookmark = async (surahNum, ayahNum) => {
    const existing = bookmarks.find(b=>b.surah_number===surahNum&&b.ayah_number===ayahNum)
    if (existing) { await api.delete(`/quran/bookmarks/${existing.id}`); toast.success('Bookmark removed'); qc.invalidateQueries({queryKey:['quran','bookmarks']}); return }
    setBookmarkSheet({surahNum,ayahNum}); setNoteText(''); setHlColor('gold')
  }

  const saveBookmark = async () => {
    await api.post('/quran/bookmarks',{surah_number:bookmarkSheet.surahNum,ayah_number:bookmarkSheet.ayahNum,note:noteText||null,highlight_color:hlColor})
    qc.invalidateQueries({queryKey:['quran','bookmarks']}); toast.success('Bookmarked!'); setBookmarkSheet(null)
  }

  return (
    <div className="animate-in fade-in">
      {!focusMode && (
        <div className="flex items-center gap-2 mb-4 flex-wrap pb-4 border-b border-border">
          <Button variant="ghost" size="sm" onClick={onBack} className="px-2 font-bold"><ChevronLeft className="h-4 w-4 mr-1" /> Back</Button>
          <div className="flex-1 min-w-0 px-2">
            <p className="font-bold text-sm text-foreground truncate">{surah.name_simple}</p>
            <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">{surah.translated_name?.name} • {surah.verses_count} verses</p>
          </div>
          {[['Trans',showTrans,setShowTrans],['Latin',showTranslit,setShowTranslit],['Grammar',showGrammar,setShowGrammar],['Tajweed',showTajweed,setShowTajweed]].map(([label,active,toggle])=>(
            <button key={label} onClick={()=>toggle(v=>!v)} className={cn('px-2.5 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all border', active ? 'bg-primary/10 border-primary/30 text-primary' : 'bg-card border-border text-muted-foreground hover:bg-muted')}>{label}</button>
          ))}
          <div className="flex items-center gap-2 rounded-lg border border-border bg-card px-2 py-1">
            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Font</span>
            <input type="range" min="24" max="40" value={fontSize} onChange={(e)=>setFontSize(Number(e.target.value))} />
          </div>
          <button onClick={()=>setShowSleepTimer(v=>!v)} className={cn("p-1.5 rounded-lg transition-colors border", audio.sleepTimer ? "bg-purple-500/10 text-purple-600 border-purple-500/30" : "bg-card border-border text-muted-foreground")} title="Sleep timer"><Timer className="h-4 w-4"/></button>
          <button onClick={()=>setFocusMode(true)} className="p-1.5 rounded-lg bg-card border border-border text-muted-foreground"><Maximize2 className="h-4 w-4"/></button>
        </div>
      )}

      <div className="flex gap-2 flex-wrap mb-4">
        {TRANSLATION_OPTIONS.map((option) => (
          <button
            key={option.id}
            onClick={() => setTranslationIds((current) => {
              const currentIds = Array.isArray(current) ? current : [Number(current) || 20]
              const has = currentIds.includes(option.id)
              if (has && currentIds.length === 1) return currentIds
              if (has) return currentIds.filter((id) => id !== option.id)
              return [...currentIds, option.id].slice(0, 2)
            })}
            className={cn("px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest border transition-colors", normalizedTranslationIds.includes(option.id) ? 'bg-primary/10 border-primary/30 text-primary' : 'bg-card border-border text-muted-foreground hover:bg-muted')}
          >
            {option.label}
          </button>
        ))}
      </div>

      {focusMode && (
        <div className="fixed inset-0 bg-background z-50 overflow-y-auto px-4 py-6 text-foreground animate-in slide-in-from-bottom-4">
          <button onClick={()=>setFocusMode(false)} className="fixed top-4 right-4 bg-muted border border-border rounded-xl p-2.5 text-muted-foreground hover:text-foreground"><Minimize2 className="h-4 w-4"/></button>
          <div className="max-w-2xl mx-auto pt-10">{isLoading ? <div className="space-y-4">{[...Array(5)].map((_,i)=><Skeleton key={i} className="h-24 rounded-2xl" />)}</div> : <VirtualAyahList focusMode={true} verses={verses} surah={surah} audio={audio} bookmarks={bookmarks} addBookmark={addBookmark} setTafsirVerse={setTafsirVerse} readingMode={readingMode} showGrammar={showGrammar} showTranslit={showTranslit} showTrans={showTrans} showTajweed={showTajweed} translationIds={normalizedTranslationIds} fontSize={fontSize} scrollToAyah={scrollToAyah} onVerseRead={(ayah)=>versesRead.current.add(ayah)} />}</div>
        </div>
      )}

      <div className="flex gap-2 mb-4 bg-muted/50 p-1 rounded-xl">
        {READING_MODES.map(m=>(
          <button key={m.id} onClick={()=>setReadingMode(m.id)} className={cn('flex-1 py-1.5 rounded-lg text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-1.5', readingMode === m.id ? 'bg-background text-foreground' : 'text-muted-foreground hover:text-foreground')}><span>{m.icon}</span> {m.label}</button>
        ))}
      </div>

      {!focusMode && (
        <div>
          {isLoading ? (
            <div className="space-y-4">{[...Array(5)].map((_,i)=><Skeleton key={i} className="h-24 rounded-xl" />)}</div>
          ) : (
            <VirtualAyahList
              focusMode={false}
              verses={verses}
              surah={surah}
              audio={audio}
              bookmarks={bookmarks}
              addBookmark={addBookmark}
              setTafsirVerse={setTafsirVerse}
              readingMode={readingMode}
              showGrammar={showGrammar}
              showTranslit={showTranslit}
              showTrans={showTrans}
              showTajweed={showTajweed}
              translationIds={normalizedTranslationIds}
              fontSize={fontSize}
              scrollToAyah={scrollToAyah}
              onVerseRead={(ayah)=>versesRead.current.add(ayah)}
            />
          )}
        </div>
      )}

      {showSleepTimer && (
        <div className="mb-4 p-4 rounded-2xl bg-purple-500/5 border border-purple-500/20 animate-in fade-in zoom-in-95">
          <div className="flex items-center justify-between mb-3">
            <p className="font-bold text-sm text-purple-600 dark:text-purple-400 flex items-center gap-2">🌙 Sleep Timer</p>
            {audio.sleepTimer && <Button variant="outline" size="sm" onClick={audio.cancelSleepTimer} className="h-7 text-[10px] uppercase font-black border-red-500/20 text-red-500 hover:bg-red-500/10">Cancel</Button>}
          </div>
          {audio.sleepTimer ? <p className="text-xs font-bold">Timer set: <span className="text-purple-600">{audio.sleepTimer.label}</span> — audio will stop automatically.</p> : (
            <div className="flex gap-2 flex-wrap">
              {[15,30,60].map(min => <button key={min} onClick={()=>{audio.startSleepTimer(min);setShowSleepTimer(false)}} className="px-4 py-2 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-600 text-[11px] font-black uppercase tracking-widest">{min} min</button>)}
            </div>
          )}
        </div>
      )}

      <Dialog open={!!bookmarkSheet} onOpenChange={(o)=>!o&&setBookmarkSheet(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add bookmark</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <p className="text-xs font-bold mb-2">Color Label</p>
              <div className="flex gap-3">
                {HIGHLIGHT_COLORS.map(c=><button key={c} onClick={()=>setHlColor(c)} className={cn("w-8 h-8 rounded-full border-2 transition-transform", hlColor===c ? 'border-foreground scale-110' : 'border-transparent')} style={{backgroundColor:c}}/>)}
              </div>
            </div>
            <div>
              <p className="text-xs font-bold mb-2">Note (optional)</p>
              <Input placeholder="Your reflection..." value={noteText} onChange={e=>setNoteText(e.target.value)} />
            </div>
          </div>
          <DialogFooter><Button onClick={saveBookmark}>Save bookmark</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!tafsirVerse} onOpenChange={(o)=>!o&&setTafsirVerse(null)}>
        <DialogContent className="sm:max-w-xl max-h-[85vh] overflow-hidden flex flex-col">
          <DialogHeader><DialogTitle className="text-sm">Tafsir Ibn Kathir — {surah.name_simple} {tafsirVerse?.ayahNum}</DialogTitle></DialogHeader>
          <div className="flex-1 overflow-y-auto pr-2 pb-4">
             {tafsirVerse && <TafsirViewer surahNum={tafsirVerse.surahNum} ayahNum={tafsirVerse.ayahNum} arabicText={tafsirVerse.text} translation={tafsirVerse.trans} />}
          </div>
        </DialogContent>
      </Dialog>

      
    </div>
  )
}

function TafsirViewer({ surahNum, ayahNum, arabicText, translation }) {
  const { data: tafsirData, isLoading, isError } = useQuery({ queryKey: ['quran', 'tafsir', surahNum, ayahNum], queryFn: () => api.get(`/quran/tafsir/${surahNum}/${ayahNum}`).then(r => r.data), staleTime: 60 * 60_000 })
  return (
    <div className="space-y-6">
      <div className="pb-4 border-b border-border/50">
        <p className="font-amiri text-2xl leading-relaxed text-right rtl text-foreground mb-4">{arabicText}</p>
        <p className="text-sm font-medium text-muted-foreground leading-relaxed">{translation}</p>
      </div>
      {isLoading ? <div className="space-y-3"><Skeleton className="h-6 w-3/4" /><Skeleton className="h-4 w-full" /><Skeleton className="h-4 w-full" /></div> : isError ? <p className="text-sm font-bold text-red-500">Failed to load Tafsir.</p> : tafsirData?.tafsir?.text ? (
        <div className="prose dark:prose-invert prose-sm max-w-none text-foreground" dangerouslySetInnerHTML={{ __html: tafsirData.tafsir.text }} />
      ) : <p className="text-sm font-medium text-muted-foreground">No Tafsir available for this Ayah.</p>}
    </div>
  )
}



function HifzProgressMap({ entries, dueToday }) {
  const getStatus = (surahId) => {
    const entry = entries.find(h => h.surah_number === surahId)
    if (!entry) return 'not_started'
    if (dueToday.some((item) => item.surah_number === surahId)) return 'due'
    if (entry.status === 'memorised') return 'memorized'
    return 'in_progress'
  }
  const STATUS_COLORS = {
    memorized: 'bg-green-500 text-white border-green-600',
    due: 'bg-blue-500 text-white border-blue-600',
    in_progress: 'bg-orange-400 text-white border-orange-500',
    not_started: 'bg-muted text-muted-foreground border-border/50',
  }
  return (
    <Card className="p-4 bg-background">
      <h3 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-3">Hifz Overview</h3>
      <div className="grid grid-cols-10 gap-1 pb-2">
        {Array.from({length: 114}).map((_, i) => {
          const sid = i + 1;
          const status = getStatus(sid)
          return (
            <div key={sid} title={`Surah ${sid}`} className={cn("aspect-square rounded-[4px] text-[8px] font-bold flex items-center justify-center border transition-all cursor-crosshair", STATUS_COLORS[status])}>
              {sid}
            </div>
          )
        })}
      </div>
      <div className="flex gap-4 mt-1 text-[9px] font-bold text-muted-foreground uppercase tracking-widest">
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-green-500" /> Memorized</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-blue-500" /> Due</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-orange-400" /> In Progress</span>
      </div>
    </Card>
  )
}


function HifzTab() {
  const qc = useQueryClient()
  const [addModal, setAddModal] = useState(false)
  const [hifzMode, setHifzMode] = useState(0)
  const [dailyTarget, setDailyTarget] = useState(5)
  const [form, setForm] = useState({surah_number:1,surah_name:'Al-Fatihah',ayah_from:1,ayah_to:7,total_ayahs:7})
  const { data: entries=[], isLoading } = useQuery({queryKey:['quran','hifz'],queryFn:()=>api.get('/quran/hifz').then(r=>r.data).catch(()=>[])})
  const { data: dueToday=[] } = useQuery({queryKey:['quran','hifz','due'],queryFn:()=>api.get('/quran/hifz/due-today').then(r=>r.data).catch(()=>[])})
  const { mutate: addEntry } = useMutation({ mutationFn:()=>api.post('/quran/hifz',form), onSuccess:()=>{qc.invalidateQueries({queryKey:['quran','hifz']});setAddModal(false);toast.success('Added!')} })
  const { mutate: review } = useMutation({ mutationFn:({id,quality})=>api.post(`/quran/hifz/${id}/review`,{quality}), onSuccess:()=>{qc.invalidateQueries({queryKey:['quran','hifz']});toast.success('Saved!')} })
  const LBOX = ['','bg-red-500','bg-orange-500','bg-gold','bg-green-400','bg-green-600']
  const totalSurahs = 114
  const memorisedCount = entries.filter(e=>e.status==='memorised').length
  const pctDone = Math.round((memorisedCount/totalSurahs)*100)

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-foreground">Hifz Tracker</h2>
          <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{dueToday.length} due today</p>
        </div>
        <Button size="sm" onClick={()=>setAddModal(true)}><Plus className="h-4 w-4 mr-1.5"/> Add</Button>
      </div>

      <Card className="p-5 bg-gradient-to-br from-green-500/10 to-gold/10 border-0 shadow-sm relative overflow-hidden">
        <div className="flex items-start justify-between mb-4 relative z-10">
          <div>
            <p className="font-bold text-foreground flex items-center gap-2">📅 Hifz Planner</p>
            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mt-1">{memorisedCount} of {totalSurahs} surahs • {pctDone}% complete</p>
          </div>
          <div className="text-right">
            <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Daily target</p>
            <div className="flex items-center gap-2 mt-1">
              <button onClick={()=>setDailyTarget(t=>Math.max(1,t-1))} className="w-6 h-6 rounded-full bg-background border border-border shadow-sm text-xs font-bold text-foreground hover:bg-muted">-</button>
              <span className="font-bold text-foreground min-w-[20px] text-center">{dailyTarget}</span>
              <button onClick={()=>setDailyTarget(t=>Math.min(20,t+1))} className="w-6 h-6 rounded-full bg-background border border-border shadow-sm text-xs font-bold text-foreground hover:bg-muted">+</button>
            </div>
          </div>
        </div>
        <div className="h-2.5 bg-background border border-border/50 rounded-full overflow-hidden mb-2 relative z-10"><div className="h-full bg-primary transition-all duration-700" style={{width:`${pctDone}%`}}/></div>
        {dailyTarget > 0 && <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest relative z-10 mt-2">Est. completion: <strong className="text-primary">{Math.ceil((6236 * (1 - pctDone/100)) / dailyTarget)} days</strong></p>}
      </Card>

      <HifzProgressMap entries={entries} dueToday={dueToday} />

      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none w-fit">
        {HIFZ_MODES.map((m,i)=><button key={i} onClick={()=>setHifzMode(i)} className={cn("px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap border", hifzMode===i ? 'bg-primary/10 border-primary/30 text-primary' : 'bg-card border-border text-muted-foreground hover:bg-muted')}>{m}</button>)}
      </div>

      {dueToday.length>0 && (
        <div className="space-y-3">
          <h3 className="text-xs font-black uppercase tracking-widest text-orange-500">Due today ({dueToday.length})</h3>
          {dueToday.slice(0,5).map(e=>(
            <Card key={e.id} className="p-4 border-orange-500/20 bg-orange-500/5">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="font-bold text-foreground text-sm">{e.surah_name||`Surah ${e.surah_number}`}</p>
                  <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Ayah {e.ayah_from}–{e.ayah_to} • Box {e.leitner_box||1}/5</p>
                </div>
                <div className={cn("w-3 h-3 rounded-full shadow-inner border border-black/10", LBOX[e.leitner_box||1])}/>
              </div>
              <div className="flex gap-1.5 flex-wrap">
                {SM2_LABELS.map((label,q)=><button key={q} onClick={()=>review({id:e.id,quality:q})} className="flex-1 py-1.5 rounded-md text-[9px] font-black uppercase tracking-widest transition-shadow border border-black/5 hover:shadow-sm" style={{backgroundColor:SM2_COLORS[q]+'22', color:SM2_COLORS[q]}}>{label}</button>)}
              </div>
            </Card>
          ))}
        </div>
      )}

      <div>
        <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-3">All entries ({entries.length})</h3>
        {isLoading ? <div className="space-y-2">{[...Array(3)].map((_,i)=><Skeleton key={i} className="h-14 rounded-xl"/>)}</div> : entries.length===0 ? <p className="text-sm font-medium text-muted-foreground py-6 text-center">No entries yet.</p> : (
          <div className="space-y-2">
            {entries.map(e=>(
              <Card key={e.id} className="p-3 flex items-center gap-3 transition-colors hover:border-primary/30">
                <div className={cn("w-2.5 h-2.5 rounded-full shrink-0", LBOX[e.leitner_box||1])}/>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm text-foreground truncate">{e.surah_name||`Surah ${e.surah_number}`}</p>
                  <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Ayah {e.ayah_from}–{e.ayah_to} • {e.status}</p>
                </div>
                <Badge variant="secondary" className="shrink-0 text-[9px] uppercase font-black">Box {e.leitner_box||1}</Badge>
              </Card>
            ))}
          </div>
        )}
      </div>

      <Dialog open={addModal} onOpenChange={setAddModal}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add to Hifz Tracker</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div><label className="text-xs font-bold mb-1 block">Surah #</label><Input type="number" min="1" max="114" value={form.surah_number} onChange={e=>setForm({...form,surah_number:parseInt(e.target.value)||1})} /></div>
              <div><label className="text-xs font-bold mb-1 block">Surah Name</label><Input value={form.surah_name} onChange={e=>setForm({...form,surah_name:e.target.value})} /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
               <div><label className="text-xs font-bold mb-1 block">Ayah From</label><Input type="number" min="1" value={form.ayah_from} onChange={e=>setForm({...form,ayah_from:parseInt(e.target.value)||1})} /></div>
               <div><label className="text-xs font-bold mb-1 block">Ayah To</label><Input type="number" min="1" value={form.ayah_to} onChange={e=>setForm({...form,ayah_to:parseInt(e.target.value)||1})} /></div>
            </div>
            <div><label className="text-xs font-bold mb-1 block">Total Ayahs</label><Input type="number" min="1" value={form.total_ayahs} onChange={e=>setForm({...form,total_ayahs:parseInt(e.target.value)||1})} /></div>
          </div>
          <DialogFooter><Button onClick={()=>addEntry()}>Add Entry</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function DuaTab() {
  const qc = useQueryClient()
  const [selectedCat, setSelectedCat] = useState(null)
  const [addModal, setAddModal] = useState(false)
  const [newDua, setNewDua] = useState({title:'',text:''})
  const [activeDua, setActiveDua] = useState(null)
  const { data: categories=[] } = useQuery({queryKey:['quran','dua-cats'],queryFn:()=>api.get('/quran/duas/categories').then(r=>r.data).catch(()=>[])})
  const { data: duas=[] } = useQuery({queryKey:['quran','duas',selectedCat],queryFn:()=>api.get('/quran/duas',{params:selectedCat?{category:selectedCat}:{}}).then(r=>r.data).catch(()=>[])})
  const { data: personal=[] } = useQuery({queryKey:['quran','personal-duas'],queryFn:()=>api.get('/quran/duas/personal').then(r=>r.data).catch(()=>[])})
  const { data: duaOfDay } = useQuery({queryKey:['quran','dua-of-day'],queryFn:()=>api.get('/quran/duas/of-the-day').then(r=>r.data).catch(()=>null)})
  const { mutate: createPersonal } = useMutation({mutationFn:()=>api.post('/quran/duas/personal',newDua),onSuccess:()=>{qc.invalidateQueries({queryKey:['quran','personal-duas']});setAddModal(false);setNewDua({title:'',text:''});toast.success('Dua added')}})
  const { mutate: markAnswered } = useMutation({mutationFn:({id})=>api.patch(`/quran/duas/personal/${id}`,{is_answered:true}),onSuccess:()=>{qc.invalidateQueries({queryKey:['quran','personal-duas']});toast.success('Alhamdulillah! 🤲')}})

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
      {duaOfDay && (
        <Card className="p-5 bg-primary/5 border-primary/20 relative overflow-hidden">
          <div className="absolute right-0 top-0 p-4 opacity-5"><Star className="h-24 w-24" /></div>
          <p className="text-[10px] font-black uppercase tracking-widest text-primary mb-3 relative z-10">Dua of the day</p>
          <p className="font-amiri text-2xl leading-loose text-right rtl text-foreground mb-3 relative z-10">{duaOfDay.arabic_text}</p>
          {duaOfDay.transliteration && <p className="text-sm font-medium italic text-muted-foreground mb-2 relative z-10">{duaOfDay.transliteration}</p>}
          <p className="text-sm font-bold text-foreground leading-relaxed relative z-10">{duaOfDay.translation}</p>
          {duaOfDay.source && <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mt-4 relative z-10">— {duaOfDay.source}</p>}
        </Card>
      )}

      <div className="flex gap-2 p-1 bg-muted rounded-xl overflow-x-auto w-fit scrollbar-none">
        <button onClick={()=>setSelectedCat(null)} className={cn('px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all shadow-sm', !selectedCat ? 'bg-background text-foreground' : 'text-muted-foreground hover:text-foreground')}>All</button>
        {categories.map(c=><button key={c.category} onClick={()=>setSelectedCat(c.category)} className={cn('px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all', selectedCat===c.category ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground')}>{c.category.replace('_',' ')} ({c.count})</button>)}
      </div>

      <div className="space-y-2">
        {duas.slice(0,20).map(dua=>(
          <Card key={dua.id} className="overflow-hidden transition-all duration-300">
            <button className="w-full text-left p-4 focus:outline-none" onClick={()=>setActiveDua(activeDua?.id===dua.id?null:dua)}>
              <div className="flex items-center justify-between">
                <p className="font-bold text-sm text-foreground pr-4 truncate">{dua.title}</p>
                <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform shrink-0", activeDua?.id===dua.id ? "rotate-180" : "")}/>
              </div>
              {activeDua?.id !== dua.id && <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mt-1 truncate">{dua.category.replace('_',' ')} • {dua.repetition_count}×</p>}
            </button>
            {activeDua?.id===dua.id && (
              <div className="px-4 pb-4 animate-in slide-in-from-top-2">
                <div className="h-px w-full bg-border/50 mb-4" />
                <p className="font-amiri text-2xl leading-loose text-right rtl text-foreground mb-4">{dua.arabic_text}</p>
                {dua.transliteration && <p className="text-xs font-bold text-primary italic mb-3">{dua.transliteration}</p>}
                <p className="text-[13px] font-medium text-foreground leading-relaxed bg-muted/30 p-3 rounded-xl">{dua.translation}</p>
                <div className="flex flex-wrap items-center gap-4 mt-4">
                  {dua.source && <Badge variant="secondary" className="text-[9px] uppercase font-black tracking-widest">{dua.source}</Badge>}
                  {dua.when_to_recite && <span className="text-[10px] font-bold text-muted-foreground"><span className="uppercase font-black text-foreground">When:</span> {dua.when_to_recite}</span>}
                </div>
              </div>
            )}
          </Card>
        ))}
      </div>

      <div className="pt-4 border-t border-border">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">My Duas ({personal.length})</h3>
          <Button size="sm" onClick={()=>setAddModal(true)}><Plus className="h-4 w-4 mr-1.5"/> Add</Button>
        </div>
        <div className="space-y-3">
          {personal.map(pd=>(
            <Card key={pd.id} className={cn("p-4 transition-all", pd.is_answered ? "opacity-60 bg-muted/50 border-dashed border-border" : "")}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <p className={cn("font-bold text-sm text-foreground truncate", pd.is_answered ? "line-through" : "")}>{pd.title}</p>
                  <p className="text-[11px] font-medium text-muted-foreground mt-1 line-clamp-2 leading-relaxed">{pd.text}</p>
                  {pd.is_answered && pd.answered_note && <p className="text-[10px] font-black uppercase tracking-widest text-primary mt-2 flex items-center gap-1"><CheckCircle className="h-3 w-3" /> {pd.answered_note}</p>}
                </div>
                {!pd.is_answered && <Button size="sm" variant="outline" className="shrink-0 text-[10px] uppercase font-black h-8 px-2 border-primary/30 text-primary hover:bg-primary/10" onClick={()=>markAnswered({id:pd.id})}>🤲 Answered</Button>}
              </div>
            </Card>
          ))}
          {personal.length===0 && <p className="text-sm font-medium text-muted-foreground text-center py-6">No personal duas yet.</p>}
        </div>
      </div>

      <Dialog open={addModal} onOpenChange={setAddModal}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add personal dua</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div><label className="text-xs font-bold mb-1 block">Title</label><Input placeholder="e.g. For my family" value={newDua.title} onChange={e=>setNewDua(d=>({...d,title:e.target.value}))} /></div>
            <div><label className="text-xs font-bold mb-1 block">Your dua</label><Textarea rows={4} placeholder="Write your dua..." value={newDua.text} onChange={e=>setNewDua(d=>({...d,text:e.target.value}))} className="resize-none" /></div>
          </div>
          <DialogFooter><Button onClick={()=>createPersonal()} disabled={!newDua.title || !newDua.text}>Save Dua</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function HadithTab() {
  const [search, setSearch] = useState('')
  const { data: hadithOfDay } = useQuery({queryKey:['hadith','day'],queryFn:()=>api.get('/quran/hadith/of-the-day').then(r=>r.data).catch(()=>null)})
  const { data: results=[] } = useQuery({queryKey:['hadith','search',search],queryFn:()=>search.length>=2?api.get(`/quran/hadith/search?q=${encodeURIComponent(search)}`).then(r=>r.data).catch(()=>[]):[],enabled:search.length>=2})
  const { data: allHadiths=[] } = useQuery({queryKey:['hadith','all'],queryFn:()=>api.get('/quran/hadith').then(r=>r.data).catch(()=>[])})
  const displayed = search.length>=2?results:allHadiths

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
      {hadithOfDay && (
        <Card className="p-5 bg-card border-border shadow-sm">
          <p className="text-[10px] font-black uppercase tracking-widest text-primary mb-4">Hadith of the day</p>
          {hadithOfDay.arabic_text && <p className="font-amiri text-2xl leading-loose text-right rtl text-foreground mb-4">{hadithOfDay.arabic_text}</p>}
          <p className="text-sm font-medium text-foreground leading-relaxed mb-4 bg-muted/40 p-4 rounded-xl border border-border/50">{hadithOfDay.english_text}</p>
          <div className="flex flex-wrap items-center justify-between gap-4 mt-2">
            <div className="flex items-center gap-3">
              <Badge variant="outline" className={cn("text-[9px] uppercase font-black border-0 tracking-widest", GRADE_STYLES[hadithOfDay.grade]?.bg)}>{GRADE_STYLES[hadithOfDay.grade]?.label}</Badge>
              <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest truncate">{hadithOfDay.narrator_chain}</span>
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground bg-muted px-2 py-1 rounded-md">{hadithOfDay.collection} #{hadithOfDay.hadith_number}</span>
          </div>
        </Card>
      )}

      <Input placeholder="Search hadiths..." value={search} onChange={e=>setSearch(e.target.value)} icon={<Search className="h-4 w-4 text-muted-foreground" />} className="h-11" />
      
      <div className="space-y-4">
        {displayed.map(h=>(
          <Card key={h.id} className="p-5">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-border/50">
              <Badge variant="outline" className={cn("text-[9px] uppercase font-black border-0 tracking-widest", GRADE_STYLES[h.grade]?.bg)}>{GRADE_STYLES[h.grade]?.label}</Badge>
              <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground bg-muted px-2 py-1 rounded-md">{h.collection} #{h.hadith_number}</span>
            </div>
            {h.arabic_text && <p className="font-amiri text-xl leading-loose text-right rtl text-foreground mb-4">{h.arabic_text}</p>}
            <p className="text-[13px] font-medium text-foreground leading-relaxed mb-4">{h.english_text}</p>
            {h.narrator_chain && <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest mt-2">— {h.narrator_chain}</p>}
            {h.grade==='daif' && <p className="text-[10px] uppercase font-black tracking-widest text-orange-600 bg-orange-500/10 border border-orange-500/20 p-2 rounded-lg mt-4 flex items-center gap-2 pr-4"><AlertTriangle className="h-3 w-3 shrink-0" /> Da'if hadith — treat with caution and do not cite as religious obligation.</p>}
          </Card>
        ))}
        {displayed.length === 0 && <p className="text-sm font-medium text-muted-foreground text-center py-8">No hadiths found.</p>}
      </div>
    </div>
  )
}

function StatsTab() {
  const { data: stats } = useQuery({queryKey:['quran','stats'],queryFn:()=>api.get('/quran/stats').then(r=>r.data).catch(()=>null)})
  const { data: hifz=[] } = useQuery({queryKey:['quran','hifz'],queryFn:()=>api.get('/quran/hifz').then(r=>r.data).catch(()=>[])})
  const { data: readingLogs=[] } = useQuery({queryKey:['quran','reading-log'], queryFn:()=>api.get('/quran/reading-log', { params: { days: 120 }}).then(r=>r.data).catch(()=>[])})
  const memorised  = hifz.filter(h=>h.status==='memorised').length
  const inProgress = hifz.filter(h=>h.status==='in_progress').length
  const streak = getReadingStreak(readingLogs)
  const heatmapData = Object.entries(readingLogs.reduce((acc, log) => {
    acc[log.log_date] = (acc[log.log_date] || 0) + (log.verses_read || 0)
    return acc
  }, {})).map(([date, count]) => ({ date, count }))

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
      <Card className="p-5 sm:p-6 bg-gradient-to-br from-primary/10 to-teal-500/5 border-primary/20">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-sm font-black uppercase tracking-widest text-primary">Khatam progress</h3>
          <div className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 bg-red-500/10 text-red-500">
            <Flame className="h-4 w-4" />
            <span className="text-[10px] font-black uppercase tracking-widest">{streak} day streak</span>
          </div>
        </div>
        <div className="flex items-center gap-6">
          <div className="shrink-0 relative w-24 h-24 flex items-center justify-center rounded-full bg-background border border-border shadow-sm">
             <svg className="absolute inset-0 w-full h-full -rotate-90">
               <circle cx="48" cy="48" r="44" fill="none" stroke="currentColor" strokeWidth="6" className="text-muted" />
               <circle cx="48" cy="48" r="44" fill="none" stroke="currentColor" strokeWidth="6" className="text-primary transition-all duration-1000 ease-out" strokeDasharray={276.46} strokeDashoffset={276.46 - (276.46 * (stats?.khatam_progress_pct||0)) / 100} strokeLinecap="round" />
             </svg>
             <span className="text-xl font-black text-foreground relative z-10">{Math.round(stats?.khatam_progress_pct||0)}%</span>
          </div>
          <div>
            <p className="text-3xl font-black text-foreground drop-shadow-sm">{(stats?.total_verses_read||0).toLocaleString()}<span className="text-sm font-bold text-muted-foreground ml-1 p-1 bg-muted rounded-md shadow-inner">/ 6,236</span></p>
            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mt-2">Verses read all-time</p>
            {stats?.projected_khatam_days && <Badge className="mt-3 bg-primary text-primary-foreground border-0 text-[9px] uppercase font-black">At your pace: ~{stats.projected_khatam_days} days</Badge>}
          </div>
        </div>
      </Card>
      
      <div className="grid grid-cols-3 gap-3">
        {[['Verses',stats?.verses_this_month||0,'this month'],['Minutes',stats?.minutes_this_month||0,'reading'],['Listened',stats?.total_minutes_listened||0,'total']].map(([l,v,s])=>(
          <Card key={l} className="p-3 text-center flex flex-col items-center justify-center">
            <p className="text-2xl font-black text-foreground mb-1">{v.toLocaleString()}</p>
            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{l}</p>
            <p className="text-[9px] font-bold text-muted-foreground/70 uppercase tracking-widest mt-0.5">{s}</p>
          </Card>
        ))}
      </div>
      
      {stats && (
        <Card className="p-5 flex items-center justify-between">
          <div>
             <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Daily average</p>
             <p className="text-2xl font-black text-foreground">{stats.avg_daily_minutes} <span className="text-sm">min</span></p>
          </div>
          <Badge variant="secondary" className="text-[9px] uppercase font-black tracking-widest h-8">{stats.sessions_this_month} sessions this month</Badge>
        </Card>
      )}

      <Card className="p-5 sm:p-6 overflow-hidden">
        <h3 className="text-sm font-black uppercase tracking-widest text-foreground mb-4">Reading Activity</h3>
        <div className="w-[150%] md:w-full -ml-[25%] md:ml-0">
          <CalendarHeatmap
            startDate={new Date(Date.now() - 119 * 24 * 60 * 60 * 1000)}
            endDate={new Date()}
            values={heatmapData}
            classForValue={(value) => {
              if (!value) return 'color-empty opacity-20 fill-border'
              if (value.count < 25) return 'fill-primary opacity-30'
              if (value.count < 75) return 'fill-primary opacity-50'
              if (value.count < 150) return 'fill-primary opacity-70'
              return 'fill-primary opacity-100'
            }}
          />
        </div>
        <div className="flex justify-between items-center mt-3">
          <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Less</span>
          <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">More</span>
        </div>
      </Card>

      <Card className="p-5 sm:p-6">
        <h3 className="text-sm font-black uppercase tracking-widest text-foreground mb-4">Hifz summary</h3>
        <div className="grid grid-cols-2 gap-4">
          {[['Memorised',memorised,'text-green-600 bg-green-500/10 border-green-500/20'],['In progress',inProgress,'text-orange-500 bg-orange-500/10 border-orange-500/20']].map(([label,count,classes])=>(
            <div key={label} className={cn("text-center p-4 rounded-2xl border", classes)}>
              <p className="text-3xl font-black mb-1">{count}</p>
              <p className="text-[10px] font-black uppercase tracking-widest opacity-80">{label}</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}

function PracticeTab() {
  const [recording, setRecording] = useState(false)
  const [mediaRecorder, setMediaRecorder] = useState(null)
  const [sessions, setSessions] = useState([])
  const [selectedSurah, setSelectedSurah] = useState(1)
  const [selectedAyah, setSelectedAyah] = useState(1)
  const [processing, setProcessing] = useState(false)
  const [localSessions, setLocalSessions] = useState([])
  const { data: surahs=[] } = useQuery({ queryKey:['quran','surahs'], queryFn:()=>api.get('/quran/surahs').then(r=>r.data), staleTime: 24*60*60_000 })
  const { data: mySessions=[] } = useQuery({ queryKey:['recitation','sessions'], queryFn:()=>api.get('/recitation/sessions').then(r=>r.data).catch(()=>[]) })

  useEffect(() => {
    offlineDB.getRecentRecitations(10).then(setLocalSessions).catch(() => {})
  }, [])

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const rec = new MediaRecorder(stream)
      const chunks = []
      rec.ondataavailable = e => chunks.push(e.data)
      rec.onstop = async () => {
        setProcessing(true)
        const blob = new Blob(chunks, { type: 'audio/webm' })
        try {
          await offlineDB.saveRecitation({ surah_id: selectedSurah, ayah_id: selectedAyah, blob, uploaded: false })
          const recent = await offlineDB.getRecentRecitations(10)
          setLocalSessions(recent)
        } catch {}
        const form = new FormData()
        form.append('audio', blob, 'recitation.webm')
        form.append('surah_number', selectedSurah)
        form.append('ayah_number', selectedAyah)
        try {
          const res = await api.post('/recitation/sessions', form, { headers: { 'Content-Type': 'multipart/form-data' } })
          setSessions(s => [res.data, ...s])
          toast.success('Recitation analysed!')
        } catch {
          toast.error('Analysis failed — check your connection')
        }
        setProcessing(false)
        stream.getTracks().forEach(t => t.stop())
      }
      rec.start()
      setMediaRecorder(rec)
      setRecording(true)
    } catch {
      toast.error('Microphone permission denied')
    }
  }

  const stopRecording = () => { mediaRecorder?.stop(); setRecording(false); setMediaRecorder(null) }
  const allSessions = [...sessions, ...mySessions].slice(0, 20)

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
      <Card className="p-5 sm:p-6 bg-gradient-to-br from-purple-600/10 to-blue-500/5 border-purple-500/20">
        <h3 className="text-lg font-bold text-foreground mb-1 flex items-center gap-2"><Mic className="h-5 w-5 text-purple-600" /> Recitation Practice</h3>
        <p className="text-sm font-medium text-muted-foreground mb-6">Record yourself reciting an ayah. Our AI will check your Tajweed and pronunciation.</p>

        <div className="grid grid-cols-2 gap-4 mb-6">
          <div><label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground block mb-1.5">Surah</label>
            <Select value={selectedSurah} onChange={e=>setSelectedSurah(Number(e.target.value))} options={surahs.map(s=>({label:`${s.id}. ${s.name_simple}`, value:s.id}))} className="bg-background" />
          </div>
          <div><label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground block mb-1.5">Ayah #</label>
            <Input type="number" min="1" max="286" value={selectedAyah} onChange={e=>setSelectedAyah(Number(e.target.value))} className="bg-background" />
          </div>
        </div>

        <Button onClick={recording ? stopRecording : startRecording} disabled={processing} size="lg" className={cn("w-full h-14 text-base font-bold transition-all", recording ? "bg-red-500 hover:bg-red-600 text-white animate-pulse" : "bg-purple-600 hover:bg-purple-700 text-white")}>
          {processing ? '⏳ Analysing...' : recording ? <><StopCircle className="h-5 w-5 mr-2" /> Stop Recording</> : <><Mic className="h-5 w-5 mr-2" /> Start Recording</>}
        </Button>
      </Card>

      {localSessions.length > 0 && (
        <Card className="p-5 sm:p-6">
          <h3 className="text-sm font-black uppercase tracking-widest text-foreground mb-4">Offline Recordings</h3>
          <div className="space-y-2">
            {localSessions.map((session) => (
              <div key={session.id} className="flex items-center justify-between rounded-xl border border-border bg-muted/30 px-3 py-2">
                <div>
                  <p className="text-sm font-bold text-foreground">Surah {session.surah_id} • Ayah {session.ayah_id}</p>
                  <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{new Date(session.created_at).toLocaleString()}</p>
                </div>
                <Badge variant="secondary" className="text-[9px] uppercase font-black tracking-widest">{session.uploaded ? 'Synced' : 'Local'}</Badge>
              </div>
            ))}
          </div>
        </Card>
      )}

      {allSessions.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-sm font-black uppercase tracking-widest text-muted-foreground">Recent Sessions</h3>
          <div className="space-y-3">
            {allSessions.map((s, i) => (
              <Card key={s.id || i} className="p-5">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <p className="font-bold text-sm text-foreground mb-0.5">Surah {s.surah_number} • Ayah {s.ayah_number}</p>
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{s.created_at ? new Date(s.created_at).toLocaleDateString() : 'Just now'}</p>
                  </div>
                  {s.overall_score != null && (
                    <div className="text-center bg-muted/50 py-1.5 px-3 rounded-lg border border-border/50">
                      <p className={cn("text-xl font-black", s.overall_score>=80 ? 'text-green-500' : s.overall_score>=60 ? 'text-orange-500' : 'text-red-500')}>{Math.round(s.overall_score)}%</p>
                      <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Accuracy</p>
                    </div>
                  )}
                </div>
                {s.feedback && <p className="text-sm font-medium text-foreground bg-muted p-4 rounded-xl leading-relaxed mb-4 border border-border/50">{s.feedback}</p>}
                {s.tajweed_errors?.length > 0 && (
                  <div className="bg-orange-500/5 p-4 rounded-xl border border-orange-500/20">
                    <p className="text-[10px] font-black uppercase tracking-widest text-orange-600 mb-2">Tajweed Notes</p>
                    <ul className="space-y-1.5">
                      {s.tajweed_errors.map((err, ei) => <li key={ei} className="text-xs font-bold text-orange-700/80 dark:text-orange-300 flex items-start gap-2"><span className="text-orange-500 shrink-0 mt-0.5">•</span> {err}</li>)}
                    </ul>
                  </div>
                )}
              </Card>
            ))}
          </div>
        </div>
      )}

      {allSessions.length === 0 && !recording && (
        <div className="text-center py-16 px-4 border-2 border-dashed border-border rounded-3xl bg-muted/30">
          <span className="text-5xl block mb-4">🎙️</span>
          <p className="text-sm font-bold text-foreground mb-1">No sessions yet</p>
          <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Start with Al-Fatihah, Surah 1, Ayah 1</p>
        </div>
      )}
    </div>
  )
}

export default function QuranPage() {
  const urlState = useMemo(() => (typeof window !== 'undefined' ? getQuranUrlState() : { tab: 'reader', surahId: null, ayahId: null }), [])
  const [tab, setTab] = useStickyState(urlState.tab || 'reader', 'q_tab')
  const [activeSurahId, setActiveSurahId] = useState(urlState.surahId)
  const [activeAyahId, setActiveAyahId] = useState(urlState.ayahId)
  const audio = useAudio()
  const ctx = getIslamicContext()
  const { data: surahs=[] } = useQuery({ queryKey:['quran','surahs'], queryFn: ()=>api.get('/quran/surahs').then(r=>r.data), staleTime: 24*60*60_000 })
  const activeSurah = surahs.find((surah) => surah.id === activeSurahId) || null

  useEffect(()=>{
    const token = localStorage.getItem('access_token')
    if (!token) return
    api.post('/quran/duas/seed').catch(()=>{})
    api.post('/quran/hadith/seed').catch(()=>{})
  },[])

  useEffect(() => {
    syncQuranUrl({ tab, surahId: activeSurahId, ayahId: activeAyahId })
  }, [tab, activeAyahId, activeSurahId])

  useEffect(() => {
    const handlePopState = () => {
      const state = getQuranUrlState()
      setTab(state.tab || 'reader')
      setActiveSurahId(state.surahId)
      setActiveAyahId(state.ayahId)
    }
    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [setTab])

  const openReader = ({ surahId, ayahId = null }) => {
    setTab('reader')
    setActiveSurahId(surahId)
    setActiveAyahId(ayahId)
    offlineDB.saveQuranPosition('me', surahId, ayahId || 1, null).catch(() => {})
  }

  const closeReader = () => {
    setActiveSurahId(null)
    setActiveAyahId(null)
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 md:py-8 space-y-6">
      <style>{TAJWEED_CSS}</style>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Quran</h1>
          <p className="text-[10px] font-black uppercase tracking-widest text-primary mt-1">{ctx.formatted}</p>
        </div>
        {audio.currentV && (
          <div className="flex gap-1 bg-muted p-1 rounded-lg">
            {[0.75,1.0,1.25,1.5].map(s=><button key={s} onClick={()=>audio.changeSpeed(s)} className={cn("px-2 py-1 rounded text-[10px] font-black uppercase tracking-widest transition-colors", audio.speed===s ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground")}>{s}x</button>)}
          </div>
        )}
      </div>

      <div className="flex overflow-x-auto p-1 rounded-xl bg-muted gap-1 scrollbar-none w-full sm:w-fit">
        {TABS.map(t=><button key={t} onClick={()=>setTab(t)} className={cn('flex-1 min-w-[70px] px-3 py-2 rounded-lg text-xs font-bold transition-all capitalize whitespace-nowrap', tab===t ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground')}>{TAB_LABELS[t]}</button>)}
      </div>

      <div className="pt-2">
        {tab==='reader' && !activeSurah && (
          <div className="mb-6 animate-in slide-in-from-top-2">
             <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-2 block">Select Reciter Library</label>
             <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {RECITERS.map(r=><button key={r.id} onClick={()=>audio.setReciterId(r.id)} className={cn("px-4 py-3 rounded-xl border flex flex-col items-center justify-center text-center transition-all", audio.reciterId===r.id ? "bg-primary/5 border-primary/40 text-primary shadow-sm" : "bg-card border-border text-muted-foreground hover:bg-muted")}>
                   <Mic className="h-4 w-4 mb-1.5 opacity-60" />
                   <span className="text-xs font-bold leading-tight">{r.name}</span>
                </button>)}
             </div>
          </div>
        )}
        {tab==='reader' && (activeSurah ? <SurahReader surah={activeSurah} onBack={closeReader} audio={audio} scrollToAyah={activeAyahId}/> : <SurahPicker onSelect={openReader}/>)}
        {tab==='hifz' && <HifzTab/>}
        {tab==='duas' && <DuaTab/>}
        {tab==='hadith' && <HadithTab/>}
        {tab==='stats' && <StatsTab/>}
        {tab==='practice' && <PracticeTab/>}
      </div>
      
      <MiniPlayer audio={audio} surahName={activeSurah?.name_simple}/>
    </div>
  )
}
