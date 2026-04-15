import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  BookOpen, Search, ChevronLeft, Play, Pause, SkipForward,
  Maximize2, Minimize2, BookMarked, ChevronDown, Plus, Star, Eye, EyeOff,
  Mic, MicOff, Timer, ChevronRight, Volume2, StopCircle
} from 'lucide-react'
import api from '../lib/api'
import { useAuthStore } from '../store/authStore'
import { Card, Button, Skeleton, Modal, ProgressRing } from '../components/ui/index'
import { getIslamicContext } from '../lib/hijri'
import toast from 'react-hot-toast'

const TABS = ['reader', 'hifz', 'duas', 'hadith', 'stats', 'practice']
const TAB_LABELS = { reader: 'Reader', hifz: 'Hifz', duas: 'Duas', hadith: 'Hadith', stats: 'Stats', practice: 'Practice' }

const RECITERS = [
  { id: 7,  name: 'Mishary Alafasy',      slug: 'mishary_rashid_alafasy' },
  { id: 1,  name: 'Abdul Rahman Sudais',  slug: 'abdurrahmaan_as_sudais' },
  { id: 2,  name: 'Abu Bakr al-Shatri',  slug: 'abu_bakr_ash_shatri' },
  { id: 5,  name: 'Mahmoud al-Husary',   slug: 'mahmoud_khaleel_al_husary' },
  { id: 10, name: 'Mohamed al-Minshawi', slug: 'minshawi_murattal' },
]

const READING_MODES = [
  { id: 'scroll', label: 'Scroll', icon: '📜' },
  { id: 'page',   label: 'Page',   icon: '📖' },
  { id: 'hifz',  label: 'Hifz',  icon: '🧠' },
]

const TAJWEED_COLORS = {
  ghunna:   '#f97316',
  ikhfa:    '#22c55e',
  idgham:   '#3b82f6',
  iqlab:    '#a855f7',
  qalqalah: '#ef4444',
  madd:     '#eab308',
}

const HIGHLIGHT_COLORS = ['gold','green','blue','red','purple']
const HIFZ_MODES = ['Listen & Repeat','Read & Cover','Fill the Blank','Full Recall']
const SM2_LABELS = ['Forgot','Wrong','Hard','OK','Good','Perfect']
const SM2_COLORS = ['#ef4444','#f97316','#eab308','#3b82f6','#22c55e','#16a34a']

const GRADE_STYLES = {
  sahih:   { bg: 'rgba(22,163,74,0.12)',   color: '#16a34a', label: 'Sahih \u2713' },
  hasan:   { bg: 'rgba(59,130,246,0.12)',  color: '#3b82f6', label: 'Hasan' },
  daif:    { bg: 'rgba(245,158,11,0.12)',  color: '#d97706', label: "Da'if \u26a0" },
  mawdu:   { bg: 'rgba(239,68,68,0.12)',   color: '#ef4444', label: 'Mawdu \u2717' },
  unknown: { bg: 'rgba(107,114,128,0.12)', color: '#6b7280', label: 'Unknown' },
}

function useAudio() {
  const audioRef = useRef(null)
  const sleepTimerRef = useRef(null)
  const [playing,   setPlaying]   = useState(false)
  const [speed,     setSpeed]     = useState(1.0)
  const [currentV,  setCurrentV]  = useState(null)
  const [reciterId, setReciterId] = useState(7)
  const [sleepTimer, setSleepTimer] = useState(null) // null | {remaining, label}

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
        toast.success('Sleep timer ended — audio stopped 🌙')
      }, minutes * 60 * 1000)
    }
  }, [])

  const cancelSleepTimer = useCallback(() => {
    if (sleepTimerRef.current) clearTimeout(sleepTimerRef.current)
    setSleepTimer(null)
  }, [])

  return { playing, speed, currentV, reciterId, setReciterId, playVerse, pause, resume, changeSpeed, sleepTimer, startSleepTimer, cancelSleepTimer }
}

function MiniPlayer({ audio, surahName }) {
  if (!audio.currentV) return null
  const { surah, ayah } = audio.currentV
  return (
    <div style={{ position:'fixed', bottom:'calc(var(--nav-h) + 8px)', left:8, right:8, zIndex:30, background:'var(--t-bg-sidebar)', border:'0.5px solid var(--t-border)', borderRadius:14, padding:'10px 14px', display:'flex', alignItems:'center', gap:12, boxShadow:'var(--shadow-2)' }}>
      <div style={{flex:1, minWidth:0}}>
        <p style={{fontSize:12, fontWeight:600, color:'var(--t-text)'}}>{surahName || `Surah ${surah}`} \u2014 Verse {ayah}</p>
        <p style={{fontSize:11, color:'var(--t-text-muted)'}}>{RECITERS.find(r=>r.id===audio.reciterId)?.name} \xb7 {audio.speed}\xd7</p>
      </div>
      <button onClick={audio.playing ? audio.pause : audio.resume}
        style={{width:36,height:36,borderRadius:'50%',background:'var(--t-primary)',border:'none',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',color:'white'}}>
        {audio.playing ? <Pause size={16}/> : <Play size={16}/>}
      </button>
    </div>
  )
}

function SurahPicker({ onSelect }) {
  const [search, setSearch] = useState('')
  const { data: surahs=[], isLoading } = useQuery({
    queryKey:['quran','surahs'],
    queryFn: ()=>api.get('/quran/surahs').then(r=>r.data),
    staleTime: 24*60*60_000,
  })
  const filtered = surahs.filter(s =>
    s.name_simple.toLowerCase().includes(search.toLowerCase()) ||
    String(s.id).includes(search) ||
    s.translated_name?.name?.toLowerCase().includes(search.toLowerCase())
  )
  return (
    <div>
      <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:12}}>
        <Search size={16} style={{color:'var(--t-text-muted)',flexShrink:0}}/>
        <input className="input" placeholder="Search surah\u2026" value={search} onChange={e=>setSearch(e.target.value)}/>
      </div>
      {isLoading ? [...Array(8)].map((_,i)=><Skeleton key={i} className="h-12 mb-2"/>) : (
        <div style={{maxHeight:'65vh',overflowY:'auto'}}>
          {filtered.map(s => (
            <button key={s.id} onClick={()=>onSelect(s)}
              style={{width:'100%',display:'flex',alignItems:'center',gap:12,padding:'10px 12px',borderRadius:10,border:'none',background:'none',cursor:'pointer',textAlign:'left'}}
              onMouseEnter={e=>e.currentTarget.style.background='var(--t-border)'}
              onMouseLeave={e=>e.currentTarget.style.background='none'}
            >
              <div style={{width:36,height:36,borderRadius:8,background:'var(--t-border)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:12,fontWeight:700,color:'var(--t-text-muted)',flexShrink:0}}>{s.id}</div>
              <div style={{flex:1,minWidth:0}}>
                <p style={{fontWeight:600,fontSize:14,color:'var(--t-text)'}}>{s.name_simple}</p>
                <p style={{fontSize:11,color:'var(--t-text-muted)'}}>{s.translated_name?.name} \xb7 {s.verses_count} verses \xb7 {s.revelation_place}</p>
              </div>
              <span style={{fontFamily:'Amiri,serif',fontSize:18,color:'var(--t-accent)'}}>{s.name_arabic}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function SurahReader({ surah, onBack, audio }) {
  const qc = useQueryClient()
  const [showTrans,    setShowTrans]    = useState(true)
  const [showTranslit, setShowTranslit] = useState(false)
  const [showTajweed,  setShowTajweed]  = useState(false)
  const [showGrammar,  setShowGrammar]  = useState(false)
  const [readingMode,  setReadingMode]  = useState('scroll')
  const [focusMode,    setFocusMode]    = useState(false)
  const [bookmarkSheet,setBookmarkSheet]= useState(null)
  const [noteText,     setNoteText]     = useState('')
  const [hlColor,      setHlColor]      = useState('gold')
  const [tafsirVerse,  setTafsirVerse]  = useState(null)
  const [grammarWord,  setGrammarWord]  = useState(null)
  const [translationId, setTranslationId] = useState(20)
  const [showSleepTimer, setShowSleepTimer] = useState(false)
  const sessionStart = useRef(Date.now())
  const versesRead   = useRef(0)

  const { data: verseData, isLoading } = useQuery({
    queryKey:['quran','surah',surah.id, translationId],
    queryFn: ()=>api.get(`/quran/surah/${surah.id}?translation_id=${translationId}`).then(r=>r.data),
    staleTime:30*60_000,
  })
  const { data: bookmarks=[] } = useQuery({
    queryKey:['quran','bookmarks'],
    queryFn: ()=>api.get('/quran/bookmarks').then(r=>r.data).catch(()=>[]),
  })

  useEffect(()=>{
    return ()=>{
      const mins = Math.round((Date.now()-sessionStart.current)/60_000)
      const v = verseData?.verses?.length || 0
      if (mins<1||versesRead.current<1) return
      api.post('/quran/reading-log',{surah_from:surah.id,ayah_from:1,surah_to:surah.id,ayah_to:v,verses_read:Math.min(versesRead.current,v),minutes_read:mins,mode:'reading'}).catch(()=>{})
    }
  },[surah.id,verseData])

  const addBookmark = async (surahNum, ayahNum) => {
    const existing = bookmarks.find(b=>b.surah_number===surahNum&&b.ayah_number===ayahNum)
    if (existing) { await api.delete(`/quran/bookmarks/${existing.id}`); toast.success('Bookmark removed'); qc.invalidateQueries({queryKey:['quran','bookmarks']}); return }
    setBookmarkSheet({surahNum,ayahNum}); setNoteText(''); setHlColor('gold')
  }

  const saveBookmark = async () => {
    await api.post('/quran/bookmarks',{surah_number:bookmarkSheet.surahNum,ayah_number:bookmarkSheet.ayahNum,note:noteText||null,highlight_color:hlColor})
    qc.invalidateQueries({queryKey:['quran','bookmarks']}); toast.success('Bookmarked!'); setBookmarkSheet(null)
  }

  const verses = verseData?.verses || []

  const AyahList = () => verses.map((v,i) => {
    const ayahNum = v.verse_number
    const isPlaying = audio.currentV?.surah===surah.id&&audio.currentV?.ayah===ayahNum&&audio.playing
    const isHighlighted = audio.currentV?.surah===surah.id&&audio.currentV?.ayah===ayahNum
    const isBookmarked = bookmarks.some(b=>b.surah_number===surah.id&&b.ayah_number===ayahNum)
    const [revealed, setRevealed] = useState(false)
    const arabicText = v.text_uthmani||v.text_imlaei||''
    // Use API words array or fallback
    const words = v.words?.filter(w => w.char_type_name === 'word') || arabicText.split(' ').map(w => ({ text_uthmani: w }))
    return (
      <div key={i} id={`ayah-${ayahNum}`} style={{padding:'16px 0',borderBottom:'0.5px solid var(--t-border)',background:isHighlighted?'rgba(201,135,10,0.08)':'transparent',transition:'background 0.3s'}}>
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:10}}>
          <div style={{display:'flex',gap:8}}>
            <button onClick={()=>{versesRead.current++;isPlaying?audio.pause():audio.playVerse(surah.id,ayahNum, v.audio?.url)}}
              style={{width:28,height:28,borderRadius:'50%',background:isPlaying?'var(--t-accent)':'var(--t-border)',border:'none',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center'}}>
              {isPlaying?<Pause size={12} color="white"/>:<Play size={12} style={{color:'var(--t-text-muted)'}}/>}
            </button>
            <button onClick={()=>addBookmark(surah.id,ayahNum)}
              style={{width:28,height:28,borderRadius:'50%',background:'transparent',border:'none',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center'}}>
              <BookMarked size={14} style={{color:isBookmarked?'var(--t-accent)':'var(--t-text-muted)'}} fill={isBookmarked?'currentColor':'none'}/>
            </button>
            <button onClick={()=>setTafsirVerse({surahNum: surah.id, ayahNum, text: arabicText, trans: v.translations?.[0]?.text?.replace(/<[^>]+>/g,'')})}
              style={{width:28,height:28,borderRadius:'50%',background:'transparent',border:'none',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',fontSize:11,color:'var(--t-text-muted)'}} title="View Tafsir">
              📖
            </button>
          </div>
          <div style={{width:28,height:28,borderRadius:'50%',background:'var(--t-accent)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:11,fontWeight:600,color:'white'}}>{ayahNum}</div>
        </div>
        {readingMode==='hifz' ? (
          <div onClick={()=>setRevealed(r=>!r)} style={{cursor:'pointer'}}>
            {revealed
              ? <p style={{fontFamily:'Amiri,serif',fontSize:'calc(1.5rem * var(--t-quran-scale,1.2))',lineHeight:2.2,textAlign:'right',direction:'rtl',color:'var(--t-text)'}}>{arabicText}</p>
              : <div style={{borderRadius:10,height:56,background:'var(--t-border)',display:'flex',alignItems:'center',justifyContent:'center',color:'var(--t-text-muted)',fontSize:13}}>Tap to reveal</div>
            }
          </div>
        ) : showGrammar ? (
          <div style={{textAlign:'right',direction:'rtl',lineHeight:2.5, display: 'flex', flexWrap: 'wrap', flexDirection: 'row-reverse', gap: 6}}>
            {words.map((w, wi) => (
              <div key={wi} onClick={()=>setGrammarWord({word: w.text_uthmani || w.text, trans: w.translation?.text, translit: w.transliteration?.text, ayah: ayahNum, index: wi, surahName: surah.name_simple})}
                style={{cursor:'pointer',padding:'4px 8px',borderRadius:8,background:'rgba(59,130,246,0.06)',border:'0.5px solid rgba(59,130,246,0.15)',display:'flex',flexDirection:'column',alignItems:'center',gap:4}}
                onMouseEnter={e=>e.currentTarget.style.background='rgba(59,130,246,0.12)'}
                onMouseLeave={e=>e.currentTarget.style.background='rgba(59,130,246,0.06)'}>
                <span style={{fontFamily:'Amiri,serif',fontSize:'calc(1.3rem * var(--t-quran-scale,1.2))',color:'var(--t-text)'}}>{w.text_uthmani || w.text}</span>
                {showTranslit && w.transliteration?.text && <span style={{fontSize:10,color:'var(--t-accent)',fontStyle:'italic'}}>{w.transliteration.text}</span>}
                <span style={{fontSize:11,color:'var(--t-text-muted)'}}>{w.translation?.text || '—'}</span>
              </div>
            ))}
          </div>
        ) : (
          <p style={{fontFamily:'Amiri,serif',fontSize:'calc(1.5rem * var(--t-quran-scale,1.2))',lineHeight:2.2,textAlign:'right',direction:'rtl',color:'var(--t-text)',wordSpacing:'0.15em'}}>
            {arabicText}
          </p>
        )}
        {showTrans&&v.translations?.[0] && <p style={{fontSize:'0.9rem',color:'var(--t-text-muted)',marginTop:8,lineHeight:1.7}}>{v.translations[0].text?.replace(/<[^>]+>/g,'')}</p>}
      </div>
    )
  })

  const readerContent = (
    <>
      {isLoading ? [...Array(5)].map((_,i)=><Skeleton key={i} className="h-24 mb-4"/>) : <AyahList/>}
    </>
  )

  return (
    <div>
      {!focusMode && (
        <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:12,flexWrap:'wrap'}}>
          <button onClick={onBack} style={{background:'none',border:'none',cursor:'pointer',color:'var(--t-primary)',display:'flex',alignItems:'center',gap:4,fontSize:13}}>
            <ChevronLeft size={16}/> Back
          </button>
          <div style={{flex:1}}>
            <p style={{fontWeight:700,fontSize:16,color:'var(--t-text)'}}>{surah.name_simple}</p>
            <p style={{fontSize:12,color:'var(--t-text-muted)'}}>{surah.translated_name?.name} \xb7 {surah.verses_count} verses</p>
          </div>
          {[['Trans',showTrans,setShowTrans],['Latin',showTranslit,setShowTranslit],['Tajweed',showTajweed,setShowTajweed],['Grammar',showGrammar,setShowGrammar]].map(([label,active,toggle])=>(
            <button key={label} onClick={()=>toggle(v=>!v)}
              style={{padding:'4px 10px',borderRadius:8,border:'0.5px solid',borderColor:active?'var(--t-primary)':'var(--t-border)',background:active?'rgba(20,168,96,0.1)':'var(--t-bg-card)',fontSize:11,color:active?'var(--t-primary)':'var(--t-text-muted)',cursor:'pointer'}}>
              {label}
            </button>
          ))}
          <select value={translationId} onChange={e=>setTranslationId(Number(e.target.value))} style={{padding:'4px 8px',borderRadius:8,border:'0.5px solid var(--t-border)',background:'var(--t-bg-card)',fontSize:11,color:'var(--t-text-muted)',cursor:'pointer'}}>
            <option value={20}>Sahih International</option>
            <option value={131}>Clear Quran</option>
          </select>
          <button onClick={()=>setShowSleepTimer(v=>!v)} style={{padding:'4px 8px',borderRadius:8,border:'0.5px solid',borderColor:audio.sleepTimer?'#a855f7':'var(--t-border)',background:audio.sleepTimer?'rgba(168,85,247,0.1)':'var(--t-bg-card)',cursor:'pointer',color:audio.sleepTimer?'#a855f7':'var(--t-text-muted)'}} title="Sleep timer">
            <Timer size={14}/>
          </button>
          <button onClick={()=>setFocusMode(true)} style={{padding:'4px 8px',borderRadius:8,border:'0.5px solid var(--t-border)',background:'var(--t-bg-card)',cursor:'pointer',color:'var(--t-text-muted)'}}><Maximize2 size={14}/></button>
        </div>
      )}

      {focusMode && (
        <div style={{position:'fixed',inset:0,background:'var(--t-bg)',zIndex:50,overflowY:'auto',padding:'20px 16px'}}>
          <button onClick={()=>setFocusMode(false)} style={{position:'fixed',top:16,right:16,background:'var(--t-bg-card)',border:'0.5px solid var(--t-border)',borderRadius:8,padding:'6px 10px',cursor:'pointer',color:'var(--t-text-muted)'}}>
            <Minimize2 size={16}/>
          </button>
          <div style={{maxWidth:680,margin:'0 auto',paddingTop:40}}>{readerContent}</div>
        </div>
      )}

      <div style={{display:'flex',gap:6,marginBottom:12}}>
        {READING_MODES.map(m=>(
          <button key={m.id} onClick={()=>setReadingMode(m.id)}
            style={{flex:1,padding:'7px 4px',borderRadius:10,border:'0.5px solid',borderColor:readingMode===m.id?'var(--t-primary)':'var(--t-border)',background:readingMode===m.id?'rgba(20,168,96,0.1)':'var(--t-bg-card)',cursor:'pointer',fontSize:12,color:readingMode===m.id?'var(--t-primary)':'var(--t-text-muted)'}}>
            {m.icon} {m.label}
          </button>
        ))}
      </div>

      {!focusMode && readerContent}

      {/* Sleep Timer Panel */}
      {showSleepTimer && (
        <div style={{marginBottom:12,padding:'12px 14px',borderRadius:12,background:'rgba(168,85,247,0.08)',border:'1px solid rgba(168,85,247,0.25)'}}>
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:10}}>
            <p style={{fontWeight:600,fontSize:13,color:'#a855f7'}}>🌙 Sleep Timer</p>
            {audio.sleepTimer && (
              <button onClick={audio.cancelSleepTimer} style={{padding:'3px 10px',borderRadius:8,background:'rgba(239,68,68,0.1)',border:'0.5px solid #ef4444',color:'#ef4444',fontSize:11,cursor:'pointer'}}>Cancel</button>
            )}
          </div>
          {audio.sleepTimer ? (
            <p style={{fontSize:13,color:'var(--t-text)'}}>Timer set: <strong>{audio.sleepTimer.label}</strong> — audio will stop automatically.</p>
          ) : (
            <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
              {[15,30,60].map(min => (
                <button key={min} onClick={()=>{audio.startSleepTimer(min);setShowSleepTimer(false)}}
                  style={{padding:'6px 14px',borderRadius:10,background:'rgba(168,85,247,0.1)',border:'0.5px solid rgba(168,85,247,0.3)',color:'#a855f7',fontSize:13,cursor:'pointer',fontWeight:600}}>
                  {min} min
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      <Modal open={!!bookmarkSheet} onClose={()=>setBookmarkSheet(null)} title="Add bookmark">
        <div className="space-y-4">
          <div>
            <p className="label">Colour</p>
            <div style={{display:'flex',gap:8}}>
              {HIGHLIGHT_COLORS.map(c=><button key={c} onClick={()=>setHlColor(c)} style={{width:28,height:28,borderRadius:'50%',border:`2px solid ${hlColor===c?'var(--t-text)':'transparent'}`,background:c,cursor:'pointer'}}/>)}
            </div>
          </div>
          <div><p className="label">Note (optional)</p><input className="input" placeholder="Your reflection\u2026" value={noteText} onChange={e=>setNoteText(e.target.value)}/></div>
          <Button variant="primary" className="w-full" onClick={saveBookmark}>Save bookmark</Button>
        </div>
      </Modal>

      {/* Tafsir Modal */}
      <Modal open={!!tafsirVerse} onClose={()=>setTafsirVerse(null)} title={`Tafsir Ibn Kathir — ${surah.name_simple} ${tafsirVerse?.ayahNum}`}>
        {tafsirVerse && <TafsirViewer surahNum={tafsirVerse.surahNum} ayahNum={tafsirVerse.ayahNum} arabicText={tafsirVerse.text} translation={tafsirVerse.trans} />}
      </Modal>

      {/* Grammar Word Modal */}
      <Modal open={!!grammarWord} onClose={()=>setGrammarWord(null)} title={`Word Analysis`}>
        {grammarWord && (
          <div className="space-y-4">
            <p style={{fontFamily:'Amiri,serif',fontSize:'3rem',textAlign:'center',color:'var(--t-text)',direction:'rtl'}}>{grammarWord.word}</p>
            <div style={{padding:'12px 14px',borderRadius:10,background:'var(--t-bg-card)',border:'0.5px solid var(--t-border)', textAlign: 'center'}}>
              <p style={{fontSize:16,fontWeight:600,color:'var(--t-accent)',marginBottom:6}}>{grammarWord.translit || '—'}</p>
              <p style={{fontSize:18,color:'var(--t-text)',marginBottom:12}}>{grammarWord.trans || '—'}</p>
              <div style={{padding:'10px',borderRadius:8,background:'rgba(59,130,246,0.1)',border:'1px solid rgba(59,130,246,0.2)'}}>
                 <p style={{fontSize:12,color:'var(--t-text-muted)'}}>Context: {grammarWord.surahName}, Ayah {grammarWord.ayah}</p>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}

function TafsirViewer({ surahNum, ayahNum, arabicText, translation }) {
  const { data: tafsirData, isLoading, isError } = useQuery({
    queryKey: ['quran', 'tafsir', surahNum, ayahNum],
    queryFn: () => api.get(`/quran/tafsir/${surahNum}/${ayahNum}`).then(r => r.data),
    staleTime: 60 * 60_000,
  })

  return (
    <div className="space-y-4" style={{ maxHeight: '75vh', overflowY: 'auto' }}>
      <div style={{ borderBottom: '1px solid var(--t-border)', paddingBottom: 16 }}>
        <p style={{fontFamily:'Amiri,serif',fontSize:'1.5rem',lineHeight:2.2,textAlign:'right',direction:'rtl',color:'var(--t-text)',marginBottom:10}}>{arabicText}</p>
        <p style={{fontSize:15,color:'var(--t-text-muted)',lineHeight:1.7}}>{translation}</p>
      </div>
      
      {isLoading ? (
        <div style={{padding: '20px 0'}}>
          <Skeleton className="h-6 w-3/4 mb-4" />
          <Skeleton className="h-4 w-full mb-2" />
          <Skeleton className="h-4 w-full mb-2" />
          <Skeleton className="h-4 w-5/6" />
        </div>
      ) : isError ? (
        <p style={{color:'#ef4444',fontSize:14}}>Failed to load Tafsir. Please check your connection.</p>
      ) : tafsirData?.tafsir?.text ? (
        <div 
          className="tafsir-content"
          style={{fontSize: 15, lineHeight: 1.8, color: 'var(--t-text)'}}
          dangerouslySetInnerHTML={{ __html: tafsirData.tafsir.text }}
        />
      ) : (
         <p style={{color:'var(--t-text-muted)',fontSize:14}}>No Tafsir available for this language/Ayah.</p>
      )}
    </div>
  )
}

function HifzTab() {
  const qc = useQueryClient()
  const [addModal,  setAddModal]  = useState(false)
  const [hifzMode,  setHifzMode]  = useState(0)
  const [dailyTarget, setDailyTarget] = useState(5)
  const [form, setForm] = useState({surah_number:1,surah_name:'Al-Fatihah',ayah_from:1,ayah_to:7,total_ayahs:7})
  const { data: entries=[], isLoading } = useQuery({queryKey:['quran','hifz'],queryFn:()=>api.get('/quran/hifz').then(r=>r.data).catch(()=>[])})
  const { data: dueToday=[] } = useQuery({queryKey:['quran','hifz','due'],queryFn:()=>api.get('/quran/hifz/due-today').then(r=>r.data).catch(()=>[])})
  const { mutate: addEntry } = useMutation({ mutationFn:()=>api.post('/quran/hifz',form), onSuccess:()=>{qc.invalidateQueries({queryKey:['quran','hifz']});setAddModal(false);toast.success('Added!')} })
  const { mutate: review } = useMutation({ mutationFn:({id,quality})=>api.post(`/quran/hifz/${id}/review`,{quality}), onSuccess:()=>{qc.invalidateQueries({queryKey:['quran','hifz']});toast.success('Saved!')} })
  const LBOX = ['','#ef4444','#f97316','#eab308','#22c55e','#16a34a']
  // Planner calculations
  const totalSurahs = 114
  const memorisedCount = entries.filter(e=>e.status==='memorised').length
  const pctDone = Math.round((memorisedCount/totalSurahs)*100)
  return (
    <div className="space-y-4">
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
        <div><h2 style={{fontWeight:700,fontSize:18,color:'var(--t-text)'}}>Hifz Tracker</h2><p style={{fontSize:12,color:'var(--t-text-muted)'}}>{dueToday.length} due today</p></div>
        <Button variant="primary" size="sm" onClick={()=>setAddModal(true)}><Plus size={14}/> Add</Button>
      </div>

      {/* Hifz Planner */}
      <div style={{borderRadius:14,padding:16,background:'linear-gradient(135deg,rgba(20,168,96,0.1),rgba(201,135,10,0.05))',border:'0.5px solid var(--t-border)'}}>
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:12}}>
          <div>
            <p style={{fontWeight:700,fontSize:15,color:'var(--t-text)'}}>📅 Hifz Planner</p>
            <p style={{fontSize:12,color:'var(--t-text-muted)',marginTop:2}}>{memorisedCount} of {totalSurahs} surahs · {pctDone}% complete</p>
          </div>
          <div style={{textAlign:'right'}}>
            <p style={{fontSize:11,color:'var(--t-text-muted)'}}>Daily target</p>
            <div style={{display:'flex',alignItems:'center',gap:6,marginTop:2}}>
              <button onClick={()=>setDailyTarget(t=>Math.max(1,t-1))} style={{width:24,height:24,borderRadius:'50%',border:'0.5px solid var(--t-border)',background:'var(--t-bg-card)',cursor:'pointer',fontSize:14,color:'var(--t-text-muted)'}}>−</button>
              <span style={{fontWeight:700,fontSize:16,color:'var(--t-text)',minWidth:20,textAlign:'center'}}>{dailyTarget}</span>
              <button onClick={()=>setDailyTarget(t=>Math.min(20,t+1))} style={{width:24,height:24,borderRadius:'50%',border:'0.5px solid var(--t-border)',background:'var(--t-bg-card)',cursor:'pointer',fontSize:14,color:'var(--t-text-muted)'}}>+</button>
              <span style={{fontSize:11,color:'var(--t-text-muted)'}}>ayahs/day</span>
            </div>
          </div>
        </div>
        <div style={{height:6,background:'var(--t-border)',borderRadius:3,overflow:'hidden',marginBottom:8}}>
          <div style={{height:'100%',width:`${pctDone}%`,background:'var(--t-primary)',borderRadius:3,transition:'width 0.7s'}}/>
        </div>
        {dailyTarget > 0 && (
          <p style={{fontSize:12,color:'var(--t-text-muted)'}}>
            At {dailyTarget} ayahs/day — estimated completion in ~<strong style={{color:'var(--t-primary)'}}>{Math.ceil((6236 * (1 - pctDone/100)) / dailyTarget)} days</strong>
          </p>
        )}
      </div>
      <div style={{display:'flex',gap:4,overflowX:'auto'}}>
        {HIFZ_MODES.map((m,i)=><button key={i} onClick={()=>setHifzMode(i)} style={{padding:'6px 12px',borderRadius:99,border:'0.5px solid',borderColor:hifzMode===i?'var(--t-primary)':'var(--t-border)',background:hifzMode===i?'rgba(20,168,96,0.1)':'var(--t-bg-card)',fontSize:12,color:hifzMode===i?'var(--t-primary)':'var(--t-text-muted)',cursor:'pointer',whiteSpace:'nowrap'}}>{m}</button>)}
      </div>
      {dueToday.length>0 && (
        <Card>
          <h3 style={{fontWeight:600,fontSize:14,marginBottom:10,color:'var(--t-accent)'}}>Due today ({dueToday.length})</h3>
          <div className="space-y-3">
            {dueToday.slice(0,5).map(e=>(
              <div key={e.id} style={{padding:12,borderRadius:10,background:'var(--t-bg)',border:'0.5px solid var(--t-border)'}}>
                <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:8}}>
                  <div><p style={{fontWeight:600,fontSize:14,color:'var(--t-text)'}}>{e.surah_name||`Surah ${e.surah_number}`}</p><p style={{fontSize:12,color:'var(--t-text-muted)'}}>Ayah {e.ayah_from}\u2013{e.ayah_to} \xb7 Box {e.leitner_box||1}/5</p></div>
                  <div style={{width:8,height:8,borderRadius:'50%',background:LBOX[e.leitner_box||1]}}/>
                </div>
                <div style={{display:'flex',gap:4}}>
                  {SM2_LABELS.map((label,q)=><button key={q} onClick={()=>review({id:e.id,quality:q})} style={{flex:1,padding:'5px 2px',borderRadius:7,border:'none',background:SM2_COLORS[q]+'22',color:SM2_COLORS[q],fontSize:10,fontWeight:600,cursor:'pointer'}}>{label}</button>)}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
      <Card>
        <h3 style={{fontWeight:600,fontSize:14,marginBottom:10,color:'var(--t-text)'}}>All entries ({entries.length})</h3>
        {isLoading?[...Array(3)].map((_,i)=><Skeleton key={i} className="h-12 mb-2"/>):entries.length===0?<p style={{fontSize:13,color:'var(--t-text-muted)',textAlign:'center',padding:16}}>No entries yet.</p>:entries.map(e=>(
          <div key={e.id} style={{display:'flex',alignItems:'center',gap:12,padding:'10px 0',borderBottom:'0.5px solid var(--t-border)'}}>
            <div style={{width:10,height:10,borderRadius:'50%',background:LBOX[e.leitner_box||1],flexShrink:0}}/>
            <div style={{flex:1}}><p style={{fontWeight:600,fontSize:13,color:'var(--t-text)'}}>{e.surah_name||`Surah ${e.surah_number}`}</p><p style={{fontSize:11,color:'var(--t-text-muted)'}}>Ayah {e.ayah_from}\u2013{e.ayah_to} \xb7 {e.status}</p></div>
            <span style={{fontSize:11,padding:'2px 8px',borderRadius:99,background:'var(--t-border)',color:'var(--t-text-muted)'}}>Box {e.leitner_box||1}</span>
          </div>
        ))}
      </Card>
      <Modal open={addModal} onClose={()=>setAddModal(false)} title="Add to Hifz">
        <div className="space-y-3">
          {[['Surah number','surah_number','number'],['Surah name','surah_name','text'],['Ayah from','ayah_from','number'],['Ayah to','ayah_to','number'],['Total ayahs','total_ayahs','number']].map(([label,field,type])=>(
            <div key={field}><p className="label">{label}</p><input className="input" type={type} value={form[field]} onChange={e=>setForm(f=>({...f,[field]:type==='number'?parseInt(e.target.value)||0:e.target.value}))}/></div>
          ))}
          <Button variant="primary" className="w-full" onClick={()=>addEntry()}>Add</Button>
        </div>
      </Modal>
    </div>
  )
}

function DuaTab() {
  const qc = useQueryClient()
  const [selectedCat, setSelectedCat] = useState(null)
  const [addModal,    setAddModal]    = useState(false)
  const [newDua,      setNewDua]      = useState({title:'',text:''})
  const [activeDua,   setActiveDua]   = useState(null)
  const { data: categories=[] } = useQuery({queryKey:['quran','dua-cats'],queryFn:()=>api.get('/quran/duas/categories').then(r=>r.data).catch(()=>[])})
  const { data: duas=[] } = useQuery({queryKey:['quran','duas',selectedCat],queryFn:()=>api.get('/quran/duas',{params:selectedCat?{category:selectedCat}:{}}).then(r=>r.data).catch(()=>[])})
  const { data: personal=[] } = useQuery({queryKey:['quran','personal-duas'],queryFn:()=>api.get('/quran/duas/personal').then(r=>r.data).catch(()=>[])})
  const { data: duaOfDay } = useQuery({queryKey:['quran','dua-of-day'],queryFn:()=>api.get('/quran/duas/of-the-day').then(r=>r.data).catch(()=>null)})
  const { mutate: createPersonal } = useMutation({mutationFn:()=>api.post('/quran/duas/personal',newDua),onSuccess:()=>{qc.invalidateQueries({queryKey:['quran','personal-duas']});setAddModal(false);setNewDua({title:'',text:''});toast.success('Dua added')}})
  const { mutate: markAnswered } = useMutation({mutationFn:({id})=>api.patch(`/quran/duas/personal/${id}`,{is_answered:true}),onSuccess:()=>{qc.invalidateQueries({queryKey:['quran','personal-duas']});toast.success('Alhamdulillah! \ud83e\udd32')}})
  return (
    <div className="space-y-4">
      {duaOfDay && (
        <div style={{borderRadius:14,padding:16,background:'linear-gradient(135deg,var(--t-bg-sidebar),var(--t-bg-card))'}}>
          <p style={{fontSize:11,fontWeight:600,color:'var(--t-accent)',textTransform:'uppercase',letterSpacing:'0.08em',marginBottom:6}}>Dua of the day</p>
          <p style={{fontFamily:'Amiri,serif',fontSize:'1.3rem',lineHeight:2,textAlign:'right',direction:'rtl',color:'var(--t-text)',marginBottom:8}}>{duaOfDay.arabic_text}</p>
          {duaOfDay.transliteration&&<p style={{fontSize:13,color:'var(--t-text-muted)',fontStyle:'italic',marginBottom:4}}>{duaOfDay.transliteration}</p>}
          <p style={{fontSize:13,color:'var(--t-text)'}}>{duaOfDay.translation}</p>
          {duaOfDay.source&&<p style={{fontSize:11,color:'var(--t-text-muted)',marginTop:6}}>\u2014 {duaOfDay.source}</p>}
        </div>
      )}
      <div style={{display:'flex',gap:6,overflowX:'auto',paddingBottom:4}}>
        <button onClick={()=>setSelectedCat(null)} style={{padding:'5px 12px',borderRadius:99,border:'0.5px solid',borderColor:!selectedCat?'var(--t-primary)':'var(--t-border)',background:!selectedCat?'rgba(20,168,96,0.1)':'var(--t-bg-card)',fontSize:12,color:!selectedCat?'var(--t-primary)':'var(--t-text-muted)',cursor:'pointer',whiteSpace:'nowrap'}}>All</button>
        {categories.map(c=><button key={c.category} onClick={()=>setSelectedCat(c.category)} style={{padding:'5px 12px',borderRadius:99,border:'0.5px solid',borderColor:selectedCat===c.category?'var(--t-primary)':'var(--t-border)',background:selectedCat===c.category?'rgba(20,168,96,0.1)':'var(--t-bg-card)',fontSize:12,color:selectedCat===c.category?'var(--t-primary)':'var(--t-text-muted)',cursor:'pointer',whiteSpace:'nowrap'}}>{c.category.replace('_',' ')} ({c.count})</button>)}
      </div>
      <div className="space-y-3">
        {duas.slice(0,20).map(dua=>(
          <Card key={dua.id}>
            <button style={{width:'100%',textAlign:'left',background:'none',border:'none',cursor:'pointer',padding:0}} onClick={()=>setActiveDua(activeDua?.id===dua.id?null:dua)}>
              <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:6}}>
                <p style={{fontWeight:600,fontSize:14,color:'var(--t-text)'}}>{dua.title}</p>
                <ChevronDown size={14} style={{color:'var(--t-text-muted)',transform:activeDua?.id===dua.id?'rotate(180deg)':'none',transition:'transform 0.2s'}}/>
              </div>
              {activeDua?.id===dua.id?(
                <>
                  <p style={{fontFamily:'Amiri,serif',fontSize:'1.2rem',lineHeight:2,textAlign:'right',direction:'rtl',color:'var(--t-text)',marginBottom:8}}>{dua.arabic_text}</p>
                  {dua.transliteration&&<p style={{fontSize:12,color:'var(--t-text-muted)',fontStyle:'italic',marginBottom:4}}>{dua.transliteration}</p>}
                  <p style={{fontSize:13,color:'var(--t-text)'}}>{dua.translation}</p>
                  {dua.source&&<p style={{fontSize:11,color:'var(--t-accent)',marginTop:6}}>\u2014 {dua.source}</p>}
                  {dua.when_to_recite&&<p style={{fontSize:11,color:'var(--t-text-muted)',marginTop:4,fontStyle:'italic'}}>When: {dua.when_to_recite}</p>}
                </>
              ):<p style={{fontSize:12,color:'var(--t-text-muted)'}}>{dua.category.replace('_',' ')} \xb7 {dua.repetition_count}\xd7</p>}
            </button>
          </Card>
        ))}
      </div>
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginTop:8}}>
        <h3 style={{fontWeight:700,fontSize:16,color:'var(--t-text)'}}>My duas ({personal.length})</h3>
        <Button variant="primary" size="sm" onClick={()=>setAddModal(true)}><Plus size={14}/> Add</Button>
      </div>
      {personal.map(pd=>(
        <Card key={pd.id} style={{opacity:pd.is_answered?0.7:1}}>
          <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',gap:8}}>
            <div style={{flex:1}}><p style={{fontWeight:600,fontSize:14,color:pd.is_answered?'var(--t-text-muted)':'var(--t-text)',textDecoration:pd.is_answered?'line-through':'none'}}>{pd.title}</p><p style={{fontSize:12,color:'var(--t-text-muted)',marginTop:2}}>{pd.text.slice(0,80)}{pd.text.length>80?'\u2026':''}</p>{pd.is_answered&&pd.answered_note&&<p style={{fontSize:11,color:'var(--t-primary)',marginTop:4}}>\u2713 {pd.answered_note}</p>}</div>
            {!pd.is_answered&&<button onClick={()=>markAnswered({id:pd.id})} style={{padding:'4px 10px',borderRadius:8,background:'rgba(20,168,96,0.1)',border:'0.5px solid var(--t-primary)',color:'var(--t-primary)',fontSize:11,fontWeight:600,cursor:'pointer',whiteSpace:'nowrap'}}>\ud83e\udd32 Answered</button>}
          </div>
        </Card>
      ))}
      <Modal open={addModal} onClose={()=>setAddModal(false)} title="Add personal dua">
        <div className="space-y-4">
          <div><p className="label">Title</p><input className="input" placeholder="e.g. For my family" value={newDua.title} onChange={e=>setNewDua(d=>({...d,title:e.target.value}))}/></div>
          <div><p className="label">Your dua</p><textarea className="input resize-none" rows={4} placeholder="Write your dua\u2026" value={newDua.text} onChange={e=>setNewDua(d=>({...d,text:e.target.value}))}/></div>
          <Button variant="primary" className="w-full" onClick={()=>createPersonal()}>Save</Button>
        </div>
      </Modal>
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
    <div className="space-y-4">
      {hadithOfDay&&(
        <div style={{borderRadius:14,padding:16,background:'var(--t-bg-sidebar)',border:'0.5px solid var(--t-border)'}}>
          <p style={{fontSize:11,fontWeight:600,color:'var(--t-accent)',textTransform:'uppercase',letterSpacing:'0.08em',marginBottom:8}}>Hadith of the day</p>
          {hadithOfDay.arabic_text&&<p style={{fontFamily:'Amiri,serif',fontSize:'1.1rem',lineHeight:2,textAlign:'right',direction:'rtl',color:'var(--t-text)',marginBottom:8}}>{hadithOfDay.arabic_text}</p>}
          <p style={{fontSize:13,lineHeight:1.7,color:'var(--t-text)',marginBottom:8}}>{hadithOfDay.english_text}</p>
          <div style={{display:'flex',alignItems:'center',gap:8}}>
            <span style={{fontSize:11,padding:'2px 10px',borderRadius:99,background:GRADE_STYLES[hadithOfDay.grade]?.bg,color:GRADE_STYLES[hadithOfDay.grade]?.color,fontWeight:700}}>{GRADE_STYLES[hadithOfDay.grade]?.label}</span>
            <span style={{fontSize:11,color:'var(--t-text-muted)'}}>{hadithOfDay.narrator_chain}</span>
          </div>
          <p style={{fontSize:11,color:'var(--t-text-muted)',marginTop:4}}>{hadithOfDay.collection} #{hadithOfDay.hadith_number}</p>
        </div>
      )}
      <div style={{display:'flex',alignItems:'center',gap:8}}><Search size={14} style={{color:'var(--t-text-muted)',flexShrink:0}}/><input className="input" placeholder="Search hadiths\u2026" value={search} onChange={e=>setSearch(e.target.value)}/></div>
      <div className="space-y-3">
        {displayed.map(h=>(
          <Card key={h.id}>
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:8}}>
              <span style={{fontSize:11,padding:'2px 10px',borderRadius:99,background:GRADE_STYLES[h.grade]?.bg,color:GRADE_STYLES[h.grade]?.color,fontWeight:700}}>{GRADE_STYLES[h.grade]?.label}</span>
              <span style={{fontSize:11,color:'var(--t-text-muted)'}}>{h.collection} #{h.hadith_number}</span>
            </div>
            {h.arabic_text&&<p style={{fontFamily:'Amiri,serif',fontSize:'1rem',lineHeight:2,textAlign:'right',direction:'rtl',color:'var(--t-text)',marginBottom:8}}>{h.arabic_text}</p>}
            <p style={{fontSize:13,lineHeight:1.7,color:'var(--t-text)',marginBottom:6}}>{h.english_text}</p>
            {h.narrator_chain&&<p style={{fontSize:11,color:'var(--t-text-muted)',fontStyle:'italic'}}>\u2014 {h.narrator_chain}</p>}
            {h.grade==='daif'&&<p style={{fontSize:11,color:'#d97706',marginTop:6,padding:'4px 8px',background:'rgba(245,158,11,0.08)',borderRadius:6}}>\u26a0 Da\u02bfif hadith \u2014 treat with caution and do not cite as religious obligation.</p>}
          </Card>
        ))}
      </div>
    </div>
  )
}

function StatsTab() {
  const { data: stats } = useQuery({queryKey:['quran','stats'],queryFn:()=>api.get('/quran/stats').then(r=>r.data).catch(()=>null)})
  const { data: hifz=[] } = useQuery({queryKey:['quran','hifz'],queryFn:()=>api.get('/quran/hifz').then(r=>r.data).catch(()=>[])})
  const memorised  = hifz.filter(h=>h.status==='memorised').length
  const inProgress = hifz.filter(h=>h.status==='in_progress').length
  return (
    <div className="space-y-4">
      <Card>
        <h3 style={{fontWeight:700,fontSize:16,marginBottom:12,color:'var(--t-text)'}}>Khatam progress</h3>
        <div style={{display:'flex',alignItems:'center',gap:16}}>
          <ProgressRing value={stats?.khatam_progress_pct||0} max={100} size={80} strokeWidth={7} color="var(--t-accent)">
            <span style={{fontSize:13,fontWeight:700,color:'var(--t-text)'}}>{Math.round(stats?.khatam_progress_pct||0)}%</span>
          </ProgressRing>
          <div>
            <p style={{fontSize:22,fontWeight:700,color:'var(--t-text)'}}>{(stats?.total_verses_read||0).toLocaleString()}<span style={{fontSize:14,color:'var(--t-text-muted)',fontWeight:400}}> / 6,236</span></p>
            <p style={{fontSize:12,color:'var(--t-text-muted)'}}>verses read all-time</p>
            {stats?.projected_khatam_days&&<p style={{fontSize:12,color:'var(--t-primary)',marginTop:4}}>At your pace: ~{stats.projected_khatam_days} days to khatam</p>}
          </div>
        </div>
      </Card>
      <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:10}}>
        {[['Verses',stats?.verses_this_month||0,'this month'],['Minutes',stats?.minutes_this_month||0,'reading'],['Listened',stats?.total_minutes_listened||0,'total']].map(([l,v,s])=>(
          <div key={l} style={{borderRadius:12,padding:'12px 8px',textAlign:'center',background:'var(--t-bg-card)',border:'0.5px solid var(--t-border)'}}>
            <p style={{fontSize:18,fontWeight:700,color:'var(--t-text)'}}>{v.toLocaleString()}</p>
            <p style={{fontSize:10,color:'var(--t-text-muted)'}}>{l}</p>
            <p style={{fontSize:9,color:'var(--t-text-muted)'}}>{s}</p>
          </div>
        ))}
      </div>
      {stats&&<Card><p style={{fontSize:13,color:'var(--t-text-muted)'}}>Daily average</p><p style={{fontSize:24,fontWeight:700,color:'var(--t-text)'}}>{stats.avg_daily_minutes} min</p><p style={{fontSize:12,color:'var(--t-text-muted)'}}>{stats.sessions_this_month} sessions this month</p></Card>}
      <Card>
        <h3 style={{fontWeight:700,fontSize:16,marginBottom:10,color:'var(--t-text)'}}>Hifz progress</h3>
        <div style={{display:'grid',gridTemplateColumns:'repeat(2,1fr)',gap:10}}>
          {[['Memorised',memorised,'#16a34a'],['In progress',inProgress,'#f97316']].map(([label,count,color])=>(
            <div key={label} style={{textAlign:'center',padding:12,borderRadius:10,background:color+'12'}}><p style={{fontSize:22,fontWeight:700,color}}>{count}</p><p style={{fontSize:11,color:'var(--t-text-muted)'}}>{label.toLowerCase()}</p></div>
          ))}
        </div>
      </Card>
    </div>
  )
}

// ─── Practice Tab (Recitation AI) ─────────────────────────────────────────────

function PracticeTab() {
  const [recording, setRecording] = useState(false)
  const [mediaRecorder, setMediaRecorder] = useState(null)
  const [sessions, setSessions] = useState([])
  const [selectedSurah, setSelectedSurah] = useState(1)
  const [selectedAyah, setSelectedAyah] = useState(1)
  const [processing, setProcessing] = useState(false)
  const { data: surahs=[] } = useQuery({ queryKey:['quran','surahs'], queryFn:()=>api.get('/quran/surahs').then(r=>r.data), staleTime: 24*60*60_000 })
  const { data: mySessions=[] } = useQuery({ queryKey:['recitation','sessions'], queryFn:()=>api.get('/recitation/sessions').then(r=>r.data).catch(()=>[]) })

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const rec = new MediaRecorder(stream)
      const chunks = []
      rec.ondataavailable = e => chunks.push(e.data)
      rec.onstop = async () => {
        setProcessing(true)
        const blob = new Blob(chunks, { type: 'audio/webm' })
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

  const stopRecording = () => {
    mediaRecorder?.stop()
    setRecording(false)
    setMediaRecorder(null)
  }

  const allSessions = [...sessions, ...mySessions].slice(0, 20)

  return (
    <div className="space-y-4">
      <Card>
        <h3 style={{fontWeight:700,fontSize:17,color:'var(--t-text)',marginBottom:4}}>🎙️ Recitation Practice</h3>
        <p style={{fontSize:13,color:'var(--t-text-muted)',marginBottom:16}}>Record yourself reciting an ayah. Our AI will check your Tajweed and pronunciation.</p>

        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginBottom:16}}>
          <div>
            <p className="label">Surah</p>
            <select className="input" value={selectedSurah} onChange={e=>setSelectedSurah(Number(e.target.value))}>
              {surahs.map(s => <option key={s.id} value={s.id}>{s.id}. {s.name_simple}</option>)}
            </select>
          </div>
          <div>
            <p className="label">Ayah #</p>
            <input className="input" type="number" min="1" max="286" value={selectedAyah} onChange={e=>setSelectedAyah(Number(e.target.value))}/>
          </div>
        </div>

        <button
          onClick={recording ? stopRecording : startRecording}
          disabled={processing}
          style={{
            width:'100%', padding:'16px', borderRadius:14, border:'none', cursor: processing ? 'not-allowed' : 'pointer',
            background: recording ? '#ef4444' : 'var(--t-primary)',
            color:'white', fontWeight:700, fontSize:15, display:'flex', alignItems:'center', justifyContent:'center', gap:10,
            transition:'all 0.2s', opacity: processing ? 0.7 : 1,
          }}>
          {processing ? '⏳ Analysing…' : recording ? <><StopCircle size={20}/> Stop Recording</> : <><Mic size={20}/> Start Recording</>}
        </button>

        {recording && (
          <div style={{marginTop:12,textAlign:'center'}}>
            <div style={{display:'inline-flex',alignItems:'center',gap:8,padding:'6px 14px',borderRadius:99,background:'rgba(239,68,68,0.1)',border:'1px solid rgba(239,68,68,0.3)'}}>
              <div style={{width:8,height:8,borderRadius:'50%',background:'#ef4444',animation:'pulse 1s infinite'}}/>
              <span style={{fontSize:13,color:'#ef4444',fontWeight:600}}>Recording…</span>
            </div>
          </div>
        )}
      </Card>

      {allSessions.length > 0 && (
        <div>
          <h3 style={{fontWeight:700,fontSize:15,color:'var(--t-text)',marginBottom:10}}>Recent Sessions</h3>
          <div className="space-y-3">
            {allSessions.map((s, i) => (
              <Card key={s.id || i}>
                <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:8}}>
                  <div>
                    <p style={{fontWeight:600,fontSize:14,color:'var(--t-text)'}}>Surah {s.surah_number} · Ayah {s.ayah_number}</p>
                    <p style={{fontSize:12,color:'var(--t-text-muted)'}}>
                      {s.created_at ? new Date(s.created_at).toLocaleDateString() : 'Just now'}
                    </p>
                  </div>
                  {s.overall_score != null && (
                    <div style={{textAlign:'center'}}>
                      <p style={{fontSize:22,fontWeight:700,color:s.overall_score>=80?'var(--t-primary)':s.overall_score>=60?'var(--t-accent)':'#ef4444'}}>{Math.round(s.overall_score)}%</p>
                      <p style={{fontSize:10,color:'var(--t-text-muted)'}}>Accuracy</p>
                    </div>
                  )}
                </div>
                {s.feedback && (
                  <p style={{fontSize:13,color:'var(--t-text-muted)',padding:'8px 10px',borderRadius:8,background:'var(--t-bg)',lineHeight:1.6}}>{s.feedback}</p>
                )}
                {s.tajweed_errors?.length > 0 && (
                  <div style={{marginTop:8}}>
                    <p style={{fontSize:11,fontWeight:600,color:'var(--t-accent)',marginBottom:4}}>Tajweed notes:</p>
                    {s.tajweed_errors.map((err, ei) => (
                      <p key={ei} style={{fontSize:12,color:'var(--t-text-muted)',lineHeight:1.6}}>• {err}</p>
                    ))}
                  </div>
                )}
              </Card>
            ))}
          </div>
        </div>
      )}

      {allSessions.length === 0 && !recording && (
        <div style={{textAlign:'center',padding:'32px 0',color:'var(--t-text-muted)'}}>
          <span style={{fontSize:48}}>🎙️</span>
          <p style={{marginTop:12,fontSize:14}}>No sessions yet. Record your first recitation above!</p>
          <p style={{marginTop:6,fontSize:12,color:'var(--t-text-muted)'}}>Start with Al-Fatihah, Surah 1, Ayah 1</p>
        </div>
      )}
    </div>
  )
}

export default function Quran() {
  const [tab,         setTab]         = useState('reader')
  const [activeSurah, setActiveSurah] = useState(null)
  const audio = useAudio()
  const ctx   = getIslamicContext()

  useEffect(()=>{
    const token = localStorage.getItem('access_token')
    if (!token) return
    api.post('/quran/duas/seed').catch(()=>{})
    api.post('/quran/hadith/seed').catch(()=>{})
  },[])

  return (
    <div className="max-w-2xl mx-auto px-4 py-5">
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:16}}>
        <div>
          <h1 style={{fontFamily:'var(--font-display,serif)',fontSize:24,fontWeight:700,color:'var(--t-text)'}}>Quran</h1>
          <p style={{fontSize:13,color:'var(--t-accent)'}}>{ctx.formatted}</p>
        </div>
        {audio.currentV&&(
          <div style={{display:'flex',gap:4}}>
            {[0.75,1.0,1.25,1.5].map(s=><button key={s} onClick={()=>audio.changeSpeed(s)} style={{padding:'3px 8px',borderRadius:8,fontSize:11,border:'0.5px solid',borderColor:audio.speed===s?'var(--t-primary)':'var(--t-border)',background:audio.speed===s?'rgba(20,168,96,0.1)':'var(--t-bg-card)',color:audio.speed===s?'var(--t-primary)':'var(--t-text-muted)',cursor:'pointer'}}>{s}\xd7</button>)}
          </div>
        )}
      </div>
      <div style={{display:'flex',gap:2,padding:4,borderRadius:12,marginBottom:16,background:'var(--t-bg-card)',border:'0.5px solid var(--t-border)'}}>
        {TABS.map(t=><button key={t} onClick={()=>setTab(t)} style={{flex:1,padding:'8px 4px',borderRadius:9,fontSize:12,fontWeight:500,border:'none',cursor:'pointer',background:tab===t?'var(--t-primary)':'transparent',color:tab===t?'white':'var(--t-text-muted)',transition:'all 0.15s'}}>{TAB_LABELS[t]}</button>)}
      </div>
      {tab==='reader'&&!activeSurah&&(
        <div style={{display:'flex',gap:6,overflowX:'auto',marginBottom:12}}>
          {RECITERS.map(r=><button key={r.id} onClick={()=>audio.setReciterId(r.id)} style={{padding:'5px 12px',borderRadius:99,border:'0.5px solid',borderColor:audio.reciterId===r.id?'var(--t-primary)':'var(--t-border)',background:audio.reciterId===r.id?'rgba(20,168,96,0.1)':'var(--t-bg-card)',fontSize:11,color:audio.reciterId===r.id?'var(--t-primary)':'var(--t-text-muted)',cursor:'pointer',whiteSpace:'nowrap'}}>{r.name}</button>)}
        </div>
      )}
      {tab==='reader'&&(activeSurah?<SurahReader surah={activeSurah} onBack={()=>setActiveSurah(null)} audio={audio}/>:<SurahPicker onSelect={setActiveSurah}/>)}
      {tab==='hifz'&&<HifzTab/>}
      {tab==='duas'&&<DuaTab/>}
      {tab==='hadith'&&<HadithTab/>}
      {tab==='stats'&&<StatsTab/>}
      {tab==='practice'&&<PracticeTab/>}
      <MiniPlayer audio={audio} surahName={activeSurah?.name_simple}/>
    </div>
  )
}
