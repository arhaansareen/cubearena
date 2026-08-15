import { useCallback, useEffect, useRef, useState } from 'react'
import type { WCAEvent } from '@/types'
import { generateScramble } from '@/lib/scramble'

export interface UseScrambleReturn {
  scramble: string
  next: () => void
}

const EVENT_ID: Record<WCAEvent, string> = {
  '333': '333', '222': '222', '444': '444', '555': '555',
  '666': '666', '777': '777', '333bf': '333bf', '333oh': '333oh',
  '333fm': '333fm', clock: 'clock', minx: 'minx', pyram: 'pyram',
  skewb: 'skewb', sq1: 'sq1', '444bf': '444bf', '555bf': '555bf',
}

async function fetchScramble(event: WCAEvent): Promise<string> {
  try {
    const { randomScrambleForEvent } = await import('cubing/scramble')
    const alg = await randomScrambleForEvent(EVENT_ID[event] ?? '333')
    return alg.toString()
  } catch {
    return generateScramble(event)
  }
}

export function useScramble(event: WCAEvent): UseScrambleReturn {
  const [scramble, setScramble] = useState<string>(() => generateScramble(event))
  const eventRef = useRef(event)
  const genRef = useRef(0)

  const generate = useCallback((ev: WCAEvent) => {
    const id = ++genRef.current
    setScramble(generateScramble(ev)) // instant placeholder
    void fetchScramble(ev).then(s => {
      if (genRef.current === id) setScramble(s)
    })
  }, [])

  useEffect(() => {
    eventRef.current = event
    generate(event)
  }, [event, generate])

  const next = useCallback(() => {
    generate(eventRef.current)
  }, [generate])

  return { scramble, next }
}
