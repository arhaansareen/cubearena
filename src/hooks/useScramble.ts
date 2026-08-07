import { useCallback, useEffect, useRef, useState } from 'react'
import type { WCAEvent } from '@/types'
import { generateScramble } from '@/lib/scramble'

export interface UseScrambleReturn {
  scramble: string
  loading: boolean
  next: () => void
}

export function useScramble(event: WCAEvent): UseScrambleReturn {
  const [scramble, setScramble] = useState<string>('')
  const [loading, setLoading] = useState(true)
  // Track in-flight requests so stale responses from previous events are dropped
  const reqIdRef = useRef(0)

  const generate = useCallback(async (ev: WCAEvent) => {
    const id = ++reqIdRef.current
    setLoading(true)
    const s = await generateScramble(ev)
    if (reqIdRef.current === id) {
      setScramble(s)
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    generate(event)
  }, [event, generate])

  const next = useCallback(() => {
    generate(event)
  }, [event, generate])

  return { scramble, loading, next }
}
