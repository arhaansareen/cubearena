import { useState, useCallback } from 'react'

const WCA_API = 'https://www.worldcubeassociation.org/api/v0'

export interface WCACompetition {
  id: string
  name: string
  city: string
  country_iso2: string
  start_date: string
  end_date: string
  event_ids: string[]
  competitor_limit: number | null
  registration_open: string | null
  registration_close: string | null
}

export type WCACompsState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; comps: WCACompetition[] }
  | { status: 'error'; message: string }

export function useWCACompetitions() {
  const [state, setState] = useState<WCACompsState>({ status: 'idle' })

  const fetchComps = useCallback(async (countryIso2?: string, query?: string) => {
    setState({ status: 'loading' })

    try {
      const today = new Date().toISOString().split('T')[0]
      const params = new URLSearchParams({
        start: today,
        per_page: '50',
        sort: 'start_date',
      })
      if (countryIso2) params.set('country_iso2', countryIso2.toUpperCase())
      if (query?.trim()) params.set('q', query.trim())

      const res = await fetch(`${WCA_API}/competitions?${params.toString()}`, {
        headers: { Accept: 'application/json' },
      })

      if (!res.ok) {
        setState({ status: 'error', message: `WCA API returned ${res.status}` })
        return
      }

      const json = await res.json()
      const comps = Array.isArray(json) ? (json as WCACompetition[]) : []
      setState({ status: 'success', comps })
    } catch (err) {
      const message =
        err instanceof TypeError && err.message.includes('fetch')
          ? 'Network error — check your connection'
          : err instanceof Error
          ? err.message
          : 'Unknown error'
      setState({ status: 'error', message })
    }
  }, [])

  return { state, fetchComps }
}
