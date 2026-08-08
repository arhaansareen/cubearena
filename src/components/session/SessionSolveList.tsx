import { useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { Solve } from '@/types'
import { computeAo, formatTime } from '@/lib/utils'
import { HoldDeleteButton } from './HoldDeleteButton'

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
        {reversed.map(({ solve, index, ao5, ao12, isBest }, rowIdx) => (
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
              borderLeft: rowIdx === 0 ? '3px solid var(--accent)' : 'none',
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
        <HoldDeleteButton onDelete={onDeleteLast} />
      )}
    </div>
  )
}
