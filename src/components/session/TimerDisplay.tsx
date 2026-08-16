import { motion, AnimatePresence } from 'framer-motion'
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
    if (pendingPenalty === 'DNF' || pendingPenalty === '+2') return 'var(--penalty)'
    return 'var(--inspection)'
  }
  if (phase === 'armed') return 'var(--positive)'
  if (phase === 'solving') return 'var(--timer-active)'
  if (phase === 'stopped') return pendingPenalty ? 'var(--penalty)' : 'var(--positive)'
  return 'var(--timer-idle)'
}

function getContainerBg(phase: TimerPhase, pendingPenalty: Penalty): string {
  if (phase === 'armed') return 'rgba(34,211,238,0.04)'
  if (phase === 'solving') return 'rgba(34,211,238,0.02)'
  if (phase === 'stopped') return pendingPenalty ? 'rgba(239,68,68,0.04)' : 'rgba(34,197,94,0.05)'
  if (phase === 'inspection') return pendingPenalty ? 'rgba(239,68,68,0.04)' : 'rgba(251,191,36,0.03)'
  return 'var(--surface-0)'
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

function getFontSize(phase: TimerPhase): string {
  if (phase === 'idle' || phase === 'armed') return 'clamp(56px, 8vw, 96px)'
  return 'clamp(72px, 12vw, 148px)'
}

function getHintText(phase: TimerPhase): string | null {
  if (phase === 'idle') return 'Press Space to begin inspection'
  if (phase === 'armed') return 'Release to start'
  if (phase === 'inspection') return 'Release to start solving'
  if (phase === 'solving') return 'Press Space to stop'
  return null
}

export function TimerDisplay({
  phase,
  displayTime,
  inspectionElapsed,
  pendingPenalty,
}: TimerDisplayProps) {
  const color = getTimerColor(phase, pendingPenalty)
  const containerBg = getContainerBg(phase, pendingPenalty)
  const content = getDisplayContent(phase, displayTime, inspectionElapsed)
  const scale = getScale(phase)
  const fontSize = getFontSize(phase)
  const hintText = getHintText(phase)

  const isMonoFont = phase !== 'idle' && phase !== 'armed'
  const isArmed = phase === 'armed'
  const isInspection = phase === 'inspection'

  const borderColor = isArmed
    ? 'var(--positive)'
    : isInspection
      ? (pendingPenalty ? 'var(--penalty)' : 'var(--inspection)')
      : phase === 'stopped'
        ? (pendingPenalty ? 'var(--penalty)' : 'var(--positive)')
        : 'var(--border)'

  return (
    <motion.div
      animate={{ borderColor, backgroundColor: containerBg }}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        padding: '44px 24px 36px',
        backgroundColor: 'var(--surface-0)',
        border: '1px solid',
        borderColor: 'var(--border)',
        borderRadius: 16,
        userSelect: 'none',
        WebkitUserSelect: 'none',
        touchAction: 'none',
        gap: 0,
        position: 'relative',
        minHeight: 220,
      }}
    >
      {/* Main timer number */}
      <motion.div
        animate={{ scale, color }}
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
        {isInspection && (
          <InspectionRing elapsed={inspectionElapsed} penalty={pendingPenalty} />
        )}
        <motion.span
          key={phase === 'idle' || phase === 'armed' ? 'label' : 'timer'}
          initial={{ opacity: 0.7 }}
          animate={
            isArmed
              ? {
                  opacity: 1,
                  textShadow: [
                    '0 0 20px rgba(34,211,238,0)',
                    '0 0 20px rgba(34,211,238,0.6)',
                    '0 0 20px rgba(34,211,238,0)',
                  ],
                }
              : { opacity: 1 }
          }
          transition={
            isArmed
              ? {
                  opacity: { duration: 0.15 },
                  textShadow: { duration: 1.2, repeat: Infinity, ease: 'easeInOut' },
                }
              : { opacity: { duration: 0.15 } }
          }
          style={{
            fontSize,
            fontFamily: isMonoFont
              ? "'JetBrains Mono', monospace"
              : "'Plus Jakarta Sans', system-ui, sans-serif",
            fontWeight: 700,
            letterSpacing: isMonoFont ? '-0.04em' : '-0.01em',
            fontVariantNumeric: 'tabular-nums',
            lineHeight: 1,
            display: 'block',
            transition: 'font-size 0.2s ease-out',
          }}
        >
          {content}
        </motion.span>
      </motion.div>

      {/* Inspection penalty indicator */}
      {isInspection && pendingPenalty && (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            marginTop: 14,
            fontSize: 12,
            fontWeight: 700,
            letterSpacing: '0.1em',
            color: 'var(--penalty)',
            fontFamily: "'JetBrains Mono', monospace",
          }}
        >
          {pendingPenalty === '+2' ? '+2 SECONDS' : 'DNF'}
        </motion.div>
      )}

      {/* Stopped: pending penalty badge */}
      {phase === 'stopped' && pendingPenalty && (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            marginTop: 14,
            fontSize: 12,
            fontWeight: 700,
            letterSpacing: '0.1em',
            color: 'var(--penalty)',
            fontFamily: "'JetBrains Mono', monospace",
          }}
        >
          {pendingPenalty}
        </motion.div>
      )}

      {/* Phase hint */}
      <AnimatePresence mode="wait">
        {hintText && (
          <motion.p
            key={hintText}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            style={{
              margin: '16px 0 0',
              fontSize: 12,
              color: isArmed ? 'var(--positive)' : 'var(--text-muted)',
              fontWeight: isArmed ? 600 : 400,
              textAlign: 'center',
              letterSpacing: '0.02em',
            }}
          >
            {hintText}
          </motion.p>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
