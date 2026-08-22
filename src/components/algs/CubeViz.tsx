import { memo, useEffect, useRef } from 'react'
import type { AlgSubset, AlgEvent } from '@/data/algData'

export interface CubeVizProps {
  alg: string
  subset: AlgSubset
  event: AlgEvent
  size?: number
}

// ─── Orientation helpers ───────────────────────────────────────────────────────
type Face = 'U' | 'D' | 'F' | 'B' | 'R' | 'L'
type Orient = Record<Face, Face>

const INIT: Orient = { U: 'U', D: 'D', F: 'F', B: 'B', R: 'R', L: 'L' }
const FACE_CHARS = new Set<string>(['U', 'D', 'F', 'B', 'R', 'L'])

function applyX(o: Orient): Orient { return { U: o.F, F: o.D, D: o.B, B: o.U, R: o.R, L: o.L } }
function applyY(o: Orient): Orient { return { U: o.U, D: o.D, F: o.L, R: o.F, B: o.R, L: o.B } }
function applyZ(o: Orient): Orient { return { U: o.L, R: o.U, D: o.R, L: o.D, F: o.F, B: o.B } }

export function rebaseAlg(algStr: string): string {
  let o: Orient = { ...INIT }
  const out: string[] = []
  for (const m of algStr.trim().split(/\s+/).filter(Boolean)) {
    const base = m.replace(/[2']$/, '')
    const suf = m.slice(base.length)
    const times = suf === '2' ? 2 : suf === "'" ? 3 : 1
    if (base === 'x') { for (let i = 0; i < times; i++) o = applyX(o) }
    else if (base === 'y') { for (let i = 0; i < times; i++) o = applyY(o) }
    else if (base === 'z') { for (let i = 0; i < times; i++) o = applyZ(o) }
    else {
      const upper = base.toUpperCase() as Face
      if (FACE_CHARS.has(upper)) {
        const mapped = o[upper]
        out.push((base === base.toLowerCase() ? mapped.toLowerCase() : mapped) + suf)
      } else {
        out.push(m)
      }
    }
  }
  return out.join(' ')
}

function invertMove(m: string): string {
  if (m.endsWith("'")) return m.slice(0, -1)
  if (m.endsWith('2')) return m
  return m + "'"
}

export function invertAlg(algStr: string): string {
  return algStr.trim().split(/\s+/).filter(Boolean).reverse().map(invertMove).join(' ')
}

// ─── VisualCube (3x3-based subsets) ──────────────────────────────────────────
function getVizParams(subset: AlgSubset): { stage: string; viewParam: string } {
  switch (subset) {
    case 'OLL':       return { stage: 'oll', viewParam: '&view=plan' }
    case 'PLL':       return { stage: 'pll', viewParam: '&view=plan' }
    case 'F2L':       return { stage: 'f2l', viewParam: '' }
    case 'COLL':      return { stage: 'coll', viewParam: '&view=plan' }
    case 'CLL':       return { stage: 'cll', viewParam: '&view=plan' }
    case 'OrtegaOLL': return { stage: 'oll', viewParam: '&view=plan' }
    case 'OrtegaPLL': return { stage: 'pll', viewParam: '&view=plan' }
    default:          return { stage: 'fl', viewParam: '' }
  }
}

// Subsets rendered with VisualCube (SVG API)
const VISUAL_CUBE_SUBSETS = new Set<AlgSubset>(['OLL', 'PLL', 'F2L', 'COLL', 'CLL', 'OrtegaOLL', 'OrtegaPLL'])

// Puzzle IDs for TwistyPlayer per event
const TWISTY_PUZZLE_ID: Partial<Record<AlgEvent, string>> = {
  '444': '4x4x4',
  '555': '5x5x5',
  '666': '6x6x6',
  '777': '7x7x7',
}

// ─── TwistyPlayer component ───────────────────────────────────────────────────
function TwistyViz({ alg, event, size }: { alg: string; event: AlgEvent; size: number }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const puzzle = TWISTY_PUZZLE_ID[event]

  useEffect(() => {
    const container = containerRef.current
    if (!container || !puzzle) return
    let cancelled = false
    container.innerHTML = ''

    void import('cubing/twisty').then(({ TwistyPlayer }) => {
      if (cancelled || !container) return
      const setupAlg = alg ? invertAlg(alg) : ''
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const player = new (TwistyPlayer as any)({
        puzzle,
        experimentalSetupAlg: setupAlg,
        alg: '',
        hintFacelets: 'floating',
        background: 'none',
        controlPanel: 'none',
      })
      player.style.width = `${size}px`
      player.style.height = `${size}px`
      player.style.display = 'block'
      container.appendChild(player)
    })

    return () => {
      cancelled = true
      container.innerHTML = ''
    }
  }, [alg, puzzle, size])

  return (
    <div
      ref={containerRef}
      style={{ width: size, height: size, borderRadius: 3, overflow: 'hidden' }}
    />
  )
}

// ─── Main CubeViz ─────────────────────────────────────────────────────────────
export const CubeViz = memo(function CubeViz({
  alg,
  subset,
  event,
  size = 90,
}: CubeVizProps) {
  const bgColor = '0F172A'

  // Empty alg → skip placeholder
  if (alg === '') {
    return (
      <svg width={size} height={size} viewBox="0 0 90 90" style={{ display: 'block', borderRadius: 3 }}>
        <rect width="90" height="90" rx="6" fill="#1E293B" />
        <text
          x="45" y="50"
          textAnchor="middle"
          dominantBaseline="middle"
          fill="#64748B"
          fontSize="13"
          fontFamily="Inter, sans-serif"
          fontWeight="600"
        >
          Skip
        </text>
      </svg>
    )
  }

  // TwistyPlayer for big cube parities
  if (!VISUAL_CUBE_SUBSETS.has(subset)) {
    return <TwistyViz alg={alg} event={event} size={size} />
  }

  // VisualCube for 3x3-based subsets
  const algParam = invertAlg(rebaseAlg(alg)).replace(/\s+/g, '_')
  const { stage, viewParam } = getVizParams(subset)
  const url =
    `https://visualcube.api.cubing.net/visualcube.php` +
    `?fmt=svg&size=${size}&stage=${stage}${viewParam}&bg=${bgColor}&alg=${algParam}`

  return (
    <img
      src={url}
      width={size}
      height={size}
      alt=""
      style={{ display: 'block', borderRadius: 3 }}
      loading="lazy"
    />
  )
})
