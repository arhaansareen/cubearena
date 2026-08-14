import { memo } from 'react'
import type { AlgSubset } from '@/data/algData'

interface CubeVizProps {
  alg: string
  subset: AlgSubset
  size?: number
  bgColor?: string
}

type Face = 'U' | 'D' | 'F' | 'B' | 'R' | 'L'
type Orient = Record<Face, Face>

const INIT: Orient = { U: 'U', D: 'D', F: 'F', B: 'B', R: 'R', L: 'L' }

// Each function returns what absolute face is now at each relative position.
// e.g. after x (tilt forward), relative-U = old-F.
function applyX(o: Orient): Orient { return { U: o.F, F: o.D, D: o.B, B: o.U, R: o.R, L: o.L } }
function applyY(o: Orient): Orient { return { U: o.U, D: o.D, F: o.L, R: o.F, B: o.R, L: o.B } }
function applyZ(o: Orient): Orient { return { U: o.L, R: o.U, D: o.R, L: o.D, F: o.F, B: o.B } }

const FACE_CHARS = new Set(['U', 'D', 'F', 'B', 'R', 'L'])

// Rebase an alg from its own reference frame (with x/y/z rotations) to the
// absolute frame, stripping rotation moves. This ensures that D2 in an
// x-rotated alg becomes B2 in the output instead of moving white pieces.
function rebaseAlg(algStr: string): string {
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
        // wide moves stay wide (lowercase), standard stay uppercase
        out.push((base === base.toLowerCase() ? mapped.toLowerCase() : mapped) + suf)
      } else {
        out.push(m) // M, S, E, etc. — pass through
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

function invertAlg(algStr: string): string {
  return algStr.trim().split(/\s+/).filter(Boolean).reverse().map(invertMove).join(' ')
}

export const CubeViz = memo(function CubeViz({
  alg,
  subset,
  size = 90,
  bgColor = '0F172A',
}: CubeVizProps) {
  // Rebase to absolute frame first (removes rotation moves, remaps D/U/F/B correctly),
  // then invert to get the setup position VisualCube should display.
  const algParam = invertAlg(rebaseAlg(alg)).replace(/\s+/g, '_')

  const isF2L = subset === 'F2L'
  const stage = isF2L ? 'f2l' : subset === 'PLL' ? 'pll' : 'oll'
  const viewParam = isF2L ? '' : '&view=plan'

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
