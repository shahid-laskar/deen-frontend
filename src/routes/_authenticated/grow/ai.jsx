import React, { useState, useRef, useEffect } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Sparkles, Send, AlertTriangle, ExternalLink, MessageSquare, Plus, Trash2 } from 'lucide-react'
import { aiApi } from '@/lib/api'
import { useAppStore } from '@/store/appStore'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'
import toast from 'react-hot-toast'
import { format } from 'date-fns'

export const Route = createFileRoute('/_authenticated/grow/ai')({
  component: AIGuidePage,
})

const SUGGESTED_PROMPTS = [
  'Help me build a consistent morning routine',
  'How can I memorise more Quran consistently?',
  'Suggest a productive daily schedule around prayer times',
  'I feel spiritually disconnected. What can I do?',
  'Tips for staying motivated with ibadah',
]

function Message({ msg }) {
  const isUser = msg.role === 'user'
  const isReferral = msg.was_referred || (msg.referral_links?.length > 0)
  return (
    <div className={cn('flex gap-3', isUser ? 'justify-end' : 'justify-start')}>
      {!isUser && (
        <div className="w-8 h-8 bg-primary rounded-xl flex items-center justify-center shrink-0 mt-1">
          <Sparkles className="h-3.5 w-3.5 text-primary-foreground" />
        </div>
      )}
      <div className="max-w-[80%] space-y-2">
        <div className={cn(
          'px-4 py-3 rounded-2xl text-sm leading-relaxed',
          isUser
            ? 'bg-primary text-primary-foreground rounded-tr-sm'
            : 'bg-card border border-border text-foreground rounded-tl-sm'
        )}>
          {isReferral && (
            <div className="flex items-center gap-1.5 mb-2 text-gold">
              <AlertTriangle className="h-3 w-3" />
              <span className="text-xs font-medium">Scholarly guidance required</span>
            </div>
          )}
          <p className="whitespace-pre-wrap">{msg.content}</p>
        </div>
        {isReferral && msg.referral_links?.map(link => (
          <a key={link.url} href={link.url} target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-gold/10 border border-gold/20 text-xs text-gold hover:bg-gold/20 transition-colors">
            <ExternalLink className="h-3 w-3" />{link.label}
          </a>
        ))}
        <p className="text-[10px] text-muted-foreground px-1">
          {msg.timestamp ? format(new Date(msg.timestamp), 'h:mm a') : ''}
        </p>
      </div>
    </div>
  )
}

function AIGuidePage() {
  const qc = useQueryClient()
  const { activeConversationId, setActiveConversation } = useAppStore()
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState([])
  const bottomRef = useRef(null)

  const { data: usage } = useQuery({ queryKey: ['ai', 'usage'], queryFn: () => aiApi.getUsage().then(r => r.data) })
  const { data: conversations } = useQuery({ queryKey: ['ai', 'conversations'], queryFn: () => aiApi.getConversations().then(r => r.data) })

  useEffect(() => {
    if (activeConversationId) {
      const conv = conversations?.find(c => c.id === activeConversationId)
      if (conv?.messages) setMessages(conv.messages)
    } else setMessages([])
  }, [activeConversationId, conversations])

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  const { mutate: sendMessage, isPending } = useMutation({
    mutationFn: (content) => aiApi.chat({ content, conversation_id: activeConversationId || undefined, context_module: 'general' }),
    onSuccess: ({ data }) => {
      if (data.conversation_id && !activeConversationId) setActiveConversation(data.conversation_id)
      setMessages(m => [...m, { role: 'assistant', content: data.reply, was_referred: data.was_referred, referral_links: data.referral_links, timestamp: new Date().toISOString() }])
      qc.invalidateQueries({ queryKey: ['ai'] })
    },
    onError: (err) => toast.error(err.response?.data?.detail || 'Could not reach AI. Please try again.'),
  })

  const handleSend = () => {
    if (!input.trim() || isPending) return
    if ((usage?.messages_remaining ?? 1) <= 0) { toast.error('Daily AI limit reached.'); return }
    const content = input.trim()
    setMessages(m => [...m, { role: 'user', content, timestamp: new Date().toISOString() }])
    setInput('')
    sendMessage(content)
  }

  const startNew = () => { setActiveConversation(null); setMessages([]) }
  const deleteConv = async (id) => {
    await aiApi.deleteConversation(id)
    qc.invalidateQueries({ queryKey: ['ai', 'conversations'] })
    if (activeConversationId === id) startNew()
  }

  const remaining = usage?.messages_remaining ?? 20
  const used = usage?.messages_used_today ?? 0
  const limit = usage?.messages_limit ?? 20

  return (
    <div className="flex h-[calc(100vh-60px)] md:h-screen">
      {/* Sidebar */}
      <div className="hidden md:flex flex-col w-56 border-r border-border bg-sidebar p-3 shrink-0">
        <Button variant="outline" size="sm" onClick={startNew} className="mb-3 w-full">
          <Plus className="h-3.5 w-3.5 mr-1" /> New chat
        </Button>
        <div className="flex-1 overflow-y-auto space-y-1">
          {conversations?.map(c => (
            <div key={c.id}
              className={cn('group flex items-start gap-2 px-2.5 py-2 rounded-xl cursor-pointer text-left text-xs transition-all',
                activeConversationId === c.id ? 'bg-primary/10 text-foreground' : 'text-muted-foreground hover:bg-muted')}
              onClick={() => setActiveConversation(c.id)}>
              <MessageSquare className="h-3 w-3 mt-0.5 shrink-0" />
              <p className="flex-1 line-clamp-2 leading-relaxed">{c.title || 'Untitled chat'}</p>
              <button onClick={e => { e.stopPropagation(); deleteConv(c.id) }}
                className="opacity-0 group-hover:opacity-100 hover:text-destructive transition-all shrink-0">
                <Trash2 className="h-2.5 w-2.5" />
              </button>
            </div>
          ))}
        </div>
        <div className="pt-3 border-t border-border space-y-1.5">
          <p className="text-xs text-muted-foreground">Daily: {used}/{limit}</p>
          <Progress value={(used / limit) * 100} className="h-1.5" />
          {remaining <= 5 && remaining > 0 && <p className="text-xs text-gold">{remaining} messages left</p>}
        </div>
      </div>

      {/* Main chat */}
      <div className="flex-1 flex flex-col min-h-0">
        {/* Header */}
        <div className="flex items-center gap-3 px-6 py-4 border-b border-border bg-card shrink-0">
          <div className="w-9 h-9 bg-primary rounded-xl flex items-center justify-center">
            <Sparkles className="h-4 w-4 text-primary-foreground" />
          </div>
          <div>
            <h1 className="font-semibold text-foreground">Deen Guide</h1>
            <p className="text-xs text-muted-foreground">Lifestyle & wellness companion · No fatwas, just guidance</p>
          </div>
          <Badge variant="muted" className="ml-auto text-xs">{remaining} msgs left</Badge>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center py-12">
              <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center mb-4">
                <Sparkles className="h-7 w-7 text-primary-foreground" />
              </div>
              <h2 className="text-xl font-semibold text-foreground mb-2">Assalamu Alaikum!</h2>
              <p className="text-muted-foreground max-w-sm mb-6 text-sm">
                I'm your Islamic lifestyle companion — habits, productivity, Quran memorisation, and wellbeing.
                I'll always refer you to scholars for rulings.
              </p>
              <div className="space-y-2 w-full max-w-sm">
                {SUGGESTED_PROMPTS.map(p => (
                  <button key={p} onClick={() => setInput(p)}
                    className="w-full text-left px-4 py-3 rounded-xl border border-border text-sm text-foreground hover:bg-muted transition-colors">
                    {p}
                  </button>
                ))}
              </div>
            </div>
          )}
          {messages.map((msg, i) => <Message key={i} msg={msg} />)}
          {isPending && (
            <div className="flex gap-3">
              <div className="w-8 h-8 bg-primary rounded-xl flex items-center justify-center shrink-0">
                <Sparkles className="h-3.5 w-3.5 text-primary-foreground" />
              </div>
              <div className="px-4 py-3 bg-card border border-border rounded-2xl rounded-tl-sm">
                <div className="flex gap-1">
                  {[0,1,2].map(i => (
                    <div key={i} className="w-2 h-2 bg-primary rounded-full animate-bounce"
                      style={{ animationDelay: `${i * 0.15}s` }} />
                  ))}
                </div>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="px-6 py-4 border-t border-border bg-card shrink-0">
          <div className="flex gap-3 items-end">
            <textarea
              className="flex-1 rounded-xl border border-input bg-background px-4 py-3 text-sm resize-none min-h-[44px] max-h-32 focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="Ask about your lifestyle, habits, or wellness..."
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() } }}
              rows={1}
            />
            <Button onClick={handleSend} disabled={!input.trim() || isPending || remaining <= 0} className="py-3 px-4">
              <Send className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-2 text-center">
            Lifestyle guidance only — not a fatwa. For rulings, consult a qualified scholar.
          </p>
        </div>
      </div>
    </div>
  )
}
