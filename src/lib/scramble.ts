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
// Format: (top,bottom)/ repeated

function genSq1(): string {
  const moves: string[] = []
  const vals = [-5, -4, -3, -2, -1, 1, 2, 3, 4, 5, 6]
  for (let i = 0; i < 11; i++) {
    const top = pick(vals)
    const bot = pick(vals)
    moves.push(`(${top},${bot})`)
  }
  return moves.join('/ ') + '/'
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
