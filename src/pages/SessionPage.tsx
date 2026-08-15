import { useMemo, useRef, useState } from 'react'
import { AnimatePresence } from 'framer-motion'
import { ScramblePanel } from '@/components/session/ScramblePanel'
import { TimerDisplay } from '@/components/session/TimerDisplay'
import { ManualTimeInput } from '@/components/session/ManualTimeInput'
import { SessionStatsBar } from '@/components/session/SessionStatsBar'
import { SessionSolveList } from '@/components/session/SessionSolveList'
import { PostSolveModal } from '@/components/session/PostSolveModal'
import { PostSolvePanel } from '@/components/session/PostSolvePanel'
import { useTimer, type TimerResult } from '@/hooks/useTimer'
import { useSession } from '@/hooks/useSession'
import { useScramble } from '@/hooks/useScramble'
import { useAudioContext } from '@/providers/AudioProvider'
import { useAuth } from '@/providers/AuthProvider'
import { useSolveHistory } from '@/hooks/useSolveHistory'
import { computeMean } from '@/lib/utils'
import { useXP } from '@/hooks/useXP'
import type { Penalty, Solve, WCAEvent, NotesBehavior } from '@/types'

const DEFAULT_NOTES_BEHAVIOR: NotesBehavior = 'soft'

export function SessionPage() {
  const [event, setEvent] = useState<WCAEvent>('333')
  const [showModal, setShowModal] = useState(false)
  const [isManualMode, setIsManualMode] = useState(() => localStorage.getItem('cubearena:manual-mode') === 'true')
  const [lastResult, setLastResult] = useState<TimerResult | null>(null)
  const [currentPenalty, setCurrentPenalty] = useState<Penalty>(null)
  const currentScrambleRef = useRef<string>('')

  const { scramble, next: nextScramble } = useScramble(event)
  const { playInspectionCallout, startAmbient, stopAmbient, isAmbientPlaying } = useAudioContext()
  const [soundEnabled, setSoundEnabled] = useState(() => localStorage.getItem('cubearena:sound-enabled') !== 'false')
  const soundEnabledRef = useRef(soundEnabled)
  soundEnabledRef.current = soundEnabled

  const handleToggleSound = () => {
    setSoundEnabled(prev => {
      const next = !prev
      localStorage.setItem('cubearena:sound-enabled', String(next))
      if (!next && isAmbientPlaying) stopAmbient()
      return next
    })
  }
  const { user } = useAuth()
  const { persistSolve, deleteSolve: persistDeleteSolve } = useSolveHistory(user?.uid)
  const { solves, ao5, ao12, mean, sessionId, addSolve, deleteSolve, clearSession } = useSession(event)
  const mo3 = useMemo(() => computeMean(solves, 3), [solves])
  const { addXP } = useXP()

  currentScrambleRef.current = scramble

  const handleSolveComplete = (result: TimerResult) => {
    setLastResult(result)
    setCurrentPenalty(result.pendingPenalty)
    setShowModal(true)
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

  // Ambient audio: start on inspection (if sound enabled), stop on idle/stopped/manual_entry
  const prevPhaseRef = useRef(phase)
  if (phase === 'inspection' && prevPhaseRef.current !== 'inspection' && soundEnabledRef.current) startAmbient()
  if (
    (phase === 'idle' || phase === 'stopped' || phase === 'manual_entry') &&
    (prevPhaseRef.current === 'solving' || prevPhaseRef.current === 'inspection' || prevPhaseRef.current === 'armed')
  ) stopAmbient()
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
    addXP(penalty === 'DNF' ? 5 : 15)
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
  const toggleManualMode = () => {
    if (phase !== 'idle') return
    setIsManualMode(p => {
      const next = !p
      localStorage.setItem('cubearena:manual-mode', String(next))
      return next
    })
  }

  const isIdle = phase === 'idle'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100dvh', backgroundColor: 'var(--bg)', overflow: 'hidden' }}>
      <ScramblePanel
        scramble={scramble}
        loading={false}
        event={event}
        onNewScramble={nextScramble}
        onEventChange={setEvent}
        soundEnabled={soundEnabled}
        onToggleSound={handleToggleSound}
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
        </div>

        {/* Right: solve list or post-solve panel (hidden on mobile via CSS) */}
        {(solves.length > 0 || showModal) && (
          <div
            className="session-solve-panel"
            style={{ width: 220, borderLeft: '1px solid var(--border)', flexShrink: 0 }}
          >
            {showModal && lastResult ? (
              <PostSolvePanel
                time={lastResult.time}
                penalty={currentPenalty}
                notesBehavior={DEFAULT_NOTES_BEHAVIOR}
                onPenaltyChange={setCurrentPenalty}
                onConfirm={handleConfirm}
              />
            ) : (
              <SessionSolveList
                solves={solves}
                onDeleteSolve={(id) => { deleteSolve(id); void persistDeleteSolve(id) }}
              />
            )}
          </div>
        )}
      </div>

      <SessionStatsBar solveCount={solves.length} ao5={ao5} ao12={ao12} mean={mean} mo3={mo3} event={event} onNewSession={clearSession} />

      {/* Mobile-only bottom sheet — desktop uses the inline panel */}
      <div className="session-modal-mobile">
        <PostSolveModal
          isOpen={showModal}
          time={lastResult?.time ?? 0}
          penalty={currentPenalty}
          notesBehavior={DEFAULT_NOTES_BEHAVIOR}
          onPenaltyChange={setCurrentPenalty}
          onConfirm={handleConfirm}
          onDismiss={handleModalDismiss}
        />
      </div>

      <style>{`
        @media (max-width: 767px) {
          .session-solve-panel { display: none !important; }
          .session-modal-mobile { display: block; }
        }
        @media (min-width: 768px) {
          .session-modal-mobile { display: none; }
        }
      `}</style>
    </div>
  )
}
