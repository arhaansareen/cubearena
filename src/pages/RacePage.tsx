import React, { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '@/providers/AuthProvider'
import { useProfile } from '@/providers/ProfileProvider'
import { useRaceRoom, type RaceParticipant, type RaceFormat, computeScores, FORMAT_TARGET, FORMAT_ROUNDS } from '@/hooks/useRaceRoom'
import { ScrambleViz } from '@/components/session/ScrambleViz'
import { formatTime } from '@/lib/utils'
import type { WCAEvent } from '@/types'

const ALL_EVENTS: { value: WCAEvent; label: string }[] = [
  { value: '333',   label: '3x3' },
  { value: '222',   label: '2x2' },
  { value: '444',   label: '4x4' },
  { value: '555',   label: '5x5' },
  { value: '666',   label: '6x6' },
  { value: '777',   label: '7x7' },
  { value: '333bf', label: '3BLD' },
  { value: '333oh', label: '3OH' },
  { value: '333fm', label: 'FMC' },
  { value: 'clock', label: 'Clock' },
  { value: 'minx',  label: 'Megaminx' },
  { value: 'pyram', label: 'Pyraminx' },
  { value: 'skewb', label: 'Skewb' },
  { value: 'sq1',   label: 'Sq-1' },
  { value: '444bf', label: '4BLD' },
  { value: '555bf', label: '5BLD' },
]
const EVENT_LABELS: Record<string, string> = Object.fromEntries(ALL_EVENTS.map(e => [e.value, e.label]))

const FORMAT_OPTIONS: { value: RaceFormat; label: string; description: string }[] = [
  { value: 'rt3', label: 'Race to 3', description: 'First to win 3 rounds wins the match' },
  { value: 'rt5', label: 'Race to 5', description: 'First to win 5 rounds wins the match' },
  { value: 'rt7', label: 'Race to 7', description: 'First to win 7 rounds wins the match' },
]
const FORMAT_LABELS: Record<RaceFormat, string> = { rt3: 'Race to 3', rt5: 'Race to 5', rt7: 'Race to 7' }

// ─── Custom dropdowns ─────────────────────────────────────────────────────────

function ChevronDown() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ flexShrink: 0, color: 'var(--text-muted)' }}>
      <path d="M3 5l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

function DropdownMenu<T extends string>({
  value, options, onChange,
}: {
  value: T
  options: { value: T; label: string; sub?: string }[]
  onChange: (v: T) => void
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const selected = options.find(o => o.value === value)!

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '10px 14px', borderRadius: 10, cursor: 'pointer',
          backgroundColor: 'var(--surface-1)',
          border: `1px solid ${open ? 'var(--accent)' : 'var(--border)'}`,
          color: 'var(--text-primary)', fontSize: 14, fontWeight: 600,
          transition: 'border-color 150ms ease',
        }}
      >
        <span>{selected?.label}</span>
        <div style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 150ms ease' }}>
          <ChevronDown />
        </div>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.97 }}
            transition={{ duration: 0.13 }}
            style={{
              position: 'absolute', top: 'calc(100% + 6px)', left: 0, right: 0, zIndex: 50,
              backgroundColor: 'var(--surface-0)', border: '1px solid var(--border)',
              borderRadius: 12, overflow: 'hidden auto', maxHeight: 300,
              boxShadow: '0 8px 24px rgba(0,0,0,0.35)',
            }}
          >
            {options.map(o => (
              <button
                key={o.value}
                onClick={() => { onChange(o.value); setOpen(false) }}
                style={{
                  width: '100%', textAlign: 'left', padding: '10px 14px', border: 'none',
                  backgroundColor: o.value === value ? 'var(--accent-dim)' : 'transparent',
                  color: o.value === value ? 'var(--accent)' : 'var(--text-primary)',
                  cursor: 'pointer', transition: 'background-color 100ms ease',
                }}
                onMouseEnter={e => { if (o.value !== value) e.currentTarget.style.backgroundColor = 'var(--surface-1)' }}
                onMouseLeave={e => { if (o.value !== value) e.currentTarget.style.backgroundColor = 'transparent' }}
              >
                <div style={{ fontSize: 13, fontWeight: 600 }}>{o.label}</div>
                {o.sub && <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 1 }}>{o.sub}</div>}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ─── Race timer hook ──────────────────────────────────────────────────────────

type TimerPhase = 'locked' | 'idle' | 'armed' | 'running' | 'done'

function useRaceTimer(unlockAt: number | null) {
  const [phase, setPhase] = useState<TimerPhase>('locked')
  const [elapsed, setElapsed] = useState(0)
  const [countdown, setCountdown] = useState(0)
  const startRef = useRef<number | null>(null)
  const countdownRafRef = useRef<number>(0)
  const solveRafRef = useRef<number>(0)
  const phaseRef = useRef<TimerPhase>('locked')
  phaseRef.current = phase

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
      countdownRafRef.current = requestAnimationFrame(tick)
    }
    countdownRafRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(countdownRafRef.current)
  }, [unlockAt])

  const runTick = useCallback(() => {
    if (startRef.current) setElapsed(Date.now() - startRef.current)
    solveRafRef.current = requestAnimationFrame(runTick)
  }, [])

  const onKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.code !== 'Space' || e.repeat) return
    e.preventDefault()
    if (phaseRef.current === 'idle') setPhase('armed')
    if (phaseRef.current === 'running') {
      cancelAnimationFrame(solveRafRef.current)
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
      solveRafRef.current = requestAnimationFrame(runTick)
    }
  }, [runTick])

  useEffect(() => {
    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
      cancelAnimationFrame(solveRafRef.current)
    }
  }, [onKeyDown, onKeyUp])

  const reset = useCallback(() => {
    cancelAnimationFrame(solveRafRef.current)
    startRef.current = null
    setElapsed(0)
    setPhase('locked')
  }, [])

  return { phase, elapsed, countdown, reset }
}

// ─── Shared UI ────────────────────────────────────────────────────────────────

const AVATAR_COLORS = ['#7C3AED', '#DC2626', '#D97706', '#059669', '#2563EB', '#DB2777']
function avatarColor(uid: string) {
  const n = uid.split('').reduce((a, c) => a + c.charCodeAt(0), 0)
  return AVATAR_COLORS[n % AVATAR_COLORS.length]
}

function Avatar({ name, color, size = 36 }: { name: string; color: string; size?: number }) {
  const initials = name.trim().split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase() || '?'
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%', backgroundColor: color,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: Math.round(size * 0.36), fontWeight: 700, color: '#fff',
      fontFamily: "'JetBrains Mono', monospace", flexShrink: 0, lineHeight: 1,
    }}>
      {initials}
    </div>
  )
}

function PenaltyChips({ value, onChange }: { value: string | null; onChange: (v: string | null) => void }) {
  const options = [
    { label: 'OK',  val: null,  color: 'var(--positive)',  bg: 'rgba(34,197,94,0.12)',  border: 'var(--positive)' },
    { label: '+2',  val: '+2',  color: 'var(--inspection)', bg: 'rgba(245,158,11,0.12)', border: 'var(--inspection)' },
    { label: 'DNF', val: 'DNF', color: 'var(--penalty)',   bg: 'rgba(239,68,68,0.12)',  border: 'var(--penalty)' },
  ]
  return (
    <div style={{ display: 'flex', gap: 8 }}>
      {options.map(o => {
        const active = value === o.val
        return (
          <button key={o.label} onClick={() => onChange(o.val)} style={{
            padding: '7px 20px', borderRadius: 999, fontSize: 13, fontWeight: 600, cursor: 'pointer',
            border: `1px solid ${active ? o.border : 'var(--border)'}`,
            backgroundColor: active ? o.bg : 'var(--surface-1)',
            color: active ? o.color : 'var(--text-muted)',
            transition: 'all 120ms ease',
          }}>{o.label}</button>
        )
      })}
    </div>
  )
}

// ─── Scoreboard strip ─────────────────────────────────────────────────────────

function Scoreboard({ participants, myUid, format }: { participants: RaceParticipant[]; myUid: string; format: RaceFormat }) {
  const scores = computeScores(participants)
  const target = FORMAT_TARGET[format]
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
      {participants.map((p, i) => {
        const score = scores[p.uid] ?? 0
        const isMe = p.uid === myUid
        return (
          <React.Fragment key={p.uid}>
            {i > 0 && (
              <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-muted)', padding: '0 12px', fontFamily: "'JetBrains Mono', monospace" }}>
                —
              </div>
            )}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, minWidth: 60 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: isMe ? 'var(--accent)' : 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', maxWidth: 80, textOverflow: 'ellipsis' }}>
                {isMe ? 'You' : p.displayName}
              </div>
              <div style={{ display: 'flex', gap: 4 }}>
                {Array.from({ length: target }).map((_, j) => (
                  <div key={j} style={{
                    width: 8, height: 8, borderRadius: '50%',
                    backgroundColor: j < score ? (isMe ? 'var(--accent)' : 'var(--text-primary)') : 'var(--surface-1)',
                    border: `1px solid ${j < score ? (isMe ? 'var(--accent)' : 'var(--text-primary)') : 'var(--border)'}`,
                    transition: 'background-color 300ms ease',
                  }} />
                ))}
              </div>
              <div style={{ fontSize: 20, fontWeight: 800, fontFamily: "'JetBrains Mono', monospace", color: isMe ? 'var(--accent)' : 'var(--text-primary)', lineHeight: 1 }}>
                {score}
              </div>
            </div>
          </React.Fragment>
        )
      })}
    </div>
  )
}

// ─── Results screen ───────────────────────────────────────────────────────────

function ResultsScreen({
  participants, format, event, isHost, myUid, onPlayAgain, onLeave,
}: {
  participants: RaceParticipant[]
  format: RaceFormat
  event: WCAEvent
  isHost: boolean
  myUid: string
  onPlayAgain: () => void
  onLeave: () => void
}) {
  const scores = computeScores(participants)
  const sorted = [...participants].sort((a, b) => (scores[b.uid] ?? 0) - (scores[a.uid] ?? 0))
  const winner = sorted[0]
  const target = FORMAT_TARGET[format]
  const iWon = winner?.uid === myUid

  const RANK_LABELS = ['1st', '2nd', '3rd', '4th']

  return (
    <div style={{ maxWidth: 520, margin: '0 auto', padding: '40px 24px' }}>
      {/* Winner banner */}
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
        style={{
          textAlign: 'center', marginBottom: 32,
          backgroundColor: iWon ? 'var(--accent-dim)' : 'var(--surface-0)',
          border: `1px solid ${iWon ? 'var(--accent)' : 'var(--border)'}`,
          borderRadius: 20, padding: '28px 24px',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12 }}>
          <Avatar name={winner?.displayName ?? '?'} color={avatarColor(winner?.uid ?? '')} size={56} />
        </div>
        <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>
          {iWon ? 'You won' : `${winner?.displayName} wins`}
        </div>
        <div style={{ marginTop: 6, fontSize: 13, color: 'var(--text-muted)' }}>
          {EVENT_LABELS[event] ?? event} · {FORMAT_LABELS[format]} · first to {target}
        </div>
        {/* Final score */}
        <div style={{ marginTop: 20, display: 'flex', justifyContent: 'center' }}>
          <Scoreboard participants={participants} myUid={myUid} format={format} />
        </div>
      </motion.div>

      {/* Per-round breakdown */}
      <div style={{ marginBottom: 12 }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 10 }}>
          Round breakdown
        </div>
        {Array.from({ length: Math.max(...participants.map(p => p.roundTimes.length), 0) }).map((_, i) => {
          const roundTimes = participants.map(p => {
            const rt = p.roundTimes[i]
            const t = rt ? (rt.penalty === 'DNF' ? Infinity : rt.penalty === '+2' ? rt.time + 2000 : rt.time) : Infinity
            return { uid: p.uid, name: p.displayName, t, penalty: rt?.penalty ?? null }
          })
          const best = Math.min(...roundTimes.map(x => x.t))
          const roundWinnerUid = isFinite(best) && roundTimes.filter(x => x.t === best).length === 1
            ? roundTimes.find(x => x.t === best)?.uid : null
          return (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', borderRadius: 8, marginBottom: 4, backgroundColor: 'var(--surface-1)' }}>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, width: 52, flexShrink: 0 }}>
                Round {i + 1}
              </div>
              {roundTimes.map(rt => (
                <div key={rt.uid} style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', flexShrink: 0, backgroundColor: rt.uid === roundWinnerUid ? 'var(--positive)' : 'var(--border)' }} />
                  <span style={{ fontSize: 11, color: rt.uid === myUid ? 'var(--accent)' : 'var(--text-muted)', fontWeight: rt.uid === myUid ? 600 : 400 }}>
                    {rt.uid === myUid ? 'You' : rt.name}
                  </span>
                  <span style={{ fontSize: 12, fontFamily: "'JetBrains Mono', monospace", color: rt.uid === roundWinnerUid ? 'var(--positive)' : 'var(--text-primary)', fontWeight: rt.uid === roundWinnerUid ? 700 : 400, marginLeft: 'auto' }}>
                    {rt.penalty === 'DNF' ? 'DNF' : isFinite(rt.t) ? formatTime(rt.t) : '—'}
                  </span>
                </div>
              ))}
            </div>
          )
        })}
      </div>

      {/* Overall leaderboard */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 24 }}>
        {sorted.map((p, i) => {
          const isMe = p.uid === myUid
          const score = scores[p.uid] ?? 0
          return (
            <motion.div
              key={p.id}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.06 }}
              style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '12px 16px', borderRadius: 12,
                backgroundColor: isMe ? 'var(--accent-dim)' : 'var(--surface-1)',
                border: `1px solid ${isMe ? 'var(--accent)' : 'var(--border)'}`,
              }}
            >
              <div style={{ fontSize: 12, fontWeight: 700, color: i === 0 ? 'var(--accent)' : 'var(--text-muted)', width: 28, textAlign: 'center', flexShrink: 0, fontFamily: "'JetBrains Mono', monospace" }}>
                {RANK_LABELS[i] ?? `${i + 1}`}
              </div>
              <Avatar name={p.displayName} color={avatarColor(p.uid)} />
              <div style={{ flex: 1, fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>
                {p.displayName}{isMe ? ' (you)' : ''}
              </div>
              <div style={{ fontSize: 24, fontWeight: 800, fontFamily: "'JetBrains Mono', monospace", color: i === 0 ? 'var(--accent)' : 'var(--text-primary)' }}>
                {score}
              </div>
            </motion.div>
          )
        })}
      </div>

      <div style={{ display: 'flex', gap: 10 }}>
        {isHost && (
          <button
            onClick={onPlayAgain}
            style={{ flex: 1, padding: '13px', borderRadius: 10, border: 'none', backgroundColor: 'var(--accent)', color: '#020617', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}
            onMouseDown={e => { e.currentTarget.style.transform = 'scale(0.98)' }}
            onMouseUp={e => { e.currentTarget.style.transform = 'scale(1)' }}
          >
            Play Again
          </button>
        )}
        <button
          onClick={onLeave}
          style={{ flex: isHost ? 0 : 1, padding: '13px 28px', borderRadius: 10, border: '1px solid var(--border)', backgroundColor: 'var(--surface-1)', color: 'var(--text-muted)', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}
        >
          Leave
        </button>
      </div>
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

export function RacePage() {
  const { user } = useAuth()
  const { profile } = useProfile()
  const displayName = profile?.displayName?.trim() || 'Anonymous'

  const [selectedEvent, setSelectedEvent] = useState<WCAEvent>('333')
  const [selectedFormat, setSelectedFormat] = useState<RaceFormat>('rt3')
  const [joinCode, setJoinCode] = useState('')
  const [myPenalty, setMyPenalty] = useState<string | null>(null)
  const [submitted, setSubmitted] = useState(false)
  const [submittedTime, setSubmittedTime] = useState<number>(0)
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
    setSubmittedTime(time)
    await submitSolve(time, penalty)
  }, [submitted, submitSolve])

  const prevRound = useRef(0)
  useEffect(() => {
    if (state.status !== 'in_room') return
    const { room } = state
    if (room.phase === 'solving' && room.currentRound !== prevRound.current) {
      prevRound.current = room.currentRound
      setSubmitted(false)
      setSubmittedTime(0)
      setMyPenalty(null)
      setManualInput('')
      setManualMode(false)
      resetTimer()
    }
  })

  const copyCode = () => {
    if (state.status !== 'in_room') return
    void navigator.clipboard.writeText(state.room.code)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  // ── Idle / error ─────────────────────────────────────────────────────────
  if (state.status === 'idle' || state.status === 'error') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '80dvh', padding: '32px 24px', gap: 24 }}>
        <div style={{ textAlign: 'center' }}>
          <h1 style={{ fontSize: 32, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 8, letterSpacing: '-0.02em' }}>Race</h1>
          <p style={{ fontSize: 15, color: 'var(--text-muted)' }}>Create a room or join with a code to race live.</p>
        </div>

        {state.status === 'error' && (
          <div style={{ backgroundColor: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 10, padding: '12px 16px', fontSize: 13, color: 'var(--penalty)', maxWidth: 480, width: '100%', textAlign: 'center' }}>
            {state.message}
          </div>
        )}

        <div style={{ backgroundColor: 'var(--surface-0)', border: '1px solid var(--border)', borderRadius: 16, padding: '24px 28px', width: '100%', maxWidth: 480 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 20 }}>Create a room</div>

          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 8 }}>Event</div>
            <DropdownMenu value={selectedEvent} options={ALL_EVENTS} onChange={setSelectedEvent} />
          </div>

          <div style={{ marginBottom: 22 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 8 }}>Format</div>
            <DropdownMenu
              value={selectedFormat}
              options={FORMAT_OPTIONS.map(f => ({ value: f.value, label: f.label, sub: f.description }))}
              onChange={setSelectedFormat}
            />
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 6 }}>
              Max {FORMAT_ROUNDS[selectedFormat]} rounds
            </div>
          </div>

          <button
            onClick={() => void createRoom(selectedEvent, selectedFormat)}
            style={{ width: '100%', padding: '12px', borderRadius: 10, backgroundColor: 'var(--accent)', color: '#020617', fontSize: 14, fontWeight: 700, border: 'none', cursor: 'pointer' }}
            onMouseDown={e => { e.currentTarget.style.transform = 'scale(0.98)' }}
            onMouseUp={e => { e.currentTarget.style.transform = 'scale(1)' }}
          >
            Create Room
          </button>
        </div>

        <div style={{ backgroundColor: 'var(--surface-0)', border: '1px solid var(--border)', borderRadius: 16, padding: '24px 28px', width: '100%', maxWidth: 480 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 14 }}>Join a room</div>
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              value={joinCode}
              onChange={e => setJoinCode(e.target.value.toUpperCase())}
              onKeyDown={e => e.key === 'Enter' && joinCode.length >= 4 && void joinRoom(joinCode)}
              placeholder="Enter code (e.g. A3B9CX)"
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
              onClick={() => void joinRoom(joinCode)}
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

  // ── Results ───────────────────────────────────────────────────────────────
  if (room.phase === 'results') {
    return (
      <ResultsScreen
        participants={participants}
        format={room.format}
        event={room.event}
        isHost={isHost}
        myUid={myUid}
        onPlayAgain={() => void nextRound()}
        onLeave={() => void leaveRoom()}
      />
    )
  }

  // ── Lobby ─────────────────────────────────────────────────────────────────
  if (room.phase === 'lobby') {
    return (
      <div style={{ maxWidth: 560, margin: '0 auto', padding: '40px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 28 }}>
          <div>
            <h1 style={{ fontSize: 26, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em', marginBottom: 8 }}>
              {EVENT_LABELS[room.event] ?? room.event}
            </h1>
            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--accent)', backgroundColor: 'var(--accent-dim)', border: '1px solid var(--accent)', borderRadius: 6, padding: '2px 8px' }}>
                {FORMAT_LABELS[room.format]}
              </span>
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                · first to {FORMAT_TARGET[room.format]}
              </span>
            </div>
          </div>
          <button onClick={() => void leaveRoom()} style={{ fontSize: 12, color: 'var(--text-muted)', background: 'none', border: '1px solid var(--border)', borderRadius: 6, padding: '4px 10px', cursor: 'pointer' }}>
            Leave
          </button>
        </div>

        <div
          onClick={copyCode}
          style={{
            backgroundColor: 'var(--surface-0)', border: '1px solid var(--border)', borderRadius: 16,
            padding: '20px 24px', marginBottom: 20, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}
        >
          <div>
            <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 6 }}>Room code — share this</div>
            <div style={{ fontSize: 36, fontWeight: 800, fontFamily: "'JetBrains Mono', monospace", letterSpacing: '0.2em', color: 'var(--accent)' }}>{room.code}</div>
          </div>
          <div style={{ fontSize: 12, color: copied ? 'var(--positive)' : 'var(--text-muted)', transition: 'color 150ms ease' }}>
            {copied ? 'Copied' : 'Tap to copy'}
          </div>
        </div>

        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 10 }}>
            Players ({participants.length})
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <AnimatePresence>
              {participants.map(p => (
                <motion.div key={p.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.18 }}>
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: '10px 14px', borderRadius: 12,
                    backgroundColor: p.uid === myUid ? 'var(--accent-dim)' : 'var(--surface-1)',
                    border: `1px solid ${p.uid === myUid ? 'var(--accent)' : 'var(--border)'}`,
                  }}>
                    <Avatar name={p.displayName} color={avatarColor(p.uid)} />
                    <div style={{ flex: 1, fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>
                      {p.displayName}{p.uid === myUid ? ' (you)' : ''}
                      {room.hostUid === p.uid && <span style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 500, marginLeft: 6 }}>host</span>}
                    </div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: p.isReady ? 'var(--positive)' : 'var(--text-muted)', transition: 'color 150ms ease' }}>
                      {p.isReady ? 'Ready' : 'Not ready'}
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>

        {participants.length < 2 && (
          <div style={{ fontSize: 13, color: 'var(--text-muted)', textAlign: 'center', marginBottom: 16, padding: '12px', borderRadius: 10, border: '1px dashed var(--border)' }}>
            Waiting for someone to join…
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <button
            onClick={() => void setReady(!me?.isReady)}
            style={{
              width: '100%', padding: '13px', borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: 'pointer', transition: 'all 150ms ease',
              border: me?.isReady ? '1px solid var(--positive)' : '1px solid var(--accent)',
              backgroundColor: me?.isReady ? 'rgba(34,197,94,0.12)' : 'var(--accent)',
              color: me?.isReady ? 'var(--positive)' : '#020617',
            }}
          >
            {me?.isReady ? 'Ready' : 'Ready up'}
          </button>
          {isHost && (
            <button
              onClick={() => void startRace(room.event)}
              disabled={!allReady}
              style={{
                width: '100%', padding: '13px', borderRadius: 10, fontSize: 14, fontWeight: 700, border: 'none', transition: 'all 150ms ease',
                backgroundColor: allReady ? '#020617' : 'var(--surface-1)',
                color: allReady ? 'var(--accent)' : 'var(--text-muted)',
                cursor: allReady ? 'pointer' : 'not-allowed',
                opacity: allReady ? 1 : 0.5,
              }}
            >
              {allReady ? 'Start Race' : 'Waiting for everyone to ready up…'}
            </button>
          )}
        </div>
      </div>
    )
  }

  // ── Solving ───────────────────────────────────────────────────────────────
  const isCountdown = timerPhase === 'locked' && countdown > 0
  const timerColor = timerPhase === 'armed' ? 'var(--positive)'
    : timerPhase === 'running' ? 'var(--timer-active)'
    : timerPhase === 'done' ? 'var(--accent)'
    : isCountdown ? 'var(--inspection)'
    : 'var(--timer-idle)'

  const handleManualSubmit = () => {
    const trimmed = manualInput.trim()
    if (!trimmed) return
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
    void handleSubmit(myPenalty, Math.round(ms))
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100dvh', overflow: 'hidden' }}>
      {/* Header bar: scramble + score */}
      <div style={{ borderBottom: '1px solid var(--border)', padding: '12px 24px', backgroundColor: 'var(--surface-0)', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          {/* Scramble */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 4 }}>
              {EVENT_LABELS[room.event] ?? room.event} · {FORMAT_LABELS[room.format]} · Round {room.currentRound}
            </div>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 13, fontWeight: 500, color: 'var(--text-primary)', letterSpacing: '0.04em', lineHeight: 1.7, wordBreak: 'break-all' }}>
              {room.scramble}
            </div>
          </div>
          {/* Viz */}
          {room.scramble && (
            <div style={{ flexShrink: 0 }}>
              <ScrambleViz scramble={room.scramble} event={room.event} size={80} />
            </div>
          )}
          {/* Score */}
          {participants.length > 1 && (
            <div style={{ flexShrink: 0, borderLeft: '1px solid var(--border)', paddingLeft: 16 }}>
              <Scoreboard participants={participants} myUid={myUid} format={room.format} />
            </div>
          )}
        </div>
      </div>

      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* Timer area */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, userSelect: 'none', position: 'relative', padding: 24 }}>

          {!submitted && !isCountdown && !manualMode && (
            <button
              onClick={() => setManualMode(true)}
              style={{
                position: 'absolute', bottom: 20, left: 24, fontSize: 11, fontWeight: 500,
                padding: '5px 12px', borderRadius: 8, border: '1px solid var(--border)',
                backgroundColor: 'transparent', color: 'var(--text-muted)', cursor: 'pointer',
              }}
            >
              Manual entry
            </button>
          )}

          <AnimatePresence mode="wait">
            {submitted ? (
              <motion.div key="submitted" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.2 }} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--positive)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 8 }}>
                  Submitted
                </div>
                <div style={{ fontSize: 64, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace", letterSpacing: '-0.03em', color: myPenalty === 'DNF' ? 'var(--penalty)' : 'var(--positive)', lineHeight: 1 }}>
                  {myPenalty === 'DNF' ? 'DNF' : formatTime(myPenalty === '+2' ? submittedTime + 2000 : submittedTime)}
                </div>
                {myPenalty === '+2' && (
                  <div style={{ fontSize: 12, color: 'var(--inspection)', marginTop: 4, fontFamily: "'JetBrains Mono', monospace" }}>+2 penalty</div>
                )}
                <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 12 }}>
                  Waiting for others…
                </div>
              </motion.div>
            ) : isCountdown ? (
              <motion.div key="countdown" initial={{ scale: 1.3, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.8, opacity: 0 }} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 112, fontWeight: 800, fontFamily: "'JetBrains Mono', monospace", color: 'var(--inspection)', lineHeight: 1 }}>
                  {countdown}
                </div>
                <div style={{ fontSize: 14, color: 'var(--text-muted)', marginTop: 10 }}>Get ready…</div>
              </motion.div>
            ) : manualMode ? (
              <motion.div key="manual" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20 }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>Manual time entry</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Type seconds (9.43) or minutes (1:03.45)</div>
                </div>
                <input
                  autoFocus
                  value={manualInput}
                  onChange={e => setManualInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleManualSubmit()}
                  placeholder="0.00"
                  style={{
                    fontSize: 48, fontFamily: "'JetBrains Mono', monospace", fontWeight: 700,
                    textAlign: 'center', width: 240, padding: '14px 20px', borderRadius: 14,
                    backgroundColor: 'var(--surface-1)',
                    border: `2px solid ${manualInput.trim() ? 'var(--accent)' : 'var(--border)'}`,
                    color: manualInput.trim() ? 'var(--text-primary)' : 'var(--text-muted)',
                    outline: 'none', letterSpacing: '0.02em',
                    transition: 'border-color 150ms ease, color 150ms ease',
                  }}
                />
                <PenaltyChips value={myPenalty} onChange={setMyPenalty} />
                <div style={{ display: 'flex', gap: 10 }}>
                  <button onClick={() => setManualMode(false)} style={{ padding: '11px 22px', borderRadius: 10, border: '1px solid var(--border)', backgroundColor: 'transparent', color: 'var(--text-muted)', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                    Cancel
                  </button>
                  <button
                    onClick={handleManualSubmit}
                    disabled={!manualInput.trim()}
                    style={{
                      padding: '11px 32px', borderRadius: 10, border: 'none',
                      backgroundColor: manualInput.trim() ? 'var(--accent)' : 'var(--surface-1)',
                      color: manualInput.trim() ? '#020617' : 'var(--text-muted)',
                      fontSize: 13, fontWeight: 700, cursor: manualInput.trim() ? 'pointer' : 'not-allowed',
                      transition: 'all 150ms ease',
                    }}
                    onMouseDown={e => { if (manualInput.trim()) e.currentTarget.style.transform = 'scale(0.97)' }}
                    onMouseUp={e => { e.currentTarget.style.transform = 'scale(1)' }}
                  >
                    Submit time
                  </button>
                </div>
              </motion.div>
            ) : (
              <motion.div key="timer" style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 96, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace", letterSpacing: '-0.04em', color: timerColor, lineHeight: 1, transition: 'color 150ms ease' }}>
                  {timerPhase === 'idle' ? 'READY' : formatTime(elapsed)}
                </div>
                <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 10 }}>
                  {timerPhase === 'idle' ? 'Hold Space to start' : timerPhase === 'armed' ? 'Release to start' : timerPhase === 'running' ? 'Press Space to stop' : ''}
                </div>
                {timerPhase === 'done' && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, marginTop: 24 }}>
                    <PenaltyChips value={myPenalty} onChange={setMyPenalty} />
                    <button
                      onClick={() => void handleSubmit(myPenalty, elapsed)}
                      style={{ padding: '12px 40px', borderRadius: 10, border: 'none', backgroundColor: 'var(--accent)', color: '#020617', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}
                      onMouseDown={e => { e.currentTarget.style.transform = 'scale(0.98)' }}
                      onMouseUp={e => { e.currentTarget.style.transform = 'scale(1)' }}
                    >
                      Submit
                    </button>
                  </motion.div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Rivals sidebar */}
        {others.length > 0 && (
          <div className="race-sidebar" style={{ width: 200, borderLeft: '1px solid var(--border)', padding: '16px 12px', display: 'flex', flexDirection: 'column', gap: 8, overflowY: 'auto', flexShrink: 0 }}>
            <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 4 }}>Rivals</div>
            {others.map(p => {
              const done = p.finishedAt !== null
              const dnf = p.penalty === 'DNF'
              return (
                <div key={p.id} style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '10px 12px', borderRadius: 10, backgroundColor: 'var(--surface-1)', border: '1px solid var(--border)',
                }}>
                  <Avatar name={p.displayName} color={avatarColor(p.uid)} size={30} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.displayName}</div>
                    <div style={{ fontSize: 11, fontFamily: "'JetBrains Mono', monospace", color: done ? (dnf ? 'var(--penalty)' : 'var(--positive)') : 'var(--text-muted)', marginTop: 2 }}>
                      {done ? (dnf ? 'DNF' : formatTime(p.solveTime!)) : 'solving…'}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      <style>{`@media(max-width:767px){.race-sidebar{display:none!important}}`}</style>
    </div>
  )
}
