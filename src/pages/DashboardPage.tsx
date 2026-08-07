import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/providers/AuthProvider'
import { useSolveHistory } from '@/hooks/useSolveHistory'
import { formatTime } from '@/lib/utils'
import type { Solve, WCAEvent } from '@/types'

const DASHBOARD_EVENTS: { event: WCAEvent; label: string }[] = [
  { event: '333', label: '3×3' },
  { event: '222', label: '2×2' },
  { event: '444', label: '4×4' },
  { event: '333oh', label: 'OH' },
  { event: 'pyram', label: 'Pyra' },
  { event: 'skewb', label: 'Skewb' },
]

function computePB(solves: Solve[], event: WCAEvent): number | null {
  const times = solves
    .filter((s) => s.event === event && s.penalty !== 'DNF' && isFinite(s.effectiveTime))
    .map((s) => s.effectiveTime)
  return times.length > 0 ? Math.min(...times) : null
}

interface RecentSession {
  sessionId: string
  event: WCAEvent
  solveCount: number
  mean: number | null
  best: number | null
  date: number
}

function groupIntoSessions(solves: Solve[]): RecentSession[] {
  const bySession = new Map<string, Solve[]>()
  for (const s of solves) {
    const arr = bySession.get(s.sessionId) ?? []
    arr.push(s)
    bySession.set(s.sessionId, arr)
  }
  const sessions: RecentSession[] = []
  for (const [sessionId, sessionSolves] of bySession) {
    const sorted = [...sessionSolves].sort((a, b) => a.timestamp - b.timestamp)
    const finite = sorted.filter((s) => isFinite(s.effectiveTime))
    const mean = finite.length > 0
      ? finite.reduce((sum, s) => sum + s.effectiveTime, 0) / finite.length
      : null
    const best = finite.length > 0 ? Math.min(...finite.map((s) => s.effectiveTime)) : null
    sessions.push({
      sessionId,
      event: sorted[0].event,
      solveCount: sorted.length,
      mean,
      best,
      date: sorted[sorted.length - 1].timestamp,
    })
  }
  return sessions.sort((a, b) => b.date - a.date).slice(0, 5)
}

function formatRelativeDate(ts: number): string {
  const diff = Date.now() - ts
  const days = Math.floor(diff / 86400000)
  if (days === 0) return 'Today'
  if (days === 1) return 'Yesterday'
  if (days < 7) return `${days} days ago`
  return new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

const EVENT_LABELS: Record<string, string> = {
  '333': '3×3', '222': '2×2', '444': '4×4', '555': '5×5',
  '666': '6×6', '777': '7×7', '333bf': '3×3 BLD', '333oh': 'OH',
  '333fm': 'FMC', clock: 'Clock', minx: 'Megaminx', pyram: 'Pyra',
  skewb: 'Skewb', sq1: 'Sq-1', '444bf': '4×4 BLD', '555bf': '5×5 BLD',
}

function PlayIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="currentColor" aria-hidden="true">
      <path d="M5 3.5l11 5.5-11 5.5V3.5z" />
    </svg>
  )
}

function LinkIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 13 13" fill="none" aria-hidden="true">
      <path d="M5.5 2H2v9h9V7.5M7.5 2h4v4M7.5 5.5l4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function DashboardPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { solves, loading } = useSolveHistory(user?.uid)

  const pbs = useMemo(
    () => DASHBOARD_EVENTS.map(({ event, label }) => ({ label, pb: computePB(solves, event) })),
    [solves]
  )

  const recentSessions = useMemo(() => groupIntoSessions(solves), [solves])

  return (
    <div style={{ padding: '32px', maxWidth: 880, margin: '0 auto', width: '100%' }}>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 26, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>
          Dashboard
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>
          {loading ? 'Loading your stats…' : solves.length > 0 ? `${solves.length} solves recorded` : 'Ready to cube?'}
        </p>
      </div>

      {/* Quick start */}
      <button
        onClick={() => navigate('/session')}
        style={{
          display: 'flex', alignItems: 'center', gap: 12,
          padding: '16px 28px',
          backgroundColor: 'var(--accent)', color: '#020617',
          borderRadius: 12, fontSize: 16, fontWeight: 700,
          cursor: 'pointer', border: 'none', marginBottom: 36,
          boxShadow: '0 0 28px rgba(34,211,238,0.18)',
          transition: 'opacity 150ms ease, transform 150ms ease',
        }}
        onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.9'; e.currentTarget.style.transform = 'translateY(-1px)' }}
        onMouseLeave={(e) => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.transform = 'translateY(0)' }}
      >
        <PlayIcon />
        Start Session
      </button>

      {/* Personal bests */}
      <section style={{ marginBottom: 36 }}>
        <h2 style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 14, letterSpacing: '-0.01em' }}>
          Personal Bests
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: 10 }}>
          {pbs.map(({ label, pb }) => (
            <div key={label} style={{
              backgroundColor: 'var(--surface-0)',
              border: `1px solid ${pb ? 'var(--border)' : 'var(--border)'}`,
              borderRadius: 10, padding: '13px 15px',
              display: 'flex', flexDirection: 'column', gap: 3,
            }}>
              <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.07em', textTransform: 'uppercase' }}>
                {label}
              </span>
              <span style={{
                fontSize: 20, fontWeight: 700, letterSpacing: '-0.02em',
                fontFamily: "'JetBrains Mono', monospace",
                color: pb ? 'var(--text-primary)' : 'var(--text-muted)',
              }}>
                {pb !== null ? formatTime(pb) : '—'}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* Recent sessions */}
      <section style={{ marginBottom: 36 }}>
        <h2 style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 14, letterSpacing: '-0.01em' }}>
          Recent Sessions
        </h2>
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {[1, 2, 3].map((i) => (
              <div key={i} style={{ height: 52, borderRadius: 8, backgroundColor: 'var(--surface-0)', opacity: 1 - i * 0.2 }} />
            ))}
          </div>
        ) : recentSessions.length === 0 ? (
          <div style={{
            backgroundColor: 'var(--surface-0)', border: '1px solid var(--border)',
            borderRadius: 10, padding: '28px', textAlign: 'center',
            color: 'var(--text-muted)', fontSize: 14,
          }}>
            No sessions yet — start solving to see your history here.
          </div>
        ) : (
          <div style={{
            backgroundColor: 'var(--surface-0)', border: '1px solid var(--border)',
            borderRadius: 10, overflow: 'hidden',
          }}>
            {recentSessions.map((s, i) => (
              <div key={s.sessionId} style={{
                display: 'grid',
                gridTemplateColumns: '80px 60px 1fr 100px 100px',
                alignItems: 'center',
                padding: '11px 16px',
                borderBottom: i < recentSessions.length - 1 ? '1px solid var(--border)' : 'none',
                fontSize: 13,
                gap: 8,
              }}>
                <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>{formatRelativeDate(s.date)}</span>
                <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--accent)', fontFamily: "'JetBrains Mono', monospace" }}>
                  {EVENT_LABELS[s.event] ?? s.event}
                </span>
                <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>{s.solveCount} solve{s.solveCount !== 1 ? 's' : ''}</span>
                <div>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 1 }}>mean</div>
                  <div style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 600, fontSize: 13 }}>
                    {s.mean !== null ? formatTime(s.mean) : '—'}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 1 }}>best</div>
                  <div style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 600, fontSize: 13, color: 'var(--positive)' }}>
                    {s.best !== null ? formatTime(s.best) : '—'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* WCA ID prompt */}
      <div style={{
        backgroundColor: 'var(--surface-0)', border: '1px solid var(--border)',
        borderRadius: 10, padding: '14px 18px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16,
      }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 2 }}>Link your WCA ID</div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Track rivals and compare with official results.</div>
        </div>
        <button
          onClick={() => navigate('/settings')}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '7px 14px', borderRadius: 8,
            border: '1px solid var(--border)', backgroundColor: 'var(--surface-1)',
            color: 'var(--text-primary)', fontSize: 12, fontWeight: 500,
            cursor: 'pointer', whiteSpace: 'nowrap',
            transition: 'border-color 150ms ease',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)' }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border)' }}
        >
          <LinkIcon />
          Add WCA ID
        </button>
      </div>
    </div>
  )
}
