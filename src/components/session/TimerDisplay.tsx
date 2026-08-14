import { motion } from 'framer-motion'
import type { TimerPhase, Penalty } from '@/types'
import { formatTime } from '@/lib/utils'

const RING_R = 88
const RING_CIRC = 2 * Math.PI * RING_R

function InspectionRing({ elapsed, penalty }: { elapsed: number; penalty: Penalty }) {
  const progress = Math.min(elapsed / 15000, 1)
  const offset = RING_CIRC * (1 - progress)
  const color = penalty === 'DNF' || penalty === '+2' ? '#EF4444' : elapsed > 12000 ? '#EF4444' : elapsed > 8000 ? '#F59E0B' : '#22D3EE'
  return (
    <svg
      width={200}
      height={200}
      viewBox="0 0 200 200"
      style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', pointerEvents: 'none' }}
      aria-hidden="true"
    >
      <circle cx={100} cy={100} r={RING_R} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={3} />
      <circle
        cx={100}
        cy={100}
        r={RING_R}
        fill="none"
        stroke={color}
        strokeWidth={3}
        strokeLinecap="round"
        strokeDasharray={RING_CIRC}
        strokeDashoffset={offset}
        transform="rotate(-90 100 100)"
        style={{ transition: 'stroke-dashoffset 100ms linear, stroke 300ms ease' }}
      />
    </svg>
  )
}

interface TimerDisplayProps {
  phase: TimerPhase
  displayTime: number
  inspectionElapsed: number
  pendingPenalty: Penalty
}

function getTimerColor(phase: TimerPhase, pendingPenalty: Penalty): string {
  if (phase === 'inspection') {
    if (pendingPenalty === 'DNF') return 'var(--penalty)'
    if (pendingPenalty === '+2') return 'var(--penalty)'
    return 'var(--inspection)'
  }
  if (phase === 'armed') return 'var(--positive)'
  if (phase === 'solving') return 'var(--timer-active)'
  if (phase === 'stopped') return 'var(--timer-active)'
  return 'var(--timer-idle)'
}

function getDisplayContent(
  phase: TimerPhase,
  displayTime: number,
  inspectionElapsed: number
): string {
  if (phase === 'idle') return 'READY'
  if (phase === 'armed') return '...'
  if (phase === 'inspection') {
    const remaining = Math.max(0, 15000 - inspectionElapsed)
    return String(Math.ceil(remaining / 1000))
  }
  return formatTime(displayTime)
}

function getScale(phase: TimerPhase): number {
  if (phase === 'armed') return 1.02
  return 1.0
}

function getFontSize(phase: TimerPhase): number {
  if (phase === 'idle' || phase === 'armed') return 72
  return 112
}

export function TimerDisplay({
  phase,
  displayTime,
  inspectionElapsed,
  pendingPenalty,
}: TimerDisplayProps) {
  const color = getTimerColor(phase, pendingPenalty)
  const content = getDisplayContent(phase, displayTime, inspectionElapsed)
  const scale = getScale(phase)
  const fontSize = getFontSize(phase)

  const isMonoFont = phase !== 'idle' && phase !== 'armed'

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        flex: 1,
        userSelect: 'none',
        WebkitUserSelect: 'none',
        touchAction: 'none',
      }}
    >
      <motion.div
        animate={{
          scale,
          color,
        }}
        transition={{
          scale: { duration: 0.15, ease: 'easeOut' },
          color: { duration: 0.2, ease: 'easeInOut' },
        }}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
        }}
      >
        {phase === 'inspection' && (
          <InspectionRing elapsed={inspectionElapsed} penalty={pendingPenalty} />
        )}
        <motion.span
          key={phase === 'idle' || phase === 'armed' ? 'label' : 'timer'}
          initial={{ opacity: 0.7 }}
          animate={
            phase === 'armed'
              ? {
                  opacity: 1,
                  fontSize,
                  textShadow: [
                    '0 0 20px rgba(34,211,238,0)',
                    '0 0 20px rgba(34,211,238,0.6)',
                    '0 0 20px rgba(34,211,238,0)',
                  ],
                }
              : { opacity: 1, fontSize }
          }
          transition={
            phase === 'armed'
              ? {
                  fontSize: { duration: 0.2, ease: 'easeOut' },
                  opacity: { duration: 0.15 },
                  textShadow: { duration: 1.2, repeat: Infinity, ease: 'easeInOut' },
                }
              : { fontSize: { duration: 0.2, ease: 'easeOut' }, opacity: { duration: 0.15 } }
          }
          style={{
            fontFamily: isMonoFont
              ? "'JetBrains Mono', monospace"
              : "'Plus Jakarta Sans', system-ui, sans-serif",
            fontWeight: 700,
            letterSpacing: isMonoFont ? '-0.04em' : '-0.01em',
            fontVariantNumeric: 'tabular-nums',
            lineHeight: 1,
            display: 'block',
          }}
        >
          {content}
        </motion.span>
      </motion.div>

      {/* Inspection penalty indicator */}
      {phase === 'inspection' && pendingPenalty && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            marginTop: 16,
            fontSize: 14,
            fontWeight: 600,
            letterSpacing: '0.08em',
            color: 'var(--penalty)',
          }}
        >
          {pendingPenalty === '+2' ? '+2 SECONDS' : 'DNF'}
        </motion.div>
      )}

      {/* Phase hint */}
      {phase === 'idle' && (
        <p
          style={{
            marginTop: 16,
            fontSize: 13,
            color: 'var(--text-muted)',
            fontWeight: 400,
          }}
        >
          Hold Space to begin inspection
        </p>
      )}

      {phase === 'armed' && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          style={{
            marginTop: 16,
            fontSize: 13,
            color: 'var(--positive)',
            fontWeight: 500,
          }}
        >
          Release to start
        </motion.p>
      )}
    </div>
  )
}
