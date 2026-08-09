import { useState, useCallback } from 'react'
import type { WCAEvent } from '@/types'
import type { WCAPersonalRecord } from '@/hooks/useWCAData'

const WCA_API = 'https://www.worldcubeassociation.org/api/v0'

export interface WCIFPerson {
  name: string
  wcaId: string | null
  registration: {
    eventIds: string[]
    status: string
  } | null
}

export interface WCIFEvent {
  id: string
  rounds: unknown[]
}

export interface WCIF {
  id: string
  name: string
  events: WCIFEvent[]
  persons: WCIFPerson[]
}

export interface CompetitorWithPB {
  name: string
  wcaId: string
  countryIso2: string | null
  pb: number | null    // best single in ms for the event
  pbAvg: number | null // best average in ms for the event
}

export type WCIFState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; wcif: WCIF }
  | { status: 'error'; message: string }

export type PBFetchState =
  | { status: 'idle' }
  | { status: 'loading'; fetched: number; total: number }
  | { status: 'success'; competitors: CompetitorWithPB[] }
  | { status: 'error'; message: string }

export function useCompetitionWCIF() {
  const [wcifState, setWcifState] = useState<WCIFState>({ status: 'idle' })
  const [pbState, setPbState] = useState<PBFetchState>({ status: 'idle' })

  const fetchWCIF = useCallback(async (compId: string) => {
    setWcifState({ status: 'loading' })
    setPbState({ status: 'idle' })

    try {
      const res = await fetch(`${WCA_API}/competitions/${encodeURIComponent(compId)}/wcif/public`, {
        headers: { Accept: 'application/json' },
      })

      if (!res.ok) {
        setWcifState({ status: 'error', message: `WCIF fetch failed: ${res.status}` })
        return
      }

      const json = await res.json()
      setWcifState({ status: 'success', wcif: json as WCIF })
    } catch (err) {
      const message =
        err instanceof TypeError && err.message.includes('fetch')
          ? 'Network error — check your connection'
          : err instanceof Error
          ? err.message
          : 'Unknown error'
      setWcifState({ status: 'error', message })
    }
  }, [])

  /** Returns persons registered (accepted) for an event, up to maxCount by lowest PB.
   *  Must be called after wcifState.status === 'success'. */
  function getCompetitorsForEvent(wcif: WCIF, eventId: string): WCIFPerson[] {
    return wcif.persons.filter(
      (p) =>
        p.registration?.status === 'accepted' &&
        p.registration.eventIds.includes(eventId) &&
        p.wcaId !== null,
    )
  }

  /** Fetches PBs for a list of persons (sequentially, 50ms delay, max 12). */
  const fetchCompetitorPBs = useCallback(
    async (persons: WCIFPerson[], eventId: string) => {
      const eligible = persons
        .filter((p) => p.wcaId !== null)
        .slice(0, 12)

      setPbState({ status: 'loading', fetched: 0, total: eligible.length })

      const results: CompetitorWithPB[] = []

      for (let i = 0; i < eligible.length; i++) {
        const person = eligible[i]
        const wcaId = person.wcaId!

        try {
          const res = await fetch(`${WCA_API}/persons/${encodeURIComponent(wcaId)}`, {
            headers: { Accept: 'application/json' },
          })

          if (res.ok) {
            const json = await res.json()
            const records: Partial<Record<WCAEvent, WCAPersonalRecord>> =
              json.personal_records ?? {}
            const eventRecord = records[eventId as WCAEvent]
            const pb = eventRecord?.single?.best ?? null
            const pbAvg = eventRecord?.average?.best ?? null
            const countryIso2: string | null = json.person?.country_iso2 ?? null

            results.push({
              name: person.name,
              wcaId,
              countryIso2,
              pb: pb !== null ? pb * 10 : null,   // WCA stores cs → convert to ms
              pbAvg: pbAvg !== null ? pbAvg * 10 : null,
            })
          } else {
            // Person not found or error — include without PB
            results.push({
              name: person.name,
              wcaId,
              countryIso2: null,
              pb: null,
              pbAvg: null,
            })
          }
        } catch {
          results.push({
            name: person.name,
            wcaId,
            countryIso2: null,
            pb: null,
            pbAvg: null,
          })
        }

        setPbState({ status: 'loading', fetched: i + 1, total: eligible.length })

        // Rate-limit: 50ms between requests
        if (i < eligible.length - 1) {
          await new Promise((r) => setTimeout(r, 50))
        }
      }

      // Sort: competitors with PBs first (ascending), then no-PB
      results.sort((a, b) => {
        if (a.pb !== null && b.pb !== null) return a.pb - b.pb
        if (a.pb !== null) return -1
        if (b.pb !== null) return 1
        return 0
      })

      setPbState({ status: 'success', competitors: results })
    },
    [],
  )

  const reset = useCallback(() => {
    setWcifState({ status: 'idle' })
    setPbState({ status: 'idle' })
  }, [])

  return { wcifState, pbState, fetchWCIF, getCompetitorsForEvent, fetchCompetitorPBs, reset }
}
