import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { useAuth } from '@/providers/AuthProvider'
import { useSolveHistory } from '@/hooks/useSolveHistory'
import { computeAo, formatTime } from '@/lib/utils'
import type { WCAEvent, Solve } from '@/types'

// ── Event registry ────────────────────────────────────────────────────────────

const EVENTS: { event: WCAEvent; label: string }[] = [
  { event: '333',   label: '3×3' },
  { event: '222',   label: '2×2' },
  { event: '444',   label: '4×4' },
  { event: '333oh', label: 'OH' },
  { event: 'pyram', label: 'Pyraminx' },
  { event: 'skewb', label: 'Skewb' },
  { event: 'minx',  label: 'Megaminx' },
  { event: 'sq1',   label: 'Square-1' },
  { event: '555',   label: '5×5' },
  { event: '666',   label: '6×6' },
  { event: '777',   label: '7×7' },
  { event: 'clock', label: 'Clock' },
  { event: '333bf', label: '3BLD' },
  { event: '333fm', label: 'FMC' },
]

// ── Per-event stats ───────────────────────────────────────────────────────────

interface EventStats {
  event: WCAEvent
  label: string
  single: number | null
  ao5: number | null
  ao12: number | null
  count: number
}

function computeStats(solves: Solve[]): EventStats[] {
  return EVENTS.flatMap(({ event, label }) => {
    const eventSolves = solves.filter((s) => s.event === event)
    if (eventSolves.length === 0) return []

    const validTimes = eventSolves
      .filter((s) => s.penalty !== 'DNF' && isFinite(s.effectiveTime))
      .map((s) => s.effectiveTime)

    const single = validTimes.length > 0 ? Math.min(...validTimes) : null
    const ao5 = computeAo(eventSolves, 5)
    const ao12 = computeAo(eventSolves, 12)

    return [{ event, label, single, ao5, ao12, count: eventSolves.length }]
  })
}

// ── InfoIcon SVG ──────────────────────────────────────────────────────────────

function InfoIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      style={{ flexShrink: 0, marginTop: 1 }}
    >
      <circle cx="8" cy="8" r="7" stroke="var(--text-muted)" strokeWidth="1.4" />
      <rect x="7.25" y="7" width="1.5" height="4.5" rx="0.75" fill="var(--text-muted)" />
      <circle cx="8" cy="5" r="0.85" fill="var(--text-muted)" />
    </svg>
  )
}

// ── TrophyIcon SVG ────────────────────────────────────────────────────────────

function TrophyIcon() {
  return (
    <svg
      width="40"
      height="40"
      viewBox="0 0 40 40"
      fill="none"
      style={{ opacity: 0.35 }}
    >
      <path
        d="M12 6h16v14a8 8 0 01-16 0V6z"
        stroke="var(--text-muted)"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path
        d="M12 10H7a3 3 0 003 3M28 10h5a3 3 0 01-3 3"
        stroke="var(--text-muted)"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        d="M20 26v5M14 34h12"
        stroke="var(--text-muted)"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  )
}

// ── Skeleton ──────────────────────────────────────────────────────────────────

function LoadingSkeleton() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={i}
          style={{
            height: 52,
            backgroundColor: 'var(--surface-0)',
            borderRadius: 8,
            border: '1px solid var(--border)',
            opacity: 1 - i * 0.18,
          }}
        />
      ))}
    </div>
  )
}

// ── StatCell ──────────────────────────────────────────────────────────────────

function StatCell({
  value,
  highlight = false,
  size = 14,
}: {
  value: number | null
  highlight?: boolean
  size?: number
}) {
  if (value === null) {
    return (
      <span style={{ fontSize: 13, color: 'var(--text-muted)', fontFamily: 'JetBrains Mono, monospace' }}>
        —
      </span>
    )
  }

  const text = formatTime(value)
  const isDnf = !isFinite(value)

  return (
    <span
      style={{
        fontFamily: 'JetBrains Mono, monospace',
        fontSize: size,
        fontWeight: highlight ? 700 : 500,
        color: highlight && !isDnf ? 'var(--positive)' : isDnf ? 'var(--text-muted)' : 'var(--text-primary)',
      }}
    >
      {text}
    </span>
  )
}

// ── LeaderboardPage ───────────────────────────────────────────────────────────

export function LeaderboardPage() {
  const { user } = useAuth()
  const { solves, loading } = useSolveHistory(user?.uid)

  const stats = useMemo(() => computeStats(solves), [solves])

  const isEmpty = !loading && stats.length === 0

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      style={{
        padding: '32px',
        maxWidth: 880,
        margin: '0 auto',
        width: '100%',
      }}
    >
      {/* ── Page header ── */}
      <div style={{ marginBottom: 24 }}>
        <h1
          style={{
            fontSize: 30,
            fontWeight: 800,
            color: 'var(--text-primary)',
            letterSpacing: '-0.03em',
            marginBottom: 6,
          }}
        >
          Leaderboard
        </h1>
        <p style={{ fontSize: 14, color: 'var(--text-muted)' }}>
          Your personal bests by event
        </p>
      </div>

      {/* ── Info banner ── */}
      <div
        style={{
          backgroundColor: 'var(--surface-0)',
          border: '1px solid var(--border)',
          borderRadius: 10,
          padding: '12px 16px',
          display: 'flex',
          alignItems: 'flex-start',
          gap: 10,
          marginBottom: 28,
        }}
      >
        <InfoIcon />
        <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.5 }}>
          Global rankings across all CubeArena users are coming soon.
        </p>
      </div>

      {/* ── Loading skeleton ── */}
      {loading && <LoadingSkeleton />}

      {/* ── Empty state ── */}
      {isEmpty && (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 12,
            padding: '48px 24px',
            backgroundColor: 'var(--surface-0)',
            border: '1px solid var(--border)',
            borderRadius: 12,
            textAlign: 'center',
          }}
        >
          <TrophyIcon />
          <div>
            <p
              style={{
                fontSize: 16,
                fontWeight: 600,
                color: 'var(--text-primary)',
                marginBottom: 6,
              }}
            >
              No solves yet
            </p>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.5 }}>
              Complete some solves to see your rankings here.
            </p>
          </div>
        </div>
      )}

      {/* ── Stats table ── */}
      {!loading && stats.length > 0 && (
        <div
          style={{
            backgroundColor: 'var(--surface-0)',
            border: '1px solid var(--border)',
            borderRadius: 12,
            overflow: 'hidden',
          }}
        >
          {/* Header row */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 90px 100px 100px 56px',
              gap: 0,
              padding: '10px 20px',
              borderBottom: '1px solid var(--border)',
              fontSize: 12,
              fontWeight: 500,
              color: 'var(--text-muted)',
            }}
          >
            <span>Event</span>
            <span>Best single</span>
            <span>Ao5</span>
            <span>Ao12</span>
            <span style={{ textAlign: 'right' }}>Solves</span>
          </div>

          {/* Data rows */}
          {stats.map((row, i) => (
            <motion.div
              key={row.event}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.04, duration: 0.22, ease: 'easeOut' }}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--surface-1)' }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent' }}
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 90px 100px 100px 56px',
                gap: 0,
                padding: '14px 20px',
                borderBottom: i < stats.length - 1 ? '1px solid var(--border)' : 'none',
                alignItems: 'center',
                transition: 'background-color 150ms ease',
              }}
            >
              {/* Event label */}
              <span
                style={{
                  fontSize: 14,
                  fontWeight: 600,
                  color: 'var(--text-primary)',
                }}
              >
                {row.label}
              </span>

              {/* Best single */}
              <StatCell value={row.single} highlight size={14} />

              {/* Ao5 */}
              <StatCell value={row.ao5} size={13} />

              {/* Ao12 */}
              <StatCell value={row.ao12} size={13} />

              {/* Solve count */}
              <span
                style={{
                  fontSize: 12,
                  color: 'var(--text-muted)',
                  textAlign: 'right',
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                {row.count}
              </span>
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  )
}
