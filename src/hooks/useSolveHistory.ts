import { useEffect, useState } from 'react'
import type { Solve } from '@/types'

export interface UseSolveHistoryReturn {
  solves: Solve[]
  loading: boolean
  persistSolve: (solve: Solve) => Promise<void>
}

export function useSolveHistory(uid: string | null | undefined): UseSolveHistoryReturn {
  const [solves, setSolves] = useState<Solve[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!uid) {
      setLoading(false)
      return
    }

    let unsubscribe: (() => void) | undefined

    async function subscribe() {
      try {
        const { db } = await import('@/lib/firebase')
        const { collection, onSnapshot, orderBy, query } = await import('firebase/firestore')
        const q = query(
          collection(db, 'users', uid as string, 'solves'),
          orderBy('timestamp', 'desc')
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
        console.warn('[useSolveHistory] setup failed', err)
        setLoading(false)
      }
    }

    subscribe()
    return () => unsubscribe?.()
  }, [uid])

  const persistSolve = async (solve: Solve): Promise<void> => {
    if (!uid) return
    try {
      const { db } = await import('@/lib/firebase')
      const { doc, setDoc } = await import('firebase/firestore')
      await setDoc(doc(db, 'users', uid, 'solves', solve.id), solve)
    } catch (err) {
      console.warn('[useSolveHistory] persist failed', err)
    }
  }

  return { solves, loading, persistSolve }
}
