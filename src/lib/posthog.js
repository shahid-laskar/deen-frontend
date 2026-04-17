import posthog from 'posthog-js'

const POSTHOG_KEY = import.meta.env.VITE_POSTHOG_KEY

export const initPostHog = () => {
  if (typeof window !== 'undefined' && POSTHOG_KEY && POSTHOG_KEY !== 'phc_default_placeholder_key') {
    posthog.init(POSTHOG_KEY, {
      api_host: import.meta.env.VITE_POSTHOG_HOST || 'https://app.posthog.com',
      autocapture: true,
      capture_pageview: true,
      persistence: 'localStorage',
    })
  }
}

export default posthog
