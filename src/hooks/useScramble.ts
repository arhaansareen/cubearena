import { useCallback, useEffect, useRef, useState } from 'react'
import type { WCAEvent } from '@/types'
import { generateScramble } from '@/lib/scramble'

export interface UseScrambleReturn {
  scramble: string
  next: () => void
}

export function useScramble(event: WCAEvent): UseScrambleReturn {
  const [scramble, setScramble] = useState<string>(() => generateScramble(event))
  const eventRef = useRef(event)

  useEffect(() => {
    eventRef.current = event
    setScramble(generateScramble(event))
  }, [event])

  const next = useCallback(() => {
    setScramble(generateScramble(eventRef.current))
  }, [])

  return { scramble, next }
}
