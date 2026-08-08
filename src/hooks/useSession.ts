import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { Solve, Penalty } from '@/types'
import { computeAo, computeMean, generateId } from '@/lib/utils'

const STORAGE_KEY = 'cubearena:session-v1'

interface PersistedSession {
  sessionId: string
  solves: Solve[]
}

function loadSession(): PersistedSession {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw) as PersistedSession
  } catch {}
  return { sessionId: generateId(), solves: [] }
}

function saveSession(data: PersistedSession) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  } catch {}
}

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
  const initial = useMemo(() => loadSession(), [])
  const sessionIdRef = useRef<string>(initial.sessionId)
  const [solves, setSolves] = useState<Solve[]>(initial.solves)

  // Persist whenever solves change
  useEffect(() => {
    saveSession({ sessionId: sessionIdRef.current, solves })
  }, [solves])

  const addSolve = useCallback((solve: Solve) => {
    setSolves((prev) => [...prev, solve])
  }, [])

  const updatePenalty = useCallback((solveId: string, penalty: Penalty) => {
    setSolves((prev) =>
      prev.map((s) => {
        if (s.id !== solveId) return s
        return { ...s, penalty, effectiveTime: computeEffectiveTime(s.time, penalty) }
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
