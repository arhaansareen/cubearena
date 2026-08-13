import { useMemo, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuth } from '@/providers/AuthProvider'
import { useProfile } from '@/providers/ProfileProvider'
import { useSolveHistory } from '@/hooks/useSolveHistory'
import { useWCAData } from '@/hooks/useWCAData'
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

const EVENT_LABELS: Record<string, string> = {
  '333': '3×3', '222': '2×2', '444': '4×4', '555': '5×5',
  '666': '6×6', '777': '7×7', '333bf': '3×3 BLD', '333oh': 'OH',
  '333fm': 'FMC', clock: 'Clock', minx: 'Megaminx', pyram: 'Pyra',
  skewb: 'Skewb', sq1: 'Sq-1', '444bf': '4×4 BLD', '555bf': '5×5 BLD',
}

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
  const { profile } = useProfile()
  const { solves, loading } = useSolveHistory(user?.uid)
  const { state: wcaState, lookup: wcaLookup } = useWCAData()

  const wcaId = profile?.wcaId ?? null

  useEffect(() => {
    if (wcaId) {
      wcaLookup(wcaId)
    }
  }, [wcaId, wcaLookup])

  const pbs = useMemo(
    () => DASHBOARD_EVENTS.map(({ event, label }) => ({ label, pb: computePB(solves, event) })),
    [solves]
  )

  const recentSessions = useMemo(() => groupIntoSessions(solves), [solves])

  const bestSingle = useMemo(() => {
    const valid = solves.filter(s => s.penalty !== 'DNF' && isFinite(s.effectiveTime))
    if (valid.length === 0) return null
    return valid.reduce((b, s) => s.effectiveTime < b.effectiveTime ? s : b, valid[0])
  }, [solves])

  const ao5 = useMemo(() => {
    const valid = solves.filter(s => isFinite(s.effectiveTime))
    if (valid.length < 5) return null
    const last5 = valid.slice(-5).map(s => s.effectiveTime)
    const sorted = [...last5].sort((a,b)=>a-b)
    const trimmed = sorted.slice(1,-1)
    return trimmed.reduce((s,t)=>s+t,0)/trimmed.length
  }, [solves])

  const ao12 = useMemo(() => {
    const valid = solves.filter(s => isFinite(s.effectiveTime))
    if (valid.length < 12) return null
    const last12 = valid.slice(-12).map(s => s.effectiveTime)
    const sorted = [...last12].sort((a,b)=>a-b)
    const trimmed = sorted.slice(1,-1)
    return trimmed.reduce((s,t)=>s+t,0)/trimmed.length
  }, [solves])

  const todayCount = useMemo(() => {
    const todayStr = new Date().toDateString()
    return solves.filter(s => new Date(s.timestamp).toDateString() === todayStr).length
  }, [solves])

  const weekCount = useMemo(() => {
    const cutoff = Date.now() - 7 * 24 * 60 * 60 * 1000
    return solves.filter(s => s.timestamp >= cutoff).length
  }, [solves])

  const sessionCount = useMemo(() => new Set(solves.map(s => s.sessionId)).size, [solves])

  const streak = useMemo(() => {
    const daySet = new Set(solves.map(s => new Date(s.timestamp).toDateString()))
    let count = 0
    const d = new Date()
    d.setHours(0,0,0,0)
    while (daySet.has(d.toDateString())) {
      count++
      d.setDate(d.getDate()-1)
    }
    return count
  }, [solves])

  // Build WCA PB rows from API response
  const wcaPbRows = useMemo(() => {
    if (wcaState.status !== 'success') return []
    const records = wcaState.data.personal_records
    return (Object.entries(records) as [WCAEvent, (typeof records)[WCAEvent]][])
      .filter(([, rec]) => rec?.single !== null)
      .map(([event, rec]) => ({
        event,
        label: EVENT_LABELS[event] ?? event,
        single: rec?.single ?? null,
        average: rec?.average ?? null,
      }))
      .sort((a, b) => {
        // Sort by world rank ascending (lower = better)
        const rankA = a.single?.world_rank ?? Infinity
        const rankB = b.single?.world_rank ?? Infinity
        return rankA - rankB
      })
  }, [wcaState])

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      style={{ padding: '32px', maxWidth: 880, margin: '0 auto', width: '100%' }}
    >
      <style>{`
        @media (min-width: 640px) {
          .wca-pb-grid { grid-template-columns: repeat(3, 1fr) !important; }
        }
      `}</style>

      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 30, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 4, letterSpacing: '-0.03em' }}>
          Dashboard
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>
          {loading ? 'Loading your stats…' : solves.length > 0 ? `${solves.length} solves recorded` : 'Ready to cube?'}
        </p>
      </div>

      {/* Quick Stats strip + Start CTA */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 16,
        marginBottom: 36,
        flexWrap: 'wrap',
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 20,
          padding: '16px 24px',
          backgroundColor: 'var(--surface-0)',
          border: '1px solid var(--border)',
          borderRadius: 12,
          boxShadow: 'var(--shadow-soft)',
          flex: '0 0 auto',
        }}>
          <div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 500, marginBottom: 4 }}>
              Total solves
            </div>
            <div style={{
              fontSize: 28, fontWeight: 700,
              fontFamily: "'JetBrains Mono', monospace",
              color: 'var(--text-primary)',
              letterSpacing: '-0.02em',
            }}>
              {loading ? '—' : solves.length}
            </div>
          </div>
        </div>

        <button
          onClick={() => navigate('/session')}
          style={{
            display: 'flex', alignItems: 'center', gap: 12,
            padding: '16px 28px',
            backgroundColor: 'var(--accent)', color: '#020617',
            borderRadius: 12, fontSize: 16, fontWeight: 700,
            cursor: 'pointer', border: 'none',
            boxShadow: 'var(--shadow-accent)',
            transition: 'opacity 150ms ease, transform 150ms ease',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.9'; e.currentTarget.style.transform = 'translateY(-1px)' }}
          onMouseLeave={(e) => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.transform = 'translateY(0)' }}
          onMouseDown={(e) => { e.currentTarget.style.transform = 'scale(0.97)' }}
          onMouseUp={(e) => { e.currentTarget.style.transform = 'translateY(-1px)' }}
        >
          <PlayIcon />
          Start Session
        </button>
      </div>

      {/* Stats grid */}
      <section style={{ marginBottom: 36 }}>
        <h2 style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 500, marginBottom: 12 }}>
          Your stats
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 10 }}>
          {[
            { label: 'Best single', value: bestSingle ? formatTime(bestSingle.effectiveTime) : '—', sub: bestSingle ? (EVENT_LABELS[bestSingle.event] ?? bestSingle.event) : null, color: bestSingle ? 'var(--positive)' : 'var(--text-muted)' },
            { label: 'Ao5', value: ao5 !== null ? formatTime(ao5) : '—', sub: 'last 5 solves', color: 'var(--accent)' },
            { label: 'Ao12', value: ao12 !== null ? formatTime(ao12) : '—', sub: 'last 12 solves', color: ao12 !== null ? 'var(--text-primary)' : 'var(--text-muted)' },
            { label: 'Today', value: String(todayCount), sub: todayCount === 1 ? 'solve' : 'solves', color: todayCount > 0 ? 'var(--text-primary)' : 'var(--text-muted)' },
            { label: 'This week', value: String(weekCount), sub: weekCount === 1 ? 'solve' : 'solves', color: weekCount > 0 ? 'var(--text-primary)' : 'var(--text-muted)' },
            { label: 'Sessions', value: String(sessionCount), sub: 'total', color: 'var(--text-primary)' },
            { label: 'Streak', value: String(streak), sub: streak === 1 ? 'day' : 'days', color: streak >= 3 ? 'var(--inspection)' : 'var(--text-muted)' },
          ].map(({ label, value, sub, color }) => (
            <div key={label} style={{
              background: 'var(--surface-0)',
              border: '1px solid var(--border)',
              borderRadius: 12,
              padding: '16px 20px',
              boxShadow: 'var(--shadow-soft)',
            }}>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 500, marginBottom: 6 }}>{label}</div>
              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 22, fontWeight: 700, letterSpacing: '-0.02em', color, lineHeight: 1 }}>{loading ? '—' : value}</div>
              {sub && <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>{sub}</div>}
            </div>
          ))}
        </div>
      </section>

      {/* Personal bests */}
      <section style={{ marginBottom: 36 }}>
        <h2 style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 500, marginBottom: 12 }}>
          Personal bests
        </h2>
        <motion.div
          variants={{ animate: { transition: { staggerChildren: 0.04 } } }}
          initial="initial"
          animate="animate"
          style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: 10 }}
        >
          {pbs.map(({ label, pb }) => (
            <motion.div
              key={label}
              variants={{ initial: { opacity: 0, y: 8 }, animate: { opacity: 1, y: 0, transition: { duration: 0.3, ease: [0.16, 1, 0.3, 1] } } }}
              style={{
              background: 'var(--surface-0)',
              border: '1px solid var(--border)',
              borderRadius: 16, padding: '20px 24px',
              display: 'flex', flexDirection: 'column', gap: 6,
              boxShadow: 'var(--shadow-soft)',
            }}>
              <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 500 }}>
                {label}
              </span>
              <span style={{
                fontSize: 22, fontWeight: 700, letterSpacing: '-0.02em',
                fontFamily: "'JetBrains Mono', monospace",
                color: pb ? 'var(--text-primary)' : 'var(--text-muted)',
              }}>
                {pb !== null ? formatTime(pb) : '—'}
              </span>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* WCA Official PBs */}
      <section style={{ marginBottom: 36 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <h2 style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 500, margin: 0 }}>
            Official PBs
          </h2>
          <span style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 400, opacity: 0.6 }}>via WCA</span>
        </div>

        {!wcaId ? (
          /* No WCA ID set */
          <div style={{
            backgroundColor: 'var(--surface-0)', border: '1px solid var(--border)',
            borderRadius: 10, padding: '14px 18px',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16,
          }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 2 }}>Link your WCA ID</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Add your WCA ID in Settings to see your official PBs.</div>
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
        ) : wcaState.status === 'loading' ? (
          /* Loading skeleton */
          <div className="wca-pb-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} style={{
                backgroundColor: 'var(--surface-0)',
                border: '1px solid var(--border)',
                borderRadius: 8, padding: '12px 14px',
                opacity: 1 - (i - 1) * 0.1,
              }}>
                <div style={{ width: 40, height: 10, backgroundColor: 'var(--surface-1)', borderRadius: 4, marginBottom: 8 }} />
                <div style={{ width: 70, height: 20, backgroundColor: 'var(--surface-1)', borderRadius: 4, marginBottom: 4 }} />
                <div style={{ width: 55, height: 12, backgroundColor: 'var(--surface-1)', borderRadius: 4 }} />
              </div>
            ))}
          </div>
        ) : wcaState.status === 'not_found' || wcaState.status === 'error' ? (
          /* Error/not found */
          <div style={{
            backgroundColor: 'var(--surface-0)', border: '1px solid var(--border)',
            borderRadius: 10, padding: '20px',
            textAlign: 'center', color: 'var(--text-muted)', fontSize: 13,
          }}>
            {wcaState.status === 'not_found'
              ? `WCA ID "${wcaId}" not found. `
              : 'Could not load WCA data. '}
            <button
              onClick={() => navigate('/settings')}
              style={{
                background: 'none', border: 'none', color: 'var(--accent)',
                fontSize: 13, cursor: 'pointer', textDecoration: 'underline', padding: 0,
              }}
            >
              Update in Settings
            </button>
          </div>
        ) : wcaState.status === 'success' && wcaPbRows.length === 0 ? (
          <div style={{
            backgroundColor: 'var(--surface-0)', border: '1px solid var(--border)',
            borderRadius: 10, padding: '20px',
            textAlign: 'center', color: 'var(--text-muted)', fontSize: 13,
          }}>
            No competition results found for {wcaState.data.person.name}.
          </div>
        ) : wcaState.status === 'success' ? (
          <div className="wca-pb-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
            {wcaPbRows.map(({ event, label, single, average }) => (
              <div key={event} style={{
                backgroundColor: 'var(--surface-0)',
                border: '1px solid var(--border)',
                borderRadius: 8, padding: '12px 14px',
              }}>
                <div style={{
                  fontSize: 12, color: 'var(--text-muted)',
                  textTransform: 'uppercase', letterSpacing: '0.06em',
                  marginBottom: 6,
                }}>
                  {label}
                </div>
                <div style={{
                  fontSize: 20, fontWeight: 700,
                  fontFamily: "'JetBrains Mono', monospace",
                  color: 'var(--text-primary)',
                  letterSpacing: '-0.02em',
                  marginBottom: 2,
                }}>
                  {single ? formatTime(single.best * 10) : '—'}
                </div>
                {average && (
                  <div style={{
                    fontSize: 13,
                    fontFamily: "'JetBrains Mono', monospace",
                    color: 'var(--text-muted)',
                    marginBottom: 4,
                  }}>
                    avg {formatTime(average.best * 10)}
                  </div>
                )}
                {single && (
                  <span style={{
                    display: 'inline-block',
                    backgroundColor: 'var(--accent-dim)',
                    color: 'var(--accent)',
                    fontSize: 10, fontWeight: 600,
                    borderRadius: 4, padding: '2px 5px',
                    letterSpacing: '0.03em',
                  }}>
                    WR #{single.world_rank}
                  </span>
                )}
              </div>
            ))}
          </div>
        ) : null}
      </section>

      {/* Recent sessions */}
      <section style={{ marginBottom: 36 }}>
        <h2 style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 500, marginBottom: 12 }}>
          Recent sessions
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
    </motion.div>
  )
}
