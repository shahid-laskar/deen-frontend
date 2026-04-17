import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { Howl } from 'howler'

let howlInstance = null;

export const useQuranStore = create(
  persist(
    (set, get) => ({
      // Reader configs
      fontSize: 30,
      readingMode: 'scroll',
      translationIds: [20],
      tajweedEnabled: true,
      showTrans: true,
      showTranslit: false,
      showGrammar: false,
      
      // Audio
      reciterId: 7,
      speed: 1.0,
      playing: false,
      currentV: null,
      sleepTimer: null,
      onEndTrigger: null,

      setFontSize: (n) => set({ fontSize: n }),
      setReadingMode: (m) => set({ readingMode: m }),
      setTranslationIds: (ids) => set({ translationIds: ids }),
      setTajweedEnabled: (v) => set({ tajweedEnabled: v }),
      setShowTrans: (v) => set({ showTrans: v }),
      setShowTranslit: (v) => set({ showTranslit: v }),
      setShowGrammar: (v) => set({ showGrammar: v }),
      setReciterId: (id) => set({ reciterId: id }),

      changeSpeed: (s) => {
        set({ speed: s })
        if (howlInstance) howlInstance.rate(s)
      },

      playVerse: (surah, ayah, audioUrl, reciterSlug) => {
        if (howlInstance) {
          howlInstance.unload()
        }
        
        const finalUrl = audioUrl 
          ? `https://verses.quran.com/${audioUrl}` 
          : `https://verses.quran.com/${reciterSlug || 'mishary_rashid_alafasy'}/${String(surah).padStart(3,'0')}${String(ayah).padStart(3,'0')}.mp3`;
        
        howlInstance = new Howl({
          src: [finalUrl],
          html5: true,
          preload: true,
          rate: get().speed,
          onend: () => {
            set({ playing: false, onEndTrigger: { surah, ayah, ts: Date.now() } })
          }
        });

        howlInstance.play()
        set({ playing: true, currentV: { surah, ayah } })
      },

      pause: () => {
        if (howlInstance) howlInstance.pause();
        set({ playing: false })
      },
      
      resume: () => {
        if (howlInstance) howlInstance.play();
        set({ playing: true })
      },

      startSleepTimer: (minutes) => {
        const { sleepTimer } = get()
        if (sleepTimer?.timeoutId) clearTimeout(sleepTimer.timeoutId)
        
        const label = minutes ? `${minutes} min` : 'End of surah'
        let timeoutId = null
        if (minutes) {
          timeoutId = setTimeout(() => {
            get().pause()
            set({ sleepTimer: null })
          }, minutes * 60 * 1000)
        }
        set({ sleepTimer: { remaining: minutes, label, timeoutId } })
      },

      cancelSleepTimer: () => {
        const { sleepTimer } = get()
        if (sleepTimer?.timeoutId) clearTimeout(sleepTimer.timeoutId)
        set({ sleepTimer: null })
      }
    }),
    {
      name: 'quran-store',
      // Only persist settings, not audio state
      partialize: (state) => ({
        fontSize: state.fontSize,
        readingMode: state.readingMode,
        translationIds: state.translationIds,
        tajweedEnabled: state.tajweedEnabled,
        showTrans: state.showTrans,
        showTranslit: state.showTranslit,
        showGrammar: state.showGrammar,
        reciterId: state.reciterId,
        speed: state.speed,
      }),
    }
  )
)
