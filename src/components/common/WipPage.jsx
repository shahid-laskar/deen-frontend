import React from 'react'
import { Wrench } from 'lucide-react'
import { cn } from '@/lib/utils'

/**
 * Shared placeholder rendered by all stub routes during the redesign.
 * Phases 4-10 will replace each stub with the actual page.
 */
export function WipPage({ icon: Icon = Wrench, title, phase, description }) {
  return (
    <div className="page-container">
      <div className={cn(
        'flex flex-col items-center justify-center py-24 text-center',
        'animate-fade-up'
      )}>
        <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-5">
          <Icon className="h-8 w-8 text-primary" />
        </div>
        <h1 className="text-2xl font-semibold text-foreground tracking-tight">{title}</h1>
        {description && (
          <p className="text-sm text-muted-foreground mt-2 max-w-xs">{description}</p>
        )}
        {phase && (
          <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1">
            <div className="h-1.5 w-1.5 rounded-full bg-primary" />
            <span className="text-xs font-medium text-primary">Redesigning in {phase}</span>
          </div>
        )}
      </div>
    </div>
  )
}
