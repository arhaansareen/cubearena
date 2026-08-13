import { useMemo, useState } from 'react'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  ReferenceLine,
  XAxis,
  YAxis,
} from 'recharts'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart'
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

function last14Days() {
  return Array.from({ length: 14 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (13 - i))
    d.setHours(0, 0, 0, 0)
    return {
      label: i === 13 ? 'Today' : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      dateStr: d.toDateString(),
    }
  })
}

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

const progressConfig = {
  time: { label: 'Time', color: '#22D3EE' },
  ao5: { label: 'Ao5', color: 'rgba(34,211,238,0.5)' },
  ao12: { label: 'Ao12', color: 'rgba(255,255,255,0.25)' },
} satisfies ChartConfig

const activityConfig = {
  count: { label: 'Solves', color: '#22D3EE' },
} satisfies ChartConfig

// ─── Main component ───────────────────────────────────────────────────────────

export function SolveProgressChart({ solves, loading }: { solves: Solve[]; loading: boolean }) {
  const defaultEvent = useMemo<WCAEvent>(() => {
    const counts = new Map<WCAEvent, number>()
    for (const s of solves) counts.set(s.event, (counts.get(s.event) ?? 0) + 1)
    let best: WCAEvent = '333'; let max = 0
    for (const [ev, n] of counts) { if (n > max) { max = n; best = ev } }
    return best
  }, [solves])

  const [selectedEvent, setSelectedEvent] = useState<WCAEvent | null>(null)
  const event = selectedEvent ?? defaultEvent

  const eventsWithSolves = useMemo<WCAEvent[]>(() => {
    const s = new Set<WCAEvent>()
    for (const solve of solves) s.add(solve.event)
    return EVENTS.map((e) => e.value).filter((e) => s.has(e))
  }, [solves])

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
      label: `#${i + 1}`,
      time: isFinite(s.effectiveTime) ? s.effectiveTime : undefined,
      ao5: ao5s[i] ?? undefined,
      ao12: ao12s[i] ?? undefined,
    }))
  }, [solves, event])

  const yDomain = useMemo(() => {
    const valid = progressData.map((d) => d.time).filter((t): t is number => t !== undefined)
    if (!valid.length) return ['auto', 'auto'] as const
    const min = Math.min(...valid), max = Math.max(...valid)
    const pad = (max - min) * 0.15 || min * 0.1
    return [Math.max(0, min - pad), max + pad] as const
  }, [progressData])

  const bestTime = useMemo(() => {
    const valid = progressData.map((d) => d.time).filter((t): t is number => t !== undefined)
    return valid.length ? Math.min(...valid) : null
  }, [progressData])

  const activityData = useMemo(() => {
    const days = last14Days()
    const countByDay = new Map<string, number>()
    for (const s of solves) {
      const ds = new Date(s.timestamp).toDateString()
      countByDay.set(ds, (countByDay.get(ds) ?? 0) + 1)
    }
    return days.map((d) => ({ ...d, count: countByDay.get(d.dateStr) ?? 0 }))
  }, [solves])

  const maxActivity = useMemo(() => Math.max(...activityData.map((d) => d.count), 1), [activityData])

  if (loading) return <div style={{ height: 320, borderRadius: 12, backgroundColor: 'var(--surface-0)', border: '1px solid var(--border)' }} />

  if (solves.length < 3) return (
    <div style={{ height: 160, borderRadius: 12, backgroundColor: 'var(--surface-0)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
      Solve at least 3 times to see your progress.
    </div>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

      {/* ── Progress chart ── */}
      <div style={{ backgroundColor: 'var(--surface-0)', border: '1px solid var(--border)', borderRadius: 12, padding: '20px 20px 8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 8 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>Progress</span>
            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>last {Math.min(progressData.length, 100)} solves</span>
          </div>
          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
            {eventsWithSolves.map((ev) => {
              const label = EVENTS.find((e) => e.value === ev)?.label ?? ev
              const active = event === ev
              return (
                <button key={ev} onClick={() => setSelectedEvent(ev)} style={{
                  padding: '3px 10px', borderRadius: 6,
                  border: `1px solid ${active ? 'var(--accent)' : 'var(--border)'}`,
                  backgroundColor: active ? 'var(--accent-dim)' : 'transparent',
                  color: active ? 'var(--accent)' : 'var(--text-muted)',
                  fontSize: 11, fontWeight: 600, cursor: 'pointer', transition: 'all 120ms ease',
                }}>
                  {label}
                </button>
              )
            })}
          </div>
        </div>

        {/* Legend */}
        <div style={{ display: 'flex', gap: 16, marginBottom: 12 }}>
          {[
            { color: '#22D3EE', label: 'Time' },
            { color: 'rgba(34,211,238,0.5)', label: 'Ao5', dashed: false },
            { color: 'rgba(255,255,255,0.25)', label: 'Ao12', dashed: true },
          ].map(({ color, label, dashed }) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <svg width="20" height="2"><line x1="0" y1="1" x2="20" y2="1" stroke={color} strokeWidth="2" strokeDasharray={dashed ? '4 3' : undefined} /></svg>
              <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>{label}</span>
            </div>
          ))}
          {bestTime && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <svg width="20" height="2"><line x1="0" y1="1" x2="20" y2="1" stroke="rgba(34,197,94,0.5)" strokeWidth="1.5" strokeDasharray="4 3" /></svg>
              <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>PB {formatTime(bestTime)}</span>
            </div>
          )}
        </div>

        <ChartContainer config={progressConfig} style={{ height: 240, width: '100%' }}>
          <AreaChart data={progressData} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
            <defs>
              <linearGradient id="timeGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#22D3EE" stopOpacity={0.15} />
                <stop offset="95%" stopColor="#22D3EE" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
            <XAxis dataKey="label" tick={{ fill: 'var(--text-muted)', fontSize: 10 }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
            <YAxis domain={yDomain} tick={{ fill: 'var(--text-muted)', fontSize: 10, fontFamily: "'JetBrains Mono', monospace" }} tickLine={false} axisLine={false} tickFormatter={(v) => formatTime(v)} width={52} />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  formatter={(value, name) => [
                    <span key={name} style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 700 }}>
                      {formatTime(value as number)}
                    </span>,
                    name === 'time' ? 'Time' : name === 'ao5' ? 'Ao5' : 'Ao12',
                  ]}
                  labelFormatter={(label) => <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>{label}</span>}
                />
              }
              cursor={{ stroke: 'rgba(255,255,255,0.1)', strokeWidth: 1 }}
            />
            {bestTime && <ReferenceLine y={bestTime} stroke="rgba(34,197,94,0.4)" strokeDasharray="4 4" strokeWidth={1} />}
            <Area dataKey="time" type="monotone" stroke="#22D3EE" strokeWidth={2} fill="url(#timeGradient)" dot={{ r: 2.5, fill: '#22D3EE', strokeWidth: 0 }} activeDot={{ r: 4, fill: '#22D3EE' }} connectNulls={false} />
            <Line dataKey="ao5" type="monotone" stroke="rgba(34,211,238,0.55)" strokeWidth={2} dot={false} activeDot={false} connectNulls={false} />
            <Line dataKey="ao12" type="monotone" stroke="rgba(255,255,255,0.2)" strokeWidth={1.5} strokeDasharray="4 3" dot={false} activeDot={false} connectNulls={false} />
          </AreaChart>
        </ChartContainer>
      </div>

      {/* ── Activity chart ── */}
      <div style={{ backgroundColor: 'var(--surface-0)', border: '1px solid var(--border)', borderRadius: 12, padding: '20px 20px 8px' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 16 }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>Activity</span>
          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>last 14 days</span>
        </div>
        <ChartContainer config={activityConfig} style={{ height: 110, width: '100%' }}>
          <BarChart data={activityData} margin={{ top: 0, right: 4, bottom: 0, left: 0 }} barCategoryGap="35%">
            <CartesianGrid stroke="rgba(255,255,255,0.04)" vertical={false} />
            <XAxis dataKey="label" tick={{ fill: 'var(--text-muted)', fontSize: 9 }} tickLine={false} axisLine={false} interval={2} />
            <YAxis hide />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  formatter={(value) => [`${value} solve${value !== 1 ? 's' : ''}`, '']}
                  labelFormatter={(label) => <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>{label}</span>}
                />
              }
              cursor={{ fill: 'rgba(255,255,255,0.04)' }}
            />
            <Bar dataKey="count" radius={[3, 3, 0, 0]}>
              {activityData.map((entry, i) => (
                <Cell key={i} fill={
                  entry.count === 0 ? 'rgba(255,255,255,0.05)'
                  : entry.count >= maxActivity * 0.8 ? '#22D3EE'
                  : entry.count >= maxActivity * 0.4 ? 'rgba(34,211,238,0.5)'
                  : 'rgba(34,211,238,0.25)'
                } />
              ))}
            </Bar>
          </BarChart>
        </ChartContainer>
      </div>
    </div>
  )
}
