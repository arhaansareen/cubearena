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
  // Pre-fetched WCA scramble ready to swap in instantly on next()
  const nextScrambleRef = useRef<string | null>(null)
  const prefetchingRef = useRef(false)

  const prefetchNext = useCallback((ev: WCAEvent) => {
    if (prefetchingRef.current) return
    prefetchingRef.current = true
    void fetchScramble(ev).then(s => {
      nextScrambleRef.current = s
      prefetchingRef.current = false
    })
  }, [])

  // On mount or event change: show placeholder instantly, fetch real scramble,
  // then immediately start prefetching the one after.
  useEffect(() => {
    eventRef.current = event
    nextScrambleRef.current = null
    prefetchingRef.current = false
    setScramble(generateScramble(event))
    void fetchScramble(event).then(s => {
      setScramble(s)
      prefetchNext(event)
    })
  }, [event, prefetchNext])

  const next = useCallback(() => {
    const ev = eventRef.current
    if (nextScrambleRef.current) {
      // Pre-fetched WCA scramble ready — show it instantly
      setScramble(nextScrambleRef.current)
      nextScrambleRef.current = null
      prefetchNext(ev)
    } else {
      // Nothing ready yet — show placeholder and fetch
      setScramble(generateScramble(ev))
      void fetchScramble(ev).then(s => {
        setScramble(s)
        prefetchNext(ev)
      })
    }
  }, [prefetchNext])

  return { scramble, next }
}
