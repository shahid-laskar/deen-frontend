import { useState, useEffect } from 'react'

export function useStickyState(defaultValue, key) {
  const [value, setValue] = useState(() => {
    try {
      const stored = window.localStorage.getItem(key)
      return stored !== null ? JSON.parse(stored) : defaultValue
    } catch {
      return defaultValue
    }
  })

  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(value))
    } catch {
      // localStorage full or blocked — fail silently
    }
  }, [key, value])

  return [value, setValue]
}
