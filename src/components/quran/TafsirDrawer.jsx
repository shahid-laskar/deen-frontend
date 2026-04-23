import { useState, useEffect, useRef } from 'react'
import { X, Sparkles, Loader2 } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { quranApi } from '@/lib/api'
import { api } from '@/lib/api'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

const TAFSIR_OPTIONS = [
  { id: 169, name: 'Ibn Kathir (en)' },
  { id: 170, name: 'Jalalayn (en)' },
  { id: 16,  name: 'Saadi (en)' },
]

/**
 * TafsirDrawer — slides in from the right (desktop) / bottom (mobile).
 * Tab 1: Classical Tafsir selector (Ibn Kathir, Jalalayn, Saadi)
 * Tab 2: AI Reflection Companion (from deen-frontend)
 */
export function TafsirDrawer({ verse, surahNumber, onClose }) {
  const [tab, setTab] = useState('tafsir')
  const [tafsirId, setTafsirId] = useState(169)
  const [messages, setMessages] = useState([])
  const [inputVal, setInputVal] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [convId, setConvId] = useState(null)
  const inputRef = useRef(null)
  const messagesRef = useRef(null)

  const verseKey = verse?.verse_key || `${surahNumber}:${verse?.verse_number || 1}`
  const [sNum, aNum] = verseKey.split(':').map(Number)
  const arabicText = verse?.text_uthmani || ''
  const translation = verse?.translations?.[0]?.text || ''

  const { data: tafsirData, isLoading, isError } = useQuery({
    queryKey: ['tafsir', verseKey, tafsirId],
    queryFn: () => quranApi.tafsir(sNum, aNum, { tafsir_id: tafsirId }),
    staleTime: 30 * 60_000,
    enabled: tab === 'tafsir' && !!verse,
  })

  // Auto-scroll AI messages
  useEffect(() => {
    if (messagesRef.current) {
      messagesRef.current.scrollTop = messagesRef.current.scrollHeight
    }
  }, [messages, isSending])

  // Focus input when switching to AI tab
  useEffect(() => {
    if (tab === 'ai') setTimeout(() => inputRef.current?.focus(), 100)
  }, [tab])

  const handleAiSubmit = async (e) => {
    e?.preventDefault()
    if (!inputVal.trim() || isSending) return
    const userText = inputVal.trim()
    setInputVal('')
    const fullText = `Context — Quran ${verseKey}:\nArabic: "${arabicText}"\nTranslation: "${translation}"\n\nUser Question: ${userText}`
    const newMsgs = [...messages, { role: 'user', content: userText }]
    setMessages(newMsgs)
    setIsSending(true)
    try {
      const res = await api.post('/ai/chat', { content: fullText, context_module: 'quran', conversation_id: convId })
      setConvId(res.data.conversation_id)
      setMessages([...newMsgs, { role: 'assistant', content: res.data.reply }])
    } catch {
      toast.error('AI is resting or limit reached.')
    } finally {
      setIsSending(false)
    }
  }

  const PROMPTS = ['Explain this verse', 'Occasion of revelation', 'Key lessons', 'Related verses']

  if (!verse) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer panel */}
      <div className="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-card border-l border-border shadow-elevated flex flex-col animate-slide-right md:rounded-l-3xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border/50 shrink-0">
          <div>
            <p className="text-xs font-black uppercase tracking-widest text-primary">
              {surahNumber} : {verse.verse_number}
            </p>
            <p className="font-bold text-sm text-foreground">Tafsir &amp; Reflection</p>
          </div>
          <button onClick={onClose} className="w-9 h-9 rounded-xl flex items-center justify-center hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Arabic verse preview */}
        <div className="px-5 py-4 border-b border-border/50 shrink-0 bg-muted/30">
          <p className="font-amiri-quran text-xl text-right leading-loose text-foreground mb-2">
            {arabicText}
          </p>
          <p className="text-xs font-medium text-muted-foreground leading-relaxed line-clamp-3">
            {translation}
          </p>
        </div>

        {/* Tab switcher */}
        <div className="flex gap-2 px-5 pt-4 pb-2 shrink-0">
          <button
            onClick={() => setTab('tafsir')}
            className={cn('flex-1 py-2 rounded-xl text-xs font-bold transition-all', tab === 'tafsir' ? 'bg-primary text-primary-foreground shadow-glow-primary' : 'bg-muted text-muted-foreground hover:text-foreground')}
          >
            Classical Tafsir
          </button>
          <button
            onClick={() => setTab('ai')}
            className={cn('flex-1 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all', tab === 'ai' ? 'bg-primary text-primary-foreground shadow-glow-primary' : 'bg-muted text-muted-foreground hover:text-foreground')}
          >
            <Sparkles className="h-3 w-3" /> AI Companion
          </button>
        </div>

        {/* Tab contents */}
        <div className="flex-1 overflow-hidden flex flex-col">
          {tab === 'tafsir' && (
            <div className="flex-1 overflow-y-auto px-5 pt-2 pb-6 space-y-4">
              {/* Tafsir selector */}
              <div className="flex gap-1.5 flex-wrap">
                {TAFSIR_OPTIONS.map(opt => (
                  <button
                    key={opt.id}
                    onClick={() => setTafsirId(opt.id)}
                    className={cn('px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-colors', tafsirId === opt.id ? 'bg-primary/10 border-primary/30 text-primary' : 'bg-muted border-border text-muted-foreground hover:text-foreground')}
                  >
                    {opt.name}
                  </button>
                ))}
              </div>

              {isLoading && (
                <div className="flex items-center gap-3 py-8 text-muted-foreground">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span className="text-sm font-medium">Loading tafsir…</span>
                </div>
              )}
              {isError && (
                <p className="text-sm font-bold text-destructive py-4">Failed to load tafsir. Check connection.</p>
              )}
              {!isLoading && !isError && tafsirData?.tafsir?.text && (
                <div
                  className="prose dark:prose-invert prose-sm max-w-none text-foreground prose-p:leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: tafsirData.tafsir.text }}
                />
              )}
              {!isLoading && !isError && !tafsirData?.tafsir?.text && (
                <p className="text-sm text-muted-foreground py-4">No tafsir available for this ayah.</p>
              )}
            </div>
          )}

          {tab === 'ai' && (
            <div className="flex-1 overflow-hidden flex flex-col">
              {/* Messages */}
              <div ref={messagesRef} className="flex-1 overflow-y-auto px-5 pt-2 pb-4 space-y-3">
                {messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center py-8 space-y-4">
                    <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                      <Sparkles className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-foreground mb-1">Ayah Reflection Companion</h3>
                      <p className="text-xs text-muted-foreground">Ask scholarly questions based on classical Tafsir.</p>
                    </div>
                    <div className="flex flex-wrap gap-2 justify-center">
                      {PROMPTS.map(p => (
                        <button
                          key={p}
                          onClick={() => setInputVal(p)}
                          className="px-3 py-1.5 rounded-xl border border-border bg-muted text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:border-primary/40 hover:bg-primary/5 transition-colors"
                        >
                          {p}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  messages.map((m, i) => (
                    <div key={i} className={cn('flex', m.role === 'user' ? 'justify-end' : 'justify-start')}>
                      <div className={cn('max-w-[85%] rounded-2xl p-3 text-sm leading-relaxed', m.role === 'user' ? 'bg-primary text-primary-foreground rounded-tr-sm' : 'bg-muted text-foreground rounded-tl-sm')}>
                        {m.role === 'assistant'
                          ? <div dangerouslySetInnerHTML={{ __html: m.content.replace(/\n/g, '<br/>') }} />
                          : m.content}
                      </div>
                    </div>
                  ))
                )}
                {isSending && (
                  <div className="flex justify-start">
                    <div className="bg-muted rounded-2xl rounded-tl-sm p-3 flex gap-1">
                      {[0, 150, 300].map(d => (
                        <span key={d} className="w-1.5 h-1.5 rounded-full bg-muted-foreground/50 animate-bounce" style={{ animationDelay: `${d}ms` }} />
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Input */}
              <form onSubmit={handleAiSubmit} className="px-5 pb-5 pt-3 border-t border-border/50 flex gap-2 shrink-0">
                <input
                  ref={inputRef}
                  value={inputVal}
                  onChange={e => setInputVal(e.target.value)}
                  placeholder="Ask about this Ayah…"
                  className="flex-1 rounded-xl border border-border bg-muted px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                  disabled={isSending}
                />
                <button
                  type="submit"
                  disabled={!inputVal.trim() || isSending}
                  className="w-10 shrink-0 rounded-xl bg-primary text-primary-foreground flex items-center justify-center disabled:opacity-50 transition-opacity"
                >
                  <Sparkles className="h-4 w-4" />
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
