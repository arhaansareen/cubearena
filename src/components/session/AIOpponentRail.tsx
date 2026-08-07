import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { AIOpponent, TimerPhase } from '@/types'
import { formatTime } from '@/lib/utils'

interface AIOpponentRailProps {
  opponents: AIOpponent[]
  phase: TimerPhase
  solveStartTime: number | null
}

interface OpponentState {
  id: string
  progress: number // 0-1
  finishedAt: number | null // ms into the solve when they finished
}

// Sample from a Gaussian distribution using Box-Muller
function sampleGaussian(mean: number, sigma: number): number {
  let u = 0
  let v = 0
  while (u === 0) u = Math.random()
  while (v === 0) v = Math.random()
  const z = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v)
  return mean + z * sigma
}

export function AIOpponentRail({ opponents, phase, solveStartTime }: AIOpponentRailProps) {
  const [opponentStates, setOpponentStates] = useState<Record<string, OpponentState>>({})
  const targetTimesRef = useRef<Record<string, number>>({})
  const rafRef = useRef<number | null>(null)
  const prevPhaseRef = useRef<TimerPhase>('idle')

  // When a new solve starts, sample target times for each opponent
  useEffect(() => {
    if (phase === 'solving' && prevPhaseRef.current !== 'solving') {
      const newTargets: Record<string, number> = {}
      const newStates: Record<string, OpponentState> = {}

      for (const opp of opponents) {
        const t = Math.max(3000, sampleGaussian(opp.targetMean, opp.sigma))
        newTargets[opp.id] = t
        newStates[opp.id] = { id: opp.id, progress: 0, finishedAt: null }
      }

      targetTimesRef.current = newTargets
      setOpponentStates(newStates)
    }

    if (phase === 'idle' || phase === 'stopped') {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current)
        rafRef.current = null
      }
    }

    prevPhaseRef.current = phase
  }, [phase, opponents])

  // Animate progress during solving
  useEffect(() => {
    if (phase !== 'solving' || solveStartTime === null) {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current)
        rafRef.current = null
      }
      return
    }

    const tick = () => {
      const now = performance.now()
      const elapsed = now - solveStartTime

      setOpponentStates((prev) => {
        const next = { ...prev }
        let anyChange = false

        for (const opp of opponents) {
          const target = targetTimesRef.current[opp.id]
          if (!target) continue

          const state = prev[opp.id]
          if (!state) continue

          if (state.finishedAt !== null) continue

          const progress = Math.min(1, elapsed / target)
          const finishedAt = progress >= 1 ? target : null

          next[opp.id] = { ...state, progress, finishedAt }
          anyChange = true
        }

        return anyChange ? next : prev
      })

      rafRef.current = requestAnimationFrame(tick)
    }

    rafRef.current = requestAnimationFrame(tick)

    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current)
        rafRef.current = null
      }
    }
  }, [phase, solveStartTime, opponents])

  if (opponents.length === 0) return null

  return (
    <div
      style={{
        backgroundColor: 'var(--surface-0)',
        borderTop: '1px solid var(--border)',
        padding: '12px 24px',
        display: 'flex',
        gap: 16,
        overflowX: 'auto',
      }}
    >
      <AnimatePresence>
        {opponents.map((opp) => {
          const state = opponentStates[opp.id]
          const progress = state?.progress ?? 0
          const finishedAt = state?.finishedAt ?? null
          const targetTime = targetTimesRef.current[opp.id]

          return (
            <motion.div
              key={opp.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 8,
                minWidth: 180,
                flex: '1 1 180px',
              }}
            >
              {/* Opponent header */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: '50%',
                    backgroundColor: opp.avatarColor,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 11,
                    fontWeight: 700,
                    color: '#fff',
                    flexShrink: 0,
                  }}
                >
                  {opp.name.charAt(0).toUpperCase()}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: 13,
                      fontWeight: 600,
                      color: 'var(--text-primary)',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {opp.name}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                    {formatTime(opp.targetMean)} avg
                  </div>
                </div>
                {/* Time display */}
                <div
                  className="font-mono"
                  style={{
                    fontSize: 14,
                    fontWeight: 700,
                    color: finishedAt !== null ? 'var(--accent)' : 'var(--text-muted)',
                    flexShrink: 0,
                    transition: 'color 200ms ease',
                  }}
                >
                  {finishedAt !== null
                    ? formatTime(finishedAt)
                    : phase === 'solving' && targetTime
                    ? formatTime(targetTime)
                    : '--'}
                </div>
              </div>

              {/* Progress bar */}
              <div
                style={{
                  height: 4,
                  borderRadius: 2,
                  backgroundColor: 'var(--surface-1)',
                  overflow: 'hidden',
                }}
              >
                <motion.div
                  animate={{ width: `${progress * 100}%` }}
                  transition={{ duration: 0.05, ease: 'linear' }}
                  style={{
                    height: '100%',
                    borderRadius: 2,
                    backgroundColor:
                      finishedAt !== null ? 'var(--accent)' : 'rgba(34,211,238,0.6)',
                    transformOrigin: 'left',
                  }}
                />
              </div>
            </motion.div>
          )
        })}
      </AnimatePresence>
    </div>
  )
}
