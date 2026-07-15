import React from 'react'
import { Link } from '@tanstack/react-router'
import { Icon } from './icon'
import { cn } from '@/lib/utils'

export function Breadcrumbs({ items, className }) {
  if (!items || items.length === 0) return null

  return (
    <nav aria-label="Breadcrumb" className={cn("flex items-center text-sm font-medium text-muted-foreground", className)}>
      {items.map((item, index) => {
        const isLast = index === items.length - 1
        return (
          <React.Fragment key={item.to || item.label}>
            {isLast ? (
              <span className="text-foreground" aria-current="page">{item.label}</span>
            ) : (
              <Link to={item.to} className="hover:text-foreground transition-colors">
                {item.label}
              </Link>
            )}
            {!isLast && <Icon name="chevron-right" size={14} className="mx-2 flex-shrink-0" />}
          </React.Fragment>
        )
      })}
    </nav>
  )
}
