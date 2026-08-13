import { useMemo, useState } from 'react'
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  BarChart,
  Bar,
  Cell,
} from 'recharts'
import { formatTime } from '@/lib/utils'
import type { Solve, WCAEvent } from '@/types'

// ─── helpers ─────────────────────────────────────────────────────────────────

function rollingAo(times: number[], n: number): (number | null)[] {
  return times.map((_, i) => {
    if (i < n - 1) return null
    const window = times.slice(i - n + 1, i + 1)
    if (window.some((t) => !isFinite(t))) return null
    const sorted = [...window].sort((a, b) => a - b)
    const trimmed = n >= 5 ? sorted.slice(1, -1) : sorted
    return trimmed.reduce((s, t) => s + t, 0) / trimmed.length
  })
}

function last14Days(): { label: string; dateStr: string }[] {
  const result: { label: string; dateStr: string }[] = []
  for (let i = 13; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    d.setHours(0, 0, 0, 0)
    result.push({
      label: i === 0 ? 'Today' : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      dateStr: d.toDateString(),
    })
  }
  return result
}

// ─── Tooltip components ───────────────────────────────────────────────────────

function ProgressTooltip({ active, payload }: { active?: boolean; payload?: any[] }) {
  if (!active || !payload?.length) return null
  const d = payload[0]?.payload
  if (!d) return null
  return (
    <div style={{
      backgroundColor: 'var(--surface-1)',
      border: '1px solid var(--border)',
      borderRadius: 8,
      padding: '8px 12px',
      fontSize: 12,
      lineHeight: 1.6,
      minWidth: 120,
    }}>
      <div style={{ color: 'var(--text-muted)', marginBottom: 4 }}>Solve #{d.index + 1}</div>
      <div style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, color: 'var(--accent)', fontSize: 14 }}>
        {isFinite(d.time) ? formatTime(d.time) : 'DNF'}
      </div>
      {d.ao5 !== null && (
        <div style={{ fontFamily: "'JetBrains Mono', monospace", color: 'rgba(34,211,238,0.6)', fontSize: 12, marginTop: 2 }}>
          Ao5 {formatTime(d.ao5)}
        </div>
      )}
      {d.ao12 !== null && (
        <div style={{ fontFamily: "'JetBrains Mono', monospace", color: 'var(--text-muted)', fontSize: 11 }}>
          Ao12 {formatTime(d.ao12)}
        </div>
      )}
    </div>
  )
}

function ActivityTooltip({ active, payload }: { active?: boolean; payload?: any[] }) {
  if (!active || !payload?.length) return null
  const d = payload[0]?.payload
  if (!d) return null
  return (
    <div style={{
      backgroundColor: 'var(--surface-1)',
      border: '1px solid var(--border)',
      borderRadius: 8,
      padding: '8px 12px',
      fontSize: 12,
    }}>
      <div style={{ color: 'var(--text-muted)', marginBottom: 2 }}>{d.label}</div>
      <div style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, color: 'var(--accent)' }}>
        {d.count} solve{d.count !== 1 ? 's' : ''}
      </div>
    </div>
  )
}

// ─── Event selector ───────────────────────────────────────────────────────────

const EVENTS: { value: WCAEvent; label: string }[] = [
  { value: '333', label: '3×3' },
  { value: '222', label: '2×2' },
  { value: '444', label: '4×4' },
  { value: '333oh', label: 'OH' },
  { value: 'pyram', label: 'Pyra' },
  { value: 'skewb', label: 'Skewb' },
  { value: '555', label: '5×5' },
  { value: 'minx', label: 'Mega' },
  { value: 'clock', label: 'Clock' },
  { value: 'sq1', label: 'Sq-1' },
  { value: '333bf', label: 'BLD' },
]

// ─── Main component ───────────────────────────────────────────────────────────

interface Props {
  solves: Solve[]
  loading: boolean
}

export function SolveProgressChart({ solves, loading }: Props) {
  // Pick default event: whichever has the most solves
  const defaultEvent = useMemo<WCAEvent>(() => {
    const counts = new Map<WCAEvent, number>()
    for (const s of solves) counts.set(s.event, (counts.get(s.event) ?? 0) + 1)
    let best: WCAEvent = '333'
    let max = 0
    for (const [ev, n] of counts) {
      if (n > max) { max = n; best = ev }
    }
    return best
  }, [solves])

  const [selectedEvent, setSelectedEvent] = useState<WCAEvent | null>(null)
  const event = selectedEvent ?? defaultEvent

  const eventsWithSolves = useMemo<WCAEvent[]>(() => {
    const s = new Set<WCAEvent>()
    for (const solve of solves) s.add(solve.event)
    return EVENTS.map((e) => e.value).filter((e) => s.has(e))
  }, [solves])

  // ── Progress chart data ──
  const progressData = useMemo(() => {
    const filtered = solves
      .filter((s) => s.event === event)
      .sort((a, b) => a.timestamp - b.timestamp)
      .slice(-100)

    const times = filtered.map((s) => s.effectiveTime)
    const ao5s = rollingAo(times, 5)
    const ao12s = rollingAo(times, 12)

    return filtered.map((s, i) => ({
      index: i,
      time: isFinite(s.effectiveTime) ? s.effectiveTime : null,
      ao5: ao5s[i],
      ao12: ao12s[i],
    }))
  }, [solves, event])

  // Y-axis domain: ignore DNFs, add 10% headroom
  const yDomain = useMemo(() => {
    const finiteTimes = progressData.map((d) => d.time).filter((t): t is number => t !== null && isFinite(t))
    if (finiteTimes.length === 0) return ['auto', 'auto'] as const
    const min = Math.min(...finiteTimes)
    const max = Math.max(...finiteTimes)
    const pad = (max - min) * 0.15 || min * 0.1
    return [Math.max(0, min - pad), max + pad] as const
  }, [progressData])

  // Best time for reference line
  const bestTime = useMemo(() => {
    const valid = progressData.map((d) => d.time).filter((t): t is number => t !== null && isFinite(t))
    return valid.length > 0 ? Math.min(...valid) : null
  }, [progressData])

  // ── Activity chart data ──
  const activityData = useMemo(() => {
    const days = last14Days()
    const countByDay = new Map<string, number>()
    for (const s of solves) {
      const ds = new Date(s.timestamp).toDateString()
      countByDay.set(ds, (countByDay.get(ds) ?? 0) + 1)
    }
    return days.map((d) => ({ label: d.label, dateStr: d.dateStr, count: countByDay.get(d.dateStr) ?? 0 }))
  }, [solves])

  const maxActivity = useMemo(() => Math.max(...activityData.map((d) => d.count), 1), [activityData])

  if (loading) {
    return (
      <div style={{ height: 200, borderRadius: 12, backgroundColor: 'var(--surface-0)', border: '1px solid var(--border)' }} />
    )
  }

  if (solves.length < 3) {
    return (
      <div style={{
        height: 160,
        borderRadius: 12,
        backgroundColor: 'var(--surface-0)',
        border: '1px solid var(--border)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'var(--text-muted)',
        fontSize: 13,
      }}>
        Solve at least 3 times to see your progress chart.
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* ── Progress chart ── */}
      <div style={{
        backgroundColor: 'var(--surface-0)',
        border: '1px solid var(--border)',
        borderRadius: 12,
        padding: '20px 20px 12px',
      }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 8 }}>
          <div>
            <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-muted)' }}>Progress</span>
            <span style={{ fontSize: 11, color: 'var(--text-muted)', opacity: 0.5, marginLeft: 8 }}>last {Math.min(progressData.length, 100)} solves</span>
          </div>
          {/* Event tabs */}
          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
            {eventsWithSolves.map((ev) => {
              const label = EVENTS.find((e) => e.value === ev)?.label ?? ev
              const active = event === ev
              return (
                <button
                  key={ev}
                  onClick={() => setSelectedEvent(ev)}
                  style={{
                    padding: '3px 10px',
                    borderRadius: 6,
                    border: `1px solid ${active ? 'var(--accent)' : 'var(--border)'}`,
                    backgroundColor: active ? 'var(--accent-dim)' : 'transparent',
                    color: active ? 'var(--accent)' : 'var(--text-muted)',
                    fontSize: 11,
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 120ms ease',
                  }}
                >
                  {label}
                </button>
              )
            })}
          </div>
        </div>

        {/* Legend */}
        <div style={{ display: 'flex', gap: 16, marginBottom: 12, flexWrap: 'wrap' }}>
          <LegendItem color="var(--accent)" label="Solve time" dotted={false} />
          <LegendItem color="rgba(34,211,238,0.55)" label="Ao5" dotted />
          <LegendItem color="rgba(255,255,255,0.2)" label="Ao12" dotted />
        </div>

        <ResponsiveContainer width="100%" height={220}>
          <ComposedChart data={progressData} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="rgba(255,255,255,0.05)"
              vertical={false}
            />
            <XAxis
              dataKey="index"
              tick={{ fill: 'var(--text-muted)', fontSize: 10 }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => `#${v + 1}`}
              interval="preserveStartEnd"
            />
            <YAxis
              domain={yDomain}
              tick={{ fill: 'var(--text-muted)', fontSize: 10, fontFamily: "'JetBrains Mono', monospace" }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => formatTime(v)}
              width={52}
            />
            <Tooltip content={<ProgressTooltip />} cursor={{ stroke: 'rgba(255,255,255,0.1)', strokeWidth: 1 }} />
            {bestTime !== null && (
              <ReferenceLine
                y={bestTime}
                stroke="rgba(34,197,94,0.35)"
                strokeDasharray="4 4"
                strokeWidth={1}
              />
            )}
            {/* Individual times as dots */}
            <Scatter
              dataKey="time"
              fill="var(--accent)"
              opacity={0.7}
              r={2.5}
              line={false}
            />
            {/* Ao5 */}
            <Line
              dataKey="ao5"
              stroke="rgba(34,211,238,0.55)"
              strokeWidth={2}
              dot={false}
              activeDot={false}
              connectNulls={false}
              type="monotone"
            />
            {/* Ao12 */}
            <Line
              dataKey="ao12"
              stroke="rgba(255,255,255,0.2)"
              strokeWidth={1.5}
              dot={false}
              activeDot={false}
              connectNulls={false}
              type="monotone"
              strokeDasharray="4 3"
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* ── Activity chart ── */}
      <div style={{
        backgroundColor: 'var(--surface-0)',
        border: '1px solid var(--border)',
        borderRadius: 12,
        padding: '20px 20px 12px',
      }}>
        <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-muted)', marginBottom: 16 }}>
          Activity — last 14 days
        </div>
        <ResponsiveContainer width="100%" height={100}>
          <BarChart data={activityData} margin={{ top: 0, right: 4, bottom: 0, left: 0 }} barCategoryGap="30%">
            <CartesianGrid stroke="rgba(255,255,255,0.04)" vertical={false} />
            <XAxis
              dataKey="label"
              tick={{ fill: 'var(--text-muted)', fontSize: 9 }}
              tickLine={false}
              axisLine={false}
              interval={2}
            />
            <YAxis hide />
            <Tooltip content={<ActivityTooltip />} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
            <Bar dataKey="count" radius={[3, 3, 0, 0]}>
              {activityData.map((entry, i) => (
                <Cell
                  key={i}
                  fill={
                    entry.count === 0
                      ? 'rgba(255,255,255,0.05)'
                      : entry.count >= maxActivity * 0.8
                      ? 'var(--accent)'
                      : entry.count >= maxActivity * 0.4
                      ? 'rgba(34,211,238,0.5)'
                      : 'rgba(34,211,238,0.25)'
                  }
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

function LegendItem({ color, label, dotted }: { color: string; label: string; dotted: boolean }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <svg width="20" height="2" aria-hidden="true">
        <line
          x1="0" y1="1" x2="20" y2="1"
          stroke={color}
          strokeWidth="2"
          strokeDasharray={dotted ? '4 3' : undefined}
        />
      </svg>
      <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>{label}</span>
    </div>
  )
}
