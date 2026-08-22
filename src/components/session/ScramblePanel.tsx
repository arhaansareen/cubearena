import { useState } from 'react'
import type { WCAEvent } from '@/types'
import { ScrambleViz } from './ScrambleViz'

interface ScramblePanelProps {
  scramble: string
  loading?: boolean
  event: WCAEvent
  onNextScramble: () => void
  onPrevScramble: () => void
  canGoPrev: boolean
  canGoForward: boolean
  onEventChange: (event: WCAEvent) => void
  soundEnabled?: boolean
  onToggleSound?: () => void
  onInsights?: () => void
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

function CopyIcon({ copied }: { copied: boolean }) {
  if (copied) {
    return (
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
        <path d="M2 7l3.5 3.5L12 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    )
  }
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <rect x="4" y="4" width="8" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.3" />
      <path d="M2 10V2.5A.5.5 0 0 1 2.5 2H10" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  )
}

export function ScramblePanel({
  scramble,
  loading = false,
  event,
  onNextScramble,
  onPrevScramble,
  canGoPrev,
  canGoForward,
  onEventChange,
  soundEnabled = true,
  onToggleSound,
  onInsights,
}: ScramblePanelProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    if (!scramble) return
    void navigator.clipboard.writeText(scramble).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    })
  }

  const navBtnStyle = (disabled: boolean): React.CSSProperties => ({
    display: 'flex', alignItems: 'center', gap: 4,
    padding: '5px 10px',
    backgroundColor: 'var(--surface-1)',
    border: '1px solid var(--border)',
    borderRadius: 7,
    color: disabled ? 'var(--text-muted)' : 'var(--text-primary)',
    fontSize: 12, fontWeight: 500, cursor: disabled ? 'default' : 'pointer',
    opacity: disabled ? 0.4 : 1,
    transition: 'color 120ms, border-color 120ms, opacity 120ms',
    userSelect: 'none' as const,
  })

  return (
    <div style={{
      backgroundColor: 'var(--surface-0)',
      borderBottom: '1px solid var(--border)',
      padding: '14px 20px',
      display: 'flex',
      flexDirection: 'column',
      gap: 10,
    }}>
      {/* Top row: two-dropdown event picker + controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flex: 1, minWidth: 0 }}>
          {/* Category dropdown */}
          <select
            value="wca"
            onChange={() => {}}
            style={{
              backgroundColor: 'var(--surface-1)', border: '1px solid var(--border)',
              borderRadius: 7, padding: '5px 10px', color: 'var(--text-primary)',
              fontSize: 12, fontWeight: 500, cursor: 'pointer', outline: 'none',
              fontFamily: "'Inter', sans-serif", flexShrink: 0,
            }}
          >
            <option value="wca">WCA</option>
          </select>
          {/* Event dropdown */}
          <select
            value={event}
            onChange={e => onEventChange(e.target.value as WCAEvent)}
            style={{
              backgroundColor: 'var(--surface-1)', border: '1px solid var(--accent)',
              borderRadius: 7, padding: '5px 10px',
              color: 'var(--accent)', fontSize: 12, fontWeight: 600,
              cursor: 'pointer', outline: 'none',
              fontFamily: "'JetBrains Mono', monospace", flexShrink: 0,
            }}
          >
            <option value="333">3x3x3</option>
            <option value="222">2x2x2</option>
            <option value="444">4x4x4</option>
            <option value="555">5x5x5</option>
            <option value="666">6x6x6</option>
            <option value="777">7x7x7</option>
            <option value="333bf">3x3 BLD</option>
            <option value="333oh">3x3 OH</option>
            <option value="333fm">FMC</option>
            <option value="clock">Clock</option>
            <option value="minx">Megaminx</option>
            <option value="pyram">Pyraminx</option>
            <option value="skewb">Skewb</option>
            <option value="sq1">Square-1</option>
            <option value="444bf">4x4 BLD</option>
            <option value="555bf">5x5 BLD</option>
          </select>
        </div>

        {onInsights && (
          <button
            onClick={onInsights}
            title="Session insights"
            style={{
              display: 'flex', alignItems: 'center', gap: 5,
              padding: '5px 11px', height: 30,
              backgroundColor: 'var(--surface-1)',
              border: '1px solid var(--border)',
              borderRadius: 7, color: 'var(--text-muted)',
              fontSize: 12, fontWeight: 500, cursor: 'pointer',
              transition: 'color 150ms ease, border-color 150ms ease',
              flexShrink: 0,
            }}
            onMouseEnter={e => { e.currentTarget.style.color = 'var(--text-primary)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)' }}
            onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.borderColor = 'var(--border)' }}
          >
            <svg width="13" height="13" viewBox="0 0 13 13" fill="none" aria-hidden="true">
              <rect x="1" y="7" width="2.5" height="5" rx="0.5" fill="currentColor" opacity="0.6"/>
              <rect x="5" y="4" width="2.5" height="8" rx="0.5" fill="currentColor" opacity="0.8"/>
              <rect x="9" y="1" width="2.5" height="11" rx="0.5" fill="currentColor"/>
            </svg>
            Insights
          </button>
        )}
        {onToggleSound && (
          <button
            onClick={onToggleSound}
            title={soundEnabled ? 'Mute crowd noise' : 'Unmute crowd noise'}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              width: 30, height: 30, padding: 0,
              backgroundColor: 'var(--surface-1)',
              border: '1px solid var(--border)',
              borderRadius: 7,
              color: soundEnabled ? 'var(--text-primary)' : 'var(--text-muted)',
              cursor: 'pointer',
              transition: 'color 150ms ease',
              flexShrink: 0,
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)' }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)' }}
          >
            {soundEnabled ? <SoundOnIcon /> : <SoundOffIcon />}
          </button>
        )}
      </div>

      {/* Scramble row: text + viz */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <button
          onClick={handleCopy}
          title="Click to copy scramble"
          className="font-mono scramble-text"
          style={{
            flex: 1,
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 'clamp(13px, 1.4vw, 18px)',
            fontWeight: 500,
            letterSpacing: '0.04em',
            lineHeight: 1.6,
            wordBreak: 'break-word',
            color: 'var(--text-primary)',
            background: 'none',
            border: 'none',
            padding: 0,
            textAlign: 'left',
            cursor: 'pointer',
            transition: 'color 120ms',
            minHeight: '1.6em',
          }}
          onMouseEnter={e => { e.currentTarget.style.color = 'var(--accent)' }}
          onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-primary)' }}
        >
          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, width: '100%' }}>
              <div style={{ height: 14, borderRadius: 4, backgroundColor: 'var(--surface-1)', width: '90%', animation: 'shimmer 1.4s ease-in-out infinite' }} />
              <div style={{ height: 14, borderRadius: 4, backgroundColor: 'var(--surface-1)', width: '60%', animation: 'shimmer 1.4s ease-in-out infinite 0.2s' }} />
            </div>
          ) : scramble}
        </button>

        {!loading && scramble && (
          <div className="scramble-viz-wrap">
            <ScrambleViz scramble={scramble} event={event} size={150} />
          </div>
        )}
      </div>

      {/* Nav row: ← prev, next →, copy */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <button
          onClick={onPrevScramble}
          disabled={!canGoPrev}
          style={navBtnStyle(!canGoPrev)}
          onMouseEnter={e => { if (canGoPrev) e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)' }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)' }}
        >
          ← prev
        </button>
        <button
          onClick={onNextScramble}
          style={navBtnStyle(false)}
          onMouseEnter={e => { e.currentTarget.style.borderColor = canGoForward ? 'var(--accent)' : 'rgba(255,255,255,0.2)' }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)' }}
        >
          {canGoForward ? 'next →' : 'next →'}
        </button>
        <button
          onClick={handleCopy}
          title="Copy scramble"
          style={{
            display: 'flex', alignItems: 'center', gap: 5,
            padding: '5px 10px',
            backgroundColor: copied ? 'var(--accent-dim)' : 'var(--surface-1)',
            border: `1px solid ${copied ? 'var(--accent)' : 'var(--border)'}`,
            borderRadius: 7,
            color: copied ? 'var(--accent)' : 'var(--text-muted)',
            fontSize: 12, fontWeight: 500, cursor: 'pointer',
            transition: 'all 150ms ease',
          }}
          onMouseEnter={e => { if (!copied) { e.currentTarget.style.color = 'var(--text-primary)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)' } }}
          onMouseLeave={e => { if (!copied) { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.borderColor = 'var(--border)' } }}
        >
          <CopyIcon copied={copied} />
          {copied ? 'copied' : 'copy'}
        </button>
      </div>

      <style>{`
        @keyframes shimmer {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 1; }
        }
        @media (max-width: 767px) {
          .scramble-viz-wrap { display: none; }
          .scramble-text { font-size: 13px !important; }
        }
      `}</style>
    </div>
  )
}
