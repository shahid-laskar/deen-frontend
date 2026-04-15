import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * Merges Tailwind CSS classes with clsx + tailwind-merge.
 * Resolves conflicts (e.g. p-2 vs p-4 → keeps the last).
 */
export function cn(...inputs) {
  return twMerge(clsx(inputs))
}
