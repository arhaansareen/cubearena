import { useCallback, useEffect, useRef, useState } from 'react'
import type { TimerPhase, Penalty } from '@/types'
import { generateId } from '@/lib/utils'

export interface TimerResult {
  id: string
  time: number
  inspectionTime: number
  pendingPenalty: Penalty
  timestamp: number
}

export interface UseTimerOptions {
  onCallout?: (seconds: '8' | '12') => void
  onSolveComplete?: (result: TimerResult) => void
  // 'manual' mode: inspection runs identically; at the point where the live
  // timer would start, the phase becomes 'manual_entry' instead of 'solving'.
  mode?: 'live' | 'manual'
}

export interface UseTimerReturn {
  phase: TimerPhase
  displayTime: number
  inspectionElapsed: number
  pendingPenalty: Penalty
  startInspection: () => void
  arm: () => void
  startSolve: () => void
  stopSolve: () => TimerResult | null
  // Used in manual mode to submit the typed time and fire onSolveComplete.
  confirmManualTime: (ms: number) => TimerResult | null
  reset: () => void
}

const HOLD_THRESHOLD_MS = 300
const INSPECTION_LIMIT_MS = 15000
const DNF_LIMIT_MS = 17000

export function useTimer(options: UseTimerOptions = {}): UseTimerReturn {
  const { onCallout, onSolveComplete } = options

  // Use refs for mode and callbacks to avoid stale closures inside
  // the event handlers without needing to change their dependency arrays.
  const modeRef = useRef(options.mode ?? 'live')
  modeRef.current = options.mode ?? 'live'
  const onSolveCompleteRef = useRef(onSolveComplete)
  onSolveCompleteRef.current = onSolveComplete

  const [phase, setPhase] = useState<TimerPhase>('idle')
  const [displayTime, setDisplayTime] = useState(0)
  const [inspectionElapsed, setInspectionElapsed] = useState(0)
  const [pendingPenalty, setPendingPenalty] = useState<Penalty>(null)

  const holdStartRef = useRef<number | null>(null)
  const holdTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const solveStartRef = useRef<number | null>(null)
  const inspectionStartRef = useRef<number | null>(null)
  const rafRef = useRef<number | null>(null)
  const callout8FiredRef = useRef(false)
  const callout12FiredRef = useRef(false)
  const phaseRef = useRef<TimerPhase>('idle')
  const pendingPenaltyRef = useRef<Penalty>(null)

  useEffect(() => {
    phaseRef.current = phase
  }, [phase])

  const clearRaf = useCallback(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current)
      rafRef.current = null
    }
  }, [])

  const clearHoldTimer = useCallback(() => {
    if (holdTimerRef.current !== null) {
      clearTimeout(holdTimerRef.current)
      holdTimerRef.current = null
    }
  }, [])

  const reset = useCallback(() => {
    clearRaf()
    clearHoldTimer()
    holdStartRef.current = null
    solveStartRef.current = null
    inspectionStartRef.current = null
    pendingPenaltyRef.current = null
    callout8FiredRef.current = false
    callout12FiredRef.current = false
    setPhase('idle')
    phaseRef.current = 'idle'
    setDisplayTime(0)
    setInspectionElapsed(0)
    setPendingPenalty(null)
  }, [clearRaf, clearHoldTimer])

  const startInspectionLoop = useCallback(() => {
    callout8FiredRef.current = false
    callout12FiredRef.current = false

    const tick = () => {
      if (phaseRef.current !== 'inspection') return

      const now = performance.now()
      const elapsed = now - (inspectionStartRef.current ?? now)
      setInspectionElapsed(elapsed)

      if (!callout8FiredRef.current && elapsed >= 8000) {
        callout8FiredRef.current = true
        onCallout?.('8')
      }
      if (!callout12FiredRef.current && elapsed >= 12000) {
        callout12FiredRef.current = true
        onCallout?.('12')
      }

      if (elapsed >= INSPECTION_LIMIT_MS && pendingPenaltyRef.current === null) {
        pendingPenaltyRef.current = '+2'
        setPendingPenalty('+2')
      }

      if (elapsed >= DNF_LIMIT_MS && pendingPenaltyRef.current !== 'DNF') {
        pendingPenaltyRef.current = 'DNF'
        setPendingPenalty('DNF')
      }

      rafRef.current = requestAnimationFrame(tick)
    }

    rafRef.current = requestAnimationFrame(tick)
  }, [onCallout])

  const startSolveLoop = useCallback(() => {
    const tick = () => {
      if (phaseRef.current !== 'solving') return

      const now = performance.now()
      const elapsed = now - (solveStartRef.current ?? now)
      setDisplayTime(elapsed)

      rafRef.current = requestAnimationFrame(tick)
    }

    rafRef.current = requestAnimationFrame(tick)
  }, [])

  const startInspection = useCallback(() => {
    clearRaf()
    inspectionStartRef.current = performance.now()
    pendingPenaltyRef.current = null
    setPendingPenalty(null)
    setInspectionElapsed(0)
    setPhase('inspection')
    phaseRef.current = 'inspection'
    startInspectionLoop()
  }, [clearRaf, startInspectionLoop])

  const arm = useCallback(() => {
    clearRaf()
    setPhase('armed')
    phaseRef.current = 'armed'
  }, [clearRaf])

  const startSolve = useCallback(() => {
    clearRaf()
    solveStartRef.current = performance.now()
    setDisplayTime(0)
    setPhase('solving')
    phaseRef.current = 'solving'
    startSolveLoop()
  }, [clearRaf, startSolveLoop])

  // Called when armed+released during inspection in manual mode.
  // Stops the inspection loop and waits for the user to type a time.
  const enterManualEntry = useCallback(() => {
    clearRaf()
    setPhase('manual_entry')
    phaseRef.current = 'manual_entry'
  }, [clearRaf])

  const stopSolve = useCallback((): TimerResult | null => {
    if (phaseRef.current !== 'solving') return null

    clearRaf()
    const now = performance.now()
    const rawTime = now - (solveStartRef.current ?? now)
    const inspTime = inspectionStartRef.current
      ? (solveStartRef.current ?? now) - inspectionStartRef.current
      : 0

    const result: TimerResult = {
      id: generateId(),
      time: rawTime,
      inspectionTime: Math.min(inspTime, INSPECTION_LIMIT_MS),
      pendingPenalty: pendingPenaltyRef.current,
      timestamp: Date.now(),
    }

    setDisplayTime(rawTime)
    setPhase('stopped')
    phaseRef.current = 'stopped'
    onSolveCompleteRef.current?.(result)

    setTimeout(() => {
      if (phaseRef.current === 'stopped') {
        setPhase('idle')
        phaseRef.current = 'idle'
        setDisplayTime(0)
        setPendingPenalty(null)
        pendingPenaltyRef.current = null
        setInspectionElapsed(0)
        inspectionStartRef.current = null
        solveStartRef.current = null
      }
    }, 3000)

    return result
  }, [clearRaf])

  // Submit a manually entered time. Carries inspection penalty through
  // (if the user overstayed inspection, the +2/DNF applies to the manual time too).
  const confirmManualTime = useCallback((ms: number): TimerResult | null => {
    if (phaseRef.current !== 'manual_entry') return null

    const inspTime = inspectionStartRef.current
      ? Math.min(performance.now() - inspectionStartRef.current, INSPECTION_LIMIT_MS)
      : 0

    const result: TimerResult = {
      id: generateId(),
      time: ms,
      inspectionTime: inspTime,
      pendingPenalty: pendingPenaltyRef.current,
      timestamp: Date.now(),
    }

    setDisplayTime(ms)
    setPhase('stopped')
    phaseRef.current = 'stopped'
    onSolveCompleteRef.current?.(result)

    setTimeout(() => {
      if (phaseRef.current === 'stopped') {
        setPhase('idle')
        phaseRef.current = 'idle'
        setDisplayTime(0)
        setPendingPenalty(null)
        pendingPenaltyRef.current = null
        setInspectionElapsed(0)
        inspectionStartRef.current = null
        solveStartRef.current = null
      }
    }, 3000)

    return result
  }, [])

  // The decision point: armed + released after inspection.
  // In live mode: start the solve clock.
  // In manual mode: enter the time-entry phase.
  const dispatchFromArmed = useCallback(() => {
    const wasInInspection = inspectionStartRef.current !== null
    if (!wasInInspection) {
      startInspection()
      return
    }
    if (modeRef.current === 'manual') {
      enterManualEntry()
    } else {
      startSolve()
    }
  }, [startInspection, startSolve, enterManualEntry])

  // Keyboard handling
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code !== 'Space') return
      if (e.repeat) return

      const current = phaseRef.current

      // Don't intercept spacebar while the user is typing
      if (current === 'manual_entry') return
      const tag = (document.activeElement as HTMLElement)?.tagName
      if (tag === 'TEXTAREA' || tag === 'INPUT') return

      e.preventDefault()

      if (current === 'solving') {
        stopSolve()
        return
      }

      if (current === 'stopped') return
      if (holdStartRef.current !== null) return

      holdStartRef.current = performance.now()

      if (current === 'inspection' || current === 'idle') {
        holdTimerRef.current = setTimeout(() => {
          if (phaseRef.current === current) {
            arm()
          }
        }, HOLD_THRESHOLD_MS)
      }
    }

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code !== 'Space') return

      const current = phaseRef.current
      if (current === 'manual_entry') return
      const tag = (document.activeElement as HTMLElement)?.tagName
      if (tag === 'TEXTAREA' || tag === 'INPUT') return

      e.preventDefault()

      holdStartRef.current = null
      clearHoldTimer()

      if (current === 'armed') {
        dispatchFromArmed()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [arm, clearHoldTimer, dispatchFromArmed, stopSolve])

  // Touch handling
  useEffect(() => {
    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length !== 1) return

      const current = phaseRef.current
      if (current === 'manual_entry') return

      if (current === 'solving') {
        e.preventDefault()
        stopSolve()
        return
      }

      if (current === 'stopped') return
      if (holdStartRef.current !== null) return

      holdStartRef.current = performance.now()

      if (current === 'inspection' || current === 'idle') {
        holdTimerRef.current = setTimeout(() => {
          if (phaseRef.current === current) {
            arm()
          }
        }, HOLD_THRESHOLD_MS)
      }
    }

    const handleTouchEnd = () => {
      const current = phaseRef.current
      if (current === 'manual_entry') return

      holdStartRef.current = null
      clearHoldTimer()

      if (current === 'armed') {
        dispatchFromArmed()
      }
    }

    window.addEventListener('touchstart', handleTouchStart, { passive: false })
    window.addEventListener('touchend', handleTouchEnd)

    return () => {
      window.removeEventListener('touchstart', handleTouchStart)
      window.removeEventListener('touchend', handleTouchEnd)
    }
  }, [arm, clearHoldTimer, dispatchFromArmed, stopSolve])

  useEffect(() => {
    return () => {
      clearRaf()
      clearHoldTimer()
    }
  }, [clearRaf, clearHoldTimer])

  return {
    phase,
    displayTime,
    inspectionElapsed,
    pendingPenalty,
    startInspection,
    arm,
    startSolve,
    stopSolve,
    confirmManualTime,
    reset,
  }
}
