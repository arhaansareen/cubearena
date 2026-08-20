import { useState, useMemo, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { useAuth } from '@/providers/AuthProvider'
import { useSolveHistory } from '@/hooks/useSolveHistory'
import { formatTime } from '@/lib/utils'
import type { Solve, WCAEvent } from '@/types'

const EVENT_LABELS: Record<string, string> = {
  '333': '3×3', '222': '2×2', '444': '4×4', '555': '5×5',
  '666': '6×6', '777': '7×7', '333bf': '3×3 BLD', '333oh': '3×3 OH',
  '333fm': 'FMC', clock: 'Clock', minx: 'Megaminx', pyram: 'Pyraminx',
  skewb: 'Skewb', sq1: 'Square-1', '444bf': '4×4 BLD', '555bf': '5×5 BLD',
}

const STOP_WORDS = new Set([
  'i', 'a', 'an', 'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
  'of', 'with', 'my', 'was', 'is', 'it', 'this', 'that', 'so', 'got', 'get',
  'too', 'up', 'out', 'be', 'had', 'have', 'not', 'no', 'do', 'did', 'just',
  'really', 'very', 'good', 'bad', 'ok', 'okay', 'then', 'like',
])

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s'-]/g, ' ')
    .split(/\s+/)
    .map((w) => w.replace(/^[-']+|[-']+$/g, ''))
    .filter((w) => w.length >= 2 && !STOP_WORDS.has(w))
}

function formatDate(ts: number): string {
  return new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function formatDateShort(ts: number): string {
  return new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function exportCSV(solves: Solve[]) {
  const header = 'No,Date,Event,Time,Penalty,Effective,Scramble,Notes,Tags'
  const rows = [...solves].reverse().map((s, i) => {
    const effective = isFinite(s.effectiveTime) ? (s.effectiveTime / 1000).toFixed(3) : 'DNF'
    const scramble = `"${s.scramble.replace(/"/g, '""')}"`
    const notes = `"${(s.notes ?? '').replace(/"/g, '""')}"`
    const tags = `"${s.tags.join(', ')}"`
    return [
      i + 1, formatDate(s.timestamp),
      EVENT_LABELS[s.event] ?? s.event,
      (s.time / 1000).toFixed(3), s.penalty ?? 'OK', effective,
      scramble, notes, tags,
    ].join(',')
  })
  const blob = new Blob([[header, ...rows].join('\n')], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url; a.download = `cubearena-solves-${Date.now()}.csv`; a.click()
  URL.revokeObjectURL(url)
}

function PenaltyBadge({ penalty }: { penalty: Solve['penalty'] }) {
  if (!penalty) return null
  return (
    <span style={{
      fontSize: 10, fontWeight: 700, padding: '2px 5px', borderRadius: 4,
      backgroundColor: penalty === 'DNF' ? 'rgba(239,68,68,0.15)' : 'rgba(245,158,11,0.15)',
      color: penalty === 'DNF' ? 'var(--penalty)' : 'var(--inspection)',
      fontFamily: "'JetBrains Mono', monospace", marginLeft: 5,
    }}>
      {penalty}
    </span>
  )
}

// ─── Solve row with expand ────────────────────────────────────────────────────
function SolveRow({ solve, index, total }: { solve: Solve; index: number; total: number }) {
  const [open, setOpen] = useState(false)
  const hasNote = !!solve.notes?.trim()
  const hasTags = solve.tags && solve.tags.length > 0

  return (
    <>
      <div
        className="solve-row-grid"
        onClick={() => setOpen((p) => !p)}
        style={{
          display: 'grid',
          gridTemplateColumns: '40px 88px 72px 104px 1fr 20px',
          padding: '9px 16px',
          borderBottom: open ? 'none' : '1px solid var(--border)',
          alignItems: 'center',
          fontSize: 13,
          cursor: 'pointer',
          transition: 'background-color 100ms ease',
          backgroundColor: open ? 'var(--surface-1)' : 'transparent',
          userSelect: 'none',
        }}
        onMouseEnter={(e) => { if (!open) e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.03)' }}
        onMouseLeave={(e) => { if (!open) e.currentTarget.style.backgroundColor = 'transparent' }}
      >
        <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>{total - index}</span>
        <span className="history-col-date" style={{ color: 'var(--text-muted)', fontSize: 12 }}>{formatDateShort(solve.timestamp)}</span>
        <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--accent)', fontFamily: "'JetBrains Mono', monospace" }}>
          {EVENT_LABELS[solve.event] ?? solve.event}
        </span>
        <span style={{
          fontFamily: "'JetBrains Mono', monospace", fontWeight: 600,
          color: solve.penalty === 'DNF' ? 'var(--penalty)' : solve.penalty === '+2' ? 'var(--inspection)' : 'var(--text-primary)',
          display: 'flex', alignItems: 'center',
        }}>
          {formatTime(solve.effectiveTime)}
          <PenaltyBadge penalty={solve.penalty} />
        </span>
        <span style={{ color: 'var(--text-muted)', fontSize: 12, fontFamily: "'JetBrains Mono', monospace", overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {solve.scramble}
        </span>
        <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {hasNote || hasTags ? (
            <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: 'var(--accent)', display: 'block', opacity: 0.8 }} />
          ) : (
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none" style={{ color: 'var(--text-muted)', opacity: 0.4, transition: 'opacity 100ms' }}>
              <path d={open ? 'M2 7l3-3 3 3' : 'M2 3l3 3 3-3'} stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
        </span>
      </div>

      {hasTags && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, padding: '0 16px 7px 56px', borderBottom: open ? 'none' : '1px solid var(--border)' }}>
          {solve.tags.map(tag => (
            <span key={tag} style={{
              padding: '1px 8px', borderRadius: 999, fontSize: 10, fontWeight: 500,
              border: '1px solid var(--accent)', backgroundColor: 'var(--accent-dim)', color: 'var(--accent)',
            }}>
              {tag}
            </span>
          ))}
        </div>
      )}

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.18, ease: 'easeInOut' }}
            style={{ overflow: 'hidden', borderBottom: '1px solid var(--border)', backgroundColor: 'var(--surface-1)' }}
          >
            <div style={{ padding: '12px 16px 16px 56px', display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div>
                <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 5 }}>Scramble</div>
                <div style={{ fontSize: 13, fontFamily: "'JetBrains Mono', monospace", color: 'var(--text-primary)', lineHeight: 1.6, wordBreak: 'break-word' }}>
                  {solve.scramble}
                </div>
              </div>
              {hasNote && (
                <div>
                  <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 5 }}>Note</div>
                  <div style={{
                    fontSize: 13, color: 'var(--text-primary)', lineHeight: 1.6,
                    backgroundColor: 'rgba(34,211,238,0.06)', borderRadius: 6,
                    padding: '8px 12px', borderLeft: '2px solid var(--accent)',
                  }}>
                    {solve.notes}
                  </div>
                </div>
              )}
              {!hasNote && <div style={{ fontSize: 12, color: 'var(--text-muted)', fontStyle: 'italic' }}>No note for this solve.</div>}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

// ─── Notes & Insights tab ─────────────────────────────────────────────────────
function NotesInsights({ solves }: { solves: Solve[] }) {
  const withNotes = useMemo(() => solves.filter((s) => s.notes?.trim()), [solves])

  const overallMean = useMemo(() => {
    const finite = solves.filter((s) => isFinite(s.effectiveTime))
    return finite.length ? finite.reduce((a, b) => a + b.effectiveTime, 0) / finite.length : null
  }, [solves])

  // Keyword → solves that mention it
  const keywordStats = useMemo(() => {
    const map = new Map<string, Solve[]>()
    for (const s of withNotes) {
      const words = tokenize(s.notes ?? '')
      const seen = new Set<string>()
      for (const w of words) {
        if (seen.has(w)) continue
        seen.add(w)
        if (!map.has(w)) map.set(w, [])
        map.get(w)!.push(s)
      }
    }
    return Array.from(map.entries())
      .filter(([, ss]) => ss.length >= 2)
      .map(([word, ss]) => {
        const finite = ss.filter((s) => isFinite(s.effectiveTime))
        const avg = finite.length ? finite.reduce((a, b) => a + b.effectiveTime, 0) / finite.length : null
        const delta = avg !== null && overallMean !== null ? avg - overallMean : null
        return { word, count: ss.length, avg, delta }
      })
      .sort((a, b) => b.count - a.count)
      .slice(0, 20)
  }, [withNotes, overallMean])

  if (withNotes.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '72px 32px', color: 'var(--text-muted)', fontSize: 14 }}>
        No notes yet. Add notes during or after solves to see patterns here.
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
        {[
          { label: 'Notes written', value: withNotes.length.toString() },
          { label: 'Solves with notes', value: `${Math.round(withNotes.length / Math.max(solves.length, 1) * 100)}%` },
          { label: 'Unique keywords', value: keywordStats.length.toString() },
        ].map(({ label, value }) => (
          <div key={label} style={{
            backgroundColor: 'var(--surface-0)', border: '1px solid var(--border)',
            borderRadius: 10, padding: '14px 16px',
          }}>
            <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 4 }}>{label}</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-primary)', fontFamily: "'JetBrains Mono', monospace", letterSpacing: '-0.03em' }}>{value}</div>
          </div>
        ))}
      </div>

      {/* Keyword breakdown */}
      {keywordStats.length > 0 && (
        <div style={{ backgroundColor: 'var(--surface-0)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px 12px', borderBottom: '1px solid var(--border)' }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>Keyword patterns</span>
            <span style={{ fontSize: 11, color: 'var(--text-muted)', marginLeft: 8 }}>
              how your avg changes when you mention a word
            </span>
          </div>
          <div>
            {keywordStats.map(({ word, count, avg, delta }) => {
              const faster = delta !== null && delta < 0
              const slower = delta !== null && delta > 0
              const absDelta = delta !== null ? Math.abs(delta) : 0
              // bar width: proportion of max count
              const maxCount = keywordStats[0]?.count ?? 1
              const barPct = (count / maxCount) * 100

              return (
                <div key={word} style={{
                  display: 'grid', gridTemplateColumns: '120px 1fr 90px 110px',
                  alignItems: 'center', gap: 12,
                  padding: '10px 20px', borderBottom: '1px solid var(--border)',
                }}>
                  {/* Keyword */}
                  <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
                    {word}
                    <span style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 400, marginLeft: 5 }}>×{count}</span>
                  </span>

                  {/* Frequency bar */}
                  <div style={{ height: 4, backgroundColor: 'var(--surface-1)', borderRadius: 2, overflow: 'hidden' }}>
                    <div style={{ width: `${barPct}%`, height: '100%', backgroundColor: 'var(--accent)', borderRadius: 2, opacity: 0.6 }} />
                  </div>

                  {/* Avg time when mentioned */}
                  <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', textAlign: 'right' }}>
                    {avg !== null ? formatTime(avg) : '—'}
                  </span>

                  {/* Delta vs overall avg */}
                  <span style={{
                    fontSize: 12, fontWeight: 600, fontFamily: "'JetBrains Mono', monospace",
                    color: faster ? 'var(--positive)' : slower ? 'var(--penalty)' : 'var(--text-muted)',
                    textAlign: 'right',
                  }}>
                    {delta === null || absDelta < 50 ? 'no change' : `${faster ? '−' : '+'}${formatTime(absDelta)} ${faster ? 'faster' : 'slower'}`}
                  </span>
                </div>
              )
            })}
          </div>
          <div style={{ padding: '10px 20px', fontSize: 11, color: 'var(--text-muted)' }}>
            Compared against your overall mean of {overallMean !== null ? formatTime(overallMean) : '—'}. Keywords that appear in ≥2 solves shown.
          </div>
        </div>
      )}

      {/* Notes feed */}
      <div style={{ backgroundColor: 'var(--surface-0)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px 12px', borderBottom: '1px solid var(--border)' }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>All notes</span>
          <span style={{ fontSize: 11, color: 'var(--text-muted)', marginLeft: 8 }}>most recent first</span>
        </div>
        <div style={{ overflowY: 'auto', maxHeight: 480 }}>
          {withNotes.map((s) => (
            <div key={s.id} style={{
              padding: '14px 20px', borderBottom: '1px solid var(--border)',
              display: 'flex', flexDirection: 'column', gap: 6,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 15, fontWeight: 700, color: isFinite(s.effectiveTime) ? 'var(--text-primary)' : 'var(--penalty)' }}>
                  {formatTime(s.effectiveTime)}
                </span>
                {s.penalty && <PenaltyBadge penalty={s.penalty} />}
                <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--accent)', fontFamily: "'JetBrains Mono', monospace" }}>
                  {EVENT_LABELS[s.event] ?? s.event}
                </span>
                <span style={{ fontSize: 11, color: 'var(--text-muted)', marginLeft: 'auto' }}>{formatDate(s.timestamp)}</span>
              </div>
              <div style={{
                fontSize: 13, color: 'var(--text-primary)', lineHeight: 1.6,
                backgroundColor: 'rgba(34,211,238,0.06)', borderRadius: 6,
                padding: '8px 12px', borderLeft: '2px solid var(--accent)',
              }}>
                {s.notes}
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: "'JetBrains Mono', monospace", lineHeight: 1.5 }}>
                {s.scramble}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Stats helpers ────────────────────────────────────────────────────────────
function computeAo(window: Solve[], n: number): number | null {
  if (window.length < n) return null
  const slice = window.slice(0, n)
  const dnfCount = slice.filter((s) => s.penalty === 'DNF').length
  if (dnfCount > 1) return Infinity
  const times = slice
    .map((s) => (isFinite(s.effectiveTime) ? s.effectiveTime : Infinity))
    .sort((a, b) => a - b)
  const trimmed = times.slice(1, n - 1)
  return trimmed.reduce((a, b) => a + b, 0) / trimmed.length
}

// ─── Stats tab ────────────────────────────────────────────────────────────────
function StatsTab({ solves }: { solves: Solve[] }) {
  const [eventFilter, setEventFilter] = useState<string>('all')
  const [sessionFilter, setSessionFilter] = useState<string>('all')

  const events = useMemo(() => [...new Set(solves.map((s) => s.event))], [solves])

  // Sessions sorted by their earliest solve timestamp
  const sessions = useMemo(() => {
    const map = new Map<string, number>()
    for (const s of solves) {
      const t = map.get(s.sessionId)
      if (t === undefined || s.timestamp < t) map.set(s.sessionId, s.timestamp)
    }
    return [...map.entries()].sort((a, b) => a[1] - b[1]).map(([id]) => id)
  }, [solves])

  const filtered = useMemo(() => {
    let list = solves
    if (eventFilter !== 'all') list = list.filter((s) => s.event === eventFilter)
    if (sessionFilter !== 'all') list = list.filter((s) => s.sessionId === sessionFilter)
    return list
  }, [solves, eventFilter, sessionFilter])

  // Chronological (oldest first) for chart and rolling-average windows
  const chrono = useMemo(() => [...filtered].reverse(), [filtered])

  const finite = useMemo(() => filtered.filter((s) => isFinite(s.effectiveTime)), [filtered])

  const bestSingle = useMemo(() => {
    const valid = finite.filter((s) => s.penalty !== 'DNF')
    return valid.length ? Math.min(...valid.map((s) => s.effectiveTime)) : null
  }, [finite])

  const mean = useMemo(
    () => (finite.length ? finite.reduce((a, b) => a + b.effectiveTime, 0) / finite.length : null),
    [finite],
  )

  const consistency = useMemo(() => {
    if (finite.length < 2 || mean === null) return null
    const variance =
      finite.reduce((acc, s) => acc + Math.pow(s.effectiveTime - mean, 2), 0) / finite.length
    return (Math.sqrt(variance) / mean) * 100
  }, [finite, mean])

  const dnfRate = useMemo(() => {
    if (filtered.length === 0) return null
    return (filtered.filter((s) => s.penalty === 'DNF').length / filtered.length) * 100
  }, [filtered])

  const penaltyCounts = useMemo(
    () => ({
      ok: filtered.filter((s) => !s.penalty).length,
      plusTwo: filtered.filter((s) => s.penalty === '+2').length,
      dnf: filtered.filter((s) => s.penalty === 'DNF').length,
    }),
    [filtered],
  )

  // Rolling averages: current = most recent n; best = sliding window
  const aoStats = useMemo(() => {
    const calc = (n: number) => {
      if (filtered.length < n) return { current: null as number | null, best: null as number | null }
      const current = computeAo(filtered, n)
      let best: number | null = null
      for (let i = 0; i <= filtered.length - n; i++) {
        const ao = computeAo(filtered.slice(i, i + n), n)
        if (ao !== null && isFinite(ao) && (best === null || ao < best)) best = ao
      }
      return { current, best }
    }
    return { ao5: calc(5), ao12: calc(12), ao50: calc(50), ao100: calc(100) }
  }, [filtered])

  // Chart: rolling Ao5 + Ao12 over chronological solves
  const chartData = useMemo(
    () =>
      chrono.map((s, i) => {
        const w5 = chrono.slice(Math.max(0, i - 4), i + 1).reverse()
        const w12 = chrono.slice(Math.max(0, i - 11), i + 1).reverse()
        const ao5 = i >= 4 ? computeAo(w5, 5) : null
        const ao12 = i >= 11 ? computeAo(w12, 12) : null
        return {
          index: i + 1,
          time: isFinite(s.effectiveTime) ? +(s.effectiveTime / 1000).toFixed(3) : null,
          ao5: ao5 !== null && isFinite(ao5) ? +(ao5 / 1000).toFixed(3) : null,
          ao12: ao12 !== null && isFinite(ao12) ? +(ao12 / 1000).toFixed(3) : null,
        }
      }),
    [chrono],
  )

  // Per-session breakdown (always unfiltered by session, to show all sessions)
  const sessionBreakdown = useMemo(() => {
    const base = eventFilter !== 'all' ? solves.filter((s) => s.event === eventFilter) : solves
    const map = new Map<string, Solve[]>()
    for (const s of base) {
      const arr = map.get(s.sessionId) ?? []
      arr.push(s)
      map.set(s.sessionId, arr)
    }
    return sessions
      .filter((sid) => map.has(sid))
      .map((sid, i) => {
        const ss = map.get(sid)!
        const v = ss.filter((s) => isFinite(s.effectiveTime))
        const best = v.length ? Math.min(...v.map((s) => s.effectiveTime)) : null
        const avg = v.length ? v.reduce((a, b) => a + b.effectiveTime, 0) / v.length : null
        return { label: `Session ${i + 1}`, sid, count: ss.length, best, avg, dnfs: ss.filter((s) => s.penalty === 'DNF').length }
      })
  }, [solves, sessions, eventFilter])

  // Per-event breakdown (always over all solves)
  const eventStats = useMemo(() => {
    const map = new Map<string, { best: number; count: number; total: number }>()
    for (const s of solves) {
      if (!isFinite(s.effectiveTime)) continue
      const ex = map.get(s.event)
      if (!ex) map.set(s.event, { best: s.effectiveTime, count: 1, total: s.effectiveTime })
      else { ex.best = Math.min(ex.best, s.effectiveTime); ex.count++; ex.total += s.effectiveTime }
    }
    return [...map.entries()]
      .map(([event, d]) => ({ event, best: d.best, count: d.count, avg: d.total / d.count }))
      .sort((a, b) => b.count - a.count)
  }, [solves])

  const formatAo = (v: number | null) => {
    if (v === null) return '—'
    return isFinite(v) ? formatTime(v) : 'DNF'
  }

  const sectionHeader = (label: string) => (
    <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)' }}>
      <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
        {label}
      </span>
    </div>
  )

  const tableHeader = (cols: string[], template: string) => (
    <div style={{ display: 'grid', gridTemplateColumns: template, gap: 16, padding: '7px 16px', borderBottom: '1px solid var(--border)', fontSize: 10, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
      {cols.map((c) => <span key={c}>{c}</span>)}
    </div>
  )

  if (solves.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '72px 32px', color: 'var(--text-muted)', fontSize: 14 }}>
        No solves to analyse. Complete some solves to see stats here.
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* Filters */}
      {(events.length > 1 || sessions.length > 1) && (
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          {events.length > 1 && (
            <select
              value={eventFilter}
              onChange={(e) => setEventFilter(e.target.value)}
              style={{ backgroundColor: 'var(--surface-0)', border: '1px solid var(--border)', borderRadius: 8, padding: '6px 10px', fontSize: 13, color: 'var(--text-primary)', cursor: 'pointer', outline: 'none' }}
            >
              <option value="all">All events</option>
              {events.map((ev) => <option key={ev} value={ev}>{EVENT_LABELS[ev] ?? ev}</option>)}
            </select>
          )}
          {sessions.length > 1 && (
            <select
              value={sessionFilter}
              onChange={(e) => setSessionFilter(e.target.value)}
              style={{ backgroundColor: 'var(--surface-0)', border: '1px solid var(--border)', borderRadius: 8, padding: '6px 10px', fontSize: 13, color: 'var(--text-primary)', cursor: 'pointer', outline: 'none' }}
            >
              <option value="all">All sessions</option>
              {sessions.map((sid, i) => <option key={sid} value={sid}>Session {i + 1}</option>)}
            </select>
          )}
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            {filtered.length} solve{filtered.length !== 1 ? 's' : ''}
          </span>
        </div>
      )}

      {filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px 32px', color: 'var(--text-muted)', fontSize: 14 }}>
          No solves match this filter.
        </div>
      ) : (
        <>
          {/* Summary cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
            {[
              { label: 'Best Single', value: bestSingle !== null ? formatTime(bestSingle) : '—' },
              { label: 'Mean', value: mean !== null ? formatTime(mean) : '—' },
              { label: 'Consistency', value: consistency !== null ? `${consistency.toFixed(1)}%` : '—', sub: 'lower = better' },
            ].map(({ label, value, sub }) => (
              <div key={label} style={{ backgroundColor: 'var(--surface-0)', border: '1px solid var(--border)', borderRadius: 10, padding: '14px 16px' }}>
                <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 4 }}>{label}</div>
                <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-primary)', fontFamily: "'JetBrains Mono', monospace", letterSpacing: '-0.03em' }}>{value}</div>
                {sub && <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 3 }}>{sub}</div>}
              </div>
            ))}
          </div>

          {/* Rolling averages */}
          <div style={{ backgroundColor: 'var(--surface-0)', border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden' }}>
            {sectionHeader('Rolling averages')}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)' }}>
              {([['Ao5', aoStats.ao5], ['Ao12', aoStats.ao12], ['Ao50', aoStats.ao50], ['Ao100', aoStats.ao100]] as [string, { current: number | null; best: number | null }][]).map(([label, stat], i, arr) => (
                <div key={label} style={{ padding: '14px 16px', borderRight: i < arr.length - 1 ? '1px solid var(--border)' : 'none' }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--accent)', marginBottom: 10, fontFamily: "'JetBrains Mono', monospace" }}>{label}</div>
                  <div style={{ marginBottom: 8 }}>
                    <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 2 }}>Current</div>
                    <div style={{ fontSize: 16, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace", color: 'var(--text-primary)' }}>{formatAo(stat.current)}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 2 }}>Best</div>
                    <div style={{ fontSize: 16, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace", color: 'var(--positive)' }}>{formatAo(stat.best)}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Time trend chart */}
          {chartData.length >= 5 && (
            <div style={{ backgroundColor: 'var(--surface-0)', border: '1px solid var(--border)', borderRadius: 10, padding: '16px' }}>
              {sectionHeader('Time trend')}
              <div style={{ display: 'flex', gap: 16, margin: '12px 0 8px' }}>
                {[
                  { color: 'rgba(34,211,238,0.35)', label: 'Single' },
                  { color: '#22D3EE', label: 'Ao5' },
                  { color: '#a78bfa', label: 'Ao12' },
                ].map(({ color, label }) => (
                  <span key={label} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: 'var(--text-muted)' }}>
                    <span style={{ width: 16, height: 2, backgroundColor: color, display: 'inline-block', borderRadius: 1 }} />
                    {label}
                  </span>
                ))}
              </div>
              <ResponsiveContainer width="100%" height={160}>
                <LineChart data={chartData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="index" tick={{ fontSize: 10, fill: 'var(--text-muted)' }} tickLine={false} axisLine={false} />
                  <YAxis tickFormatter={(v: number) => `${v.toFixed(0)}s`} tick={{ fontSize: 10, fill: 'var(--text-muted)' }} tickLine={false} axisLine={false} width={34} />
                  <Tooltip
                    contentStyle={{ backgroundColor: 'var(--surface-1)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }}
                    labelStyle={{ color: 'var(--text-muted)', marginBottom: 4 }}
                    labelFormatter={(v) => `Solve #${v}`}
                    formatter={(v: unknown, name: unknown) => [typeof v === 'number' ? `${v.toFixed(3)}s` : '—', name === 'time' ? 'Single' : name === 'ao5' ? 'Ao5' : 'Ao12']}
                  />
                  <Line dataKey="time" stroke="rgba(34,211,238,0.35)" dot={false} strokeWidth={1} connectNulls={false} name="time" />
                  <Line dataKey="ao5" stroke="#22D3EE" dot={false} strokeWidth={1.5} connectNulls name="ao5" />
                  <Line dataKey="ao12" stroke="#a78bfa" dot={false} strokeWidth={1.5} connectNulls name="ao12" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Penalty breakdown */}
          <div style={{ backgroundColor: 'var(--surface-0)', border: '1px solid var(--border)', borderRadius: 10, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>Penalties</span>
            {[
              { label: 'OK', value: penaltyCounts.ok, color: 'var(--positive)' },
              { label: '+2', value: penaltyCounts.plusTwo, color: 'var(--inspection)' },
              { label: 'DNF', value: penaltyCounts.dnf, color: 'var(--penalty)', extra: dnfRate !== null && penaltyCounts.dnf > 0 ? ` (${dnfRate.toFixed(1)}%)` : '' },
            ].map(({ label, value, color, extra }) => (
              <span key={label} style={{ fontSize: 13 }}>
                <span style={{ color: 'var(--text-muted)' }}>{label}: </span>
                <span style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, color }}>{value}</span>
                {extra && <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{extra}</span>}
              </span>
            ))}
          </div>

          {/* Session breakdown */}
          {sessionBreakdown.length > 1 && (
            <div style={{ backgroundColor: 'var(--surface-0)', border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden' }}>
              {sectionHeader('Sessions')}
              {tableHeader(['Session', 'Solves', 'Best', 'Mean', 'DNFs'], '1fr 48px 90px 90px 48px')}
              {sessionBreakdown.map(({ label, sid, count, best, avg, dnfs }) => (
                <div
                  key={sid}
                  onClick={() => setSessionFilter(sessionFilter === sid ? 'all' : sid)}
                  style={{ display: 'grid', gridTemplateColumns: '1fr 48px 90px 90px 48px', alignItems: 'center', gap: 16, padding: '9px 16px', borderBottom: '1px solid var(--border)', cursor: 'pointer', backgroundColor: sessionFilter === sid ? 'rgba(34,211,238,0.05)' : 'transparent', transition: 'background 100ms' }}
                >
                  <span style={{ fontSize: 12, color: sessionFilter === sid ? 'var(--accent)' : 'var(--text-muted)' }}>{label}</span>
                  <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 13, color: 'var(--text-primary)' }}>{count}</span>
                  <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>{best !== null ? formatTime(best) : '—'}</span>
                  <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 13, color: 'var(--text-muted)' }}>{avg !== null ? formatTime(avg) : '—'}</span>
                  <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: dnfs > 0 ? 'var(--penalty)' : 'var(--text-muted)' }}>{dnfs}</span>
                </div>
              ))}
            </div>
          )}

          {/* Per-event breakdown */}
          {eventStats.length > 1 && (
            <div style={{ backgroundColor: 'var(--surface-0)', border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden' }}>
              {sectionHeader('By event')}
              {tableHeader(['Event', 'Solves', 'Best', 'Mean'], '1fr 60px 90px 90px')}
              {eventStats.map(({ event, best, count, avg }) => (
                <div
                  key={event}
                  onClick={() => setEventFilter(eventFilter === event ? 'all' : event)}
                  style={{ display: 'grid', gridTemplateColumns: '1fr 60px 90px 90px', alignItems: 'center', gap: 16, padding: '9px 16px', borderBottom: '1px solid var(--border)', cursor: 'pointer', backgroundColor: eventFilter === event ? 'rgba(34,211,238,0.05)' : 'transparent', transition: 'background 100ms' }}
                >
                  <span style={{ fontSize: 13, fontWeight: 600, color: eventFilter === event ? 'var(--accent)' : 'var(--text-primary)', fontFamily: "'JetBrains Mono', monospace" }}>{EVENT_LABELS[event] ?? event}</span>
                  <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 13, color: 'var(--text-muted)' }}>{count}</span>
                  <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>{formatTime(best)}</span>
                  <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 13, color: 'var(--text-muted)' }}>{formatTime(avg)}</span>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}

// ─── Toast notification ───────────────────────────────────────────────────────
function Toast({ message, onDone }: { message: string; onDone: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.2 }}
      style={{
        position: 'fixed', top: 80, right: 24, zIndex: 9999,
        backgroundColor: 'var(--positive)', color: '#fff',
        padding: '10px 16px', borderRadius: 8,
        fontSize: 13, fontWeight: 600,
        boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
        cursor: 'pointer',
        fontFamily: "'Plus Jakarta Sans', sans-serif",
      }}
      onClick={onDone}
    >
      {message}
    </motion.div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────
export function HistoryPage() {
  const { user } = useAuth()
  const { solves, loading, isConfigured, persistSolve } = useSolveHistory(user?.uid)
  const [searchQuery, setSearchQuery] = useState('')
  const [tab, setTab] = useState<'solves' | 'notes' | 'stats'>('solves')
  const [notesOnly, setNotesOnly] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const showToast = useCallback((msg: string) => {
    setToast(msg)
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current)
    toastTimerRef.current = setTimeout(() => setToast(null), 3000)
  }, [])

  const filteredSolves = useMemo(() => {
    let list = solves
    if (notesOnly) list = list.filter((s) => s.notes?.trim())
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      list = list.filter((s) =>
        (EVENT_LABELS[s.event] ?? s.event).toLowerCase().includes(q) ||
        s.scramble.toLowerCase().includes(q) ||
        (s.notes ?? '').toLowerCase().includes(q)
      )
    }
    return list
  }, [solves, searchQuery, notesOnly])

  const notesCount = useMemo(() => solves.filter((s) => s.notes?.trim()).length, [solves])

  const bestTime = useMemo(() => {
    const valid = filteredSolves.filter((s) => s.penalty !== 'DNF' && isFinite(s.effectiveTime))
    return valid.length ? Math.min(...valid.map((s) => s.effectiveTime)) : null
  }, [filteredSolves])

  const sessionMean = useMemo(() => {
    const finite = filteredSolves.filter((s) => isFinite(s.effectiveTime))
    return finite.length ? finite.reduce((a, b) => a + b.effectiveTime, 0) / finite.length : null
  }, [filteredSolves])

  const handleImportFile = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    // Reset so same file can be re-imported if needed
    e.target.value = ''

    if (!isConfigured) {
      showToast('Import requires cloud sync to be configured.')
      return
    }

    let json: Record<string, unknown>
    try {
      const text = await file.text()
      json = JSON.parse(text) as Record<string, unknown>
    } catch {
      showToast('Failed to parse cstimer JSON.')
      return
    }

    const sessionKeys = Object.keys(json).filter((k) => /^session\d+/.test(k))
    if (sessionKeys.length === 0) {
      showToast('No sessions found in cstimer file.')
      return
    }

    const newSolves: Solve[] = []
    for (const key of sessionKeys) {
      const sessionData = json[key]
      if (!Array.isArray(sessionData)) continue
      for (const entry of sessionData) {
        if (!Array.isArray(entry) || entry.length < 2) continue
        const [[penaltyRaw, timeMs], scrambleRaw, commentRaw, epochSecs] = entry as [[number, number], string?, string?, number?]
        const penalty: Solve['penalty'] = penaltyRaw === -1 ? 'DNF' : penaltyRaw === 2000 ? '+2' : null
        const effectiveTime = penalty === 'DNF' ? Infinity : penalty === '+2' ? timeMs + 2000 : timeMs
        const solve: Solve = {
          id: crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`,
          sessionId: key,
          event: '333' as WCAEvent,
          time: timeMs,
          penalty,
          effectiveTime,
          scramble: scrambleRaw ?? '',
          notes: commentRaw || null,
          tags: [],
          inspectionTime: 0,
          timestamp: ((epochSecs ?? Date.now() / 1000)) * 1000,
        }
        newSolves.push(solve)
      }
    }

    if (newSolves.length === 0) {
      showToast('No valid solves found in cstimer file.')
      return
    }

    // Persist all solves
    await Promise.all(newSolves.map((s) => persistSolve(s)))
    showToast(`✓ Imported ${newSolves.length} solve${newSolves.length !== 1 ? 's' : ''} from cstimer`)
  }, [isConfigured, persistSolve, showToast])

  const ghostButtonStyle: React.CSSProperties = {
    display: 'flex', alignItems: 'center', gap: 7,
    padding: '6px 14px', backgroundColor: 'transparent',
    border: '1px solid var(--border)', borderRadius: 8,
    color: 'var(--text-primary)',
    fontSize: 13, fontWeight: 500,
    cursor: 'pointer',
  }

  return (
    <div className="history-page" style={{ padding: '32px 24px', maxWidth: 920, margin: '0 auto', width: '100%' }}>
      <style>{`
        @media (max-width: 767px) {
          .history-page { padding: 12px !important; }
          .solve-row-grid { grid-template-columns: 28px 64px minmax(0,1fr) 20px !important; font-size: 12px; }
          .history-col-date { display: none !important; }
        }
      `}</style>

      {/* Toast */}
      <AnimatePresence>
        {toast && <Toast message={toast} onDone={() => setToast(null)} />}
      </AnimatePresence>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".json,.txt,text/plain"
        onChange={handleImportFile}
        style={{ position: 'absolute', opacity: 0, pointerEvents: 'none', width: 0, height: 0 }}
        tabIndex={-1}
        aria-hidden="true"
      />

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20, gap: 16, flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>History</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>
            {loading ? 'Loading…' : !isConfigured ? 'Cloud sync not configured' : solves.length === 0 ? 'No solves recorded yet' : `${solves.length} solve${solves.length !== 1 ? 's' : ''} · ${notesCount} with notes`}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button
            onClick={() => fileInputRef.current?.click()}
            style={ghostButtonStyle}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)' }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border)' }}
          >
            <svg width="15" height="15" viewBox="0 0 15 15" fill="none" aria-hidden="true">
              <path d="M7.5 10V2M5 5l2.5-2.5L10 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M2 11.5h11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            Import cstimer
          </button>
          <button
            onClick={() => exportCSV(filteredSolves)}
            disabled={filteredSolves.length === 0}
            style={{
              ...ghostButtonStyle,
              color: filteredSolves.length > 0 ? 'var(--text-primary)' : 'var(--text-muted)',
              cursor: filteredSolves.length > 0 ? 'pointer' : 'not-allowed',
              opacity: filteredSolves.length > 0 ? 1 : 0.45,
            }}
            onMouseEnter={(e) => { if (filteredSolves.length > 0) e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)' }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border)' }}
          >
            <svg width="15" height="15" viewBox="0 0 15 15" fill="none" aria-hidden="true">
              <path d="M7.5 2v7M5 7l2.5 2.5L10 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M2 11.5h11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            Export CSV
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 2, marginBottom: 16, backgroundColor: 'var(--surface-0)', border: '1px solid var(--border)', borderRadius: 8, padding: 3, width: 'fit-content' }}>
        {(['solves', 'stats', 'notes'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              padding: '5px 14px', borderRadius: 6, fontSize: 13, fontWeight: 600,
              cursor: 'pointer', border: 'none',
              backgroundColor: tab === t ? 'var(--surface-1)' : 'transparent',
              color: tab === t ? 'var(--text-primary)' : 'var(--text-muted)',
              transition: 'all 120ms ease',
            }}
          >
            {t === 'solves' ? 'Solves' : t === 'stats' ? 'Stats' : `Notes & Insights${notesCount > 0 ? ` (${notesCount})` : ''}`}
          </button>
        ))}
      </div>

      {tab === 'notes' ? (
        <NotesInsights solves={solves} />
      ) : tab === 'stats' ? (
        <StatsTab solves={solves} />
      ) : (
        <>
          {/* Controls row */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 16, alignItems: 'center' }}>
            {/* Search */}
            <div style={{ position: 'relative', flex: 1 }}>
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none"
                style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }}
                aria-hidden="true">
                <circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="1.5" />
                <path d="M11 11l3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Filter by event, scramble, or note…"
                style={{
                  width: '100%', backgroundColor: 'var(--surface-0)',
                  border: '1px solid var(--border)', borderRadius: 8,
                  padding: '9px 12px 9px 34px', color: 'var(--text-primary)',
                  fontSize: 14, outline: 'none', boxSizing: 'border-box',
                  transition: 'border-color 150ms ease',
                }}
                onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--accent)' }}
                onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--border)' }}
              />
            </div>
            {/* Notes filter chip */}
            <button
              onClick={() => setNotesOnly((p) => !p)}
              style={{
                padding: '7px 12px', borderRadius: 8, fontSize: 12, fontWeight: 600,
                cursor: 'pointer', whiteSpace: 'nowrap',
                border: `1px solid ${notesOnly ? 'var(--accent)' : 'var(--border)'}`,
                backgroundColor: notesOnly ? 'var(--accent-dim)' : 'transparent',
                color: notesOnly ? 'var(--accent)' : 'var(--text-muted)',
                transition: 'all 120ms ease',
              }}
            >
              With notes{notesCount > 0 ? ` (${notesCount})` : ''}
            </button>
          </div>

          {/* Stats bar */}
          {!loading && filteredSolves.length > 0 && (
            <div style={{
              padding: '8px 16px', backgroundColor: 'var(--surface-0)',
              border: '1px solid var(--border)', borderRadius: 8, marginBottom: 16,
              fontSize: 13, color: 'var(--text-muted)', display: 'flex', gap: 4, flexWrap: 'wrap',
            }}>
              <span>{filteredSolves.length} total</span>
              {bestTime !== null && isFinite(bestTime) && (
                <><span>·</span><span>best: <span style={{ fontFamily: "'JetBrains Mono', monospace", color: 'var(--positive)', fontWeight: 600 }}>{formatTime(bestTime)}</span></span></>
              )}
              {sessionMean !== null && (
                <><span>·</span><span>avg: <span style={{ fontFamily: "'JetBrains Mono', monospace", color: 'var(--text-primary)', fontWeight: 600 }}>{formatTime(sessionMean)}</span></span></>
              )}
            </div>
          )}

          {/* Loading skeleton */}
          {loading && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} style={{ height: 44, borderRadius: 6, backgroundColor: 'var(--surface-0)', opacity: 1 - i * 0.1 }} />
              ))}
            </div>
          )}

          {/* No-backend state */}
          {!loading && !isConfigured && (
            <div style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              padding: '72px 32px', backgroundColor: 'var(--surface-0)',
              border: '1px solid var(--border)', borderRadius: 12, textAlign: 'center', gap: 10,
            }}>
              <div style={{ width: 44, height: 44, borderRadius: 10, backgroundColor: 'var(--surface-1)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 4 }}>
                <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden="true">
                  <path d="M4 11h14M11 4c-3.5 2-5 4.5-5 7s1.5 5 5 7M11 4c3.5 2 5 4.5 5 7s-1.5 5-5 7" stroke="var(--text-muted)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  <circle cx="11" cy="11" r="8.5" stroke="var(--text-muted)" strokeWidth="1.5" />
                </svg>
              </div>
              <p style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)' }}>Cloud sync not configured</p>
              <p style={{ fontSize: 13, color: 'var(--text-muted)', maxWidth: 320 }}>
                Connect a Supabase project to see your solve history across devices. Add{' '}
                <code style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, backgroundColor: 'var(--surface-1)', padding: '1px 5px', borderRadius: 4 }}>VITE_SUPABASE_URL</code>{' '}
                and{' '}
                <code style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, backgroundColor: 'var(--surface-1)', padding: '1px 5px', borderRadius: 4 }}>VITE_SUPABASE_ANON_KEY</code>{' '}
                to your environment variables.
              </p>
            </div>
          )}

          {/* Empty state */}
          {!loading && isConfigured && solves.length === 0 && (
            <div style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              padding: '72px 32px', backgroundColor: 'var(--surface-0)',
              border: '1px solid var(--border)', borderRadius: 12, textAlign: 'center', gap: 10,
            }}>
              <div style={{ width: 44, height: 44, borderRadius: 10, backgroundColor: 'var(--surface-1)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 4 }}>
                <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden="true">
                  <path d="M11 7v4l3 3" stroke="var(--text-muted)" strokeWidth="1.5" strokeLinecap="round" />
                  <circle cx="11" cy="11" r="8.5" stroke="var(--text-muted)" strokeWidth="1.5" />
                </svg>
              </div>
              <p style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)' }}>No solves yet</p>
              <p style={{ fontSize: 13, color: 'var(--text-muted)', maxWidth: 280 }}>Start a session and your solves will appear here automatically.</p>
            </div>
          )}

          {/* Solve table grouped by session */}
          {!loading && isConfigured && filteredSolves.length > 0 && (() => {
            // Group solves by session_id, preserving order (most recent session first)
            const sessionOrder: string[] = []
            const sessionMap = new Map<string, Solve[]>()
            for (const s of filteredSolves) {
              if (!sessionMap.has(s.sessionId)) { sessionOrder.push(s.sessionId); sessionMap.set(s.sessionId, []) }
              sessionMap.get(s.sessionId)!.push(s)
            }
            return (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <AnimatePresence mode="popLayout">
                {sessionOrder.map((sid, sIdx) => {
                  const sessionSolves = sessionMap.get(sid)!
                  const firstTs = sessionSolves[sessionSolves.length - 1].timestamp
                  const lastTs = sessionSolves[0].timestamp
                  const sameDay = new Date(firstTs).toDateString() === new Date(lastTs).toDateString()
                  const label = sameDay
                    ? formatDate(firstTs)
                    : `${formatDateShort(firstTs)} – ${formatDate(lastTs)}`
                  const best = Math.min(...sessionSolves.filter(s => isFinite(s.effectiveTime)).map(s => s.effectiveTime))
                  return (
                    <motion.div
                      key={sid}
                      layout="position"
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.15 }}
                      style={{ backgroundColor: 'var(--surface-0)', border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden' }}
                    >
                      <div style={{
                        display: 'flex', alignItems: 'center', gap: 10,
                        padding: '10px 16px', borderBottom: '1px solid var(--border)',
                        backgroundColor: 'var(--surface-1)',
                      }}>
                        <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-primary)' }}>
                          Session {sessionOrder.length - sIdx}
                        </span>
                        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{label}</span>
                        <span style={{ fontSize: 11, color: 'var(--text-muted)', marginLeft: 4 }}>· {sessionSolves.length} solve{sessionSolves.length !== 1 ? 's' : ''}</span>
                        {isFinite(best) && (
                          <span style={{ fontSize: 11, color: 'var(--positive)', fontFamily: "'JetBrains Mono', monospace", fontWeight: 600, marginLeft: 'auto' }}>
                            best {formatTime(best)}
                          </span>
                        )}
                      </div>
                      <div className="solve-row-grid" style={{
                        display: 'grid', gridTemplateColumns: '40px 88px 72px 104px 1fr 20px',
                        padding: '7px 16px', borderBottom: '1px solid var(--border)',
                        fontSize: 11, fontWeight: 600, color: 'var(--text-muted)',
                        textTransform: 'uppercase', letterSpacing: '0.07em',
                      }}>
                        <span>#</span><span className="history-col-date">Date</span><span>Event</span><span>Time</span><span>Scramble</span><span />
                      </div>
                      {sessionSolves.map((solve, i) => (
                        <SolveRow key={solve.id} solve={solve} index={i} total={sessionSolves.length} />
                      ))}
                    </motion.div>
                  )
                })}
                </AnimatePresence>
              </div>
            )
          })()}

          {!loading && isConfigured && solves.length > 0 && filteredSolves.length === 0 && (
            <div style={{ textAlign: 'center', padding: '48px 32px', backgroundColor: 'var(--surface-0)', border: '1px solid var(--border)', borderRadius: 10, color: 'var(--text-muted)', fontSize: 14 }}>
              No solves match your search.
            </div>
          )}
        </>
      )}
    </div>
  )
}
