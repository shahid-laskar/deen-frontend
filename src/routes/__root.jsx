import React, { useEffect } from 'react'
import { createRootRoute, Outlet } from '@tanstack/react-router'
import { useThemeStore } from '@/store/themeStore'
import { ThemeProvider } from '@/lib/theme-context'

// ─── Anti-flash: runs synchronously before first paint ───────────────────────
const ANTI_FLASH_SCRIPT = `
(function(){
  try {
    var t = localStorage.getItem('deen.theme') || 'madinah-dawn';
    var m = localStorage.getItem('deen.mode') || 'system';
    var icons = localStorage.getItem('deen.icons-override') || '';
    var typeset = localStorage.getItem('deen.typeset-override') || '';
    var el = document.documentElement;
    el.setAttribute('data-theme', t);
    if (icons) el.setAttribute('data-icons', icons);
    if (typeset) el.setAttribute('data-typeset', typeset);
    var isDark = m === 'dark' || (m === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    if (isDark) el.classList.add('dark');
  } catch(e) {}
})();
`.trim()

export const Route = createRootRoute({
  head: () => ({
    scripts: [{ children: ANTI_FLASH_SCRIPT }],
    links: [
      // Google Fonts — theme typography pairings
      { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
      { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossOrigin: 'anonymous' },
      {
        rel: 'stylesheet',
        href: 'https://fonts.googleapis.com/css2?family=Amiri:ital,wght@0,400;0,700;1,400&family=Amiri+Quran&family=Fraunces:ital,wght@0,400;0,600;0,700;1,400&family=Cormorant+Garamond:ital,wght@0,400;0,600;0,700;1,400&family=Manrope:wght@400;500;600;700&family=Space+Grotesk:wght@400;500;600;700&family=Plus+Jakarta+Sans:wght@400;500;600;700&family=DM+Serif+Display:ital@0;1&family=Nunito:wght@400;500;600;700&family=Inter:wght@400;500;600;700;800&display=swap',
      },
    ],
  }),
  component: RootLayout,
})

function RootLayout() {
  const { applyToDOM } = useThemeStore()

  useEffect(() => {
    applyToDOM()
  }, [])

  return (
    <ThemeProvider>
      <Outlet />
    </ThemeProvider>
  )
}
