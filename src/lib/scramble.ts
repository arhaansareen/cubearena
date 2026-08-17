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

// ─── Square-1 (cstimer two-phase IDA* port) ──────────────────────────────────

let _sq1Ready = false
const _shapeIdx: number[] = []
const _shapePrun    = new Int8Array(7536)
const _shapeTopMv   = new Int32Array(7356)
const _shapeBotMv   = new Int32Array(7356)
const _shapeTwistMv = new Int32Array(7356)
const _sqPrun       = new Int8Array(80640)
const _sqTwistMv    = new Int32Array(40320)
const _sqTopMv      = new Int32Array(40320)
const _sqBotMv      = new Int32Array(40320)

function _bc(x: number): number {
  x -= (x >> 1) & 0x55555555
  x = ((x >> 2) & 0x33333333) + (x & 0x33333333)
  x = ((x >> 4) + x) & 0x0f0f0f0f
  return (x + (x >> 8) + (x >> 16)) & 63
}

function _bs(arr: number[], key: number): number {
  let lo = 0, hi = arr.length - 1
  while (lo <= hi) {
    const mid = (lo + hi) >> 1
    if (arr[mid] < key) lo = mid + 1
    else if (arr[mid] > key) hi = mid - 1
    else return mid
  }
  return -1
}

function _setNP(arr: number[], idx: number, n: number): void {
  arr[n - 1] = 0
  let d = 1
  for (let a = n - 2; a >= 0; a--) {
    d++
    const p = idx % d
    idx = (idx / d) | 0
    arr[a] = p
    for (let b = a + 1; b < n; b++) if (arr[b] >= p) arr[b]++
  }
}

function _getNP(arr: number[], n: number): number {
  let idx = 0
  for (let a = 0; a < n; a++) {
    idx *= n - a
    for (let b = a + 1; b < n; b++) if (arr[b] < arr[a]) idx++
  }
  return idx
}

function _circ(arr: number[], ...ii: number[]): typeof _circ {
  const tmp = arr[ii[0]]
  for (let i = 0; i < ii.length - 1; i++) arr[ii[i]] = arr[ii[i + 1]]
  arr[ii[ii.length - 1]] = tmp
  return _circ
}

// SqCubie: 24 nibble-packed slots across 4 × 24-bit integers
class _SqC {
  ul = 0x011233; ur = 0x455677; dl = 0x998bba; dr = 0xddcffe; ml = 0
  at(i: number): number {
    const r = i < 6  ? this.ul >> ((5  - i) << 2)
            : i < 12 ? this.ur >> ((11 - i) << 2)
            : i < 18 ? this.dl >> ((17 - i) << 2)
            :           this.dr >> ((23 - i) << 2)
    return r & 0xf
  }
  set(i: number, v: number): void {
    const sh = i < 6  ? (5  - i) << 2
             : i < 12 ? (11 - i) << 2
             : i < 18 ? (17 - i) << 2
             :           (23 - i) << 2
    if      (i < 6)  { this.ul = (this.ul & ~(0xf << sh)) | (v << sh) }
    else if (i < 12) { this.ur = (this.ur & ~(0xf << sh)) | (v << sh) }
    else if (i < 18) { this.dl = (this.dl & ~(0xf << sh)) | (v << sh) }
    else             { this.dr = (this.dr & ~(0xf << sh)) | (v << sh) }
  }
  cp(c: _SqC): void { this.ul=c.ul; this.ur=c.ur; this.dl=c.dl; this.dr=c.dr; this.ml=c.ml }
  mv(move: number): void {
    let t: number
    move <<= 2
    if (move > 24) {
      move = 48 - move
      t = this.ul
      this.ul = ((this.ul >> move) | (this.ur << (24 - move))) & 0xffffff
      this.ur = ((this.ur >> move) | (t    << (24 - move))) & 0xffffff
    } else if (move > 0) {
      t = this.ul
      this.ul = ((this.ul << move) | (this.ur >> (24 - move))) & 0xffffff
      this.ur = ((this.ur << move) | (t    >> (24 - move))) & 0xffffff
    } else if (move === 0) {
      t = this.ur; this.ur = this.dl; this.dl = t; this.ml = 1 - this.ml
    } else if (move >= -24) {
      move = -move
      t = this.dl
      this.dl = ((this.dl << move) | (this.dr >> (24 - move))) & 0xffffff
      this.dr = ((this.dr << move) | (t    >> (24 - move))) & 0xffffff
    } else {
      move = 48 + move
      t = this.dl
      this.dl = ((this.dl >> move) | (this.dr << (24 - move))) & 0xffffff
      this.dr = ((this.dr >> move) | (t    << (24 - move))) & 0xffffff
    }
  }
}

interface _Sh { top: number; bot: number; par: number }

function _shSet(s: _Sh, idx: number): void {
  s.par = idx & 1
  const v = _shapeIdx[idx >> 1]
  s.bot = v & 0xfff
  s.top = v >> 12
}

function _shGet(s: _Sh): number {
  return _bs(_shapeIdx, (s.top << 12) | s.bot) * 2 | s.par
}

function _shTop(s: _Sh): number {
  let mv = 0, mp = 0
  do {
    if ((s.top & 2048) === 0) { mv++; s.top = s.top << 1 }
    else { mv += 2; s.top = s.top << 2 ^ 12291 }
    mp = 1 - mp
  } while ((_bc(s.top & 63) & 1) !== 0)
  if ((_bc(s.top) & 2) === 0) s.par ^= mp
  return mv
}

function _shBot(s: _Sh): number {
  let mv = 0, mp = 0
  do {
    if ((s.bot & 2048) === 0) { mv++; s.bot = s.bot << 1 }
    else { mv += 2; s.bot = s.bot << 2 ^ 12291 }
    mp = 1 - mp
  } while ((_bc(s.bot & 63) & 1) !== 0)
  if ((_bc(s.bot) & 2) === 0) s.par ^= mp
  return mv
}

function _par(obj: _SqC): number {
  const arr: number[] = [obj.at(0)]
  let cnt = 0
  for (let i = 1; i < 24; i++) if (obj.at(i) !== arr[cnt]) arr[++cnt] = obj.at(i)
  let p = 0
  for (let a = 0; a < 16; a++) for (let b = a + 1; b < 16; b++) if (arr[a] > arr[b]) p ^= 1
  return p
}

function _shIdx(obj: _SqC): number {
  let u = obj.ur & 0x111111; u |= u >> 3; u |= u >> 6; u = (u & 15) | ((u >> 12) & 48)
  let ul = obj.ul & 0x111111; ul |= ul >> 3; ul |= ul >> 6; ul = (ul & 15) | ((ul >> 12) & 48)
  let r = obj.dr & 0x111111; r |= r >> 3; r |= r >> 6; r = (r & 15) | ((r >> 12) & 48)
  let dl = obj.dl & 0x111111; dl |= dl >> 3; dl |= dl >> 6; dl = (dl & 15) | ((dl >> 12) & 48)
  const shp = (_par(obj) << 24) | (ul << 18) | (u << 12) | (dl << 6) | r
  return _bs(_shapeIdx, shp & 0xffffff) * 2 | (shp >> 24)
}

interface _Sq { corn: number; edge: number; tef: boolean; bef: boolean; ml: number }

function _getSq(obj: _SqC): _Sq {
  const p = new Array<number>(8)
  for (let a = 0; a < 8; a++) p[a] = obj.at(a * 3 + 1) >> 1
  const corn = _getNP(p, 8)
  const tef = obj.at(0) === obj.at(1)
  let a = tef ? 2 : 0
  for (let b = 0; b < 4; a += 3, b++) p[b] = obj.at(a) >> 1
  const bef = obj.at(12) === obj.at(13)
  a = bef ? 14 : 12
  for (let b = 4; b < 8; a += 3, b++) p[b] = obj.at(a) >> 1
  return { corn, edge: _getNP(p, 8), tef, bef, ml: obj.ml }
}

function _randCube(): _SqC {
  const f = new _SqC()
  const shape = _shapeIdx[Math.floor(Math.random() * 3678)]
  let corner = (0x01234567 << 1) | 0x11111111
  let edge   = 0x01234567 << 1
  let nc = 8, ne = 8
  for (let i = 0; i < 24; i++) {
    if (((shape >> i) & 1) === 0) {
      const rnd = Math.floor(Math.random() * ne) << 2
      f.set(23 - i, (edge >> rnd) & 0xf)
      const m = (1 << rnd) - 1
      edge = (edge & m) + ((edge >> 4) & ~m)
      ne--
    } else {
      const rnd = Math.floor(Math.random() * nc) << 2
      f.set(23 - i, (corner >> rnd) & 0xf)
      f.set(22 - i, (corner >> rnd) & 0xf)
      const m = (1 << rnd) - 1
      corner = (corner & m) + ((corner >> 4) & ~m)
      nc--; i++
    }
  }
  f.ml = Math.floor(Math.random() * 2)
  return f
}

function _sq1Init(): void {
  if (_sq1Ready) return

  // Build _shapeIdx (3678 entries of 24-bit shape values)
  const hl = [0, 3, 6, 12, 15, 24, 27, 30, 48, 51, 54, 60, 63]
  let cnt = 0
  for (let i = 0; i < 28561; i++) {
    const dr = hl[i % 13]
    const dl = hl[Math.floor(i / 13) % 13]
    const ur = hl[Math.floor(Math.floor(i / 13) / 13) % 13]
    const ul = hl[Math.floor(Math.floor(Math.floor(i / 13) / 13) / 13)]
    const v = (ul << 18) | (ur << 12) | (dl << 6) | dr
    if (_bc(v) === 16) _shapeIdx[cnt++] = v
  }

  // Shape move tables
  const s: _Sh = { top: 0, bot: 0, par: 0 }
  for (let i = 0; i < 7356; i++) {
    _shSet(s, i)
    const mv = _shTop(s)
    _shapeTopMv[i] = mv | (_shGet(s) << 4)

    _shSet(s, i)
    const mv2 = _shBot(s)
    _shapeBotMv[i] = mv2 | (_shGet(s) << 4)

    _shSet(s, i)
    const temp = s.top & 63
    const p1 = _bc(temp)
    const p3 = _bc(s.bot & 4032)
    s.par ^= 1 & ((p1 & p3) >> 1)
    s.top = (s.top & 4032) | ((s.bot >> 6) & 63)
    s.bot = (s.bot & 63) | (temp << 6)
    _shapeTwistMv[i] = _shGet(s)
  }

  // Shape pruning BFS
  _shapePrun.fill(-1)
  const sq0 = [14378715, 31157686, 23967451, 7191990]
  for (const v of sq0) {
    const idx = _bs(_shapeIdx, v & 0xffffff) * 2 | (v >> 24)
    _shapePrun[idx] = 0
  }
  let done = 4, done0 = 0, depth = -1
  while (done !== done0) {
    done0 = done; depth++
    for (let i = 0; i < 7536; i++) {
      if (_shapePrun[i] !== depth) continue
      let m = 0, idx = i
      do {
        idx = _shapeTopMv[idx]; m += idx & 15; idx >>= 4
        if (_shapePrun[idx] === -1) { _shapePrun[idx] = depth + 1; done++ }
      } while (m !== 12)
      m = 0; idx = i
      do {
        idx = _shapeBotMv[idx]; m += idx & 15; idx >>= 4
        if (_shapePrun[idx] === -1) { _shapePrun[idx] = depth + 1; done++ }
      } while (m !== 12)
      const tw = _shapeTwistMv[i]
      if (_shapePrun[tw] === -1) { _shapePrun[tw] = depth + 1; done++ }
    }
  }

  // Square move tables
  const p = new Array<number>(8)
  for (let i = 0; i < 40320; i++) {
    _setNP(p, i, 8)
    _circ(p, 2, 4)(p, 3, 5)
    _sqTwistMv[i] = _getNP(p, 8)

    _setNP(p, i, 8)
    _circ(p, 0, 3, 2, 1)
    _sqTopMv[i] = _getNP(p, 8)

    _setNP(p, i, 8)
    _circ(p, 4, 7, 6, 5)
    _sqBotMv[i] = _getNP(p, 8)
  }

  // Square pruning BFS
  _sqPrun.fill(-1)
  _sqPrun[0] = 0
  done = 1; depth = 0
  while (done < 80640) {
    const inv = depth >= 11
    const find  = inv ? -1 : depth
    const check = inv ? depth : -1
    depth++
    outer: for (let i = 0; i < 80640; i++) {
      if (_sqPrun[i] !== find) continue
      const idx = i >> 1, ml = i & 1
      let idxx = (_sqTwistMv[idx] << 1) | (1 - ml)
      if (_sqPrun[idxx] === check) {
        done++; _sqPrun[inv ? i : idxx] = depth
        if (inv) continue outer
      }
      idxx = idx
      for (let m = 0; m < 4; m++) {
        idxx = _sqTopMv[idxx]
        const ii = (idxx << 1) | ml
        if (_sqPrun[ii] === check) {
          done++; _sqPrun[inv ? i : ii] = depth
          if (inv) continue outer
        }
      }
      idxx = idx
      for (let m = 0; m < 4; m++) {
        idxx = _sqBotMv[idxx]
        const ii = (idxx << 1) | ml
        if (_sqPrun[ii] === check) {
          done++; _sqPrun[inv ? i : ii] = depth
          if (inv) continue outer
        }
      }
    }
  }

  _sq1Ready = true
}

// IDA* search state
interface _SS {
  c: _SqC; d: _SqC
  move: number[]; len1: number; maxLen2: number
  sol: string
}

function _mv2str(ss: _SS, len: number): string {
  let s = '', top = 0, bot = 0
  for (let i = len - 1; i >= 0; i--) {
    const val = ss.move[i]
    if (val > 0) {
      const v = 12 - val
      top = v > 6 ? v - 12 : v
    } else if (val < 0) {
      const v = 12 + val
      bot = v > 6 ? v - 12 : v
    } else {
      const slash = i === ss.len1 - 1 ? '`/`' : '/'
      s += top === 0 && bot === 0 ? slash : ` (${top},${bot})${slash}`
      top = bot = 0
    }
  }
  if (top !== 0 || bot !== 0) s += ` (${top},${bot}) `
  return s.trim()
}

function _ph2(ss: _SS, edge: number, corn: number, tef: boolean, bef: boolean, ml: number, maxl: number, depth: number, lm: number): boolean {
  if (maxl === 0 && !tef && bef) return true
  if (lm !== 0 && tef === bef) {
    const ex = _sqTwistMv[edge], cx = _sqTwistMv[corn]
    if (_sqPrun[(ex << 1) | (1 - ml)] < maxl && _sqPrun[(cx << 1) | (1 - ml)] < maxl) {
      ss.move[depth] = 0
      if (_ph2(ss, ex, cx, tef, bef, 1 - ml, maxl - 1, depth + 1, 0)) return true
    }
  }
  if (lm <= 0) {
    let tefx = !tef
    let ex = tefx ? _sqTopMv[edge] : edge
    let cx = tefx ? corn : _sqTopMv[corn]
    let m = tefx ? 1 : 2
    let p1 = _sqPrun[(ex << 1) | ml], p2 = _sqPrun[(cx << 1) | ml]
    while (m < 12 && p1 <= maxl && p2 <= maxl) {
      if (p1 < maxl && p2 < maxl) {
        ss.move[depth] = m
        if (_ph2(ss, ex, cx, tefx, bef, ml, maxl - 1, depth + 1, 1)) return true
      }
      tefx = !tefx
      if (tefx) { ex = _sqTopMv[ex]; p1 = _sqPrun[(ex << 1) | ml]; m++ }
      else       { cx = _sqTopMv[cx]; p2 = _sqPrun[(cx << 1) | ml]; m += 2 }
    }
  }
  if (lm <= 1) {
    let befx = !bef
    let ex = befx ? _sqBotMv[edge] : edge
    let cx = befx ? corn : _sqBotMv[corn]
    let m = befx ? 1 : 2
    let p1 = _sqPrun[(ex << 1) | ml], p2 = _sqPrun[(cx << 1) | ml]
    while (m < (maxl > 6 ? 6 : 12) && p1 <= maxl && p2 <= maxl) {
      if (p1 < maxl && p2 < maxl) {
        ss.move[depth] = -m
        if (_ph2(ss, ex, cx, tef, befx, ml, maxl - 1, depth + 1, 2)) return true
      }
      befx = !befx
      if (befx) { ex = _sqBotMv[ex]; p1 = _sqPrun[(ex << 1) | ml]; m++ }
      else       { cx = _sqBotMv[cx]; p2 = _sqPrun[(cx << 1) | ml]; m += 2 }
    }
  }
  return false
}

function _initPh2(ss: _SS): boolean {
  ss.d.cp(ss.c)
  for (let i = 0; i < ss.len1; i++) ss.d.mv(ss.move[i])
  const sq = _getSq(ss.d)
  const prun = Math.max(_sqPrun[(sq.edge << 1) | sq.ml], _sqPrun[(sq.corn << 1) | sq.ml])
  for (let i = prun; i < ss.maxLen2; i++) {
    if (_ph2(ss, sq.edge, sq.corn, sq.tef, sq.bef, sq.ml, i, ss.len1, 0)) {
      for (let j = 0; j < i; j++) ss.d.mv(ss.move[ss.len1 + j])
      ss.sol = _mv2str(ss, i + ss.len1)
      return true
    }
  }
  return false
}

function _ph1(ss: _SS, shape: number, prun: number, maxl: number, depth: number, lm: number): boolean {
  if (prun === 0 && maxl < 4) return maxl === 0 && _initPh2(ss)
  if (lm !== 0) {
    const sx = _shapeTwistMv[shape], px = _shapePrun[sx]
    if (px < maxl) { ss.move[depth] = 0; if (_ph1(ss, sx, px, maxl - 1, depth + 1, 0)) return true }
  }
  if (lm <= 0) {
    let m = 0, sx = shape
    while (true) {
      sx = _shapeTopMv[sx]; m += sx & 15; sx >>= 4
      if (m >= 12) break
      const px = _shapePrun[sx]
      if (px > maxl) break
      if (px < maxl) { ss.move[depth] = m; if (_ph1(ss, sx, px, maxl - 1, depth + 1, 1)) return true }
    }
  }
  if (lm <= 1) {
    let m = 0, sx = shape
    while (true) {
      sx = _shapeBotMv[sx]; m += sx & 15; sx >>= 4
      if (m >= 6) break
      const px = _shapePrun[sx]
      if (px > maxl) break
      if (px < maxl) { ss.move[depth] = -m; if (_ph1(ss, sx, px, maxl - 1, depth + 1, 2)) return true }
    }
  }
  return false
}

function genSq1(): string {
  _sq1Init()
  const cube = _randCube()
  const shape = _shIdx(cube)
  const ss: _SS = { c: cube, d: new _SqC(), move: [], len1: 0, maxLen2: 0, sol: '' }
  for (ss.len1 = _shapePrun[shape]; ss.len1 < 100; ss.len1++) {
    ss.maxLen2 = Math.min(32 - ss.len1, 17)
    if (_ph1(ss, shape, _shapePrun[shape], ss.len1, 0, -1)) break
  }
  // Strip backtick phase-boundary markers, normalize to "(a, b) /" format
  return ss.sol
    .replace(/`/g, '')
    .replace(/\((-?\d+),(-?\d+)\)/g, '($1, $2)')
    .replace(/\//g, ' /')
    .replace(/\s+/g, ' ')
    .trim()
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
