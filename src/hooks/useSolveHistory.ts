import { useEffect, useState, useCallback, useRef } from 'react'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'
import type { Solve, Penalty, WCAEvent } from '@/types'

export interface UseSolveHistoryReturn {
  solves: Solve[]
  loading: boolean
  persistSolve: (solve: Solve) => Promise<void>
  deleteSolve: (id: string) => Promise<void>
}

const noopPersist = async (_solve: Solve): Promise<void> => {}
const noopDelete = async (_id: string): Promise<void> => {}

// DB row → Solve (snake_case → camelCase)
function rowToSolve(row: Record<string, unknown>): Solve {
  return {
    id: row.id as string,
    sessionId: row.session_id as string,
    event: row.event as WCAEvent,
    time: row.time_ms as number,
    penalty: (row.penalty ?? null) as Penalty,
    effectiveTime: (row.effective_time_ms ?? Infinity) as number,
    scramble: (row.scramble ?? '') as string,
    inspectionTime: (row.inspection_time_ms ?? 0) as number,
    timestamp: new Date(row.timestamp as string).getTime(),
    notes: (row.notes ?? null) as string | null,
    tags: (row.tags ?? []) as string[],
  }
}

// Solve → DB row (camelCase → snake_case)
function solveToRow(solve: Solve, userId: string) {
  return {
    id: solve.id,
    firebase_uid: userId,
    session_id: solve.sessionId,
    event: solve.event,
    time_ms: solve.time,
    penalty: solve.penalty,
    effective_time_ms: isFinite(solve.effectiveTime) ? solve.effectiveTime : null,
    scramble: solve.scramble,
    inspection_time_ms: solve.inspectionTime,
    notes: solve.notes,
    tags: solve.tags,
    timestamp: new Date(solve.timestamp).toISOString(),
  }
}

export function useSolveHistory(uid: string | null | undefined): UseSolveHistoryReturn {
  const [solves, setSolves] = useState<Solve[]>([])
  const [loading, setLoading] = useState(false)
  const uidRef = useRef(uid)
  uidRef.current = uid

  const fetchSolves = useCallback(() => {
    const currentUid = uidRef.current
    if (!currentUid || !isSupabaseConfigured) return
    supabase
      .from('solves')
      .select('*')
      .eq('firebase_uid', currentUid)
      .order('timestamp', { ascending: false })
      .limit(500)
      .then(({ data, error }) => {
        if (error) console.warn('[useSolveHistory] fetch error', error)
        else setSolves((data ?? []).map(rowToSolve))
        setLoading(false)
      })
  }, [])

  useEffect(() => {
    if (!uid || !isSupabaseConfigured) {
      setSolves([])
      setLoading(false)
      return
    }

    setLoading(true)
    fetchSolves()

    // Real-time subscription
    const channel = supabase
      .channel(`solves:${uid}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'solves',
          filter: `firebase_uid=eq.${uid}`,
        },
        (payload) => {
          setSolves((prev) => [rowToSolve(payload.new as Record<string, unknown>), ...prev].slice(0, 500))
        }
      )
      .subscribe()

    // Re-fetch when the tab regains focus so navigating session→dashboard always shows fresh data
    const onFocus = () => fetchSolves()
    window.addEventListener('focus', onFocus)
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') fetchSolves()
    })

    return () => {
      supabase.removeChannel(channel)
      window.removeEventListener('focus', onFocus)
    }
  }, [uid, fetchSolves])

  const persistSolve = useCallback(
    async (solve: Solve): Promise<void> => {
      if (!uid || !isSupabaseConfigured) return
      // Ensure a profile row exists first (no-op if already present)
      await supabase
        .from('profiles')
        .upsert({ firebase_uid: uid }, { onConflict: 'firebase_uid', ignoreDuplicates: true })
      const { error } = await supabase.from('solves').upsert(solveToRow(solve, uid))
      if (error) console.warn('[useSolveHistory] persist failed', error)
    },
    [uid]
  )

  const deleteSolve = useCallback(
    async (id: string): Promise<void> => {
      if (!uid || !isSupabaseConfigured) return
      setSolves((prev) => prev.filter((s) => s.id !== id))
      const { error } = await supabase.from('solves').delete().eq('id', id).eq('firebase_uid', uid)
      if (error) console.warn('[useSolveHistory] delete failed', error)
    },
    [uid]
  )

  if (!uid || !isSupabaseConfigured) {
    return { solves: [], loading: false, persistSolve: noopPersist, deleteSolve: noopDelete }
  }

  return { solves, loading, persistSolve, deleteSolve }
}
