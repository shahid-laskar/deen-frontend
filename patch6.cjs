const fs = require('fs');
let content = fs.readFileSync('src/routes/_authenticated/quran.jsx', 'utf-8');

const newTafsirViewer = `function TafsirViewer({ surahNum, ayahNum, arabicText, translation }) {
  const [tab, setTab] = useState('tafsir');
  const { data: tafsirData, isLoading, isError } = useQuery({ queryKey: ['quran', 'tafsir', surahNum, ayahNum], queryFn: () => api.get(\`/quran/tafsir/\${surahNum}/\${ayahNum}\`).then(r => r.data), staleTime: 60 * 60_000 })
  
  const [messages, setMessages] = useState([]);
  const [inputVal, setInputVal] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [convId, setConvId] = useState(null);

  const handleAiSubmit = async (e) => {
    e?.preventDefault();
    if (!inputVal.trim() || isSending) return;
    const userText = inputVal.trim();
    setInputVal('');
    
    // Inject Ayah context gracefully if this is the very first message
    const fullText = messages.length === 0 
      ? \`Context - Surah \${surahNum}, Ayah \${ayahNum}:
Arabic: "\${arabicText}"
Translation: "\${translation}"

User Question: \${userText}\` 
      : userText;

    const newMsgs = [...messages, { role: 'user', content: userText }];
    setMessages(newMsgs);
    setIsSending(true);

    try {
      const res = await api.post('/ai/chat', { content: fullText, context_module: 'quran', conversation_id: convId });
      setConvId(res.data.conversation_id);
      setMessages([...newMsgs, { role: 'assistant', content: res.data.reply }]);
    } catch (err) {
      toast.error('AI is resting or limit reached.');
    } finally {
      setIsSending(false);
    }
  };

  const PROMPTS = ['Explain this verse', 'What is the occasion of revelation?', 'Key lessons to apply', 'Related verses'];

  return (
    <div className="flex flex-col h-[60vh] max-h-[800px]">
      <div className="pb-4 border-b border-border/50 shrink-0 mb-4">
        <p className="font-amiri text-2xl leading-relaxed text-right rtl text-foreground mb-4">{arabicText}</p>
        <p className="text-sm font-medium text-muted-foreground leading-relaxed">{translation}</p>
      </div>
      
      <div className="flex gap-2 mb-4 shrink-0 bg-muted/50 p-1 rounded-xl w-fit">
        <button onClick={() => setTab('tafsir')} className={cn("px-4 py-1.5 rounded-lg text-xs font-bold transition-all", tab === 'tafsir' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground')}>Classical Tafsir</button>
        <button onClick={() => setTab('ai')} className={cn("px-4 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5", tab === 'ai' ? 'bg-background text-primary shadow-sm' : 'text-muted-foreground hover:text-foreground')}>
          <Sparkles className="w-3 h-3"/> AI Companion
        </button>
      </div>

      {tab === 'tafsir' && (
        <div className="flex-1 overflow-y-auto pr-2 space-y-6">
          {isLoading ? <div className="space-y-3"><Skeleton className="h-6 w-3/4" /><Skeleton className="h-4 w-full" /><Skeleton className="h-4 w-full" /></div> : isError ? <p className="text-sm font-bold text-red-500">Failed to load Tafsir.</p> : tafsirData?.tafsir?.text ? (
            <div className="prose dark:prose-invert prose-sm max-w-none text-foreground" dangerouslySetInnerHTML={{ __html: tafsirData.tafsir.text }} />
          ) : <p className="text-sm font-medium text-muted-foreground">No Tafsir available for this Ayah.</p>}
        </div>
      )}

      {tab === 'ai' && (
        <div className="flex-1 overflow-y-hidden flex flex-col pt-2 border-t border-border/50 -mx-6 px-6">
          <div className="flex-1 overflow-y-auto space-y-4 pb-4">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center space-y-4 animate-in fade-in">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-2">
                  <Sparkles className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-sm font-bold">Ayah Reflection Companion</h3>
                <p className="text-xs text-muted-foreground max-w-[250px]">Ask scholarly questions about this specific verse based on classical Tafsir.</p>
                <div className="flex flex-wrap gap-2 justify-center mt-4">
                  {PROMPTS.map(p => (
                    <button key={p} onClick={() => { setInputVal(p); }} className="px-3 py-1.5 rounded-lg border border-border bg-card text-[10px] font-black uppercase tracking-widest hover:border-primary/50 hover:bg-primary/5 transition-colors text-muted-foreground">
                      {p}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              messages.map((m, i) => (
                <div key={i} className={cn("flex w-full animate-in slide-in-from-bottom-2", m.role === 'user' ? "justify-end" : "justify-start")}>
                  <div className={cn("max-w-[85%] rounded-2xl p-3 text-sm", m.role === 'user' ? "bg-primary text-primary-foreground rounded-tr-sm" : "bg-muted text-foreground rounded-tl-sm prose dark:prose-invert prose-sm")}>
                    {m.role === 'assistant' ? <div dangerouslySetInnerHTML={{ __html: m.content.replace(/\\n/g, '<br/>') }} /> : m.content}
                  </div>
                </div>
              ))
            )}
            {isSending && (
              <div className="flex justify-start w-full">
                <div className="max-w-[85%] rounded-2xl p-3 bg-muted rounded-tl-sm flex gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/50 animate-bounce"></span>
                  <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/50 animate-bounce" style={{animationDelay:'150ms'}}></span>
                  <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/50 animate-bounce" style={{animationDelay:'300ms'}}></span>
                </div>
              </div>
            )}
          </div>
          <form onSubmit={handleAiSubmit} className="pt-3 border-t border-border/50 shrink-0 flex gap-2">
            <Input value={inputVal} onChange={e=>setInputVal(e.target.value)} placeholder="Ask about this Ayah..." className="flex-1 rounded-xl" disabled={isSending} />
            <Button type="submit" disabled={!inputVal.trim() || isSending} className="rounded-xl w-10 p-0 shrink-0"><Sparkles className="w-4 h-4 fill-current"/></Button>
          </form>
        </div>
      )}
    </div>
  )
}`;

content = content.replace(/function TafsirViewer[\s\S]*?(?=function HifzProgressMap)/, newTafsirViewer + "\n\n\n");

// 3. Import Sparkles
if (!content.includes('Sparkles')) {
  content = content.replace('Play, Pause, Maximize2, Minimize2,', 'Play, Pause, Maximize2, Minimize2, Sparkles,');
}

fs.writeFileSync('src/routes/_authenticated/quran.jsx', content);
