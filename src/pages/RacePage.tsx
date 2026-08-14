import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '@/providers/AuthProvider'
import { useProfile } from '@/providers/ProfileProvider'
import { useRaceRoom, type RaceParticipant } from '@/hooks/useRaceRoom'
import { formatTime } from '@/lib/utils'
import type { WCAEvent } from '@/types'

const WCA_EVENTS: WCAEvent[] = ['333', '222', '444', '555', '333oh', 'pyram', 'skewb']
const EVENT_LABELS: Record<string, string> = {
  '333': '3×3', '222': '2×2', '444': '4×4', '555': '5×5',
  '333oh': 'OH', 'pyram': 'Pyraminx', 'skewb': 'Skewb',
}

// ─── Timer hook ───────────────────────────────────────────────────────────────

type TimerState = 'idle' | 'armed' | 'running' | 'done'

function useRaceTimer(onFinish: (ms: number) => void) {
  const [timerState, setTimerState] = useState<TimerState>('idle')
  const [elapsed, setElapsed] = useState(0)
  const startRef = useRef<number | null>(null)
  const rafRef = useRef<number>(0)
  const stateRef = useRef<TimerState>('idle')
  stateRef.current = timerState

  const tick = useCallback(() => {
    if (startRef.current) setElapsed(Date.now() - startRef.current)
    rafRef.current = requestAnimationFrame(tick)
  }, [])

  const onKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.code !== 'Space' || e.repeat) return
    e.preventDefault()
    if (stateRef.current === 'idle') setTimerState('armed')
    if (stateRef.current === 'running') {
      cancelAnimationFrame(rafRef.current)
      const final = startRef.current ? Date.now() - startRef.current : 0
      setElapsed(final)
      setTimerState('done')
      onFinish(final)
    }
  }, [onFinish])

  const onKeyUp = useCallback((e: KeyboardEvent) => {
    if (e.code !== 'Space') return
    if (stateRef.current === 'armed') {
      startRef.current = Date.now()
      setTimerState('running')
      rafRef.current = requestAnimationFrame(tick)
    }
  }, [tick])

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
    setTimerState('idle')
  }, [])

  return { timerState, elapsed, reset }
}

// ─── Sub-components ───────────────────────────────────────────────────────────

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
      {phase === 'results' && done && (
        <div style={{ fontSize: 14, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace", color: dnf ? 'var(--penalty)' : 'var(--timer-active)' }}>
          {dnf ? 'DNF' : formatTime(p.solveTime!)}
        </div>
      )}
    </div>
  )
}

function Leaderboard({ participants }: { participants: RaceParticipant[] }) {
  const sorted = [...participants].sort((a, b) => {
    const at = a.penalty === 'DNF' ? Infinity : (a.solveTime ?? Infinity)
    const bt = b.penalty === 'DNF' ? Infinity : (b.solveTime ?? Infinity)
    return at - bt
  })
  const medals = ['🥇', '🥈', '🥉']
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {sorted.map((p, i) => {
        const dnf = p.penalty === 'DNF'
        const time = dnf ? null : p.solveTime
        return (
          <div key={p.id} style={{
            display: 'flex', alignItems: 'center', gap: 12,
            padding: '12px 16px', borderRadius: 12,
            backgroundColor: i === 0 ? 'rgba(234,179,8,0.08)' : 'var(--surface-1)',
            border: `1px solid ${i === 0 ? 'rgba(234,179,8,0.3)' : 'var(--border)'}`,
          }}>
            <div style={{ fontSize: 20, width: 28, textAlign: 'center' }}>
              {medals[i] ?? `${i + 1}`}
            </div>
            <Avatar name={p.displayName} color={avatarColor(p.uid)} />
            <div style={{ flex: 1, fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>
              {p.displayName}
            </div>
            <div style={{ fontSize: 18, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace", color: dnf ? 'var(--penalty)' : 'var(--timer-active)' }}>
              {dnf ? 'DNF' : time != null ? formatTime(time) : '—'}
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
  const [joinCode, setJoinCode] = useState('')
  const [myPenalty, setMyPenalty] = useState<string | null>(null)
  const [submitted, setSubmitted] = useState(false)
  const [copied, setCopied] = useState(false)

  const { state, createRoom, joinRoom, setReady, startRace, submitSolve, nextRound, leaveRoom } = useRaceRoom(
    user?.uid ?? null,
    displayName
  )

  const handleSolveFinish = useCallback((ms: number) => {
    // don't auto-submit yet — let user apply penalty first
    void ms
  }, [])

  const { timerState, elapsed, reset: resetTimer } = useRaceTimer(handleSolveFinish)

  const handleSubmit = useCallback(async (penalty: string | null, time: number) => {
    if (submitted) return
    setSubmitted(true)
    await submitSolve(time, penalty)
  }, [submitted, submitSolve])

  // Reset submit flag on new round
  useEffect(() => {
    if (state.status === 'in_room' && state.room.phase === 'solving') {
      setSubmitted(false)
      setMyPenalty(null)
      resetTimer()
    }
  }, [state.status === 'in_room' && state.status === 'in_room' ? (state as Extract<typeof state, {status:'in_room'}>).room.phase : null, resetTimer])

  const copyCode = () => {
    if (state.status !== 'in_room') return
    void navigator.clipboard.writeText(state.room.code)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  // ── Idle screen ────────────────────────────────────────────────────────────
  if (state.status === 'idle' || state.status === 'error') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '80dvh', padding: 32, gap: 32 }}>
        <div style={{ textAlign: 'center' }}>
          <h1 style={{ fontSize: 32, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 8, letterSpacing: '-0.02em' }}>Race Room</h1>
          <p style={{ fontSize: 15, color: 'var(--text-muted)' }}>Create a room or join one with a code to race live.</p>
        </div>

        {state.status === 'error' && (
          <div style={{ backgroundColor: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 10, padding: '12px 16px', fontSize: 13, color: 'var(--penalty)', maxWidth: 400, width: '100%', textAlign: 'center' }}>
            {state.message}
          </div>
        )}

        {/* Create */}
        <div style={{ backgroundColor: 'var(--surface-0)', border: '1px solid var(--border)', borderRadius: 16, padding: '24px 28px', width: '100%', maxWidth: 400 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 12 }}>Create a room</div>
          <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
            {WCA_EVENTS.map(ev => (
              <button
                key={ev}
                onClick={() => setSelectedEvent(ev)}
                style={{
                  padding: '4px 10px', borderRadius: 6, fontSize: 11, fontWeight: 600,
                  border: `1px solid ${selectedEvent === ev ? 'var(--accent)' : 'var(--border)'}`,
                  backgroundColor: selectedEvent === ev ? 'var(--accent-dim)' : 'transparent',
                  color: selectedEvent === ev ? 'var(--accent)' : 'var(--text-muted)',
                  cursor: 'pointer', transition: 'all 120ms ease',
                }}
              >
                {EVENT_LABELS[ev]}
              </button>
            ))}
          </div>
          <button
            onClick={() => createRoom(selectedEvent)}
            style={{
              width: '100%', padding: '12px', borderRadius: 10,
              backgroundColor: 'var(--accent)', color: '#020617',
              fontSize: 14, fontWeight: 700, border: 'none', cursor: 'pointer',
            }}
          >
            Create Room
          </button>
        </div>

        {/* Join */}
        <div style={{ backgroundColor: 'var(--surface-0)', border: '1px solid var(--border)', borderRadius: 16, padding: '24px 28px', width: '100%', maxWidth: 400 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 12 }}>Join a room</div>
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              value={joinCode}
              onChange={e => setJoinCode(e.target.value.toUpperCase())}
              onKeyDown={e => e.key === 'Enter' && joinCode.length >= 4 && joinRoom(joinCode)}
              placeholder="Enter code (e.g. A3B9CX)"
              maxLength={8}
              style={{
                flex: 1, backgroundColor: 'var(--surface-1)', border: `1px solid ${joinCode ? 'var(--accent)' : 'var(--border)'}`,
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

  // ── Lobby ─────────────────────────────────────────────────────────────────
  if (room.phase === 'lobby') {
    return (
      <div style={{ maxWidth: 600, margin: '0 auto', padding: '40px 24px' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 28 }}>
          <div>
            <h1 style={{ fontSize: 26, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em', marginBottom: 4 }}>
              Lobby — {EVENT_LABELS[room.event]}
            </h1>
            <p style={{ fontSize: 14, color: 'var(--text-muted)' }}>
              {isHost ? 'Share the code with your rivals, then start when everyone is ready.' : 'Waiting for the host to start the race.'}
            </p>
          </div>
          <button
            onClick={leaveRoom}
            style={{ fontSize: 12, color: 'var(--text-muted)', background: 'none', border: '1px solid var(--border)', borderRadius: 6, padding: '4px 10px', cursor: 'pointer' }}
          >
            Leave
          </button>
        </div>

        {/* Room code */}
        <div
          onClick={copyCode}
          style={{
            backgroundColor: 'var(--surface-0)', border: '1px solid var(--border)', borderRadius: 16,
            padding: '20px 24px', marginBottom: 20, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}
        >
          <div>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 6 }}>Room code</div>
            <div style={{ fontSize: 36, fontWeight: 800, fontFamily: "'JetBrains Mono', monospace", letterSpacing: '0.18em', color: 'var(--accent)' }}>
              {room.code}
            </div>
          </div>
          <div style={{ fontSize: 12, color: copied ? 'var(--positive)' : 'var(--text-muted)', transition: 'color 150ms ease' }}>
            {copied ? 'Copied!' : 'Tap to copy'}
          </div>
        </div>

        {/* Participants */}
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
                transition: 'all 150ms ease',
                opacity: allReady ? 1 : 0.6,
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
    const timerColor = timerState === 'armed' ? 'var(--positive)' : timerState === 'running' ? 'var(--timer-active)' : timerState === 'done' ? 'var(--accent)' : 'var(--timer-idle)'
    const others = participants.filter(p => p.uid !== myUid)

    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100dvh', overflow: 'hidden' }}>
        {/* Scramble bar */}
        <div style={{ borderBottom: '1px solid var(--border)', padding: '12px 24px', backgroundColor: 'var(--surface-0)', flexShrink: 0 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 4 }}>
            {EVENT_LABELS[room.event]} scramble
          </div>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 15, fontWeight: 600, color: 'var(--text-primary)', letterSpacing: '0.04em', lineHeight: 1.6 }}>
            {room.scramble}
          </div>
        </div>

        <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
          {/* Timer area */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, userSelect: 'none' }}>
            {!submitted ? (
              <>
                <div style={{ fontSize: 88, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace", letterSpacing: '-0.04em', color: timerColor, lineHeight: 1, transition: 'color 150ms ease' }}>
                  {timerState === 'idle' ? 'READY' : formatTime(elapsed)}
                </div>
                <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                  {timerState === 'idle' ? 'Hold Space to start' : timerState === 'armed' ? 'Release to start' : timerState === 'running' ? 'Press Space to stop' : ''}
                </div>

                {timerState === 'done' && (
                  <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
                    <div style={{ display: 'flex', gap: 8 }}>
                      {(['none', '+2', 'DNF'] as const).map(p => {
                        const actual = p === 'none' ? null : p
                        const active = myPenalty === actual
                        const colors = p === 'none'
                          ? { border: 'var(--positive)', bg: 'rgba(34,197,94,0.12)', text: 'var(--positive)' }
                          : p === '+2'
                          ? { border: 'var(--inspection)', bg: 'rgba(245,158,11,0.12)', text: 'var(--inspection)' }
                          : { border: 'var(--penalty)', bg: 'rgba(239,68,68,0.12)', text: 'var(--penalty)' }
                        return (
                          <button
                            key={p}
                            onClick={() => setMyPenalty(actual)}
                            style={{
                              padding: '7px 20px', borderRadius: 999, fontSize: 13, fontWeight: 600,
                              border: `1px solid ${active ? colors.border : 'var(--border)'}`,
                              backgroundColor: active ? colors.bg : 'var(--surface-1)',
                              color: active ? colors.text : 'var(--text-muted)',
                              cursor: 'pointer', transition: 'all 120ms ease',
                            }}
                          >
                            {p === 'none' ? 'OK' : p}
                          </button>
                        )
                      })}
                    </div>
                    <button
                      onClick={() => handleSubmit(myPenalty, elapsed)}
                      style={{
                        padding: '12px 36px', borderRadius: 10, border: 'none',
                        backgroundColor: 'var(--accent)', color: '#020617',
                        fontSize: 14, fontWeight: 700, cursor: 'pointer',
                      }}
                    >
                      Submit
                    </button>
                  </motion.div>
                )}
              </>
            ) : (
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 56, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace", color: myPenalty === 'DNF' ? 'var(--penalty)' : 'var(--positive)', letterSpacing: '-0.03em' }}>
                  {myPenalty === 'DNF' ? 'DNF' : formatTime(myPenalty === '+2' ? elapsed + 2000 : elapsed)}
                </div>
                <div style={{ fontSize: 14, color: 'var(--text-muted)', marginTop: 8 }}>Waiting for others…</div>
              </div>
            )}
          </div>

          {/* Opponents sidebar */}
          {others.length > 0 && (
            <div style={{ width: 220, borderLeft: '1px solid var(--border)', padding: '16px 12px', display: 'flex', flexDirection: 'column', gap: 8, overflowY: 'auto' }}>
              <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 4 }}>
                Rivals
              </div>
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
    <div style={{ maxWidth: 560, margin: '0 auto', padding: '40px 24px' }}>
      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em', marginBottom: 6 }}>Results</h1>
        <p style={{ fontSize: 14, color: 'var(--text-muted)' }}>{EVENT_LABELS[room.event]}</p>
      </div>

      <Leaderboard participants={participants} />

      <div style={{ display: 'flex', gap: 10, marginTop: 28 }}>
        {isHost && (
          <button
            onClick={() => nextRound(room.event)}
            style={{
              flex: 1, padding: '13px', borderRadius: 10, border: 'none',
              backgroundColor: 'var(--accent)', color: '#020617',
              fontSize: 14, fontWeight: 700, cursor: 'pointer',
            }}
          >
            Next Round
          </button>
        )}
        <button
          onClick={leaveRoom}
          style={{
            flex: isHost ? 0 : 1, padding: '13px 24px', borderRadius: 10,
            border: '1px solid var(--border)', backgroundColor: 'var(--surface-1)',
            color: 'var(--text-muted)', fontSize: 14, fontWeight: 600, cursor: 'pointer',
          }}
        >
          Leave
        </button>
      </div>
    </div>
  )
}
