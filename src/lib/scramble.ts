import type { WCAEvent } from '@/types'

const MOVES_333 = ['U', 'D', 'R', 'L', 'F', 'B'] as const
type Face333 = (typeof MOVES_333)[number]
const OPPOSITE_333: Record<Face333, Face333> = { U: 'D', D: 'U', R: 'L', L: 'R', F: 'B', B: 'F' }

function gen333(length = 20): string {
  const moves: string[] = []
  let last: Face333 | null = null
  let secondLast: Face333 | null = null
  while (moves.length < length) {
    const cands = MOVES_333.filter((f) => {
      if (f === last) return false
      if (last && f === OPPOSITE_333[last]) return false
      if (secondLast && f === secondLast && last === OPPOSITE_333[secondLast]) return false
      return true
    })
    const face = cands[Math.floor(Math.random() * cands.length)]
    moves.push(`${face}${["", "'", '2'][Math.floor(Math.random() * 3)]}`)
    secondLast = last; last = face
  }
  return moves.join(' ')
}

function fallbackScramble(event: WCAEvent): string {
  switch (event) {
    case '222': return gen333(11)
    case '444': return gen333(40)
    case '555': return gen333(60)
    case '666': return gen333(80)
    case '777': return gen333(100)
    case '333bf': case '333oh': case '333fm': return gen333(20)
    default: return gen333(20)
  }
}

async function cubingScramble(event: WCAEvent): Promise<string> {
  const { randomScrambleForEvent } = await import('cubing/scramble')
  const alg = await randomScrambleForEvent(event)
  return alg.toString()
}

export async function generateScramble(event: WCAEvent): Promise<string> {
  try {
    const timeout = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('timeout')), 4000)
    )
    return await Promise.race([cubingScramble(event), timeout])
  } catch {
    return fallbackScramble(event)
  }
}
