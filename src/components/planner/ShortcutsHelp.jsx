import React from 'react'
import { X, Keyboard } from 'lucide-react'

const SHORTCUTS = [
  { key: 'n',         action: 'New task (focus quick add)' },
  { key: 'k / /',     action: 'Command bar' },
  { key: 'j',         action: 'Move selection down' },
  { key: 'k',         action: 'Move selection up' },
  { key: 'e',         action: 'Edit selected task' },
  { key: 'x',         action: 'Complete selected task' },
  { key: 'w',         action: 'Oracle — "what now?"' },
  { key: '1–4',       action: 'Set priority P1–P4 on selected' },
  { key: 'f',         action: 'Focus timer with selected task' },
  { key: '?',         action: 'Toggle this help' },
  { key: 'Shift+F',   action: 'Open Fajr planning ritual' },
  { key: 'Shift+I',   action: 'Open Isha muhasaba' },
  { key: 'g t',       action: 'Go to Today' },
  { key: 'g i',       action: 'Go to Inbox' },
  { key: 'g u',       action: 'Go to Upcoming' },
  { key: 'g c',       action: 'Go to Calendar' },
  { key: 'g m',       action: 'Go to Matrix' },
  { key: 'g f',       action: 'Go to Focus' },
  { key: 'g r',       action: 'Go to Review' },
]

export function ShortcutsHelp({ onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-lg rounded-3xl bg-background border border-border shadow-2xl p-6" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <Keyboard className="h-5 w-5 text-primary" />
            <h2 className="font-bold text-foreground">Keyboard Shortcuts</h2>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-muted"><X className="h-4 w-4" /></button>
        </div>

        <div className="grid grid-cols-2 gap-x-6 gap-y-2">
          {SHORTCUTS.map(({ key, action }) => (
            <div key={key} className="flex items-center gap-3">
              <kbd className="shrink-0 font-mono text-[11px] font-bold bg-muted px-2 py-0.5 rounded border border-border min-w-[48px] text-center">
                {key}
              </kbd>
              <span className="text-xs text-muted-foreground">{action}</span>
            </div>
          ))}
        </div>

        <p className="text-[10px] text-muted-foreground/50 mt-4 text-center">
          Shortcuts are disabled when focus is inside a text field
        </p>
      </div>
    </div>
  )
}
