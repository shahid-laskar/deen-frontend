/**
 * Frontend Test Setup
 * ====================
 * Vitest + React Testing Library provider wrappers.
 * Every component test imports from here instead of @testing-library/react.
 */
import '@testing-library/jest-dom'
import { cleanup, render } from '@testing-library/react'
import { afterEach, vi } from 'vitest'
import React from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'

// Auto-cleanup after each test
afterEach(() => cleanup())

// ─── Auth mock ────────────────────────────────────────────────────────────────
export const mockUser = {
  id: 'test-user-id',
  email: 'test@example.com',
  gender: 'male',
  madhab: 'hanafi',
  timezone: 'UTC',
  latitude: 21.3891,   // Mecca
  longitude: 39.8579,
  is_active: true,
  is_verified: true,
  onboarding_completed: true,
  prayer_method: 'MWL',
  profile: {
    display_name: 'Test User',
    quran_daily_goal_minutes: 15,
    notifications_enabled: true,
    prayer_notifications: true,
  },
}

// Mock zustand auth store
vi.mock('../store/authStore', () => ({
  useAuthStore: vi.fn(() => ({
    user: mockUser,
    isAuthenticated: true,
    accessToken: 'mock-token',
    setAuth: vi.fn(),
    updateUser: vi.fn(),
    logout: vi.fn(),
    isOnboardingComplete: () => true,
    isFemale: () => false,
    getMadhab: () => 'hanafi',
    hasLocation: () => true,
  })),
}))

// Mock theme store
vi.mock('../store/themeStore', async (importOriginal) => {
  const original = await importOriginal()
  return {
    ...original,
    useThemeStore: vi.fn(() => ({
      themeId: 'medina-midnight',
      typography: { fontFamily: 'DM Sans', textScale: 'default', quranScale: 1.2, lineHeight: 'comfortable' },
      setTheme: vi.fn(),
      setTypography: vi.fn(),
      autoDarkAfterMaghrib: false,
      toggleAutoDark: vi.fn(),
      seasonalEnabled: true,
      pendingSeasonalTheme: null,
      applyToDOM: vi.fn(),
      checkSeasonalTheme: vi.fn(),
      checkAutoDark: vi.fn(),
    })),
  }
})

// ─── Mock API ─────────────────────────────────────────────────────────────────
vi.mock('../lib/api', () => ({
  default: {
    get:    vi.fn(() => Promise.resolve({ data: {} })),
    post:   vi.fn(() => Promise.resolve({ data: {} })),
    patch:  vi.fn(() => Promise.resolve({ data: {} })),
    delete: vi.fn(() => Promise.resolve({ data: {} })),
  },
}))

// ─── Test render helper ───────────────────────────────────────────────────────
/**
 * Renders a component with all required providers:
 *   - QueryClientProvider (fresh per test, no retries)
 *   - MemoryRouter (with optional initialEntries)
 *   - Toaster
 *
 * @param {React.ReactElement} ui
 * @param {{ initialEntries?: string[], routePath?: string }} options
 */
export function renderWithProviders(ui, { initialEntries = ['/'], ...options } = {}) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0, staleTime: 0 },
      mutations: { retry: false },
    },
  })

  function Wrapper({ children }) {
    return (
      <MemoryRouter initialEntries={initialEntries}>
        <QueryClientProvider client={queryClient}>
          {children}
          <Toaster />
        </QueryClientProvider>
      </MemoryRouter>
    )
  }

  return {
    ...render(ui, { wrapper: Wrapper, ...options }),
    queryClient,
  }
}

// Re-export everything from testing library for convenience
export * from '@testing-library/react'
export { renderWithProviders as render }
