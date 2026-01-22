'use client'

import { useEffect } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'
import { initPostHog, trackPageView } from '@/lib/posthog'

export function Providers({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  // Initialize PostHog
  useEffect(() => {
    initPostHog()
  }, [])

  // Track page views
  useEffect(() => {
    if (pathname) {
      trackPageView(pathname)
    }
  }, [pathname, searchParams])

  return <>{children}</>
}
