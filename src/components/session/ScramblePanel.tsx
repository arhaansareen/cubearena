import type { WCAEvent } from '@/types'

interface ScramblePanelProps {
  scramble: string
  event: WCAEvent
  onNewScramble: () => void
  onEventChange: (event: WCAEvent) => void
}

const WCA_EVENTS: { value: WCAEvent; label: string }[] = [
  { value: '333', label: '3x3' },
  { value: '222', label: '2x2' },
  { value: '444', label: '4x4' },
  { value: '555', label: '5x5' },
  { value: '666', label: '6x6' },
  { value: '777', label: '7x7' },
  { value: '333bf', label: '3BLD' },
  { value: '333oh', label: '3OH' },
  { value: '333fm', label: 'FMC' },
  { value: 'clock', label: 'Clock' },
  { value: 'minx', label: 'Megaminx' },
  { value: 'pyram', label: 'Pyraminx' },
  { value: 'skewb', label: 'Skewb' },
  { value: 'sq1', label: 'Square-1' },
  { value: '444bf', label: '4BLD' },
  { value: '555bf', label: '5BLD' },
]

// Sticker face colors for the 2D cube net (placeholder -- all neutral grey)
const FACE_COLORS = {
  U: '#475569',
  D: '#475569',
  F: '#475569',
  B: '#475569',
  L: '#475569',
  R: '#475569',
}

function CubeNetSVG() {
  const S = 14 // sticker size
  const G = 1  // gap
  const FACE = S * 3 + G * 2 // face total size
  const PAD = 4

  // Face positions in the cross layout:
  //      [U]
  //   [L][F][R][B]
  //      [D]
  const facePositions: { face: keyof typeof FACE_COLORS; col: number; row: number }[] = [
    { face: 'U', col: 1, row: 0 },
    { face: 'L', col: 0, row: 1 },
    { face: 'F', col: 1, row: 1 },
    { face: 'R', col: 2, row: 1 },
    { face: 'B', col: 3, row: 1 },
    { face: 'D', col: 1, row: 2 },
  ]

  const totalW = 4 * (FACE + PAD) + PAD
  const totalH = 3 * (FACE + PAD) + PAD

  return (
    <svg
      width={totalW}
      height={totalH}
      viewBox={`0 0 ${totalW} ${totalH}`}
      aria-label="Cube net visualization (neutral state)"
    >
      {facePositions.map(({ face, col, row }) => {
        const faceX = PAD + col * (FACE + PAD)
        const faceY = PAD + row * (FACE + PAD)
        const color = FACE_COLORS[face]

        return (
          <g key={face}>
            {Array.from({ length: 9 }, (_, i) => {
              const r = Math.floor(i / 3)
              const c = i % 3
              return (
                <rect
                  key={i}
                  x={faceX + c * (S + G)}
                  y={faceY + r * (S + G)}
                  width={S}
                  height={S}
                  rx={2}
                  fill={color}
                  stroke="rgba(255,255,255,0.06)"
                  strokeWidth={0.5}
                />
              )
            })}
          </g>
        )
      })}
    </svg>
  )
}

function RefreshIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path
        d="M13.5 8A5.5 5.5 0 1 1 8 2.5c1.52 0 2.9.615 3.9 1.6L13.5 5.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path d="M13.5 2.5v3h-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function ScramblePanel({
  scramble,
  event,
  onNewScramble,
  onEventChange,
}: ScramblePanelProps) {
  return (
    <div
      style={{
        backgroundColor: 'var(--surface-0)',
        borderBottom: '1px solid var(--border)',
        padding: '16px 24px',
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
      }}
    >
      {/* Top row: event selector + refresh */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <select
          value={event}
          onChange={(e) => onEventChange(e.target.value as WCAEvent)}
          style={{
            backgroundColor: 'var(--surface-1)',
            color: 'var(--text-primary)',
            border: '1px solid var(--border)',
            borderRadius: 8,
            padding: '6px 10px',
            fontSize: 13,
            fontWeight: 500,
            outline: 'none',
            transition: 'border-color 150ms ease',
            cursor: 'pointer',
          }}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = 'var(--accent)'
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = 'var(--border)'
          }}
        >
          {WCA_EVENTS.map((ev) => (
            <option key={ev.value} value={ev.value}>
              {ev.label}
            </option>
          ))}
        </select>

        <button
          onClick={onNewScramble}
          title="Generate new scramble"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '6px 12px',
            backgroundColor: 'var(--surface-1)',
            border: '1px solid var(--border)',
            borderRadius: 8,
            color: 'var(--text-muted)',
            fontSize: 13,
            fontWeight: 500,
            cursor: 'pointer',
            transition: 'color 150ms ease, border-color 150ms ease, background-color 150ms ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = 'var(--text-primary)'
            e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = 'var(--text-muted)'
            e.currentTarget.style.borderColor = 'var(--border)'
          }}
        >
          <RefreshIcon />
          New
        </button>
      </div>

      {/* Scramble string */}
      <div
        className="font-mono"
        style={{
          fontSize: 15,
          fontWeight: 500,
          color: 'var(--text-primary)',
          letterSpacing: '0.04em',
          lineHeight: 1.6,
          wordBreak: 'break-word',
        }}
      >
        {scramble}
      </div>

      {/* Cube net visualization */}
      <div style={{ paddingTop: 4 }}>
        <CubeNetSVG />
        <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
          Visualization is placeholder -- state rendering coming soon
        </p>
      </div>
    </div>
  )
}
