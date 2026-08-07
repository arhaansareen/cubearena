import { useCallback, useEffect, useState } from 'react'
import type { WCAEvent } from '@/types'
import { generateScramble } from '@/lib/scramble'

export interface UseScrambleReturn {
  scramble: string
  next: () => void
}

export function useScramble(event: WCAEvent): UseScrambleReturn {
  const [scramble, setScramble] = useState<string>(() => generateScramble(event))

  // Regenerate when event changes
  useEffect(() => {
    setScramble(generateScramble(event))
  }, [event])

  const next = useCallback(() => {
    setScramble(generateScramble(event))
  }, [event])

  return { scramble, next }
}
