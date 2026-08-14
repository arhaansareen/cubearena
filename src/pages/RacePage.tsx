import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '@/providers/AuthProvider'
import { useProfile } from '@/providers/ProfileProvider'
import { useRaceRoom, type RaceParticipant, type RaceFormat, computeFinalResult, FORMAT_ROUNDS } from '@/hooks/useRaceRoom'
import { ScrambleViz } from '@/components/session/ScrambleViz'
import { EventTabs } from '@/components/session/EventTabs'
import { formatTime } from '@/lib/utils'
import type { WCAEvent } from '@/types'

const EVENT_LABELS: Record<string, string> = {
  '333': '3×3', '222': '2×2', '444': '4×4', '555': '5×5',
  '333oh': 'OH', 'pyram': 'Pyraminx', 'skewb': 'Skewb',
}

const FORMAT_OPTIONS: { value: RaceFormat; label: string; description: string }[] = [
  { value: 'solo', label: 'Solve by solve',  description: 'One solve, host restarts each round' },
  { value: 'bo3',  label: 'Best of 3',       description: '3 solves — lowest single wins' },
  { value: 'bo5',  label: 'Best of 5',       description: '5 solves — lowest single wins' },
  { value: 'mo3',  label: 'Mean of 3',       description: '3 solves — mean of all 3' },
  { value: 'ao5',  label: 'Average of 5',    description: '5 solves — drop best & worst' },
]
const FORMAT_LABELS: Record<RaceFormat, string> = {
  solo: 'Solve by solve', bo3: 'Best of 3', bo5: 'Best of 5', mo3: 'Mean of 3', ao5: 'Avg of 5',
}

const selectStyle: React.CSSProperties = {
  width: '100%', padding: '10px 12px',
  backgroundColor: 'var(--surface-1)', border: '1px solid var(--border)',
  borderRadius: 8, color: 'var(--text-primary)', fontSize: 14,
  outline: 'none', cursor: 'pointer', appearance: 'none',
  backgroundImage: `url("data:image/svg+xml,%3Csvg width='12' height='8' viewBox='0 0 12 8' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%2364748b' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`,
  backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center',
  paddingRight: 36, transition: 'border-color 150ms ease',
}

// ─── Race timer ───────────────────────────────────────────────────────────────

type TimerPhase = 'locked' | 'idle' | 'armed' | 'running' | 'done'

function useRaceTimer(unlockAt: number | null) {
  const [phase, setPhase] = useState<TimerPhase>('locked')
  const [elapsed, setElapsed] = useState(0)
  const [countdown, setCountdown] = useState(0)
  const startRef = useRef<number | null>(null)
  const rafRef = useRef<number>(0)
  const phaseRef = useRef<TimerPhase>('locked')
  phaseRef.current = phase

  // countdown tick
  useEffect(() => {
    if (!unlockAt) return
    const tick = () => {
      const remaining = unlockAt - Date.now()
      if (remaining <= 0) {
        setCountdown(0)
        setPhase(p => p === 'locked' ? 'idle' : p)
        return
      }
      setCountdown(Math.ceil(remaining / 1000))
      rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafRef.current)
  }, [unlockAt])

  // solve tick
  const runTick = useCallback(() => {
    if (startRef.current) setElapsed(Date.now() - startRef.current)
    rafRef.current = requestAnimationFrame(runTick)
  }, [])

  const onKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.code !== 'Space' || e.repeat) return
    e.preventDefault()
    if (phaseRef.current === 'idle') setPhase('armed')
    if (phaseRef.current === 'running') {
      cancelAnimationFrame(rafRef.current)
      const final = startRef.current ? Date.now() - startRef.current : 0
      setElapsed(final)
      setPhase('done')
    }
  }, [])

  const onKeyUp = useCallback((e: KeyboardEvent) => {
    if (e.code !== 'Space') return
    if (phaseRef.current === 'armed') {
      startRef.current = Date.now()
      setPhase('running')
      rafRef.current = requestAnimationFrame(runTick)
    }
  }, [runTick])

  useEffect(() => {
    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
      cancelAnimationFrame(rafRef.current)
    }
  }, [onKeyDown, onKeyUp])

  const reset = useCallback(() => {
    cancelAnimationFrame(rafRef.current)
    startRef.current = null
    setElapsed(0)
    setPhase(unlockAt && unlockAt > Date.now() ? 'locked' : 'idle')
  }, [unlockAt])

  return { phase, elapsed, countdown, reset }
}

// ─── Components ───────────────────────────────────────────────────────────────

function Avatar({ name, color }: { name: string; color: string }) {
  const initials = name.trim().split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase() || '?'
  return (
    <div style={{
      width: 36, height: 36, borderRadius: '50%', backgroundColor: color,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: 13, fontWeight: 700, color: '#fff',
      fontFamily: "'JetBrains Mono', monospace", flexShrink: 0,
    }}>
      {initials}
    </div>
  )
}

const AVATAR_COLORS = ['#7C3AED', '#DC2626', '#D97706', '#059669', '#2563EB', '#DB2777']
function avatarColor(uid: string) {
  const n = uid.split('').reduce((a, c) => a + c.charCodeAt(0), 0)
  return AVATAR_COLORS[n % AVATAR_COLORS.length]
}

function ParticipantRow({ p, isMe, phase }: { p: RaceParticipant; isMe: boolean; phase: string }) {
  const done = p.finishedAt !== null
  const dnf = p.penalty === 'DNF'
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10,
      padding: '10px 14px', borderRadius: 10,
      backgroundColor: isMe ? 'var(--accent-dim)' : 'var(--surface-1)',
      border: `1px solid ${isMe ? 'var(--accent)' : 'var(--border)'}`,
    }}>
      <Avatar name={p.displayName} color={avatarColor(p.uid)} />
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>
          {p.displayName}{isMe ? ' (you)' : ''}
        </div>
        {phase === 'lobby' && (
          <div style={{ fontSize: 12, color: p.isReady ? 'var(--positive)' : 'var(--text-muted)', marginTop: 2 }}>
            {p.isReady ? '✓ Ready' : 'Not ready'}
          </div>
        )}
      </div>
      {phase === 'solving' && (
        <div style={{ fontSize: 13, fontFamily: "'JetBrains Mono', monospace", color: done ? (dnf ? 'var(--penalty)' : 'var(--positive)') : 'var(--text-muted)' }}>
          {done ? (dnf ? 'DNF' : formatTime(p.solveTime!)) : '…'}
        </div>
      )}
    </div>
  )
}

function Leaderboard({ participants, format }: { participants: RaceParticipant[]; format: RaceFormat }) {
  const withResult = participants.map(p => ({
    ...p,
    finalResult: computeFinalResult(format, p.roundTimes),
  }))
  const sorted = [...withResult].sort((a, b) => a.finalResult - b.finalResult)
  const medals = ['🥇', '🥈', '🥉']

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {sorted.map((p, i) => {
        const isInf = !isFinite(p.finalResult)
        return (
          <div key={p.id} style={{
            display: 'flex', alignItems: 'center', gap: 12,
            padding: '12px 16px', borderRadius: 12,
            backgroundColor: i === 0 ? 'rgba(234,179,8,0.08)' : 'var(--surface-1)',
            border: `1px solid ${i === 0 ? 'rgba(234,179,8,0.3)' : 'var(--border)'}`,
          }}>
            <div style={{ fontSize: 20, width: 28, textAlign: 'center' }}>{medals[i] ?? `${i + 1}`}</div>
            <Avatar name={p.displayName} color={avatarColor(p.uid)} />
            <div style={{ flex: 1, fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>{p.displayName}</div>
            {p.roundTimes.length > 0 && (
              <div style={{ display: 'flex', gap: 6, marginRight: 12 }}>
                {p.roundTimes.map((rt, j) => {
                  const t = rt.penalty === 'DNF' ? Infinity : rt.penalty === '+2' ? rt.time + 2000 : rt.time
                  return (
                    <span key={j} style={{ fontSize: 11, fontFamily: "'JetBrains Mono', monospace", color: 'var(--text-muted)', padding: '2px 6px', border: '1px solid var(--border)', borderRadius: 4 }}>
                      {rt.penalty === 'DNF' ? 'DNF' : formatTime(t)}
                    </span>
                  )
                })}
              </div>
            )}
            <div style={{ fontSize: 18, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace", color: isInf ? 'var(--penalty)' : 'var(--timer-active)' }}>
              {isInf ? 'DNF' : formatTime(p.finalResult)}
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

export function RacePage() {
  const { user } = useAuth()
  const { profile } = useProfile()
  const displayName = profile?.displayName?.trim() || 'Anonymous'

  const [selectedEvent, setSelectedEvent] = useState<WCAEvent>('333')
  const [selectedFormat, setSelectedFormat] = useState<RaceFormat>('solo')
  const [joinCode, setJoinCode] = useState('')
  const [myPenalty, setMyPenalty] = useState<string | null>(null)
  const [submitted, setSubmitted] = useState(false)
  const [copied, setCopied] = useState(false)
  const [manualMode, setManualMode] = useState(false)
  const [manualInput, setManualInput] = useState('')

  const { state, createRoom, joinRoom, setReady, startRace, submitSolve, nextRound, leaveRoom } = useRaceRoom(
    user?.uid ?? null, displayName
  )

  const solveStartAt = state.status === 'in_room' ? state.room.solveStartAt : null
  const { phase: timerPhase, elapsed, countdown, reset: resetTimer } = useRaceTimer(solveStartAt)

  const handleSubmit = useCallback(async (penalty: string | null, time: number) => {
    if (submitted) return
    setSubmitted(true)
    await submitSolve(time, penalty)
  }, [submitted, submitSolve])

  // reset on new round
  const prevRound = useRef(0)
  useEffect(() => {
    if (state.status !== 'in_room') return
    const { room } = state
    if (room.phase === 'solving' && room.currentRound !== prevRound.current) {
      prevRound.current = room.currentRound
      setSubmitted(false)
      setMyPenalty(null)
      setManualInput('')
      resetTimer()
    }
  })

  const copyCode = () => {
    if (state.status !== 'in_room') return
    void navigator.clipboard.writeText(state.room.code)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  // ── Idle / error ────────────────────────────────────────────────────────────
  if (state.status === 'idle' || state.status === 'error') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '80dvh', padding: 32, gap: 28 }}>
        <div style={{ textAlign: 'center' }}>
          <h1 style={{ fontSize: 32, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 8, letterSpacing: '-0.02em' }}>Race Room</h1>
          <p style={{ fontSize: 15, color: 'var(--text-muted)' }}>Create a room or join one with a code to race live.</p>
        </div>

        {state.status === 'error' && (
          <div style={{ backgroundColor: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 10, padding: '12px 16px', fontSize: 13, color: 'var(--penalty)', maxWidth: 480, width: '100%', textAlign: 'center' }}>
            {state.message}
          </div>
        )}

        {/* Create */}
        <div style={{ backgroundColor: 'var(--surface-0)', border: '1px solid var(--border)', borderRadius: 16, padding: '24px 28px', width: '100%', maxWidth: 480 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 18 }}>Create a room</div>

          {/* Event tabs (same as session page) */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 8 }}>Event</div>
            <EventTabs value={selectedEvent} onChange={setSelectedEvent} />
          </div>

          {/* Format */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 8 }}>Format</div>
            <select
              value={selectedFormat}
              onChange={e => setSelectedFormat(e.target.value as RaceFormat)}
              style={selectStyle}
              onFocus={e => { e.currentTarget.style.borderColor = 'var(--accent)' }}
              onBlur={e => { e.currentTarget.style.borderColor = 'var(--border)' }}
            >
              {FORMAT_OPTIONS.map(f => (
                <option key={f.value} value={f.value}>{f.label}</option>
              ))}
            </select>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 6 }}>
              {FORMAT_OPTIONS.find(f => f.value === selectedFormat)?.description}
              {' · '}{FORMAT_ROUNDS[selectedFormat]} solve{FORMAT_ROUNDS[selectedFormat] > 1 ? 's' : ''}
            </div>
          </div>

          <button
            onClick={() => createRoom(selectedEvent, selectedFormat)}
            style={{ width: '100%', padding: '12px', borderRadius: 10, backgroundColor: 'var(--accent)', color: '#020617', fontSize: 14, fontWeight: 700, border: 'none', cursor: 'pointer' }}
            onMouseDown={e => { e.currentTarget.style.transform = 'scale(0.98)' }}
            onMouseUp={e => { e.currentTarget.style.transform = 'scale(1)' }}
          >
            Create Room
          </button>
        </div>

        {/* Join */}
        <div style={{ backgroundColor: 'var(--surface-0)', border: '1px solid var(--border)', borderRadius: 16, padding: '24px 28px', width: '100%', maxWidth: 480 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 14 }}>Join a room</div>
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              value={joinCode}
              onChange={e => setJoinCode(e.target.value.toUpperCase())}
              onKeyDown={e => e.key === 'Enter' && joinCode.length >= 4 && joinRoom(joinCode)}
              placeholder="Enter code  (e.g. A3B9CX)"
              maxLength={8}
              style={{
                flex: 1, backgroundColor: 'var(--surface-1)',
                border: `1px solid ${joinCode ? 'var(--accent)' : 'var(--border)'}`,
                borderRadius: 8, padding: '10px 12px', color: 'var(--text-primary)',
                fontSize: 15, fontFamily: "'JetBrains Mono', monospace", outline: 'none',
                letterSpacing: '0.12em', fontWeight: 600, transition: 'border-color 150ms ease',
              }}
            />
            <button
              onClick={() => joinRoom(joinCode)}
              disabled={joinCode.length < 4}
              style={{
                padding: '10px 18px', borderRadius: 8, border: 'none',
                backgroundColor: joinCode.length >= 4 ? 'var(--accent)' : 'var(--surface-1)',
                color: joinCode.length >= 4 ? '#020617' : 'var(--text-muted)',
                fontSize: 13, fontWeight: 700,
                cursor: joinCode.length >= 4 ? 'pointer' : 'not-allowed',
                transition: 'all 150ms ease',
              }}
            >
              Join
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (state.status === 'loading') {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '80dvh' }}>
        <div style={{ fontSize: 14, color: 'var(--text-muted)' }}>Connecting…</div>
      </div>
    )
  }

  const { room, participants, myUid } = state
  const me = participants.find(p => p.uid === myUid)
  const isHost = room.hostUid === myUid
  const allReady = participants.length >= 2 && participants.every(p => p.isReady)
  const others = participants.filter(p => p.uid !== myUid)

  // ── Lobby ─────────────────────────────────────────────────────────────────
  if (room.phase === 'lobby') {
    return (
      <div style={{ maxWidth: 600, margin: '0 auto', padding: '40px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 28 }}>
          <div>
            <h1 style={{ fontSize: 26, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em', marginBottom: 8 }}>
              Lobby — {EVENT_LABELS[room.event] ?? room.event}
            </h1>
            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--accent)', backgroundColor: 'var(--accent-dim)', border: '1px solid var(--accent)', borderRadius: 6, padding: '2px 8px' }}>
                {FORMAT_LABELS[room.format]}
              </span>
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                · {room.totalRounds} solve{room.totalRounds > 1 ? 's' : ''}
              </span>
            </div>
          </div>
          <button onClick={leaveRoom} style={{ fontSize: 12, color: 'var(--text-muted)', background: 'none', border: '1px solid var(--border)', borderRadius: 6, padding: '4px 10px', cursor: 'pointer' }}>
            Leave
          </button>
        </div>

        {/* Code */}
        <div onClick={copyCode} style={{
          backgroundColor: 'var(--surface-0)', border: '1px solid var(--border)', borderRadius: 16,
          padding: '20px 24px', marginBottom: 20, cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 6 }}>Room code</div>
            <div style={{ fontSize: 36, fontWeight: 800, fontFamily: "'JetBrains Mono', monospace", letterSpacing: '0.18em', color: 'var(--accent)' }}>{room.code}</div>
          </div>
          <div style={{ fontSize: 12, color: copied ? 'var(--positive)' : 'var(--text-muted)', transition: 'color 150ms ease' }}>
            {copied ? 'Copied!' : 'Tap to copy'}
          </div>
        </div>

        {/* Players */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 10 }}>
            Players ({participants.length})
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <AnimatePresence>
              {participants.map(p => (
                <motion.div key={p.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.18 }}>
                  <ParticipantRow p={p} isMe={p.uid === myUid} phase="lobby" />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <button
            onClick={() => setReady(!me?.isReady)}
            style={{
              width: '100%', padding: '13px', borderRadius: 10, fontSize: 14, fontWeight: 700,
              border: `1px solid ${me?.isReady ? 'var(--positive)' : 'var(--accent)'}`,
              backgroundColor: me?.isReady ? 'rgba(34,197,94,0.12)' : 'var(--accent)',
              color: me?.isReady ? 'var(--positive)' : '#020617',
              cursor: 'pointer', transition: 'all 150ms ease',
            }}
          >
            {me?.isReady ? '✓ Ready' : 'Ready up'}
          </button>
          {isHost && (
            <button
              onClick={() => startRace(room.event)}
              disabled={!allReady}
              style={{
                width: '100%', padding: '13px', borderRadius: 10, fontSize: 14, fontWeight: 700, border: 'none',
                backgroundColor: allReady ? 'var(--accent)' : 'var(--surface-1)',
                color: allReady ? '#020617' : 'var(--text-muted)',
                cursor: allReady ? 'pointer' : 'not-allowed',
                opacity: allReady ? 1 : 0.6, transition: 'all 150ms ease',
              }}
            >
              {participants.length < 2 ? 'Waiting for players…' : allReady ? 'Start Race' : 'Waiting for everyone to ready up…'}
            </button>
          )}
        </div>
      </div>
    )
  }

  // ── Solving ───────────────────────────────────────────────────────────────
  if (room.phase === 'solving') {
    const isCountdown = timerPhase === 'locked' && countdown > 0
    const timerColor = timerPhase === 'armed' ? 'var(--positive)'
      : timerPhase === 'running' ? 'var(--timer-active)'
      : timerPhase === 'done' ? 'var(--accent)'
      : isCountdown ? 'var(--inspection)'
      : 'var(--timer-idle)'

    const handleManualSubmit = () => {
      const trimmed = manualInput.trim()
      if (!trimmed) return
      // parse mm:ss.ms or ss.ms
      let ms: number
      const colonIdx = trimmed.indexOf(':')
      if (colonIdx !== -1) {
        const mins = parseInt(trimmed.slice(0, colonIdx), 10)
        const secs = parseFloat(trimmed.slice(colonIdx + 1))
        ms = (mins * 60 + secs) * 1000
      } else {
        ms = parseFloat(trimmed) * 1000
      }
      if (isNaN(ms) || ms <= 0) return
      handleSubmit(myPenalty, Math.round(ms))
    }

    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100dvh', overflow: 'hidden' }}>
        {/* Scramble bar */}
        <div style={{ borderBottom: '1px solid var(--border)', padding: '12px 24px', backgroundColor: 'var(--surface-0)', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 4 }}>
                {EVENT_LABELS[room.event] ?? room.event} · Round {room.currentRound}/{room.totalRounds} · {FORMAT_LABELS[room.format]}
              </div>
              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 15, fontWeight: 600, color: 'var(--text-primary)', letterSpacing: '0.04em', lineHeight: 1.6 }}>
                {room.scramble}
              </div>
            </div>
            {room.scramble && (
              <ScrambleViz scramble={room.scramble} event={room.event} size={90} />
            )}
          </div>
        </div>

        <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
          {/* Timer area */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, userSelect: 'none', position: 'relative' }}>

            {/* Manual mode toggle */}
            {!submitted && (
              <button
                onClick={() => setManualMode(m => !m)}
                style={{
                  position: 'absolute', bottom: 20, left: 24,
                  fontSize: 12, fontWeight: 500, padding: '5px 12px', borderRadius: 8,
                  border: `1px solid ${manualMode ? 'var(--accent)' : 'var(--border)'}`,
                  backgroundColor: manualMode ? 'var(--accent-dim)' : 'none',
                  color: manualMode ? 'var(--accent)' : 'var(--text-muted)',
                  cursor: 'pointer', transition: 'all 150ms ease',
                }}
              >
                Manual entry
              </button>
            )}

            {!submitted ? (
              <>
                {/* Countdown */}
                <AnimatePresence mode="wait">
                  {isCountdown ? (
                    <motion.div key="countdown" initial={{ scale: 1.2, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.8, opacity: 0 }} style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: 96, fontWeight: 800, fontFamily: "'JetBrains Mono', monospace", color: 'var(--inspection)', lineHeight: 1 }}>
                        {countdown}
                      </div>
                      <div style={{ fontSize: 14, color: 'var(--text-muted)', marginTop: 8 }}>Get ready…</div>
                    </motion.div>
                  ) : manualMode ? (
                    <motion.div key="manual" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
                      <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Enter your time</div>
                      <input
                        autoFocus
                        value={manualInput}
                        onChange={e => setManualInput(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleManualSubmit()}
                        placeholder="9.43 or 1:03.45"
                        style={{
                          fontSize: 32, fontFamily: "'JetBrains Mono', monospace", fontWeight: 700,
                          textAlign: 'center', width: 220, padding: '10px 16px', borderRadius: 10,
                          backgroundColor: 'var(--surface-1)', border: '1px solid var(--accent)',
                          color: 'var(--text-primary)', outline: 'none', letterSpacing: '0.04em',
                        }}
                      />
                      {/* Penalty row */}
                      <div style={{ display: 'flex', gap: 8 }}>
                        {(['none', '+2', 'DNF'] as const).map(p => {
                          const actual = p === 'none' ? null : p
                          const active = myPenalty === actual
                          const colors = p === 'none'
                            ? { border: 'var(--positive)', bg: 'rgba(34,197,94,0.12)', text: 'var(--positive)' }
                            : p === '+2' ? { border: 'var(--inspection)', bg: 'rgba(245,158,11,0.12)', text: 'var(--inspection)' }
                            : { border: 'var(--penalty)', bg: 'rgba(239,68,68,0.12)', text: 'var(--penalty)' }
                          return (
                            <button key={p} onClick={() => setMyPenalty(actual)} style={{
                              padding: '6px 18px', borderRadius: 999, fontSize: 13, fontWeight: 600,
                              border: `1px solid ${active ? colors.border : 'var(--border)'}`,
                              backgroundColor: active ? colors.bg : 'var(--surface-1)',
                              color: active ? colors.text : 'var(--text-muted)',
                              cursor: 'pointer', transition: 'all 120ms ease',
                            }}>{p === 'none' ? 'OK' : p}</button>
                          )
                        })}
                      </div>
                      <button
                        onClick={handleManualSubmit}
                        disabled={!manualInput.trim()}
                        style={{
                          padding: '11px 32px', borderRadius: 10, border: 'none',
                          backgroundColor: manualInput.trim() ? 'var(--accent)' : 'var(--surface-1)',
                          color: manualInput.trim() ? '#020617' : 'var(--text-muted)',
                          fontSize: 14, fontWeight: 700,
                          cursor: manualInput.trim() ? 'pointer' : 'not-allowed',
                        }}
                      >
                        Submit
                      </button>
                    </motion.div>
                  ) : (
                    <motion.div key="timer" style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: 96, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace", letterSpacing: '-0.04em', color: timerColor, lineHeight: 1, transition: 'color 150ms ease' }}>
                        {timerPhase === 'idle' ? 'READY' : formatTime(elapsed)}
                      </div>
                      <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 8 }}>
                        {timerPhase === 'idle' ? 'Hold Space to start' : timerPhase === 'armed' ? 'Release to start' : timerPhase === 'running' ? 'Press Space to stop' : ''}
                      </div>
                      {timerPhase === 'done' && (
                        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, marginTop: 20 }}>
                          <div style={{ display: 'flex', gap: 8 }}>
                            {(['none', '+2', 'DNF'] as const).map(p => {
                              const actual = p === 'none' ? null : p
                              const active = myPenalty === actual
                              const colors = p === 'none'
                                ? { border: 'var(--positive)', bg: 'rgba(34,197,94,0.12)', text: 'var(--positive)' }
                                : p === '+2' ? { border: 'var(--inspection)', bg: 'rgba(245,158,11,0.12)', text: 'var(--inspection)' }
                                : { border: 'var(--penalty)', bg: 'rgba(239,68,68,0.12)', text: 'var(--penalty)' }
                              return (
                                <button key={p} onClick={() => setMyPenalty(actual)} style={{
                                  padding: '7px 20px', borderRadius: 999, fontSize: 13, fontWeight: 600,
                                  border: `1px solid ${active ? colors.border : 'var(--border)'}`,
                                  backgroundColor: active ? colors.bg : 'var(--surface-1)',
                                  color: active ? colors.text : 'var(--text-muted)',
                                  cursor: 'pointer', transition: 'all 120ms ease',
                                }}>{p === 'none' ? 'OK' : p}</button>
                              )
                            })}
                          </div>
                          <button
                            onClick={() => handleSubmit(myPenalty, elapsed)}
                            style={{ padding: '12px 36px', borderRadius: 10, border: 'none', backgroundColor: 'var(--accent)', color: '#020617', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}
                          >
                            Submit
                          </button>
                        </motion.div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </>
            ) : (
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 56, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace", color: myPenalty === 'DNF' ? 'var(--penalty)' : 'var(--positive)', letterSpacing: '-0.03em' }}>
                  {myPenalty === 'DNF' ? 'DNF' : formatTime(myPenalty === '+2' ? elapsed + 2000 : elapsed)}
                </div>
                {room.currentRound < room.totalRounds && (
                  <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 8 }}>
                    Waiting for round {room.currentRound + 1}…
                  </div>
                )}
                {room.currentRound >= room.totalRounds && (
                  <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 8 }}>Waiting for others…</div>
                )}
              </div>
            )}
          </div>

          {/* Rivals sidebar */}
          {others.length > 0 && (
            <div className="race-sidebar" style={{ width: 220, borderLeft: '1px solid var(--border)', padding: '16px 12px', display: 'flex', flexDirection: 'column', gap: 8, overflowY: 'auto', flexShrink: 0 }}>
              <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 4 }}>Rivals</div>
              {others.map(p => (
                <ParticipantRow key={p.id} p={p} isMe={false} phase="solving" />
              ))}
            </div>
          )}
        </div>

        <style>{`@media(max-width:767px){.race-sidebar{display:none!important}}`}</style>
      </div>
    )
  }

  // ── Results ───────────────────────────────────────────────────────────────
  return (
    <div style={{ maxWidth: 600, margin: '0 auto', padding: '40px 24px' }}>
      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em', marginBottom: 6 }}>Results</h1>
        <p style={{ fontSize: 14, color: 'var(--text-muted)' }}>
          {EVENT_LABELS[room.event] ?? room.event} · {FORMAT_LABELS[room.format]}
        </p>
      </div>

      <Leaderboard participants={participants} format={room.format} />

      <div style={{ display: 'flex', gap: 10, marginTop: 28 }}>
        {isHost && (
          <button
            onClick={() => nextRound(room.event)}
            style={{ flex: 1, padding: '13px', borderRadius: 10, border: 'none', backgroundColor: 'var(--accent)', color: '#020617', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}
          >
            Play Again
          </button>
        )}
        <button
          onClick={leaveRoom}
          style={{ flex: isHost ? 0 : 1, padding: '13px 24px', borderRadius: 10, border: '1px solid var(--border)', backgroundColor: 'var(--surface-1)', color: 'var(--text-muted)', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}
        >
          Leave
        </button>
      </div>
    </div>
  )
}
