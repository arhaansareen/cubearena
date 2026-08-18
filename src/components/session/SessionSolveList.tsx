import { useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { Solve, WCAEvent } from '@/types'
import { computeAo, computeMean, formatTime } from '@/lib/utils'

const MO3_EVENTS = new Set<WCAEvent>(['333bf', '444bf', '555bf', '333fm', '666', '777'])

interface SessionSolveListProps {
  solves: Solve[]
  event: WCAEvent
  onDeleteSolve: (id: string) => void
}

function timeColor(solve: Solve, isBest: boolean): string {
  if (solve.penalty === 'DNF') return 'var(--penalty)'
  if (solve.penalty === '+2') return 'var(--inspection)'
  if (isBest) return 'var(--positive)'
  return 'var(--text-primary)'
}

export function SessionSolveList({ solves, event, onDeleteSolve }: SessionSolveListProps) {
  const isMo3 = MO3_EVENTS.has(event)

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
        mo3: computeMean(subset, 3),
        isBest: isFinite(solve.effectiveTime) && solve.effectiveTime === bestTime,
      }
    })
  }, [solves])

  const reversed = [...rows].reverse()

  const gridCols = isMo3 ? '28px 1fr 60px 20px' : '28px 1fr 60px 60px 20px'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: gridCols,
        padding: '8px 10px',
        borderBottom: '1px solid var(--border)',
        fontSize: 10, fontWeight: 600,
        color: 'var(--text-muted)',
        textTransform: 'uppercase', letterSpacing: '0.07em',
        flexShrink: 0,
      }}>
        <span>#</span>
        <span>Time</span>
        {isMo3 ? (
          <span style={{ textAlign: 'right' }}>mo3</span>
        ) : (
          <>
            <span style={{ textAlign: 'right' }}>ao5</span>
            <span style={{ textAlign: 'right' }}>ao12</span>
          </>
        )}
        <span />
      </div>

      {/* Solve rows */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        <AnimatePresence initial={false}>
        {reversed.map(({ solve, index, ao5, ao12, mo3, isBest }, rowIdx) => (
          <motion.div
            key={solve.id}
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -16 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            layout="position"
            className="solve-row"
            style={{
              borderBottom: '1px solid var(--border)',
              borderLeft: rowIdx === 0 ? '3px solid var(--accent)' : 'none',
              fontSize: 12,
            }}
          >
            <div style={{
              display: 'grid',
              gridTemplateColumns: gridCols,
              padding: '6px 10px',
              alignItems: 'center',
            }}>
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
              {isMo3 ? (
                <span style={{
                  textAlign: 'right',
                  fontFamily: "'JetBrains Mono', monospace",
                  color: mo3 !== null ? 'var(--accent)' : 'var(--text-muted)',
                  fontSize: 11,
                }}>
                  {mo3 !== null ? formatTime(mo3) : '—'}
                </span>
              ) : (
                <>
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
                </>
              )}
              <button
                className="solve-delete-btn"
                onClick={() => onDeleteSolve(solve.id)}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  width: 16, height: 16, padding: 0,
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: 'var(--text-muted)', opacity: 0.4,
                  transition: 'opacity 120ms, color 120ms',
                  borderRadius: 3,
                }}
                aria-label="Delete solve"
              >
                ×
              </button>
            </div>
            {solve.tags && solve.tags.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3, padding: '0 10px 6px 36px' }}>
                {solve.tags.map(tag => (
                  <span key={tag} style={{
                    padding: '1px 7px', borderRadius: 999, fontSize: 10, fontWeight: 500,
                    border: '1px solid var(--accent)',
                    backgroundColor: 'var(--accent-dim)',
                    color: 'var(--accent)',
                  }}>
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </motion.div>
        ))}
        </AnimatePresence>
      </div>

      <style>{`
        .solve-row:hover .solve-delete-btn { opacity: 1 !important; }
        .solve-delete-btn:hover { color: var(--penalty) !important; }
      `}</style>
    </div>
  )
}
