import { motion } from 'framer-motion'
import type { TimerPhase, Penalty } from '@/types'
import { formatTime } from '@/lib/utils'

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
  if (phase === 'idle' || phase === 'armed') return 48
  if (phase === 'inspection') return 112
  return 96
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
        }}
      >
        <motion.span
          key={phase === 'idle' || phase === 'armed' ? 'label' : 'timer'}
          initial={{ opacity: 0.7 }}
          animate={{ opacity: 1, fontSize }}
          transition={{ fontSize: { duration: 0.2, ease: 'easeOut' }, opacity: { duration: 0.15 } }}
          style={{
            fontFamily: isMonoFont
              ? "'JetBrains Mono', monospace"
              : "'Inter', system-ui, sans-serif",
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
