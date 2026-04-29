import { create } from 'zustand'

export const QARIS = [
  { id: 'ar.alafasy', name: 'Mishary Rashid Alafasy', server: 'https://cdn.islamic.network/quran/audio/128/ar.alafasy' },
  { id: 'ar.sudais', name: 'Abdurrahmaan As-Sudais', server: 'https://cdn.islamic.network/quran/audio/128/ar.sudais' },
  { id: 'ar.husary', name: 'Mahmoud Khalil Al-Husary', server: 'https://cdn.islamic.network/quran/audio/128/ar.husary' },
  { id: 'ar.mahermuaiqly', name: 'Maher Al Muaiqly', server: 'https://cdn.islamic.network/quran/audio/128/ar.mahermuaiqly' },
]

export const useAudioStore = create((set, get) => ({
  qari: QARIS[0],
  setQari: (qariId) => {
    const qari = QARIS.find(q => q.id === qariId) || QARIS[0]
    set({ qari })
  },
  
  playlist: [], // { id, url, title, artist, artwork }
  currentIndex: -1,
  
  isPlaying: false,
  progress: 0,
  duration: 0,
  
  playbackRate: 1,
  setPlaybackRate: (rate) => set({ playbackRate: rate }),
  
  loopMode: 'none', // 'none', 'track', 'all'
  setLoopMode: (mode) => set({ loopMode: mode }),
  
  sleepTimer: null, // target timestamp in ms
  setSleepTimer: (minutes) => {
    if (!minutes) return set({ sleepTimer: null })
    set({ sleepTimer: Date.now() + minutes * 60000 })
  },
  
  // Actions
  playTrack: (track, playlist = []) => {
    const idx = playlist.length ? playlist.findIndex(t => t.id === track.id) : 0
    set({ 
      playlist: playlist.length ? playlist : [track],
      currentIndex: idx !== -1 ? idx : 0,
      isPlaying: true 
    })
  },
  
  pause: () => set({ isPlaying: false }),
  resume: () => set({ isPlaying: true }),
  
  next: () => {
    const { currentIndex, playlist, loopMode } = get()
    if (currentIndex < playlist.length - 1) {
      set({ currentIndex: currentIndex + 1, isPlaying: true })
    } else if (loopMode === 'all') {
      set({ currentIndex: 0, isPlaying: true })
    } else {
      set({ isPlaying: false }) // End of playlist
    }
  },
  
  prev: () => {
    const { currentIndex, progress } = get()
    // If progress is more than 3 seconds, just restart track. Handled in player component.
    if (currentIndex > 0) {
      set({ currentIndex: currentIndex - 1, isPlaying: true })
    }
  },
  
  setProgress: (p) => set({ progress: p }),
  setDuration: (d) => set({ duration: d }),
}))
