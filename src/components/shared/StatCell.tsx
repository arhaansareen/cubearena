import { motion, AnimatePresence } from 'framer-motion'

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
      <AnimatePresence mode="popLayout">
        <motion.span
          key={String(value)}
          initial={highlight ? { opacity: 0, y: -6, scale: 0.92 } : { opacity: 0 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 6, scale: 0.92 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className="font-mono"
          style={{
            fontSize: 18,
            fontWeight: 700,
            color: highlight ? 'var(--accent)' : 'var(--text-primary)',
            letterSpacing: '-0.02em',
            fontVariantNumeric: 'tabular-nums',
            display: 'block',
          }}
        >
          {value}
        </motion.span>
      </AnimatePresence>
    </div>
  )
}
