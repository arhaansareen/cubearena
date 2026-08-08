import { useEffect, useRef } from 'react'
import type { PlannedSession, WCAEvent } from '@/types'

const EVENT_LABELS: Record<WCAEvent, string> = {
  '333': '3×3', '222': '2×2', '444': '4×4', '555': '5×5',
  '666': '6×6', '777': '7×7', '333bf': '3×3 BLD', '333oh': '3×3 OH',
  '333fm': 'FMC', clock: 'Clock', minx: 'Megaminx', pyram: 'Pyraminx',
  skewb: 'Skewb', sq1: 'Square-1', '444bf': '4×4 BLD', '555bf': '5×5 BLD',
}

const TEN_MINUTES_MS = 10 * 60 * 1000

export function useReminders(plans: PlannedSession[]): void {
  const notifiedIds = useRef<Set<string>>(new Set())

  // Request permission on mount if not already determined
  useEffect(() => {
    if (typeof Notification !== 'undefined' && Notification.permission === 'default') {
      Notification.requestPermission().catch(() => {
        // ignore — user dismissed or browser blocked
      })
    }
  }, [])

  // Check upcoming plans every 60 seconds
  useEffect(() => {
    function check() {
      if (typeof Notification === 'undefined') return
      if (Notification.permission !== 'granted') return

      const now = Date.now()
      for (const plan of plans) {
        if (notifiedIds.current.has(plan.id)) continue
        if (plan.completedAt !== null) continue

        const msUntil = plan.scheduledAt - now
        if (msUntil > 0 && msUntil <= TEN_MINUTES_MS) {
          const time = new Date(plan.scheduledAt).toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
          })
          const eventLabel = EVENT_LABELS[plan.event]
          const body = `${eventLabel} practice at ${time} (${plan.durationMins} min)`

          try {
            new Notification('CubeArena — Session starting soon', {
              body,
              icon: '/favicon.ico',
            })
          } catch {
            // Notification constructor can throw in some environments
          }

          notifiedIds.current.add(plan.id)
        }
      }
    }

    check() // run immediately on mount / plans change
    const id = setInterval(check, 60_000)
    return () => clearInterval(id)
  }, [plans])
}
