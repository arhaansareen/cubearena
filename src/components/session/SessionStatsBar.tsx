import { useMemo } from 'react'
import { formatTime } from '@/lib/utils'
import type { Solve, WCAEvent } from '@/types'

const MO3_EVENTS = new Set(['333bf', '444bf', '555bf', '333fm', '666', '777'])

interface SessionStatsBarProps {
  solves: Solve[]
  ao5: number | null
  ao12: number | null
  ao50: number | null
  ao100: number | null
  bestAo5: number | null
  bestAo12: number | null
  bestAo50: number | null
  bestAo100: number | null
  mean: number | null
  mo3: number | null
  event: WCAEvent
  onNewSession: () => void
}

function fmt(value: number | null): string {
  if (value === null) return '—'
  return formatTime(value)
}

interface StatRowProps {
  label: string
  current: string
  best: string
  highlight?: boolean
}

function StatRow({ label, current, best, highlight = false }: StatRowProps) {
  const accent = highlight ? 'var(--accent)' : 'var(--text-primary)'
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '52px 1fr 1fr',
      alignItems: 'center',
      padding: '3px 0',
    }}>
      <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
        {label}
      </span>
      <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 13, fontWeight: 700, color: accent, textAlign: 'right', paddingRight: 16 }}>
        {current}
      </span>
      <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 13, fontWeight: 700, color: 'var(--text-muted)', textAlign: 'right' }}>
        {best}
      </span>
    </div>
  )
}

export function SessionStatsBar({ solves, ao5, ao12, ao50, ao100, bestAo5, bestAo12, bestAo50, bestAo100, mean, mo3, event, onNewSession }: SessionStatsBarProps) {
  const isMo3Event = MO3_EVENTS.has(event)

  const bestSingle = useMemo(() => {
    const valid = solves.filter(s => isFinite(s.effectiveTime))
    if (valid.length === 0) return null
    return Math.min(...valid.map(s => s.effectiveTime))
  }, [solves])

  const worst = useMemo(() => {
    const valid = solves.filter(s => isFinite(s.effectiveTime))
    if (valid.length === 0) return null
    return Math.max(...valid.map(s => s.effectiveTime))
  }, [solves])

  const handleNewSession = () => {
    if (solves.length === 0) return
    if (window.confirm(`End this session (${solves.length} solve${solves.length === 1 ? '' : 's'}) and start a new one?`)) {
      onNewSession()
    }
  }

  return (
    <div style={{
      backgroundColor: 'var(--surface-0)',
      borderTop: '1px solid var(--border)',
      padding: '10px 16px',
      display: 'flex',
      alignItems: 'center',
      gap: 24,
    }}>
      {/* Solve count */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1, flexShrink: 0 }}>
        <span style={{ fontSize: 18, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace", color: 'var(--text-primary)', lineHeight: 1 }}>
          {solves.length}
        </span>
        <span style={{ fontSize: 9, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          Solves
        </span>
      </div>

      <div style={{ width: 1, height: 36, backgroundColor: 'var(--border)', flexShrink: 0 }} />

      {/* Stats table */}
      <div style={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>
        {/* Header */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '52px 1fr 1fr',
          padding: '0 0 2px 0',
          marginBottom: 1,
        }}>
          <span />
          <span style={{ fontSize: 9, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', textAlign: 'right', paddingRight: 16 }}>
            current
          </span>
          <span style={{ fontSize: 9, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', textAlign: 'right' }}>
            best
          </span>
        </div>

        <div style={{ display: 'flex', gap: 0, flexWrap: 'nowrap' }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <StatRow label="Single" current={fmt(solves.length > 0 ? solves[solves.length - 1].effectiveTime : null)} best={fmt(bestSingle)} />
            {isMo3Event ? (
              <StatRow label="Mo3" current={fmt(mo3)} best={fmt(mo3)} highlight />
            ) : (
              <StatRow label="Ao5" current={fmt(ao5)} best={fmt(bestAo5)} highlight />
            )}
            <StatRow label="Ao12" current={fmt(ao12)} best={fmt(bestAo12)} />
          </div>
          <div style={{ width: 1, backgroundColor: 'var(--border)', flexShrink: 0, margin: '0 12px' }} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <StatRow label="Ao50" current={fmt(ao50)} best={fmt(bestAo50)} />
            <StatRow label="Ao100" current={fmt(ao100)} best={fmt(bestAo100)} />
            <StatRow label="Worst" current={fmt(worst)} best={fmt(worst)} />
            <StatRow label="Mean" current={fmt(mean)} best={fmt(mean)} />
          </div>
        </div>
      </div>

      {solves.length > 0 && (
        <>
          <div style={{ width: 1, height: 36, backgroundColor: 'var(--border)', flexShrink: 0 }} />
          <button
            onClick={handleNewSession}
            style={{
              padding: '6px 12px', borderRadius: 8,
              border: '1px solid var(--border)',
              background: 'none', color: 'var(--text-muted)',
              fontSize: 11, fontWeight: 500, cursor: 'pointer',
              transition: 'color 150ms ease, border-color 150ms ease', whiteSpace: 'nowrap', flexShrink: 0,
            }}
            onMouseOver={e => { e.currentTarget.style.color = 'var(--text-primary)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)' }}
            onMouseOut={e => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.borderColor = 'var(--border)' }}
          >
            New session
          </button>
        </>
      )}
    </div>
  )
}
