// Phase 2 — UI Component Library barrel export
// All components follow the enhanced design system (OKLCH tokens, Radix primitives, cn() class merging)

export { Button, buttonVariants }      from './button'
export { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from './card'
export { Badge, badgeVariants }        from './badge'
export { Input }                       from './input'
export { Textarea }                    from './textarea'
export { Separator }                   from './separator'
export { Skeleton }                    from './skeleton'
export { Progress }                    from './progress'
export { ProgressRing }                from './progress-ring'
export { Switch }                      from './switch'
export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from './tooltip'
export { ScrollArea, ScrollBar }       from './scroll-area'
export { Tabs, TabsList, TabsTrigger, TabsContent } from './tabs'
export {
  Dialog, DialogPortal, DialogOverlay, DialogClose, DialogTrigger,
  DialogContent, DialogHeader, DialogFooter, DialogTitle, DialogDescription,
} from './dialog'

// Legacy compatibility shims — allow existing pages to compile unchanged
export { Modal, Toggle, EmptyState, StatCard, Select } from './compat'
