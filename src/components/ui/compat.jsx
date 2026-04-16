// Compatibility shims for legacy page components that aren't yet redesigned.
// These provide minimal working implementations using new design tokens.

import React from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './dialog'
import { Switch } from './switch'
import { cn } from '@/lib/utils'

// ─── Modal shim (wraps Dialog) ────────────────────────────────────────────────
export function Modal({ open, onClose, title, children }) {
  return (
    <Dialog open={open} onOpenChange={v => !v && onClose?.()}>
      <DialogContent>
        {title && (
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
          </DialogHeader>
        )}
        {children}
      </DialogContent>
    </Dialog>
  )
}

// ─── Toggle shim (wraps Switch) ───────────────────────────────────────────────
export function Toggle({ checked, onChange, onCheckedChange, ...props }) {
  // Support both native onChange(e) and radix onCheckedChange(bool) patterns
  const handleChange = (val) => {
    onCheckedChange?.(val)
    onChange?.({ target: { checked: val } })
  }
  return <Switch checked={!!checked} onCheckedChange={handleChange} {...props} />
}

// ─── EmptyState shim ─────────────────────────────────────────────────────────
export function EmptyState({ icon, title, description, action, children }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center px-4 gap-3">
      {icon && <div className="text-5xl mb-1">{icon}</div>}
      {title && <p className="text-base font-semibold text-foreground">{title}</p>}
      {description && <p className="text-sm text-muted-foreground max-w-xs">{description}</p>}
      {action}
      {children}
    </div>
  )
}

// ─── StatCard shim ────────────────────────────────────────────────────────────
export function StatCard({ title, value, sub, icon: Icon, className }) {
  return (
    <div className={cn('rounded-xl border border-border bg-card p-4 text-center space-y-1', className)}>
      {Icon && <Icon className="h-5 w-5 mx-auto text-primary mb-1" />}
      <p className="text-2xl font-bold text-foreground">{value}</p>
      {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
      {title && <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{title}</p>}
    </div>
  )
}

// ─── Select shim ─────────────────────────────────────────────────────────────
export function Select({ value, onChange, options = [], placeholder, className, ...props }) {
  return (
    <select
      value={value}
      onChange={onChange}
      className={cn(
        'w-full rounded-lg border border-input bg-background px-3 py-2 text-sm shadow-sm',
        'focus:outline-none focus:ring-2 focus:ring-ring',
        'disabled:cursor-not-allowed disabled:opacity-50',
        className
      )}
      {...props}
    >
      {placeholder && <option value="">{placeholder}</option>}
      {options.map(opt => (
        <option key={opt.value ?? opt} value={opt.value ?? opt}>
          {opt.label ?? opt}
        </option>
      ))}
    </select>
  )
}
