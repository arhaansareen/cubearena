import { useState } from 'react'
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

function formatDate(ts: number): string {
  return new Date(ts).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  })
}

function exportCSV(solves: Solve[]) {
  const header = 'No,Date,Event,Time,Penalty,Effective,Scramble,Notes,Tags'
  const rows = [...solves].reverse().map((s, i) => {
    const effective = isFinite(s.effectiveTime) ? (s.effectiveTime / 1000).toFixed(3) : 'DNF'
    const scramble = `"${s.scramble.replace(/"/g, '""')}"`
    const notes = `"${(s.notes ?? '').replace(/"/g, '""')}"`
    const tags = `"${s.tags.join(', ')}"`
    return [
      i + 1,
      formatDate(s.timestamp),
      EVENT_LABELS[s.event] ?? s.event,
      (s.time / 1000).toFixed(3),
      s.penalty ?? 'OK',
      effective,
      scramble,
      notes,
      tags,
    ].join(',')
  })
  const csv = [header, ...rows].join('\n')
  const blob = new Blob([csv], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `cubearena-solves-${Date.now()}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

function PenaltyBadge({ penalty }: { penalty: Solve['penalty'] }) {
  if (!penalty) return null
  return (
    <span style={{
      fontSize: 10, fontWeight: 700,
      padding: '2px 5px', borderRadius: 4,
      backgroundColor: penalty === 'DNF' ? 'rgba(239,68,68,0.15)' : 'rgba(245,158,11,0.15)',
      color: penalty === 'DNF' ? 'var(--penalty)' : 'var(--inspection)',
      fontFamily: "'JetBrains Mono', monospace",
      marginLeft: 5,
    }}>
      {penalty}
    </span>
  )
}

function DownloadIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none" aria-hidden="true">
      <path d="M7.5 2v7M5 7l2.5 2.5L10 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M2 11.5h11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

export function HistoryPage() {
  const { user } = useAuth()
  const { solves, loading } = useSolveHistory(user?.uid)
  const [searchQuery, setSearchQuery] = useState('')

  const filteredSolves = searchQuery.trim()
    ? solves.filter((s) => {
        const q = searchQuery.toLowerCase()
        return (
          (EVENT_LABELS[s.event] ?? s.event).toLowerCase().includes(q) ||
          s.scramble.toLowerCase().includes(q) ||
          (s.notes ?? '').toLowerCase().includes(q)
        )
      })
    : solves

  const bestTime = filteredSolves.length > 0
    ? Math.min(...filteredSolves.filter((s) => s.penalty !== 'DNF' && isFinite(s.effectiveTime)).map((s) => s.effectiveTime))
    : null

  const sessionMean = filteredSolves.length > 0
    ? (() => {
        const finite = filteredSolves.filter((s) => isFinite(s.effectiveTime))
        return finite.length > 0 ? finite.reduce((a, b) => a + b.effectiveTime, 0) / finite.length : null
      })()
    : null

  return (
    <div style={{ padding: '32px 24px', maxWidth: 900, margin: '0 auto', width: '100%' }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
        marginBottom: 20, gap: 16, flexWrap: 'wrap',
      }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>
            History
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>
            {loading ? 'Loading…' : solves.length === 0 ? 'No solves recorded yet' : `${solves.length} solve${solves.length !== 1 ? 's' : ''}`}
          </p>
        </div>
        <button
          onClick={() => exportCSV(filteredSolves)}
          disabled={filteredSolves.length === 0}
          style={{
            display: 'flex', alignItems: 'center', gap: 7,
            padding: '6px 14px',
            backgroundColor: 'transparent',
            border: '1px solid var(--border)',
            borderRadius: 8,
            color: filteredSolves.length > 0 ? 'var(--text-primary)' : 'var(--text-muted)',
            fontSize: 13, fontWeight: 500,
            cursor: filteredSolves.length > 0 ? 'pointer' : 'not-allowed',
            opacity: filteredSolves.length > 0 ? 1 : 0.45,
            transition: 'border-color 150ms ease',
          }}
          onMouseEnter={(e) => { if (filteredSolves.length > 0) e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)' }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border)' }}
        >
          <DownloadIcon />
          Export CSV
        </button>
      </div>

      {/* Search input */}
      <div style={{ marginBottom: 16, position: 'relative' }}>
        <svg
          width="14" height="14" viewBox="0 0 16 16" fill="none"
          style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }}
          aria-hidden="true"
        >
          <circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="1.5" />
          <path d="M11 11l3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Filter by event, scramble, or notes…"
          style={{
            width: '100%',
            backgroundColor: 'var(--surface-0)',
            border: '1px solid var(--border)',
            borderRadius: 8,
            padding: '9px 12px 9px 34px',
            color: 'var(--text-primary)',
            fontSize: 14,
            outline: 'none',
            transition: 'border-color 150ms ease',
            boxSizing: 'border-box',
          }}
          onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--accent)' }}
          onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--border)' }}
        />
      </div>

      {/* Stats summary bar */}
      {!loading && filteredSolves.length > 0 && (
        <div style={{
          padding: '8px 16px',
          backgroundColor: 'var(--surface-0)',
          border: '1px solid var(--border)',
          borderRadius: 8,
          marginBottom: 16,
          fontSize: 13,
          color: 'var(--text-muted)',
          display: 'flex',
          gap: 4,
          flexWrap: 'wrap',
        }}>
          <span>{filteredSolves.length} total</span>
          {bestTime !== null && isFinite(bestTime) && (
            <>
              <span>·</span>
              <span>best: <span style={{ fontFamily: "'JetBrains Mono', monospace", color: 'var(--positive)', fontWeight: 600 }}>{formatTime(bestTime)}</span></span>
            </>
          )}
          {sessionMean !== null && (
            <>
              <span>·</span>
              <span>avg: <span style={{ fontFamily: "'JetBrains Mono', monospace", color: 'var(--text-primary)', fontWeight: 600 }}>{formatTime(sessionMean)}</span></span>
            </>
          )}
        </div>
      )}

      {/* Loading skeleton */}
      {loading && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} style={{
              height: 44, borderRadius: 6,
              backgroundColor: 'var(--surface-0)',
              opacity: 1 - i * 0.1,
            }} />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && solves.length === 0 && (
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          padding: '72px 32px',
          backgroundColor: 'var(--surface-0)',
          border: '1px solid var(--border)',
          borderRadius: 12, textAlign: 'center', gap: 10,
        }}>
          <div style={{
            width: 44, height: 44, borderRadius: 10,
            backgroundColor: 'var(--surface-1)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            marginBottom: 4,
          }}>
            <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden="true">
              <path d="M11 7v4l3 3" stroke="var(--text-muted)" strokeWidth="1.5" strokeLinecap="round" />
              <circle cx="11" cy="11" r="8.5" stroke="var(--text-muted)" strokeWidth="1.5" />
            </svg>
          </div>
          <p style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)' }}>No solves yet</p>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', maxWidth: 280 }}>
            Start a session and your solves will appear here automatically.
          </p>
        </div>
      )}

      {/* Solve table */}
      {!loading && filteredSolves.length > 0 && (
        <div style={{
          backgroundColor: 'var(--surface-0)',
          border: '1px solid var(--border)',
          borderRadius: 10,
          overflow: 'hidden',
        }}>
          {/* Table header */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '40px 80px 72px 110px 1fr',
            padding: '10px 16px',
            borderBottom: '1px solid var(--border)',
            fontSize: 11, fontWeight: 600,
            color: 'var(--text-muted)',
            textTransform: 'uppercase', letterSpacing: '0.07em',
          }}>
            <span>#</span>
            <span>Date</span>
            <span>Event</span>
            <span>Time</span>
            <span>Scramble</span>
          </div>

          {/* Rows */}
          <div style={{ overflowY: 'auto', maxHeight: 'calc(100dvh - 300px)' }}>
            {filteredSolves.map((solve, i) => (
              <div
                key={solve.id}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '40px 80px 72px 110px 1fr',
                  padding: '9px 16px',
                  borderBottom: '1px solid var(--border)',
                  alignItems: 'center',
                  fontSize: 13,
                  transition: 'background-color 100ms ease',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--surface-1)' }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent' }}
              >
                <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>
                  {filteredSolves.length - i}
                </span>
                <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>
                  {formatDate(solve.timestamp)}
                </span>
                <span style={{
                  fontSize: 11, fontWeight: 600, color: 'var(--accent)',
                  fontFamily: "'JetBrains Mono', monospace",
                }}>
                  {EVENT_LABELS[solve.event] ?? solve.event}
                </span>
                <span style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontWeight: 600,
                  color: solve.penalty === 'DNF'
                    ? 'var(--penalty)'
                    : solve.penalty === '+2'
                    ? 'var(--inspection)'
                    : 'var(--text-primary)',
                  display: 'flex', alignItems: 'center',
                }}>
                  {formatTime(solve.effectiveTime)}
                  <PenaltyBadge penalty={solve.penalty} />
                </span>
                <span style={{
                  color: 'var(--text-muted)', fontSize: 12,
                  fontFamily: "'JetBrains Mono', monospace",
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>
                  {solve.scramble}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* No results from search */}
      {!loading && solves.length > 0 && filteredSolves.length === 0 && (
        <div style={{
          textAlign: 'center', padding: '48px 32px',
          backgroundColor: 'var(--surface-0)',
          border: '1px solid var(--border)',
          borderRadius: 10, color: 'var(--text-muted)', fontSize: 14,
        }}>
          No solves match your search.
        </div>
      )}
    </div>
  )
}
