import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useTimer } from '@/hooks/useTimer'
import { ManualTimeInput } from '@/components/session/ManualTimeInput'
import { generateScramble } from '@/lib/scramble'
import { formatTime } from '@/lib/utils'
import type { WCAEvent } from '@/types'
import { useWCACompetitions } from '@/hooks/useWCACompetitions'
import { useCompetitionWCIF } from '@/hooks/useCompetitionWCIF'
import type { WCACompetition } from '@/hooks/useWCACompetitions'
import type { CompetitorWithPB } from '@/hooks/useCompetitionWCIF'

// ─── Types ───────────────────────────────────────────────────────────────────

type CompPhase = 'setup' | 'competing' | 'results'
type RealModeStep = 'pick_comp' | 'pick_event' | 'loading_competitors' | 'ready'

interface CompetitorSolve {
  time: number        // ms, Infinity = DNF
  resolved: boolean   // false = hidden (competitor hasn't "finished" yet)
}

interface Competitor {
  id: string
  name: string
  wcaId: string
  countryIso2: string | null
  targetMean: number
  sigma: number
  solves: CompetitorSolve[]
  realPB: number | null
}

interface UserSolve {
  time: number
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

const EVENT_LABELS: Record<string, string> = Object.fromEntries(
  WCA_EVENTS.map((e) => [e.value, e.label]),
)

const NUM_SOLVES = 5

const COUNTRY_FLAGS: Record<string, string> = {
  US: '🇺🇸', CN: '🇨🇳', GB: '🇬🇧', DE: '🇩🇪', AU: '🇦🇺', CA: '🇨🇦', FR: '🇫🇷',
  IN: '🇮🇳', JP: '🇯🇵', KR: '🇰🇷', BR: '🇧🇷', PL: '🇵🇱', NL: '🇳🇱', SE: '🇸🇪',
  PH: '🇵🇭', ID: '🇮🇩', MX: '🇲🇽', ES: '🇪🇸', IT: '🇮🇹', CZ: '🇨🇿', SK: '🇸🇰',
  HU: '🇭🇺', RO: '🇷🇴', UA: '🇺🇦', RU: '🇷🇺', SG: '🇸🇬', TW: '🇹🇼', HK: '🇭🇰',
  MY: '🇲🇾', TH: '🇹🇭', VN: '🇻🇳', NZ: '🇳🇿', ZA: '🇿🇦', AR: '🇦🇷', CL: '🇨🇱',
  PT: '🇵🇹', AT: '🇦🇹', CH: '🇨🇭', BE: '🇧🇪', DK: '🇩🇰', FI: '🇫🇮', NO: '🇳🇴',
}

const EVENT_FALLBACK_MEANS: Partial<Record<string, number>> = {
  '333': 20000, '222': 5000, '444': 50000, '555': 90000, '666': 180000, '777': 280000,
  '333bf': 120000, '333oh': 30000, 'clock': 15000, 'minx': 90000,
  'pyram': 8000, 'skewb': 12000, 'sq1': 25000, '444bf': 400000, '555bf': 700000,
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function sampleGaussian(mean: number, sigma: number): number {
  let u = 0, v = 0
  while (u === 0) u = Math.random()
  while (v === 0) v = Math.random()
  const z = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v)
  return Math.max(3000, mean + z * sigma)
}

function computeAo5Simple(times: number[]): number | null {
  if (times.length < 5) return null
  const sorted = [...times].sort((a, b) => a - b)
  const trimmed = sorted.slice(1, 4)
  if (trimmed.some((t) => !isFinite(t))) return Infinity
  return trimmed.reduce((a, b) => a + b, 0) / trimmed.length
}

function computeCurrentBest(times: number[]): number | null {
  if (times.length === 0) return null
  return Math.min(...times.filter((t) => isFinite(t)))
}

function competitorsFromReal(realData: CompetitorWithPB[], eventId: string): Competitor[] {
  const fallbackMean = EVENT_FALLBACK_MEANS[eventId] ?? 20000
  return realData.map((r, i) => {
    let targetMean: number
    if (r.pbAvg !== null) targetMean = r.pbAvg
    else if (r.pb !== null) targetMean = r.pb * 1.05
    else targetMean = fallbackMean

    const sigma = Math.max(500, targetMean * 0.08)
    return {
      id: `real-${i}-${r.wcaId}`,
      name: r.name,
      wcaId: r.wcaId,
      countryIso2: r.countryIso2,
      targetMean,
      sigma,
      solves: [],
      realPB: r.pb,
    }
  })
}

// ─── Leaderboard ─────────────────────────────────────────────────────────────

interface LeaderboardEntry {
  rank: number
  name: string
  wcaId: string
  countryIso2: string | null
  realPB: number | null
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
      countryIso2: null,
      realPB: null,
      isUser: true,
      solves: userTimes.map((t) => ({ time: t, resolved: true })),
      ao5: computeAo5Simple(userTimes),
    },
    ...competitors.map((c) => ({
      rank: 0,
      name: c.name,
      wcaId: c.wcaId,
      countryIso2: c.countryIso2,
      realPB: c.realPB,
      isUser: false,
      solves: c.solves.map((s) => ({ time: s.time, resolved: s.resolved })),
      ao5: computeAo5Simple(c.solves.filter((s) => s.resolved).map((s) => s.time)),
    })),
  ]

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
    const aBest = computeCurrentBest(a.solves.filter((s) => s.resolved).map((s) => s.time ?? Infinity)) ?? Infinity
    const bBest = computeCurrentBest(b.solves.filter((s) => s.resolved).map((s) => s.time ?? Infinity)) ?? Infinity
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
    <motion.span
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.2 }}
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
    </motion.span>
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
          gridTemplateColumns: '36px 1fr 80px 120px auto',
          gap: 8,
          padding: '10px 16px',
          borderBottom: '1px solid var(--border)',
          fontSize: 12,
          fontWeight: 500,
          color: 'var(--text-muted)',
        }}
      >
        <span>#</span>
        <span>Competitor</span>
        <span>WCA PB</span>
        <span>Solves</span>
        <span style={{ textAlign: 'right' }}>Ao5</span>
      </div>

      {/* Rows */}
      {entries.map((entry) => (
        <motion.div
          key={entry.name + entry.wcaId}
          layout
          transition={{ duration: 0.3, ease: 'easeInOut' }}
          style={{
            display: 'grid',
            gridTemplateColumns: '36px 1fr 80px 120px auto',
            gap: 8,
            padding: entry.rank === 1 ? '12px 16px' : '10px 16px',
            borderBottom: '1px solid var(--border)',
            backgroundColor: entry.isUser
              ? 'rgba(34,211,238,0.06)'
              : 'transparent',
            outline: entry.rank === 1
              ? '2px solid var(--accent)'
              : entry.isUser
              ? '1px solid rgba(34,211,238,0.3)'
              : 'none',
            outlineOffset: entry.rank === 1 ? '-2px' : '-1px',
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
                display: 'flex',
                alignItems: 'center',
                gap: 4,
              }}
            >
              {entry.countryIso2 && COUNTRY_FLAGS[entry.countryIso2] && (
                <span style={{ fontSize: 13 }}>{COUNTRY_FLAGS[entry.countryIso2]}</span>
              )}
              <span>{entry.name}</span>
              {entry.isUser && (
                <span
                  style={{
                    marginLeft: 4,
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
              <a
                href={`https://www.worldcubeassociation.org/persons/${entry.wcaId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="font-mono"
                style={{
                  fontSize: 10,
                  color: 'var(--accent)',
                  marginTop: 1,
                  display: 'block',
                  textDecoration: 'none',
                  opacity: 0.7,
                }}
              >
                {entry.wcaId}
              </a>
            )}
          </div>

          {/* Real WCA PB */}
          <span
            className="font-mono"
            style={{
              fontSize: 11,
              fontWeight: 600,
              color: entry.realPB !== null ? 'var(--positive)' : 'var(--text-muted)',
              whiteSpace: 'nowrap',
            }}
          >
            {entry.realPB !== null ? formatTime(entry.realPB) : '—'}
          </span>

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

      {entries.length === 0 && (
        <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
          No competitors yet.
        </div>
      )}

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

// ─── PickCompetition ─────────────────────────────────────────────────────────

function PickCompetition({
  onSelect,
  preselectedId,
}: {
  onSelect: (comp: WCACompetition) => void
  preselectedId: string | null
}) {
  const { state, fetchComps } = useWCACompetitions()
  const [search, setSearch] = useState('')
  const [country, setCountry] = useState('')

  useEffect(() => {
    fetchComps(country || undefined)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (state.status === 'success' && preselectedId) {
      const found = state.comps.find((c) => c.id === preselectedId)
      if (found) onSelect(found)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state])

  const handleCountry = (iso2: string) => {
    setCountry(iso2)
    fetchComps(iso2 || undefined)
  }

  const comps = state.status === 'success' ? state.comps : []
  const filtered = search.trim()
    ? comps.filter(
        (c) =>
          c.name.toLowerCase().includes(search.toLowerCase()) ||
          c.city.toLowerCase().includes(search.toLowerCase()),
      )
    : comps

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <input
          type="text"
          placeholder="Search competitions..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            flex: '1 1 180px',
            padding: '8px 12px',
            backgroundColor: 'var(--surface-1)',
            border: '1px solid var(--border)',
            borderRadius: 8,
            color: 'var(--text-primary)',
            fontSize: 13,
            outline: 'none',
            boxSizing: 'border-box',
          }}
          onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--accent)' }}
          onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--border)' }}
        />
        <select
          value={country}
          onChange={(e) => handleCountry(e.target.value)}
          style={{
            flex: '0 0 140px',
            padding: '8px 10px',
            backgroundColor: 'var(--surface-1)',
            border: '1px solid var(--border)',
            borderRadius: 8,
            color: 'var(--text-primary)',
            fontSize: 13,
            outline: 'none',
            cursor: 'pointer',
            appearance: 'none',
            WebkitAppearance: 'none',
          }}
        >
          <option value="">All Countries</option>
          <option value="US">🇺🇸 US</option>
          <option value="CN">🇨🇳 China</option>
          <option value="GB">🇬🇧 UK</option>
          <option value="DE">🇩🇪 Germany</option>
          <option value="AU">🇦🇺 Australia</option>
          <option value="CA">🇨🇦 Canada</option>
          <option value="FR">🇫🇷 France</option>
          <option value="IN">🇮🇳 India</option>
          <option value="JP">🇯🇵 Japan</option>
          <option value="KR">🇰🇷 Korea</option>
          <option value="BR">🇧🇷 Brazil</option>
          <option value="PL">🇵🇱 Poland</option>
          <option value="NL">🇳🇱 Netherlands</option>
          <option value="PH">🇵🇭 Philippines</option>
        </select>
      </div>

      {state.status === 'loading' && (
        <div style={{ padding: 32, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
          <div
            style={{
              width: 20,
              height: 20,
              border: '2px solid var(--border)',
              borderTopColor: 'var(--accent)',
              borderRadius: '50%',
              animation: 'spin 0.8s linear infinite',
              margin: '0 auto 10px',
            }}
          />
          Loading competitions...
        </div>
      )}

      {state.status === 'error' && (
        <div style={{ padding: 16, color: 'var(--penalty)', fontSize: 13 }}>{state.message}</div>
      )}

      {state.status === 'success' && (
        <div style={{ maxHeight: 360, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
          {filtered.map((comp) => {
            const flag = COUNTRY_FLAGS[comp.country_iso2] ?? ''
            const start = new Date(comp.start_date + 'T00:00:00')
            const dateStr = start.toLocaleDateString('en-US', {
              month: 'short', day: 'numeric', year: 'numeric',
            })
            return (
              <button
                key={comp.id}
                onClick={() => onSelect(comp)}
                style={{
                  textAlign: 'left',
                  padding: '12px 14px',
                  borderRadius: 8,
                  border: '1px solid var(--border)',
                  backgroundColor: 'var(--surface-1)',
                  cursor: 'pointer',
                  transition: 'border-color 150ms ease, background-color 150ms ease',
                  fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
                  width: '100%',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'var(--accent)'
                  e.currentTarget.style.backgroundColor = 'var(--accent-dim)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'var(--border)'
                  e.currentTarget.style.backgroundColor = 'var(--surface-1)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  {flag && <span style={{ fontSize: 16 }}>{flag}</span>}
                  <span
                    style={{
                      fontSize: 14,
                      fontWeight: 600,
                      color: 'var(--text-primary)',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {comp.name}
                  </span>
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', display: 'flex', gap: 8 }}>
                  <span>{dateStr}</span>
                  <span>·</span>
                  <span>{comp.city}</span>
                  {comp.event_ids.length > 0 && (
                    <>
                      <span>·</span>
                      <span>{comp.event_ids.length} event{comp.event_ids.length !== 1 ? 's' : ''}</span>
                    </>
                  )}
                </div>
              </button>
            )
          })}
          {filtered.length === 0 && (
            <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
              No competitions found.
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Main Page ───────────────────────────────────────────────────────────────

export function CompetitionPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const preselectedCompId = searchParams.get('compId')

  // Prevent spacebar from scrolling the page (but not when typing in inputs)
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const tag = (document.activeElement as HTMLElement)?.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return
      if (e.code === 'Space') e.preventDefault()
    }
    document.addEventListener('keydown', handler, { capture: true })
    return () => document.removeEventListener('keydown', handler, { capture: true })
  }, [])

  // ── Setup state ──
  const [compPhase, setCompPhase] = useState<CompPhase>('setup')
  const [isManualMode, setIsManualMode] = useState(false)
  const [showLeaderboard, setShowLeaderboard] = useState(true)

  // ── Real mode state ──
  const [realStep, setRealStep] = useState<RealModeStep>('pick_comp')
  const [selectedComp, setSelectedComp] = useState<WCACompetition | null>(null)
  const [selectedRealEvent, setSelectedRealEvent] = useState<string>('')
  const [realCompetitors, setRealCompetitors] = useState<CompetitorWithPB[]>([])
  const wcif = useCompetitionWCIF()

  // ── Competition state ──
  const [competitors, setCompetitors] = useState<Competitor[]>([])
  const [userSolves, setUserSolves] = useState<UserSolve[]>([])
  const [solveIndex, setSolveIndex] = useState(0)
  const [scrambles, setScrambles] = useState<string[]>([])
  const [advancePending, setAdvancePending] = useState(false)

  // Refs
  const userNameRef = useRef('You')
  const solveIndexRef = useRef(0)
  // Keep ref in sync so onSolveComplete closure always sees current index
  useEffect(() => { solveIndexRef.current = solveIndex }, [solveIndex])

  // ── Timer ──
  const {
    phase: timerPhase,
    displayTime,
    inspectionElapsed,
    pendingPenalty,
    confirmManualTime,
    reset: resetTimer,
  } = useTimer({
    mode: isManualMode ? 'manual' : 'live',
    onSolveComplete: useCallback(
      (result: import('@/hooks/useTimer').TimerResult) => {
        const effectiveTime =
          result.pendingPenalty === 'DNF'
            ? Infinity
            : result.pendingPenalty === '+2'
            ? result.time + 2000
            : result.time

        setUserSolves((prev) => [...prev, { time: effectiveTime }])

        // Reveal competitors' times for this solve slot
        const idx = solveIndexRef.current
        setCompetitors((prev) =>
          prev.map((c) => ({
            ...c,
            solves: c.solves.map((s, i) => (i === idx ? { ...s, resolved: true } : s)),
          }))
        )

        setAdvancePending(true)
      },
      [],
    ),
  })

  // Auto-advance to next solve
  useEffect(() => {
    if (!advancePending) return
    const tid = setTimeout(() => {
      setAdvancePending(false)
      setSolveIndex((prev) => {
        const next = prev + 1
        if (next >= NUM_SOLVES) setCompPhase('results')
        return next
      })
      resetTimer()
    }, 2000)
    return () => clearTimeout(tid)
  }, [advancePending, resetTimer])

  // ── Pre-generate competitor times when user starts solving ──
  useEffect(() => {
    if (compPhase !== 'competing') return
    // Trigger on both live and manual entry start
    if (timerPhase !== 'solving' && timerPhase !== 'manual_entry') return

    const currentSolveIdx = solveIndexRef.current

    // Pre-generate each competitor's time for this solve, hidden until user finishes
    setCompetitors((prev) =>
      prev.map((c) => {
        // Don't regenerate if already set
        if (c.solves[currentSolveIdx] !== undefined) return c
        const sampledTime = sampleGaussian(c.targetMean, c.sigma)
        const updatedSolves = [...c.solves]
        updatedSolves[currentSolveIdx] = { time: sampledTime, resolved: false }
        return { ...c, solves: updatedSolves }
      })
    )
  }, [timerPhase, compPhase])

  // ── Handlers ──
  function resetAll() {
    setCompPhase('setup')
    setUserSolves([])
    setCompetitors([])
    setSolveIndex(0)
    setScrambles([])
    resetTimer()
  }

  function startRound(comps: Competitor[]) {
    const newScrambles = Array.from({ length: NUM_SOLVES }, () =>
      generateScramble((selectedRealEvent as WCAEvent) || '333')
    )
    setScrambles(newScrambles)
    setCompetitors(comps)
    setUserSolves([])
    setSolveIndex(0)
    solveIndexRef.current = 0
    setAdvancePending(false)
    resetTimer()
    setCompPhase('competing')
  }

  async function handleCompSelected(comp: WCACompetition) {
    setSelectedComp(comp)
    setRealStep('pick_event')
    await wcif.fetchWCIF(comp.id)
  }

  async function handleEventSelectedForReal(eventId: string) {
    if (!wcif.wcifState || wcif.wcifState.status !== 'success') return
    setSelectedRealEvent(eventId)
    setRealStep('loading_competitors')

    const persons = wcif.getCompetitorsForEvent(wcif.wcifState.wcif, eventId)
    await wcif.fetchCompetitorPBs(persons, eventId)
  }

  useEffect(() => {
    if (wcif.pbState.status === 'success' && realStep === 'loading_competitors') {
      setRealCompetitors(wcif.pbState.competitors)
      setRealStep('ready')
    }
  }, [wcif.pbState, realStep])

  // ── Leaderboard ──
  const leaderboardEntries = buildLeaderboard(competitors, userSolves, userNameRef.current)
  const userEntry = leaderboardEntries.find((e) => e.isUser)
  const userRank = userEntry?.rank ?? 0
  const userAo5 = userEntry?.ao5 ?? null

  const currentScramble = scrambles[solveIndex] ?? ''

  let timerHint = ''
  if (timerPhase === 'idle') timerHint = isManualMode ? 'Press Space to enter time' : 'Hold Space to start inspection'
  else if (timerPhase === 'inspection') timerHint = 'Hold Space to start solving'
  else if (timerPhase === 'armed') timerHint = 'Release to start'
  else if (timerPhase === 'solving') timerHint = 'Press Space to stop'
  else if (timerPhase === 'stopped') timerHint = 'Revealing times...'
  else if (timerPhase === 'manual_entry') timerHint = ''

  // ─── Render: Setup ─────────────────────────────────────────────────────────

  if (compPhase === 'setup') {
    return (
      <div
        style={{
          minHeight: '100dvh',
          backgroundColor: 'var(--bg)',
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'center',
          padding: 24,
          overflowY: 'auto',
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
            maxWidth: 540,
            marginTop: 40,
          }}
        >
          {/* Title */}
          <div style={{ marginBottom: 28 }}>
            <h1
              style={{
                fontSize: 24,
                fontWeight: 700,
                color: 'var(--text-primary)',
                marginBottom: 4,
                letterSpacing: '-0.02em',
              }}
            >
              Competition Simulator
            </h1>
            <p style={{ fontSize: 14, color: 'var(--text-muted)' }}>
              Compete against real registered competitors from upcoming WCA competitions.
            </p>
          </div>

          {/* Step: pick_comp */}
          {realStep === 'pick_comp' && (
            <div>
              <div
                style={{
                  fontSize: 12,
                  fontWeight: 500,
                  color: 'var(--text-muted)',
                  marginBottom: 12,
                }}
              >
                Step 1 — Select a competition
              </div>
              <PickCompetition
                onSelect={handleCompSelected}
                preselectedId={preselectedCompId}
              />
            </div>
          )}

          {/* Step: pick_event */}
          {realStep === 'pick_event' && selectedComp && (
            <div>
              <button
                onClick={() => { setRealStep('pick_comp'); setSelectedComp(null); wcif.reset() }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  fontSize: 13,
                  color: 'var(--accent)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: 0,
                  fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
                  marginBottom: 16,
                }}
              >
                ← Back
              </button>
              <div
                style={{
                  fontSize: 12,
                  fontWeight: 500,
                  color: 'var(--text-muted)',
                  marginBottom: 6,
                }}
              >
                Step 2 — Pick an event
              </div>
              <div
                style={{
                  fontSize: 15,
                  fontWeight: 700,
                  color: 'var(--text-primary)',
                  marginBottom: 16,
                }}
              >
                {selectedComp.name}
              </div>

              {wcif.wcifState.status === 'loading' && (
                <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
                  <div
                    style={{
                      width: 18,
                      height: 18,
                      border: '2px solid var(--border)',
                      borderTopColor: 'var(--accent)',
                      borderRadius: '50%',
                      animation: 'spin 0.8s linear infinite',
                      margin: '0 auto 10px',
                    }}
                  />
                  Loading competition data...
                </div>
              )}

              {wcif.wcifState.status === 'error' && (
                <div style={{ color: 'var(--penalty)', fontSize: 13 }}>{wcif.wcifState.message}</div>
              )}

              {wcif.wcifState.status === 'success' && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {selectedComp.event_ids.map((evId) => (
                    <button
                      key={evId}
                      onClick={() => handleEventSelectedForReal(evId)}
                      style={{
                        padding: '9px 16px',
                        borderRadius: 8,
                        border: '1px solid var(--border)',
                        backgroundColor: 'var(--surface-1)',
                        color: 'var(--text-primary)',
                        fontSize: 13,
                        fontWeight: 600,
                        cursor: 'pointer',
                        transition: 'all 150ms ease',
                        fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = 'var(--accent)'
                        e.currentTarget.style.color = 'var(--accent)'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = 'var(--border)'
                        e.currentTarget.style.color = 'var(--text-primary)'
                      }}
                    >
                      {EVENT_LABELS[evId] ?? evId}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Step: loading_competitors */}
          {realStep === 'loading_competitors' && (
            <div style={{ padding: 32, textAlign: 'center' }}>
              <div
                style={{
                  width: 28,
                  height: 28,
                  border: '2px solid var(--border)',
                  borderTopColor: 'var(--accent)',
                  borderRadius: '50%',
                  animation: 'spin 0.8s linear infinite',
                  margin: '0 auto 16px',
                }}
              />
              <div style={{ fontSize: 15, color: 'var(--text-primary)', fontWeight: 600, marginBottom: 6 }}>
                Fetching competitor data
              </div>
              {wcif.pbState.status === 'loading' && (
                <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                  {wcif.pbState.fetched} / {wcif.pbState.total} competitors loaded...
                </div>
              )}
            </div>
          )}

          {/* Step: ready */}
          {realStep === 'ready' && (
            <div>
              <button
                onClick={() => {
                  setRealStep('pick_event')
                  setRealCompetitors([])
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  fontSize: 13,
                  color: 'var(--accent)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: 0,
                  fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
                  marginBottom: 16,
                }}
              >
                ← Back
              </button>
              <div
                style={{
                  fontSize: 12,
                  fontWeight: 500,
                  color: 'var(--text-muted)',
                  marginBottom: 6,
                }}
              >
                Step 3 — Ready to compete
              </div>
              <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 2 }}>
                {selectedComp?.name}
              </div>
              <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 16 }}>
                {EVENT_LABELS[selectedRealEvent] ?? selectedRealEvent} · {realCompetitors.length} competitors
              </div>

              {/* Competitor preview */}
              <div
                style={{
                  marginBottom: 20,
                  maxHeight: 220,
                  overflowY: 'auto',
                  border: '1px solid var(--border)',
                  borderRadius: 8,
                  backgroundColor: 'var(--surface-1)',
                }}
              >
                {realCompetitors.map((c) => {
                  const flag = c.countryIso2 ? (COUNTRY_FLAGS[c.countryIso2] ?? '') : ''
                  return (
                    <div
                      key={c.wcaId}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '8px 12px',
                        borderBottom: '1px solid var(--border)',
                        fontSize: 13,
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        {flag && <span>{flag}</span>}
                        <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{c.name}</span>
                        <a
                          href={`https://www.worldcubeassociation.org/persons/${c.wcaId}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-mono"
                          style={{ fontSize: 10, color: 'var(--accent)', textDecoration: 'none', opacity: 0.7 }}
                          onClick={(e) => e.stopPropagation()}
                        >
                          {c.wcaId}
                        </a>
                      </div>
                      {c.pb !== null && (
                        <span
                          className="font-mono"
                          style={{
                            fontSize: 12,
                            fontWeight: 600,
                            color: 'var(--positive)',
                            backgroundColor: 'rgba(34,197,94,0.08)',
                            padding: '2px 6px',
                            borderRadius: 4,
                          }}
                        >
                          {formatTime(c.pb)}
                        </span>
                      )}
                    </div>
                  )
                })}
              </div>

              <button
                onClick={() => startRound(competitorsFromReal(realCompetitors, selectedRealEvent))}
                style={{
                  width: '100%',
                  padding: '14px 0',
                  borderRadius: 10,
                  border: 'none',
                  backgroundColor: 'var(--accent)',
                  color: '#020617',
                  fontSize: 15,
                  fontWeight: 700,
                  cursor: 'pointer',
                  fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
                  letterSpacing: '-0.01em',
                  transition: 'opacity 150ms ease',
                }}
                onMouseOver={(e) => { (e.currentTarget as HTMLButtonElement).style.opacity = '0.85' }}
                onMouseOut={(e) => { (e.currentTarget as HTMLButtonElement).style.opacity = '1' }}
              >
                Start Round →
              </button>
            </div>
          )}
        </motion.div>

        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    )
  }

  // ─── Render: Results ───────────────────────────────────────────────────────

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
          style={{ maxWidth: 820, margin: '0 auto' }}
        >
          <div style={{ marginBottom: 32 }}>
            {selectedComp && (
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 6, fontWeight: 500 }}>
                {selectedComp.name} · {EVENT_LABELS[selectedRealEvent] ?? selectedRealEvent}
              </div>
            )}
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
                #{userRank} of {competitors.length + 1}
              </span>
              {userAo5 !== null && (
                <>
                  {' '}with an Ao5 of{' '}
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

          <div style={{ marginBottom: 32 }}>
            <LeaderboardPanel entries={leaderboardEntries} solveIndex={NUM_SOLVES} />
          </div>

          <div style={{ display: 'flex', gap: 12 }}>
            <button
              onClick={() => {
                resetAll()
                setRealStep('ready')
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
                fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
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
                fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
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

  // ─── Render: Competing ─────────────────────────────────────────────────────

  const displayEvent = EVENT_LABELS[selectedRealEvent] ?? selectedRealEvent

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
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {/* Solve progress dots */}
          <div style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
            {Array.from({ length: NUM_SOLVES }).map((_, i) => (
              <div
                key={i}
                style={{
                  width: i === solveIndex ? 16 : 8,
                  height: 8,
                  borderRadius: 4,
                  backgroundColor:
                    i < solveIndex ? 'var(--accent)' : i === solveIndex ? 'var(--accent)' : 'var(--surface-1)',
                  border: i === solveIndex ? '1px solid var(--accent)' : '1px solid var(--border)',
                  opacity: i === solveIndex ? 1 : i < solveIndex ? 0.6 : 0.3,
                  transition: 'width 200ms ease, background-color 200ms ease',
                }}
              />
            ))}
          </div>
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)' }}>
            Solve {Math.min(solveIndex + 1, NUM_SOLVES)} of {NUM_SOLVES}
          </span>
          <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 500 }}>
            {displayEvent}
            {selectedComp && ` · ${selectedComp.name}`}
          </span>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button
            onClick={() => setShowLeaderboard((p) => !p)}
            style={{
              padding: '6px 14px',
              borderRadius: 6,
              border: `1px solid ${showLeaderboard ? 'var(--accent)' : 'var(--border)'}`,
              backgroundColor: showLeaderboard ? 'var(--accent-dim)' : 'transparent',
              color: showLeaderboard ? 'var(--accent)' : 'var(--text-muted)',
              fontSize: 13,
              cursor: 'pointer',
              fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
              transition: 'all 150ms ease',
            }}
          >
            Leaderboard
          </button>
          <button
            onClick={resetAll}
            style={{
              padding: '6px 14px',
              borderRadius: 6,
              border: '1px solid var(--border)',
              backgroundColor: 'transparent',
              color: 'var(--text-muted)',
              fontSize: 13,
              cursor: 'pointer',
              fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
            }}
          >
            Quit
          </button>
        </div>
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
        <div style={{ flex: '1 1 320px', display: 'flex', flexDirection: 'column', gap: 24 }}>
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
                fontSize: 12,
                fontWeight: 500,
                color: 'var(--text-muted)',
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
              position: 'relative',
            }}
          >
            <AnimatePresence mode="wait">
              {timerPhase === 'manual_entry' ? (
                <ManualTimeInput
                  key="manual-input"
                  onConfirm={(ms) => confirmManualTime(ms)}
                  onCancel={() => { resetTimer(); setIsManualMode(false) }}
                />
              ) : (
                <motion.div
                  key="live-timer"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}
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
                  <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0, textAlign: 'center' }}>
                    {timerHint}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            {timerPhase === 'idle' && (
              <button
                onClick={() => setIsManualMode((p) => !p)}
                style={{
                  position: 'absolute',
                  bottom: 14,
                  left: 16,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 5,
                  background: isManualMode ? 'var(--accent-dim)' : 'none',
                  border: `1px solid ${isManualMode ? 'var(--accent)' : 'var(--border)'}`,
                  borderRadius: 8,
                  padding: '5px 10px',
                  color: isManualMode ? 'var(--accent)' : 'var(--text-muted)',
                  fontSize: 11,
                  fontWeight: 500,
                  cursor: 'pointer',
                  fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
                  transition: 'all 150ms ease',
                }}
              >
                <svg width="10" height="10" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                  <path d="M2 6h8M6 2v8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
                {isManualMode ? 'Manual ON' : 'Manual entry'}
              </button>
            )}
          </div>

          {/* User's solves */}
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
                  fontSize: 12,
                  fontWeight: 500,
                  color: 'var(--text-muted)',
                  marginBottom: 10,
                }}
              >
                Your solves
              </div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {userSolves.map((s, i) => (
                  <SolveChip key={i} time={s.time} resolved={true} />
                ))}
              </div>
              {userSolves.length === NUM_SOLVES && userEntry?.ao5 !== null && (
                <div
                  className="font-mono"
                  style={{ marginTop: 10, fontSize: 13, fontWeight: 700, color: 'var(--accent)' }}
                >
                  Ao5: {userEntry && isFinite(userEntry.ao5!) ? formatTime(userEntry.ao5!) : 'DNF'}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right: Leaderboard */}
        <AnimatePresence>
          {showLeaderboard && (
            <motion.div
              key="leaderboard"
              initial={{ opacity: 0, x: 24, width: 0 }}
              animate={{ opacity: 1, x: 0, width: 'auto' }}
              exit={{ opacity: 0, x: 24, width: 0 }}
              transition={{ duration: 0.25, ease: 'easeInOut' }}
              style={{ flex: '1 1 320px', minWidth: 0, overflow: 'hidden' }}
            >
              <div
                style={{
                  fontSize: 12,
                  fontWeight: 500,
                  color: 'var(--text-muted)',
                  marginBottom: 10,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                <span>Live standings</span>
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 600,
                    color: 'var(--accent)',
                    backgroundColor: 'rgba(34,211,238,0.12)',
                    padding: '1px 6px',
                    borderRadius: 3,
                  }}
                >
                  REAL WCA DATA
                </span>
              </div>
              <LeaderboardPanel
                entries={leaderboardEntries}
                solveIndex={solveIndex}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
