import React, { useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { Icon } from '@/components/ui/icon'
import { useAudioStore, QARIS } from '@/store/audioStore'
import { cn } from '@/lib/utils'

export const Route = createFileRoute('/_authenticated/worship/audio')({
  component: AudioHubPage,
})

function formatTime(seconds) {
  if (isNaN(seconds)) return '0:00'
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

export function AudioHubPage() {
  const [activeTab, setActiveTab] = useState('quran')
  const { 
    qari, setQari, 
    isPlaying, playTrack, pause, resume, next, prev, 
    progress, duration,
    playbackRate, setPlaybackRate,
    sleepTimer, setSleepTimer,
    playlist, currentIndex
  } = useAudioStore()

  // Fetch Surahs
  const { data: surahs } = useQuery({
    queryKey: ['surahs'],
    queryFn: () => fetch('https://api.alquran.cloud/v1/meta').then(r => r.json()).then(d => d.data.surahs.references)
  })

  // Play a full surah
  const handlePlaySurah = (surah) => {
    const paddedNum = surah.number.toString().padStart(3, '0')
    let server = 'https://server8.mp3quran.net/afs' // Alafasy
    if (qari.id === 'ar.sudais') server = 'https://server11.mp3quran.net/sds'
    if (qari.id === 'ar.husary') server = 'https://server13.mp3quran.net/husr'
    if (qari.id === 'ar.mahermuaiqly') server = 'https://server12.mp3quran.net/maher'

    const track = {
      id: `surah-${surah.number}`,
      title: `Surah ${surah.englishName}`,
      artist: qari.name,
      url: `${server}/${paddedNum}.mp3`,
      artwork: 'https://images.unsplash.com/photo-1604871000636-074fa5117945?w=512&q=80'
    }
    
    // Create a playlist of all surahs from this one onwards
    const plist = surahs.slice(surah.number - 1).map(s => ({
      id: `surah-${s.number}`,
      title: `Surah ${s.englishName}`,
      artist: qari.name,
      url: `${server}/${s.number.toString().padStart(3, '0')}.mp3`,
      artwork: 'https://images.unsplash.com/photo-1604871000636-074fa5117945?w=512&q=80'
    }))
    
    playTrack(track, plist)
  }

  const LECTURES = [
    { id: 'l1', title: 'The Power of Dua', artist: 'Omar Suleiman', url: 'https://cdn.islamic.network/quran/audio/128/ar.alafasy/1.mp3' },
    { id: 'l2', title: 'Understanding Taqwa', artist: 'Mufti Menk', url: 'https://cdn.islamic.network/quran/audio/128/ar.sudais/1.mp3' },
  ]

  const handlePlayLecture = (lecture) => {
    playTrack(lecture)
  }

  const currentTrack = playlist[currentIndex]

  return (
    <div className="flex flex-col h-full bg-background relative">
      {/* Header */}
      <div className="px-6 py-6 border-b border-border bg-card/50 backdrop-blur-md sticky top-0 z-10">
        <h1 className="text-h1 font-display font-bold text-foreground">Audio Hub</h1>
        <p className="text-body text-muted-foreground mt-1">Recitations, lectures, and adhans</p>
      </div>

      {/* Tabs */}
      <div className="px-6 pt-4 flex gap-6 border-b border-border overflow-x-auto scrollbar-none shrink-0">
        {['quran', 'lectures', 'adhan'].map(t => (
          <button
            key={t}
            onClick={() => setActiveTab(t)}
            className={cn(
              "pb-3 text-sm font-semibold capitalize border-b-2 transition-colors whitespace-nowrap",
              activeTab === t ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Main Content Scroll Area */}
      <div className="flex-1 overflow-y-auto px-6 py-6 pb-48">
        
        {/* Reciter Settings */}
        {activeTab === 'quran' && (
          <div className="mb-8 p-4 rounded-xl bg-surface-1 border border-border">
            <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
              <Icon name="mic" size={16} /> Selected Reciter
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
        )}

        {/* Quran Tab */}
        {activeTab === 'quran' && (
          <div className="space-y-2">
            {!surahs ? (
              Array(10).fill(0).map((_, i) => (
                <div key={i} className="h-16 bg-muted/20 animate-pulse rounded-xl" />
              ))
            ) : (
              surahs.map((surah) => (
                <button
                  key={surah.number}
                  onClick={() => handlePlaySurah(surah)}
                  className="w-full flex items-center justify-between p-4 rounded-xl bg-surface-1 border border-transparent hover:border-primary/50 transition-all group focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm">
                      {surah.number}
                    </div>
                    <div className="text-left">
                      <p className="font-semibold text-foreground">{surah.englishName}</p>
                      <p className="text-xs text-muted-foreground">{surah.englishNameTranslation} • {surah.numberOfAyahs} Ayahs</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="font-amiri text-lg text-foreground opacity-80 group-hover:opacity-100">{surah.name}</span>
                    <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <Icon name="play" size={14} className="ml-0.5" />
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        )}

        {/* Lectures Tab */}
        {activeTab === 'lectures' && (
          <div className="space-y-4">
            {LECTURES.map(lec => (
              <div key={lec.id} className="flex gap-4 p-4 rounded-xl bg-surface-1 border border-border items-center">
                <div className="w-12 h-12 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                  <Icon name="headphones" size={20} />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-foreground truncate">{lec.title}</h4>
                  <p className="text-sm text-muted-foreground truncate">{lec.artist}</p>
                </div>
                <button onClick={() => handlePlayLecture(lec)} className="w-10 h-10 shrink-0 rounded-full bg-primary/10 text-primary hover:bg-primary hover:text-white transition-colors flex items-center justify-center">
                  <Icon name="play" size={16} className="ml-0.5" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Adhan Tab */}
        {activeTab === 'adhan' && (
          <div className="text-center py-12 px-4 border border-dashed border-border rounded-xl mt-4">
            <Icon name="bell" size={40} className="mx-auto text-muted-foreground mb-4" />
            <h3 className="text-h3 font-semibold text-foreground">Adhan Voices</h3>
            <p className="text-sm text-muted-foreground mt-2 max-w-sm mx-auto">
              Adhan audio is managed automatically for your prayer reminders. Visit Settings &gt; Notifications to configure.
            </p>
          </div>
        )}

      </div>

      {/* Player Bar */}
      <div className="fixed md:absolute bottom-0 left-0 right-0 z-50 bg-surface-2 border-t border-border p-4 shadow-[0_-10px_40px_-10px_rgba(0,0,0,0.1)] pb-safe md:pb-4 transition-transform duration-300 translate-y-0">
        <div className="max-w-screen-xl mx-auto flex flex-col gap-2">
          {/* Progress Bar top of player */}
          <div className="flex items-center gap-3 w-full group">
            <span className="text-[10px] text-muted-foreground font-mono w-8 text-right">{formatTime(progress)}</span>
            <div 
              className="flex-1 h-1.5 md:h-1 group-hover:h-2 bg-muted rounded-full overflow-hidden relative cursor-pointer transition-all" 
              onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect()
                const p = (e.clientX - rect.left) / rect.width
                window.dispatchEvent(new CustomEvent('seekAudio', { detail: p * duration }))
              }}
            >
              <div className="absolute top-0 left-0 bottom-0 bg-primary" style={{ width: `${duration ? (progress / duration) * 100 : 0}%` }} />
            </div>
            <span className="text-[10px] text-muted-foreground font-mono w-8">{formatTime(duration)}</span>
          </div>

          <div className="flex items-center gap-4 justify-between mt-1">
            <div className="flex-[1] min-w-0">
              <h4 className="text-sm font-bold text-foreground truncate">{currentTrack?.title || 'No track selected'}</h4>
              <p className="text-xs text-muted-foreground truncate">{currentTrack?.artist || 'Ready to play'}</p>
            </div>

            <div className="flex items-center justify-center gap-4 flex-[1.5]">
              <button onClick={prev} disabled={!currentTrack} className="p-2 text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50">
                <Icon name="skip-back" size={20} />
              </button>
              <button 
                disabled={!currentTrack}
                onClick={isPlaying ? pause : resume} 
                className="w-12 h-12 flex items-center justify-center rounded-full bg-primary text-primary-foreground hover:scale-105 transition-transform disabled:opacity-50 disabled:hover:scale-100 shadow-md shadow-primary/20"
              >
                <Icon name={isPlaying ? "pause" : "play"} size={24} className={!isPlaying ? "ml-1" : ""} />
              </button>
              <button onClick={next} disabled={!currentTrack} className="p-2 text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50">
                <Icon name="skip-forward" size={20} />
              </button>
            </div>

            <div className="flex items-center justify-end gap-2 flex-[1] pr-2">
              <button 
                disabled={!currentTrack}
                onClick={() => setPlaybackRate(playbackRate === 1 ? 1.5 : playbackRate === 1.5 ? 2 : 1)} 
                className="px-2 py-1 text-xs font-bold text-muted-foreground hover:text-foreground border border-transparent hover:border-border rounded hidden md:block disabled:opacity-50"
              >
                {playbackRate}x
              </button>
              <button 
                disabled={!currentTrack}
                onClick={() => setSleepTimer(sleepTimer ? null : 15)} 
                className={cn("p-2 transition-colors disabled:opacity-50", sleepTimer ? "text-primary" : "text-muted-foreground hover:text-foreground")} 
                title="Sleep Timer (15m)"
              >
                <Icon name="moon" size={20} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
