import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { Solve, Penalty, WCAEvent } from '@/types'
import { computeAo, computeBestAo, computeMean, generateId } from '@/lib/utils'

const V2_KEY = (event: WCAEvent) => `cubearena:session-v2:${event}`
const V3_KEY = (event: WCAEvent) => `cubearena:sessions-v3:${event}`

interface SessionEntry {
  id: string
  name: string
  solves: Solve[]
  createdAt: number
}

interface PersistedV3 {
  activeId: string
  nextNum: number
  sessions: SessionEntry[]
}

interface PersistedV2 {
  sessionId: string
  solves: Solve[]
}

function migrateV2(event: WCAEvent): Solve[] | null {
  try {
    const raw = localStorage.getItem(V2_KEY(event))
    if (!raw) return null
    const parsed = JSON.parse(raw) as PersistedV2
    return parsed.solves ?? []
  } catch {
    return null
  }
}

function loadV3(event: WCAEvent): PersistedV3 {
  try {
    const raw = localStorage.getItem(V3_KEY(event))
    if (raw) return JSON.parse(raw) as PersistedV3
  } catch {}

  const v2Solves = migrateV2(event)
  const firstId = generateId()
  const firstSession: SessionEntry = {
    id: firstId,
    name: 'Session 1',
    solves: v2Solves ?? [],
    createdAt: Date.now(),
  }
  return { activeId: firstId, nextNum: 2, sessions: [firstSession] }
}

function saveV3(event: WCAEvent, data: PersistedV3) {
  try {
    localStorage.setItem(V3_KEY(event), JSON.stringify(data))
  } catch {}
}

function computeEffectiveTime(time: number, penalty: Penalty): number {
  if (penalty === 'DNF') return Infinity
  if (penalty === '+2') return time + 2000
  return time
}

export interface UseSessionReturn {
  solves: Solve[]
  ao5: number | null
  ao12: number | null
  ao50: number | null
  ao100: number | null
  bestAo5: number | null
  bestAo12: number | null
  bestAo50: number | null
  bestAo100: number | null
  mean: number | null
  sessionId: string
  sessions: Array<{ id: string; name: string; solves: Solve[]; createdAt: number }>
  activeSessionId: string
  addSolve: (solve: Solve) => void
  updatePenalty: (solveId: string, penalty: Penalty) => void
  deleteSolve: (id: string) => void
  deleteLastSolve: () => void
  clearSession: () => void
  createSession: (name?: string) => string
  switchSession: (id: string) => void
  renameSession: (id: string, name: string) => void
  deleteSession: (id: string) => void
}

export function useSession(event: WCAEvent): UseSessionReturn {
  const [store, setStore] = useState<PersistedV3>(() => loadV3(event))
  const storeRef = useRef<PersistedV3>(store)
  storeRef.current = store

  useEffect(() => {
    const loaded = loadV3(event)
    setStore(loaded)
  }, [event])

  useEffect(() => {
    saveV3(event, store)
  }, [event, store])

  const activeSolves = useMemo(() => {
    const active = store.sessions.find(s => s.id === store.activeId)
    return active?.solves ?? []
  }, [store])

  const addSolve = useCallback((solve: Solve) => {
    setStore(prev => ({
      ...prev,
      sessions: prev.sessions.map(s =>
        s.id === prev.activeId ? { ...s, solves: [...s.solves, solve] } : s
      ),
    }))
  }, [])

  const updatePenalty = useCallback((solveId: string, penalty: Penalty) => {
    setStore(prev => ({
      ...prev,
      sessions: prev.sessions.map(s =>
        s.id === prev.activeId
          ? {
              ...s,
              solves: s.solves.map(sv =>
                sv.id !== solveId
                  ? sv
                  : { ...sv, penalty, effectiveTime: computeEffectiveTime(sv.time, penalty) }
              ),
            }
          : s
      ),
    }))
  }, [])

  const deleteSolve = useCallback((id: string) => {
    setStore(prev => ({
      ...prev,
      sessions: prev.sessions.map(s =>
        s.id === prev.activeId ? { ...s, solves: s.solves.filter(sv => sv.id !== id) } : s
      ),
    }))
  }, [])

  const deleteLastSolve = useCallback(() => {
    setStore(prev => ({
      ...prev,
      sessions: prev.sessions.map(s =>
        s.id === prev.activeId ? { ...s, solves: s.solves.slice(0, -1) } : s
      ),
    }))
  }, [])

  const createSession = useCallback((name?: string): string => {
    const newId = generateId()
    setStore(prev => {
      const sessionName = name ?? `Session ${prev.nextNum}`
      const newSession: SessionEntry = {
        id: newId,
        name: sessionName,
        solves: [],
        createdAt: Date.now(),
      }
      return {
        activeId: newId,
        nextNum: prev.nextNum + 1,
        sessions: [...prev.sessions, newSession],
      }
    })
    return newId
  }, [])

  const clearSession = useCallback(() => {
    createSession()
  }, [createSession])

  const switchSession = useCallback((id: string) => {
    setStore(prev => {
      if (!prev.sessions.find(s => s.id === id)) return prev
      return { ...prev, activeId: id }
    })
  }, [])

  const renameSession = useCallback((id: string, name: string) => {
    setStore(prev => ({
      ...prev,
      sessions: prev.sessions.map(s => (s.id === id ? { ...s, name } : s)),
    }))
  }, [])

  const deleteSession = useCallback((id: string) => {
    setStore(prev => {
      if (prev.sessions.length <= 1) {
        const newId = generateId()
        const newSession: SessionEntry = {
          id: newId,
          name: `Session ${prev.nextNum}`,
          solves: [],
          createdAt: Date.now(),
        }
        return { activeId: newId, nextNum: prev.nextNum + 1, sessions: [newSession] }
      }
      const remaining = prev.sessions.filter(s => s.id !== id)
      const newActiveId = prev.activeId === id ? remaining[remaining.length - 1].id : prev.activeId
      return { ...prev, sessions: remaining, activeId: newActiveId }
    })
  }, [])

  const ao5 = useMemo(() => computeAo(activeSolves, 5), [activeSolves])
  const ao12 = useMemo(() => computeAo(activeSolves, 12), [activeSolves])
  const ao50 = useMemo(() => computeAo(activeSolves, 50), [activeSolves])
  const ao100 = useMemo(() => computeAo(activeSolves, 100), [activeSolves])
  const bestAo5 = useMemo(() => computeBestAo(activeSolves, 5), [activeSolves])
  const bestAo12 = useMemo(() => computeBestAo(activeSolves, 12), [activeSolves])
  const bestAo50 = useMemo(() => computeBestAo(activeSolves, 50), [activeSolves])
  const bestAo100 = useMemo(() => computeBestAo(activeSolves, 100), [activeSolves])
  const mean = useMemo(
    () => (activeSolves.length > 0 ? computeMean(activeSolves, activeSolves.length) : null),
    [activeSolves]
  )

  const sessionsList = useMemo(
    () => store.sessions.map(({ id, name, solves, createdAt }) => ({ id, name, solves, createdAt })),
    [store.sessions]
  )

  return {
    solves: activeSolves,
    ao5,
    ao12,
    ao50,
    ao100,
    bestAo5,
    bestAo12,
    bestAo50,
    bestAo100,
    mean,
    sessionId: store.activeId,
    sessions: sessionsList,
    activeSessionId: store.activeId,
    addSolve,
    updatePenalty,
    deleteSolve,
    deleteLastSolve,
    clearSession,
    createSession,
    switchSession,
    renameSession,
    deleteSession,
  }
}
