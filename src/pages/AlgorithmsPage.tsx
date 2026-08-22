import { useState, useMemo, useCallback, useEffect, memo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CubeViz } from '@/components/algs/CubeViz'
import { SOURCES } from '@/data/algData'
import type { AlgCase, AlgSubset, AlgEvent } from '@/data/algData'
import { useAuth } from '@/providers/AuthProvider'

// ─── Constants ────────────────────────────────────────────────────────────────
const LS_KEY = (uid: string) => `cubearena:alg-status:${uid}`

type Status = 'unlearned' | 'learning' | 'mastered'

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

const EVENT_SUBSETS: Record<AlgEvent, AlgSubset[]> = {
  '222': ['CLL', 'OrtegaOLL', 'OrtegaPLL'],
  '333': ['OLL', 'PLL', 'F2L', 'COLL'],
  '444': ['OLLParity', 'PLLParity'],
  '555': ['OLLParity', 'PLLParity'],
  '666': ['OLLParity', 'PLLParity'],
  '777': ['OLLParity', 'PLLParity'],
}

const EVENT_LABELS: Record<AlgEvent, string> = {
  '222': '2×2',
  '333': '3×3',
  '444': '4×4',
  '555': '5×5',
  '666': '6×6',
  '777': '7×7',
}

// ─── Persistence ──────────────────────────────────────────────────────────────
function loadStatus(uid: string): Record<string, Status> {
  try { return JSON.parse(localStorage.getItem(LS_KEY(uid)) ?? '{}') as Record<string, Status> }
  catch { return {} }
}

function saveStatus(uid: string, s: Record<string, Status>) {
  try { localStorage.setItem(LS_KEY(uid), JSON.stringify(s)) } catch { /* ignore */ }
}

// ─── Filter cases by event (for OLLParity / PLLParity which span events) ─────
function filterByEvent(cases: AlgCase[], event: AlgEvent): AlgCase[] {
  // OLLParity/PLLParity include cases for all big cubes — filter by event
  if (cases.length > 0 && (cases[0].subset === 'OLLParity' || cases[0].subset === 'PLLParity')) {
    return cases.filter(c => c.event === event)
  }
  return cases
}

// ─── AlgCard ──────────────────────────────────────────────────────────────────
const AlgCard = memo(function AlgCard({
  c,
  status,
  onToggle,
  onClick,
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
        border: '1px solid var(--border)',
        borderRadius: 10,
        padding: 12,
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        cursor: 'pointer',
        position: 'relative',
        transition: 'border-color 150ms',
        width: '100%',
        boxSizing: 'border-box',
      }}
    >
      {/* Status dot */}
      <button
        onClick={(e) => { e.stopPropagation(); onToggle(c.id) }}
        title={STATUS_LABELS[status]}
        aria-label={`Status: ${STATUS_LABELS[status]}`}
        style={{
          position: 'absolute', top: 8, right: 8,
          width: 10, height: 10, borderRadius: '50%',
          backgroundColor: STATUS_COLORS[status],
          border: '1.5px solid var(--surface-1)',
          cursor: 'pointer', padding: 0,
          transition: 'background-color 200ms, transform 150ms',
        }}
        onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.transform = 'scale(1.5)' }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.transform = 'scale(1)' }}
      />

      {/* Cube visual */}
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <CubeViz alg={c.alg} subset={c.subset} event={c.event} size={90} />
      </div>

      {/* Name + alg */}
      <div>
        <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 3 }}>
          {c.name}
        </div>
        <div
          style={{
            fontSize: 10,
            fontFamily: "'JetBrains Mono', monospace",
            color: 'var(--text-muted)',
            lineHeight: 1.5,
            wordBreak: 'break-all',
            opacity: 0.85,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {c.alg || '—'}
        </div>
      </div>
    </motion.div>
  )
})

// ─── DetailModal ──────────────────────────────────────────────────────────────
function DetailModal({
  c,
  status,
  onToggle,
  onClose,
}: {
  c: AlgCase
  status: Status
  onToggle: (id: string) => void
  onClose: () => void
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
        backgroundColor: 'rgba(0,0,0,0.65)',
        backdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 24,
      }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 12 }}
        transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
        onClick={(e) => e.stopPropagation()}
        style={{
          backgroundColor: 'var(--surface-0)',
          border: '1px solid var(--border)',
          borderRadius: 16,
          padding: 28,
          maxWidth: 460,
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          gap: 20,
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-primary)' }}>{c.name}</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 3 }}>
              {c.group} · {c.subset}
              {c.probability && <span style={{ marginLeft: 8 }}>· P = {c.probability}</span>}
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              width: 28, height: 28, borderRadius: 6,
              border: '1px solid var(--border)',
              backgroundColor: 'transparent',
              color: 'var(--text-muted)',
              cursor: 'pointer', fontSize: 18,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            ×
          </button>
        </div>

        {/* Cube viz */}
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <CubeViz alg={c.alg} subset={c.subset} event={c.event} size={160} />
        </div>

        {/* Algorithm */}
        <div style={{ backgroundColor: 'var(--surface-1)', borderRadius: 8, padding: '10px 14px' }}>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 5, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Algorithm
          </div>
          <div style={{
            fontSize: 13,
            fontFamily: "'JetBrains Mono', monospace",
            color: 'var(--text-primary)',
            lineHeight: 1.6,
            userSelect: 'text',
          }}>
            {c.alg || '(none — solved!)'}
          </div>
        </div>

        {/* Alt algs */}
        {c.altAlgs && c.altAlgs.length > 0 && (
          <div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 6, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Alternative
            </div>
            {c.altAlgs.map((a, i) => (
              <div
                key={i}
                style={{
                  fontSize: 12,
                  fontFamily: "'JetBrains Mono', monospace",
                  color: 'var(--text-muted)',
                  lineHeight: 1.6,
                  marginBottom: 4,
                  userSelect: 'text',
                }}
              >
                {a}
              </div>
            ))}
          </div>
        )}

        {/* Status buttons */}
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
              onMouseEnter={(e) => {
                if (status !== s) (e.currentTarget as HTMLElement).style.borderColor = STATUS_COLORS[s]
              }}
              onMouseLeave={(e) => {
                if (status !== s) (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)'
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

// ─── DrillMode ────────────────────────────────────────────────────────────────
function buildDrillQueue(cases: AlgCase[], statusMap: Record<string, Status>): AlgCase[] {
  const weights: Record<Status, number> = { unlearned: 4, learning: 2, mastered: 1 }
  const pool: AlgCase[] = []
  for (const c of cases) {
    const w = weights[statusMap[c.id] ?? 'unlearned']
    for (let i = 0; i < w; i++) pool.push(c)
  }
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[pool[i], pool[j]] = [pool[j], pool[i]]
  }
  return pool
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

  const masteredCount = useMemo(
    () => queue.filter(c => (statusMap[c.id] ?? 'unlearned') === 'mastered').length,
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

  if (cases.length === 0) {
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
        }}
      >
        <div style={{
          backgroundColor: 'var(--surface-0)', border: '1px solid var(--border)',
          borderRadius: 20, padding: 40, textAlign: 'center',
        }}>
          <div style={{ fontSize: 16, color: 'var(--text-muted)', marginBottom: 16 }}>No cases to drill.</div>
          <button
            onClick={onClose}
            style={{
              padding: '10px 28px', borderRadius: 10, border: 'none',
              backgroundColor: 'var(--accent)', color: '#000', fontSize: 14, fontWeight: 700, cursor: 'pointer',
            }}
          >
            Close
          </button>
        </div>
      </motion.div>
    )
  }

  const current = queue[index]
  const total = queue.length

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{
        position: 'fixed', inset: 0, zIndex: 400,
        backgroundColor: 'rgba(0,0,0,0.88)',
        backdropFilter: 'blur(8px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 24,
      }}
    >
      <div style={{
        maxWidth: 440, width: '100%',
        backgroundColor: 'var(--surface-0)',
        border: '1px solid var(--border)',
        borderRadius: 20,
        padding: 28,
        display: 'flex', flexDirection: 'column', gap: 20,
      }}>
        {/* Top row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
            Drill
          </span>
          <button
            onClick={onClose}
            style={{
              width: 28, height: 28, borderRadius: 6,
              border: '1px solid var(--border)',
              backgroundColor: 'transparent',
              color: 'var(--text-muted)', cursor: 'pointer', fontSize: 18,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            ×
          </button>
        </div>

        {done ? (
          /* Completion screen */
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20, padding: '12px 0' }}>
            <div style={{
              width: 60, height: 60, borderRadius: '50%',
              border: '2px solid var(--accent)',
              backgroundColor: 'var(--accent-dim)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 28,
            }}>
              ★
            </div>
            <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-primary)', textAlign: 'center' }}>
              Drill complete!
            </div>
            <div style={{ fontSize: 14, color: 'var(--text-muted)', textAlign: 'center' }}>
              <span style={{ color: 'var(--accent)', fontWeight: 700 }}>{masteredCount}</span>
              {' / '}{total} mastered this session
            </div>
            <button
              onClick={onClose}
              style={{
                padding: '10px 32px', borderRadius: 10, border: 'none',
                backgroundColor: 'var(--accent)', color: '#000', fontSize: 14, fontWeight: 700, cursor: 'pointer',
              }}
            >
              Done
            </button>
          </div>
        ) : (
          <>
            {/* Progress bar */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 6 }}>
                <span style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: "'JetBrains Mono', monospace" }}>
                  {index + 1} / {total}
                </span>
              </div>
              <div style={{ height: 3, backgroundColor: 'var(--border)', borderRadius: 2, overflow: 'hidden' }}>
                <motion.div
                  animate={{ width: `${((index + 1) / total) * 100}%` }}
                  transition={{ duration: 0.3, ease: 'easeOut' }}
                  style={{
                    height: '100%',
                    backgroundColor: 'var(--accent)',
                    borderRadius: 2,
                  }}
                />
              </div>
            </div>

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
                  <CubeViz alg={current.alg} subset={current.subset} event={current.event} size={160} />

                  {/* Case info */}
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-primary)' }}>
                      {current.name}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
                      {current.group} · {current.subset}
                    </div>
                  </div>

                  {/* Reveal or revealed content */}
                  {!revealed ? (
                    <button
                      onClick={() => setRevealed(true)}
                      style={{
                        width: '100%', padding: '12px 0', borderRadius: 10,
                        border: '1.5px solid var(--accent)',
                        backgroundColor: 'rgba(34,211,238,0.08)',
                        color: 'var(--accent)', fontSize: 14, fontWeight: 700, cursor: 'pointer',
                        transition: 'background-color 150ms',
                      }}
                      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.backgroundColor = 'rgba(34,211,238,0.16)' }}
                      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.backgroundColor = 'rgba(34,211,238,0.08)' }}
                      onMouseDown={e => { (e.currentTarget as HTMLElement).style.transform = 'scale(0.97)' }}
                      onMouseUp={e => { (e.currentTarget as HTMLElement).style.transform = 'scale(1)' }}
                    >
                      Reveal
                    </button>
                  ) : (
                    <motion.div
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 12 }}
                    >
                      {/* Algorithm text */}
                      <div style={{ backgroundColor: 'var(--surface-1)', borderRadius: 8, padding: '10px 14px' }}>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4, fontWeight: 500 }}>
                          Algorithm
                        </div>
                        <div style={{
                          fontSize: 13,
                          fontFamily: "'JetBrains Mono', monospace",
                          color: 'var(--text-primary)',
                          lineHeight: 1.6,
                          userSelect: 'text',
                        }}>
                          {current.alg || '(none — solved!)'}
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button
                          onClick={handleGotIt}
                          style={{
                            flex: 1, padding: '10px 0', borderRadius: 10,
                            border: '1.5px solid var(--accent)',
                            backgroundColor: 'rgba(34,211,238,0.1)',
                            color: 'var(--accent)', fontSize: 13, fontWeight: 700, cursor: 'pointer',
                            transition: 'background-color 150ms',
                          }}
                          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.backgroundColor = 'rgba(34,211,238,0.2)' }}
                          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.backgroundColor = 'rgba(34,211,238,0.1)' }}
                          onMouseDown={e => { (e.currentTarget as HTMLElement).style.transform = 'scale(0.97)' }}
                          onMouseUp={e => { (e.currentTarget as HTMLElement).style.transform = 'scale(1)' }}
                        >
                          Got it
                        </button>
                        <button
                          onClick={handleNeedsWork}
                          style={{
                            flex: 1, padding: '10px 0', borderRadius: 10,
                            border: '1.5px solid #f59e0b',
                            backgroundColor: 'rgba(245,158,11,0.1)',
                            color: '#f59e0b', fontSize: 13, fontWeight: 700, cursor: 'pointer',
                            transition: 'background-color 150ms',
                          }}
                          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.backgroundColor = 'rgba(245,158,11,0.2)' }}
                          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.backgroundColor = 'rgba(245,158,11,0.1)' }}
                          onMouseDown={e => { (e.currentTarget as HTMLElement).style.transform = 'scale(0.97)' }}
                          onMouseUp={e => { (e.currentTarget as HTMLElement).style.transform = 'scale(1)' }}
                        >
                          Needs work
                        </button>
                        <button
                          onClick={advance}
                          style={{
                            padding: '10px 14px', borderRadius: 10,
                            border: '1px solid var(--border)',
                            backgroundColor: 'transparent',
                            color: 'var(--text-muted)', fontSize: 13, fontWeight: 600, cursor: 'pointer',
                            transition: 'background-color 150ms',
                          }}
                          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.backgroundColor = 'var(--surface-1)' }}
                          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent' }}
                          onMouseDown={e => { (e.currentTarget as HTMLElement).style.transform = 'scale(0.97)' }}
                          onMouseUp={e => { (e.currentTarget as HTMLElement).style.transform = 'scale(1)' }}
                        >
                          Skip
                        </button>
                      </div>
                    </motion.div>
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
export function AlgorithmsPage() {
  const { user } = useAuth()
  const uid = user?.uid ?? 'local'

  const [event, setEvent] = useState<AlgEvent>('333')
  const [subset, setSubset] = useState<AlgSubset>('OLL')
  const [group, setGroup] = useState<string | null>(null)
  const [statusMap, setStatusMap] = useState<Record<string, Status>>(() => loadStatus(uid))
  const [selected, setSelected] = useState<AlgCase | null>(null)
  const [filterStatus, setFilterStatus] = useState<Status | null>(null)
  const [drillActive, setDrillActive] = useState(false)

  const eventSubsets = EVENT_SUBSETS[event]

  const handleEventChange = (ev: AlgEvent) => {
    setEvent(ev)
    const subs = EVENT_SUBSETS[ev]
    setSubset(subs[0])
    setGroup(null)
    setFilterStatus(null)
  }

  const handleSubsetChange = (s: AlgSubset) => {
    setSubset(s)
    setGroup(null)
    setFilterStatus(null)
  }

  // Raw cases for this subset, filtered by event (for parity sets)
  const rawCases = useMemo(() => {
    return filterByEvent(SOURCES[subset], event)
  }, [subset, event])

  const groups = useMemo(() => {
    const src = rawCases
    return [...new Set(src.map((c) => c.group))]
  }, [rawCases])

  const cases = useMemo(() => {
    let list = rawCases
    if (group) list = list.filter((c) => c.group === group)
    if (filterStatus) list = list.filter((c) => (statusMap[c.id] ?? 'unlearned') === filterStatus)
    return list
  }, [rawCases, group, filterStatus, statusMap])

  const counts = useMemo(() => {
    const src = rawCases
    const mastered = src.filter((c) => (statusMap[c.id] ?? 'unlearned') === 'mastered').length
    const learning = src.filter((c) => (statusMap[c.id] ?? 'unlearned') === 'learning').length
    return { total: src.length, learning, mastered }
  }, [rawCases, statusMap])

  const cycleStatus = useCallback((id: string) => {
    setStatusMap((prev) => {
      const cur: Status = (prev[id] as Status | undefined) ?? 'unlearned'
      const idx = STATUS_CYCLE.indexOf(cur)
      const next: Status = STATUS_CYCLE[(idx + 1) % STATUS_CYCLE.length]
      const updated = { ...prev, [id]: next }
      saveStatus(uid, updated)
      return updated
    })
  }, [uid])

  const setStatus = useCallback((id: string, s: Status) => {
    setStatusMap((prev) => {
      const updated = { ...prev, [id]: s }
      saveStatus(uid, updated)
      return updated
    })
  }, [uid])

  return (
    <div style={{ padding: '28px 32px', maxWidth: 1200, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, color: 'var(--text-primary)', margin: 0, letterSpacing: '-0.02em' }}>
          Algorithm Trainer
        </h1>
        <p style={{ fontSize: 14, color: 'var(--text-muted)', marginTop: 5, margin: 0 }}>
          Learn and drill WCA algorithms across all events.
        </p>
      </div>

      {/* Event pills */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 16, flexWrap: 'wrap' }}>
        {(Object.keys(EVENT_SUBSETS) as AlgEvent[]).map((ev) => (
          <button
            key={ev}
            onClick={() => handleEventChange(ev)}
            style={{
              padding: '6px 18px', borderRadius: 8,
              border: `1px solid ${event === ev ? 'var(--accent)' : 'var(--border)'}`,
              backgroundColor: event === ev ? 'rgba(34,211,238,0.12)' : 'transparent',
              color: event === ev ? 'var(--accent)' : 'var(--text-muted)',
              fontSize: 13, fontWeight: event === ev ? 700 : 500, cursor: 'pointer',
              transition: 'all 150ms',
            }}
          >
            {EVENT_LABELS[ev]}
          </button>
        ))}
      </div>

      {/* Subset pills + Drill button */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 20, alignItems: 'center', flexWrap: 'wrap' }}>
        {eventSubsets.map((s) => (
          <button
            key={s}
            onClick={() => handleSubsetChange(s)}
            style={{
              padding: '7px 20px', borderRadius: 8, border: 'none',
              backgroundColor: subset === s ? 'var(--accent)' : 'var(--surface-1)',
              color: subset === s ? '#000' : 'var(--text-muted)',
              fontSize: 13, fontWeight: 700, cursor: 'pointer',
              transition: 'all 150ms',
            }}
          >
            {s}
          </button>
        ))}

        <button
          onClick={() => setDrillActive(true)}
          disabled={rawCases.filter(c => c.alg !== '').length === 0}
          style={{
            marginLeft: 'auto',
            padding: '7px 20px', borderRadius: 8,
            border: '1.5px solid var(--accent)',
            backgroundColor: 'rgba(34,211,238,0.08)',
            color: 'var(--accent)',
            fontSize: 13, fontWeight: 700, cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 6,
            transition: 'background-color 150ms',
            opacity: rawCases.filter(c => c.alg !== '').length === 0 ? 0.4 : 1,
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.backgroundColor = 'rgba(34,211,238,0.16)' }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.backgroundColor = 'rgba(34,211,238,0.08)' }}
          onMouseDown={e => { (e.currentTarget as HTMLElement).style.transform = 'scale(0.97)' }}
          onMouseUp={e => { (e.currentTarget as HTMLElement).style.transform = 'scale(1)' }}
        >
          <span style={{ fontSize: 15 }}>⚡</span>
          Drill
        </button>
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
              <span style={{ color: 'var(--accent)', fontWeight: 600 }}>{counts.mastered}</span>
              /{counts.total} mastered
            </span>
            <span style={{ fontSize: 12, color: '#f59e0b' }}>
              {counts.learning} learning
            </span>
          </div>
          <div style={{ height: 5, backgroundColor: 'var(--border)', borderRadius: 3, overflow: 'hidden' }}>
            <div style={{ display: 'flex', height: '100%' }}>
              <motion.div
                animate={{ width: counts.total > 0 ? `${(counts.mastered / counts.total) * 100}%` : '0%' }}
                transition={{ duration: 0.4, ease: 'easeOut' }}
                style={{ height: '100%', backgroundColor: 'var(--accent)' }}
              />
              <motion.div
                animate={{ width: counts.total > 0 ? `${(counts.learning / counts.total) * 100}%` : '0%' }}
                transition={{ duration: 0.4, ease: 'easeOut' }}
                style={{ height: '100%', backgroundColor: '#f59e0b' }}
              />
            </div>
          </div>
        </div>

        {/* Status filter legend */}
        <div style={{ display: 'flex', gap: 10, flexShrink: 0 }}>
          {STATUS_CYCLE.filter((s) => s !== 'unlearned').map((s) => (
            <button
              key={s}
              onClick={() => setFilterStatus(filterStatus === s ? null : s)}
              style={{
                display: 'flex', alignItems: 'center', gap: 5,
                fontSize: 11, color: filterStatus === s ? STATUS_COLORS[s] : 'var(--text-muted)',
                background: 'none', border: 'none', cursor: 'pointer',
                opacity: filterStatus && filterStatus !== s ? 0.4 : 1,
                transition: 'all 150ms', padding: '2px 4px', borderRadius: 4,
              }}
            >
              <span style={{
                width: 8, height: 8, borderRadius: '50%',
                backgroundColor: STATUS_COLORS[s], display: 'inline-block', flexShrink: 0,
              }} />
              {STATUS_LABELS[s]}
            </button>
          ))}
        </div>
      </div>

      {/* Group filter chips */}
      {groups.length > 1 && (
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 16 }}>
          <button
            onClick={() => setGroup(null)}
            style={{
              padding: '4px 14px', borderRadius: 20,
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
                padding: '4px 14px', borderRadius: 20,
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
      )}

      {/* Case count */}
      <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 14 }}>
        {cases.length} case{cases.length !== 1 ? 's' : ''}
      </div>

      {/* Card grid */}
      <motion.div
        layout
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
          gap: 10,
        }}
      >
        <AnimatePresence mode="popLayout">
          {cases.map((c) => (
            <AlgCard
              key={c.id}
              c={c}
              status={(statusMap[c.id] as Status | undefined) ?? 'unlearned'}
              onToggle={cycleStatus}
              onClick={setSelected}
            />
          ))}
        </AnimatePresence>
      </motion.div>

      {cases.length === 0 && (
        <div style={{
          textAlign: 'center', padding: '60px 20px',
          color: 'var(--text-muted)', fontSize: 14,
        }}>
          No cases match the current filter.
        </div>
      )}

      {/* Detail modal */}
      <AnimatePresence>
        {selected && (
          <DetailModal
            c={selected}
            status={(statusMap[selected.id] as Status | undefined) ?? 'unlearned'}
            onToggle={cycleStatus}
            onClose={() => setSelected(null)}
          />
        )}
      </AnimatePresence>

      {/* Drill mode overlay */}
      <AnimatePresence>
        {drillActive && (
          <DrillMode
            cases={cases.filter(c => c.alg !== '')}
            statusMap={statusMap}
            onStatusChange={setStatus}
            onClose={() => setDrillActive(false)}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
