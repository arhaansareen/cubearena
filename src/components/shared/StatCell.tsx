interface StatCellProps {
  label: string
  value: string | number
  highlight?: boolean
}

export function StatCell({ label, value, highlight = false }: StatCellProps) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 2,
        padding: '8px 16px',
        borderRadius: 8,
        backgroundColor: highlight ? 'var(--accent-dim)' : 'transparent',
        transition: 'background-color 200ms ease',
        minWidth: 72,
      }}
    >
      <span
        style={{
          fontSize: 10,
          fontWeight: 600,
          color: 'var(--text-muted)',
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
        }}
      >
        {label}
      </span>
      <span
        className="font-mono"
        style={{
          fontSize: 18,
          fontWeight: 700,
          color: highlight ? 'var(--accent)' : 'var(--text-primary)',
          letterSpacing: '-0.02em',
          fontVariantNumeric: 'tabular-nums',
          transition: 'color 200ms ease',
        }}
      >
        {value}
      </span>
    </div>
  )
}
