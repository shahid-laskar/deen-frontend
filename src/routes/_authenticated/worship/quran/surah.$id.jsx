import { useState, useRef, useEffect } from 'react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Settings, Loader2, ChevronLeft } from 'lucide-react'
import { quranApi } from '@/lib/api'
import { AyahRow } from '@/components/quran/AyahRow'
import { AudioPlayer } from '@/components/quran/AudioPlayer'
import { TafsirDrawer } from '@/components/quran/TafsirDrawer'
import { getQuranPrefs, setQuranPref, saveLastReadLocal } from '@/lib/quranPrefs'
import { toast } from 'sonner'

export const Route = createFileRoute('/_authenticated/worship/quran/surah/$id')({
  component: SurahReader,
})

function SurahReader() {
  const { id } = Route.useParams()
  const surahNumber  = parseInt(id, 10)
  const queryParams  = Route.useSearch()
  const navigate     = useNavigate()
  const queryClient  = useQueryClient()

  const [prefs, setPrefs]                 = useState(getQuranPrefs())
  const [showSettings, setShowSettings]   = useState(false)
  const [playingAyah, setPlayingAyah]     = useState(null)
  const [activeTafsirAyah, setActiveTafsirAyah] = useState(null)

  // ── Data fetching ────────────────────────────────────────────────────────────
  const { data: quranData, isLoading, isError } = useQuery({
    queryKey: ['surah', surahNumber, prefs.translationId, prefs.reciterId],
    queryFn:  () => quranApi.surah(surahNumber, { translation_id: prefs.translationId, reciter_id: prefs.reciterId }),
    staleTime: Infinity,
  })

  const { data: reciters = [] } = useQuery({
    queryKey: ['quranReciters'],
    queryFn:  quranApi.recitations,
    staleTime: Infinity,
  })

  const { data: translationsList = [] } = useQuery({
    queryKey: ['quranTranslations'],
    queryFn:  quranApi.translations,
    staleTime: Infinity,
  })

  // Server-backed bookmarks — fetch on mount
  const { data: serverBookmarks = [] } = useQuery({
    queryKey: ['quran', 'bookmarks', surahNumber],
    queryFn:  () => quranApi.bookmarks({ surah_number: surahNumber }),
    staleTime: 60_000,
  })

  // Derive bookmarked set from server data
  const bookmarkedKeys = new Set(serverBookmarks.map(b => b.verse_key || `${b.surah_number}:${b.ayah_number}`))

  const { mutate: addBookmark } = useMutation({
    mutationFn: (verse) => quranApi.addBookmark({
      surah_number: surahNumber,
      ayah_number:  verse.verse_number,
      verse_key:    verse.verse_key,
      surah_name:   metadata?.name_simple,
      ayah_arabic:  verse.text_uthmani || verse.text_imlaei || '',
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quran', 'bookmarks'] })
      toast.success('Bookmarked ✓')
    },
    onError: () => toast.error('Failed to bookmark'),
  })

  const { mutate: removeBookmark } = useMutation({
    mutationFn: (verse) => {
      const bm = serverBookmarks.find(b => b.verse_key === verse.verse_key || (b.surah_number === surahNumber && b.ayah_number === verse.verse_number))
      if (bm) return quranApi.deleteBookmark(bm.id)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quran', 'bookmarks'] })
      toast.success('Bookmark removed')
    },
  })

  // ── Derived data ─────────────────────────────────────────────────────────────
  const metadata = quranData?.metadata
  const verses   = quranData?.verses || []

  // ── Jump to specific ayah from URL ?ayah= ───────────────────────────────────
  useEffect(() => {
    if (verses.length > 0 && queryParams.ayah) {
      setTimeout(() => {
        const el = document.getElementById(`ayah-${queryParams.ayah}`)
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' })
          el.classList.add('ring-2', 'ring-primary', 'ring-offset-2')
          setTimeout(() => el.classList.remove('ring-2', 'ring-primary', 'ring-offset-2'), 2500)
        }
      }, 600)
    }
  }, [verses.length, queryParams.ayah])

  // ── Reading log on unmount ───────────────────────────────────────────────────
  const startTime = useRef(Date.now())
  const logMutation = useMutation({
    mutationFn: quranApi.logReading,
    onSuccess:  () => queryClient.invalidateQueries(['quran', 'stats']),
  })

  useEffect(() => {
    startTime.current = Date.now()
    return () => {
      const minutes = Math.round((Date.now() - startTime.current) / 60000)
      if (minutes > 0) {
        logMutation.mutate({
          surah_number: surahNumber,
          ayah_start:   1,
          ayah_end:     verses.length,
          verses_read:  verses.length,
          minutes_read: minutes,
          minutes_listened: 0,
        })
      }
    }
  }, [surahNumber]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Save last-read via intersection observer ─────────────────────────────────
  useEffect(() => {
    if (!verses.length || !metadata) return
    const ob = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          const ayahNum = parseInt(e.target.id.replace('ayah-', ''))
          saveLastReadLocal(surahNumber, ayahNum, metadata.name_simple, metadata.name_arabic, metadata.verses_count)
          quranApi.saveLastRead({
            surah_number: surahNumber,
            ayah_number:  ayahNum,
            surah_name:   metadata.name_simple,
            surah_arabic: metadata.name_arabic,
            total_ayahs:  metadata.verses_count,
          }).catch(() => {})
        }
      })
    }, { threshold: 0.8, rootMargin: '-10% 0px -40% 0px' })

    verses.forEach(v => {
      const el = document.getElementById(`ayah-${v.verse_number}`)
      if (el) ob.observe(el)
    })
    return () => ob.disconnect()
  }, [verses, metadata, surahNumber])

  // ── Helpers ──────────────────────────────────────────────────────────────────
  const updatePref = (k, v) => { setQuranPref(k, v); setPrefs(getQuranPrefs()) }

  const handlePlay = (verse) => {
    if (playingAyah?.verse_number === verse.verse_number) {
      setPlayingAyah(null)
    } else {
      setPlayingAyah(verse)
      const el = document.getElementById(`ayah-${verse.verse_number}`)
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }

  const handleNextAyah = () => {
    if (!playingAyah) return
    const idx = verses.findIndex(v => v.verse_number === playingAyah.verse_number)
    if (idx < verses.length - 1) handlePlay(verses[idx + 1])
    else setPlayingAyah(null)
  }

  const handlePrevAyah = () => {
    if (!playingAyah) return
    const idx = verses.findIndex(v => v.verse_number === playingAyah.verse_number)
    if (idx > 0) handlePlay(verses[idx - 1])
  }

  const handleBookmark = (verse) => {
    const key = verse.verse_key || `${surahNumber}:${verse.verse_number}`
    if (bookmarkedKeys.has(key)) {
      removeBookmark(verse)
    } else {
      addBookmark(verse)
    }
  }

  // ── Loading / error states ───────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-muted-foreground">
        <Loader2 className="h-8 w-8 animate-spin mb-4 text-primary" />
        <p className="text-sm font-medium">Loading Surah...</p>
      </div>
    )
  }

  if (isError) {
    return (
      <div className="py-12 text-center">
        <p className="text-destructive font-bold mb-2">Failed to load Surah</p>
        <p className="text-sm text-muted-foreground">Check your connection and try again.</p>
      </div>
    )
  }

  return (
    <div className="animate-fade-in relative">
      {/* ── Sticky header ─────────────────────────────────────────────────── */}
      <div className="sticky top-[60px] z-30 bg-background/95 backdrop-blur-md border-b border-border/50 -mx-4 px-4 py-3 md:-mx-8 md:px-8 mb-6 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate({ to: '/worship/quran' })}
            className="p-2 hover:bg-muted rounded-xl transition-colors"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="font-bold text-lg leading-tight">{metadata?.name_simple}</h1>
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
              {metadata?.revelation_place} · {metadata?.verses_count} Ayahs
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowSettings(!showSettings)}
          className={`p-2.5 rounded-xl transition-colors ${
            showSettings
              ? 'bg-primary text-primary-foreground shadow-glow-primary'
              : 'bg-muted hover:bg-muted/80'
          }`}
        >
          <Settings className="h-5 w-5" />
        </button>
      </div>

      {/* ── Settings panel ────────────────────────────────────────────────── */}
      {showSettings && (
        <div className="mb-8 p-5 bg-card border border-border/50 rounded-2xl shadow-elevated animate-slide-up space-y-5">
          <h3 className="font-bold border-b border-border/50 pb-2 mb-4">Display Preferences</h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Font size */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Arabic Size</label>
              <div className="flex bg-muted rounded-xl p-1">
                {['sm','md','lg','xl'].map((sz, i) => (
                  <button
                    key={sz}
                    onClick={() => updatePref('fontSize', i)}
                    className={`flex-1 py-1.5 rounded-lg text-sm font-medium transition-all ${
                      prefs.fontSize === i
                        ? 'bg-background shadow-sm text-primary'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {sz.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            {/* Translation */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Translation</label>
              <select
                className="w-full bg-muted border-none rounded-xl px-4 py-2 text-sm font-medium focus:ring-2 focus:ring-primary/20"
                value={prefs.translationId}
                onChange={(e) => updatePref('translationId', parseInt(e.target.value))}
              >
                {translationsList.map(t => (
                  <option key={t.id} value={t.id}>{t.author} ({t.language.toUpperCase()})</option>
                ))}
                {translationsList.length === 0 && (
                  <>
                    <option value={131}>Clear Quran (Dr. Mustafa Khattab)</option>
                    <option value={20}>Saheeh International</option>
                    <option value={85}>Pickthall</option>
                    <option value={95}>Yusuf Ali</option>
                  </>
                )}
              </select>
            </div>

            {/* Reciter */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Audio Reciter</label>
              <select
                className="w-full bg-muted border-none rounded-xl px-4 py-2 text-sm font-medium focus:ring-2 focus:ring-primary/20"
                value={prefs.reciterId}
                onChange={(e) => updatePref('reciterId', parseInt(e.target.value))}
              >
                {reciters.map(r => (
                  <option key={r.id} value={r.id}>{r.name} ({r.style})</option>
                ))}
              </select>
            </div>

            {/* Toggles row */}
            <div className="col-span-full flex flex-wrap gap-3 pt-2 border-t border-border/50">
              {[
                ['showTranslation', 'Show Translation', prefs.showTranslation ?? true],
                ['showTajweed',     'Tajweed Colors',   prefs.showTajweed],
                ['showGrammar',     'Word-by-Word',     prefs.showGrammar],
                ['showTranslit',    'Transliteration',  prefs.showTranslit],
              ].map(([key, label, checked]) => (
                <label key={key} className="flex items-center gap-2 px-3 py-2 bg-muted rounded-xl cursor-pointer hover:bg-muted/80 transition-colors">
                  <input
                    type="checkbox"
                    checked={!!checked}
                    onChange={(e) => updatePref(key, e.target.checked)}
                    className="accent-primary"
                  />
                  <span className="text-sm font-medium">{label}</span>
                </label>
              ))}

              {/* Hifz mode */}
              <div className="flex-1 min-w-[180px]">
                <select
                  className="w-full bg-primary/10 text-primary border-none rounded-xl px-4 py-2 text-sm font-bold focus:ring-2 focus:ring-primary/20"
                  value={prefs.hifzMode}
                  onChange={(e) => updatePref('hifzMode', e.target.value)}
                >
                  <option value="off">Hifz Mode: OFF</option>
                  <option value="hide">Hifz: Hide Arabic</option>
                  <option value="blanks">Hifz: Fill Blanks</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Bismillah ─────────────────────────────────────────────────────── */}
      {metadata?.bismillah_pre && (
        <div className="flex justify-center mb-8 py-6">
          <p className="font-amiri-quran text-4xl text-center text-foreground opacity-80">
            بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ
          </p>
        </div>
      )}

      {/* ── Ayah list ─────────────────────────────────────────────────────── */}
      <div className="bg-card border border-border shadow-soft rounded-3xl overflow-hidden mb-[120px]">
        {verses.map((v) => (
          <AyahRow
            key={v.verse_key}
            verse={v}
            surahNumber={surahNumber}
            isPlaying={playingAyah?.verse_number === v.verse_number}
            isActive={playingAyah?.verse_number === v.verse_number || Number(queryParams.ayah) === v.verse_number}
            isBookmarked={bookmarkedKeys.has(v.verse_key || `${surahNumber}:${v.verse_number}`)}
            fontSize={prefs.fontSize}
            hifzMode={prefs.hifzMode}
            showTajweed={prefs.showTajweed}
            showGrammar={prefs.showGrammar}
            showTranslit={prefs.showTranslit}
            showTranslation={prefs.showTranslation ?? true}
            onPlay={handlePlay}
            onBookmark={handleBookmark}
            onTafsir={() => setActiveTafsirAyah(v)}
            onAddHifz={() => {
              quranApi.addHifz({ surah_number: surahNumber, ayah_from: v.verse_number, ayah_to: v.verse_number, surah_name: metadata?.name_simple, total_ayahs: metadata?.verses_count })
                .then(() => toast.success('Added to Hifz ✓'))
                .catch(e => toast.error(e.response?.data?.detail || 'Already in Hifz'))
            }}
          />
        ))}
      </div>

      {/* ── Audio player ──────────────────────────────────────────────────── */}
      {playingAyah && (
        <AudioPlayer
          verse={playingAyah}
          surahName={metadata?.name_simple}
          reciterId={prefs.reciterId}
          onReciterChange={(id) => updatePref('reciterId', id)}
          onNext={handleNextAyah}
          onPrev={handlePrevAyah}
          onClose={() => setPlayingAyah(null)}
        />
      )}

      {/* ── Tafsir drawer ─────────────────────────────────────────────────── */}
      {activeTafsirAyah && (
        <TafsirDrawer
          verse={activeTafsirAyah}
          surahNumber={surahNumber}
          onClose={() => setActiveTafsirAyah(null)}
        />
      )}
    </div>
  )
}
