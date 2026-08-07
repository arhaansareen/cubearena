import { StatCell } from '@/components/shared/StatCell'
import { formatTime } from '@/lib/utils'

interface SessionStatsBarProps {
  solveCount: number
  ao5: number | null
  ao12: number | null
  mean: number | null
}

function formatStat(value: number | null): string {
  if (value === null) return '--'
  return formatTime(value)
}

export function SessionStatsBar({ solveCount, ao5, ao12, mean }: SessionStatsBarProps) {
  return (
    <div
      style={{
        backgroundColor: 'var(--surface-0)',
        borderTop: '1px solid var(--border)',
        padding: '8px 16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-around',
        gap: 4,
        overflowX: 'auto',
      }}
    >
      <StatCell
        label="Solves"
        value={solveCount}
        highlight={false}
      />
      <div
        style={{
          width: 1,
          height: 32,
          backgroundColor: 'var(--border)',
          flexShrink: 0,
        }}
      />
      <StatCell
        label="Ao5"
        value={formatStat(ao5)}
        highlight={ao5 !== null}
      />
      <div
        style={{
          width: 1,
          height: 32,
          backgroundColor: 'var(--border)',
          flexShrink: 0,
        }}
      />
      <StatCell
        label="Ao12"
        value={formatStat(ao12)}
        highlight={ao12 !== null}
      />
      <div
        style={{
          width: 1,
          height: 32,
          backgroundColor: 'var(--border)',
          flexShrink: 0,
        }}
      />
      <StatCell
        label="Mean"
        value={formatStat(mean)}
        highlight={false}
      />
    </div>
  )
}
