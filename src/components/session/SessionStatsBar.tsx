import { formatTime } from '@/lib/utils'
import type { WCAEvent } from '@/types'

// BLD and FMC events use Mo3 as their competition format, not Ao5
const MO3_EVENTS = new Set(['333bf', '444bf', '555bf', '333fm'])

interface SessionStatsBarProps {
  solveCount: number
  ao5: number | null
  ao12: number | null
  mean: number | null
  mo3: number | null
  event: WCAEvent
}

function formatStat(value: number | null): string {
  if (value === null) return '--'
  return formatTime(value)
}

interface StatPillProps {
  label: string
  value: string | number
  active?: boolean
  highlight?: boolean
}

function StatPill({ label, value, active = false, highlight = false }: StatPillProps) {
  return (
    <div style={{
      background: highlight ? 'rgba(34,211,238,0.08)' : 'var(--surface-0)',
      borderRadius: 12,
      padding: '8px 16px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 2,
      minWidth: 64,
      border: highlight ? '1px solid rgba(34,211,238,0.25)' : '1px solid transparent',
    }}>
      <span style={{
        fontSize: 10,
        fontWeight: 500,
        color: highlight ? 'var(--accent)' : 'var(--text-muted)',
      }}>
        {label}
      </span>
      <span style={{
        fontFamily: "'JetBrains Mono', monospace",
        fontWeight: 700,
        fontSize: 14,
        color: active ? 'var(--accent)' : 'var(--text-primary)',
        letterSpacing: '-0.02em',
      }}>
        {value}
      </span>
    </div>
  )
}

export function SessionStatsBar({ solveCount, ao5, ao12, mean, mo3, event }: SessionStatsBarProps) {
  const isMo3Event = MO3_EVENTS.has(event)

  return (
    <div
      style={{
        backgroundColor: 'var(--surface-0)',
        borderTop: '1px solid var(--border)',
        padding: '8px 16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-around',
        gap: 8,
        overflowX: 'auto',
      }}
    >
      <StatPill label="Solves" value={solveCount} />
      {isMo3Event ? (
        <>
          <StatPill label="Mo3" value={formatStat(mo3)} active={mo3 !== null} highlight />
          <StatPill label="Mean" value={formatStat(mean)} active={mean !== null} />
        </>
      ) : (
        <>
          <StatPill label="Ao5" value={formatStat(ao5)} active={ao5 !== null} highlight />
          <StatPill label="Ao12" value={formatStat(ao12)} active={ao12 !== null} />
          <StatPill label="Mean" value={formatStat(mean)} active={false} />
        </>
      )}
    </div>
  )
}
