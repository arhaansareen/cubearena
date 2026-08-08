import { useEffect, useState, useCallback, useRef } from 'react'
import {
  collection,
  query,
  orderBy,
  limit,
  onSnapshot,
  doc,
  setDoc,
} from 'firebase/firestore'
import { db } from '@/lib/firebase'
import type { Solve } from '@/types'

export interface UseSolveHistoryReturn {
  solves: Solve[]
  loading: boolean
  persistSolve: (solve: Solve) => Promise<void>
}

const noopPersist = async (_solve: Solve): Promise<void> => {}

export function useSolveHistory(uid: string | null | undefined): UseSolveHistoryReturn {
  const [solves, setSolves] = useState<Solve[]>([])
  const [loading, setLoading] = useState(false)
  // Track the current uid to avoid stale closure issues in the listener
  const uidRef = useRef(uid)
  uidRef.current = uid

  useEffect(() => {
    // No user — clear state immediately
    if (!uid) {
      setSolves([])
      setLoading(false)
      return
    }

    setLoading(true)

    let unsubscribe: (() => void) | undefined

    try {
      const q = query(
        collection(db, 'users', uid, 'solves'),
        orderBy('timestamp', 'desc'),
        limit(200)
      )

      unsubscribe = onSnapshot(
        q,
        (snap) => {
          setSolves(snap.docs.map((d) => d.data() as Solve))
          setLoading(false)
        },
        (err) => {
          console.warn('[useSolveHistory] snapshot error', err)
          setLoading(false)
        }
      )
    } catch (err) {
      console.warn('[useSolveHistory] listener setup failed', err)
      setLoading(false)
    }

    return () => {
      unsubscribe?.()
    }
  }, [uid])

  const persistSolve = useCallback(
    async (solve: Solve): Promise<void> => {
      if (!uid) return
      try {
        await setDoc(doc(db, 'users', uid, 'solves', solve.id), solve)
      } catch (err) {
        console.warn('[useSolveHistory] persist failed', err)
      }
    },
    [uid]
  )

  if (!uid) {
    return { solves: [], loading: false, persistSolve: noopPersist }
  }

  return { solves, loading, persistSolve }
}
