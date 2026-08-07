import type { WCAEvent } from '@/types'

export const MOVES_3x3 = ['U', 'D', 'R', 'L', 'F', 'B'] as const

type Face = (typeof MOVES_3x3)[number]
type Modifier = '' | "'" | '2'

// Opposite face pairs -- these cannot appear consecutively
const OPPOSITES: Record<Face, Face> = {
  U: 'D',
  D: 'U',
  R: 'L',
  L: 'R',
  F: 'B',
  B: 'F',
}

function randomModifier(): Modifier {
  const n = Math.floor(Math.random() * 3)
  return (['', "'", '2'] as Modifier[])[n]
}

/**
 * Generates a 20-move 3x3 scramble.
 * Rules:
 *   - No consecutive same-face moves
 *   - No opposite-face moves on consecutive steps
 *   - Each move has a random modifier (none, ', 2)
 */
function generate3x3Scramble(): string {
  const moves: string[] = []
  let lastFace: Face | null = null
  let secondLastFace: Face | null = null

  while (moves.length < 20) {
    // Build candidate list excluding illegal faces
    const candidates = MOVES_3x3.filter((face) => {
      if (face === lastFace) return false
      if (lastFace && face === OPPOSITES[lastFace]) return false
      // Prevent two opposite-face sandwiches (e.g. R L R)
      if (secondLastFace && face === secondLastFace && lastFace === OPPOSITES[secondLastFace]) {
        return false
      }
      return true
    })

    const face = candidates[Math.floor(Math.random() * candidates.length)]
    const modifier = randomModifier()
    moves.push(`${face}${modifier}`)
    secondLastFace = lastFace
    lastFace = face
  }

  return moves.join(' ')
}

// Scramble lengths and descriptions for other events (stubs for now)
const EVENT_STUBS: Partial<Record<WCAEvent, string>> = {
  '222': '2x2 scramble generation not yet implemented',
  '444': '4x4 scramble generation not yet implemented',
  '555': '5x5 scramble generation not yet implemented',
  '666': '6x6 scramble generation not yet implemented',
  '777': '7x7 scramble generation not yet implemented',
  '333bf': '3x3 BLD scramble generation not yet implemented',
  '333oh': undefined, // uses 3x3 scramble
  '333fm': undefined, // uses 3x3 scramble
  clock: 'Clock scramble generation not yet implemented',
  minx: 'Megaminx scramble generation not yet implemented',
  pyram: 'Pyraminx scramble generation not yet implemented',
  skewb: 'Skewb scramble generation not yet implemented',
  sq1: 'Square-1 scramble generation not yet implemented',
  '444bf': '4x4 BLD scramble generation not yet implemented',
  '555bf': '5x5 BLD scramble generation not yet implemented',
}

/**
 * Generates a scramble for the given WCA event.
 * 3x3, 3x3 OH, and 3x3 FM use the full 20-move 3x3 generator.
 * All other events return a placeholder string.
 */
export function generateScramble(event: WCAEvent): string {
  switch (event) {
    case '333':
    case '333oh':
    case '333fm':
      return generate3x3Scramble()
    default: {
      const stub = EVENT_STUBS[event]
      return stub ?? generate3x3Scramble()
    }
  }
}
