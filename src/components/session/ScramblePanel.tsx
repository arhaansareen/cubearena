import type { WCAEvent } from '@/types'
import { ScrambleViz } from './ScrambleViz'

interface ScramblePanelProps {
  scramble: string
  loading: boolean
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
  loading,
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

      {/* Scramble string + cube net */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <div
          className="font-mono"
          style={{
            flex: 1,
            fontSize: 15,
            fontWeight: 500,
            letterSpacing: '0.04em',
            lineHeight: 1.6,
            wordBreak: 'break-word',
            color: loading ? 'var(--text-muted)' : 'var(--text-primary)',
            transition: 'color 150ms ease',
            minHeight: '1.6em',
          }}
        >
          {loading ? 'Generating…' : scramble}
        </div>
        {!loading && scramble && (
          <ScrambleViz scramble={scramble} event={event} size={100} />
        )}
      </div>
    </div>
  )
}
