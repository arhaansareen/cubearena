import { useEffect, useRef } from 'react'
import type { WCAEvent } from '@/types'

const EVENT_TO_PUZZLE: Record<WCAEvent, string> = {
  '333': '3x3x3',
  '222': '2x2x2',
  '444': '4x4x4',
  '555': '5x5x5',
  '666': '6x6x6',
  '777': '7x7x7',
  '333bf': '3x3x3',
  '333oh': '3x3x3',
  '333fm': '3x3x3',
  'clock': 'clock',
  'minx': 'megaminx',
  'pyram': 'pyraminx',
  'skewb': 'skewb',
  'sq1': 'square1',
  '444bf': '4x4x4',
  '555bf': '5x5x5',
}

interface ScrambleVizProps {
  scramble: string
  event: WCAEvent
  size?: number
}

export function ScrambleViz({ scramble, event, size = 100 }: ScrambleVizProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!scramble || !containerRef.current) return
    const container = containerRef.current

    let cancelled = false
    import('cubing/twisty').then(({ TwistyPlayer }) => {
      if (cancelled || !container) return
      container.innerHTML = ''
      // sq1 SVG is 360×552 → aspect ratio ~1.53; all others use 0.8
      const heightMultiplier = event === 'sq1' ? 1.53 : 0.8
      const player = new TwistyPlayer({
        puzzle: (EVENT_TO_PUZZLE[event] ?? '3x3x3') as '3x3x3',
        experimentalSetupAlg: scramble,
        alg: '',
        visualization: '2D',
        background: 'none',
        controlPanel: 'none',
        hintFacelets: 'none',
      })
      player.style.width = `${size}px`
      player.style.height = `${Math.round(size * heightMultiplier)}px`
      container.appendChild(player)
    }).catch(() => {})

    return () => { cancelled = true }
  }, [scramble, event, size])

  return (
    <div
      ref={containerRef}
      style={{ width: size, height: Math.round(size * (event === 'sq1' ? 1.53 : 0.8)), flexShrink: 0, opacity: scramble ? 1 : 0, transition: 'opacity 200ms ease' }}
    />
  )
}
