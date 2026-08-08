import { useState, useEffect } from 'react'
import { supabase, isSupabaseConfigured, type LeaderboardEntry } from '@/lib/supabase'
import type { WCAEvent } from '@/types'

export interface UseLeaderboardReturn {
  entries: LeaderboardEntry[]
  loading: boolean
  userRank: number | null
}

export function useLeaderboard(
  event: WCAEvent | null,
  uid?: string | null,
  limit = 50
): UseLeaderboardReturn {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!event || !isSupabaseConfigured) return
    setLoading(true)

    supabase
      .from('leaderboard_by_event')
      .select('*')
      .eq('event', event)
      .order('pb_ms', { ascending: true })
      .limit(limit)
      .then(({ data, error }) => {
        if (error) {
          console.warn('[useLeaderboard] fetch failed', error)
        } else {
          setEntries((data as LeaderboardEntry[]) ?? [])
        }
        setLoading(false)
      })
  }, [event, limit])

  const userRank = uid
    ? entries.findIndex((e) => e.firebase_uid === uid) + 1 || null
    : null

  return { entries, loading, userRank }
}
