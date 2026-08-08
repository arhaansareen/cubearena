import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useTimer } from '@/hooks/useTimer'
import { generateScramble } from '@/lib/scramble'
import { formatTime } from '@/lib/utils'
import type { WCAEvent } from '@/types'

// ─── Types ───────────────────────────────────────────────────────────────────

type Difficulty = 'Beginner' | 'Club' | 'National' | 'Elite'
type CompPhase = 'setup' | 'competing' | 'results'

interface CompetitorSolve {
  time: number // ms, Infinity = DNF
  resolved: boolean
}

interface Competitor {
  id: string
  name: string
  wcaId: string
  targetMean: number
  sigma: number
  solves: CompetitorSolve[]
}

interface UserSolve {
  time: number // ms, Infinity = DNF
}

// ─── Constants ───────────────────────────────────────────────────────────────

const WCA_EVENTS: { value: WCAEvent; label: string }[] = [
  { value: '333',   label: '3x3x3 Cube' },
  { value: '222',   label: '2x2x2 Cube' },
  { value: '444',   label: '4x4x4 Cube' },
  { value: '555',   label: '5x5x5 Cube' },
  { value: '666',   label: '6x6x6 Cube' },
  { value: '777',   label: '7x7x7 Cube' },
  { value: '333bf', label: '3x3x3 Blindfolded' },
  { value: '333oh', label: '3x3x3 One-Handed' },
  { value: '333fm', label: '3x3x3 Fewest Moves' },
  { value: 'clock', label: 'Clock' },
  { value: 'minx',  label: 'Megaminx' },
  { value: 'pyram', label: 'Pyraminx' },
  { value: 'skewb', label: 'Skewb' },
  { value: 'sq1',   label: 'Square-1' },
  { value: '444bf', label: '4x4x4 Blindfolded' },
  { value: '555bf', label: '5x5x5 Blindfolded' },
]

const DIFFICULTIES: Difficulty[] = ['Beginner', 'Club', 'National', 'Elite']

const DIFFICULTY_PARAMS: Record<Difficulty, { meanMin: number; meanMax: number; sigma: number }> = {
  Beginner: { meanMin: 40000, meanMax: 70000, sigma: 8000 },
  Club:     { meanMin: 18000, meanMax: 30000, sigma: 3000 },
  National: { meanMin: 10000, meanMax: 16000, sigma: 1500 },
  Elite:    { meanMin: 6000,  meanMax: 9500,  sigma: 700  },
}

const FIRST_NAMES = [
  'Max', 'Felix', 'Tymon', 'Patrick', 'Sebastian', 'Lucas', 'Mateus',
  'Philipp', 'Mats', 'Nathan', 'Drew', 'Brest', 'Jayden', 'Kyle', 'Kai',
]

const LAST_NAMES = [
  'Park', 'Kotzabassis', 'Zemdegs', 'Kowalczyk', 'Weyer', 'Etter', 'Costa',
  'Weixler', 'Valk', 'Bahrani', 'Brads', 'Sungchul', 'Lim', 'Choo', 'Martin',
]

const NUM_COMPETITORS = 8
const NUM_SOLVES = 5

// ─── Helpers ─────────────────────────────────────────────────────────────────

function sampleGaussian(mean: number, sigma: number): number {
  let u = 0, v = 0
  while (u === 0) u = Math.random()
  while (v === 0) v = Math.random()
  const z = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v)
  return Math.max(3000, mean + z * sigma)
}

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

function generateWcaId(surname: string, year: number, suffix: number): string {
  const last4 = surname.replace(/[^A-Za-z]/g, '').toUpperCase().padEnd(4, 'X').slice(0, 4)
  const suf = String(suffix).padStart(2, '0')
  return `${year}${last4}${suf}`
}

function computeAo5Simple(times: number[]): number | null {
  const completed = times.filter((t) => isFinite(t))
  if (times.length < 5) return null
  // WCA ao5: drop best and worst, average middle 3
  const sorted = [...times].sort((a, b) => a - b)
  const trimmed = sorted.slice(1, 4)
  if (trimmed.some((t) => !isFinite(t))) return Infinity
  return trimmed.reduce((a, b) => a + b, 0) / trimmed.length
  void completed
}

function computeCurrentBest(times: number[]): number | null {
  if (times.length === 0) return null
  return Math.min(...times.filter((t) => isFinite(t)))
}

function generateCompetitors(difficulty: Difficulty): Competitor[] {
  const params = DIFFICULTY_PARAMS[difficulty]
  const usedNames = new Set<string>()
  const competitors: Competitor[] = []

  for (let i = 0; i < NUM_COMPETITORS; i++) {
    let firstName: string
    let lastName: string
    let fullName: string

    // Avoid duplicate names
    let attempts = 0
    do {
      firstName = pickRandom(FIRST_NAMES)
      lastName = pickRandom(LAST_NAMES)
      fullName = `${firstName} ${lastName}`
      attempts++
    } while (usedNames.has(fullName) && attempts < 50)

    usedNames.add(fullName)

    const year = 2015 + Math.floor(Math.random() * 9) // 2015-2023
    const suffix = 1 + Math.floor(Math.random() * 9)  // 01-09
    const wcaId = generateWcaId(lastName, year, suffix)

    const targetMean = params.meanMin + Math.random() * (params.meanMax - params.meanMin)

    competitors.push({
      id: `comp-${i}`,
      name: fullName,
      wcaId,
      targetMean,
      sigma: params.sigma,
      solves: [],
    })
  }

  return competitors
}

// ─── Leaderboard ─────────────────────────────────────────────────────────────

interface LeaderboardEntry {
  rank: number
  name: string
  wcaId: string
  isUser: boolean
  solves: { time: number | null; resolved: boolean }[]
  ao5: number | null
}

function buildLeaderboard(
  competitors: Competitor[],
  userSolves: UserSolve[],
  userName: string,
): LeaderboardEntry[] {
  const userTimes = userSolves.map((s) => s.time)

  const entries: LeaderboardEntry[] = [
    {
      rank: 0,
      name: userName,
      wcaId: '',
      isUser: true,
      solves: userTimes.map((t) => ({ time: t, resolved: true })),
      ao5: computeAo5Simple(userTimes),
    },
    ...competitors.map((c) => ({
      rank: 0,
      name: c.name,
      wcaId: c.wcaId,
      isUser: false,
      solves: c.solves.map((s) => ({ time: s.time, resolved: s.resolved })),
      ao5: computeAo5Simple(c.solves.map((s) => s.time)),
    })),
  ]

  // Sort: completed ao5 first (ascending), then by current best, then pending
  entries.sort((a, b) => {
    const aAo5 = a.ao5
    const bAo5 = b.ao5

    if (aAo5 !== null && bAo5 !== null) {
      if (!isFinite(aAo5) && !isFinite(bAo5)) return 0
      if (!isFinite(aAo5)) return 1
      if (!isFinite(bAo5)) return -1
      return aAo5 - bAo5
    }
    if (aAo5 !== null) return -1
    if (bAo5 !== null) return 1

    const aBest = computeCurrentBest(a.solves.map((s) => s.time ?? Infinity)) ?? Infinity
    const bBest = computeCurrentBest(b.solves.map((s) => s.time ?? Infinity)) ?? Infinity
    return aBest - bBest
  })

  entries.forEach((e, i) => { e.rank = i + 1 })
  return entries
}

// ─── SolveChip ───────────────────────────────────────────────────────────────

function SolveChip({ time, resolved }: { time: number | null; resolved: boolean }) {
  let bg = 'var(--surface-1)'
  let color = 'var(--text-muted)'
  let label = '--'

  if (resolved && time !== null) {
    if (!isFinite(time)) {
      bg = 'rgba(239,68,68,0.18)'
      color = 'var(--penalty)'
      label = 'DNF'
    } else {
      bg = 'rgba(34,211,238,0.1)'
      color = 'var(--accent)'
      label = formatTime(time)
    }
  }

  return (
    <span
      className="font-mono"
      style={{
        display: 'inline-block',
        padding: '2px 6px',
        borderRadius: 4,
        fontSize: 11,
        fontWeight: 600,
        background: bg,
        color,
        whiteSpace: 'nowrap',
      }}
    >
      {label}
    </span>
  )
}

// ─── LeaderboardPanel ────────────────────────────────────────────────────────

interface LeaderboardPanelProps {
  entries: LeaderboardEntry[]
  solveIndex: number
}

function LeaderboardPanel({ entries, solveIndex }: LeaderboardPanelProps) {
  return (
    <div
      style={{
        backgroundColor: 'var(--surface-0)',
        border: '1px solid var(--border)',
        borderRadius: 12,
        overflow: 'hidden',
        width: '100%',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '36px 1fr 100px auto',
          gap: 8,
          padding: '10px 16px',
          borderBottom: '1px solid var(--border)',
          fontSize: 11,
          fontWeight: 600,
          color: 'var(--text-muted)',
          textTransform: 'uppercase',
          letterSpacing: '0.06em',
        }}
      >
        <span>#</span>
        <span>Competitor</span>
        <span>Solves</span>
        <span style={{ textAlign: 'right' }}>Ao5</span>
      </div>

      {/* Rows */}
      {entries.map((entry) => (
        <motion.div
          key={entry.name}
          layout
          transition={{ duration: 0.3, ease: 'easeInOut' }}
          style={{
            display: 'grid',
            gridTemplateColumns: '36px 1fr 100px auto',
            gap: 8,
            padding: '10px 16px',
            borderBottom: '1px solid var(--border)',
            backgroundColor: entry.isUser
              ? 'var(--accent-dim)'
              : 'transparent',
            border: entry.isUser
              ? '1px solid rgba(34,211,238,0.3)'
              : undefined,
            alignItems: 'center',
          }}
        >
          {/* Rank */}
          <span
            style={{
              fontSize: 13,
              fontWeight: 700,
              color: entry.rank === 1 ? 'var(--accent)' : 'var(--text-muted)',
              fontFamily: "'JetBrains Mono', monospace",
            }}
          >
            #{entry.rank}
          </span>

          {/* Name + WCA ID */}
          <div style={{ minWidth: 0 }}>
            <div
              style={{
                fontSize: 13,
                fontWeight: entry.isUser ? 700 : 500,
                color: entry.isUser ? 'var(--accent)' : 'var(--text-primary)',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {entry.name}
              {entry.isUser && (
                <span
                  style={{
                    marginLeft: 6,
                    fontSize: 10,
                    fontWeight: 600,
                    color: 'var(--accent)',
                    backgroundColor: 'rgba(34,211,238,0.12)',
                    padding: '1px 5px',
                    borderRadius: 3,
                  }}
                >
                  YOU
                </span>
              )}
            </div>
            {entry.wcaId && (
              <div
                className="font-mono"
                style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 1 }}
              >
                {entry.wcaId}
              </div>
            )}
          </div>

          {/* Solve chips */}
          <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
            {Array.from({ length: NUM_SOLVES }).map((_, i) => {
              const solve = entry.solves[i]
              return (
                <SolveChip
                  key={i}
                  time={solve?.time ?? null}
                  resolved={solve?.resolved ?? false}
                />
              )
            })}
          </div>

          {/* Ao5 */}
          <span
            className="font-mono"
            style={{
              fontSize: 13,
              fontWeight: 700,
              color:
                entry.ao5 !== null
                  ? isFinite(entry.ao5)
                    ? 'var(--accent)'
                    : 'var(--penalty)'
                  : 'var(--text-muted)',
              textAlign: 'right',
              whiteSpace: 'nowrap',
            }}
          >
            {entry.ao5 !== null ? formatTime(entry.ao5) : '--'}
          </span>
        </motion.div>
      ))}

      {/* Padding if fewer than needed */}
      {entries.length === 0 && (
        <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
          No competitors yet.
        </div>
      )}

      {/* solve progress indicator */}
      <div
        style={{
          padding: '8px 16px',
          fontSize: 11,
          color: 'var(--text-muted)',
          textAlign: 'center',
        }}
      >
        Solve {Math.min(solveIndex + 1, NUM_SOLVES)} of {NUM_SOLVES}
      </div>
    </div>
  )
}

// ─── TimerDisplay ────────────────────────────────────────────────────────────

interface TimerDisplayProps {
  phase: string
  displayTime: number
  inspectionElapsed: number
  pendingPenalty: null | '+2' | 'DNF'
}

function TimerDisplay({ phase, displayTime, inspectionElapsed, pendingPenalty }: TimerDisplayProps) {
  let color = 'var(--text-muted)'
  let label = '0.00'

  if (phase === 'idle') {
    color = 'var(--text-muted)'
    label = '0.00'
  } else if (phase === 'armed') {
    color = 'var(--positive)'
    label = '0.00'
  } else if (phase === 'inspection') {
    const remaining = Math.max(0, 15000 - inspectionElapsed)
    color = pendingPenalty ? 'var(--penalty)' : 'var(--inspection)'
    label = String(Math.ceil(remaining / 1000))
  } else if (phase === 'solving') {
    color = 'var(--text-primary)'
    label = formatTime(displayTime)
  } else if (phase === 'stopped') {
    color = 'var(--accent)'
    label = formatTime(displayTime)
  }

  return (
    <div
      className="font-mono"
      style={{
        fontSize: 'clamp(48px, 10vw, 88px)',
        fontWeight: 700,
        color,
        letterSpacing: '-0.03em',
        transition: 'color 150ms ease',
        textAlign: 'center',
        lineHeight: 1,
        userSelect: 'none',
      }}
    >
      {label}
    </div>
  )
}

// ─── Main Page ───────────────────────────────────────────────────────────────

export function CompetitionPage() {
  const navigate = useNavigate()

  // ── Setup state ──
  const [compPhase, setCompPhase] = useState<CompPhase>('setup')
  const [selectedEvent, setSelectedEvent] = useState<WCAEvent>('333')
  const [selectedDifficulty, setSelectedDifficulty] = useState<Difficulty>('Club')

  // ── Competition state ──
  const [competitors, setCompetitors] = useState<Competitor[]>([])
  const [userSolves, setUserSolves] = useState<UserSolve[]>([])
  const [solveIndex, setSolveIndex] = useState(0)
  const [scrambles, setScrambles] = useState<string[]>([])
  const [advancePending, setAdvancePending] = useState(false)

  // Refs for AI timeouts
  const aiTimeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([])
  const userNameRef = useRef('You')

  // ── Timer ──
  const {
    phase: timerPhase,
    displayTime,
    inspectionElapsed,
    pendingPenalty,
    reset: resetTimer,
  } = useTimer({
    mode: 'live',
    onSolveComplete: useCallback(
      (result: import('@/hooks/useTimer').TimerResult) => {
        const effectiveTime =
          result.pendingPenalty === 'DNF'
            ? Infinity
            : result.pendingPenalty === '+2'
            ? result.time + 2000
            : result.time

        setUserSolves((prev) => [...prev, { time: effectiveTime }])

        // Resolve any AI competitors still pending
        setCompetitors((prev) =>
          prev.map((c) => ({
            ...c,
            solves: c.solves.map((s) => ({ ...s, resolved: true })),
          }))
        )

        setAdvancePending(true)
      },
      []
    ),
  })

  // Auto-advance to next solve after a pause
  useEffect(() => {
    if (!advancePending) return

    const tid = setTimeout(() => {
      setAdvancePending(false)
      setSolveIndex((prev) => {
        const next = prev + 1
        if (next >= NUM_SOLVES) {
          setCompPhase('results')
        }
        return next
      })
      resetTimer()
    }, 2000)

    return () => clearTimeout(tid)
  }, [advancePending, resetTimer])

  // ── Generate scrambles when competition starts ──
  function startRound() {
    const newScrambles = Array.from({ length: NUM_SOLVES }, () => generateScramble(selectedEvent))
    setScrambles(newScrambles)
    setCompetitors(generateCompetitors(selectedDifficulty))
    setUserSolves([])
    setSolveIndex(0)
    setAdvancePending(false)
    resetTimer()
    setCompPhase('competing')
  }

  // ── Simulate AI solve when user's solve starts ──
  useEffect(() => {
    if (timerPhase !== 'solving') return
    if (compPhase !== 'competing') return

    // Clear any old timeouts
    aiTimeoutsRef.current.forEach(clearTimeout)
    aiTimeoutsRef.current = []

    const currentSolveIdx = solveIndex

    setCompetitors((prev) =>
      prev.map((c) => {
        const sampledTime = sampleGaussian(c.targetMean, c.sigma)
        const tid = setTimeout(() => {
          setCompetitors((inner) =>
            inner.map((ic) => {
              if (ic.id !== c.id) return ic
              const updatedSolves = [...ic.solves]
              updatedSolves[currentSolveIdx] = { time: sampledTime, resolved: true }
              return { ...ic, solves: updatedSolves }
            })
          )
        }, sampledTime)

        aiTimeoutsRef.current.push(tid)

        // Add a pending (unresolved) entry now
        const updatedSolves = [...c.solves]
        updatedSolves[currentSolveIdx] = { time: sampledTime, resolved: false }
        return { ...c, solves: updatedSolves }
      })
    )

    return () => {
      aiTimeoutsRef.current.forEach(clearTimeout)
      aiTimeoutsRef.current = []
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timerPhase])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      aiTimeoutsRef.current.forEach(clearTimeout)
    }
  }, [])

  // ── Leaderboard data ──
  const leaderboardEntries = buildLeaderboard(competitors, userSolves, userNameRef.current)
  const userEntry = leaderboardEntries.find((e) => e.isUser)
  const userRank = userEntry?.rank ?? 0
  const userAo5 = userEntry?.ao5 ?? null

  const currentScramble = scrambles[solveIndex] ?? ''

  // ── Phase: hint text ──
  let timerHint = ''
  if (timerPhase === 'idle') timerHint = 'Hold Space to start inspection'
  else if (timerPhase === 'inspection') timerHint = 'Hold Space to start solving'
  else if (timerPhase === 'armed') timerHint = 'Release to start'
  else if (timerPhase === 'solving') timerHint = 'Press Space to stop'
  else if (timerPhase === 'stopped') timerHint = 'Next solve in a moment...'

  // ─── Render: Setup ───────────────────────────────────────────────────────

  if (compPhase === 'setup') {
    return (
      <div
        style={{
          minHeight: '100dvh',
          backgroundColor: 'var(--bg)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 24,
        }}
      >
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          style={{
            backgroundColor: 'var(--surface-0)',
            border: '1px solid var(--border)',
            borderRadius: 16,
            padding: 40,
            width: '100%',
            maxWidth: 480,
          }}
        >
          {/* Title */}
          <h1
            style={{
              fontSize: 24,
              fontWeight: 700,
              color: 'var(--text-primary)',
              marginBottom: 4,
              letterSpacing: '-0.02em',
            }}
          >
            Competition Round
          </h1>
          <p style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 32 }}>
            Simulate a WCA competition round. You'll complete 5 solves alongside{' '}
            {NUM_COMPETITORS} competitors.
          </p>

          {/* Event selector */}
          <div style={{ marginBottom: 24 }}>
            <label
              style={{
                display: 'block',
                fontSize: 12,
                fontWeight: 600,
                color: 'var(--text-muted)',
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                marginBottom: 8,
              }}
            >
              Event
            </label>
            <select
              value={selectedEvent}
              onChange={(e) => setSelectedEvent(e.target.value as WCAEvent)}
              style={{
                width: '100%',
                padding: '10px 12px',
                backgroundColor: 'var(--surface-1)',
                border: '1px solid var(--border)',
                borderRadius: 8,
                color: 'var(--text-primary)',
                fontSize: 14,
                fontFamily: 'Inter, sans-serif',
                outline: 'none',
                cursor: 'pointer',
                appearance: 'none',
                WebkitAppearance: 'none',
              }}
            >
              {WCA_EVENTS.map((ev) => (
                <option key={ev.value} value={ev.value}>
                  {ev.label}
                </option>
              ))}
            </select>
          </div>

          {/* Difficulty */}
          <div style={{ marginBottom: 32 }}>
            <label
              style={{
                display: 'block',
                fontSize: 12,
                fontWeight: 600,
                color: 'var(--text-muted)',
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                marginBottom: 8,
              }}
            >
              Round Difficulty
            </label>
            <div style={{ display: 'flex', gap: 8 }}>
              {DIFFICULTIES.map((d) => {
                const isSelected = d === selectedDifficulty
                return (
                  <button
                    key={d}
                    onClick={() => setSelectedDifficulty(d)}
                    style={{
                      flex: 1,
                      padding: '8px 4px',
                      borderRadius: 8,
                      border: isSelected
                        ? '1px solid var(--accent)'
                        : '1px solid var(--border)',
                      backgroundColor: isSelected ? 'var(--accent-dim)' : 'var(--surface-1)',
                      color: isSelected ? 'var(--accent)' : 'var(--text-muted)',
                      fontSize: 13,
                      fontWeight: isSelected ? 700 : 500,
                      cursor: 'pointer',
                      transition: 'all 150ms ease',
                      fontFamily: 'Inter, sans-serif',
                    }}
                  >
                    {d}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Start */}
          <button
            onClick={startRound}
            style={{
              width: '100%',
              padding: '14px 0',
              borderRadius: 10,
              border: 'none',
              backgroundColor: 'var(--accent)',
              color: '#000',
              fontSize: 15,
              fontWeight: 700,
              cursor: 'pointer',
              fontFamily: 'Inter, sans-serif',
              letterSpacing: '-0.01em',
              transition: 'opacity 150ms ease',
            }}
            onMouseOver={(e) => { (e.currentTarget as HTMLButtonElement).style.opacity = '0.85' }}
            onMouseOut={(e) => { (e.currentTarget as HTMLButtonElement).style.opacity = '1' }}
          >
            Start Round
          </button>
        </motion.div>
      </div>
    )
  }

  // ─── Render: Results ─────────────────────────────────────────────────────

  if (compPhase === 'results') {
    return (
      <div
        style={{
          minHeight: '100dvh',
          backgroundColor: 'var(--bg)',
          padding: '24px 24px 40px',
          overflowY: 'auto',
        }}
      >
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          style={{ maxWidth: 760, margin: '0 auto' }}
        >
          {/* Header */}
          <div style={{ marginBottom: 32 }}>
            <h1
              style={{
                fontSize: 28,
                fontWeight: 700,
                color: 'var(--text-primary)',
                marginBottom: 8,
                letterSpacing: '-0.02em',
              }}
            >
              Round Complete
            </h1>
            <p style={{ fontSize: 15, color: 'var(--text-muted)' }}>
              You finished{' '}
              <span
                style={{
                  color: userRank === 1 ? 'var(--accent)' : 'var(--text-primary)',
                  fontWeight: 700,
                }}
              >
                #{userRank} of {NUM_COMPETITORS + 1}
              </span>
              {userAo5 !== null && (
                <>
                  {' '}with an ao5 of{' '}
                  <span
                    className="font-mono"
                    style={{ color: 'var(--accent)', fontWeight: 700 }}
                  >
                    {isFinite(userAo5) ? formatTime(userAo5) : 'DNF'}
                  </span>
                </>
              )}
            </p>
          </div>

          {/* Final Leaderboard */}
          <div style={{ marginBottom: 32 }}>
            <LeaderboardPanel entries={leaderboardEntries} solveIndex={NUM_SOLVES} />
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: 12 }}>
            <button
              onClick={() => {
                setCompPhase('setup')
                setUserSolves([])
                setCompetitors([])
                setSolveIndex(0)
                setScrambles([])
                resetTimer()
              }}
              style={{
                flex: 1,
                padding: '13px 0',
                borderRadius: 10,
                border: 'none',
                backgroundColor: 'var(--accent)',
                color: '#000',
                fontSize: 14,
                fontWeight: 700,
                cursor: 'pointer',
                fontFamily: 'Inter, sans-serif',
                transition: 'opacity 150ms ease',
              }}
              onMouseOver={(e) => { (e.currentTarget as HTMLButtonElement).style.opacity = '0.85' }}
              onMouseOut={(e) => { (e.currentTarget as HTMLButtonElement).style.opacity = '1' }}
            >
              New Round
            </button>
            <button
              onClick={() => navigate('/session')}
              style={{
                flex: 1,
                padding: '13px 0',
                borderRadius: 10,
                border: '1px solid var(--border)',
                backgroundColor: 'var(--surface-0)',
                color: 'var(--text-primary)',
                fontSize: 14,
                fontWeight: 600,
                cursor: 'pointer',
                fontFamily: 'Inter, sans-serif',
                transition: 'background-color 150ms ease',
              }}
              onMouseOver={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'var(--surface-1)' }}
              onMouseOut={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'var(--surface-0)' }}
            >
              Back to Session
            </button>
          </div>
        </motion.div>
      </div>
    )
  }

  // ─── Render: Competing ───────────────────────────────────────────────────

  return (
    <div
      style={{
        minHeight: '100dvh',
        backgroundColor: 'var(--bg)',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Top bar */}
      <div
        style={{
          padding: '16px 24px',
          borderBottom: '1px solid var(--border)',
          backgroundColor: 'var(--surface-0)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexShrink: 0,
        }}
      >
        <div>
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)' }}>
            Solve {Math.min(solveIndex + 1, NUM_SOLVES)} / {NUM_SOLVES}
          </span>
          <span
            style={{
              marginLeft: 12,
              fontSize: 12,
              color: 'var(--text-muted)',
              fontWeight: 500,
            }}
          >
            {WCA_EVENTS.find((e) => e.value === selectedEvent)?.label}
            {' · '}
            {selectedDifficulty}
          </span>
        </div>
        <button
          onClick={() => {
            aiTimeoutsRef.current.forEach(clearTimeout)
            setCompPhase('setup')
            setUserSolves([])
            setCompetitors([])
            setSolveIndex(0)
            setScrambles([])
            resetTimer()
          }}
          style={{
            padding: '6px 14px',
            borderRadius: 6,
            border: '1px solid var(--border)',
            backgroundColor: 'transparent',
            color: 'var(--text-muted)',
            fontSize: 13,
            cursor: 'pointer',
            fontFamily: 'Inter, sans-serif',
          }}
        >
          Quit
        </button>
      </div>

      {/* Body */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          gap: 24,
          padding: 24,
          overflowY: 'auto',
          flexWrap: 'wrap',
        }}
      >
        {/* Left: Timer area */}
        <div
          style={{
            flex: '1 1 320px',
            display: 'flex',
            flexDirection: 'column',
            gap: 24,
          }}
        >
          {/* Scramble */}
          <div
            style={{
              backgroundColor: 'var(--surface-0)',
              border: '1px solid var(--border)',
              borderRadius: 12,
              padding: '16px 20px',
            }}
          >
            <div
              style={{
                fontSize: 11,
                fontWeight: 600,
                color: 'var(--text-muted)',
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                marginBottom: 10,
              }}
            >
              Scramble
            </div>
            <AnimatePresence mode="wait">
              <motion.p
                key={currentScramble}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.2 }}
                className="font-mono"
                style={{
                  fontSize: 13,
                  color: 'var(--text-primary)',
                  lineHeight: 1.6,
                  margin: 0,
                  wordBreak: 'break-word',
                  whiteSpace: 'pre-wrap',
                }}
              >
                {currentScramble}
              </motion.p>
            </AnimatePresence>
          </div>

          {/* Timer */}
          <div
            style={{
              backgroundColor: 'var(--surface-0)',
              border: '1px solid var(--border)',
              borderRadius: 12,
              padding: '40px 20px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 16,
              flex: 1,
              minHeight: 200,
            }}
          >
            <TimerDisplay
              phase={timerPhase}
              displayTime={displayTime}
              inspectionElapsed={inspectionElapsed}
              pendingPenalty={pendingPenalty}
            />
            {pendingPenalty && (
              <span
                style={{
                  fontSize: 13,
                  fontWeight: 700,
                  color: 'var(--penalty)',
                  fontFamily: "'JetBrains Mono', monospace",
                }}
              >
                {pendingPenalty}
              </span>
            )}
            <p
              style={{
                fontSize: 13,
                color: 'var(--text-muted)',
                margin: 0,
                textAlign: 'center',
              }}
            >
              {timerHint}
            </p>
          </div>

          {/* User's own solves so far */}
          {userSolves.length > 0 && (
            <div
              style={{
                backgroundColor: 'var(--surface-0)',
                border: '1px solid var(--border)',
                borderRadius: 12,
                padding: '14px 20px',
              }}
            >
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  color: 'var(--text-muted)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  marginBottom: 10,
                }}
              >
                Your Solves
              </div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {userSolves.map((s, i) => (
                  <SolveChip key={i} time={s.time} resolved={true} />
                ))}
              </div>
              {userSolves.length === NUM_SOLVES && userEntry?.ao5 !== null && (
                <div
                  className="font-mono"
                  style={{
                    marginTop: 10,
                    fontSize: 13,
                    fontWeight: 700,
                    color: 'var(--accent)',
                  }}
                >
                  Ao5: {userEntry && isFinite(userEntry.ao5!) ? formatTime(userEntry.ao5!) : 'DNF'}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right: Leaderboard */}
        <div style={{ flex: '1 1 280px', minWidth: 0 }}>
          <div
            style={{
              fontSize: 11,
              fontWeight: 600,
              color: 'var(--text-muted)',
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              marginBottom: 10,
            }}
          >
            Leaderboard
          </div>
          <LeaderboardPanel entries={leaderboardEntries} solveIndex={solveIndex} />
        </div>
      </div>
    </div>
  )
}
