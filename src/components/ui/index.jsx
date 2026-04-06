import React from 'react'
import { clsx } from 'clsx'
import { X, Loader2 } from 'lucide-react'

// ─── Button ───────────────────────────────────────────────────────────────────
export function Button({
  children, variant = 'primary', size = 'md', loading, className, ...props
}) {
  const base = 'inline-flex items-center justify-center gap-2 font-medium rounded-xl transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed'
  const variants = {
    primary: 'bg-emerald-800 hover:bg-emerald-700 text-white shadow-emerald',
    secondary: 'bg-parchment-100 dark:bg-emerald-900/30 hover:bg-parchment-200 dark:hover:bg-emerald-900/50 text-emerald-900 dark:text-emerald-100 border border-parchment-300 dark:border-emerald-800',
    gold: 'bg-gold-700 hover:bg-gold-600 text-white shadow-gold',
    ghost: 'hover:bg-parchment-100 dark:hover:bg-emerald-900/30 text-emerald-800 dark:text-emerald-300',
    danger: 'bg-red-600 hover:bg-red-500 text-white',
    outline: 'border border-emerald-700 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/30',
  }
  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-5 py-2.5 text-sm',
    lg: 'px-7 py-3.5 text-base',
  }
  return (
    <button
      className={clsx(base, variants[variant], sizes[size], className)}
      disabled={loading || props.disabled}
      {...props}
    >
      {loading && <Loader2 size={16} className="animate-spin" />}
      {children}
    </button>
  )
}

// ─── Input ────────────────────────────────────────────────────────────────────
export function Input({ label, error, hint, className, ...props }) {
  return (
    <div className="space-y-1.5">
      {label && <label className="label">{label}</label>}
      <input className={clsx('input', error && 'border-red-400 focus:ring-red-400/40', className)} {...props} />
      {error && <p className="text-xs text-red-500">{error}</p>}
      {hint && !error && <p className="text-xs text-muted">{hint}</p>}
    </div>
  )
}

// ─── Select ───────────────────────────────────────────────────────────────────
export function Select({ label, error, children, className, ...props }) {
  return (
    <div className="space-y-1.5">
      {label && <label className="label">{label}</label>}
      <select
        className={clsx(
          'input appearance-none',
          error && 'border-red-400',
          className
        )}
        {...props}
      >
        {children}
      </select>
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  )
}

// ─── Textarea ─────────────────────────────────────────────────────────────────
export function Textarea({ label, error, className, rows = 4, ...props }) {
  return (
    <div className="space-y-1.5">
      {label && <label className="label">{label}</label>}
      <textarea
        rows={rows}
        className={clsx('input resize-none', error && 'border-red-400', className)}
        {...props}
      />
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  )
}

// ─── Card ─────────────────────────────────────────────────────────────────────
export function Card({ children, className, hover, ...props }) {
  return (
    <div
      className={clsx('card p-5', hover && 'card-hover cursor-pointer', className)}
      {...props}
    >
      {children}
    </div>
  )
}

// ─── Badge ────────────────────────────────────────────────────────────────────
export function Badge({ children, variant = 'green', className }) {
  const variants = {
    green: 'badge-green',
    gold: 'badge-gold',
    red: 'badge-red',
    blue: 'badge bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300',
    gray: 'badge bg-parchment-100 dark:bg-emerald-900/20 text-parchment-600 dark:text-emerald-600',
  }
  return <span className={clsx(variants[variant], className)}>{children}</span>
}

// ─── Modal ────────────────────────────────────────────────────────────────────
export function Modal({ open, onClose, title, children, size = 'md' }) {
  if (!open) return null
  const sizes = {
    sm: 'max-w-sm',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
  }
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className={clsx(
          'w-full bg-white dark:bg-emerald-950 rounded-2xl shadow-2xl border border-parchment-200 dark:border-emerald-800 animate-fade-up',
          sizes[size]
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-parchment-200 dark:border-emerald-800">
          <h2 className="font-display text-lg font-semibold text-emerald-900 dark:text-emerald-100">{title}</h2>
          <button onClick={onClose} className="btn-ghost p-2 rounded-lg">
            <X size={18} />
          </button>
        </div>
        <div className="px-6 py-5">{children}</div>
      </div>
    </div>
  )
}

// ─── Spinner ──────────────────────────────────────────────────────────────────
export function Spinner({ size = 20, className }) {
  return <Loader2 size={size} className={clsx('animate-spin text-emerald-700', className)} />
}

// ─── Progress Ring ────────────────────────────────────────────────────────────
export function ProgressRing({ value = 0, max = 100, size = 80, strokeWidth = 6, children, color = '#0d6b3d' }) {
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const pct = Math.min(100, (value / max) * 100)
  const offset = circumference - (pct / 100) * circumference

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} className="progress-ring">
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-parchment-200 dark:text-emerald-900/50"
        />
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        {children}
      </div>
    </div>
  )
}

// ─── Empty State ──────────────────────────────────────────────────────────────
export function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      {Icon && (
        <div className="w-16 h-16 bg-emerald-50 dark:bg-emerald-900/30 rounded-2xl flex items-center justify-center mb-4">
          <Icon size={28} className="text-emerald-600 dark:text-emerald-500" />
        </div>
      )}
      <h3 className="font-display text-lg font-semibold text-emerald-900 dark:text-emerald-200 mb-2">{title}</h3>
      {description && <p className="text-muted max-w-sm">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────
export function Skeleton({ className }) {
  return <div className={clsx('skeleton', className)} />
}

// ─── Toggle ───────────────────────────────────────────────────────────────────
export function Toggle({ checked, onChange, label }) {
  return (
    <label className="flex items-center gap-3 cursor-pointer group">
      <div className="relative">
        <input type="checkbox" checked={checked} onChange={onChange} className="sr-only" />
        <div
          className={clsx(
            'w-11 h-6 rounded-full transition-colors duration-200',
            checked ? 'bg-emerald-700' : 'bg-parchment-300 dark:bg-emerald-900/50'
          )}
        />
        <div
          className={clsx(
            'absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform duration-200',
            checked && 'translate-x-5'
          )}
        />
      </div>
      {label && <span className="text-sm text-emerald-800 dark:text-emerald-200">{label}</span>}
    </label>
  )
}

// ─── Stat Card ────────────────────────────────────────────────────────────────
export function StatCard({ label, value, sub, icon: Icon, color = 'emerald' }) {
  const colors = {
    emerald: 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400',
    gold: 'bg-gold-50 dark:bg-gold-900/30 text-gold-700 dark:text-gold-400',
    blue: 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400',
  }
  return (
    <div className="card p-5 flex items-start gap-4">
      {Icon && (
        <div className={clsx('w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0', colors[color])}>
          <Icon size={20} />
        </div>
      )}
      <div>
        <p className="text-muted text-xs uppercase tracking-wide mb-0.5">{label}</p>
        <p className="font-display text-2xl font-bold text-emerald-900 dark:text-emerald-100">{value}</p>
        {sub && <p className="text-xs text-muted mt-0.5">{sub}</p>}
      </div>
    </div>
  )
}
