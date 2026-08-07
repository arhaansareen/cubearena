import { useState, useCallback } from 'react'
import type { WCAEvent } from '@/types'

const WCA_API = 'https://www.worldcubeassociation.org/api/v0'

export interface WCAPerson {
  name: string
  wca_id: string
  country_iso2: string
  avatar?: { url: string; thumb_url: string }
}

export interface WCAPersonalRecord {
  single: { best: number; world_rank: number; continent_rank: number; country_rank: number } | null
  average: { best: number; world_rank: number; continent_rank: number; country_rank: number } | null
}

export interface WCAPersonResult {
  person: WCAPerson
  personal_records: Partial<Record<WCAEvent, WCAPersonalRecord>>
}

export type WCAFetchState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; data: WCAPersonResult }
  | { status: 'not_found' }
  | { status: 'error'; message: string }

export function useWCAData() {
  const [state, setState] = useState<WCAFetchState>({ status: 'idle' })

  const lookup = useCallback(async (wcaId: string) => {
    const id = wcaId.trim().toUpperCase()
    if (!id) return

    setState({ status: 'loading' })

    try {
      const res = await fetch(`${WCA_API}/persons/${encodeURIComponent(id)}`, {
        headers: { Accept: 'application/json' },
      })

      if (res.status === 404) {
        setState({ status: 'not_found' })
        return
      }

      if (!res.ok) {
        setState({
          status: 'error',
          message: `WCA API returned ${res.status} ${res.statusText}`,
        })
        return
      }

      const json = await res.json()

      // WCA API v0 wraps person data under { person, personal_records }
      if (!json.person) {
        setState({ status: 'error', message: 'Unexpected response format from WCA API' })
        return
      }

      setState({ status: 'success', data: json as WCAPersonResult })
    } catch (err) {
      const message =
        err instanceof TypeError && err.message.includes('fetch')
          ? 'Network error -- check your connection'
          : err instanceof Error
          ? err.message
          : 'Unknown error'
      setState({ status: 'error', message })
    }
  }, [])

  const reset = useCallback(() => setState({ status: 'idle' }), [])

  return { state, lookup, reset }
}
