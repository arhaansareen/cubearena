import { formatTime } from '@/lib/utils'

type Size = 'sm' | 'md' | 'lg' | 'xl'

interface TimeDisplayProps {
  ms: number
  size?: Size
  className?: string
}

const SIZE_STYLES: Record<Size, React.CSSProperties> = {
  sm: { fontSize: 20, lineHeight: 1, letterSpacing: '-0.02em' },
  md: { fontSize: 32, lineHeight: 1, letterSpacing: '-0.03em' },
  lg: { fontSize: 48, lineHeight: 1, letterSpacing: '-0.03em' },
  xl: { fontSize: 96, lineHeight: 1, letterSpacing: '-0.04em' },
}

export function TimeDisplay({ ms, size = 'md', className }: TimeDisplayProps) {
  const isDnf = !isFinite(ms)
  const formatted = formatTime(ms)

  return (
    <span
      className={`font-mono ${className ?? ''}`}
      style={{
        ...SIZE_STYLES[size],
        fontWeight: 700,
        color: isDnf ? 'var(--penalty)' : 'inherit',
        display: 'inline-block',
        fontVariantNumeric: 'tabular-nums',
        transition: 'color 200ms ease',
      }}
    >
      {formatted}
    </span>
  )
}
