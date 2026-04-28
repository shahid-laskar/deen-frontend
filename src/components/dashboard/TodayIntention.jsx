import React, { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { Icon } from '@/components/ui/icon'

/**
 * Today's Intention — editable single-line niyyah for the day.
 * Per enhanced-ui spec §1.2:
 *   - Sticky, editable one-line intention
 *   - Persists per day in localStorage
 */

const STORAGE_KEY = 'deen.daily-intention'
const SUGGESTIONS = [
  'Be patient with my parents',
  'Pray all 5 prayers on time',
  'Read at least 1 page of Quran',
  'Give sadaqah today',
  'Control my anger',
  'Make extra dhikr after prayers',
  'Be grateful for every blessing',
  'Smile at everyone I meet',
  'Help someone in need',
  'Lower my gaze and guard my tongue',
]

function getTodayKey() {
  return new Date().toISOString().split('T')[0]
}

function loadIntention() {
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}')
    const today = getTodayKey()
    return stored[today] || ''
  } catch {
    return ''
  }
}

function saveIntention(text) {
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}')
    const today = getTodayKey()
    stored[today] = text
    // Keep only last 7 days
    const keys = Object.keys(stored).sort().reverse()
    const pruned = {}
    keys.slice(0, 7).forEach(k => { pruned[k] = stored[k] })
    localStorage.setItem(STORAGE_KEY, JSON.stringify(pruned))
  } catch {}
}

export function TodayIntention({ className }) {
  const [intention, setIntention] = useState('')
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState('')

  useEffect(() => {
    setIntention(loadIntention())
  }, [])

  const handleSave = () => {
    const trimmed = draft.trim()
    setIntention(trimmed)
    saveIntention(trimmed)
    setEditing(false)
  }

  const handleEdit = () => {
    setDraft(intention)
    setEditing(true)
  }

  const randomSuggestion = () => {
    const suggestion = SUGGESTIONS[Math.floor(Math.random() * SUGGESTIONS.length)]
    setDraft(suggestion)
  }

  return (
    <div className={cn(
      'rounded-2xl border border-border bg-card p-4 transition-all duration-200',
      editing && 'ring-1 ring-primary/30 border-primary/20',
      className
    )}>
      <div className="flex items-center gap-2 mb-2">
        <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-gold/15">
          <Icon name="star" size={14} className="text-gold" />
        </div>
        <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
          Today's Intention
        </span>
      </div>

      {editing ? (
        <div className="space-y-2">
          <input
            type="text"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleSave(); if (e.key === 'Escape') setEditing(false) }}
            placeholder="Set your niyyah for today..."
            maxLength={100}
            autoFocus
            className="w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground/50 border-none outline-none font-medium"
          />
          <div className="flex items-center justify-between">
            <button
              onClick={randomSuggestion}
              className="text-[10px] text-primary font-medium hover:underline"
            >
              ✨ Suggest
            </button>
            <div className="flex gap-2">
              <button
                onClick={() => setEditing(false)}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors px-2 py-1"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="text-xs font-semibold text-primary-foreground bg-primary rounded-lg px-3 py-1 hover:opacity-90 transition-opacity"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      ) : (
        <button
          onClick={handleEdit}
          className="w-full text-left group flex items-center gap-2"
        >
          {intention ? (
            <p className="text-sm font-medium text-foreground/90 italic flex-1">
              "{intention}"
            </p>
          ) : (
            <p className="text-sm text-muted-foreground/60 flex-1">
              Tap to set your niyyah for today...
            </p>
          )}
          <Icon name="edit" size={14} className="text-muted-foreground/40 group-hover:text-primary transition-colors shrink-0" />
        </button>
      )}
    </div>
  )
}
