import { useState, useMemo, useCallback, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CubeViz } from '@/components/algs/CubeViz'
import { OLL, PLL, F2L, getGroup } from '@/data/algData'
import type { AlgCase, AlgSubset } from '@/data/algData'
import { useAuth } from '@/providers/AuthProvider'

const LS_KEY = (uid: string) => `cubearena:alg-status:${uid}`

type Status = 'unlearned' | 'learning' | 'mastered'

function loadStatus(uid: string): Record<string, Status> {
  try { return JSON.parse(localStorage.getItem(LS_KEY(uid)) ?? '{}') } catch { return {} }
}
function saveStatus(uid: string, s: Record<string, Status>) {
  try { localStorage.setItem(LS_KEY(uid), JSON.stringify(s)) } catch {}
}

const STATUS_COLORS: Record<Status, string> = {
  unlearned: 'var(--border)',
  learning:  '#f59e0b',
  mastered:  'var(--accent)',
}
const STATUS_LABELS: Record<Status, string> = {
  unlearned: 'Unlearned',
  learning:  'Learning',
  mastered:  'Mastered',
}
const STATUS_CYCLE: Status[] = ['unlearned', 'learning', 'mastered']

// ─── Alg card ─────────────────────────────────────────────────────────────────
function AlgCard({
  c, status, onToggle, onClick,
}: {
  c: AlgCase
  status: Status
  onToggle: (id: string) => void
  onClick: (c: AlgCase) => void
}) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      whileHover={{ y: -2 }}
      onClick={() => onClick(c)}
      style={{
        backgroundColor: 'var(--surface-0)',
        border: `1px solid var(--border)`,
        borderRadius: 10,
        padding: 12,
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        cursor: 'pointer',
        position: 'relative',
        transition: 'border-color 150ms',
      }}
    >
      {/* Status dot */}
      <button
        onClick={(e) => { e.stopPropagation(); onToggle(c.id) }}
        title={STATUS_LABELS[status]}
        style={{
          position: 'absolute', top: 8, right: 8,
          width: 10, height: 10, borderRadius: '50%',
          backgroundColor: STATUS_COLORS[status],
          border: '1.5px solid var(--surface-1)',
          cursor: 'pointer', padding: 0,
          transition: 'background-color 200ms, transform 150ms',
        }}
        onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.5)' }}
        onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)' }}
      />

      {/* Cube visual */}
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <CubeViz alg={c.alg} subset={c.subset} size={88} />
      </div>

      {/* Name + alg */}
      <div>
        <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 3 }}>
          {c.name}
        </div>
        <div
          className="font-mono"
          style={{
            fontSize: 10, color: 'var(--text-muted)', lineHeight: 1.5,
            wordBreak: 'break-all', opacity: 0.85,
          }}
        >
          {c.alg}
        </div>
      </div>
    </motion.div>
  )
}

// ─── Detail modal ─────────────────────────────────────────────────────────────
function DetailModal({
  c, status, onToggle, onClose,
}: {
  c: AlgCase; status: Status; onToggle: (id: string) => void; onClose: () => void
}) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 300,
        backgroundColor: 'rgba(0,0,0,0.6)',
        backdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 24,
      }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 12 }}
        onClick={(e) => e.stopPropagation()}
        style={{
          backgroundColor: 'var(--surface-0)',
          border: '1px solid var(--border)',
          borderRadius: 16,
          padding: 28,
          maxWidth: 440,
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          gap: 20,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-primary)' }}>{c.name}</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{c.group} · {c.subset}</div>
          </div>
          <button
            onClick={onClose}
            style={{
              width: 28, height: 28, borderRadius: 6,
              border: '1px solid var(--border)',
              backgroundColor: 'transparent',
              color: 'var(--text-muted)',
              cursor: 'pointer', fontSize: 16,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >×</button>
        </div>

        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <CubeViz alg={c.alg} subset={c.subset} size={160} />
        </div>

        <div style={{
          backgroundColor: 'var(--surface-1)',
          borderRadius: 8, padding: '10px 14px',
        }}>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4, fontWeight: 500 }}>Algorithm</div>
          <div className="font-mono" style={{ fontSize: 13, color: 'var(--text-primary)', lineHeight: 1.6 }}>
            {c.alg}
          </div>
        </div>

        {c.probability && (
          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            Probability: {c.probability}
          </div>
        )}

        <div style={{ display: 'flex', gap: 8 }}>
          {STATUS_CYCLE.map((s) => (
            <button
              key={s}
              onClick={() => onToggle(c.id)}
              style={{
                flex: 1, padding: '8px 0',
                borderRadius: 8,
                border: `1.5px solid ${status === s ? STATUS_COLORS[s] : 'var(--border)'}`,
                backgroundColor: status === s ? `${STATUS_COLORS[s]}18` : 'transparent',
                color: status === s ? STATUS_COLORS[s] : 'var(--text-muted)',
                fontSize: 12, fontWeight: 600, cursor: 'pointer',
                transition: 'all 150ms',
              }}
            >
              {STATUS_LABELS[s]}
            </button>
          ))}
        </div>
      </motion.div>
    </motion.div>
  )
}

// ─── Drill Mode ───────────────────────────────────────────────────────────────
function buildDrillQueue(cases: AlgCase[], statusMap: Record<string, Status>): AlgCase[] {
  const weights: Record<Status, number> = { unlearned: 4, learning: 2, mastered: 1 }
  const pool: AlgCase[] = []
  for (const c of cases) {
    const w = weights[statusMap[c.id] ?? 'unlearned']
    for (let i = 0; i < w; i++) pool.push(c)
  }
  // Fisher-Yates shuffle
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]]
  }
  // Deduplicate while preserving order (first occurrence)
  const seen = new Set<string>()
  return pool.filter(c => { if (seen.has(c.id)) return false; seen.add(c.id); return true })
}

function DrillMode({
  cases,
  statusMap,
  onStatusChange,
  onClose,
}: {
  cases: AlgCase[]
  statusMap: Record<string, Status>
  onStatusChange: (id: string, status: Status) => void
  onClose: () => void
}) {
  const [queue] = useState<AlgCase[]>(() => buildDrillQueue(cases, statusMap))
  const [index, setIndex] = useState(0)
  const [revealed, setRevealed] = useState(false)
  const [done, setDone] = useState(false)

  // Count mastered at completion time
  const masteredCount = useMemo(
    () => queue.filter(c => (statusMap[c.id] ?? 'unlearned') === 'mastered').length,
    // recompute only when done screen is shown or statusMap changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [done, statusMap, queue]
  )

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  const advance = useCallback(() => {
    if (index + 1 >= queue.length) {
      setDone(true)
    } else {
      setIndex(i => i + 1)
      setRevealed(false)
    }
  }, [index, queue.length])

  const handleGotIt = useCallback(() => {
    if (!queue[index]) return
    onStatusChange(queue[index].id, 'mastered')
    advance()
  }, [queue, index, onStatusChange, advance])

  const handleNeedsWork = useCallback(() => {
    if (!queue[index]) return
    onStatusChange(queue[index].id, 'learning')
    advance()
  }, [queue, index, onStatusChange, advance])

  const current = queue[index]
  const total = queue.length

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{
        position: 'fixed', inset: 0, zIndex: 400,
        backgroundColor: 'rgba(0,0,0,0.85)',
        backdropFilter: 'blur(8px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 24,
      }}
    >
      <div
        style={{
          maxWidth: 420, width: '100%',
          backgroundColor: 'var(--surface-0)',
          border: '1px solid var(--border)',
          borderRadius: 20,
          padding: 28,
          display: 'flex',
          flexDirection: 'column',
          gap: 20,
        }}
      >
        {/* Top row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{
            fontSize: 13, fontWeight: 700, color: 'var(--text-muted)',
            letterSpacing: '0.08em', textTransform: 'uppercase',
          }}>
            Drill
          </span>
          <button
            onClick={onClose}
            style={{
              width: 28, height: 28, borderRadius: 6,
              border: '1px solid var(--border)',
              backgroundColor: 'transparent',
              color: 'var(--text-muted)',
              cursor: 'pointer', fontSize: 16,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >✕</button>
        </div>

        {done ? (
          /* ── Completion screen ── */
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20, padding: '12px 0' }}>
            <div style={{ fontSize: 40 }}>🎉</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-primary)', textAlign: 'center' }}>
              Drill complete!
            </div>
            <div style={{ fontSize: 14, color: 'var(--text-muted)', textAlign: 'center' }}>
              {masteredCount} / {total} mastered
            </div>
            <button
              onClick={onClose}
              style={{
                padding: '10px 28px',
                borderRadius: 10,
                border: 'none',
                backgroundColor: 'var(--accent)',
                color: '#000',
                fontSize: 14, fontWeight: 700, cursor: 'pointer',
              }}
            >
              Close
            </button>
          </div>
        ) : (
          <>
            {/* Progress bar */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 6 }}>
                <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                  {index + 1} / {total}
                </span>
              </div>
              <div style={{ height: 3, backgroundColor: 'var(--border)', borderRadius: 2, overflow: 'hidden' }}>
                <div style={{
                  height: '100%',
                  width: `${((index + 1) / total) * 100}%`,
                  backgroundColor: 'var(--accent)',
                  transition: 'width 300ms ease',
                }} />
              </div>
            </div>

            {/* Card content with animation */}
            <AnimatePresence mode="wait">
              {current && (
                <motion.div
                  key={current.id}
                  initial={{ x: 40, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  exit={{ x: -40, opacity: 0 }}
                  transition={{ duration: 0.18 }}
                  style={{ display: 'flex', flexDirection: 'column', gap: 16, alignItems: 'center' }}
                >
                  {/* Cube viz */}
                  <CubeViz alg={current.alg} subset={current.subset} size={160} />

                  {/* Name */}
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-primary)' }}>
                      {current.name}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
                      {current.group} · {current.subset}
                    </div>
                  </div>

                  {/* Hidden alg / Reveal */}
                  {!revealed ? (
                    <button
                      onClick={() => setRevealed(true)}
                      style={{
                        width: '100%',
                        padding: '12px 0',
                        borderRadius: 10,
                        border: '1.5px solid var(--accent)',
                        backgroundColor: 'rgba(34,211,238,0.08)',
                        color: 'var(--accent)',
                        fontSize: 14, fontWeight: 700, cursor: 'pointer',
                        transition: 'all 150ms',
                      }}
                    >
                      Reveal
                    </button>
                  ) : (
                    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 12 }}>
                      {/* Algorithm text */}
                      <div style={{
                        backgroundColor: 'var(--surface-1)',
                        borderRadius: 8, padding: '10px 14px',
                      }}>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4, fontWeight: 500 }}>
                          Algorithm
                        </div>
                        <div className="font-mono" style={{ fontSize: 13, color: 'var(--text-primary)', lineHeight: 1.6 }}>
                          {current.alg}
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button
                          onClick={handleGotIt}
                          style={{
                            flex: 1, padding: '10px 0',
                            borderRadius: 10,
                            border: '1.5px solid var(--accent)',
                            backgroundColor: 'rgba(34,211,238,0.1)',
                            color: 'var(--accent)',
                            fontSize: 13, fontWeight: 700, cursor: 'pointer',
                            transition: 'all 150ms',
                          }}
                        >
                          Got it
                        </button>
                        <button
                          onClick={handleNeedsWork}
                          style={{
                            flex: 1, padding: '10px 0',
                            borderRadius: 10,
                            border: '1.5px solid #f59e0b',
                            backgroundColor: 'rgba(245,158,11,0.1)',
                            color: '#f59e0b',
                            fontSize: 13, fontWeight: 700, cursor: 'pointer',
                            transition: 'all 150ms',
                          }}
                        >
                          Needs work
                        </button>
                        <button
                          onClick={advance}
                          style={{
                            padding: '10px 14px',
                            borderRadius: 10,
                            border: '1px solid var(--border)',
                            backgroundColor: 'transparent',
                            color: 'var(--text-muted)',
                            fontSize: 13, fontWeight: 600, cursor: 'pointer',
                            transition: 'all 150ms',
                          }}
                        >
                          Skip
                        </button>
                      </div>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </>
        )}
      </div>
    </motion.div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────
const SUBSETS: AlgSubset[] = ['OLL', 'PLL', 'F2L']
const SOURCES: Record<AlgSubset, AlgCase[]> = { OLL, PLL, F2L }

export function AlgorithmsPage() {
  const { user } = useAuth()
  const uid = user?.uid ?? 'local'

  const [subset, setSubset] = useState<AlgSubset>('OLL')
  const [group, setGroup] = useState<string | null>(null)
  const [statusMap, setStatusMap] = useState<Record<string, Status>>(() => loadStatus(uid))
  const [selected, setSelected] = useState<AlgCase | null>(null)
  const [filterStatus, setFilterStatus] = useState<Status | null>(null)
  const [drillActive, setDrillActive] = useState(false)

  const groups = useMemo(() => getGroup(subset), [subset])
  const cases = useMemo(() => {
    let list = SOURCES[subset]
    if (group) list = list.filter((c) => c.group === group)
    if (filterStatus) list = list.filter((c) => (statusMap[c.id] ?? 'unlearned') === filterStatus)
    return list
  }, [subset, group, filterStatus, statusMap])

  const counts = useMemo(() => {
    const src = SOURCES[subset]
    const learned = src.filter((c) => (statusMap[c.id] ?? 'unlearned') === 'learning').length
    const mastered = src.filter((c) => (statusMap[c.id] ?? 'unlearned') === 'mastered').length
    return { total: src.length, learned, mastered }
  }, [subset, statusMap])

  const cycleStatus = useCallback((id: string) => {
    setStatusMap((prev) => {
      const cur: Status = prev[id] ?? 'unlearned'
      const idx = STATUS_CYCLE.indexOf(cur)
      const next: Status = STATUS_CYCLE[(idx + 1) % STATUS_CYCLE.length]
      const updated = { ...prev, [id]: next }
      saveStatus(uid, updated)
      return updated
    })
  }, [uid])

  const setStatus = useCallback((id: string, status: Status) => {
    setStatusMap((prev) => {
      const updated = { ...prev, [id]: status }
      saveStatus(uid, updated)
      return updated
    })
  }, [uid])

  return (
    <div style={{ padding: '28px 32px', maxWidth: 1100, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
          CFOP Algorithms
        </h1>
        <p style={{ fontSize: 14, color: 'var(--text-muted)', marginTop: 4 }}>
          Learn and track your OLL, PLL, and F2L cases.
        </p>
      </div>

      {/* Subset tabs + Drill button */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 20, alignItems: 'center' }}>
        {SUBSETS.map((s) => (
          <button
            key={s}
            onClick={() => { setSubset(s); setGroup(null); setFilterStatus(null) }}
            style={{
              padding: '7px 18px',
              borderRadius: 8,
              border: 'none',
              backgroundColor: subset === s ? 'var(--accent)' : 'var(--surface-1)',
              color: subset === s ? '#000' : 'var(--text-muted)',
              fontSize: 13, fontWeight: 700, cursor: 'pointer',
              transition: 'all 150ms',
            }}
          >
            {s}
          </button>
        ))}

        {cases.length > 0 && (
          <button
            onClick={() => setDrillActive(true)}
            style={{
              marginLeft: 'auto',
              padding: '7px 18px',
              borderRadius: 8,
              border: '1.5px solid var(--accent)',
              backgroundColor: 'rgba(34,211,238,0.08)',
              color: 'var(--accent)',
              fontSize: 13, fontWeight: 700, cursor: 'pointer',
              transition: 'all 150ms',
              display: 'flex', alignItems: 'center', gap: 6,
            }}
          >
            <span style={{ fontSize: 15 }}>⚡</span> Drill
          </button>
        )}
      </div>

      {/* Progress bar */}
      <div style={{
        backgroundColor: 'var(--surface-1)', borderRadius: 10,
        padding: '12px 16px', marginBottom: 20,
        display: 'flex', alignItems: 'center', gap: 20,
      }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              {counts.mastered}/{counts.total} mastered
            </span>
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              {counts.learned} learning
            </span>
          </div>
          <div style={{ height: 5, backgroundColor: 'var(--border)', borderRadius: 3, overflow: 'hidden' }}>
            <div style={{ display: 'flex', height: '100%' }}>
              <div style={{
                width: `${(counts.mastered / counts.total) * 100}%`,
                backgroundColor: 'var(--accent)', transition: 'width 400ms ease',
              }} />
              <div style={{
                width: `${(counts.learned / counts.total) * 100}%`,
                backgroundColor: STATUS_COLORS['learning'], transition: 'width 400ms ease',
              }} />
            </div>
          </div>
        </div>

        {/* Legend */}
        <div style={{ display: 'flex', gap: 12, flexShrink: 0 }}>
          {STATUS_CYCLE.filter((s) => s !== 'unlearned').map((s) => (
            <button
              key={s}
              onClick={() => setFilterStatus(filterStatus === s ? null : s)}
              style={{
                display: 'flex', alignItems: 'center', gap: 5,
                fontSize: 11, color: filterStatus === s ? STATUS_COLORS[s] : 'var(--text-muted)',
                background: 'none', border: 'none', cursor: 'pointer',
                opacity: filterStatus && filterStatus !== s ? 0.4 : 1,
                transition: 'all 150ms',
              }}
            >
              <span style={{
                width: 8, height: 8, borderRadius: '50%',
                backgroundColor: STATUS_COLORS[s], display: 'inline-block',
              }} />
              {STATUS_LABELS[s]}
            </button>
          ))}
        </div>
      </div>

      {/* Group filter chips */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 20 }}>
        <button
          onClick={() => setGroup(null)}
          style={{
            padding: '4px 12px', borderRadius: 20,
            border: `1px solid ${!group ? 'var(--accent)' : 'var(--border)'}`,
            backgroundColor: !group ? 'rgba(34,211,238,0.1)' : 'transparent',
            color: !group ? 'var(--accent)' : 'var(--text-muted)',
            fontSize: 12, fontWeight: 500, cursor: 'pointer',
            transition: 'all 150ms',
          }}
        >
          All
        </button>
        {groups.map((g) => (
          <button
            key={g}
            onClick={() => setGroup(group === g ? null : g)}
            style={{
              padding: '4px 12px', borderRadius: 20,
              border: `1px solid ${group === g ? 'var(--accent)' : 'var(--border)'}`,
              backgroundColor: group === g ? 'rgba(34,211,238,0.1)' : 'transparent',
              color: group === g ? 'var(--accent)' : 'var(--text-muted)',
              fontSize: 12, fontWeight: 500, cursor: 'pointer',
              transition: 'all 150ms',
            }}
          >
            {g}
          </button>
        ))}
      </div>

      {/* Count */}
      <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 14 }}>
        {cases.length} case{cases.length !== 1 ? 's' : ''}
      </div>

      {/* Grid */}
      <motion.div
        layout
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
          gap: 10,
        }}
      >
        <AnimatePresence mode="popLayout">
          {cases.map((c, i) => (
            <motion.div key={c.id} style={{ animationDelay: `${i * 0.02}s` }}>
              <AlgCard
                c={c}
                status={statusMap[c.id] ?? 'unlearned'}
                onToggle={cycleStatus}
                onClick={setSelected}
              />
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>

      {/* Detail modal */}
      <AnimatePresence>
        {selected && (
          <DetailModal
            c={selected}
            status={statusMap[selected.id] ?? 'unlearned'}
            onToggle={cycleStatus}
            onClose={() => setSelected(null)}
          />
        )}
      </AnimatePresence>

      {/* Drill mode overlay */}
      <AnimatePresence>
        {drillActive && (
          <DrillMode
            cases={cases}
            statusMap={statusMap}
            onStatusChange={setStatus}
            onClose={() => setDrillActive(false)}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
