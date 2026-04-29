import { useState } from 'react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { Search, Headphones, BookOpen, Play, Pause, SkipBack, SkipForward, Moon } from 'lucide-react'
import { quranApi } from '@/lib/api'
import { SurahCard } from '@/components/quran/SurahCard'
import { ContinueReadingHero } from '@/components/quran/ContinueReadingHero'
import { EmptyState } from '@/components/ui/empty-state'
import { cn } from '@/lib/utils'
import { useAudioStore, QARIS } from '@/store/audioStore'
import { Icon } from '@/components/ui/icon'

export const Route = createFileRoute('/_authenticated/worship/quran/')({
  component: QuranIndex,
})

function formatTime(seconds) {
  if (isNaN(seconds)) return '0:00'
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

function QuranIndex() {
  const [search, setSearch] = useState('')
  const [activeTab, setActiveTab] = useState('read') // 'read' or 'listen'

  const { data: surahs, isLoading } = useQuery({
    queryKey: ['quran', 'surahs'],
    queryFn: quranApi.surahs,
    staleTime: Infinity,
  })

  const { data: lastRead } = useQuery({
    queryKey: ['quran', 'lastRead'],
    queryFn: quranApi.lastRead,
  })

  const { data: stats } = useQuery({
    queryKey: ['quran', 'stats'],
    queryFn: quranApi.stats,
  })

  const filteredSurahs = surahs?.filter(s =>
    s.name_simple.toLowerCase().includes(search.toLowerCase()) ||
    s.name_arabic.includes(search) ||
    s.id.toString() === search
  ) || []

  const navigate = useNavigate()
  const isVerseSearch = /^\d+:\d+$/.test(search.trim())

  // Audio Store state
  const { 
    qari, setQari, 
    isPlaying, playTrack, pause, resume, next, prev, 
    progress, duration,
    playbackRate, setPlaybackRate,
    sleepTimer, setSleepTimer,
    playlist, currentIndex
  } = useAudioStore()

  const currentTrack = playlist[currentIndex]

  const handlePlaySurah = (surah) => {
    const paddedNum = surah.id.toString().padStart(3, '0')
    let server = 'https://server8.mp3quran.net/afs' // Alafasy
    if (qari.id === 'ar.sudais') server = 'https://server11.mp3quran.net/sds'
    if (qari.id === 'ar.husary') server = 'https://server13.mp3quran.net/husr'
    if (qari.id === 'ar.mahermuaiqly') server = 'https://server12.mp3quran.net/maher'

    const track = {
      id: `surah-${surah.id}`,
      title: `Surah ${surah.name_simple}`,
      artist: qari.name,
      url: `${server}/${paddedNum}.mp3`,
      artwork: 'https://images.unsplash.com/photo-1604871000636-074fa5117945?w=512&q=80'
    }
    
    // Create a playlist of all surahs from this one onwards
    const plist = surahs.slice(surah.id - 1).map(s => ({
      id: `surah-${s.id}`,
      title: `Surah ${s.name_simple}`,
      artist: qari.name,
      url: `${server}/${s.id.toString().padStart(3, '0')}.mp3`,
      artwork: 'https://images.unsplash.com/photo-1604871000636-074fa5117945?w=512&q=80'
    }))
    
    playTrack(track, plist)
  }

  return (
    <div className="space-y-6 animate-fade-in pb-32">
      {/* Tabs */}
      <div className="flex p-1 bg-muted rounded-xl w-full max-w-sm mx-auto">
        <button
          onClick={() => setActiveTab('read')}
          className={cn(
            "flex-1 flex items-center justify-center gap-2 py-2 text-sm font-bold rounded-lg transition-all",
            activeTab === 'read' ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
          )}
        >
          <BookOpen className="h-4 w-4" /> Read
        </button>
        <button
          onClick={() => setActiveTab('listen')}
          className={cn(
            "flex-1 flex items-center justify-center gap-2 py-2 text-sm font-bold rounded-lg transition-all",
            activeTab === 'listen' ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
          )}
        >
          <Headphones className="h-4 w-4" /> Listen
        </button>
      </div>

      {activeTab === 'read' ? (
        <>
          {/* Search Bar */}
          <div className="relative">
            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-muted-foreground" />
            </div>
            <input
              type="text"
              placeholder="Search surahs (e.g., 'Yaseen', 'Kahf', '36', '2:255')"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-12 pr-4 py-4 rounded-2xl border border-border bg-card shadow-soft focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium text-foreground placeholder:text-muted-foreground"
            />
          </div>

          {/* Continue Reading */}
          {!search && (
            <ContinueReadingHero
              lastRead={lastRead}
              versesRead={stats?.total_verses_read || 0}
            />
          )}

          {/* Surahs Grid */}
          <div>
            <h3 className="section-label mb-4">{search ? 'Search Results' : 'Surahs (114)'}</h3>
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[...Array(12)].map((_, i) => (
                  <div key={i} className="h-20 rounded-2xl skeleton" />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {isVerseSearch ? (
                  <div className="col-span-full">
                    <button 
                      onClick={() => {
                        const [sId, aId] = search.trim().split(':')
                        navigate({ to: `/worship/quran/surah/$id`, params: { id: sId }, search: { ayah: aId }})
                      }}
                      className="w-full p-6 text-center bg-card rounded-2xl border border-primary/30 hover:bg-primary/5 transition-colors group shadow-sm flex flex-col items-center justify-center gap-2"
                    >
                      <p className="text-xl font-bold text-foreground">Jump to Verse {search.trim()}</p>
                      <p className="text-sm font-medium text-muted-foreground group-hover:text-primary transition-colors flex items-center gap-1">Read exact verse in reader →</p>
                    </button>
                  </div>
                ) : (
                  <>
                    {filteredSurahs.map(surah => (
                      <SurahCard key={surah.id} surah={surah} />
                    ))}
                    {filteredSurahs.length === 0 && (
                      <div className="col-span-full">
                        <EmptyState
                          illustration="book"
                          title="No Surahs Found"
                          description={`We couldn't find any surahs matching "${search}".`}
                          className="bg-transparent"
                        />
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        </>
      ) : (
        <div className="space-y-6 animate-fade-in">
          {/* Reciter Settings */}
          <div className="p-4 rounded-xl bg-card border border-border shadow-sm">
            <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
              <Headphones className="h-4 w-4 text-primary" /> Selected Reciter
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {QARIS.map(q => (
                <button
                  key={q.id}
                  onClick={() => setQari(q.id)}
                  className={cn(
                    "flex items-center gap-3 p-3 rounded-lg border text-left transition-colors",
                    qari.id === q.id ? "bg-primary/10 border-primary text-primary" : "bg-card border-border hover:bg-muted/50"
                  )}
                >
                  <div className={cn("w-4 h-4 rounded-full border-2 flex items-center justify-center", qari.id === q.id ? "border-primary" : "border-muted-foreground")}>
                    {qari.id === q.id && <div className="w-2 h-2 rounded-full bg-primary" />}
                  </div>
                  <span className="text-sm font-medium">{q.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Surah List for Audio */}
          <div className="space-y-2">
            <h3 className="section-label mb-2">Listen to Surahs</h3>
            {isLoading ? (
              Array(10).fill(0).map((_, i) => (
                <div key={i} className="h-16 bg-muted/20 animate-pulse rounded-xl" />
              ))
            ) : (
              surahs?.map((surah) => (
                <button
                  key={surah.id}
                  onClick={() => handlePlaySurah(surah)}
                  className="w-full flex items-center justify-between p-4 rounded-xl bg-card border border-border hover:border-primary/50 transition-all group focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm">
                      {surah.id}
                    </div>
                    <div className="text-left">
                      <p className="font-semibold text-foreground">{surah.name_simple}</p>
                      <p className="text-xs text-muted-foreground">{surah.translated_name?.name || surah.name_simple} • {surah.verses_count} Ayahs</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="font-amiri text-lg text-foreground opacity-80 group-hover:opacity-100">{surah.name_arabic}</span>
                    <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <Play className="h-4 w-4 ml-0.5" />
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}

      {/* Floating Mini Player */}
      {currentTrack && (
        <div className="fixed bottom-20 md:bottom-8 left-1/2 -translate-x-1/2 md:left-auto md:right-8 md:translate-x-0 z-50 w-[92%] max-w-sm bg-card/90 backdrop-blur-xl border border-border p-3 shadow-2xl rounded-3xl transition-all duration-300">
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 min-w-0 pr-2">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0 text-primary">
                  {isPlaying ? <Headphones className="h-4 w-4 animate-pulse" /> : <Headphones className="h-4 w-4" />}
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="text-sm font-bold text-foreground truncate">{currentTrack.title || 'No track selected'}</h4>
                  <p className="text-[10px] text-muted-foreground truncate uppercase font-black tracking-wider">{currentTrack.artist || 'Ready'}</p>
                </div>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                <button onClick={prev} className="p-2 text-muted-foreground hover:text-foreground">
                  <SkipBack className="h-4 w-4" />
                </button>
                <button 
                  onClick={isPlaying ? pause : resume} 
                  className="w-10 h-10 flex items-center justify-center rounded-full bg-primary text-primary-foreground hover:scale-105 transition-transform shadow-md"
                >
                  {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 ml-0.5" />}
                </button>
                <button onClick={next} className="p-2 text-muted-foreground hover:text-foreground">
                  <SkipForward className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="flex items-center gap-2 px-1">
              <span className="text-[9px] text-muted-foreground font-mono w-6 text-right">{formatTime(progress)}</span>
              <div 
                className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden relative cursor-pointer" 
                onClick={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect()
                  const p = (e.clientX - rect.left) / rect.width
                  window.dispatchEvent(new CustomEvent('seekAudio', { detail: p * duration }))
                }}
              >
                <div className="absolute top-0 left-0 bottom-0 bg-primary rounded-full transition-all duration-150" style={{ width: `${duration ? (progress / duration) * 100 : 0}%` }} />
              </div>
              <span className="text-[9px] text-muted-foreground font-mono w-6">{formatTime(duration)}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

