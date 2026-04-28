import React from 'react'
import { useTheme } from '@/lib/theme-context'
import { ICON_MAP } from '@/lib/icon-map.jsx'

/**
 * <Icon name="home" /> — resolves to the active theme's icon pack.
 * Falls back to lucide if the icon isn't in the active pack.
 *
 * @param {string} name - canonical icon name (e.g. "home", "clock", "book")
 * @param {string} [pack] - override icon pack for this instance
 * @param {string} [className]
 * @param {number} [size=18]
 */
export function Icon({ name, pack: packOverride, className, size = 18, ...props }) {
  let iconPack
  try {
    const ctx = useTheme()
    iconPack = packOverride || ctx.iconPack
  } catch {
    iconPack = packOverride || 'lucide'
  }

  const packMap = ICON_MAP[iconPack] || ICON_MAP.lucide
  const Cmp = packMap?.[name] ?? ICON_MAP.lucide[name]

  if (!Cmp) {
    // Last resort — render an empty span so layout isn't broken
    return <span className={className} style={{ width: size, height: size, display: 'inline-block' }} />
  }

  return <Cmp className={className} size={size} {...props} />
}
