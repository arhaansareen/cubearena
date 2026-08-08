import { useEffect, useState, useCallback, useRef } from 'react'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'
import type { Solve, Penalty, WCAEvent } from '@/types'

export interface UseSolveHistoryReturn {
  solves: Solve[]
  loading: boolean
  persistSolve: (solve: Solve) => Promise<void>
}

const noopPersist = async (_solve: Solve): Promise<void> => {}

// DB row → Solve (snake_case → camelCase)
function rowToSolve(row: Record<string, unknown>): Solve {
  return {
    id: row.id as string,
    sessionId: row.session_id as string,
    event: row.event as WCAEvent,
    time: row.time as number,
    penalty: (row.penalty ?? null) as Penalty,
    effectiveTime: row.effective_time as number,
    scramble: (row.scramble ?? '') as string,
    inspectionTime: (row.inspection_time ?? 0) as number,
    timestamp: new Date(row.created_at as string).getTime(),
    notes: (row.notes ?? null) as string | null,
    tags: (row.tags ?? []) as string[],
  }
}

// Solve → DB row (camelCase → snake_case)
function solveToRow(solve: Solve, userId: string) {
  return {
    id: solve.id,
    user_id: userId,
    session_id: solve.sessionId,
    event: solve.event,
    time: solve.time,
    penalty: solve.penalty,
    effective_time: solve.effectiveTime,
    scramble: solve.scramble,
    inspection_time: solve.inspectionTime,
    notes: solve.notes,
    tags: solve.tags,
    created_at: new Date(solve.timestamp).toISOString(),
  }
}

export function useSolveHistory(uid: string | null | undefined): UseSolveHistoryReturn {
  const [solves, setSolves] = useState<Solve[]>([])
  const [loading, setLoading] = useState(false)
  const uidRef = useRef(uid)
  uidRef.current = uid

  useEffect(() => {
    if (!uid || !isSupabaseConfigured) {
      setSolves([])
      setLoading(false)
      return
    }

    setLoading(true)

    // Initial fetch
    supabase
      .from('solves')
      .select('*')
      .eq('user_id', uid)
      .order('created_at', { ascending: false })
      .limit(200)
      .then(({ data, error }) => {
        if (error) {
          console.warn('[useSolveHistory] fetch error', error)
        } else {
          setSolves((data ?? []).map(rowToSolve))
        }
        setLoading(false)
      })

    // Real-time subscription
    const channel = supabase
      .channel(`solves:${uid}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'solves',
          filter: `user_id=eq.${uid}`,
        },
        (payload) => {
          setSolves((prev) => [rowToSolve(payload.new as Record<string, unknown>), ...prev].slice(0, 200))
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [uid])

  const persistSolve = useCallback(
    async (solve: Solve): Promise<void> => {
      if (!uid || !isSupabaseConfigured) return
      const { error } = await supabase.from('solves').upsert(solveToRow(solve, uid))
      if (error) console.warn('[useSolveHistory] persist failed', error)
    },
    [uid]
  )

  if (!uid || !isSupabaseConfigured) {
    return { solves: [], loading: false, persistSolve: noopPersist }
  }

  return { solves, loading, persistSolve }
}
