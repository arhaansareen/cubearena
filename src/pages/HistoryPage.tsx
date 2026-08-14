import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '@/providers/AuthProvider'
import { useSolveHistory } from '@/hooks/useSolveHistory'
import { formatTime } from '@/lib/utils'
import type { Solve } from '@/types'

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
        <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>{formatDateShort(solve.timestamp)}</span>
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

// ─── Main page ────────────────────────────────────────────────────────────────
export function HistoryPage() {
  const { user } = useAuth()
  const { solves, loading } = useSolveHistory(user?.uid)
  const [searchQuery, setSearchQuery] = useState('')
  const [tab, setTab] = useState<'solves' | 'notes'>('solves')
  const [notesOnly, setNotesOnly] = useState(false)

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

  return (
    <div style={{ padding: '32px 24px', maxWidth: 920, margin: '0 auto', width: '100%' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20, gap: 16, flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>History</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>
            {loading ? 'Loading…' : solves.length === 0 ? 'No solves recorded yet' : `${solves.length} solve${solves.length !== 1 ? 's' : ''} · ${notesCount} with notes`}
          </p>
        </div>
        <button
          onClick={() => exportCSV(filteredSolves)}
          disabled={filteredSolves.length === 0}
          style={{
            display: 'flex', alignItems: 'center', gap: 7,
            padding: '6px 14px', backgroundColor: 'transparent',
            border: '1px solid var(--border)', borderRadius: 8,
            color: filteredSolves.length > 0 ? 'var(--text-primary)' : 'var(--text-muted)',
            fontSize: 13, fontWeight: 500,
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

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 2, marginBottom: 16, backgroundColor: 'var(--surface-0)', border: '1px solid var(--border)', borderRadius: 8, padding: 3, width: 'fit-content' }}>
        {(['solves', 'notes'] as const).map((t) => (
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
            {t === 'solves' ? 'Solves' : `Notes & Insights${notesCount > 0 ? ` (${notesCount})` : ''}`}
          </button>
        ))}
      </div>

      {tab === 'notes' ? (
        <NotesInsights solves={solves} />
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

          {/* Empty state */}
          {!loading && solves.length === 0 && (
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
          {!loading && filteredSolves.length > 0 && (() => {
            // Group solves by session_id, preserving order (most recent session first)
            const sessionOrder: string[] = []
            const sessionMap = new Map<string, Solve[]>()
            for (const s of filteredSolves) {
              if (!sessionMap.has(s.sessionId)) { sessionOrder.push(s.sessionId); sessionMap.set(s.sessionId, []) }
              sessionMap.get(s.sessionId)!.push(s)
            }
            return (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
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
                    <div key={sid} style={{ backgroundColor: 'var(--surface-0)', border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden' }}>
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
                      <div style={{
                        display: 'grid', gridTemplateColumns: '40px 88px 72px 104px 1fr 20px',
                        padding: '7px 16px', borderBottom: '1px solid var(--border)',
                        fontSize: 11, fontWeight: 600, color: 'var(--text-muted)',
                        textTransform: 'uppercase', letterSpacing: '0.07em',
                      }}>
                        <span>#</span><span>Date</span><span>Event</span><span>Time</span><span>Scramble</span><span />
                      </div>
                      {sessionSolves.map((solve, i) => (
                        <SolveRow key={solve.id} solve={solve} index={i} total={sessionSolves.length} />
                      ))}
                    </div>
                  )
                })}
              </div>
            )
          })()}

          {!loading && solves.length > 0 && filteredSolves.length === 0 && (
            <div style={{ textAlign: 'center', padding: '48px 32px', backgroundColor: 'var(--surface-0)', border: '1px solid var(--border)', borderRadius: 10, color: 'var(--text-muted)', fontSize: 14 }}>
              No solves match your search.
            </div>
          )}
        </>
      )}
    </div>
  )
}
