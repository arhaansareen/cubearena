import { useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  ResponsiveContainer, ComposedChart, Scatter, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine,
} from 'recharts'
import type { Solve, WCAEvent } from '@/types'
import { formatTime } from '@/lib/utils'
import { useWCAData } from '@/hooks/useWCAData'

// ─── Math helpers ─────────────────────────────────────────────────────────────

function rollingAo(times: number[], n: number): (number | null)[] {
  return times.map((_, i) => {
    if (i < n - 1) return null
    const w = times.slice(i - n + 1, i + 1)
    if (w.some(t => !isFinite(t))) return null
    const s = [...w].sort((a, b) => a - b)
    const t = n >= 5 ? s.slice(1, -1) : s
    return t.reduce((a, b) => a + b, 0) / t.length
  })
}

function mean(arr: number[]): number {
  return arr.reduce((a, b) => a + b, 0) / arr.length
}

function stdDev(arr: number[]): number {
  if (arr.length < 2) return 0
  const m = mean(arr)
  return Math.sqrt(arr.reduce((s, x) => s + (x - m) ** 2, 0) / arr.length)
}

function linReg(times: number[]): { m: number; b: number } | null {
  const n = times.length
  if (n < 3) return null
  const xs = times.map((_, i) => i)
  const sx = xs.reduce((a, x) => a + x, 0)
  const sy = times.reduce((a, y) => a + y, 0)
  const sxy = xs.reduce((a, x, i) => a + x * times[i], 0)
  const sx2 = xs.reduce((a, x) => a + x * x, 0)
  const denom = n * sx2 - sx * sx
  if (denom === 0) return null
  const m = (n * sxy - sx * sy) / denom
  const b = (sy - m * sx) / n
  return { m, b }
}

function parseTimeInput(s: string): number | null {
  s = s.trim()
  const minsec = s.match(/^(\d+):(\d{1,2})\.(\d{1,2})$/)
  if (minsec) return (parseInt(minsec[1]) * 60 + parseInt(minsec[2])) * 1000 + parseInt(minsec[3].padEnd(2, '0')) * 10
  const sec = s.match(/^(\d+)\.(\d{1,2})$/)
  if (sec) return parseInt(sec[1]) * 1000 + parseInt(sec[2].padEnd(2, '0')) * 10
  return null
}

function exportCSV(solves: Solve[], event: WCAEvent) {
  const header = 'No,Date,Event,Time,Penalty,Effective,Scramble,Notes,Tags'
  const rows = solves.map((s, i) => {
    const eff = isFinite(s.effectiveTime) ? (s.effectiveTime / 1000).toFixed(3) : 'DNF'
    const scr = `"${s.scramble.replace(/"/g, '""')}"`
    const notes = `"${(s.notes ?? '').replace(/"/g, '""')}"`
    const tags = `"${s.tags.join(', ')}"`
    const date = new Date(s.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    return [i + 1, date, event, (s.time / 1000).toFixed(3), s.penalty ?? 'OK', eff, scr, notes, tags].join(',')
  })
  const blob = new Blob([[header, ...rows].join('\n')], { type: 'text/csv' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = `cubearena-session-${event}-${Date.now()}.csv`
  a.click()
  URL.revokeObjectURL(a.href)
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatBox({ label, value, sub, accent }: { label: string; value: string; sub?: string; accent?: boolean }) {
  return (
    <div style={{
      backgroundColor: accent ? 'rgba(34,211,238,0.06)' : 'var(--surface-1)',
      border: `1px solid ${accent ? 'rgba(34,211,238,0.2)' : 'var(--border)'}`,
      borderRadius: 10, padding: '12px 16px',
    }}>
      <div style={{ fontSize: 10, fontWeight: 600, color: accent ? 'var(--accent)' : 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 4 }}>{label}</div>
      <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 18, fontWeight: 700, color: accent ? 'var(--accent)' : 'var(--text-primary)', lineHeight: 1 }}>{value}</div>
      {sub && <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 3 }}>{sub}</div>}
    </div>
  )
}

type Tab = 'overview' | 'patterns' | 'official' | 'compare' | 'goals'

// ─── Patterns helpers ─────────────────────────────────────────────────────────

type TODBucket = 'Morning' | 'Afternoon' | 'Evening' | 'Night'

function getTODBucket(hour: number): TODBucket {
  if (hour >= 5 && hour < 12) return 'Morning'
  if (hour >= 12 && hour < 17) return 'Afternoon'
  if (hour >= 17 && hour < 22) return 'Evening'
  return 'Night'
}

interface TODStats {
  bucket: TODBucket
  count: number
  avg: number | null
  best: number | null
}

interface DOWStats {
  day: string
  count: number
  avg: number | null
}

const DOW_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

// ─── WCA event display names ──────────────────────────────────────────────────

const EVENT_NAMES: Partial<Record<WCAEvent, string>> = {
  '333': '3x3',
  '222': '2x2',
  '444': '4x4',
  '555': '5x5',
  '666': '6x6',
  '777': '7x7',
  '333bf': '3x3 BLD',
  '333oh': '3x3 OH',
  '333fm': '3x3 FMC',
  'clock': 'Clock',
  'minx': 'Megaminx',
  'pyram': 'Pyraminx',
  'skewb': 'Skewb',
  'sq1': 'Square-1',
  '444bf': '4x4 BLD',
  '555bf': '5x5 BLD',
}

// ─── Main ─────────────────────────────────────────────────────────────────────

interface InsightsModalProps {
  isOpen: boolean
  onClose: () => void
  solves: Solve[]
  allSolves: Solve[]
  event: WCAEvent
  wcaId?: string | null
}

export function InsightsModal({ isOpen, onClose, solves, allSolves, event, wcaId }: InsightsModalProps) {
  const [tab, setTab] = useState<Tab>('overview')
  const [ignoreDisasters, setIgnoreDisasters] = useState(false)
  const [goalInput, setGoalInput] = useState('')

  // WCA data hook for Official tab
  const { state: wcaState, lookup: wcaLookup } = useWCAData()

  // Fetch WCA data when Official tab is shown and wcaId is available
  useEffect(() => {
    if (tab === 'official' && wcaId) {
      void wcaLookup(wcaId)
    }
  }, [tab, wcaId, wcaLookup])

  // ── Filtered solves for current session ──────────────────────────────────
  const validSolves = useMemo(() =>
    solves.filter(s => isFinite(s.effectiveTime)), [solves])

  const filteredSolves = useMemo(() => {
    if (!ignoreDisasters || validSolves.length < 4) return validSolves
    const m = mean(validSolves.map(s => s.effectiveTime))
    const sd = stdDev(validSolves.map(s => s.effectiveTime))
    return validSolves.filter(s => s.effectiveTime <= m + 2 * sd)
  }, [validSolves, ignoreDisasters])

  const times = useMemo(() => filteredSolves.map(s => s.effectiveTime), [filteredSolves])

  // ── Overview stats ────────────────────────────────────────────────────────
  const stats = useMemo(() => {
    if (times.length === 0) return null
    const best = Math.min(...times)
    const worst = Math.max(...times)
    const m = mean(times)
    const sd = stdDev(times)
    const cv = sd / m * 100
    const half = Math.floor(times.length / 2)
    const firstHalfMean = half > 0 ? mean(times.slice(0, half)) : null
    const lastHalfMean = half > 0 ? mean(times.slice(-half)) : null
    const trend = firstHalfMean !== null && lastHalfMean !== null ? firstHalfMean - lastHalfMean : 0
    const ao5s = rollingAo(times, 5)
    const ao12s = rollingAo(times, 12)
    return { best, worst, mean: m, stdDev: sd, cv, trend, ao5: ao5s[ao5s.length - 1], ao12: ao12s[ao12s.length - 1] }
  }, [times])

  // ── Chart data ────────────────────────────────────────────────────────────
  const chartData = useMemo(() => {
    const ao5s = rollingAo(times, 5)
    const ao12s = rollingAo(times, 12)
    return times.map((t, i) => ({
      i: i + 1,
      time: t,
      ao5: ao5s[i] ?? undefined,
      ao12: ao12s[i] ?? undefined,
    }))
  }, [times])

  const yDomain = useMemo(() => {
    if (!times.length) return [0, 60000] as [number, number]
    const min = Math.min(...times), max = Math.max(...times)
    const pad = (max - min) * 0.15 || min * 0.1
    return [Math.max(0, min - pad), max + pad] as [number, number]
  }, [times])

  // ── Compare: group allSolves by session ───────────────────────────────────
  const pastSessions = useMemo(() => {
    const bySession = new Map<string, Solve[]>()
    for (const s of allSolves) {
      if (s.event !== event) continue
      const arr = bySession.get(s.sessionId) ?? []
      arr.push(s)
      bySession.set(s.sessionId, arr)
    }
    const currentSessionId = solves[0]?.sessionId
    return Array.from(bySession.entries())
      .filter(([id]) => id !== currentSessionId)
      .map(([id, solvesArr]) => {
        const valid = solvesArr.filter(s => isFinite(s.effectiveTime))
        const t = valid.map(s => s.effectiveTime)
        const ao5s = rollingAo(t, 5)
        const ao12s = rollingAo(t, 12)
        return {
          id,
          count: solvesArr.length,
          date: new Date(Math.min(...solvesArr.map(s => s.timestamp))).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          best: t.length ? Math.min(...t) : null,
          mean: t.length ? mean(t) : null,
          ao5: ao5s[ao5s.length - 1] ?? null,
          ao12: ao12s[ao12s.length - 1] ?? null,
        }
      })
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)
  }, [allSolves, event, solves])

  const [compareId, setCompareId] = useState<string | null>(null)
  const compareSession = useMemo(() => pastSessions.find(s => s.id === compareId) ?? null, [pastSessions, compareId])

  // ── Goals: linear regression ──────────────────────────────────────────────
  const goalMs = useMemo(() => parseTimeInput(goalInput), [goalInput])
  const reg = useMemo(() => linReg(times), [times])
  const prediction = useMemo(() => {
    if (!goalMs || !reg || reg.m >= 0) return null
    const x = (goalMs - reg.b) / reg.m
    const remaining = Math.ceil(x - times.length)
    if (remaining <= 0) return 'already_there'
    if (remaining > 10000) return null
    return remaining
  }, [goalMs, reg, times.length])

  // ── Patterns: time-of-day and day-of-week ────────────────────────────────
  const eventSolves = useMemo(() =>
    allSolves.filter(s => s.event === event && isFinite(s.effectiveTime)),
    [allSolves, event])

  const todStats = useMemo((): TODStats[] => {
    const buckets: Record<TODBucket, number[]> = { Morning: [], Afternoon: [], Evening: [], Night: [] }
    for (const s of eventSolves) {
      const hour = new Date(s.timestamp).getHours()
      buckets[getTODBucket(hour)].push(s.effectiveTime)
    }
    return (['Morning', 'Afternoon', 'Evening', 'Night'] as TODBucket[]).map(bucket => {
      const arr = buckets[bucket]
      return {
        bucket,
        count: arr.length,
        avg: arr.length > 0 ? mean(arr) : null,
        best: arr.length > 0 ? Math.min(...arr) : null,
      }
    })
  }, [eventSolves])

  const bestTODBucket = useMemo((): TODBucket | null => {
    const withAvg = todStats.filter(s => s.avg !== null)
    if (withAvg.length === 0) return null
    return withAvg.reduce((a, b) => (a.avg! < b.avg! ? a : b)).bucket
  }, [todStats])

  const dowStats = useMemo((): DOWStats[] => {
    const days: number[][] = Array.from({ length: 7 }, () => [])
    for (const s of eventSolves) {
      const dow = new Date(s.timestamp).getDay()
      days[dow].push(s.effectiveTime)
    }
    // Reorder to Mon-Sun (1,2,3,4,5,6,0)
    const order = [1, 2, 3, 4, 5, 6, 0]
    return order.map(dow => ({
      day: DOW_LABELS[dow],
      count: days[dow].length,
      avg: days[dow].length > 0 ? mean(days[dow]) : null,
    }))
  }, [eventSolves])

  const maxDOWAvg = useMemo(() => {
    const avgs = dowStats.filter(d => d.avg !== null).map(d => d.avg!)
    return avgs.length > 0 ? Math.max(...avgs) : 0
  }, [dowStats])

  // ── Official: training stats per event ───────────────────────────────────
  const trainingStatsByEvent = useMemo(() => {
    const map = new Map<WCAEvent, { count: number; best: number | null; ao5: number | null }>()
    const byEvent = new Map<WCAEvent, number[]>()
    for (const s of allSolves) {
      if (!isFinite(s.effectiveTime)) continue
      const arr = byEvent.get(s.event) ?? []
      arr.push(s.effectiveTime)
      byEvent.set(s.event, arr)
    }
    for (const [ev, arr] of byEvent.entries()) {
      const ao5s = rollingAo(arr, 5)
      const lastAo5 = ao5s.reverse().find(v => v !== null) ?? null
      map.set(ev, {
        count: arr.length,
        best: arr.length > 0 ? Math.min(...arr) : null,
        ao5: lastAo5,
      })
    }
    return map
  }, [allSolves])

  // ── Tab nav ───────────────────────────────────────────────────────────────
  const tabs: { id: Tab; label: string }[] = [
    { id: 'overview', label: 'Overview' },
    { id: 'patterns', label: 'Patterns' },
    { id: 'official', label: 'Official' },
    { id: 'compare', label: 'Compare' },
    { id: 'goals', label: 'Goals' },
  ]

  const tabStyle = (active: boolean): React.CSSProperties => ({
    padding: '10px 16px', border: 'none', background: 'none', cursor: 'pointer',
    fontSize: 13, fontWeight: 500,
    color: active ? 'var(--text-primary)' : 'var(--text-muted)',
    borderBottom: `2px solid ${active ? 'var(--accent)' : 'transparent'}`,
    transition: 'color 120ms, border-color 120ms',
  })

  const toggleStyle = (active: boolean): React.CSSProperties => ({
    padding: '5px 12px', borderRadius: 20, border: `1px solid ${active ? 'var(--accent)' : 'var(--border)'}`,
    background: active ? 'var(--accent-dim)' : 'none',
    color: active ? 'var(--accent)' : 'var(--text-muted)',
    fontSize: 11, fontWeight: 500, cursor: 'pointer', transition: 'all 120ms',
  })

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          style={{
            position: 'fixed', inset: 0, zIndex: 1000,
            backgroundColor: 'var(--bg)',
            display: 'flex', flexDirection: 'column', overflow: 'hidden',
          }}
        >
          {/* Header */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '0 24px', height: 56, borderBottom: '1px solid var(--border)', flexShrink: 0,
          }}>
            <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-primary)' }}>
              Practice Insights — {solves.length} solves
            </span>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={() => exportCSV(solves, event)}
                style={{
                  padding: '6px 14px', borderRadius: 7, border: '1px solid var(--border)',
                  background: 'var(--surface-1)', color: 'var(--text-primary)',
                  fontSize: 12, fontWeight: 500, cursor: 'pointer',
                }}
              >
                Export CSV
              </button>
              <button
                onClick={onClose}
                style={{
                  padding: '6px 14px', borderRadius: 7, border: '1px solid var(--border)',
                  background: 'none', color: 'var(--text-muted)',
                  fontSize: 12, fontWeight: 500, cursor: 'pointer',
                }}
              >
                Close
              </button>
            </div>
          </div>

          {/* Tab bar */}
          <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', paddingLeft: 8, flexShrink: 0 }}>
            {tabs.map(t => (
              <button key={t.id} onClick={() => setTab(t.id)} style={tabStyle(tab === t.id)}>
                {t.label}
              </button>
            ))}
          </div>

          {/* Body */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '24px 32px' }}>

            {/* ── OVERVIEW ── */}
            {tab === 'overview' && (
              <div style={{ maxWidth: 860, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 20 }}>
                {/* Toggles */}
                <div style={{ display: 'flex', gap: 8 }}>
                  <button style={toggleStyle(ignoreDisasters)} onClick={() => setIgnoreDisasters(p => !p)}>
                    Ignore disasters
                  </button>
                </div>

                {times.length < 3 ? (
                  <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: 13, padding: '60px 0' }}>
                    {times.length === 0
                      ? "No solves yet. Start solving to see insights."
                      : "Need at least 3 solves before these numbers mean anything."}
                  </div>
                ) : (
                  <>
                    {times.length < 12 && (
                      <div style={{ fontSize: 12, color: 'var(--text-muted)', padding: '8px 14px', borderRadius: 8, border: '1px solid var(--border)', backgroundColor: 'var(--surface-1)' }}>
                        These numbers need at least 12 solves before they're meaningful. You have {times.length}.
                      </div>
                    )}

                    {/* Stats grid */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: 10 }}>
                      <StatBox label="Best" value={formatTime(stats!.best)} accent />
                      <StatBox label="Worst" value={formatTime(stats!.worst)} />
                      <StatBox label="Mean" value={formatTime(stats!.mean)} />
                      <StatBox label="Std Dev" value={formatTime(stats!.stdDev)} sub={`±${stats!.cv.toFixed(1)}%`} />
                      <StatBox label="Current Ao5" value={stats!.ao5 !== null && stats!.ao5 !== undefined ? formatTime(stats!.ao5) : '—'} />
                      <StatBox label="Current Ao12" value={stats!.ao12 !== null && stats!.ao12 !== undefined ? formatTime(stats!.ao12) : '—'} />
                    </div>

                    {/* Trend indicator */}
                    {times.length >= 10 && (
                      <div style={{
                        padding: '12px 16px', borderRadius: 10, border: '1px solid var(--border)',
                        backgroundColor: 'var(--surface-1)',
                        display: 'flex', alignItems: 'center', gap: 10,
                      }}>
                        <span style={{
                          fontSize: 18,
                          color: stats!.trend > 500 ? 'var(--positive)' : stats!.trend < -500 ? 'var(--penalty)' : 'var(--text-muted)',
                        }}>
                          {stats!.trend > 500 ? '↓' : stats!.trend < -500 ? '↑' : '→'}
                        </span>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
                            {stats!.trend > 500
                              ? `Improving — ${formatTime(stats!.trend)} faster in second half`
                              : stats!.trend < -500
                              ? `Slowing down — ${formatTime(Math.abs(stats!.trend))} slower in second half`
                              : 'Consistent — no clear trend this session'}
                          </div>
                          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Comparing first and second half of session</div>
                        </div>
                      </div>
                    )}

                    {/* Chart */}
                    <div style={{ backgroundColor: 'var(--surface-1)', border: '1px solid var(--border)', borderRadius: 12, padding: '20px 20px 12px' }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 16 }}>
                        Session times
                      </div>
                      <div style={{ display: 'flex', gap: 16, marginBottom: 12 }}>
                        {[
                          { color: '#22D3EE', label: 'Time', dash: false },
                          { color: 'rgba(34,211,238,0.5)', label: 'Ao5', dash: false },
                          { color: 'rgba(255,255,255,0.2)', label: 'Ao12', dash: true },
                          { color: 'rgba(34,197,94,0.5)', label: 'Best', dash: true },
                        ].map(({ color, label, dash }) => (
                          <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                            <svg width="18" height="2"><line x1="0" y1="1" x2="18" y2="1" stroke={color} strokeWidth="2" strokeDasharray={dash ? '4 3' : undefined} /></svg>
                            <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>{label}</span>
                          </div>
                        ))}
                      </div>
                      <div style={{ height: 260 }}>
                        <ResponsiveContainer width="100%" height="100%">
                          <ComposedChart data={chartData} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                            <XAxis dataKey="i" tick={{ fill: 'var(--text-muted)', fontSize: 10 }} tickLine={false} axisLine={false} />
                            <YAxis
                              domain={yDomain}
                              tick={{ fill: 'var(--text-muted)', fontSize: 10, fontFamily: "'JetBrains Mono', monospace" }}
                              tickLine={false} axisLine={false}
                              tickFormatter={v => formatTime(v as number)}
                              width={54}
                            />
                            <Tooltip
                              contentStyle={{ backgroundColor: 'var(--surface-1)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }}
                              labelStyle={{ color: 'var(--text-muted)' }}
                              formatter={(v, name) => [formatTime(v as number), name === 'time' ? 'Time' : name === 'ao5' ? 'Ao5' : 'Ao12']}
                              labelFormatter={v => `Solve #${v}`}
                            />
                            {stats?.best && <ReferenceLine y={stats.best} stroke="rgba(34,197,94,0.4)" strokeDasharray="4 4" strokeWidth={1} />}
                            <Scatter dataKey="time" fill="#22D3EE" shape={<circle r={3} />} />
                            <Line dataKey="ao5" type="monotone" stroke="rgba(34,211,238,0.55)" strokeWidth={2} dot={false} connectNulls={false} />
                            <Line dataKey="ao12" type="monotone" stroke="rgba(255,255,255,0.2)" strokeWidth={1.5} strokeDasharray="4 3" dot={false} connectNulls={false} />
                          </ComposedChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* ── PATTERNS ── */}
            {tab === 'patterns' && (
              <div style={{ maxWidth: 860, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 28 }}>
                {eventSolves.length < 30 ? (
                  <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: 13, padding: '60px 0' }}>
                    Need at least 30 solves on this puzzle across all your sessions. You have {eventSolves.length}.
                  </div>
                ) : (
                  <>
                    {/* Time of day section */}
                    <div>
                      <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 14 }}>
                        Time of day
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
                        {todStats.map(({ bucket, count, avg, best }) => {
                          const isBest = bucket === bestTODBucket
                          return (
                            <div
                              key={bucket}
                              style={{
                                backgroundColor: isBest ? 'rgba(34,211,238,0.06)' : 'var(--surface-1)',
                                border: `1px solid ${isBest ? 'rgba(34,211,238,0.35)' : 'var(--border)'}`,
                                borderRadius: 12,
                                padding: '16px 20px',
                              }}
                            >
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                                <span style={{
                                  fontSize: 12, fontWeight: 700,
                                  color: isBest ? 'var(--accent)' : 'var(--text-primary)',
                                  textTransform: 'uppercase', letterSpacing: '0.05em',
                                }}>
                                  {bucket}
                                </span>
                                {isBest && (
                                  <span style={{
                                    fontSize: 10, fontWeight: 600, color: 'var(--accent)',
                                    backgroundColor: 'var(--accent-dim)', borderRadius: 4,
                                    padding: '2px 7px', letterSpacing: '0.05em',
                                  }}>
                                    BEST
                                  </span>
                                )}
                              </div>
                              <div style={{
                                fontFamily: "'JetBrains Mono', monospace",
                                fontSize: 26, fontWeight: 800,
                                color: isBest ? 'var(--accent)' : 'var(--text-primary)',
                                lineHeight: 1,
                              }}>
                                {avg !== null ? formatTime(avg) : '—'}
                              </div>
                              <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 6 }}>
                                avg · {count} solves
                              </div>
                              {best !== null && (
                                <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>
                                  best {formatTime(best)}
                                </div>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    </div>

                    {/* Day of week section */}
                    <div>
                      <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 14 }}>
                        Day of week
                      </div>
                      <div style={{ backgroundColor: 'var(--surface-1)', border: '1px solid var(--border)', borderRadius: 12, padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                        {dowStats.map(({ day, count, avg }) => {
                          const barWidth = avg !== null && maxDOWAvg > 0
                            ? Math.round((avg / maxDOWAvg) * 100)
                            : 0
                          return (
                            <div key={day} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                              <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', width: 30, flexShrink: 0 }}>{day}</span>
                              <div style={{ flex: 1, height: 6, backgroundColor: 'var(--surface-0)', borderRadius: 3, overflow: 'hidden' }}>
                                {avg !== null && (
                                  <div style={{
                                    height: '100%',
                                    width: `${barWidth}%`,
                                    backgroundColor: 'var(--accent)',
                                    opacity: 0.7,
                                    borderRadius: 3,
                                  }} />
                                )}
                              </div>
                              <span style={{
                                fontFamily: "'JetBrains Mono', monospace",
                                fontSize: 12, fontWeight: 600,
                                color: avg !== null ? 'var(--text-primary)' : 'var(--text-muted)',
                                width: 64, textAlign: 'right', flexShrink: 0,
                              }}>
                                {avg !== null ? formatTime(avg) : '—'}
                              </span>
                              <span style={{ fontSize: 10, color: 'var(--text-muted)', width: 48, textAlign: 'right', flexShrink: 0 }}>
                                {count > 0 ? `${count}` : ''}
                              </span>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* ── OFFICIAL ── */}
            {tab === 'official' && (
              <div style={{ maxWidth: 860, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 20 }}>
                {!wcaId ? (
                  <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: 13, padding: '60px 0' }}>
                    <div style={{ marginBottom: 8 }}>Link your WCA profile in Settings to compare competition results with your training bests.</div>
                    <div style={{ fontSize: 12, color: 'var(--accent)', opacity: 0.8 }}>Settings → Profile → WCA ID</div>
                  </div>
                ) : wcaState.status === 'loading' ? (
                  <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: 13, padding: '60px 0' }}>
                    Loading WCA profile…
                  </div>
                ) : wcaState.status === 'not_found' ? (
                  <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: 13, padding: '60px 0' }}>
                    WCA ID {wcaId} not found.
                  </div>
                ) : wcaState.status === 'error' ? (
                  <div style={{ textAlign: 'center', color: 'var(--penalty)', fontSize: 13, padding: '60px 0' }}>
                    Couldn't load WCA data — check your connection.
                  </div>
                ) : wcaState.status === 'idle' ? (
                  <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: 13, padding: '60px 0' }}>
                    Loading WCA profile…
                  </div>
                ) : (
                  // success
                  (() => {
                    const { personal_records } = wcaState.data

                    // Build rows: events with WCA records OR training data
                    const allEvents = new Set<WCAEvent>([
                      ...Object.keys(personal_records) as WCAEvent[],
                      ...trainingStatsByEvent.keys(),
                    ])

                    // Sort: current event first, then by training solve count desc
                    const sortedEvents = Array.from(allEvents).sort((a, b) => {
                      if (a === event) return -1
                      if (b === event) return 1
                      const ca = trainingStatsByEvent.get(a)?.count ?? 0
                      const cb = trainingStatsByEvent.get(b)?.count ?? 0
                      return cb - ca
                    })

                    return (
                      <>
                        <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                          Comparing {wcaState.data.person.name}'s WCA competition personal records vs training bests.
                        </div>
                        <div style={{ backgroundColor: 'var(--surface-1)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
                          {/* Table header */}
                          <div style={{
                            display: 'grid',
                            gridTemplateColumns: '120px 1fr 1fr 1fr 1fr',
                            gap: 0,
                            padding: '10px 20px',
                            borderBottom: '1px solid var(--border)',
                          }}>
                            {['Event', 'WCA Single', 'Training Best', 'WCA Avg', 'Training Ao5'].map(h => (
                              <div key={h} style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                                {h}
                              </div>
                            ))}
                          </div>

                          {sortedEvents.map((ev, idx) => {
                            const wca = personal_records[ev]
                            const training = trainingStatsByEvent.get(ev)

                            const wcaSingle = wca?.single?.best ?? null
                            const wcaAvg = wca?.average?.best ?? null
                            const trainingBest = training?.best ?? null
                            const trainingAo5 = training?.ao5 ?? null

                            // Delta for single: positive = training is faster
                            const singleDelta = wcaSingle !== null && trainingBest !== null
                              ? wcaSingle - trainingBest : null
                            const avgDelta = wcaAvg !== null && trainingAo5 !== null
                              ? wcaAvg - trainingAo5 : null

                            const isCurrentEvent = ev === event

                            return (
                              <div
                                key={ev}
                                style={{
                                  display: 'grid',
                                  gridTemplateColumns: '120px 1fr 1fr 1fr 1fr',
                                  gap: 0,
                                  padding: '12px 20px',
                                  borderBottom: idx < sortedEvents.length - 1 ? '1px solid var(--border)' : 'none',
                                  backgroundColor: isCurrentEvent ? 'rgba(34,211,238,0.04)' : 'transparent',
                                }}
                              >
                                <div style={{ fontSize: 13, fontWeight: isCurrentEvent ? 700 : 500, color: isCurrentEvent ? 'var(--accent)' : 'var(--text-primary)' }}>
                                  {EVENT_NAMES[ev] ?? ev}
                                </div>
                                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 13, color: 'var(--text-primary)' }}>
                                  {wcaSingle !== null ? formatTime(wcaSingle) : '—'}
                                </div>
                                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 13 }}>
                                  {trainingBest !== null ? (
                                    <span style={{ color: singleDelta !== null && singleDelta > 0 ? 'var(--positive)' : 'var(--text-primary)' }}>
                                      {formatTime(trainingBest)}
                                      {singleDelta !== null && singleDelta > 0 && (
                                        <span style={{ fontSize: 10, marginLeft: 4, color: 'var(--positive)' }}>
                                          -{formatTime(singleDelta)}
                                        </span>
                                      )}
                                    </span>
                                  ) : '—'}
                                </div>
                                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 13, color: 'var(--text-primary)' }}>
                                  {wcaAvg !== null ? formatTime(wcaAvg) : '—'}
                                </div>
                                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 13 }}>
                                  {trainingAo5 !== null ? (
                                    <span style={{ color: avgDelta !== null && avgDelta > 0 ? 'var(--positive)' : 'var(--text-primary)' }}>
                                      {formatTime(trainingAo5)}
                                      {avgDelta !== null && avgDelta > 0 && (
                                        <span style={{ fontSize: 10, marginLeft: 4, color: 'var(--positive)' }}>
                                          -{formatTime(avgDelta)}
                                        </span>
                                      )}
                                    </span>
                                  ) : '—'}
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </>
                    )
                  })()
                )}
              </div>
            )}

            {/* ── COMPARE ── */}
            {tab === 'compare' && (
              <div style={{ maxWidth: 860, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 20 }}>
                {pastSessions.length === 0 ? (
                  <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: 13, padding: '60px 0' }}>
                    No past sessions found for this event. Complete a session and start a new one to compare.
                  </div>
                ) : (
                  <>
                    <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                      Pick a past session to compare against the current one.
                    </div>
                    {/* Session picker */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                      {pastSessions.map(s => (
                        <button
                          key={s.id}
                          onClick={() => setCompareId(s.id)}
                          style={{
                            padding: '7px 14px', borderRadius: 8,
                            border: `1px solid ${compareId === s.id ? 'var(--accent)' : 'var(--border)'}`,
                            background: compareId === s.id ? 'var(--accent-dim)' : 'var(--surface-1)',
                            color: compareId === s.id ? 'var(--accent)' : 'var(--text-primary)',
                            fontSize: 12, fontWeight: 500, cursor: 'pointer', transition: 'all 120ms',
                          }}
                        >
                          {s.date} · {s.count} solves
                        </button>
                      ))}
                    </div>

                    {/* Side-by-side */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                      {[
                        { label: 'Current session', session: { count: solves.length, best: stats?.best ?? null, mean: stats?.mean ?? null, ao5: stats?.ao5 ?? null, ao12: stats?.ao12 ?? null } },
                        { label: compareSession ? `${compareSession.date}` : 'Select a session', session: compareSession },
                      ].map(({ label, session }) => (
                        <div key={label} style={{ backgroundColor: 'var(--surface-1)', border: '1px solid var(--border)', borderRadius: 12, padding: 20 }}>
                          <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 16 }}>{label}</div>
                          {session ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                              {[
                                { l: 'Solves', v: session.count.toString() },
                                { l: 'Best', v: session.best !== null ? formatTime(session.best) : '—' },
                                { l: 'Mean', v: session.mean !== null ? formatTime(session.mean) : '—' },
                                { l: 'Ao5', v: session.ao5 !== null && session.ao5 !== undefined ? formatTime(session.ao5) : '—' },
                                { l: 'Ao12', v: session.ao12 !== null && session.ao12 !== undefined ? formatTime(session.ao12) : '—' },
                              ].map(({ l, v }) => (
                                <div key={l} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                  <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{l}</span>
                                  <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>{v}</span>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>—</div>
                          )}
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}

            {/* ── GOALS ── */}
            {tab === 'goals' && (
              <div style={{ maxWidth: 560, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 20 }}>
                {times.length < 20 ? (
                  <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: 13, padding: '60px 0' }}>
                    Predictions need at least 20 solves in this session. You have {times.length}.
                  </div>
                ) : (
                  <>
                    <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                      Enter a target time and we'll predict how many more solves at your current trend.
                    </div>
                    <div>
                      <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', display: 'block', marginBottom: 6 }}>
                        Target time (e.g. 12.00 or 1:02.50)
                      </label>
                      <input
                        value={goalInput}
                        onChange={e => setGoalInput(e.target.value)}
                        placeholder="12.00"
                        style={{
                          width: '100%', padding: '10px 14px', borderRadius: 8,
                          border: `1px solid ${goalMs !== null ? 'var(--accent)' : 'var(--border)'}`,
                          background: 'var(--surface-1)', color: 'var(--text-primary)',
                          fontFamily: "'JetBrains Mono', monospace", fontSize: 16, fontWeight: 600,
                          outline: 'none', boxSizing: 'border-box',
                        }}
                      />
                    </div>

                    {goalInput && goalMs === null && (
                      <div style={{ color: 'var(--penalty)', fontSize: 12 }}>Invalid format. Use 12.34 or 1:23.45</div>
                    )}

                    {goalMs !== null && (
                      <div style={{ backgroundColor: 'var(--surface-1)', border: '1px solid var(--border)', borderRadius: 12, padding: 24, textAlign: 'center' }}>
                        {prediction === 'already_there' ? (
                          <>
                            <div style={{ fontSize: 32, marginBottom: 8 }}>🎯</div>
                            <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--positive)' }}>You're already there!</div>
                            <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 6 }}>Your current pace is at or below {formatTime(goalMs)}.</div>
                          </>
                        ) : prediction === null ? (
                          <>
                            <div style={{ fontSize: 32, marginBottom: 8 }}>📊</div>
                            <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)' }}>No clear downward trend yet</div>
                            <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 6 }}>
                              {!reg || reg.m >= 0
                                ? "Your times aren't improving in this session — keep going."
                                : "At current rate, this target is very far out. Focus on consistency first."}
                            </div>
                          </>
                        ) : (
                          <>
                            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 48, fontWeight: 800, color: 'var(--accent)', lineHeight: 1 }}>~{prediction}</div>
                            <div style={{ fontSize: 14, color: 'var(--text-muted)', marginTop: 8 }}>more solves to reach {formatTime(goalMs)}</div>
                            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 12, opacity: 0.6 }}>
                              Based on linear regression of your current session trend
                            </div>
                          </>
                        )}
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
