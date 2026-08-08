import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { formatTime } from '@/lib/utils'
import type { WCAEvent } from '@/types'

// ── Types ─────────────────────────────────────────────────────────────────────

interface LBEntry {
  rank: number
  name: string
  wcaId: string
  flag: string
  solves: number[]
  ao5: number
}

// ── Constants ─────────────────────────────────────────────────────────────────

const SHOWN_EVENTS: { value: WCAEvent; short: string; long: string }[] = [
  { value: '333',   short: '3x3',   long: '3x3x3' },
  { value: '222',   short: '2x2',   long: '2x2x2' },
  { value: '444',   short: '4x4',   long: '4x4x4' },
  { value: '333oh', short: '3OH',   long: 'One-Handed' },
  { value: 'pyram', short: 'Pyram', long: 'Pyraminx' },
  { value: 'skewb', short: 'Skewb', long: 'Skewb' },
  { value: 'minx',  short: 'Minx',  long: 'Megaminx' },
  { value: 'sq1',   short: 'SQ-1',  long: 'Square-1' },
]

type Period = 'all' | 'month' | 'week' | 'today'

const PERIODS: { value: Period; label: string }[] = [
  { value: 'all',   label: 'All Time' },
  { value: 'month', label: 'Month' },
  { value: 'week',  label: 'Week' },
  { value: 'today', label: 'Today' },
]

// [min, max] ao5 in ms for global ranks 1–20
const EVENT_RANGES: Record<string, [number, number]> = {
  '333':   [5480,  8150],
  '222':   [1020,  1850],
  '444':   [22500, 34800],
  '333oh': [8360,  12800],
  'pyram': [1730,  3150],
  'skewb': [2040,  3780],
  'minx':  [39200, 57000],
  'sq1':   [8200,  13500],
}

// Simulated user position per event
const USER_RANK: Record<string, number> = {
  '333': 47, '222': 89, '444': 34, '333oh': 112,
  'pyram': 23, 'skewb': 67, 'minx': 15, 'sq1': 203,
}
const USER_AO5: Record<string, number> = {
  '333': 9200, '222': 2400, '444': 45000, '333oh': 17000,
  'pyram': 4100, 'skewb': 5200, 'minx': 72000, 'sq1': 19000,
}

const COMPETITORS: [string, string, string][] = [
  ['Max Park',        '2022PARK01', '🇺🇸'],
  ['Felix Zemdegs',   '2017ZEMD01', '🇦🇺'],
  ['Tymon Kowalczyk', '2019KOWA01', '🇵🇱'],
  ['Patrick Ponce',   '2016PONC02', '🇺🇸'],
  ['Sebastian Weyer', '2015WEYE01', '🇩🇪'],
  ['Lucas Etter',     '2015ETTE01', '🇺🇸'],
  ['Mateus Costa',    '2016COST03', '🇧🇷'],
  ['Mats Valk',       '2015VALK01', '🇳🇱'],
  ['Nathan Bahrani',  '2018BAHR01', '🇺🇸'],
  ['Drew Brads',      '2019BRAD02', '🇺🇸'],
  ['Kyle Choo',       '2020CHOO01', '🇸🇬'],
  ['Antoine Cantin',  '2016CANT01', '🇨🇦'],
  ['Juliette Sébélo', '2021SEBE01', '🇫🇷'],
  ['Hannah Rawlings', '2018RAWL01', '🇬🇧'],
  ['Keanu Santos',    '2019SANT02', '🇧🇷'],
  ['Viktor Larsson',  '2017LARS01', '🇸🇪'],
  ['Brest Sung',      '2018SUNG01', '🇰🇷'],
  ['Jayden Lim',      '2020LIMJ01', '🇸🇬'],
  ['Kai Martin',      '2019MART03', '🇺🇸'],
  ['Philipp Weixler', '2015WEIX01', '🇩🇪'],
]

const MEDAL = {
  1: {
    text: '#F59E0B',
    bg: 'rgba(245,158,11,0.1)',
    border: 'rgba(245,158,11,0.28)',
    glow: 'rgba(245,158,11,0.12)',
    emoji: '🥇',
  },
  2: {
    text: '#94A3B8',
    bg: 'rgba(148,163,184,0.08)',
    border: 'rgba(148,163,184,0.22)',
    glow: 'rgba(148,163,184,0.06)',
    emoji: '🥈',
  },
  3: {
    text: '#CD7F32',
    bg: 'rgba(205,127,50,0.08)',
    border: 'rgba(205,127,50,0.22)',
    glow: 'rgba(205,127,50,0.06)',
    emoji: '🥉',
  },
} as const

// ── Deterministic RNG ─────────────────────────────────────────────────────────

function lcg(seed: number, count: number): number[] {
  const out: number[] = []
  let s = seed | 0
  for (let i = 0; i < count; i++) {
    s = (Math.imul(s, 1664525) + 1013904223) | 0
    out.push((s >>> 0) / 4294967295)
  }
  return out
}

function getDroppedIndices(solves: number[]): Set<number> {
  let bestIdx = 0
  let worstIdx = 0
  for (let i = 1; i < solves.length; i++) {
    if (solves[i] < solves[bestIdx]) bestIdx = i
    if (solves[i] > solves[worstIdx]) worstIdx = i
  }
  return new Set([bestIdx, worstIdx])
}

function generateEntries(event: WCAEvent, period: Period): LBEntry[] {
  const [minMs, maxMs] = EVENT_RANGES[event] ?? [10000, 20000]
  const seed =
    event.split('').reduce((a, c) => a + c.charCodeAt(0), 0) + period.length * 31
  const rng = lcg(seed, 200)
  let ri = 0
  const r = () => rng[ri++ % rng.length]

  // Recent periods = fewer submissions, slightly slower times
  const periodMult =
    period === 'today' ? 1.1 : period === 'week' ? 1.06 : period === 'month' ? 1.025 : 1

  return COMPETITORS.map(([name, wcaId, flag], i) => {
    const t = (i + 1) / 20
    const baseAo5 = (minMs + t * (maxMs - minMs)) * periodMult
    const sigma = baseAo5 * 0.055
    const rawSolves = Array.from({ length: 5 }, () =>
      Math.max(minMs * 0.82, baseAo5 + (r() - 0.5) * 2 * sigma),
    )
    const sorted = [...rawSolves].sort((a, b) => a - b)
    const ao5 = (sorted[1] + sorted[2] + sorted[3]) / 3
    return { rank: i + 1, name, wcaId, flag, solves: rawSolves, ao5 }
  })
}

// ── SolveChips ────────────────────────────────────────────────────────────────

function SolveChips({ solves, size = 'md' }: { solves: number[]; size?: 'sm' | 'md' }) {
  const dropped = getDroppedIndices(solves)
  const isSmall = size === 'sm'

  return (
    <div style={{ display: 'flex', gap: isSmall ? 2 : 3, flexWrap: 'nowrap' }}>
      {solves.map((t, i) => {
        const isDrop = dropped.has(i)
        return (
          <span
            key={i}
            className="font-mono"
            style={{
              fontSize: isSmall ? 9 : 10,
              fontWeight: 500,
              color: isDrop ? 'var(--text-muted)' : 'var(--accent)',
              backgroundColor: isDrop ? 'transparent' : 'rgba(34,211,238,0.08)',
              padding: isSmall ? '1px 3px' : '1px 5px',
              borderRadius: 3,
              border: `1px solid ${isDrop ? 'rgba(255,255,255,0.05)' : 'rgba(34,211,238,0.18)'}`,
              whiteSpace: 'nowrap',
              opacity: isDrop ? 0.45 : 1,
            }}
          >
            {formatTime(t)}
          </span>
        )
      })}
    </div>
  )
}

// ── PodiumCard ────────────────────────────────────────────────────────────────

function PodiumCard({
  entry,
  position,
  delay,
}: {
  entry: LBEntry
  position: 1 | 2 | 3
  delay: number
}) {
  const m = MEDAL[position]
  const isFirst = position === 1

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.3, ease: 'easeOut' }}
      style={{
        flex: 1,
        background: `linear-gradient(150deg, ${m.bg} 0%, var(--surface-0) 55%)`,
        border: `1px solid ${m.border}`,
        borderRadius: 12,
        padding: isFirst ? '22px 18px 18px' : '16px 14px 14px',
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        alignSelf: 'flex-start',
        marginTop: isFirst ? 0 : position === 2 ? 18 : 30,
        boxShadow: isFirst ? `0 0 32px ${m.glow}` : 'none',
      }}
    >
      {/* Medal + rank */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
        <span style={{ fontSize: isFirst ? 20 : 16, lineHeight: 1 }}>{m.emoji}</span>
        <span
          className="font-mono"
          style={{
            fontSize: 10,
            fontWeight: 700,
            color: m.text,
            backgroundColor: m.bg,
            border: `1px solid ${m.border}`,
            padding: '2px 7px',
            borderRadius: 4,
            letterSpacing: '0.05em',
          }}
        >
          #{position}
        </span>
      </div>

      {/* Name */}
      <div>
        <div
          style={{
            fontSize: isFirst ? 15 : 13,
            fontWeight: 700,
            color: 'var(--text-primary)',
            lineHeight: 1.3,
            marginBottom: 3,
          }}
        >
          {entry.flag} {entry.name}
        </div>
        <div className="font-mono" style={{ fontSize: 10, color: 'var(--text-muted)' }}>
          {entry.wcaId}
        </div>
      </div>

      {/* Ao5 */}
      <div
        className="font-mono"
        style={{
          fontSize: isFirst ? 30 : 22,
          fontWeight: 800,
          color: m.text,
          letterSpacing: '-0.03em',
          lineHeight: 1,
        }}
      >
        {formatTime(entry.ao5)}
      </div>

      {/* Solves */}
      <SolveChips solves={entry.solves} size="sm" />
    </motion.div>
  )
}

// ── TableRow ──────────────────────────────────────────────────────────────────

function TableRow({ entry, idx }: { entry: LBEntry; idx: number }) {
  return (
    <motion.div
      key={entry.name}
      initial={{ opacity: 0, x: -6 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: idx * 0.022, duration: 0.2, ease: 'easeOut' }}
      style={{
        display: 'grid',
        gridTemplateColumns: '44px 1fr 110px auto 88px',
        gap: 12,
        padding: '9px 16px',
        borderBottom: '1px solid var(--border)',
        alignItems: 'center',
        transition: 'background-color 120ms ease',
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.backgroundColor = 'rgba(255,255,255,0.025)'
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent'
      }}
    >
      {/* Rank */}
      <span
        className="font-mono"
        style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)' }}
      >
        {entry.rank}
      </span>

      {/* Flag + name */}
      <div style={{ minWidth: 0 }}>
        <span
          style={{
            fontSize: 13,
            fontWeight: 500,
            color: 'var(--text-primary)',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            display: 'block',
          }}
        >
          {entry.flag} {entry.name}
        </span>
      </div>

      {/* WCA ID */}
      <span className="font-mono" style={{ fontSize: 10, color: 'var(--text-muted)' }}>
        {entry.wcaId}
      </span>

      {/* Solve chips */}
      <SolveChips solves={entry.solves} />

      {/* Ao5 */}
      <span
        className="font-mono"
        style={{ fontSize: 13, fontWeight: 700, color: 'var(--accent)', textAlign: 'right' }}
      >
        {formatTime(entry.ao5)}
      </span>
    </motion.div>
  )
}

// ── LeaderboardPage ───────────────────────────────────────────────────────────

export function LeaderboardPage() {
  const [selectedEvent, setSelectedEvent] = useState<WCAEvent>('333')
  const [period, setPeriod] = useState<Period>('all')
  const [showCount, setShowCount] = useState(10)

  const entries = useMemo(
    () => generateEntries(selectedEvent, period),
    [selectedEvent, period],
  )

  const podium = entries.slice(0, 3) as [LBEntry, LBEntry, LBEntry]
  const tableRows = entries.slice(3, 3 + showCount)
  const hasMore = 3 + showCount < entries.length

  const userRank = USER_RANK[selectedEvent] ?? 0
  const userAo5 = USER_AO5[selectedEvent] ?? 0

  const eventLabel =
    SHOWN_EVENTS.find((e) => e.value === selectedEvent)?.long ?? selectedEvent

  function handleEventChange(ev: WCAEvent) {
    setSelectedEvent(ev)
    setShowCount(10)
  }

  return (
    <div
      style={{
        padding: '32px 28px 100px',
        maxWidth: 960,
        margin: '0 auto',
      }}
    >
      {/* ── Header ── */}
      <div style={{ marginBottom: 28 }}>
        <h1
          style={{
            fontSize: 26,
            fontWeight: 700,
            color: 'var(--text-primary)',
            letterSpacing: '-0.022em',
            marginBottom: 5,
          }}
        >
          Global Leaderboard
        </h1>
        <p style={{ fontSize: 14, color: 'var(--text-muted)' }}>
          Top CubeArena solvers ranked by best Ao5 —{' '}
          <span style={{ color: 'var(--text-primary)' }}>{eventLabel}</span>
        </p>
      </div>

      {/* ── Event tabs ── */}
      <div
        style={{
          display: 'flex',
          gap: 4,
          marginBottom: 14,
          overflowX: 'auto',
          paddingBottom: 2,
        }}
      >
        {SHOWN_EVENTS.map((ev) => {
          const active = ev.value === selectedEvent
          return (
            <button
              key={ev.value}
              onClick={() => handleEventChange(ev.value)}
              style={{
                position: 'relative',
                padding: '6px 14px',
                borderRadius: 7,
                border: active
                  ? '1px solid rgba(34,211,238,0.32)'
                  : '1px solid var(--border)',
                backgroundColor: active ? 'var(--accent-dim)' : 'var(--surface-0)',
                color: active ? 'var(--accent)' : 'var(--text-muted)',
                fontSize: 13,
                fontWeight: active ? 600 : 500,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 140ms ease',
                fontFamily: 'Inter, sans-serif',
              }}
              onMouseEnter={(e) => {
                if (!active)
                  (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-primary)'
              }}
              onMouseLeave={(e) => {
                if (!active)
                  (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-muted)'
              }}
            >
              {ev.short}
            </button>
          )
        })}
      </div>

      {/* ── Period pills ── */}
      <div style={{ display: 'flex', gap: 5, marginBottom: 28 }}>
        {PERIODS.map((p) => {
          const active = p.value === period
          return (
            <button
              key={p.value}
              onClick={() => setPeriod(p.value)}
              style={{
                padding: '4px 13px',
                borderRadius: 20,
                border: active
                  ? '1px solid rgba(34,211,238,0.3)'
                  : '1px solid var(--border)',
                backgroundColor: active ? 'var(--accent-dim)' : 'transparent',
                color: active ? 'var(--accent)' : 'var(--text-muted)',
                fontSize: 12,
                fontWeight: active ? 600 : 400,
                cursor: 'pointer',
                transition: 'all 140ms ease',
                fontFamily: 'Inter, sans-serif',
              }}
            >
              {p.label}
            </button>
          )
        })}
      </div>

      {/* ── Content (key-switch to re-animate on event/period change) ── */}
      <AnimatePresence mode="wait">
        <motion.div
          key={`${selectedEvent}-${period}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
        >
          {/* ── Podium: order 2–1–3 visually ── */}
          <div
            style={{
              display: 'flex',
              gap: 10,
              marginBottom: 16,
              alignItems: 'flex-start',
            }}
          >
            <PodiumCard entry={podium[1]} position={2} delay={0.05} />
            <PodiumCard entry={podium[0]} position={1} delay={0} />
            <PodiumCard entry={podium[2]} position={3} delay={0.1} />
          </div>

          {/* ── Table (ranks 4+) ── */}
          <div
            style={{
              backgroundColor: 'var(--surface-0)',
              border: '1px solid var(--border)',
              borderRadius: 12,
              overflow: 'hidden',
              marginBottom: 14,
            }}
          >
            {/* Header */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '44px 1fr 110px auto 88px',
                gap: 12,
                padding: '9px 16px',
                borderBottom: '1px solid var(--border)',
                fontSize: 10,
                fontWeight: 600,
                color: 'var(--text-muted)',
                textTransform: 'uppercase',
                letterSpacing: '0.07em',
              }}
            >
              <span>#</span>
              <span>Competitor</span>
              <span>WCA ID</span>
              <span>Solves</span>
              <span style={{ textAlign: 'right' }}>Ao5</span>
            </div>

            {tableRows.map((entry, idx) => (
              <TableRow key={entry.name} entry={entry} idx={idx} />
            ))}

            {/* Last row has no bottom border — clean it up */}
            {tableRows.length === 0 && (
              <div
                style={{
                  padding: 28,
                  textAlign: 'center',
                  color: 'var(--text-muted)',
                  fontSize: 13,
                }}
              >
                No entries yet.
              </div>
            )}
          </div>

          {/* ── Load more ── */}
          {hasMore && (
            <div style={{ textAlign: 'center', marginBottom: 16 }}>
              <button
                onClick={() => setShowCount((n) => n + 10)}
                style={{
                  padding: '8px 24px',
                  borderRadius: 8,
                  border: '1px solid var(--border)',
                  backgroundColor: 'var(--surface-0)',
                  color: 'var(--text-muted)',
                  fontSize: 13,
                  fontWeight: 500,
                  cursor: 'pointer',
                  transition: 'color 140ms ease, border-color 140ms ease',
                  fontFamily: 'Inter, sans-serif',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = 'var(--text-primary)'
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = 'var(--text-muted)'
                  e.currentTarget.style.borderColor = 'var(--border)'
                }}
              >
                Show more
              </button>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* ── Sticky user position ── */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35, duration: 0.28 }}
        style={{
          position: 'sticky',
          bottom: 16,
          background:
            'linear-gradient(90deg, rgba(34,211,238,0.12) 0%, var(--surface-0) 60%)',
          border: '1px solid rgba(34,211,238,0.28)',
          borderRadius: 10,
          padding: '12px 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 16,
          backdropFilter: 'blur(8px)',
          marginTop: 16,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span
            style={{
              fontSize: 10,
              fontWeight: 700,
              color: 'var(--accent)',
              backgroundColor: 'rgba(34,211,238,0.12)',
              border: '1px solid rgba(34,211,238,0.3)',
              padding: '2px 8px',
              borderRadius: 4,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
            }}
          >
            Your Rank
          </span>
          <span
            className="font-mono"
            style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}
          >
            #{userRank}
          </span>
          <span style={{ color: 'var(--border)', fontSize: 16 }}>·</span>
          <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>
            {eventLabel}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Ao5</span>
          <span
            className="font-mono"
            style={{
              fontSize: 20,
              fontWeight: 800,
              color: 'var(--accent)',
              letterSpacing: '-0.02em',
            }}
          >
            {formatTime(userAo5)}
          </span>
        </div>
      </motion.div>
    </div>
  )
}
