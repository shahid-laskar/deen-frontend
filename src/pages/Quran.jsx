import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { useQuery, useQueries, useMutation, useQueryClient } from '@tanstack/react-query'
import { useVirtualizer } from '@tanstack/react-virtual'
import { useNavigate, useParams } from 'react-router-dom'
import * as Tooltip from '@radix-ui/react-tooltip'
import CalendarHeatmap from 'react-calendar-heatmap'
import 'react-calendar-heatmap/dist/styles.css'
import {
  BookOpen, Search, ChevronLeft, Play, Pause,
  Maximize2, Minimize2, BookMarked, ChevronDown, Plus,
  Mic, Timer, StopCircle, Flame, Link2
} from 'lucide-react'
import api from '../lib/api'
import { Card, Button, Skeleton, Modal, ProgressRing } from '../components/ui/index'
import { getIslamicContext } from '../lib/hijri'
import { useStickyState } from '../hooks/useStickyState'
import toast from 'react-hot-toast'

const TABS = ['reader', 'hifz', 'duas', 'hadith', 'stats', 'practice']
const TAB_LABELS = { reader: 'Reader', hifz: 'Hifz', duas: 'Duas', hadith: 'Hadith', stats: 'Stats', practice: 'Practice' }

const RECITERS = [
  { id: 7, name: 'Mishary Alafasy', slug: 'mishary_rashid_alafasy', style: 'Murattal' },
  { id: 1, name: 'Abdul Rahman Sudais', slug: 'abdurrahmaan_as_sudais', style: 'Haram' },
  { id: 2, name: 'Abu Bakr al-Shatri', slug: 'abu_bakr_ash_shatri', style: 'Murattal' },
  { id: 5, name: 'Mahmoud al-Husary', slug: 'mahmoud_khaleel_al_husary', style: 'Hifz' },
  { id: 10, name: 'Mohamed al-Minshawi', slug: 'minshawi_murattal', style: 'Reflective' },
]

const READING_MODES = [
  { id: 'scroll', label: 'Scroll', icon: '📜' },
  { id: 'page', label: 'Page', icon: '📖' },
  { id: 'hifz', label: 'Hifz', icon: '🧠' },
]

const HIGHLIGHT_COLORS = ['gold', 'green', 'blue', 'red', 'purple']
const HIFZ_MODES = ['Listen & Repeat', 'Read & Cover', 'Fill the Blank', 'Full Recall']
const SM2_LABELS = ['Forgot', 'Wrong', 'Hard', 'OK', 'Good', 'Perfect']
const SM2_COLORS = ['#ef4444', '#f97316', '#eab308', '#3b82f6', '#22c55e', '#16a34a']

const GRADE_STYLES = {
  sahih: { bg: 'rgba(22,163,74,0.12)', color: '#16a34a', label: 'Sahih ✓' },
  hasan: { bg: 'rgba(59,130,246,0.12)', color: '#3b82f6', label: 'Hasan' },
  daif: { bg: 'rgba(245,158,11,0.12)', color: '#d97706', label: "Da'if ⚠" },
  mawdu: { bg: 'rgba(239,68,68,0.12)', color: '#ef4444', label: 'Mawdu ✗' },
  unknown: { bg: 'rgba(107,114,128,0.12)', color: '#6b7280', label: 'Unknown' },
}

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
  return words.map((word, index) => index > 0 && Math.random() < density && word.text_uthmani)
}

function getStreak(readingLogs = []) {
  const uniqueDays = [...new Set(readingLogs.map((log) => log.log_date))].sort().reverse()
  if (uniqueDays.length === 0) return 0
  let streak = 0
  const cursor = new Date()
  cursor.setHours(0, 0, 0, 0)
  for (let index = 0; index < uniqueDays.length; index += 1) {
    const expected = new Date(cursor)
    expected.setDate(cursor.getDate() - index)
    const expectedKey = expected.toISOString().slice(0, 10)
    const previousKey = new Date(cursor.getTime() - 86400000).toISOString().slice(0, 10)
    if (index === 0 && uniqueDays[index] !== expectedKey && uniqueDays[index] !== previousKey) break
    if (index === 0 && uniqueDays[index] === previousKey) {
      cursor.setDate(cursor.getDate() - 1)
    }
    const baseline = new Date(cursor)
    baseline.setDate(cursor.getDate() - (index === 0 ? 0 : index))
    const baselineKey = baseline.toISOString().slice(0, 10)
    if (uniqueDays[index] !== baselineKey) break
    streak += 1
  }
  return streak
}

function useAudio() {
  const audioRef = useRef(null)
  const sleepTimerRef = useRef(null)
  const [playing, setPlaying] = useState(false)
  const [speed, setSpeed] = useStickyState(1, 'q_audio_speed')
  const [currentV, setCurrentV] = useState(null)
  const [reciterId, setReciterId] = useStickyState(7, 'q_reciter_id')
  const [sleepTimer, setSleepTimer] = useState(null)

  const getUrl = useCallback((surah, ayah, reciter) => {
    const s = String(surah).padStart(3, '0')
    const a = String(ayah).padStart(3, '0')
    const r = RECITERS.find((entry) => entry.id === reciter)?.slug || 'mishary_rashid_alafasy'
    return `https://verses.quran.com/${r}/${s}${a}.mp3`
  }, [])

  const playVerse = useCallback((surah, ayah, audioUrl) => {
    if (!audioRef.current) audioRef.current = new Audio()
    audioRef.current.src = audioUrl ? `https://verses.quran.com/${audioUrl}` : getUrl(surah, ayah, reciterId)
    audioRef.current.playbackRate = speed
    audioRef.current.play().then(() => {
      setPlaying(true)
      setCurrentV({ surah, ayah })
    }).catch(() => {})
  }, [getUrl, reciterId, speed])

  const pause = useCallback(() => {
    audioRef.current?.pause()
    setPlaying(false)
  }, [])

  const resume = useCallback(() => {
    audioRef.current?.play().then(() => setPlaying(true)).catch(() => {})
  }, [])

  const changeSpeed = useCallback((value) => {
    setSpeed(value)
    if (audioRef.current) audioRef.current.playbackRate = value
  }, [setSpeed])

  const startSleepTimer = useCallback((minutes) => {
    if (sleepTimerRef.current) clearTimeout(sleepTimerRef.current)
    const label = `${minutes} min`
    setSleepTimer({ remaining: minutes, label })
    sleepTimerRef.current = setTimeout(() => {
      audioRef.current?.pause()
      setPlaying(false)
      setSleepTimer(null)
      toast.success('Sleep timer ended.')
    }, minutes * 60 * 1000)
  }, [])

  const cancelSleepTimer = useCallback(() => {
    if (sleepTimerRef.current) clearTimeout(sleepTimerRef.current)
    setSleepTimer(null)
  }, [])

  useEffect(() => {
    if (!audioRef.current) return undefined
    audioRef.current.playbackRate = speed
    return undefined
  }, [speed])

  useEffect(() => {
    if (!('mediaSession' in navigator) || !currentV) return undefined
    const reciterName = RECITERS.find((entry) => entry.id === reciterId)?.name || 'Reciter'
    navigator.mediaSession.metadata = new window.MediaMetadata({
      title: `Surah ${currentV.surah} • Ayah ${currentV.ayah}`,
      artist: reciterName,
      album: 'Quran',
    })
    navigator.mediaSession.playbackState = playing ? 'playing' : 'paused'
    navigator.mediaSession.setActionHandler('play', resume)
    navigator.mediaSession.setActionHandler('pause', pause)
    return () => {
      navigator.mediaSession.setActionHandler('play', null)
      navigator.mediaSession.setActionHandler('pause', null)
    }
  }, [currentV, pause, playing, reciterId, resume])

  return { playing, speed, currentV, reciterId, setReciterId, playVerse, pause, resume, changeSpeed, sleepTimer, startSleepTimer, cancelSleepTimer }
}

function MiniPlayer({ audio, surahName }) {
  if (!audio.currentV) return null
  const { surah, ayah } = audio.currentV
  return (
    <div style={{ position: 'fixed', bottom: 'calc(var(--nav-h) + 8px)', left: 8, right: 8, zIndex: 30, background: 'var(--t-bg-sidebar)', border: '0.5px solid var(--t-border)', borderRadius: 14, padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 12, boxShadow: 'var(--shadow-2)' }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--t-text)' }}>{surahName || `Surah ${surah}`} — Verse {ayah}</p>
        <p style={{ fontSize: 11, color: 'var(--t-text-muted)' }}>{RECITERS.find((entry) => entry.id === audio.reciterId)?.name} · {audio.speed}×</p>
      </div>
      <button
        onClick={audio.playing ? audio.pause : audio.resume}
        style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--t-primary)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}
      >
        {audio.playing ? <Pause size={16} /> : <Play size={16} />}
      </button>
    </div>
  )
}

function SurahPicker({ onSelect }) {
  const [search, setSearch] = useState('')
  const normalizedQuery = search.trim()
  const { data: surahs = [], isLoading } = useQuery({
    queryKey: ['quran', 'surahs'],
    queryFn: () => api.get('/quran/surahs').then((response) => response.data),
    staleTime: 24 * 60 * 60_000,
  })
  const { data: searchResults = [], isFetching: isSearching } = useQuery({
    queryKey: ['quran', 'search', normalizedQuery],
    queryFn: () => api.get('/quran/search', { params: { q: normalizedQuery } }).then((response) => response.data?.search?.results || []),
    enabled: normalizedQuery.length >= 2,
    staleTime: 5 * 60_000,
  })

  const filtered = surahs.filter((surah) =>
    surah.name_simple.toLowerCase().includes(normalizedQuery.toLowerCase()) ||
    String(surah.id).includes(normalizedQuery) ||
    surah.translated_name?.name?.toLowerCase().includes(normalizedQuery.toLowerCase())
  )

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
        <Search size={16} style={{ color: 'var(--t-text-muted)', flexShrink: 0 }} />
        <input className="input" placeholder="Search surah or ayah…" value={search} onChange={(event) => setSearch(event.target.value)} />
      </div>

      {normalizedQuery.length >= 2 && (
        <Card style={{ marginBottom: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <p style={{ fontWeight: 700, fontSize: 13, color: 'var(--t-text)' }}>Ayah search</p>
            <p style={{ fontSize: 11, color: 'var(--t-text-muted)' }}>{isSearching ? 'Searching…' : `${searchResults.length} matches`}</p>
          </div>
          {searchResults.length === 0 && !isSearching ? (
            <p style={{ fontSize: 12, color: 'var(--t-text-muted)' }}>No ayah matches yet. Try Arabic, transliteration, or English keywords.</p>
          ) : (
            <div style={{ display: 'grid', gap: 8 }}>
              {searchResults.slice(0, 6).map((result) => {
                const [surahId, ayahId] = String(result.verse_key || '').split(':')
                return (
                  <button
                    key={result.verse_key}
                    onClick={() => onSelect(Number(surahId), Number(ayahId))}
                    style={{ width: '100%', textAlign: 'left', padding: '10px 12px', borderRadius: 10, border: '0.5px solid var(--t-border)', background: 'var(--t-bg-card)', cursor: 'pointer' }}
                  >
                    <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--t-accent)', marginBottom: 4 }}>{result.verse_key}</p>
                    <p style={{ fontSize: 12, color: 'var(--t-text)', lineHeight: 1.6 }}>{stripHtml(result.text || result.translated_text || '')}</p>
                    {ayahId && <p style={{ fontSize: 11, color: 'var(--t-text-muted)', marginTop: 4 }}>Jump to ayah {ayahId}</p>}
                  </button>
                )
              })}
            </div>
          )}
        </Card>
      )}

      {isLoading ? [...Array(8)].map((_, index) => <Skeleton key={index} className="h-12 mb-2" />) : (
        <div style={{ maxHeight: '65vh', overflowY: 'auto' }}>
          {filtered.map((surah) => (
            <button
              key={surah.id}
              onClick={() => onSelect(surah.id)}
              style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', borderRadius: 10, border: 'none', background: 'none', cursor: 'pointer', textAlign: 'left' }}
              onMouseEnter={(event) => { event.currentTarget.style.background = 'var(--t-border)' }}
              onMouseLeave={(event) => { event.currentTarget.style.background = 'none' }}
            >
              <div style={{ width: 36, height: 36, borderRadius: 8, background: 'var(--t-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: 'var(--t-text-muted)', flexShrink: 0 }}>{surah.id}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontWeight: 600, fontSize: 14, color: 'var(--t-text)' }}>{surah.name_simple}</p>
                <p style={{ fontSize: 11, color: 'var(--t-text-muted)' }}>{surah.translated_name?.name} · {surah.verses_count} verses · {surah.revelation_place}</p>
              </div>
              <span style={{ fontFamily: 'Amiri,serif', fontSize: 18, color: 'var(--t-accent)' }}>{surah.name_arabic}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function WordTooltip({ word, showTranslit, showTajweed }) {
  const label = word.text_uthmani || word.text || ''
  return (
    <Tooltip.Root>
      <Tooltip.Trigger asChild>
        <button
          type="button"
          style={{ cursor: 'pointer', padding: '4px 8px', borderRadius: 8, background: 'rgba(59,130,246,0.06)', border: '0.5px solid rgba(59,130,246,0.15)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}
        >
          {showTajweed && word.text_tajweed ? (
            <span style={{ fontFamily: 'Amiri,serif', fontSize: 'calc(1.3rem * var(--t-quran-scale,1.2))', color: 'var(--t-text)' }} dangerouslySetInnerHTML={{ __html: word.text_tajweed }} />
          ) : (
            <span style={{ fontFamily: 'Amiri,serif', fontSize: 'calc(1.3rem * var(--t-quran-scale,1.2))', color: 'var(--t-text)' }}>{label}</span>
          )}
          {showTranslit && word.transliteration?.text && <span style={{ fontSize: 10, color: 'var(--t-accent)', fontStyle: 'italic' }}>{word.transliteration.text}</span>}
          <span style={{ fontSize: 11, color: 'var(--t-text-muted)' }}>{word.translation?.text || '—'}</span>
        </button>
      </Tooltip.Trigger>
      <Tooltip.Portal>
        <Tooltip.Content sideOffset={6} style={{ zIndex: 50, borderRadius: 10, background: 'var(--t-bg-card)', border: '0.5px solid var(--t-border)', boxShadow: 'var(--shadow-2)', padding: 12, maxWidth: 220 }}>
          <p style={{ fontFamily: 'Amiri,serif', fontSize: '1.9rem', textAlign: 'right', color: 'var(--t-text)', marginBottom: 4 }}>{label}</p>
          <p style={{ fontSize: 12, color: 'var(--t-accent)', marginBottom: 4 }}>{word.transliteration?.text || '—'}</p>
          <p style={{ fontSize: 13, color: 'var(--t-text)', marginBottom: 8 }}>{word.translation?.text || '—'}</p>
          <p style={{ fontSize: 11, color: 'var(--t-text-muted)' }}>
            {word.root_arabic ? `Root: ${word.root_arabic}` : 'Tap any word for quick lexical context.'}
            {word.grammar_info ? ` · ${word.grammar_info}` : ''}
          </p>
        </Tooltip.Content>
      </Tooltip.Portal>
    </Tooltip.Root>
  )
}

function AyahRow({ verse, surah, audio, bookmarks, addBookmark, setTafsirVerse, readingMode, showGrammar, showTranslit, showTrans, showTajweed, translationIds, fontScale, onViewed }) {
  const ayahNum = verse.verse_number
  const isPlaying = audio.currentV?.surah === surah.id && audio.currentV?.ayah === ayahNum && audio.playing
  const isHighlighted = audio.currentV?.surah === surah.id && audio.currentV?.ayah === ayahNum
  const isBookmarked = bookmarks.some((bookmark) => bookmark.surah_number === surah.id && bookmark.ayah_number === ayahNum)
  const [revealed, setRevealed] = useState(false)
  const [guidedCount, setGuidedCount] = useState(1)
  const [blankMask, setBlankMask] = useState([])
  const [blankInputs, setBlankInputs] = useState({})
  const [hifzChallenge, setHifzChallenge] = useState('guided')
  const arabicText = verse.text_uthmani || verse.text_imlaei || ''
  const words = verse.words?.filter((word) => word.char_type_name === 'word') || arabicText.split(' ').map((word) => ({ text_uthmani: word }))
  const translations = translationIds.map((id) => verse.translationMap?.[id]).filter(Boolean)
  const pageNumber = verse.page_number || verse.v1_page || verse.page

  useEffect(() => {
    if (readingMode === 'hifz') {
      setBlankMask(buildBlankMask(words))
      setBlankInputs({})
      setGuidedCount(1)
      setRevealed(false)
      setHifzChallenge('guided')
    }
  }, [ayahNum, readingMode, words])

  useEffect(() => {
    onViewed?.()
  }, [onViewed])

  const shareAyah = useCallback(async () => {
    const url = `${window.location.origin}/quran/${surah.id}/${ayahNum}`
    try {
      await navigator.clipboard.writeText(url)
      toast.success('Ayah link copied.')
    } catch {
      toast.error('Could not copy link.')
    }
  }, [ayahNum, surah.id])

  return (
    <div id={`ayah-${ayahNum}`} style={{ padding: '16px 0', borderBottom: '0.5px solid var(--t-border)', background: isHighlighted ? 'rgba(201,135,10,0.08)' : 'transparent', transition: 'background 0.3s' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={() => { isPlaying ? audio.pause() : audio.playVerse(surah.id, ayahNum, verse.audio?.url) }}
            style={{ width: 28, height: 28, borderRadius: '50%', background: isPlaying ? 'var(--t-accent)' : 'var(--t-border)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            {isPlaying ? <Pause size={12} color="white" /> : <Play size={12} style={{ color: 'var(--t-text-muted)' }} />}
          </button>
          <button onClick={() => addBookmark(surah.id, ayahNum)} style={{ width: 28, height: 28, borderRadius: '50%', background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <BookMarked size={14} style={{ color: isBookmarked ? 'var(--t-accent)' : 'var(--t-text-muted)' }} fill={isBookmarked ? 'currentColor' : 'none'} />
          </button>
          <button onClick={() => setTafsirVerse({ surahNum: surah.id, ayahNum, text: arabicText, trans: translations[0]?.text || stripHtml(verse.translations?.[0]?.text || '') })} style={{ width: 28, height: 28, borderRadius: '50%', background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, color: 'var(--t-text-muted)' }} title="View Tafsir">
            📖
          </button>
          <button onClick={shareAyah} style={{ width: 28, height: 28, borderRadius: '50%', background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--t-text-muted)' }} title="Copy verse link">
            <Link2 size={14} />
          </button>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {pageNumber ? <span style={{ fontSize: 10, color: 'var(--t-text-muted)' }}>p. {pageNumber}</span> : null}
          <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--t-accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 600, color: 'white' }}>{ayahNum}</div>
        </div>
      </div>

      {readingMode === 'hifz' ? (
        <div style={{ display: 'grid', gap: 10 }}>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {[
              ['guided', 'Guided'],
              ['blanks', 'Blank 30%'],
              ['hidden', 'Full hide'],
            ].map(([id, label]) => (
              <button
                key={id}
                onClick={() => {
                  if (id === 'guided') setGuidedCount(1)
                  if (id === 'blanks') setBlankMask(buildBlankMask(words))
                  if (id === 'hidden') setRevealed(false)
                  setHifzChallenge(id)
                }}
                style={{ padding: '4px 10px', borderRadius: 8, border: '0.5px solid var(--t-border)', background: hifzChallenge === id ? 'rgba(20,168,96,0.1)' : 'var(--t-bg-card)', cursor: 'pointer', fontSize: 11, color: hifzChallenge === id ? 'var(--t-primary)' : 'var(--t-text-muted)' }}
              >
                {label}
              </button>
            ))}
          </div>

          {hifzChallenge === 'guided' && (
            <div onClick={() => setGuidedCount((count) => Math.min(words.length, count + 1))} style={{ cursor: 'pointer', textAlign: 'right', direction: 'rtl', lineHeight: 2.2 }}>
              {words.map((word, index) => (
                <span key={`${ayahNum}-${index}`} style={{ fontFamily: 'Amiri,serif', fontSize: `calc(${fontScale}px * 1px)`, color: index < guidedCount ? 'var(--t-text)' : 'transparent', textShadow: index < guidedCount ? 'none' : '0 0 8px rgba(0,0,0,0.18)', marginLeft: 8 }}>
                  {word.text_uthmani || word.text}
                </span>
              ))}
              <p style={{ fontSize: 11, color: 'var(--t-text-muted)', marginTop: 8 }}>Tap to reveal the next word.</p>
            </div>
          )}

          {hifzChallenge === 'blanks' && (
            <div style={{ textAlign: 'right', direction: 'rtl', lineHeight: 2.2, display: 'flex', flexWrap: 'wrap', justifyContent: 'flex-end', gap: 8 }}>
              {words.map((word, index) => {
                const token = word.text_uthmani || word.text
                if (!blankMask[index]) {
                  return <span key={`${ayahNum}-${index}`} style={{ fontFamily: 'Amiri,serif', fontSize: `calc(${fontScale}px * 1px)`, color: 'var(--t-text)' }}>{token}</span>
                }
                const entered = blankInputs[index] || ''
                const isCorrect = entered && normalizeArabic(entered) === normalizeArabic(token)
                return (
                  <input
                    key={`${ayahNum}-${index}`}
                    value={entered}
                    onChange={(event) => setBlankInputs((current) => ({ ...current, [index]: event.target.value }))}
                    placeholder="___"
                    style={{ minWidth: 72, borderRadius: 8, border: `1px solid ${isCorrect ? '#16a34a' : 'var(--t-border)'}`, padding: '4px 8px', background: isCorrect ? 'rgba(22,163,74,0.08)' : 'var(--t-bg-card)', color: 'var(--t-text)', direction: 'rtl', textAlign: 'right' }}
                  />
                )
              })}
            </div>
          )}

          {hifzChallenge === 'hidden' && (
            <div onClick={() => setRevealed((value) => !value)} style={{ cursor: 'pointer' }}>
              {revealed ? (
                <p style={{ fontFamily: 'Amiri,serif', fontSize: `calc(${fontScale}px * 1px)`, lineHeight: 2.2, textAlign: 'right', direction: 'rtl', color: 'var(--t-text)' }}>{arabicText}</p>
              ) : (
                <div style={{ borderRadius: 10, height: 56, background: 'var(--t-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--t-text-muted)', fontSize: 13 }}>Tap to reveal</div>
              )}
            </div>
          )}
        </div>
      ) : showGrammar ? (
        <Tooltip.Provider delayDuration={150}>
          <div style={{ textAlign: 'right', direction: 'rtl', lineHeight: 2.5, display: 'flex', flexWrap: 'wrap', flexDirection: 'row-reverse', gap: 6 }}>
            {words.map((word, index) => <WordTooltip key={`${ayahNum}-${index}`} word={word} showTranslit={showTranslit} showTajweed={showTajweed} />)}
          </div>
        </Tooltip.Provider>
      ) : showTajweed && verse.text_tajweed ? (
        <p style={{ fontFamily: 'Amiri,serif', fontSize: `calc(${fontScale}px * 1px)`, lineHeight: 2.2, textAlign: 'right', direction: 'rtl', color: 'var(--t-text)', wordSpacing: '0.15em' }} dangerouslySetInnerHTML={{ __html: verse.text_tajweed }} />
      ) : (
        <p style={{ fontFamily: 'Amiri,serif', fontSize: `calc(${fontScale}px * 1px)`, lineHeight: 2.2, textAlign: 'right', direction: 'rtl', color: 'var(--t-text)', wordSpacing: '0.15em' }}>
          {arabicText}
        </p>
      )}

      {showTrans && translations.length > 0 && (
        <div style={{ display: 'grid', gap: 8, marginTop: 8, gridTemplateColumns: translations.length > 1 ? 'repeat(auto-fit, minmax(220px, 1fr))' : '1fr' }}>
          {translations.map((translation) => (
            <div key={`${ayahNum}-${translation.id}`} style={{ paddingLeft: 12, borderLeft: '2px solid rgba(20,168,96,0.25)' }}>
              <p style={{ fontSize: 10, fontWeight: 700, color: 'var(--t-accent)', marginBottom: 3 }}>{translation.label}</p>
              <p style={{ fontSize: '0.9rem', color: 'var(--t-text-muted)', lineHeight: 1.7 }}>{translation.text}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function VirtualAyahList({ verses, surah, audio, bookmarks, addBookmark, setTafsirVerse, readingMode, showGrammar, showTranslit, showTrans, showTajweed, fontScale, translationIds, scrollToAyah, focusMode, onViewed }) {
  const parentRef = useRef(null)
  const rowVirtualizer = useVirtualizer({
    count: verses.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 220,
    overscan: 5,
  })

  useEffect(() => {
    if (!scrollToAyah) return
    const targetIndex = verses.findIndex((verse) => verse.verse_number === Number(scrollToAyah))
    if (targetIndex >= 0) {
      rowVirtualizer.scrollToIndex(targetIndex, { align: 'center' })
    }
  }, [rowVirtualizer, scrollToAyah, verses])

  return (
    <div ref={parentRef} style={{ overflowY: 'auto', maxHeight: focusMode ? '80vh' : 'calc(100vh - 280px)' }}>
      <div style={{ height: rowVirtualizer.getTotalSize(), width: '100%', position: 'relative' }}>
        {rowVirtualizer.getVirtualItems().map((virtualItem) => {
          const verse = verses[virtualItem.index]
          return (
            <div
              key={virtualItem.key}
              data-index={virtualItem.index}
              ref={rowVirtualizer.measureElement}
              style={{ position: 'absolute', top: 0, left: 0, width: '100%', transform: `translateY(${virtualItem.start}px)` }}
            >
              <AyahRow
                verse={verse}
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
                fontScale={fontScale}
                onViewed={onViewed}
              />
            </div>
          )
        })}
      </div>
    </div>
  )
}

function SurahReader({ surah, onBack, audio, scrollToAyah }) {
  const queryClient = useQueryClient()
  const [showTrans, setShowTrans] = useStickyState(true, 'q_show_trans')
  const [showTranslit, setShowTranslit] = useStickyState(false, 'q_show_translit')
  const [showTajweed, setShowTajweed] = useStickyState(true, 'q_show_tajweed')
  const [showGrammar, setShowGrammar] = useStickyState(false, 'q_show_grammar')
  const [readingMode, setReadingMode] = useStickyState('scroll', 'q_reading_mode')
  const [fontScale, setFontScale] = useStickyState(26, 'q_font_size')
  const [focusMode, setFocusMode] = useState(false)
  const [bookmarkSheet, setBookmarkSheet] = useState(null)
  const [noteText, setNoteText] = useState('')
  const [hlColor, setHlColor] = useState('gold')
  const [tafsirVerse, setTafsirVerse] = useState(null)
  const [showSleepTimer, setShowSleepTimer] = useState(false)
  const [translationIds, setTranslationIds] = useStickyState([20], 'q_translation_ids')
  const sessionStart = useRef(Date.now())
  const versesRead = useRef(new Set())

  const translationOptions = [
    { id: 20, label: 'Sahih International' },
    { id: 131, label: 'The Clear Quran' },
  ]

  const translationQueries = useQueries({
    queries: translationIds.map((translationId) => ({
      queryKey: ['quran', 'surah', surah.id, translationId],
      queryFn: () => api.get(`/quran/surah/${surah.id}?translation_id=${translationId}`).then((response) => response.data),
      staleTime: 30 * 60_000,
    })),
  })

  const isLoading = translationQueries.some((query) => query.isLoading)
  const baseData = translationQueries[0]?.data
  const mergedVerses = useMemo(() => {
    if (!baseData?.verses) return []
    const byKey = new Map()
    baseData.verses.forEach((verse) => {
      byKey.set(verse.verse_key, {
        ...verse,
        translationMap: {
          [translationIds[0]]: {
            id: translationIds[0],
            label: translationOptions.find((option) => option.id === translationIds[0])?.label || `Translation ${translationIds[0]}`,
            text: stripHtml(verse.translations?.[0]?.text || ''),
          },
        },
      })
    })
    translationQueries.slice(1).forEach((query, index) => {
      const translationId = translationIds[index + 1]
      query.data?.verses?.forEach((verse) => {
        const current = byKey.get(verse.verse_key)
        if (current) {
          current.translationMap[translationId] = {
            id: translationId,
            label: translationOptions.find((option) => option.id === translationId)?.label || `Translation ${translationId}`,
            text: stripHtml(verse.translations?.[0]?.text || ''),
          }
        }
      })
    })
    return [...byKey.values()]
  }, [baseData, translationIds, translationOptions, translationQueries])

  const { data: bookmarks = [] } = useQuery({
    queryKey: ['quran', 'bookmarks'],
    queryFn: () => api.get('/quran/bookmarks').then((response) => response.data).catch(() => []),
  })

  useEffect(() => {
    return () => {
      const minutesRead = Math.round((Date.now() - sessionStart.current) / 60_000)
      if (minutesRead < 1 || versesRead.current.size < 1) return
      api.post('/quran/reading-log', {
        surah_from: surah.id,
        ayah_from: 1,
        surah_to: surah.id,
        ayah_to: mergedVerses.length || surah.verses_count,
        verses_read: versesRead.current.size,
        minutes_read: minutesRead,
        mode: readingMode,
      }).catch(() => {})
    }
  }, [mergedVerses.length, readingMode, surah.id, surah.verses_count])

  const addBookmark = async (surahNum, ayahNum) => {
    const existing = bookmarks.find((bookmark) => bookmark.surah_number === surahNum && bookmark.ayah_number === ayahNum)
    if (existing) {
      await api.delete(`/quran/bookmarks/${existing.id}`)
      toast.success('Bookmark removed')
      queryClient.invalidateQueries({ queryKey: ['quran', 'bookmarks'] })
      return
    }
    setBookmarkSheet({ surahNum, ayahNum })
    setNoteText('')
    setHlColor('gold')
  }

  const saveBookmark = async () => {
    await api.post('/quran/bookmarks', { surah_number: bookmarkSheet.surahNum, ayah_number: bookmarkSheet.ayahNum, note: noteText || null, highlight_color: hlColor })
    queryClient.invalidateQueries({ queryKey: ['quran', 'bookmarks'] })
    toast.success('Bookmarked')
    setBookmarkSheet(null)
  }

  const readerContent = isLoading ? (
    [...Array(5)].map((_, index) => <Skeleton key={index} className="h-24 mb-4" />)
  ) : (
    <VirtualAyahList
      verses={mergedVerses}
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
      fontScale={fontScale}
      translationIds={translationIds}
      scrollToAyah={scrollToAyah}
      focusMode={focusMode}
      onViewed={() => {
        if (scrollToAyah) versesRead.current.add(Number(scrollToAyah))
      }}
    />
  )

  return (
    <div>
      {!focusMode && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
          <button onClick={onBack} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--t-primary)', display: 'flex', alignItems: 'center', gap: 4, fontSize: 13 }}>
            <ChevronLeft size={16} /> Back
          </button>
          <div style={{ flex: 1 }}>
            <p style={{ fontWeight: 700, fontSize: 16, color: 'var(--t-text)' }}>{surah.name_simple}</p>
            <p style={{ fontSize: 12, color: 'var(--t-text-muted)' }}>{surah.translated_name?.name} · {surah.verses_count} verses</p>
          </div>
          {[['Trans', showTrans, setShowTrans], ['Latin', showTranslit, setShowTranslit], ['Tajweed', showTajweed, setShowTajweed], ['Words', showGrammar, setShowGrammar]].map(([label, active, toggle]) => (
            <button key={label} onClick={() => toggle((value) => !value)} style={{ padding: '4px 10px', borderRadius: 8, border: '0.5px solid', borderColor: active ? 'var(--t-primary)' : 'var(--t-border)', background: active ? 'rgba(20,168,96,0.1)' : 'var(--t-bg-card)', fontSize: 11, color: active ? 'var(--t-primary)' : 'var(--t-text-muted)', cursor: 'pointer' }}>
              {label}
            </button>
          ))}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 11, color: 'var(--t-text-muted)' }}>A-</span>
            <input type="range" min="22" max="36" value={fontScale} onChange={(event) => setFontScale(Number(event.target.value))} />
            <span style={{ fontSize: 11, color: 'var(--t-text-muted)' }}>A+</span>
          </div>
          <button onClick={() => setShowSleepTimer((value) => !value)} style={{ padding: '4px 8px', borderRadius: 8, border: '0.5px solid', borderColor: audio.sleepTimer ? '#a855f7' : 'var(--t-border)', background: audio.sleepTimer ? 'rgba(168,85,247,0.1)' : 'var(--t-bg-card)', cursor: 'pointer', color: audio.sleepTimer ? '#a855f7' : 'var(--t-text-muted)' }} title="Sleep timer">
            <Timer size={14} />
          </button>
          <button onClick={() => setFocusMode(true)} style={{ padding: '4px 8px', borderRadius: 8, border: '0.5px solid var(--t-border)', background: 'var(--t-bg-card)', cursor: 'pointer', color: 'var(--t-text-muted)' }}><Maximize2 size={14} /></button>
        </div>
      )}

      {!focusMode && (
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
          {READING_MODES.map((mode) => (
            <button
              key={mode.id}
              onClick={() => setReadingMode(mode.id)}
              style={{ padding: '7px 10px', borderRadius: 10, border: '0.5px solid', borderColor: readingMode === mode.id ? 'var(--t-primary)' : 'var(--t-border)', background: readingMode === mode.id ? 'rgba(20,168,96,0.1)' : 'var(--t-bg-card)', cursor: 'pointer', fontSize: 12, color: readingMode === mode.id ? 'var(--t-primary)' : 'var(--t-text-muted)' }}
            >
              {mode.icon} {mode.label}
            </button>
          ))}
          {translationOptions.map((option) => {
            const active = translationIds.includes(option.id)
            return (
              <button
                key={option.id}
                onClick={() => setTranslationIds((current) => active ? current.filter((id) => id !== option.id) : [...current, option.id].slice(0, 2))}
                style={{ padding: '7px 10px', borderRadius: 10, border: '0.5px solid', borderColor: active ? 'var(--t-primary)' : 'var(--t-border)', background: active ? 'rgba(59,130,246,0.1)' : 'var(--t-bg-card)', cursor: 'pointer', fontSize: 12, color: active ? 'var(--t-primary)' : 'var(--t-text-muted)' }}
              >
                {option.label}
              </button>
            )
          })}
        </div>
      )}

      {focusMode && (
        <div style={{ position: 'fixed', inset: 0, background: 'var(--t-bg)', zIndex: 50, overflowY: 'auto', padding: '20px 16px' }}>
          <button onClick={() => setFocusMode(false)} style={{ position: 'fixed', top: 16, right: 16, background: 'var(--t-bg-card)', border: '0.5px solid var(--t-border)', borderRadius: 8, padding: '6px 10px', cursor: 'pointer', color: 'var(--t-text-muted)' }}>
            <Minimize2 size={16} />
          </button>
          <div style={{ maxWidth: 760, margin: '0 auto', paddingTop: 40 }}>{readerContent}</div>
        </div>
      )}

      {!focusMode && readerContent}

      {showSleepTimer && (
        <div style={{ marginTop: 12, marginBottom: 12, padding: '12px 14px', borderRadius: 12, background: 'rgba(168,85,247,0.08)', border: '1px solid rgba(168,85,247,0.25)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <p style={{ fontWeight: 600, fontSize: 13, color: '#a855f7' }}>Sleep Timer</p>
            {audio.sleepTimer && <button onClick={audio.cancelSleepTimer} style={{ padding: '3px 10px', borderRadius: 8, background: 'rgba(239,68,68,0.1)', border: '0.5px solid #ef4444', color: '#ef4444', fontSize: 11, cursor: 'pointer' }}>Cancel</button>}
          </div>
          {audio.sleepTimer ? (
            <p style={{ fontSize: 13, color: 'var(--t-text)' }}>Timer set: <strong>{audio.sleepTimer.label}</strong></p>
          ) : (
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {[15, 30, 60].map((minutes) => (
                <button key={minutes} onClick={() => { audio.startSleepTimer(minutes); setShowSleepTimer(false) }} style={{ padding: '6px 14px', borderRadius: 10, background: 'rgba(168,85,247,0.1)', border: '0.5px solid rgba(168,85,247,0.3)', color: '#a855f7', fontSize: 13, cursor: 'pointer', fontWeight: 600 }}>
                  {minutes} min
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      <Modal open={!!bookmarkSheet} onClose={() => setBookmarkSheet(null)} title="Add bookmark">
        <div className="space-y-4">
          <div>
            <p className="label">Colour</p>
            <div style={{ display: 'flex', gap: 8 }}>
              {HIGHLIGHT_COLORS.map((color) => <button key={color} onClick={() => setHlColor(color)} style={{ width: 28, height: 28, borderRadius: '50%', border: `2px solid ${hlColor === color ? 'var(--t-text)' : 'transparent'}`, background: color, cursor: 'pointer' }} />)}
            </div>
          </div>
          <div>
            <p className="label">Note (optional)</p>
            <input className="input" placeholder="Your reflection…" value={noteText} onChange={(event) => setNoteText(event.target.value)} />
          </div>
          <Button variant="primary" className="w-full" onClick={saveBookmark}>Save bookmark</Button>
        </div>
      </Modal>

      <Modal open={!!tafsirVerse} onClose={() => setTafsirVerse(null)} title={`Tafsir Ibn Kathir — ${surah.name_simple} ${tafsirVerse?.ayahNum}`}>
        {tafsirVerse && <TafsirViewer surahNum={tafsirVerse.surahNum} ayahNum={tafsirVerse.ayahNum} arabicText={tafsirVerse.text} translation={tafsirVerse.trans} />}
      </Modal>
    </div>
  )
}

function TafsirViewer({ surahNum, ayahNum, arabicText, translation }) {
  const { data: tafsirData, isLoading, isError } = useQuery({
    queryKey: ['quran', 'tafsir', surahNum, ayahNum],
    queryFn: () => api.get(`/quran/tafsir/${surahNum}/${ayahNum}`).then((response) => response.data),
    staleTime: 60 * 60_000,
  })

  return (
    <div className="space-y-4" style={{ maxHeight: '75vh', overflowY: 'auto' }}>
      <div style={{ borderBottom: '1px solid var(--t-border)', paddingBottom: 16 }}>
        <p style={{ fontFamily: 'Amiri,serif', fontSize: '1.5rem', lineHeight: 2.2, textAlign: 'right', direction: 'rtl', color: 'var(--t-text)', marginBottom: 10 }}>{arabicText}</p>
        <p style={{ fontSize: 15, color: 'var(--t-text-muted)', lineHeight: 1.7 }}>{translation}</p>
      </div>
      {isLoading ? (
        <div style={{ padding: '20px 0' }}>
          <Skeleton className="h-6 w-3/4 mb-4" />
          <Skeleton className="h-4 w-full mb-2" />
          <Skeleton className="h-4 w-full mb-2" />
          <Skeleton className="h-4 w-5/6" />
        </div>
      ) : isError ? (
        <p style={{ color: '#ef4444', fontSize: 14 }}>Failed to load Tafsir.</p>
      ) : tafsirData?.tafsir?.text ? (
        <div className="tafsir-content" style={{ fontSize: 15, lineHeight: 1.8, color: 'var(--t-text)' }} dangerouslySetInnerHTML={{ __html: tafsirData.tafsir.text }} />
      ) : (
        <p style={{ color: 'var(--t-text-muted)', fontSize: 14 }}>No Tafsir available.</p>
      )}
    </div>
  )
}

function HifzTab() {
  const queryClient = useQueryClient()
  const [addModal, setAddModal] = useState(false)
  const [hifzMode, setHifzMode] = useState(0)
  const [dailyTarget, setDailyTarget] = useState(5)
  const [form, setForm] = useState({ surah_number: 1, surah_name: 'Al-Fatihah', ayah_from: 1, ayah_to: 7, total_ayahs: 7 })
  const { data: entries = [], isLoading } = useQuery({ queryKey: ['quran', 'hifz'], queryFn: () => api.get('/quran/hifz').then((response) => response.data).catch(() => []) })
  const { data: dueToday = [] } = useQuery({ queryKey: ['quran', 'hifz', 'due'], queryFn: () => api.get('/quran/hifz/due-today').then((response) => response.data).catch(() => []) })
  const { mutate: addEntry } = useMutation({ mutationFn: () => api.post('/quran/hifz', form), onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['quran', 'hifz'] }); setAddModal(false); toast.success('Added') } })
  const { mutate: review } = useMutation({ mutationFn: ({ id, quality }) => api.post(`/quran/hifz/${id}/review`, { quality }), onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['quran', 'hifz'] }); toast.success('Saved') } })
  const boxColors = ['', '#ef4444', '#f97316', '#eab308', '#22c55e', '#16a34a']
  const memorisedCount = entries.filter((entry) => entry.status === 'memorised').length
  const progressPercent = Math.round((memorisedCount / 114) * 100)
  const statusBySurah = new Map()
  entries.forEach((entry) => {
    const current = statusBySurah.get(entry.surah_number)
    const next = entry.status === 'memorised' ? 'memorised' : entry.next_review && dueToday.some((due) => due.id === entry.id) ? 'due' : 'in_progress'
    if (!current || current === 'in_progress') statusBySurah.set(entry.surah_number, next)
  })

  return (
    <div className="space-y-4">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div><h2 style={{ fontWeight: 700, fontSize: 18, color: 'var(--t-text)' }}>Hifz Tracker</h2><p style={{ fontSize: 12, color: 'var(--t-text-muted)' }}>{dueToday.length} due today</p></div>
        <Button variant="primary" size="sm" onClick={() => setAddModal(true)}><Plus size={14} /> Add</Button>
      </div>

      <div style={{ borderRadius: 14, padding: 16, background: 'linear-gradient(135deg,rgba(20,168,96,0.1),rgba(201,135,10,0.05))', border: '0.5px solid var(--t-border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <div>
            <p style={{ fontWeight: 700, fontSize: 15, color: 'var(--t-text)' }}>Hifz Planner</p>
            <p style={{ fontSize: 12, color: 'var(--t-text-muted)', marginTop: 2 }}>{memorisedCount} of 114 surahs · {progressPercent}% complete</p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <p style={{ fontSize: 11, color: 'var(--t-text-muted)' }}>Daily target</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
              <button onClick={() => setDailyTarget((target) => Math.max(1, target - 1))} style={{ width: 24, height: 24, borderRadius: '50%', border: '0.5px solid var(--t-border)', background: 'var(--t-bg-card)', cursor: 'pointer', fontSize: 14, color: 'var(--t-text-muted)' }}>−</button>
              <span style={{ fontWeight: 700, fontSize: 16, color: 'var(--t-text)', minWidth: 20, textAlign: 'center' }}>{dailyTarget}</span>
              <button onClick={() => setDailyTarget((target) => Math.min(20, target + 1))} style={{ width: 24, height: 24, borderRadius: '50%', border: '0.5px solid var(--t-border)', background: 'var(--t-bg-card)', cursor: 'pointer', fontSize: 14, color: 'var(--t-text-muted)' }}>+</button>
              <span style={{ fontSize: 11, color: 'var(--t-text-muted)' }}>ayahs/day</span>
            </div>
          </div>
        </div>
        <div style={{ height: 6, background: 'var(--t-border)', borderRadius: 3, overflow: 'hidden', marginBottom: 8 }}>
          <div style={{ height: '100%', width: `${progressPercent}%`, background: 'var(--t-primary)', borderRadius: 3, transition: 'width 0.7s' }} />
        </div>
        <p style={{ fontSize: 12, color: 'var(--t-text-muted)' }}>At {dailyTarget} ayahs/day — estimated completion in ~<strong style={{ color: 'var(--t-primary)' }}>{Math.ceil((6236 * (1 - progressPercent / 100)) / dailyTarget)} days</strong></p>
      </div>

      <Card>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <h3 style={{ fontWeight: 700, fontSize: 14, color: 'var(--t-text)' }}>Hifz Progress Map</h3>
          <div style={{ display: 'flex', gap: 10, fontSize: 10, color: 'var(--t-text-muted)' }}>
            <span>Gray: not started</span>
            <span>Amber: in progress</span>
            <span>Blue: due</span>
            <span>Green: memorised</span>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, minmax(0, 1fr))', gap: 8 }}>
          {Array.from({ length: 114 }, (_, index) => index + 1).map((surahNumber) => {
            const status = statusBySurah.get(surahNumber)
            const color = status === 'memorised' ? '#16a34a' : status === 'due' ? '#3b82f6' : status === 'in_progress' ? '#f59e0b' : 'var(--t-border)'
            return (
              <div key={surahNumber} style={{ height: 34, borderRadius: 8, background: color, opacity: status ? 1 : 0.5, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: status ? 'white' : 'var(--t-text-muted)' }}>
                {surahNumber}
              </div>
            )
          })}
        </div>
      </Card>

      <div style={{ display: 'flex', gap: 4, overflowX: 'auto' }}>
        {HIFZ_MODES.map((mode, index) => <button key={mode} onClick={() => setHifzMode(index)} style={{ padding: '6px 12px', borderRadius: 99, border: '0.5px solid', borderColor: hifzMode === index ? 'var(--t-primary)' : 'var(--t-border)', background: hifzMode === index ? 'rgba(20,168,96,0.1)' : 'var(--t-bg-card)', fontSize: 12, color: hifzMode === index ? 'var(--t-primary)' : 'var(--t-text-muted)', cursor: 'pointer', whiteSpace: 'nowrap' }}>{mode}</button>)}
      </div>

      {dueToday.length > 0 && (
        <Card>
          <h3 style={{ fontWeight: 600, fontSize: 14, marginBottom: 10, color: 'var(--t-accent)' }}>Due today ({dueToday.length})</h3>
          <div className="space-y-3">
            {dueToday.slice(0, 5).map((entry) => (
              <div key={entry.id} style={{ padding: 12, borderRadius: 10, background: 'var(--t-bg)', border: '0.5px solid var(--t-border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                  <div><p style={{ fontWeight: 600, fontSize: 14, color: 'var(--t-text)' }}>{entry.surah_name || `Surah ${entry.surah_number}`}</p><p style={{ fontSize: 12, color: 'var(--t-text-muted)' }}>Ayah {entry.ayah_from}–{entry.ayah_to} · Box {entry.leitner_box || 1}/5</p></div>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: boxColors[entry.leitner_box || 1] }} />
                </div>
                <div style={{ display: 'flex', gap: 4 }}>
                  {SM2_LABELS.map((label, quality) => <button key={label} onClick={() => review({ id: entry.id, quality })} style={{ flex: 1, padding: '5px 2px', borderRadius: 7, border: 'none', background: `${SM2_COLORS[quality]}22`, color: SM2_COLORS[quality], fontSize: 10, fontWeight: 600, cursor: 'pointer' }}>{label}</button>)}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      <Card>
        <h3 style={{ fontWeight: 600, fontSize: 14, marginBottom: 10, color: 'var(--t-text)' }}>All entries ({entries.length})</h3>
        {isLoading ? [...Array(3)].map((_, index) => <Skeleton key={index} className="h-12 mb-2" />) : entries.length === 0 ? <p style={{ fontSize: 13, color: 'var(--t-text-muted)', textAlign: 'center', padding: 16 }}>No entries yet.</p> : entries.map((entry) => (
          <div key={entry.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: '0.5px solid var(--t-border)' }}>
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: boxColors[entry.leitner_box || 1], flexShrink: 0 }} />
            <div style={{ flex: 1 }}><p style={{ fontWeight: 600, fontSize: 13, color: 'var(--t-text)' }}>{entry.surah_name || `Surah ${entry.surah_number}`}</p><p style={{ fontSize: 11, color: 'var(--t-text-muted)' }}>Ayah {entry.ayah_from}–{entry.ayah_to} · {entry.status}</p></div>
            <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 99, background: 'var(--t-border)', color: 'var(--t-text-muted)' }}>Box {entry.leitner_box || 1}</span>
          </div>
        ))}
      </Card>

      <Modal open={addModal} onClose={() => setAddModal(false)} title="Add to Hifz">
        <div className="space-y-3">
          {[['Surah number', 'surah_number', 'number'], ['Surah name', 'surah_name', 'text'], ['Ayah from', 'ayah_from', 'number'], ['Ayah to', 'ayah_to', 'number'], ['Total ayahs', 'total_ayahs', 'number']].map(([label, field, type]) => (
            <div key={field}>
              <p className="label">{label}</p>
              <input className="input" type={type} value={form[field]} onChange={(event) => setForm((current) => ({ ...current, [field]: type === 'number' ? parseInt(event.target.value, 10) || 0 : event.target.value }))} />
            </div>
          ))}
          <Button variant="primary" className="w-full" onClick={() => addEntry()}>Add</Button>
        </div>
      </Modal>
    </div>
  )
}

function DuaTab() {
  const queryClient = useQueryClient()
  const [selectedCat, setSelectedCat] = useState(null)
  const [addModal, setAddModal] = useState(false)
  const [newDua, setNewDua] = useState({ title: '', text: '' })
  const [activeDua, setActiveDua] = useState(null)
  const { data: categories = [] } = useQuery({ queryKey: ['quran', 'dua-cats'], queryFn: () => api.get('/quran/duas/categories').then((response) => response.data).catch(() => []) })
  const { data: duas = [] } = useQuery({ queryKey: ['quran', 'duas', selectedCat], queryFn: () => api.get('/quran/duas', { params: selectedCat ? { category: selectedCat } : {} }).then((response) => response.data).catch(() => []) })
  const { data: personal = [] } = useQuery({ queryKey: ['quran', 'personal-duas'], queryFn: () => api.get('/quran/duas/personal').then((response) => response.data).catch(() => []) })
  const { data: duaOfDay } = useQuery({ queryKey: ['quran', 'dua-of-day'], queryFn: () => api.get('/quran/duas/of-the-day').then((response) => response.data).catch(() => null) })
  const { mutate: createPersonal } = useMutation({ mutationFn: () => api.post('/quran/duas/personal', newDua), onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['quran', 'personal-duas'] }); setAddModal(false); setNewDua({ title: '', text: '' }); toast.success('Dua added') } })
  const { mutate: markAnswered } = useMutation({ mutationFn: ({ id }) => api.patch(`/quran/duas/personal/${id}`, { is_answered: true }), onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['quran', 'personal-duas'] }); toast.success('Alhamdulillah') } })
  return (
    <div className="space-y-4">
      {duaOfDay && (
        <div style={{ borderRadius: 14, padding: 16, background: 'linear-gradient(135deg,var(--t-bg-sidebar),var(--t-bg-card))' }}>
          <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--t-accent)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>Dua of the day</p>
          <p style={{ fontFamily: 'Amiri,serif', fontSize: '1.3rem', lineHeight: 2, textAlign: 'right', direction: 'rtl', color: 'var(--t-text)', marginBottom: 8 }}>{duaOfDay.arabic_text}</p>
          {duaOfDay.transliteration && <p style={{ fontSize: 13, color: 'var(--t-text-muted)', fontStyle: 'italic', marginBottom: 4 }}>{duaOfDay.transliteration}</p>}
          <p style={{ fontSize: 13, color: 'var(--t-text)' }}>{duaOfDay.translation}</p>
          {duaOfDay.source && <p style={{ fontSize: 11, color: 'var(--t-text-muted)', marginTop: 6 }}>— {duaOfDay.source}</p>}
        </div>
      )}
      <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 4 }}>
        <button onClick={() => setSelectedCat(null)} style={{ padding: '5px 12px', borderRadius: 99, border: '0.5px solid', borderColor: !selectedCat ? 'var(--t-primary)' : 'var(--t-border)', background: !selectedCat ? 'rgba(20,168,96,0.1)' : 'var(--t-bg-card)', fontSize: 12, color: !selectedCat ? 'var(--t-primary)' : 'var(--t-text-muted)', cursor: 'pointer', whiteSpace: 'nowrap' }}>All</button>
        {categories.map((category) => <button key={category.category} onClick={() => setSelectedCat(category.category)} style={{ padding: '5px 12px', borderRadius: 99, border: '0.5px solid', borderColor: selectedCat === category.category ? 'var(--t-primary)' : 'var(--t-border)', background: selectedCat === category.category ? 'rgba(20,168,96,0.1)' : 'var(--t-bg-card)', fontSize: 12, color: selectedCat === category.category ? 'var(--t-primary)' : 'var(--t-text-muted)', cursor: 'pointer', whiteSpace: 'nowrap' }}>{category.category.replace('_', ' ')} ({category.count})</button>)}
      </div>
      <div className="space-y-3">
        {duas.slice(0, 20).map((dua) => (
          <Card key={dua.id}>
            <button style={{ width: '100%', textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }} onClick={() => setActiveDua(activeDua?.id === dua.id ? null : dua)}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                <p style={{ fontWeight: 600, fontSize: 14, color: 'var(--t-text)' }}>{dua.title}</p>
                <ChevronDown size={14} style={{ color: 'var(--t-text-muted)', transform: activeDua?.id === dua.id ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
              </div>
              {activeDua?.id === dua.id ? (
                <>
                  <p style={{ fontFamily: 'Amiri,serif', fontSize: '1.2rem', lineHeight: 2, textAlign: 'right', direction: 'rtl', color: 'var(--t-text)', marginBottom: 8 }}>{dua.arabic_text}</p>
                  {dua.transliteration && <p style={{ fontSize: 12, color: 'var(--t-text-muted)', fontStyle: 'italic', marginBottom: 4 }}>{dua.transliteration}</p>}
                  <p style={{ fontSize: 13, color: 'var(--t-text)' }}>{dua.translation}</p>
                  {dua.source && <p style={{ fontSize: 11, color: 'var(--t-accent)', marginTop: 6 }}>— {dua.source}</p>}
                  {dua.when_to_recite && <p style={{ fontSize: 11, color: 'var(--t-text-muted)', marginTop: 4, fontStyle: 'italic' }}>When: {dua.when_to_recite}</p>}
                </>
              ) : <p style={{ fontSize: 12, color: 'var(--t-text-muted)' }}>{dua.category.replace('_', ' ')} · {dua.repetition_count}×</p>}
            </button>
          </Card>
        ))}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 }}>
        <h3 style={{ fontWeight: 700, fontSize: 16, color: 'var(--t-text)' }}>My duas ({personal.length})</h3>
        <Button variant="primary" size="sm" onClick={() => setAddModal(true)}><Plus size={14} /> Add</Button>
      </div>
      {personal.map((dua) => (
        <Card key={dua.id} style={{ opacity: dua.is_answered ? 0.7 : 1 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
            <div style={{ flex: 1 }}><p style={{ fontWeight: 600, fontSize: 14, color: dua.is_answered ? 'var(--t-text-muted)' : 'var(--t-text)', textDecoration: dua.is_answered ? 'line-through' : 'none' }}>{dua.title}</p><p style={{ fontSize: 12, color: 'var(--t-text-muted)', marginTop: 2 }}>{dua.text.slice(0, 80)}{dua.text.length > 80 ? '…' : ''}</p>{dua.is_answered && dua.answered_note && <p style={{ fontSize: 11, color: 'var(--t-primary)', marginTop: 4 }}>✓ {dua.answered_note}</p>}</div>
            {!dua.is_answered && <button onClick={() => markAnswered({ id: dua.id })} style={{ padding: '4px 10px', borderRadius: 8, background: 'rgba(20,168,96,0.1)', border: '0.5px solid var(--t-primary)', color: 'var(--t-primary)', fontSize: 11, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}>🤲 Answered</button>}
          </div>
        </Card>
      ))}
      <Modal open={addModal} onClose={() => setAddModal(false)} title="Add personal dua">
        <div className="space-y-4">
          <div><p className="label">Title</p><input className="input" placeholder="e.g. For my family" value={newDua.title} onChange={(event) => setNewDua((current) => ({ ...current, title: event.target.value }))} /></div>
          <div><p className="label">Your dua</p><textarea className="input resize-none" rows={4} placeholder="Write your dua…" value={newDua.text} onChange={(event) => setNewDua((current) => ({ ...current, text: event.target.value }))} /></div>
          <Button variant="primary" className="w-full" onClick={() => createPersonal()}>Save</Button>
        </div>
      </Modal>
    </div>
  )
}

function HadithTab() {
  const [search, setSearch] = useState('')
  const { data: hadithOfDay } = useQuery({ queryKey: ['hadith', 'day'], queryFn: () => api.get('/quran/hadith/of-the-day').then((response) => response.data).catch(() => null) })
  const { data: results = [] } = useQuery({ queryKey: ['hadith', 'search', search], queryFn: () => search.length >= 2 ? api.get(`/quran/hadith/search?q=${encodeURIComponent(search)}`).then((response) => response.data).catch(() => []) : [], enabled: search.length >= 2 })
  const { data: allHadiths = [] } = useQuery({ queryKey: ['hadith', 'all'], queryFn: () => api.get('/quran/hadith').then((response) => response.data).catch(() => []) })
  const displayed = search.length >= 2 ? results : allHadiths
  return (
    <div className="space-y-4">
      {hadithOfDay && (
        <div style={{ borderRadius: 14, padding: 16, background: 'var(--t-bg-sidebar)', border: '0.5px solid var(--t-border)' }}>
          <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--t-accent)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Hadith of the day</p>
          {hadithOfDay.arabic_text && <p style={{ fontFamily: 'Amiri,serif', fontSize: '1.1rem', lineHeight: 2, textAlign: 'right', direction: 'rtl', color: 'var(--t-text)', marginBottom: 8 }}>{hadithOfDay.arabic_text}</p>}
          <p style={{ fontSize: 13, lineHeight: 1.7, color: 'var(--t-text)', marginBottom: 8 }}>{hadithOfDay.english_text}</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 11, padding: '2px 10px', borderRadius: 99, background: GRADE_STYLES[hadithOfDay.grade]?.bg, color: GRADE_STYLES[hadithOfDay.grade]?.color, fontWeight: 700 }}>{GRADE_STYLES[hadithOfDay.grade]?.label}</span>
            <span style={{ fontSize: 11, color: 'var(--t-text-muted)' }}>{hadithOfDay.narrator_chain}</span>
          </div>
          <p style={{ fontSize: 11, color: 'var(--t-text-muted)', marginTop: 4 }}>{hadithOfDay.collection} #{hadithOfDay.hadith_number}</p>
        </div>
      )}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Search size={14} style={{ color: 'var(--t-text-muted)', flexShrink: 0 }} /><input className="input" placeholder="Search hadiths…" value={search} onChange={(event) => setSearch(event.target.value)} /></div>
      <div className="space-y-3">
        {displayed.map((hadith) => (
          <Card key={hadith.id}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontSize: 11, padding: '2px 10px', borderRadius: 99, background: GRADE_STYLES[hadith.grade]?.bg, color: GRADE_STYLES[hadith.grade]?.color, fontWeight: 700 }}>{GRADE_STYLES[hadith.grade]?.label}</span>
              <span style={{ fontSize: 11, color: 'var(--t-text-muted)' }}>{hadith.collection} #{hadith.hadith_number}</span>
            </div>
            {hadith.arabic_text && <p style={{ fontFamily: 'Amiri,serif', fontSize: '1rem', lineHeight: 2, textAlign: 'right', direction: 'rtl', color: 'var(--t-text)', marginBottom: 8 }}>{hadith.arabic_text}</p>}
            <p style={{ fontSize: 13, lineHeight: 1.7, color: 'var(--t-text)', marginBottom: 6 }}>{hadith.english_text}</p>
            {hadith.narrator_chain && <p style={{ fontSize: 11, color: 'var(--t-text-muted)', fontStyle: 'italic' }}>— {hadith.narrator_chain}</p>}
            {hadith.grade === 'daif' && <p style={{ fontSize: 11, color: '#d97706', marginTop: 6, padding: '4px 8px', background: 'rgba(245,158,11,0.08)', borderRadius: 6 }}>⚠ Da'if hadith — treat with caution and do not cite as religious obligation.</p>}
          </Card>
        ))}
      </div>
    </div>
  )
}

function StatsTab() {
  const { data: stats } = useQuery({ queryKey: ['quran', 'stats'], queryFn: () => api.get('/quran/stats').then((response) => response.data).catch(() => null) })
  const { data: hifz = [] } = useQuery({ queryKey: ['quran', 'hifz'], queryFn: () => api.get('/quran/hifz').then((response) => response.data).catch(() => []) })
  const { data: readingLogs = [] } = useQuery({ queryKey: ['quran', 'reading-log'], queryFn: () => api.get('/quran/reading-log', { params: { days: 120 } }).then((response) => response.data).catch(() => []) })
  const memorised = hifz.filter((entry) => entry.status === 'memorised').length
  const inProgress = hifz.filter((entry) => entry.status === 'in_progress').length
  const streak = getStreak(readingLogs)
  const heatmapValues = readingLogs.reduce((accumulator, log) => {
    const existing = accumulator.get(log.log_date) || 0
    accumulator.set(log.log_date, existing + (log.verses_read || 0))
    return accumulator
  }, new Map())

  return (
    <div className="space-y-4">
      <Card>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <h3 style={{ fontWeight: 700, fontSize: 16, color: 'var(--t-text)' }}>Khatam progress</h3>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 10px', borderRadius: 999, background: 'rgba(239,68,68,0.08)', color: '#ef4444' }}>
            <Flame size={14} />
            <span style={{ fontSize: 12, fontWeight: 700 }}>{streak} day streak</span>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <ProgressRing value={stats?.khatam_progress_pct || 0} max={100} size={80} strokeWidth={7} color="var(--t-accent)">
            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--t-text)' }}>{Math.round(stats?.khatam_progress_pct || 0)}%</span>
          </ProgressRing>
          <div>
            <p style={{ fontSize: 22, fontWeight: 700, color: 'var(--t-text)' }}>{(stats?.total_verses_read || 0).toLocaleString()}<span style={{ fontSize: 14, color: 'var(--t-text-muted)', fontWeight: 400 }}> / 6,236</span></p>
            <p style={{ fontSize: 12, color: 'var(--t-text-muted)' }}>verses read all-time</p>
            {stats?.projected_khatam_days && <p style={{ fontSize: 12, color: 'var(--t-primary)', marginTop: 4 }}>At your pace: ~{stats.projected_khatam_days} days to khatam</p>}
          </div>
        </div>
      </Card>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10 }}>
        {[['Verses', stats?.verses_this_month || 0, 'this month'], ['Minutes', stats?.minutes_this_month || 0, 'reading'], ['Listened', stats?.total_minutes_listened || 0, 'total']].map(([label, value, sublabel]) => (
          <div key={label} style={{ borderRadius: 12, padding: '12px 8px', textAlign: 'center', background: 'var(--t-bg-card)', border: '0.5px solid var(--t-border)' }}>
            <p style={{ fontSize: 18, fontWeight: 700, color: 'var(--t-text)' }}>{value.toLocaleString()}</p>
            <p style={{ fontSize: 10, color: 'var(--t-text-muted)' }}>{label}</p>
            <p style={{ fontSize: 9, color: 'var(--t-text-muted)' }}>{sublabel}</p>
          </div>
        ))}
      </div>

      <Card>
        <h3 style={{ fontWeight: 700, fontSize: 16, marginBottom: 10, color: 'var(--t-text)' }}>Reading Activity Heatmap</h3>
        <CalendarHeatmap
          startDate={new Date(Date.now() - 119 * 86400000)}
          endDate={new Date()}
          values={[...heatmapValues.entries()].map(([date, count]) => ({ date, count }))}
          classForValue={(value) => {
            if (!value) return 'color-empty'
            if (value.count < 20) return 'color-scale-1'
            if (value.count < 60) return 'color-scale-2'
            if (value.count < 120) return 'color-scale-3'
            return 'color-scale-4'
          }}
        />
        <p style={{ fontSize: 11, color: 'var(--t-text-muted)', marginTop: 8 }}>Darker cells mean more verses read on that day.</p>
      </Card>

      {stats && <Card><p style={{ fontSize: 13, color: 'var(--t-text-muted)' }}>Daily average</p><p style={{ fontSize: 24, fontWeight: 700, color: 'var(--t-text)' }}>{stats.avg_daily_minutes} min</p><p style={{ fontSize: 12, color: 'var(--t-text-muted)' }}>{stats.sessions_this_month} sessions this month</p></Card>}

      <Card>
        <h3 style={{ fontWeight: 700, fontSize: 16, marginBottom: 10, color: 'var(--t-text)' }}>Hifz progress</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 10 }}>
          {[['Memorised', memorised, '#16a34a'], ['In progress', inProgress, '#f97316']].map(([label, count, color]) => (
            <div key={label} style={{ textAlign: 'center', padding: 12, borderRadius: 10, background: `${color}12` }}><p style={{ fontSize: 22, fontWeight: 700, color }}>{count}</p><p style={{ fontSize: 11, color: 'var(--t-text-muted)' }}>{label.toLowerCase()}</p></div>
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
  const { data: surahs = [] } = useQuery({ queryKey: ['quran', 'surahs'], queryFn: () => api.get('/quran/surahs').then((response) => response.data), staleTime: 24 * 60 * 60_000 })
  const { data: mySessions = [] } = useQuery({ queryKey: ['recitation', 'sessions'], queryFn: () => api.get('/recitation/sessions').then((response) => response.data).catch(() => []) })

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const recorder = new window.MediaRecorder(stream)
      const chunks = []
      recorder.ondataavailable = (event) => chunks.push(event.data)
      recorder.onstop = async () => {
        setProcessing(true)
        const blob = new Blob(chunks, { type: 'audio/webm' })
        const form = new FormData()
        form.append('audio', blob, 'recitation.webm')
        form.append('surah_number', selectedSurah)
        form.append('ayah_number', selectedAyah)
        try {
          const response = await api.post('/recitation/sessions', form, { headers: { 'Content-Type': 'multipart/form-data' } })
          setSessions((current) => [response.data, ...current])
          toast.success('Recitation analysed')
        } catch {
          toast.error('Analysis failed')
        }
        setProcessing(false)
        stream.getTracks().forEach((track) => track.stop())
      }
      recorder.start()
      setMediaRecorder(recorder)
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
        <h3 style={{ fontWeight: 700, fontSize: 17, color: 'var(--t-text)', marginBottom: 4 }}>Recitation Practice</h3>
        <p style={{ fontSize: 13, color: 'var(--t-text-muted)', marginBottom: 16 }}>Record yourself reciting an ayah. AI feedback will appear below.</p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
          <div>
            <p className="label">Surah</p>
            <select className="input" value={selectedSurah} onChange={(event) => setSelectedSurah(Number(event.target.value))}>
              {surahs.map((surah) => <option key={surah.id} value={surah.id}>{surah.id}. {surah.name_simple}</option>)}
            </select>
          </div>
          <div>
            <p className="label">Ayah #</p>
            <input className="input" type="number" min="1" max="286" value={selectedAyah} onChange={(event) => setSelectedAyah(Number(event.target.value))} />
          </div>
        </div>
        <button onClick={recording ? stopRecording : startRecording} disabled={processing} style={{ width: '100%', padding: '16px', borderRadius: 14, border: 'none', cursor: processing ? 'not-allowed' : 'pointer', background: recording ? '#ef4444' : 'var(--t-primary)', color: 'white', fontWeight: 700, fontSize: 15, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, opacity: processing ? 0.7 : 1 }}>
          {processing ? 'Analysing…' : recording ? <><StopCircle size={20} /> Stop Recording</> : <><Mic size={20} /> Start Recording</>}
        </button>
      </Card>

      {allSessions.length > 0 && (
        <div>
          <h3 style={{ fontWeight: 700, fontSize: 15, color: 'var(--t-text)', marginBottom: 10 }}>Recent Sessions</h3>
          <div className="space-y-3">
            {allSessions.map((session, index) => (
              <Card key={session.id || index}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                  <div>
                    <p style={{ fontWeight: 600, fontSize: 14, color: 'var(--t-text)' }}>Surah {session.surah_number} · Ayah {session.ayah_number}</p>
                    <p style={{ fontSize: 12, color: 'var(--t-text-muted)' }}>{session.created_at ? new Date(session.created_at).toLocaleDateString() : 'Just now'}</p>
                  </div>
                  {session.overall_score != null && <div style={{ textAlign: 'center' }}><p style={{ fontSize: 22, fontWeight: 700, color: session.overall_score >= 80 ? 'var(--t-primary)' : session.overall_score >= 60 ? 'var(--t-accent)' : '#ef4444' }}>{Math.round(session.overall_score)}%</p><p style={{ fontSize: 10, color: 'var(--t-text-muted)' }}>Accuracy</p></div>}
                </div>
                {session.feedback && <p style={{ fontSize: 13, color: 'var(--t-text-muted)', padding: '8px 10px', borderRadius: 8, background: 'var(--t-bg)', lineHeight: 1.6 }}>{session.feedback}</p>}
                {session.tajweed_errors?.length > 0 && (
                  <div style={{ marginTop: 8 }}>
                    <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--t-accent)', marginBottom: 4 }}>Tajweed notes:</p>
                    {session.tajweed_errors.map((error, errorIndex) => <p key={errorIndex} style={{ fontSize: 12, color: 'var(--t-text-muted)', lineHeight: 1.6 }}>• {error}</p>)}
                  </div>
                )}
              </Card>
            ))}
          </div>
        </div>
      )}

      {allSessions.length === 0 && !recording && (
        <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--t-text-muted)' }}>
          <span style={{ fontSize: 48 }}>🎙️</span>
          <p style={{ marginTop: 12, fontSize: 14 }}>No sessions yet. Record your first recitation above.</p>
          <p style={{ marginTop: 6, fontSize: 12, color: 'var(--t-text-muted)' }}>Start with Al-Fatihah, Surah 1, Ayah 1</p>
        </div>
      )}
    </div>
  )
}

export default function Quran() {
  const navigate = useNavigate()
  const { surahId, ayahId } = useParams()
  const [tab, setTab] = useStickyState('reader', 'q_tab')
  const audio = useAudio()
  const ctx = getIslamicContext()
  const { data: surahs = [] } = useQuery({
    queryKey: ['quran', 'surahs'],
    queryFn: () => api.get('/quran/surahs').then((response) => response.data),
    staleTime: 24 * 60 * 60_000,
  })
  const activeSurah = surahId ? surahs.find((surah) => surah.id === Number(surahId)) || null : null

  useEffect(() => {
    const token = localStorage.getItem('access_token')
    if (!token) return
    api.post('/quran/duas/seed').catch(() => {})
    api.post('/quran/hadith/seed').catch(() => {})
  }, [])

  useEffect(() => {
    if (surahId) setTab('reader')
  }, [setTab, surahId])

  const selectSurah = (targetSurahId, targetAyahId) => {
    if (targetAyahId) {
      navigate(`/quran/${targetSurahId}/${targetAyahId}`)
      return
    }
    navigate(`/quran/${targetSurahId}`)
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-5">
      <style>{`
        .react-calendar-heatmap .color-empty { fill: var(--t-border); opacity: 0.35; }
        .react-calendar-heatmap .color-scale-1 { fill: rgba(20,168,96,0.25); }
        .react-calendar-heatmap .color-scale-2 { fill: rgba(20,168,96,0.45); }
        .react-calendar-heatmap .color-scale-3 { fill: rgba(20,168,96,0.7); }
        .react-calendar-heatmap .color-scale-4 { fill: rgba(20,168,96,1); }
      `}</style>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-display,serif)', fontSize: 24, fontWeight: 700, color: 'var(--t-text)' }}>Quran</h1>
          <p style={{ fontSize: 13, color: 'var(--t-accent)' }}>{ctx.formatted}</p>
        </div>
        {audio.currentV && (
          <div style={{ display: 'flex', gap: 4 }}>
            {[0.75, 1, 1.25, 1.5].map((speed) => <button key={speed} onClick={() => audio.changeSpeed(speed)} style={{ padding: '3px 8px', borderRadius: 8, fontSize: 11, border: '0.5px solid', borderColor: audio.speed === speed ? 'var(--t-primary)' : 'var(--t-border)', background: audio.speed === speed ? 'rgba(20,168,96,0.1)' : 'var(--t-bg-card)', color: audio.speed === speed ? 'var(--t-primary)' : 'var(--t-text-muted)', cursor: 'pointer' }}>{speed}×</button>)}
          </div>
        )}
      </div>

      <div style={{ display: 'flex', gap: 2, padding: 4, borderRadius: 12, marginBottom: 16, background: 'var(--t-bg-card)', border: '0.5px solid var(--t-border)' }}>
        {TABS.map((item) => <button key={item} onClick={() => setTab(item)} style={{ flex: 1, padding: '8px 4px', borderRadius: 9, fontSize: 12, fontWeight: 500, border: 'none', cursor: 'pointer', background: tab === item ? 'var(--t-primary)' : 'transparent', color: tab === item ? 'white' : 'var(--t-text-muted)', transition: 'all 0.15s' }}>{TAB_LABELS[item]}</button>)}
      </div>

      {tab === 'reader' && !activeSurah && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 8, marginBottom: 14 }}>
          {RECITERS.map((reciter) => (
            <button key={reciter.id} onClick={() => audio.setReciterId(reciter.id)} style={{ padding: '10px 12px', borderRadius: 12, border: '0.5px solid', borderColor: audio.reciterId === reciter.id ? 'var(--t-primary)' : 'var(--t-border)', background: audio.reciterId === reciter.id ? 'rgba(20,168,96,0.1)' : 'var(--t-bg-card)', cursor: 'pointer', textAlign: 'left' }}>
              <p style={{ fontSize: 12, fontWeight: 700, color: audio.reciterId === reciter.id ? 'var(--t-primary)' : 'var(--t-text)' }}>{reciter.name}</p>
              <p style={{ fontSize: 10, color: 'var(--t-text-muted)', marginTop: 4 }}>{reciter.style}</p>
            </button>
          ))}
        </div>
      )}

      {tab === 'reader' && (activeSurah ? <SurahReader surah={activeSurah} onBack={() => navigate('/quran')} audio={audio} scrollToAyah={ayahId} /> : <SurahPicker onSelect={selectSurah} />)}
      {tab === 'hifz' && <HifzTab />}
      {tab === 'duas' && <DuaTab />}
      {tab === 'hadith' && <HadithTab />}
      {tab === 'stats' && <StatsTab />}
      {tab === 'practice' && <PracticeTab />}
      <MiniPlayer audio={audio} surahName={activeSurah?.name_simple} />
    </div>
  )
}
