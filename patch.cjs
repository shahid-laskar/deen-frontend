const fs = require('fs');

let content = fs.readFileSync('src/routes/_authenticated/quran.jsx', 'utf-8');

// 1. apply useAudio
content = content.replace(
  /const \[reciterId, setReciterId\] = useState\(7\)\s*const \[sleepTimer, setSleepTimer\] = useState\(null\)/g,
  `const [reciterId, setReciterId] = useStickyState(7, 'q_reciter_id')
  const [sleepTimer, setSleepTimer] = useState(null)`
);

content = content.replace(
  /const cancelSleepTimer = useCallback\(\(\) => \{\n    if \(sleepTimerRef.current\) clearTimeout\(sleepTimerRef.current\)\n    setSleepTimer\(null\)\n  \}, \[\]\)/,
  `const cancelSleepTimer = useCallback(() => {
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
  }, [currentV, playing, reciterId, resume, pause])`
);

// 2. SurahReader Config Replacement
content = content.replace(
  /const \[showTrans, setShowTrans\] = useState\(true\)\n  const \[showTranslit, setShowTranslit\] = useState\(false\)\n  const \[showGrammar, setShowGrammar\] = useState\(false\)\n  const \[readingMode, setReadingMode\] = useState\('scroll'\)\n  const \[focusMode, setFocusMode\] = useState\(false\)\n  const \[bookmarkSheet,setBookmarkSheet\]= useState\(null\)\n  const \[noteText, setNoteText\] = useState\(''\)\n  const \[hlColor, setHlColor\] = useState\('gold'\)\n  const \[tafsirVerse, setTafsirVerse\] = useState\(null\)\n  const \[grammarWord, setGrammarWord\] = useState\(null\)\n  const \[translationId, setTranslationId\] = useState\(20\)/g,
  `const [showTrans, setShowTrans] = useStickyState(true, 'q_show_trans')
  const [showTranslit, setShowTranslit] = useStickyState(false, 'q_show_translit')
  const [showGrammar, setShowGrammar] = useStickyState(false, 'q_show_grammar')
  const [showTajweed, setShowTajweed] = useStickyState(true, 'q_show_tajweed')
  const [readingMode, setReadingMode] = useStickyState('scroll', 'q_reading_mode')
  const [focusMode, setFocusMode] = useState(false)
  const [bookmarkSheet,setBookmarkSheet]= useState(null)
  const [noteText, setNoteText] = useState('')
  const [hlColor, setHlColor] = useState('gold')
  const [tafsirVerse, setTafsirVerse] = useState(null)
  const [grammarWord, setGrammarWord] = useState(null)
  const [translationId, setTranslationId] = useStickyState(20, 'q_translation_id')`
);

content = content.replace(
  /\[\['Trans',showTrans,setShowTrans\],\['Latin',showTranslit,setShowTranslit\],\['Grammar',showGrammar,setShowGrammar\]\]\.map/g,
  `[['Trans',showTrans,setShowTrans],['Latin',showTranslit,setShowTranslit],['Grammar',showGrammar,setShowGrammar],['Tajweed',showTajweed,setShowTajweed]].map`
);

// 3. Extract AyahRow + VirtualAyahList
const ayahListRegex = /const AyahList = \(\) => verses\.map\(\(v,i\) => \{[\s\S]*?\}\)/;
let newAyahClasses = `

const AyahRow = ({ v, surah, audio, bookmarks, addBookmark, setTafsirVerse, readingMode, showGrammar, showTranslit, showTrans, showTajweed }) => {
  const ayahNum = v.verse_number
  const isPlaying = audio.currentV?.surah===surah.id&&audio.currentV?.ayah===ayahNum&&audio.playing
  const isHighlighted = audio.currentV?.surah===surah.id&&audio.currentV?.ayah===ayahNum
  const isBookmarked = bookmarks.some(b=>b.surah_number===surah.id&&b.ayah_number===ayahNum)
  const [revealed, setRevealed] = useState(false)
  const arabicText = v.text_uthmani||v.text_imlaei||''
  const words = v.words?.filter(w => w.char_type_name === 'word') || arabicText.split(' ').map(w => ({ text_uthmani: w }))
  
  let tajweedHtml = arabicText;
  if (showTajweed) {
     try { tajweedHtml = parseTajweed(arabicText) } catch(e) {}
  }

  return (
    <div className={cn("py-6 border-b border-border/50 transition-colors", isHighlighted ? 'bg-gold/5' : 'bg-transparent')}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex gap-2">
          <button onClick={()=>{isPlaying?audio.pause():audio.playVerse(surah.id,ayahNum, v.audio?.url)}} className={cn("w-8 h-8 rounded-full flex items-center justify-center transition-colors", isPlaying ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-border")}>
            {isPlaying ? <Pause className="h-3 w-3 fill-current"/> : <Play className="h-3 w-3 fill-current ml-0.5" />}
          </button>
          <button onClick={()=>addBookmark(surah.id,ayahNum)} className={cn("w-8 h-8 rounded-full flex items-center justify-center transition-colors", isBookmarked ? "text-primary" : "text-muted-foreground hover:bg-muted")}>
            <BookMarked className="h-4 w-4" fill={isBookmarked ? 'currentColor' : 'none'}/>
          </button>
          <button onClick={()=>setTafsirVerse({surahNum: surah.id, ayahNum, text: arabicText, trans: v.translations?.[0]?.text?.replace(/<[^>]+>/g,'')})} className="w-8 h-8 rounded-full flex items-center justify-center text-xs hover:bg-muted text-muted-foreground" title="View Tafsir">📖</button>
        </div>
        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-black border border-primary/20 text-primary">{ayahNum}</div>
      </div>
      {readingMode==='hifz' ? (
        <div onClick={()=>setRevealed(r=>!r)} className="cursor-pointer">
          {revealed ? (
            showTajweed 
              ? <div className="font-amiri text-3xl leading-loose text-right rtl mb-4" dangerouslySetInnerHTML={{ __html: tajweedHtml }} />
              : <p className="font-amiri text-3xl leading-loose text-right rtl text-foreground mb-4">{arabicText}</p>
          ) : <div className="rounded-xl h-14 bg-muted/50 border border-border flex items-center justify-center text-xs font-bold text-muted-foreground uppercase tracking-widest hover:bg-muted transition-colors">Tap to reveal</div>}
        </div>
      ) : showGrammar ? (
        <div className="text-right rtl leading-[3] flex flex-wrap flex-row-reverse gap-2 mb-4">
          <Tooltip.Provider delayDuration={150}>
            {words.map((w, wi) => (
              <Tooltip.Root key={wi}>
                <Tooltip.Trigger asChild>
                  <button className="px-2 py-1 rounded-xl bg-primary/5 hover:bg-primary/10 border border-primary/10 flex flex-col items-center gap-1 transition-colors text-center max-w-[120px]">
                    {showTajweed 
                      ? <span className="font-amiri text-2xl text-foreground" dangerouslySetInnerHTML={{ __html: (() => { try { return parseTajweed(w.text_uthmani || w.text); } catch(e) { return w.text_uthmani || w.text; } })() }} />
                      : <span className="font-amiri text-2xl text-foreground">{w.text_uthmani || w.text}</span>
                    }
                    {showTranslit && w.transliteration?.text && <span className="text-[9px] font-bold text-primary italic truncate w-full">{w.transliteration.text}</span>}
                    <span className="text-[9px] font-bold uppercase tracking-wide text-muted-foreground truncate w-full">{w.translation?.text || '—'}</span>
                  </button>
                </Tooltip.Trigger>
                <Tooltip.Portal>
                  <Tooltip.Content sideOffset={6} className="z-50 rounded-lg bg-popover border border-border shadow-md p-3 text-sm max-w-[200px]">
                    <p className="font-amiri text-2xl text-right mb-1 text-foreground">{w.text_uthmani || w.text}</p>
                    <p className="text-primary text-xs font-bold">{w.transliteration?.text || '—'}</p>
                    <p className="font-medium mt-1 text-foreground">{w.translation?.text || '—'}</p>
                    <Tooltip.Arrow className="fill-popover" />
                  </Tooltip.Content>
                </Tooltip.Portal>
              </Tooltip.Root>
            ))}
          </Tooltip.Provider>
        </div>
      ) : (
        showTajweed 
          ? <div className="font-amiri text-3xl leading-[2.5] text-right rtl mb-5" style={{wordSpacing:'0.15em'}} dangerouslySetInnerHTML={{ __html: tajweedHtml }} />
          : <p className="font-amiri text-3xl leading-[2.5] text-right rtl text-foreground mb-5" style={{wordSpacing:'0.15em'}}>{arabicText}</p>
      )}
      {showTrans&&v.translations?.[0] && <p className="text-[13px] font-medium text-muted-foreground/90 leading-relaxed border-l-2 border-primary/30 pl-3">{v.translations[0].text?.replace(/<[^>]+>/g,'')}</p>}
    </div>
  )
}

const VirtualAyahList = ({ verses, surah, audio, bookmarks, addBookmark, setTafsirVerse, readingMode, showGrammar, showTranslit, showTrans, showTajweed, focusMode }) => {
  const parentRef = useRef(null)
  
  const rowVirtualizer = useVirtualizer({
    count: verses.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 200,
    overscan: 4,
  })

  return (
    <div ref={parentRef} className={cn("overflow-y-auto pr-2", focusMode ? "h-[80vh]" : "h-[calc(100vh-280px)]")}>
      <div style={{ height: rowVirtualizer.getTotalSize(), width: '100%', position: 'relative' }}>
        {rowVirtualizer.getVirtualItems().map((virtualItem) => {
          const v = verses[virtualItem.index]
          return (
            <div
              key={virtualItem.key}
              data-index={virtualItem.index}
              ref={rowVirtualizer.measureElement}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                transform: \`translateY(\${virtualItem.start}px)\`,
              }}
            >
              <AyahRow 
                v={v} 
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
              />
            </div>
          )
        })}
      </div>
    </div>
  )
}

`;

content = content.replace('function SurahReader', newAyahClasses + '\nfunction SurahReader');
content = content.replace(ayahListRegex, '');

content = content.replace(
  /\{!\focusMode && <div>\{isLoading \? <div className="space-y-4">\{\[\.\.\.Array\(5\)\]\.map\(\(_,i\)=><Skeleton key=\{i\} className="h-24 rounded-xl" \/>\)\}<\/div> : <AyahList\/>\}<\/div>\}/g,
  `{!focusMode && <div>{isLoading ? <div className="space-y-4">{[...Array(5)].map((_,i)=><Skeleton key={i} className="h-24 rounded-xl" />)}</div> : <VirtualAyahList focusMode={false} verses={verses} surah={surah} audio={audio} bookmarks={bookmarks} addBookmark={addBookmark} setTafsirVerse={setTafsirVerse} readingMode={readingMode} showGrammar={showGrammar} showTranslit={showTranslit} showTrans={showTrans} showTajweed={showTajweed} />}</div>}`
);

content = content.replace(
  /\{isLoading \? <div className="space-y-4">\{\[\.\.\.Array\(5\)\]\.map\(\(_,i\)=><Skeleton key=\{i\} className="h-24 rounded-2xl" \/>\)\}<\/div> : <AyahList\/>\}/g,
  `{isLoading ? <div className="space-y-4">{[...Array(5)].map((_,i)=><Skeleton key={i} className="h-24 rounded-2xl" />)}</div> : <VirtualAyahList focusMode={true} verses={verses} surah={surah} audio={audio} bookmarks={bookmarks} addBookmark={addBookmark} setTafsirVerse={setTafsirVerse} readingMode={readingMode} showGrammar={showGrammar} showTranslit={showTranslit} showTrans={showTrans} showTajweed={showTajweed} />}`
);

// 4. Hifz Progress Map
let hifzProgressHtml = `

function HifzProgressMap({ entries }) {
  const getStatus = (surahId) => {
    const entry = entries.find(h => h.surah_number === surahId)
    if (!entry) return 'not_started'
    if (entry.status === 'memorised') return 'memorized'
    return 'in_progress'
  }
  const STATUS_COLORS = {
    memorized: 'bg-green-500 text-white border-green-600',
    in_progress: 'bg-orange-400 text-white border-orange-500',
    not_started: 'bg-muted text-muted-foreground border-border/50',
  }
  return (
    <Card className="p-4 bg-background">
      <h3 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-3">Hifz Overview</h3>
      <div className="grid grid-cols-10 gap-1 pb-2">
        {Array.from({length: 114}).map((_, i) => {
          const sid = i + 1;
          const status = getStatus(sid)
          return (
            <div key={sid} title={\`Surah \${sid}\`} className={cn("aspect-square rounded-[4px] text-[8px] font-bold flex items-center justify-center border transition-all cursor-crosshair", STATUS_COLORS[status])}>
              {sid}
            </div>
          )
        })}
      </div>
      <div className="flex gap-4 mt-1 text-[9px] font-bold text-muted-foreground uppercase tracking-widest">
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-green-500" /> Memorized</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-orange-400" /> In Progress</span>
      </div>
    </Card>
  )
}

`;

content = content.replace('function HifzTab', hifzProgressHtml + '\nfunction HifzTab');

content = content.replace(
  /<\/Card>\n\n      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none w-fit">/g,
  `</Card>\n\n      <HifzProgressMap entries={entries} />\n\n      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none w-fit">`
);

// 5. QuranPage Top
content = content.replace(
  /const \[tab, setTab\] = useState\('reader'\)/,
  `const [tab, setTab] = useStickyState('reader', 'q_tab')`
);

// Remove GrammarWord Modal
content = content.replace(/<Dialog open=\{!!grammarWord\}[\s\S]*?<\/DialogContent>\n      <\/Dialog>/, '');

fs.writeFileSync('src/routes/_authenticated/quran.jsx', content);
console.log('Patch complete.');
