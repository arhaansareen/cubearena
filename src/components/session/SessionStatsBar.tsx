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

interface StatPillProps {
  label: string
  value: string | number
  active?: boolean
}

function StatPill({ label, value, active = false }: StatPillProps) {
  return (
    <div style={{
      background: 'var(--surface-0)',
      borderRadius: 12,
      padding: '8px 16px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 2,
      minWidth: 64,
    }}>
      <span style={{
        fontSize: 10,
        fontWeight: 600,
        color: 'var(--text-muted)',
        textTransform: 'uppercase',
        letterSpacing: '0.07em',
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
        gap: 8,
        overflowX: 'auto',
      }}
    >
      <StatPill label="Solves" value={solveCount} active={false} />
      <StatPill label="Ao5" value={formatStat(ao5)} active={ao5 !== null} />
      <StatPill label="Ao12" value={formatStat(ao12)} active={ao12 !== null} />
      <StatPill label="Mean" value={formatStat(mean)} active={false} />
    </div>
  )
}
