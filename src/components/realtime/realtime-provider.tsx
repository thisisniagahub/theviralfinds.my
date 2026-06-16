/**
 * RealtimeProvider — mounts once near the app root, establishes a WebSocket
 * connection to the notification mini-service, and forwards all events into
 * the realtime store + sonner toasts.
 *
 * Renders `null` (no DOM). Children are passed through unchanged.
 *
 * Usage:
 *   <RealtimeProvider>{children}</RealtimeProvider>
 *
 * Replace DEMO_USER_ID with the real session user id once NextAuth is wired.
 */

'use client'

import { ReactNode } from 'react'
import { useRealtime } from '@/hooks/use-realtime'
import { DEMO_USER_ID } from '@/lib/realtime/constants'

export function RealtimeProvider({ children }: { children: ReactNode }) {
  // Single source of truth for the socket connection.
  // Once auth lands, swap DEMO_USER_ID with the session user id.
  useRealtime(DEMO_USER_ID)
  return <>{children}</>
}
