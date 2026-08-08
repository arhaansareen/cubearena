import { useCallback, useEffect, useRef, useState } from 'react'
import type { WCAEvent } from '@/types'
import { generateScramble } from '@/lib/scramble'

export interface UseScrambleReturn {
  scramble: string
  loading: boolean
  next: () => void
}

export function useScramble(event: WCAEvent): UseScrambleReturn {
  const [scramble, setScramble] = useState('')
  const [loading, setLoading] = useState(true)
  // Buffer is a pending promise — always one step ahead
  const bufferRef = useRef<Promise<string> | null>(null)
  const activeEventRef = useRef(event)

  const prefetch = useCallback((ev: WCAEvent) => {
    bufferRef.current = generateScramble(ev).catch(() => generateScramble(ev))
  }, [])

  useEffect(() => {
    activeEventRef.current = event
    bufferRef.current = null
    setLoading(true)

    let cancelled = false
    generateScramble(event).then((s) => {
      if (cancelled) return
      setScramble(s)
      setLoading(false)
      prefetch(event)
    }).catch(() => {})

    return () => { cancelled = true }
  }, [event, prefetch])

  const next = useCallback(() => {
    const buf = bufferRef.current
    bufferRef.current = null

    if (buf) {
      // Check if already resolved (fast path) or still pending (show brief loading)
      let resolved = false
      buf.then((s) => {
        resolved = true
        if (activeEventRef.current) {
          setScramble(s)
          setLoading(false)
          prefetch(activeEventRef.current)
        }
      }).catch(() => {
        // fallback — generate fresh
        generateScramble(activeEventRef.current).then((s) => {
          setScramble(s)
          setLoading(false)
          prefetch(activeEventRef.current)
        })
      })
      // Only show loading if promise doesn't resolve synchronously
      setTimeout(() => { if (!resolved) setLoading(true) }, 0)
    } else {
      setLoading(true)
      generateScramble(activeEventRef.current).then((s) => {
        setScramble(s)
        setLoading(false)
        prefetch(activeEventRef.current)
      }).catch(() => {})
    }
  }, [prefetch])

  return { scramble, loading, next }
}
