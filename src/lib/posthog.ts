'use client'

import posthog from 'posthog-js'

export const initPostHog = () => {
  if (typeof window !== 'undefined' && process.env.NEXT_PUBLIC_POSTHOG_KEY) {
    posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY, {
      api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://app.posthog.com',
      loaded: (posthog) => {
        if (process.env.NODE_ENV === 'development') posthog.debug()
      },
      capture_pageview: false, // We'll capture manually for more control
      persistence: 'localStorage',
    })
  }
}

export { posthog }

// Helper functions for common events
export const trackEvent = (eventName: string, properties?: Record<string, unknown>) => {
  if (typeof window !== 'undefined') {
    posthog.capture(eventName, properties)
  }
}

export const identifyUser = (userId: string, properties?: Record<string, unknown>) => {
  if (typeof window !== 'undefined') {
    posthog.identify(userId, properties)
  }
}

export const trackPageView = (pageName?: string) => {
  if (typeof window !== 'undefined') {
    posthog.capture('$pageview', { page: pageName || window.location.pathname })
  }
}
