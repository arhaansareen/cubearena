import { useCallback, useEffect, useRef, useState } from 'react'
import type { WCAEvent } from '@/types'
import { generateScramble } from '@/lib/scramble'

export interface UseScrambleReturn {
  scramble: string
  next: () => void
  prev: () => void
  canGoPrev: boolean
  canGoForward: boolean
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
  const initial = generateScramble(event)
  const [scramble, setScramble] = useState<string>(initial)
  const scrambleRef = useRef(initial)
  const eventRef = useRef(event)
  const nextScrambleRef = useRef<string | null>(null)
  const prefetchingRef = useRef(false)
  // pastRef: stack of scrambles we've navigated past (last = most recent)
  const pastRef = useRef<string[]>([])
  // futureRef: stack of scrambles ahead when we've gone back (last = most recent future)
  const futureRef = useRef<string[]>([])
  const [canGoPrev, setCanGoPrev] = useState(false)
  const [canGoForward, setCanGoForward] = useState(false)

  const show = useCallback((s: string) => {
    scrambleRef.current = s
    setScramble(s)
  }, [])

  const prefetchNext = useCallback((ev: WCAEvent) => {
    if (prefetchingRef.current) return
    prefetchingRef.current = true
    void fetchScramble(ev).then(s => {
      nextScrambleRef.current = s
      prefetchingRef.current = false
    })
  }, [])

  useEffect(() => {
    eventRef.current = event
    nextScrambleRef.current = null
    prefetchingRef.current = false
    pastRef.current = []
    futureRef.current = []
    setCanGoPrev(false)
    setCanGoForward(false)
    show(generateScramble(event))
    void fetchScramble(event).then(s => {
      show(s)
      prefetchNext(event)
    })
  }, [event, prefetchNext, show])

  const next = useCallback(() => {
    const ev = eventRef.current
    if (futureRef.current.length > 0) {
      pastRef.current.push(scrambleRef.current)
      const s = futureRef.current.pop()!
      show(s)
      setCanGoPrev(true)
      setCanGoForward(futureRef.current.length > 0)
    } else {
      pastRef.current.push(scrambleRef.current)
      if (pastRef.current.length > 50) pastRef.current.shift()
      setCanGoPrev(true)
      setCanGoForward(false)
      if (nextScrambleRef.current) {
        show(nextScrambleRef.current)
        nextScrambleRef.current = null
        prefetchNext(ev)
      } else {
        show(generateScramble(ev))
        void fetchScramble(ev).then(s => {
          show(s)
          prefetchNext(ev)
        })
      }
    }
  }, [prefetchNext, show])

  const prev = useCallback(() => {
    if (pastRef.current.length === 0) return
    futureRef.current.push(scrambleRef.current)
    const s = pastRef.current.pop()!
    show(s)
    setCanGoPrev(pastRef.current.length > 0)
    setCanGoForward(true)
  }, [show])

  return { scramble, next, prev, canGoPrev, canGoForward }
}
