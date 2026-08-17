import type { WCAEvent } from '@/types'

// ─── helpers ────────────────────────────────────────────────────────────────

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

function rnd(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

// ─── NxN cube (axis-based, no two consecutive moves on same or opposite axis) ─

type NxNFace = 'U' | 'D' | 'R' | 'L' | 'F' | 'B'
const AXIS: Record<NxNFace, number> = { U: 0, D: 0, R: 1, L: 1, F: 2, B: 2 }

function nnn(faces: string[], length: number): string {
  const moves: string[] = []
  const mods = ["", "'", '2']
  let lastAxis = -1
  let secondLastAxis = -1
  let lastFace = ''

  while (moves.length < length) {
    const face = pick(faces)
    const baseFace = face.replace(/[w0-9]/g, '').replace(/^[0-9]+/, '') as NxNFace
    const axis = AXIS[baseFace] ?? -1
    if (axis === lastAxis) continue
    if (axis === secondLastAxis && lastAxis === axis) continue
    moves.push(face + pick(mods))
    secondLastAxis = lastAxis
    lastAxis = axis
    lastFace = face
  }
  // suppress unused
  void lastFace
  return moves.join(' ')
}

// ─── 3x3 (and BLD/OH/FM variants) ───────────────────────────────────────────

function gen333(length = 20): string {
  return nnn(['U', 'D', 'R', 'L', 'F', 'B'], length)
}

// ─── 2x2 ─────────────────────────────────────────────────────────────────────
// WCA: only U R F moves (fixes bottom-back-left corner)

function gen222(): string {
  return nnn(['U', 'R', 'F'], 11)
}

// ─── 4x4 ─────────────────────────────────────────────────────────────────────
// Outer + wide slice moves. Wide moves share axis with outer face.

function gen444(): string {
  const outer = ['U', 'D', 'R', 'L', 'F', 'B']
  const wide  = ['Uw', 'Dw', 'Rw', 'Lw', 'Fw', 'Bw']
  const faces = [...outer, ...wide]
  const mods = ["", "'", '2']
  const moves: string[] = []
  let lastAxis = -1
  let secondLastAxis = -1

  while (moves.length < 44) {
    const face = pick(faces)
    const baseFace = face.replace('w', '') as NxNFace
    const axis = AXIS[baseFace] ?? -1
    if (axis === lastAxis) continue
    if (axis === secondLastAxis) continue
    moves.push(face + pick(mods))
    secondLastAxis = lastAxis
    lastAxis = axis
  }
  return moves.join(' ')
}

// ─── 5x5 ─────────────────────────────────────────────────────────────────────

function gen555(): string {
  const faces = ['U', 'D', 'R', 'L', 'F', 'B', 'Uw', 'Dw', 'Rw', 'Lw', 'Fw', 'Bw']
  const mods = ["", "'", '2']
  const moves: string[] = []
  let lastAxis = -1
  let secondLastAxis = -1

  while (moves.length < 60) {
    const face = pick(faces)
    const baseFace = face.replace('w', '') as NxNFace
    const axis = AXIS[baseFace] ?? -1
    if (axis === lastAxis) continue
    if (axis === secondLastAxis) continue
    moves.push(face + pick(mods))
    secondLastAxis = lastAxis
    lastAxis = axis
  }
  return moves.join(' ')
}

// ─── 6x6 ─────────────────────────────────────────────────────────────────────

function gen666(): string {
  const faces = [
    'U', 'D', 'R', 'L', 'F', 'B',
    'Uw', 'Dw', 'Rw', 'Lw', 'Fw', 'Bw',
    '3Uw', '3Dw', '3Rw', '3Lw', '3Fw', '3Bw',
  ]
  const mods = ["", "'", '2']
  const moves: string[] = []
  let lastAxis = -1
  let secondLastAxis = -1

  while (moves.length < 80) {
    const face = pick(faces)
    const baseFace = face.replace(/[w0-9]/g, '').replace(/^3/, '') as NxNFace
    const axis = AXIS[baseFace] ?? -1
    if (axis === lastAxis) continue
    if (axis === secondLastAxis) continue
    moves.push(face + pick(mods))
    secondLastAxis = lastAxis
    lastAxis = axis
  }
  return moves.join(' ')
}

// ─── 7x7 ─────────────────────────────────────────────────────────────────────

function gen777(): string {
  const faces = [
    'U', 'D', 'R', 'L', 'F', 'B',
    'Uw', 'Dw', 'Rw', 'Lw', 'Fw', 'Bw',
    '3Uw', '3Dw', '3Rw', '3Lw', '3Fw', '3Bw',
  ]
  const mods = ["", "'", '2']
  const moves: string[] = []
  let lastAxis = -1
  let secondLastAxis = -1

  while (moves.length < 100) {
    const face = pick(faces)
    const baseFace = face.replace(/[w0-9]/g, '').replace(/^3/, '') as NxNFace
    const axis = AXIS[baseFace] ?? -1
    if (axis === lastAxis) continue
    if (axis === secondLastAxis) continue
    moves.push(face + pick(mods))
    secondLastAxis = lastAxis
    lastAxis = axis
  }
  return moves.join(' ')
}

// ─── Megaminx ─────────────────────────────────────────────────────────────────
// WCA format: alternating R and D moves with ++ (CW×2) or -- (CCW×2), 7 rows

function genMinx(): string {
  const rows: string[] = []
  for (let row = 0; row < 7; row++) {
    const moves: string[] = []
    for (let i = 0; i < 5; i++) {
      moves.push('R' + pick(['++', '--']))
      moves.push('D' + pick(['++', '--']))
    }
    rows.push(moves.join(' ') + ' ' + (row % 2 === 0 ? 'U' : "U'"))
  }
  return rows.join('\n')
}

// ─── Pyraminx ────────────────────────────────────────────────────────────────
// Main moves: U R L B (no repeats), then random tips u r l b

function genPyram(): string {
  const faces = ['U', 'R', 'L', 'B']
  const mods = ["", "'"]
  const moves: string[] = []
  let lastFace = ''

  while (moves.length < 9) {
    const face = pick(faces)
    if (face === lastFace) continue
    moves.push(face + pick(mods))
    lastFace = face
  }

  // Random tip moves (0–4 tips, each face at most once)
  const tips = ['u', 'r', 'l', 'b']
  const shuffled = tips.sort(() => Math.random() - 0.5).slice(0, rnd(0, 4))
  for (const t of shuffled) moves.push(t + pick(mods))

  return moves.join(' ')
}

// ─── Skewb ────────────────────────────────────────────────────────────────────

function genSkewb(): string {
  const faces = ['U', 'R', 'L', 'B']
  const mods = ["", "'"]
  const moves: string[] = []
  let lastFace = ''

  while (moves.length < 11) {
    const face = pick(faces)
    if (face === lastFace) continue
    moves.push(face + pick(mods))
    lastFace = face
  }
  return moves.join(' ')
}

// ─── Clock ────────────────────────────────────────────────────────────────────
// Format: <9 moves> y2 <9 moves> [pins]

function clockMove(pos: string): string {
  const turns = rnd(1, 6)
  const dir = Math.random() < 0.5 ? '+' : '-'
  return `${pos}${turns}${dir}`
}

function genClock(): string {
  const positions = ['UR', 'DR', 'DL', 'UL', 'U', 'R', 'D', 'L', 'ALL']
  const front = positions.map(clockMove).join(' ')
  const back  = positions.map(clockMove).join(' ')
  const pins  = ['UR', 'DR', 'DL', 'UL']
    .filter(() => Math.random() < 0.5)
    .join(' ')
  return front + ' y2 ' + back + (pins ? ' ' + pins : '')
}

// ─── Square-1 ────────────────────────────────────────────────────────────────
// Tracks piece boundary positions (12 units of 30° each) for top and bottom
// layers so slash moves are only generated when physically valid.
// A slash is possible only when positions 0 AND 6 are piece boundaries in
// both layers (no piece straddles the left/right cut line).

function genSq1(): string {
  // Initial solved boundaries: corners=2u, edges=1u → {0,2,3,5,6,8,9,11}
  let top = [0, 2, 3, 5, 6, 8, 9, 11]
  let bot = [0, 2, 3, 5, 6, 8, 9, 11]

  function rotate(bounds: number[], a: number): number[] {
    return bounds.map(b => ((b + a) % 12 + 12) % 12).sort((x, y) => x - y)
  }

  function slash(t: number[], b: number[]): [number[], number[]] {
    // WCA slash swaps the front half (positions 0–5) between layers
    const nt = [...b.filter(x => x < 6), ...t.filter(x => x >= 6)].sort((x, y) => x - y)
    const nb = [...t.filter(x => x < 6), ...b.filter(x => x >= 6)].sort((x, y) => x - y)
    return [nt, nb]
  }

  // Returns all rotation amounts a ∈ [-5..6] such that after rotating by a,
  // positions 0 and 6 are still piece boundaries (slash becomes valid).
  function validRotations(bounds: number[]): number[] {
    const bset = new Set(bounds)
    const out: number[] = []
    for (let a = -5; a <= 6; a++) {
      const need0 = ((-a) % 12 + 12) % 12
      const need6 = ((6 - a) % 12 + 12) % 12
      if (bset.has(need0) && bset.has(need6)) out.push(a)
    }
    return out
  }

  // Target 11–13 moves, matching TNoodle's output length range
  const targetMoves = 11 + Math.floor(Math.random() * 3)
  const moves: string[] = []
  let attempts = 0
  let lastA = NaN, lastB = NaN

  while (moves.length < targetMoves && attempts < 2000) {
    attempts++
    const vTop = validRotations(top)
    const vBot = validRotations(bot)
    if (!vTop.length || !vBot.length) continue

    const a = vTop[Math.floor(Math.random() * vTop.length)]
    const b = vBot[Math.floor(Math.random() * vBot.length)]

    // Skip (0, 0) — does nothing before the slash
    if (a === 0 && b === 0) continue
    // Skip identical consecutive move (redundant)
    if (a === lastA && b === lastB) continue

    top = rotate(top, a)
    bot = rotate(bot, b)
    moves.push(`(${a}, ${b})`)
    lastA = a; lastB = b
    ;[top, bot] = slash(top, bot)
  }

  // WCA format: "(a, b) / (c, d) / ..." — space before each slash
  return moves.map(m => m + ' /').join(' ')
}

// ─── Public API ──────────────────────────────────────────────────────────────

export function generateScramble(event: WCAEvent): string {
  switch (event) {
    case '222':   return gen222()
    case '333':   return gen333()
    case '444':   return gen444()
    case '555':   return gen555()
    case '666':   return gen666()
    case '777':   return gen777()
    case '333bf': return gen333()
    case '333oh': return gen333()
    case '333fm': return gen333()
    case 'clock': return genClock()
    case 'minx':  return genMinx()
    case 'pyram': return genPyram()
    case 'skewb': return genSkewb()
    case 'sq1':   return genSq1()
    case '444bf': return gen444()
    case '555bf': return gen555()
    default:      return gen333()
  }
}
