import { useRef, useEffect, useState, useCallback } from 'react'
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, X, Timer, Repeat, RefreshCw, Music } from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

const RECITERS = [
  { id: 7,  name: 'Al-Afasy',   subfolder: 'Alafasy_128kbps' },
  { id: 1,  name: 'AbdulBaset', subfolder: 'Abdul_Basit_Murattal_192kbps' },
  { id: 5,  name: 'Al-Husary',  subfolder: 'Husary_128kbps' },
  { id: 3,  name: 'Al-Minshawi',subfolder: 'Minshawi_Murattal_128kbps' },
  { id: 10, name: 'Al-Dossari', subfolder: 'Yasser_Ad-Dossari_128kbps' },
  { id: 11, name: 'Al-Ghamdi',  subfolder: 'Saad_Al-Ghamdi_128kbps' },
]

const SPEEDS = [0.75, 1.0, 1.25, 1.5, 2.0]
const REPEAT_MODES = ['off', 'one', 'all']

/**
 * URL chain (tried in order on error):
 * 1. everyayah.com — primary, reliable, no CORS header needed
 * 2. qurancdn.com    — fallback for same verse with Al-Afasy
 */
function buildAudioUrl(reciterId, surahNumber, ayahNumber) {
  const reciter = RECITERS.find(r => r.id === reciterId) || RECITERS[0]
  const paddedSurah = String(surahNumber).padStart(3, '0')
  const paddedAyah  = String(ayahNumber).padStart(3, '0')
  return `https://everyayah.com/data/${reciter.subfolder}/${paddedSurah}${paddedAyah}.mp3`
}

function buildFallbackUrl(surahNumber, ayahNumber) {
  const paddedSurah = String(surahNumber).padStart(3, '0')
  const paddedAyah  = String(ayahNumber).padStart(3, '0')
  // qurancdn is Al-Afasy only but always available
  return `https://audio.qurancdn.com/Alafasy/${paddedSurah}${paddedAyah}.mp3`
}

export function AudioPlayer({
  verse,
  surahName,
  reciterId = 7,
  onReciterChange,
  onNext,
  onPrev,
  onClose,
  className,
}) {
  const audioRef        = useRef(null)
  const sleepTimerRef   = useRef(null)
  const [isPlaying,   setIsPlaying]   = useState(false)
  const [progress,    setProgress]    = useState(0)
  const [duration,    setDuration]    = useState(0)
  const [speed,       setSpeed]       = useState(1.0)
  const [repeat,      setRepeat]      = useState('off')
  const [muted,       setMuted]       = useState(false)
  const [sleepMins,   setSleepMins]   = useState(0)
  const [sleepEnd,    setSleepEnd]    = useState(null)
  const [showReciter, setShowReciter] = useState(false)
  const [loadError,   setLoadError]   = useState(false)

  const verseKey  = verse?.verse_key || ''
  const [surahNum, ayahNum] = verseKey.split(':').map(Number)
  
  // 1. Primary: Use URL from Quran.com API (already correct for the reciter)
  // 2. Secondary: Calculate everyayah.com URL
  // 3. Tertiary: Fixed Al-Afasy fallback on qurancdn.com
  const audioUrl = verse?.audio?.url 
    ? (verse.audio.url.startsWith('http') ? verse.audio.url : `https://verses.quran.com/${verse.audio.url}`)
    : (verse ? buildAudioUrl(reciterId, surahNum, ayahNum) : null)
    
  const fallbackUrl = verse ? buildFallbackUrl(surahNum, ayahNum) : null

  // Load & autoplay when verse or reciter changes
  useEffect(() => {
    if (!audioRef.current || !audioUrl) return
    setLoadError(false)
    setProgress(0)
    setDuration(0)
    audioRef.current.src   = audioUrl
    audioRef.current.playbackRate = speed
    audioRef.current.load()
    audioRef.current
      .play()
      .then(() => setIsPlaying(true))
      .catch((err) => {
        console.warn('Audio autoplay blocked:', err)
        setIsPlaying(false)
      })
  }, [audioUrl]) // eslint-disable-line react-hooks/exhaustive-deps

  // MediaSession API for lockscreen controls
  useEffect(() => {
    if (!verse || !('mediaSession' in navigator)) return
    navigator.mediaSession.metadata = new MediaMetadata({
      title:  `${surahName} — Ayah ${ayahNum}`,
      artist: RECITERS.find(r => r.id === reciterId)?.name || 'Quran',
      album:  'The Holy Quran',
    })
    navigator.mediaSession.setActionHandler('play',         () => audioRef.current?.play())
    navigator.mediaSession.setActionHandler('pause',        () => audioRef.current?.pause())
    navigator.mediaSession.setActionHandler('nexttrack',    () => onNext?.())
    navigator.mediaSession.setActionHandler('previoustrack',() => onPrev?.())
  }, [verse, surahName, reciterId, ayahNum, onNext, onPrev])

  // Sleep timer
  useEffect(() => {
    if (sleepMins <= 0) { clearTimeout(sleepTimerRef.current); setSleepEnd(null); return }
    const end = Date.now() + sleepMins * 60_000
    setSleepEnd(end)
    clearTimeout(sleepTimerRef.current)
    sleepTimerRef.current = setTimeout(() => {
      audioRef.current?.pause()
      setIsPlaying(false)
      setSleepEnd(null)
      setSleepMins(0)
      toast.info('Sleep timer ended')
    }, sleepMins * 60_000)
    return () => clearTimeout(sleepTimerRef.current)
  }, [sleepMins])

  const handleTimeUpdate = () => {
    if (!audioRef.current) return
    setProgress(audioRef.current.currentTime)
    setDuration(audioRef.current.duration || 0)
  }

  const handleEnded = () => {
    if (repeat === 'one') {
      audioRef.current.currentTime = 0
      audioRef.current.play()
    } else {
      setIsPlaying(false)
      onNext?.()
    }
  }

  const handleError = () => {
    // Try fallback URL before showing error
    if (audioRef.current && fallbackUrl && audioRef.current.src !== fallbackUrl) {
      audioRef.current.src = fallbackUrl
      audioRef.current.load()
      audioRef.current.play().then(() => setIsPlaying(true)).catch(() => {
        setIsPlaying(false)
        setLoadError(true)
        toast.error('Audio unavailable for this verse')
      })
    } else {
      setIsPlaying(false)
      setLoadError(true)
      toast.error('Audio unavailable — try a different reciter')
    }
  }

  const togglePlay = () => {
    if (!audioRef.current) return
    if (isPlaying) {
      audioRef.current.pause()
      setIsPlaying(false)
    } else {
      audioRef.current.play().then(() => setIsPlaying(true)).catch(() => {
        toast.error('Could not play audio')
      })
    }
  }

  const seek = (e) => {
    if (!audioRef.current || !duration) return
    const rect = e.currentTarget.getBoundingClientRect()
    const pct  = (e.clientX - rect.left) / rect.width
    audioRef.current.currentTime = pct * duration
  }

  const cycleSpeed = () => {
    const next = SPEEDS[(SPEEDS.indexOf(speed) + 1) % SPEEDS.length]
    setSpeed(next)
    if (audioRef.current) audioRef.current.playbackRate = next
  }

  const cycleRepeat = () => setRepeat(r => REPEAT_MODES[(REPEAT_MODES.indexOf(r) + 1) % REPEAT_MODES.length])

  const fmt = (s) => {
    const m   = Math.floor((s || 0) / 60)
    const sec = Math.floor((s || 0) % 60)
    return `${m}:${String(sec).padStart(2, '0')}`
  }

  if (!verse) return null

  return (
    <div className={cn('fixed bottom-16 left-0 right-0 z-50 px-3 pb-1', className)}>
      <audio
        ref={audioRef}
        muted={muted}
        onTimeUpdate={handleTimeUpdate}
        onEnded={handleEnded}
        onLoadedMetadata={() => setDuration(audioRef.current?.duration || 0)}
        onError={handleError}
      />

      <div className="glass-card rounded-2xl shadow-elevated overflow-hidden">
        {/* Progress bar */}
        <div className="h-1.5 bg-muted cursor-pointer relative group" onClick={seek}>
          <div
            className="h-full bg-primary rounded-full transition-none"
            style={{ width: `${duration ? (progress / duration) * 100 : 0}%` }}
          />
          {/* Thumb indicator */}
          <div
            className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-primary shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
            style={{ left: `${duration ? (progress / duration) * 100 : 0}%`, transform: 'translate(-50%, -50%)' }}
          />
        </div>

        <div className="flex items-center gap-3 px-4 py-3">
          {/* Verse info */}
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-foreground truncate">{surahName}</p>
            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
              Ayah {ayahNum} · {fmt(progress)} / {fmt(duration)}
              {sleepEnd && <span className="text-orange-500">😴 {Math.ceil((sleepEnd - Date.now()) / 60_000)}m</span>}
              {loadError && <span className="text-red-500">⚠ No audio</span>}
            </p>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-1">
            {/* Speed */}
            <button onClick={cycleSpeed} className="px-2 py-1 rounded-lg bg-muted text-[10px] font-black text-muted-foreground hover:text-foreground transition-colors min-w-[36px]">
              {speed}×
            </button>

            {/* Repeat */}
            <button onClick={cycleRepeat} className={cn('w-8 h-8 rounded-xl flex items-center justify-center transition-colors', repeat !== 'off' ? 'text-primary bg-primary/10' : 'text-muted-foreground hover:text-foreground hover:bg-muted')}>
              {repeat === 'one' ? <RefreshCw className="h-3.5 w-3.5" /> : <Repeat className="h-3.5 w-3.5" />}
            </button>

            <button onClick={onPrev} className="w-8 h-8 rounded-xl flex items-center justify-center hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
              <SkipBack className="h-4 w-4" />
            </button>

            {/* Play / Pause */}
            <button
              onClick={togglePlay}
              className={cn(
                'w-10 h-10 rounded-2xl flex items-center justify-center transition-all shadow-sm bg-primary text-primary-foreground',
                isPlaying && 'shadow-glow-primary'
              )}
            >
              {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 ml-0.5" />}
            </button>

            <button onClick={onNext} className="w-8 h-8 rounded-xl flex items-center justify-center hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
              <SkipForward className="h-4 w-4" />
            </button>

            {/* Mute */}
            <button onClick={() => setMuted(m => !m)} className="w-8 h-8 rounded-xl flex items-center justify-center hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
              {muted ? <VolumeX className="h-3.5 w-3.5" /> : <Volume2 className="h-3.5 w-3.5" />}
            </button>

            {/* Reciter picker */}
            <button
              onClick={() => setShowReciter(s => !s)}
              className={cn('w-8 h-8 rounded-xl flex items-center justify-center transition-colors', showReciter ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:text-foreground hover:bg-muted')}
              title="Change reciter"
            >
              <Music className="h-3.5 w-3.5" />
            </button>

            {/* Sleep timer */}
            <button
              onClick={() => setSleepMins(m => [0,5,10,15,30,60][([0,5,10,15,30,60].indexOf(m) + 1) % 6])}
              className={cn('w-8 h-8 rounded-xl flex items-center justify-center transition-colors', sleepMins > 0 ? 'text-orange-500 bg-orange-500/10' : 'text-muted-foreground hover:text-foreground hover:bg-muted')}
              title={sleepMins > 0 ? `Sleep in ${sleepMins}m` : 'Sleep timer'}
            >
              <Timer className="h-3.5 w-3.5" />
            </button>

            {/* Close */}
            <button onClick={onClose} className="w-8 h-8 rounded-xl flex items-center justify-center hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* Reciter selector */}
        {showReciter && (
          <div className="px-4 pb-3 flex gap-1.5 flex-wrap border-t border-border/50 pt-2">
            {RECITERS.map(r => (
              <button
                key={r.id}
                onClick={() => { onReciterChange?.(r.id); setShowReciter(false) }}
                className={cn(
                  'px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-colors',
                  reciterId === r.id
                    ? 'bg-primary/10 border-primary/30 text-primary'
                    : 'bg-muted border-border text-muted-foreground hover:text-foreground'
                )}
              >
                {r.name}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
