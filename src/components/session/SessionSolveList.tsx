import { useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { Solve } from '@/types'
import { computeAo, formatTime } from '@/lib/utils'

interface SessionSolveListProps {
  solves: Solve[]
  onDeleteLast: () => void
}

function timeColor(solve: Solve, isBest: boolean): string {
  if (solve.penalty === 'DNF') return 'var(--penalty)'
  if (solve.penalty === '+2') return 'var(--inspection)'
  if (isBest) return 'var(--positive)'
  return 'var(--text-primary)'
}

export function SessionSolveList({ solves, onDeleteLast }: SessionSolveListProps) {
  const rows = useMemo(() => {
    const bestTime = Math.min(
      ...solves
        .filter((s) => s.penalty !== 'DNF' && isFinite(s.effectiveTime))
        .map((s) => s.effectiveTime)
    )

    return solves.map((solve, i) => {
      const subset = solves.slice(0, i + 1)
      return {
        solve,
        index: i,
        ao5: computeAo(subset, 5),
        ao12: computeAo(subset, 12),
        isBest: isFinite(solve.effectiveTime) && solve.effectiveTime === bestTime,
      }
    })
  }, [solves])

  const reversed = [...rows].reverse()

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '28px 1fr 60px 60px',
        padding: '8px 10px',
        borderBottom: '1px solid var(--border)',
        fontSize: 10, fontWeight: 600,
        color: 'var(--text-muted)',
        textTransform: 'uppercase', letterSpacing: '0.07em',
        flexShrink: 0,
      }}>
        <span>#</span>
        <span>Time</span>
        <span style={{ textAlign: 'right' }}>ao5</span>
        <span style={{ textAlign: 'right' }}>ao12</span>
      </div>

      {/* Solve rows */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        <AnimatePresence initial={false}>
        {reversed.map(({ solve, index, ao5, ao12, isBest }) => (
          <motion.div
            key={solve.id}
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -16 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            layout="position"
            style={{
              display: 'grid',
              gridTemplateColumns: '28px 1fr 60px 60px',
              padding: '6px 10px',
              borderBottom: '1px solid var(--border)',
              alignItems: 'center',
              fontSize: 12,
            }}
          >
            <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>{index + 1}</span>
            <span style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontWeight: 600,
              color: timeColor(solve, isBest),
            }}>
              {formatTime(solve.effectiveTime)}
              {solve.penalty === '+2' && (
                <span style={{ fontSize: 9, marginLeft: 2, opacity: 0.7 }}>+2</span>
              )}
            </span>
            <span style={{
              textAlign: 'right',
              fontFamily: "'JetBrains Mono', monospace",
              color: ao5 !== null ? 'var(--text-primary)' : 'var(--text-muted)',
              fontSize: 11,
            }}>
              {ao5 !== null ? formatTime(ao5) : '—'}
            </span>
            <span style={{
              textAlign: 'right',
              fontFamily: "'JetBrains Mono', monospace",
              color: ao12 !== null ? 'var(--text-primary)' : 'var(--text-muted)',
              fontSize: 11,
            }}>
              {ao12 !== null ? formatTime(ao12) : '—'}
            </span>
          </motion.div>
        ))}
        </AnimatePresence>
      </div>

      {/* Delete last solve */}
      {solves.length > 0 && (
        <button
          onClick={onDeleteLast}
          style={{
            padding: '8px',
            borderTop: '1px solid var(--border)',
            color: 'var(--text-muted)',
            fontSize: 11,
            fontWeight: 500,
            cursor: 'pointer',
            transition: 'color 150ms ease, background-color 150ms ease',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
            flexShrink: 0,
          }}
          onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--penalty)'; e.currentTarget.style.backgroundColor = 'rgba(239,68,68,0.06)' }}
          onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.backgroundColor = 'transparent' }}
        >
          <svg width="11" height="11" viewBox="0 0 11 11" fill="none" aria-hidden="true">
            <path d="M2 2.5h7M4.5 2.5V2a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 .5.5v.5M3.5 4v4.5M5.5 4v4.5M7.5 4v4.5M2.5 2.5l.5 7h5l.5-7" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Delete last
        </button>
      )}
    </div>
  )
}
