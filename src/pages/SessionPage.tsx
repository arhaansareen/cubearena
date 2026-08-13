import { useMemo, useRef, useState } from 'react'
import { AnimatePresence } from 'framer-motion'
import { ScramblePanel } from '@/components/session/ScramblePanel'
import { TimerDisplay } from '@/components/session/TimerDisplay'
import { ManualTimeInput } from '@/components/session/ManualTimeInput'
import { AIOpponentRail } from '@/components/session/AIOpponentRail'
import { SessionStatsBar } from '@/components/session/SessionStatsBar'
import { SessionSolveList } from '@/components/session/SessionSolveList'
import { PostSolveModal } from '@/components/session/PostSolveModal'
import { useTimer, type TimerResult } from '@/hooks/useTimer'
import { useSession } from '@/hooks/useSession'
import { useScramble } from '@/hooks/useScramble'
import { useAudioContext } from '@/providers/AudioProvider'
import { useAuth } from '@/providers/AuthProvider'
import { useSolveHistory } from '@/hooks/useSolveHistory'
import { computeMean } from '@/lib/utils'
import type { AIOpponent, Penalty, Solve, WCAEvent, NotesBehavior } from '@/types'

const DEFAULT_AI_OPPONENTS: AIOpponent[] = [
  {
    id: 'ai-1',
    name: 'Felix',
    wcaId: null,
    avatarColor: '#7C3AED',
    targetMean: 8500,
    sigma: 700,
    currentTime: null,
    isFinished: false,
  },
  {
    id: 'ai-2',
    name: 'Max',
    wcaId: null,
    avatarColor: '#DC2626',
    targetMean: 11000,
    sigma: 1200,
    currentTime: null,
    isFinished: false,
  },
]

const DEFAULT_NOTES_BEHAVIOR: NotesBehavior = 'soft'

export function SessionPage() {
  const [event, setEvent] = useState<WCAEvent>('333')
  const [showAI] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [isManualMode, setIsManualMode] = useState(false)
  const [lastResult, setLastResult] = useState<TimerResult | null>(null)
  const [currentPenalty, setCurrentPenalty] = useState<Penalty>(null)
  const currentScrambleRef = useRef<string>('')
  const solveStartTimeRef = useRef<number | null>(null)

  const { scramble, next: nextScramble } = useScramble(event)
  const { playInspectionCallout, startAmbient, stopAmbient } = useAudioContext()
  const { user } = useAuth()
  const { persistSolve } = useSolveHistory(user?.uid)
  const { solves, ao5, ao12, mean, sessionId, addSolve, deleteLastSolve } = useSession()
  const mo3 = useMemo(() => computeMean(solves, 3), [solves])

  currentScrambleRef.current = scramble

  const handleSolveComplete = (result: TimerResult) => {
    setLastResult(result)
    setCurrentPenalty(result.pendingPenalty)
    setShowModal(true)
    if (isManualMode) setIsManualMode(false)
  }

  const {
    phase,
    displayTime,
    inspectionElapsed,
    pendingPenalty,
    confirmManualTime,
    reset,
  } = useTimer({
    onCallout: playInspectionCallout,
    onSolveComplete: handleSolveComplete,
    mode: isManualMode ? 'manual' : 'live',
  })

  // Ambient audio: start on inspection, stop on idle/stopped/manual_entry
  const prevPhaseRef = useRef(phase)
  if (phase === 'inspection' && prevPhaseRef.current === 'armed') startAmbient()
  if (
    (phase === 'idle' || phase === 'stopped' || phase === 'manual_entry') &&
    (prevPhaseRef.current === 'solving' || prevPhaseRef.current === 'inspection' || prevPhaseRef.current === 'armed')
  ) stopAmbient()
  if (phase === 'solving' && prevPhaseRef.current !== 'solving') solveStartTimeRef.current = performance.now()
  if (phase === 'idle' && prevPhaseRef.current !== 'idle') solveStartTimeRef.current = null
  prevPhaseRef.current = phase

  const handleConfirm = (notes: string | null, tags: string[]) => {
    if (!lastResult) return
    const penalty = currentPenalty
    const effectiveTime =
      penalty === 'DNF' ? Infinity : penalty === '+2' ? lastResult.time + 2000 : lastResult.time
    const solve: Solve = {
      id: lastResult.id,
      sessionId,
      event,
      time: lastResult.time,
      penalty,
      effectiveTime,
      scramble: currentScrambleRef.current,
      inspectionTime: lastResult.inspectionTime,
      timestamp: lastResult.timestamp,
      notes,
      tags,
    }
    addSolve(solve)
    void persistSolve(solve)
    nextScramble()
    setShowModal(false)
    setLastResult(null)
    setCurrentPenalty(null)
  }

  const handleModalDismiss = () => {
    if (!lastResult) return
    const penalty = currentPenalty
    const effectiveTime =
      penalty === 'DNF' ? Infinity : penalty === '+2' ? lastResult.time + 2000 : lastResult.time
    const solve: Solve = {
      id: lastResult.id,
      sessionId,
      event,
      time: lastResult.time,
      penalty,
      effectiveTime,
      scramble: currentScrambleRef.current,
      inspectionTime: lastResult.inspectionTime,
      timestamp: lastResult.timestamp,
      notes: null,
      tags: [],
    }
    addSolve(solve)
    void persistSolve(solve)
    nextScramble()
    setShowModal(false)
    setLastResult(null)
    setCurrentPenalty(null)
  }

  const handleManualConfirm = (ms: number) => { confirmManualTime(ms) }
  const handleManualCancel = () => { reset(); setIsManualMode(false) }
  const toggleManualMode = () => { if (phase === 'idle') setIsManualMode((p) => !p) }

  const isIdle = phase === 'idle'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100dvh', backgroundColor: 'var(--bg)', overflow: 'hidden' }}>
      <ScramblePanel
        scramble={scramble}
        loading={false}
        event={event}
        onNewScramble={nextScramble}
        onEventChange={setEvent}
      />

      {/* Content row: timer (left) + solve list (right, desktop only) */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

        {/* Left: timer area + AI rail */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
            <AnimatePresence mode="wait">
              {phase === 'manual_entry' ? (
                <ManualTimeInput
                  key="manual-input"
                  pendingPenalty={pendingPenalty}
                  onConfirm={handleManualConfirm}
                  onCancel={handleManualCancel}
                />
              ) : (
                <TimerDisplay
                  key="live-timer"
                  phase={phase}
                  displayTime={displayTime}
                  inspectionElapsed={inspectionElapsed}
                  pendingPenalty={pendingPenalty}
                />
              )}
            </AnimatePresence>

            {/* Solve count */}
            {solves.length > 0 && phase !== 'manual_entry' && (
              <div style={{ position: 'absolute', top: 16, right: 24, fontSize: 12, color: 'var(--text-muted)', fontWeight: 500 }}>
                #{solves.length + 1}
              </div>
            )}

            {/* Manual mode toggle */}
            {isIdle && (
              <button
                onClick={toggleManualMode}
                style={{
                  position: 'absolute', bottom: 16, left: 24,
                  display: 'flex', alignItems: 'center', gap: 6,
                  background: isManualMode ? 'var(--accent-dim)' : 'none',
                  border: `1px solid ${isManualMode ? 'var(--accent)' : 'var(--border)'}`,
                  borderRadius: 8, padding: '6px 12px',
                  color: isManualMode ? 'var(--accent)' : 'var(--text-muted)',
                  fontSize: 12, fontWeight: 500, cursor: 'pointer',
                  transition: 'all 150ms ease',
                }}
                onMouseOver={(e) => { if (!isManualMode) { e.currentTarget.style.color = 'var(--text-primary)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)' } }}
                onMouseOut={(e) => { if (!isManualMode) { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.borderColor = 'var(--border)' } }}
              >
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                  <path d="M2 6h8M6 2v8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
                {isManualMode ? 'Manual ON' : 'Manual entry'}
              </button>
            )}
          </div>

          {showAI && (
            <AIOpponentRail
              opponents={DEFAULT_AI_OPPONENTS}
              phase={phase}
              solveStartTime={solveStartTimeRef.current}
            />
          )}
        </div>

        {/* Right: solve list (hidden on mobile via CSS) */}
        {solves.length > 0 && (
          <div
            className="session-solve-panel"
            style={{ width: 220, borderLeft: '1px solid var(--border)', flexShrink: 0 }}
          >
            <SessionSolveList solves={solves} onDeleteLast={deleteLastSolve} />
          </div>
        )}
      </div>

      <SessionStatsBar solveCount={solves.length} ao5={ao5} ao12={ao12} mean={mean} mo3={mo3} event={event} />

      <PostSolveModal
        isOpen={showModal}
        time={lastResult?.time ?? 0}
        penalty={currentPenalty}
        notesBehavior={DEFAULT_NOTES_BEHAVIOR}
        onPenaltyChange={setCurrentPenalty}
        onConfirm={handleConfirm}
        onDismiss={handleModalDismiss}
      />

      <style>{`
        @media (max-width: 767px) {
          .session-solve-panel { display: none !important; }
        }
      `}</style>
    </div>
  )
}
