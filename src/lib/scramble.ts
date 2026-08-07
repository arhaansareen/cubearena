import type { WCAEvent } from '@/types'

// Fallback 3x3 generator used if cubing fails to load
const MOVES = ['U', 'D', 'R', 'L', 'F', 'B'] as const
type Face = (typeof MOVES)[number]
const OPPOSITE: Record<Face, Face> = { U: 'D', D: 'U', R: 'L', L: 'R', F: 'B', B: 'F' }

function fallbackScramble(): string {
  const moves: string[] = []
  let last: Face | null = null
  let secondLast: Face | null = null
  while (moves.length < 20) {
    const candidates = MOVES.filter((f) => {
      if (f === last) return false
      if (last && f === OPPOSITE[last]) return false
      if (secondLast && f === secondLast && last === OPPOSITE[secondLast]) return false
      return true
    })
    const face = candidates[Math.floor(Math.random() * candidates.length)]
    const mod = ["", "'", '2'][Math.floor(Math.random() * 3)]
    moves.push(`${face}${mod}`)
    secondLast = last
    last = face
  }
  return moves.join(' ')
}

export async function generateScramble(event: WCAEvent): Promise<string> {
  try {
    const { randomScrambleForEvent } = await import('cubing/scramble')
    const alg = await randomScrambleForEvent(event)
    return alg.toString()
  } catch (err) {
    console.warn('[scramble] cubing failed, using fallback', err)
    return fallbackScramble()
  }
}
