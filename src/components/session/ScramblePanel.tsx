import type { WCAEvent } from '@/types'
import { ScrambleViz } from './ScrambleViz'
import { EventTabs } from './EventTabs'

interface ScramblePanelProps {
  scramble: string
  loading?: boolean
  event: WCAEvent
  onNewScramble: () => void
  onEventChange: (event: WCAEvent) => void
  soundEnabled?: boolean
  onToggleSound?: () => void
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

function SoundOnIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none" aria-hidden="true">
      <path d="M3 5.5H1.5a.5.5 0 0 0-.5.5v3a.5.5 0 0 0 .5.5H3l3 2.5V3L3 5.5Z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
      <path d="M10 5.5c.8.5 1.3 1.3 1.3 2s-.5 1.5-1.3 2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      <path d="M12 3.5c1.3 1 2.1 2.4 2.1 4s-.8 3-2.1 4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  )
}

function SoundOffIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none" aria-hidden="true">
      <path d="M3 5.5H1.5a.5.5 0 0 0-.5.5v3a.5.5 0 0 0 .5.5H3l3 2.5V3L3 5.5Z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
      <path d="M10 5.5l3.5 3.5M13.5 5.5L10 9" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  )
}

export function ScramblePanel({
  scramble,
  loading = false,
  event,
  onNewScramble,
  onEventChange,
  soundEnabled = true,
  onToggleSound,
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
      {/* Top row: event tabs + controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <EventTabs value={event} onChange={onEventChange} />
        </div>

        {onToggleSound && (
          <button
            onClick={onToggleSound}
            title={soundEnabled ? 'Mute crowd noise' : 'Unmute crowd noise'}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 32,
              height: 32,
              padding: 0,
              backgroundColor: 'var(--surface-1)',
              border: '1px solid var(--border)',
              borderRadius: 8,
              color: soundEnabled ? 'var(--text-primary)' : 'var(--text-muted)',
              cursor: 'pointer',
              transition: 'color 150ms ease, border-color 150ms ease',
              flexShrink: 0,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = 'var(--text-primary)'
              e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = soundEnabled ? 'var(--text-primary)' : 'var(--text-muted)'
              e.currentTarget.style.borderColor = 'var(--border)'
            }}
          >
            {soundEnabled ? <SoundOnIcon /> : <SoundOffIcon />}
          </button>
        )}

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
            color: 'var(--text-primary)',
            fontSize: 13,
            fontWeight: 500,
            cursor: 'pointer',
            transition: 'color 150ms ease, border-color 150ms ease, background-color 150ms ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = 'var(--accent)'
            e.currentTarget.style.backgroundColor = 'var(--surface-1)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = 'var(--border)'
            e.currentTarget.style.backgroundColor = 'var(--surface-1)'
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
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 17,
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
