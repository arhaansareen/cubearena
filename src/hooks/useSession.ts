import { useCallback, useMemo, useRef, useState } from 'react'
import type { Solve, Penalty } from '@/types'
import { computeAo, computeMean, generateId } from '@/lib/utils'

export interface UseSessionReturn {
  solves: Solve[]
  ao5: number | null
  ao12: number | null
  mean: number | null
  sessionId: string
  addSolve: (solve: Solve) => void
  updatePenalty: (solveId: string, penalty: Penalty) => void
  deleteLastSolve: () => void
  clearSession: () => void
}

function computeEffectiveTime(time: number, penalty: Penalty): number {
  if (penalty === 'DNF') return Infinity
  if (penalty === '+2') return time + 2000
  return time
}

export function useSession(): UseSessionReturn {
  const sessionIdRef = useRef<string>(generateId())
  const [solves, setSolves] = useState<Solve[]>([])

  const addSolve = useCallback((solve: Solve) => {
    setSolves((prev) => [...prev, solve])
  }, [])

  const updatePenalty = useCallback((solveId: string, penalty: Penalty) => {
    setSolves((prev) =>
      prev.map((s) => {
        if (s.id !== solveId) return s
        const effectiveTime = computeEffectiveTime(s.time, penalty)
        return { ...s, penalty, effectiveTime }
      })
    )
  }, [])

  const deleteLastSolve = useCallback(() => {
    setSolves((prev) => prev.slice(0, -1))
  }, [])

  const clearSession = useCallback(() => {
    sessionIdRef.current = generateId()
    setSolves([])
  }, [])

  const ao5 = useMemo(() => computeAo(solves, 5), [solves])
  const ao12 = useMemo(() => computeAo(solves, 12), [solves])
  const mean = useMemo(() => computeMean(solves, solves.length), [solves])

  return {
    solves,
    ao5,
    ao12,
    mean,
    sessionId: sessionIdRef.current,
    addSolve,
    updatePenalty,
    deleteLastSolve,
    clearSession,
  }
}
