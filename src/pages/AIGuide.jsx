import React, { useState, useRef, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Sparkles, Send, AlertTriangle, ExternalLink, MessageSquare, Plus, Trash2 } from 'lucide-react'
import { aiApi } from '../lib/api'
import { useAppStore } from '../store/appStore'
import { Button, Skeleton, Badge } from '../components/ui/index'
import toast from 'react-hot-toast'
import { clsx } from 'clsx'
import { format } from 'date-fns'

const SUGGESTED_PROMPTS = [
  'Help me build a consistent morning routine',
  'How can I memorise more Quran consistently?',
  'Suggest a productive daily schedule around prayer times',
  'I feel spiritually disconnected. What can I do?',
  'Tips for staying motivated with ibadah',
]

function Message({ msg }) {
  const isUser = msg.role === 'user'
  const isReferral = msg.was_referred || (msg.referral_links && msg.referral_links.length > 0)

  return (
    <div className={clsx('flex gap-3', isUser ? 'justify-end' : 'justify-start')}>
      {!isUser && (
        <div className="w-8 h-8 bg-emerald-800 rounded-xl flex items-center justify-center flex-shrink-0 mt-1">
          <Sparkles size={14} className="text-gold-400" />
        </div>
      )}
      <div className={clsx('max-w-[80%] space-y-2')}>
        <div className={clsx(
          'px-4 py-3 rounded-2xl text-sm leading-relaxed',
          isUser
            ? 'bg-emerald-800 text-white rounded-tr-sm'
            : 'bg-white dark:bg-emerald-900/50 border border-parchment-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-100 rounded-tl-sm'
        )}>
          {isReferral && (
            <div className="flex items-center gap-1.5 mb-2 text-gold-600 dark:text-gold-400">
              <AlertTriangle size={13} />
              <span className="text-xs font-medium">Scholarly guidance required</span>
            </div>
          )}
          <p className="whitespace-pre-wrap">{msg.content}</p>
        </div>
        {isReferral && msg.referral_links && (
          <div className="space-y-1.5">
            {msg.referral_links.map((link) => (
              <a
                key={link.url}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-3 py-2 bg-gold-50 dark:bg-gold-900/20 border border-gold-200 dark:border-gold-800 rounded-xl text-xs text-gold-700 dark:text-gold-400 hover:bg-gold-100 transition-colors"
              >
                <ExternalLink size={12} />
                {link.label}
              </a>
            ))}
          </div>
        )}
        <p className="text-xs text-parchment-400 dark:text-emerald-700 px-1">
          {msg.timestamp ? format(new Date(msg.timestamp), 'h:mm a') : ''}
        </p>
      </div>
    </div>
  )
}

export default function AIGuide() {
  const qc = useQueryClient()
  const { activeConversationId, setActiveConversation } = useAppStore()
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState([])
  const bottomRef = useRef(null)

  const { data: usage } = useQuery({
    queryKey: ['ai', 'usage'],
    queryFn: () => aiApi.getUsage().then((r) => r.data),
  })

  const { data: conversations } = useQuery({
    queryKey: ['ai', 'conversations'],
    queryFn: () => aiApi.getConversations().then((r) => r.data),
  })

  // Load conversation messages when active changes
  useEffect(() => {
    if (activeConversationId) {
      const conv = conversations?.find((c) => c.id === activeConversationId)
      if (conv?.messages) setMessages(conv.messages)
    } else {
      setMessages([])
    }
  }, [activeConversationId, conversations])

  // Auto-scroll to bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const { mutate: sendMessage, isPending } = useMutation({
    mutationFn: (content) =>
      aiApi.chat({
        content,
        conversation_id: activeConversationId || undefined,
        context_module: 'general',
      }),
    onSuccess: ({ data }) => {
      if (data.conversation_id && !activeConversationId) {
        setActiveConversation(data.conversation_id)
      }
      const newMsgs = [
        ...messages,
        { role: 'assistant', content: data.reply, was_referred: data.was_referred, referral_links: data.referral_links, timestamp: new Date().toISOString() },
      ]
      setMessages(newMsgs)
      qc.invalidateQueries({ queryKey: ['ai'] })
    },
    onError: (err) => {
      const detail = err.response?.data?.detail || 'Could not reach AI. Please try again.'
      toast.error(detail)
    },
  })

  const handleSend = () => {
    if (!input.trim() || isPending) return
    if ((usage?.messages_remaining ?? 1) <= 0) {
      toast.error('Daily AI limit reached. Limits reset at midnight.')
      return
    }
    const content = input.trim()
    setMessages([...messages, { role: 'user', content, timestamp: new Date().toISOString() }])
    setInput('')
    sendMessage(content)
  }

  const handlePrompt = (prompt) => {
    setInput(prompt)
  }

  const startNewConversation = () => {
    setActiveConversation(null)
    setMessages([])
  }

  const deleteConversation = async (id) => {
    await aiApi.deleteConversation(id)
    qc.invalidateQueries({ queryKey: ['ai', 'conversations'] })
    if (activeConversationId === id) startNewConversation()
  }

  const remaining = usage?.messages_remaining ?? 20
  const used = usage?.messages_used_today ?? 0
  const limit = usage?.messages_limit ?? 20

  return (
    <div className="flex h-[calc(100vh-60px)] md:h-screen">
      {/* Sidebar: conversation history */}
      <div className="hidden md:flex flex-col w-56 border-r border-parchment-200 dark:border-emerald-900/50 bg-parchment-50 dark:bg-emerald-950 p-3">
        <Button variant="secondary" size="sm" onClick={startNewConversation} className="mb-3 w-full">
          <Plus size={14} /> New chat
        </Button>
        <div className="flex-1 overflow-y-auto space-y-1">
          {conversations?.map((c) => (
            <div
              key={c.id}
              className={clsx(
                'group flex items-start gap-2 px-2.5 py-2 rounded-xl cursor-pointer text-left text-xs transition-all',
                activeConversationId === c.id
                  ? 'bg-emerald-800/20 dark:bg-emerald-800/30 text-emerald-900 dark:text-emerald-100'
                  : 'hover:bg-parchment-100 dark:hover:bg-emerald-900/30 text-parchment-600 dark:text-emerald-500'
              )}
              onClick={() => setActiveConversation(c.id)}
            >
              <MessageSquare size={12} className="mt-0.5 flex-shrink-0" />
              <p className="flex-1 line-clamp-2 leading-relaxed">{c.title || 'Untitled chat'}</p>
              <button
                onClick={(e) => { e.stopPropagation(); deleteConversation(c.id) }}
                className="opacity-0 group-hover:opacity-100 p-0.5 hover:text-red-500 transition-all flex-shrink-0"
              >
                <Trash2 size={11} />
              </button>
            </div>
          ))}
        </div>
        {/* Usage meter */}
        <div className="pt-3 border-t border-parchment-200 dark:border-emerald-900/50">
          <p className="text-xs text-muted mb-1">Daily messages: {used}/{limit}</p>
          <div className="h-1.5 bg-parchment-200 dark:bg-emerald-900/50 rounded-full overflow-hidden">
            <div
              className={clsx('h-full rounded-full transition-all', remaining > 5 ? 'bg-emerald-600' : 'bg-gold-500')}
              style={{ width: `${(used / limit) * 100}%` }}
            />
          </div>
          {remaining <= 5 && remaining > 0 && (
            <p className="text-xs text-gold-600 mt-1">{remaining} messages left today</p>
          )}
        </div>
      </div>

      {/* Chat area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="flex items-center gap-3 px-6 py-4 border-b border-parchment-200 dark:border-emerald-900/50 bg-white dark:bg-emerald-950">
          <div className="w-9 h-9 bg-emerald-800 rounded-xl flex items-center justify-center">
            <Sparkles size={16} className="text-gold-400" />
          </div>
          <div>
            <h1 className="font-display font-semibold text-emerald-900 dark:text-white">Deen Guide</h1>
            <p className="text-xs text-muted">Lifestyle & wellness companion • No fatwas, just guidance</p>
          </div>
          <Badge variant="gray" className="ml-auto text-xs">{remaining} msgs left</Badge>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center py-12">
              <div className="w-16 h-16 bg-emerald-800 rounded-2xl flex items-center justify-center mb-4">
                <Sparkles size={28} className="text-gold-400" />
              </div>
              <h2 className="font-display text-xl font-semibold text-emerald-900 dark:text-emerald-100 mb-2">
                Assalamu Alaikum!
              </h2>
              <p className="text-muted max-w-sm mb-6">
                I'm your Islamic lifestyle companion. I can help with habits, productivity, Quran memorisation, and wellbeing — but I'll always refer you to scholars for rulings.
              </p>
              <div className="space-y-2 w-full max-w-sm">
                {SUGGESTED_PROMPTS.map((p) => (
                  <button
                    key={p}
                    onClick={() => handlePrompt(p)}
                    className="w-full text-left px-4 py-3 rounded-xl border border-parchment-200 dark:border-emerald-800 text-sm text-emerald-800 dark:text-emerald-300 hover:bg-parchment-50 dark:hover:bg-emerald-900/30 transition-colors"
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
          )}
          {messages.map((msg, i) => <Message key={i} msg={msg} />)}
          {isPending && (
            <div className="flex gap-3">
              <div className="w-8 h-8 bg-emerald-800 rounded-xl flex items-center justify-center flex-shrink-0">
                <Sparkles size={14} className="text-gold-400" />
              </div>
              <div className="px-4 py-3 bg-white dark:bg-emerald-900/50 border border-parchment-200 dark:border-emerald-800 rounded-2xl rounded-tl-sm">
                <div className="flex gap-1">
                  {[0, 1, 2].map((i) => (
                    <div key={i} className={`w-2 h-2 bg-emerald-500 rounded-full animate-bounce`}
                      style={{ animationDelay: `${i * 0.15}s` }} />
                  ))}
                </div>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="px-6 py-4 border-t border-parchment-200 dark:border-emerald-900/50 bg-white dark:bg-emerald-950">
          <div className="flex gap-3 items-end">
            <textarea
              className="flex-1 input resize-none min-h-[44px] max-h-32 py-3"
              placeholder="Ask about your lifestyle, habits, or wellness..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() }
              }}
              rows={1}
            />
            <Button
              variant="primary"
              onClick={handleSend}
              disabled={!input.trim() || isPending || remaining <= 0}
              className="py-3 px-4"
            >
              <Send size={16} />
            </Button>
          </div>
          <p className="text-xs text-muted mt-2 text-center">
            Lifestyle guidance only — not a fatwa. For rulings, consult a qualified scholar.
          </p>
        </div>
      </div>
    </div>
  )
}
