import type { Penalty } from '@/types'

interface PenaltyBadgeProps {
  penalty: Penalty
}

export function PenaltyBadge({ penalty }: PenaltyBadgeProps) {
  if (!penalty) return null

  const isPlusTow = penalty === '+2'

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2px 8px',
        borderRadius: 9999,
        fontSize: 12,
        fontWeight: 600,
        letterSpacing: '0.04em',
        fontFamily: "'JetBrains Mono', monospace",
        backgroundColor: isPlusTow
          ? 'rgba(245, 158, 11, 0.15)'
          : 'rgba(239, 68, 68, 0.15)',
        color: isPlusTow ? 'var(--inspection)' : 'var(--penalty)',
        border: `1px solid ${isPlusTow ? 'rgba(245, 158, 11, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
        transition: 'all 150ms ease',
      }}
    >
      {penalty}
    </span>
  )
}
