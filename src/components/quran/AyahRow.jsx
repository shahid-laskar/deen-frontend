import { useState, useRef, useCallback, useEffect } from 'react'
import {
  Play, Pause, SkipBack, SkipForward, Volume2, Repeat1, Repeat,
  Bookmark, BookmarkCheck, Sparkles, ChevronDown, ChevronUp, Copy, Share2,
  GraduationCap, MoreHorizontal, Download
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

const HIFZ_MODE_LABELS = { off: 'Off', guided: 'Guided', blanks: 'Fill Blanks', hide: 'Full Hide' }
const FONT_SIZES = ['text-2xl', 'text-3xl', 'text-4xl', 'text-5xl']

/**
 * AyahRow — per-ayah display component
 * Merges my-deen-hub AyahRow with deen-frontend's tajweed, grammar, and hifz modes.
 */
export function AyahRow({
  verse,
  surahNumber,
  isPlaying = false,
  isActive = false,
  isBookmarked = false,
  hifzMode = 'off',
  showTajweed = true,
  showGrammar = false,
  showTranslit = false,
  showTranslation = true,
  fontSize = 1,
  onPlay,
  onBookmark,
  onTafsir,
  onAddHifz,
  onWordTap,
}) {
  const [showMenu, setShowMenu] = useState(false)
  const menuRef = useRef(null)
  const verseKey = verse.verse_key || `${surahNumber}:${verse.verse_number}`
  const arabicText = verse.text_uthmani || verse.text_imlaei || ''
  const tajweedText = verse.text_tajweed || ''
  const translation = verse.translations?.[0]?.text || ''
  const verseNum = verse.verse_number || parseInt(verseKey.split(':')[1])
  const fs = FONT_SIZES[fontSize] || FONT_SIZES[1]

  // Click-outside for the action menu
  useEffect(() => {
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setShowMenu(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // Render Arabic based on hifz challenge mode
  const renderArabic = () => {
    if (hifzMode === 'hide') {
      return (
        <div className="relative select-none cursor-pointer" onClick={() => onPlay?.(verse)}>
          <p className={cn('font-amiri-quran text-right leading-relaxed text-foreground blur-sm hover:blur-none transition-all duration-500', fs)}>
            {arabicText}
          </p>
          <p className="text-center text-xs font-bold text-muted-foreground mt-1">Tap to reveal</p>
        </div>
      )
    }
    if (hifzMode === 'blanks') {
      const words = arabicText.trim().split(' ')
      return (
        <p className={cn('font-amiri-quran text-right leading-relaxed', fs)}>
          {words.map((w, i) =>
            i % 3 === 1
              ? <span key={i} className="inline-block min-w-[3rem] border-b-2 border-dashed border-primary/40 mx-1 align-bottom" />
              : <span key={i} className="text-foreground">{w} </span>
          )}
        </p>
      )
    }

    // Normal: tajweed HTML or plain text
    if (showTajweed && tajweedText) {
      return (
        <p
          className={cn('font-amiri-quran text-right leading-relaxed', fs)}
          dangerouslySetInnerHTML={{ __html: tajweedText }}
        />
      )
    }

    // Word-by-word grammar mode
    if (showGrammar && verse.words?.length) {
      return (
        <p className={cn('font-amiri-quran text-right leading-relaxed', fs)} dir="rtl">
          {verse.words.map((w, i) => (
            <span
              key={i}
              className="inline-block cursor-pointer px-0.5 hover:bg-primary/10 rounded transition-colors relative group"
              onClick={() => onWordTap?.(w, i)}
              title={w.translation?.text || w.transliteration?.text || ''}
            >
              {w.text_uthmani}
              {w.transliteration?.text && (
                <span className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-[9px] font-medium text-primary whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                  {w.transliteration.text}
                </span>
              )}
            </span>
          ))}
        </p>
      )
    }

    return (
      <p className={cn('font-amiri-quran text-right leading-relaxed text-foreground', fs)}>
        {arabicText}
      </p>
    )
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(`${arabicText}\n\n${translation}\n— Quran ${verseKey}`)
    toast.success('Copied to clipboard')
    setShowMenu(false)
  }

  const handleShare = async () => {
    const text = `${arabicText}\n\n${translation}\n— Quran ${verseKey}`
    if (navigator.share) {
      await navigator.share({ text })
    } else {
      navigator.clipboard.writeText(text)
      toast.success('Copied for sharing')
    }
    setShowMenu(false)
  }

  const handleDeepLink = () => {
    const url = `${window.location.origin}/quran/surah/${surahNumber}?ayah=${verseNum}`
    navigator.clipboard.writeText(url)
    toast.success('Link copied!')
    setShowMenu(false)
  }

  return (
    <div
      id={`ayah-${verseNum}`}
      className={cn(
        'group relative px-4 py-5 border-b border-border/50 transition-colors duration-300',
        isActive && 'bg-primary/5 border-l-2 border-l-primary'
      )}
    >
      {/* Verse number badge + actions row */}
      <div className="flex items-center justify-between mb-4">
        {/* Hex badge */}
        <div className="relative w-9 h-9 flex items-center justify-center shrink-0">
          <svg viewBox="0 0 44 44" className={cn('absolute inset-0 w-full h-full transition-colors', isActive ? 'text-primary/25' : 'text-muted/80')} fill="currentColor">
            <path d="M22 2 L40 12 L40 32 L22 42 L4 32 L4 12 Z" />
          </svg>
          <span className={cn('relative z-10 text-xs font-black', isActive ? 'text-primary' : 'text-muted-foreground')}>
            {verseNum}
          </span>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          {/* Play / Pause */}
          <button
            onClick={() => onPlay?.(verse)}
            className={cn(
              'w-8 h-8 rounded-xl flex items-center justify-center transition-colors',
              isPlaying && isActive
                ? 'bg-primary text-primary-foreground shadow-glow-primary'
                : 'hover:bg-muted text-muted-foreground hover:text-foreground'
            )}
            title={isPlaying && isActive ? 'Pause' : 'Play'}
          >
            {isPlaying && isActive ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
          </button>

          {/* Bookmark */}
          <button
            onClick={() => onBookmark?.(verse)}
            className={cn(
              'w-8 h-8 rounded-xl flex items-center justify-center transition-colors',
              isBookmarked
                ? 'text-gold bg-gold/10'
                : 'hover:bg-muted text-muted-foreground hover:text-foreground'
            )}
            title={isBookmarked ? 'Remove bookmark' : 'Bookmark'}
          >
            {isBookmarked ? <BookmarkCheck className="h-3.5 w-3.5" /> : <Bookmark className="h-3.5 w-3.5" />}
          </button>

          {/* Tafsir */}
          <button
            onClick={() => onTafsir?.(verse)}
            className="w-8 h-8 rounded-xl flex items-center justify-center hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
            title="Tafsir & AI Reflection"
          >
            <Sparkles className="h-3.5 w-3.5" />
          </button>

          {/* More menu */}
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setShowMenu(m => !m)}
              className="w-8 h-8 rounded-xl flex items-center justify-center hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
            >
              <MoreHorizontal className="h-3.5 w-3.5" />
            </button>
            {showMenu && (
              <div className="absolute right-0 top-10 z-50 w-48 rounded-2xl border border-border bg-card shadow-elevated p-1 animate-slide-up">
                <button onClick={() => { onAddHifz?.(verse); setShowMenu(false) }} className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-muted text-sm font-medium text-left">
                  <GraduationCap className="h-4 w-4 text-primary" /> Add to Hifz
                </button>
                <button onClick={handleCopy} className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-muted text-sm font-medium text-left">
                  <Copy className="h-4 w-4 text-muted-foreground" /> Copy verse
                </button>
                <button onClick={handleShare} className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-muted text-sm font-medium text-left">
                  <Share2 className="h-4 w-4 text-muted-foreground" /> Share
                </button>
                <button onClick={handleDeepLink} className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-muted text-sm font-medium text-left">
                  <Download className="h-4 w-4 text-muted-foreground" /> Copy link
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Arabic text */}
      <div className="mb-4">
        {renderArabic()}
      </div>

      {/* Transliteration */}
      {showTranslit && verse.words?.length > 0 && (
        <p className="text-sm font-medium text-primary/70 italic mb-3 leading-relaxed">
          {verse.words.map(w => w.transliteration?.text).filter(Boolean).join(' ')}
        </p>
      )}

      {/* Translation */}
      {showTranslation && translation && hifzMode === 'off' && (
        <div 
          className="text-[13px] font-medium text-muted-foreground leading-relaxed prose prose-sm prose-p:my-0 prose-sup:text-primary max-w-none"
          dangerouslySetInnerHTML={{ __html: translation }}
        />
      )}
    </div>
  )
}
