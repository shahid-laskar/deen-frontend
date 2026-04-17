const fs = require('fs');
let content = fs.readFileSync('src/routes/_authenticated/quran.jsx', 'utf-8');

// 1. Add Howler to imports
content = content.replace("import { useVirtualizer } from '@tanstack/react-virtual'", "import { useVirtualizer } from '@tanstack/react-virtual'\nimport { Howl } from 'howler'");

// 2. Replace useAudio
const newUseAudio = `function useAudio() {
  const howlRef = useRef(null)
  const sleepTimerRef = useRef(null)
  const [playing,   setPlaying]   = useState(false)
  const [speed,     setSpeed]     = useState(1.0)
  const [currentV,  setCurrentV]  = useState(null)
  const [reciterId, setReciterId] = useStickyState(7, 'q_reciter_id')
  const [sleepTimer, setSleepTimer] = useState(null)
  const [onEndTrigger, setOnEndTrigger] = useState(null)

  const getUrl = useCallback((surah, ayah, reciter) => {
    const s = String(surah).padStart(3,'0')
    const a = String(ayah).padStart(3,'0')
    const r = RECITERS.find(r=>r.id===reciter)?.slug || 'mishary_rashid_alafasy'
    return \`https://verses.quran.com/\${r}/\${s}\${a}.mp3\`
  },[])

  const playVerse = useCallback((surah, ayah, audioUrl) => {
    if (howlRef.current) {
        howlRef.current.unload()
    }
    const finalUrl = audioUrl ? \`https://verses.quran.com/\${audioUrl}\` : getUrl(surah, ayah, reciterId);
    
    howlRef.current = new Howl({
      src: [finalUrl],
      html5: true,
      preload: true,
      rate: speed,
      onend: () => {
        setPlaying(false)
        setOnEndTrigger({ surah, ayah, ts: Date.now() })
      }
    });

    howlRef.current.play()
    setPlaying(true)
    setCurrentV({surah,ayah})
  },[reciterId, speed, getUrl])

  const pause  = useCallback(()=>{ howlRef.current?.pause(); setPlaying(false) },[])
  const resume = useCallback(()=>{ howlRef.current?.play(); setPlaying(true) },[])
  const changeSpeed = useCallback((s)=>{ 
    setSpeed(s); 
    if(howlRef.current) howlRef.current.rate(s) 
  },[])

  const startSleepTimer = useCallback((minutes) => {
    if (sleepTimerRef.current) clearTimeout(sleepTimerRef.current)
    const label = minutes ? \`\${minutes} min\` : 'End of surah'
    setSleepTimer({ remaining: minutes, label })
    if (minutes) {
      sleepTimerRef.current = setTimeout(() => {
        howlRef.current?.pause()
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
        title: \`Ayah \${currentV.ayah}\`,
        artist: reciterName,
        album: \`Surah \${currentV.surah}\`
      })
      navigator.mediaSession.playbackState = playing ? 'playing' : 'paused'
      
      navigator.mediaSession.setActionHandler('play', resume)
      navigator.mediaSession.setActionHandler('pause', pause)
    }
  }, [currentV, playing, reciterId, resume, pause])

  return { playing, speed, currentV, reciterId, setReciterId, playVerse, pause, resume, changeSpeed, sleepTimer, startSleepTimer, cancelSleepTimer, onEndTrigger }
}`;

content = content.replace(/function useAudio\(\) \{[\s\S]*?return \{[\s\S]*?\}\n\}/, newUseAudio);

// 3. Inject continuous playback logic inside SurahReader
const gaplessHook = `useEffect(()=>{
    if (audio.onEndTrigger && verses.length > 0) {
       const { surah, ayah } = audio.onEndTrigger;
       const nextAyahNum = ayah + 1;
       const nextVerse = verses.find(v => v.verse_number === nextAyahNum);
       if (nextVerse && (!audio.sleepTimer || audio.sleepTimer.label !== 'End of surah')) {
          audio.playVerse(surah, nextAyahNum, nextVerse.audio?.url);
          scrollToAyah(nextAyahNum)
       }
    }
  }, [audio.onEndTrigger, verses, audio, scrollToAyah])
  
  useEffect(()=>{
`

content = content.replace(/useEffect\(\(\)=>\{\n    return \(\)=>\{\n      const mins = Math\.round/s, gaplessHook + "    return ()=>{\n      const mins = Math.round");

fs.writeFileSync('src/routes/_authenticated/quran.jsx', content);
