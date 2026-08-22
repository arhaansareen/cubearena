import { useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence } from 'framer-motion'
import { ScramblePanel } from '@/components/session/ScramblePanel'
import { TimerDisplay } from '@/components/session/TimerDisplay'
import { ManualTimeInput } from '@/components/session/ManualTimeInput'
import { SessionStatsBar } from '@/components/session/SessionStatsBar'
import { SessionSolveList } from '@/components/session/SessionSolveList'
import { PostSolveModal } from '@/components/session/PostSolveModal'
import { PostSolvePanel } from '@/components/session/PostSolvePanel'
import { InsightsModal } from '@/components/session/InsightsModal'
import { SessionPicker } from '@/components/session/SessionPicker'
import { KeyboardShortcutsModal } from '@/components/session/KeyboardShortcutsModal'
import { useTimer, type TimerResult } from '@/hooks/useTimer'
import { useSession } from '@/hooks/useSession'
import { useScramble } from '@/hooks/useScramble'
import { useAudioContext } from '@/providers/AudioProvider'
import { useAuth } from '@/providers/AuthProvider'
import { useProfile } from '@/providers/ProfileProvider'
import { useSolveHistory } from '@/hooks/useSolveHistory'
import { computeAo, computeMean } from '@/lib/utils'
import { useXP } from '@/hooks/useXP'
import { useCalendar } from '@/hooks/useCalendar'
import type { Penalty, Solve, WCAEvent, NotesBehavior } from '@/types'

const DEFAULT_NOTES_BEHAVIOR: NotesBehavior = 'soft'

export function SessionPage() {
  const [event, setEvent] = useState<WCAEvent>(
    () => (localStorage.getItem('cubearena:last-event') as WCAEvent) || '333'
  )
  const [holdThreshold] = useState(() => {
    const stored = parseInt(localStorage.getItem('cubearena:hold-threshold') ?? '350')
    return isNaN(stored) ? 350 : stored
  })
  const [inspectionEnabled, setInspectionEnabled] = useState(
    () => localStorage.getItem('cubearena:inspection-enabled') !== 'false'
  )
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === 'cubearena:inspection-enabled') {
        setInspectionEnabled(e.newValue !== 'false')
      }
    }
    const onCustom = () => {
      setInspectionEnabled(localStorage.getItem('cubearena:inspection-enabled') !== 'false')
    }
    window.addEventListener('storage', onStorage)
    window.addEventListener('cubearena:settings-changed', onCustom)
    return () => {
      window.removeEventListener('storage', onStorage)
      window.removeEventListener('cubearena:settings-changed', onCustom)
    }
  }, [])
  const [showModal, setShowModal] = useState(false)
  const [showInsights, setShowInsights] = useState(false)
  const [showShortcuts, setShowShortcuts] = useState(false)
  const [isManualMode, setIsManualMode] = useState(() => localStorage.getItem('cubearena:manual-mode') === 'true')
  const [lastResult, setLastResult] = useState<TimerResult | null>(null)
  const [currentPenalty, setCurrentPenalty] = useState<Penalty>(null)
  const currentScrambleRef = useRef<string>('')
  const pendingScrambleRef = useRef<string>('')

  const { scramble, next: nextScramble, prev: prevScramble, canGoPrev, canGoForward } = useScramble(event)
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
  const { profile } = useProfile()
  const { persistSolve, deleteSolve: persistDeleteSolve, solves: allSolves } = useSolveHistory(user?.uid)
  const {
    solves, ao5, ao12, ao50, ao100,
    bestAo5, bestAo12, bestAo50, bestAo100,
    mean, sessionId,
    sessions, activeSessionId,
    addSolve, deleteSolve,
    createSession, switchSession, renameSession, deleteSession,
  } = useSession(event)
  const mo3 = useMemo(() => computeMean(solves, 3), [solves])
  const { addXP } = useXP()
  const { logActivity } = useCalendar()

  currentScrambleRef.current = scramble

  const flushSolve = (result: TimerResult, penalty: Penalty, scramble: string, notes: string | null, tags: string[]) => {
    const effectiveTime = penalty === 'DNF' ? Infinity : penalty === '+2' ? result.time + 2000 : result.time
    const solve: Solve = {
      id: result.id, sessionId, event,
      time: result.time, penalty, effectiveTime,
      scramble, inspectionTime: result.inspectionTime,
      timestamp: result.timestamp, notes, tags,
    }
    addSolve(solve)
    void persistSolve(solve)
    addXP(penalty === 'DNF' ? 5 : 15)
    const updatedSolves = [...solves, solve]
    const dateKey = new Date().toISOString().slice(0, 10)
    const updatedAo5 = computeAo(updatedSolves, 5)
    const validSolves = updatedSolves.filter(s => isFinite(s.effectiveTime))
    const updatedMean = validSolves.length > 0
      ? validSolves.reduce((a, s) => a + s.effectiveTime, 0) / validSolves.length : null
    logActivity(dateKey, updatedSolves.length, updatedAo5, updatedMean, [event])
    return solve
  }

  const handleSolveComplete = (result: TimerResult) => {
    if (lastResult) {
      flushSolve(lastResult, currentPenalty, pendingScrambleRef.current, null, [])
      nextScramble()
    }
    pendingScrambleRef.current = currentScrambleRef.current
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
    holdThresholdMs: holdThreshold,
    inspectionEnabled,
  })

  const prevPhaseRef = useRef(phase)
  if (phase === 'inspection' && prevPhaseRef.current !== 'inspection' && soundEnabledRef.current) startAmbient()
  if (
    (phase === 'idle' || phase === 'stopped' || phase === 'manual_entry') &&
    (prevPhaseRef.current === 'solving' || prevPhaseRef.current === 'inspection' || prevPhaseRef.current === 'armed')
  ) stopAmbient()
  prevPhaseRef.current = phase

  const handleConfirm = (notes: string | null, tags: string[]) => {
    if (!lastResult) return
    flushSolve(lastResult, currentPenalty, pendingScrambleRef.current, notes, tags)
    nextScramble()
    setShowModal(false)
    setLastResult(null)
    setCurrentPenalty(null)
  }

  const handleModalDismiss = () => {
    if (!lastResult) return
    flushSolve(lastResult, currentPenalty, pendingScrambleRef.current, null, [])
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

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const tag = (document.activeElement as HTMLElement)?.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA') return
      if (e.key === '?') setShowShortcuts(p => !p)
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100dvh', backgroundColor: 'var(--bg)', overflow: 'hidden' }}>
      <ScramblePanel
        scramble={scramble}
        loading={false}
        event={event}
        onNextScramble={nextScramble}
        onPrevScramble={prevScramble}
        canGoPrev={canGoPrev}
        canGoForward={canGoForward}
        onEventChange={(e) => { setEvent(e); localStorage.setItem('cubearena:last-event', e) }}
        soundEnabled={soundEnabled}
        onToggleSound={handleToggleSound}
        onInsights={() => setShowInsights(true)}
      />

      {/* Content row: timer (left) + solve list (right, desktop only) */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

        {/* Left: timer area */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{ padding: '8px 16px', display: 'flex', alignItems: 'center', borderBottom: '1px solid var(--border)' }}>
            <SessionPicker
              sessions={sessions}
              activeSessionId={activeSessionId}
              onSwitch={switchSession}
              onCreate={() => createSession()}
              onRename={renameSession}
              onDelete={deleteSession}
            />
          </div>
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
            <AnimatePresence mode="wait">
              {phase === 'manual_entry' ? (
                <ManualTimeInput
                  key="manual-input"
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
                  inspectionEnabled={inspectionEnabled}
                />
              )}
            </AnimatePresence>

            {solves.length > 0 && phase !== 'manual_entry' && (
              <div style={{ position: 'absolute', top: 16, right: 24, fontSize: 12, color: 'var(--text-muted)', fontWeight: 500 }}>
                #{solves.length + 1}
              </div>
            )}

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
                  fontSize: 12, fontWeight: isManualMode ? 600 : 500, cursor: 'pointer',
                  transition: 'background-color 150ms ease, border-color 150ms ease, color 150ms ease',
                }}
                onMouseOver={(e) => { if (!isManualMode) { e.currentTarget.style.color = 'var(--text-primary)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)' } }}
                onMouseOut={(e) => { if (!isManualMode) { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.borderColor = 'var(--border)' } }}
              >
                {isManualMode && (
                  <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: 'var(--accent)', display: 'inline-block', flexShrink: 0 }} />
                )}
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                  <path d="M2 6h8M6 2v8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
                {isManualMode ? 'Manual ON' : 'Manual entry'}
              </button>
            )}

            {isIdle && (
              <button
                onClick={() => setShowShortcuts(true)}
                title="Keyboard shortcuts (?)"
                style={{
                  position: 'absolute', bottom: 16, right: 24,
                  width: 30, height: 30, borderRadius: '50%',
                  border: '1px solid var(--border)',
                  background: 'none',
                  color: 'var(--text-muted)',
                  fontSize: 14, fontWeight: 600,
                  fontFamily: "'JetBrains Mono', monospace",
                  cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'color 150ms ease, border-color 150ms ease',
                }}
                onMouseOver={(e) => { e.currentTarget.style.color = 'var(--text-primary)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)' }}
                onMouseOut={(e) => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.borderColor = 'var(--border)' }}
              >
                ?
              </button>
            )}
          </div>
        </div>

        {/* Right: solve list always visible on desktop */}
        <div
          className="session-solve-panel"
          style={{ width: 230, borderLeft: '1px solid var(--border)', flexShrink: 0 }}
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
              event={event}
              onDeleteSolve={(id) => { deleteSolve(id); void persistDeleteSolve(id) }}
            />
          )}
        </div>
      </div>

      <SessionStatsBar
        solves={solves}
        ao5={ao5}
        ao12={ao12}
        ao50={ao50}
        ao100={ao100}
        bestAo5={bestAo5}
        bestAo12={bestAo12}
        bestAo50={bestAo50}
        bestAo100={bestAo100}
        mean={mean}
        mo3={mo3}
        event={event}
        onNewSession={createSession}
      />

      {/* Mobile-only bottom sheet */}
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

      <InsightsModal
        isOpen={showInsights}
        onClose={() => setShowInsights(false)}
        solves={solves}
        allSolves={allSolves}
        event={event}
        wcaId={profile?.wcaId}
      />

      <KeyboardShortcutsModal
        isOpen={showShortcuts}
        onClose={() => setShowShortcuts(false)}
      />

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
