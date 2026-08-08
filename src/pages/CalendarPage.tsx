import { useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useCalendar } from '@/hooks/useCalendar'
import { useReminders } from '@/hooks/useReminders'
import { formatTime } from '@/lib/utils'
import type { DayActivity, PlannedSession, WCAEvent } from '@/types'

// ─── Constants ───────────────────────────────────────────────────────────────

const EVENT_LABELS: Record<WCAEvent, string> = {
  '333': '3×3', '222': '2×2', '444': '4×4', '555': '5×5',
  '666': '6×6', '777': '7×7', '333bf': '3×3 BLD', '333oh': '3×3 OH',
  '333fm': 'FMC', clock: 'Clock', minx: 'Megaminx', pyram: 'Pyraminx',
  skewb: 'Skewb', sq1: 'Square-1', '444bf': '4×4 BLD', '555bf': '5×5 BLD',
}
const WCA_EVENTS: WCAEvent[] = [
  '333','222','444','555','666','777','333bf','333oh','333fm',
  'clock','minx','pyram','skewb','sq1','444bf','555bf',
]
const DAY_LABELS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']
const MONTH_NAMES = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
]
const DURATION_OPTIONS = [30, 45, 60, 90, 120]

// ─── Utilities ───────────────────────────────────────────────────────────────

function toDateKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
}

function todayKey(): string {
  return toDateKey(new Date())
}

function getMonthGrid(year: number, month: number): (Date | null)[] {
  const first = new Date(year, month, 1)
  const last = new Date(year, month + 1, 0)
  const grid: (Date | null)[] = []
  for (let i = 0; i < first.getDay(); i++) grid.push(null)
  for (let d = 1; d <= last.getDate(); d++) grid.push(new Date(year, month, d))
  while (grid.length % 7 !== 0) grid.push(null)
  return grid
}

function formatDayHeading(dateKey: string): string {
  const [y, m, d] = dateKey.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric',
  })
}

function parsePlanTime(s: string): number | null {
  const t = s.trim()
  const colonMatch = t.match(/^(\d{1,2}):(\d{2})(?:\.(\d{1,3}))?$/)
  if (colonMatch) {
    const mins = parseInt(colonMatch[1], 10)
    const secs = parseInt(colonMatch[2], 10)
    if (secs >= 60) return null
    const frac = parseFloat(`0.${(colonMatch[3] ?? '0').padEnd(3, '0')}`) * 1000
    return mins * 60_000 + secs * 1000 + Math.round(frac)
  }
  const secMatch = t.match(/^(\d{1,3})(?:\.(\d{1,3}))?$/)
  if (secMatch) {
    const secs = parseInt(secMatch[1], 10)
    const frac = parseFloat(`0.${(secMatch[2] ?? '0').padEnd(3, '0')}`) * 1000
    return secs * 1000 + Math.round(frac)
  }
  return null
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function StreakBadge({ streak }: { streak: number }) {
  const hot = streak >= 7
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 5,
      padding: '3px 10px', borderRadius: 20,
      border: `1px solid ${hot ? 'var(--inspection)' : 'var(--border)'}`,
      backgroundColor: hot ? 'rgba(245,158,11,0.12)' : 'var(--surface-1)',
      fontSize: 12, fontWeight: 600,
      color: hot ? 'var(--inspection)' : 'var(--text-muted)',
    }}>
      {/* Flame icon */}
      <svg width="10" height="13" viewBox="0 0 10 13" fill="none" aria-hidden="true">
        <path
          d="M5 0.5C5 0.5 2.5 3.5 2.5 6C2.5 7.66 3.62 9 5 9C6.38 9 7.5 7.66 7.5 6C7.5 4.5 6.5 3.5 6.5 3.5C6.5 3.5 6 5 5 5C4 5 3.5 4 3.5 3.5C3.5 3.5 5 2 5 0.5Z"
          fill="currentColor" opacity="0.7"
        />
        <path
          d="M5 12.5C7.21 12.5 9 10.98 9 9.17C9 7.33 7.5 6.33 7.5 6.33C7.5 6.33 7 7.5 5.5 7.5C4 7.5 3.5 6.33 3.5 6.33C3.5 6.33 1 7.33 1 9.17C1 10.98 2.79 12.5 5 12.5Z"
          fill="currentColor"
        />
      </svg>
      {streak} {streak === 1 ? 'day' : 'days'}
    </div>
  )
}

function ConsistencyChart({ data }: { data: number[] }) {
  const max = Math.max(...data, 1)
  return (
    <div style={{ display: 'flex', gap: 3, alignItems: 'flex-end', height: 36 }}>
      {data.map((count, i) => {
        const isCurrentWeek = i === data.length - 1
        const heightPct = count > 0 ? Math.max((count / max) * 100, 12) : 4
        return (
          <div
            key={i}
            title={`${count} solve${count !== 1 ? 's' : ''}`}
            style={{
              flex: 1,
              height: `${heightPct}%`,
              borderRadius: 2,
              backgroundColor: isCurrentWeek
                ? 'var(--accent)'
                : count > 0
                ? 'rgba(34,211,238,0.35)'
                : 'var(--surface-1)',
              transition: 'height 300ms ease',
            }}
          />
        )
      })}
    </div>
  )
}

// ─── DayCell ─────────────────────────────────────────────────────────────────

interface DayCellProps {
  gridDate: Date | null
  isToday: boolean
  isSelected: boolean
  plans: PlannedSession[]
  hasActivity: boolean
  onClick: () => void
}

function DayCell({ gridDate, isToday, isSelected, plans, hasActivity, onClick }: DayCellProps) {
  if (!gridDate) return <div aria-hidden="true" style={{ minHeight: 64 }} />

  const hasPlan = plans.length > 0
  const visiblePlans = plans.slice(0, 2)
  const overflowCount = plans.length - visiblePlans.length

  return (
    <button
      onClick={onClick}
      aria-label={gridDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}
      aria-pressed={isSelected}
      style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'flex-start', paddingTop: 6, paddingBottom: 4, gap: 3,
        minHeight: 64,
        background: isSelected ? 'var(--accent-dim)' : 'none',
        border: `1px solid ${isSelected ? 'var(--accent)' : 'transparent'}`,
        borderRadius: 8,
        cursor: 'pointer',
        transition: 'background 150ms ease, border-color 150ms ease',
        overflow: 'hidden',
        width: '100%',
      }}
    >
      {/* Date number */}
      <span style={{
        width: 28, height: 28, flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        borderRadius: '50%',
        fontSize: 13,
        fontWeight: isToday ? 700 : 400,
        color: isToday ? '#020617' : isSelected ? 'var(--accent)' : 'var(--text-primary)',
        backgroundColor: isToday ? 'var(--accent)' : 'transparent',
      }}>
        {gridDate.getDate()}
      </span>

      {/* Plan pills */}
      {hasPlan && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2, width: '100%', padding: '0 3px' }}>
          {visiblePlans.map((plan) => {
            const done = plan.completedAt !== null
            const timeLabel = new Date(plan.scheduledAt).toLocaleTimeString('en-US', {
              hour: 'numeric', minute: '2-digit',
            })
            const label = EVENT_LABELS[plan.event]
            return (
              <div
                key={plan.id}
                style={{
                  display: 'flex', alignItems: 'center', gap: 2,
                  background: done ? 'rgba(34,211,238,0.04)' : 'var(--accent-dim)',
                  border: `1px solid ${done ? 'rgba(34,211,238,0.15)' : 'var(--accent)'}`,
                  borderRadius: 4,
                  fontSize: 10,
                  padding: '2px 5px',
                  color: done ? 'var(--text-muted)' : 'var(--accent)',
                  overflow: 'hidden',
                  whiteSpace: 'nowrap',
                  textOverflow: 'ellipsis',
                  minWidth: 0,
                }}
              >
                {done && (
                  <svg width="8" height="7" viewBox="0 0 8 7" fill="none" aria-hidden="true" style={{ flexShrink: 0 }}>
                    <path d="M1 3.5L3 5.5L7 1" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {timeLabel} {label}
                </span>
              </div>
            )
          })}
          {overflowCount > 0 && (
            <div style={{
              fontSize: 9, color: 'var(--text-muted)',
              paddingLeft: 5, lineHeight: '14px',
            }}>
              +{overflowCount} more
            </div>
          )}
        </div>
      )}

      {/* Activity dot (only when there's no plan, or always show separately) */}
      {hasActivity && (
        <span style={{
          width: 5, height: 5, borderRadius: '50%',
          backgroundColor: 'var(--positive)',
          flexShrink: 0,
        }} />
      )}
    </button>
  )
}

// ─── PlanCard ────────────────────────────────────────────────────────────────

function PlanCard({
  plan,
  onMarkComplete,
  onDelete,
}: {
  plan: PlannedSession
  onMarkComplete: (id: string) => void
  onDelete: (id: string) => void
}) {
  const done = plan.completedAt !== null
  const timeLabel = new Date(plan.scheduledAt).toLocaleTimeString('en-US', {
    hour: 'numeric', minute: '2-digit',
  })

  return (
    <div style={{
      display: 'flex', alignItems: 'flex-start', gap: 10,
      padding: '11px 14px',
      backgroundColor: 'var(--surface-1)',
      border: `1px solid ${done ? 'var(--positive)' : 'var(--border)'}`,
      borderRadius: 8,
      opacity: done ? 0.65 : 1,
      transition: 'opacity 200ms ease, border-color 200ms ease',
    }}>
      {/* Checkbox */}
      <button
        onClick={() => { if (!done) onMarkComplete(plan.id) }}
        aria-label={done ? 'Completed' : 'Mark as complete'}
        style={{
          width: 18, height: 18, flexShrink: 0, marginTop: 2,
          borderRadius: 4,
          border: `1.5px solid ${done ? 'var(--positive)' : 'var(--border)'}`,
          backgroundColor: done ? 'var(--positive)' : 'transparent',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: done ? 'default' : 'pointer',
          transition: 'background-color 150ms ease, border-color 150ms ease',
        }}
      >
        {done && (
          <svg width="10" height="8" viewBox="0 0 10 8" fill="none" aria-hidden="true">
            <path d="M1.5 4L3.5 6L8.5 1.5" stroke="#020617" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </button>

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: plan.goal || plan.targetTime ? 3 : 0 }}>
          <span style={{
            fontSize: 13, fontWeight: 700,
            color: 'var(--accent)',
            fontFamily: "'JetBrains Mono', monospace",
          }}>
            {EVENT_LABELS[plan.event]}
          </span>
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            {timeLabel} · {plan.durationMins} min
          </span>
        </div>
        {plan.goal && (
          <div style={{
            fontSize: 13, color: 'var(--text-muted)',
            textDecoration: done ? 'line-through' : 'none',
          }}>
            {plan.goal}
          </div>
        )}
        {plan.targetTime !== null && (
          <div style={{
            fontSize: 12, marginTop: 2,
            color: 'var(--inspection)',
            fontFamily: "'JetBrains Mono', monospace",
          }}>
            Target: {formatTime(plan.targetTime)}
          </div>
        )}
      </div>

      {/* Delete */}
      <button
        onClick={() => onDelete(plan.id)}
        aria-label="Remove plan"
        style={{ color: 'var(--text-muted)', opacity: 0.5, padding: 4, transition: 'opacity 150ms ease, color 150ms ease' }}
        onMouseOver={(e) => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.color = 'var(--penalty)' }}
        onMouseOut={(e) => { e.currentTarget.style.opacity = '0.5'; e.currentTarget.style.color = 'var(--text-muted)' }}
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
          <path d="M2 2l10 10M12 2L2 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </button>
    </div>
  )
}

// ─── DayPanel ────────────────────────────────────────────────────────────────

interface DayPanelProps {
  dateKey: string
  plans: PlannedSession[]
  activity: DayActivity | undefined
  onClose: () => void
  onAddPlan: () => void
  onMarkComplete: (id: string) => void
  onDeletePlan: (id: string) => void
}

function DayPanel({ dateKey, plans, activity, onClose, onAddPlan, onMarkComplete, onDeletePlan }: DayPanelProps) {
  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.15 }}
        onClick={onClose}
        style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(2,6,23,0.55)', zIndex: 200 }}
      />
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 32, stiffness: 320 }}
        style={{
          position: 'fixed', bottom: 0, left: 0, right: 0,
          backgroundColor: 'var(--surface-0)',
          borderTop: '1px solid var(--border)',
          borderTopLeftRadius: 16, borderTopRightRadius: 16,
          padding: '16px 20px 32px',
          maxHeight: '70dvh', overflowY: 'auto',
          zIndex: 201,
        }}
      >
        {/* Handle */}
        <div style={{
          width: 32, height: 4, borderRadius: 2,
          backgroundColor: 'var(--border)',
          margin: '0 auto 20px',
        }} />

        {/* Heading row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
          <h2 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>
            {formatDayHeading(dateKey)}
          </h2>
          <button
            onClick={onAddPlan}
            style={{
              display: 'flex', alignItems: 'center', gap: 5,
              padding: '5px 12px', borderRadius: 6,
              border: '1px solid var(--border)',
              backgroundColor: 'var(--surface-1)',
              color: 'var(--text-muted)',
              fontSize: 12, fontWeight: 600,
              cursor: 'pointer',
              transition: 'color 150ms ease, border-color 150ms ease',
            }}
            onMouseOver={(e) => { e.currentTarget.style.color = 'var(--accent)'; e.currentTarget.style.borderColor = 'var(--accent)' }}
            onMouseOut={(e) => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.borderColor = 'var(--border)' }}
          >
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true">
              <path d="M5 1v8M1 5h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            Add plan
          </button>
        </div>

        {/* Plans */}
        {plans.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: activity ? 16 : 0 }}>
            {plans.map((plan) => (
              <PlanCard key={plan.id} plan={plan} onMarkComplete={onMarkComplete} onDelete={onDeletePlan} />
            ))}
          </div>
        ) : (
          <div style={{
            textAlign: 'center', padding: '24px 0',
            fontSize: 14, color: 'var(--text-muted)',
            marginBottom: activity ? 16 : 0,
          }}>
            No sessions planned
          </div>
        )}

        {/* Activity summary */}
        {activity && activity.solveCount > 0 && (
          <div style={{
            padding: '12px 14px',
            backgroundColor: 'var(--surface-1)',
            border: '1px solid var(--border)',
            borderRadius: 8,
          }}>
            <div style={{
              fontSize: 10, fontWeight: 600,
              color: 'var(--text-muted)',
              textTransform: 'uppercase', letterSpacing: '0.08em',
              marginBottom: 10,
            }}>
              Actual results
            </div>
            <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
              <StatCell label="Solves" value={String(activity.solveCount)} mono />
              {activity.ao5 !== null && (
                <StatCell label="ao5" value={formatTime(activity.ao5)} mono />
              )}
              {activity.mean !== null && (
                <StatCell label="mean" value={formatTime(activity.mean)} mono />
              )}
            </div>
          </div>
        )}
      </motion.div>
    </>
  )
}

function StatCell({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 2 }}>{label}</div>
      <div style={{
        fontSize: 18, fontWeight: 700,
        fontFamily: mono ? "'JetBrains Mono', monospace" : undefined,
        color: 'var(--text-primary)',
      }}>
        {value}
      </div>
    </div>
  )
}

// ─── CreatePlanForm ───────────────────────────────────────────────────────────

interface CreatePlanFormProps {
  initialDate: string
  onConfirm: (draft: Omit<PlannedSession, 'id' | 'completedAt'>) => void
  onClose: () => void
}

function CreatePlanForm({ initialDate, onConfirm, onClose }: CreatePlanFormProps) {
  const [date, setDate] = useState(initialDate)
  const [time, setTime] = useState('09:00')
  const [durationMins, setDurationMins] = useState(60)
  const [event, setEvent] = useState<WCAEvent>('333')
  const [goal, setGoal] = useState('')
  const [targetTimeStr, setTargetTimeStr] = useState('')

  const targetTime = targetTimeStr.trim() ? parsePlanTime(targetTimeStr) : null
  const targetTimeValid = !targetTimeStr.trim() || targetTime !== null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!targetTimeValid) return
    const [y, m, d] = date.split('-').map(Number)
    const [h, min] = time.split(':').map(Number)
    const scheduledAt = new Date(y, m - 1, d, h, min).getTime()
    onConfirm({ scheduledAt, durationMins, event, goal: goal.trim() || null, targetTime })
    onClose()
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '8px 10px',
    borderRadius: 6, border: '1px solid var(--border)',
    backgroundColor: 'var(--surface-1)',
    color: 'var(--text-primary)',
    fontSize: 14, outline: 'none',
    transition: 'border-color 150ms ease',
  }

  const labelStyle: React.CSSProperties = {
    display: 'flex', flexDirection: 'column', gap: 5,
  }

  const labelTextStyle: React.CSSProperties = {
    fontSize: 12, fontWeight: 500, color: 'var(--text-muted)',
  }

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.15 }}
        onClick={onClose}
        style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(2,6,23,0.7)', zIndex: 300 }}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 12 }}
        transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
        style={{
          position: 'fixed',
          top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)',
          zIndex: 301,
          width: 'min(460px, calc(100vw - 32px))',
          maxHeight: 'calc(100dvh - 48px)',
          overflowY: 'auto',
          backgroundColor: 'var(--surface-0)',
          border: '1px solid var(--border)',
          borderRadius: 16,
          padding: '24px 20px',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h2 style={{ fontSize: 15, fontWeight: 700 }}>Schedule session</h2>
          <button
            onClick={onClose}
            aria-label="Close"
            style={{ color: 'var(--text-muted)', padding: 4 }}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
              <path d="M2 2l10 10M12 2L2 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Date + Time */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <label style={labelStyle}>
              <span style={labelTextStyle}>Date</span>
              <input type="date" required value={date} onChange={(e) => setDate(e.target.value)} style={inputStyle} />
            </label>
            <label style={labelStyle}>
              <span style={labelTextStyle}>Time</span>
              <input type="time" required value={time} onChange={(e) => setTime(e.target.value)} style={inputStyle} />
            </label>
          </div>

          {/* Duration + Event */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <label style={labelStyle}>
              <span style={labelTextStyle}>Duration</span>
              <select value={durationMins} onChange={(e) => setDurationMins(Number(e.target.value))} style={inputStyle}>
                {DURATION_OPTIONS.map((d) => (
                  <option key={d} value={d}>{d} min</option>
                ))}
              </select>
            </label>
            <label style={labelStyle}>
              <span style={labelTextStyle}>Event</span>
              <select value={event} onChange={(e) => setEvent(e.target.value as WCAEvent)} style={inputStyle}>
                {WCA_EVENTS.map((ev) => (
                  <option key={ev} value={ev}>{EVENT_LABELS[ev]}</option>
                ))}
              </select>
            </label>
          </div>

          {/* Goal */}
          <label style={labelStyle}>
            <span style={labelTextStyle}>
              Goal{' '}
              <span style={{ opacity: 0.45 }}>(optional)</span>
            </span>
            <input
              type="text"
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              placeholder="e.g. focus on F2L, work on lookahead"
              style={inputStyle}
            />
          </label>

          {/* Target time */}
          <label style={labelStyle}>
            <span style={labelTextStyle}>
              Target time{' '}
              <span style={{ opacity: 0.45 }}>(optional — e.g. 9.50 or 1:23.45)</span>
            </span>
            <input
              type="text"
              value={targetTimeStr}
              onChange={(e) => setTargetTimeStr(e.target.value)}
              placeholder="9.50"
              style={{
                ...inputStyle,
                fontFamily: "'JetBrains Mono', monospace",
                borderColor: targetTimeStr && !targetTimeValid ? 'var(--penalty)' : 'var(--border)',
                color: targetTimeStr && !targetTimeValid ? 'var(--penalty)' : 'var(--text-primary)',
              }}
            />
          </label>

          {/* Actions */}
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 4 }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '9px 20px', borderRadius: 8,
                border: '1px solid var(--border)',
                backgroundColor: 'var(--surface-1)',
                color: 'var(--text-muted)',
                fontSize: 13, fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!targetTimeValid}
              style={{
                padding: '9px 24px', borderRadius: 8,
                backgroundColor: targetTimeValid ? 'var(--accent)' : 'var(--surface-1)',
                color: targetTimeValid ? '#020617' : 'var(--text-muted)',
                fontSize: 13, fontWeight: 700,
                border: 'none',
                cursor: targetTimeValid ? 'pointer' : 'not-allowed',
                transition: 'background-color 150ms ease, color 150ms ease',
              }}
            >
              Schedule
            </button>
          </div>
        </form>
      </motion.div>
    </>
  )
}

// ─── CalendarPage ─────────────────────────────────────────────────────────────

export function CalendarPage() {
  const today = new Date()
  const [year, setYear] = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth())
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [showCreate, setShowCreate] = useState(false)
  const [createInitialDate, setCreateInitialDate] = useState(todayKey)
  const [notifPermission, setNotifPermission] = useState<NotificationPermission>(
    typeof Notification !== 'undefined' ? Notification.permission : 'denied'
  )

  const { activityByDay, plansByDay, plans, streak, weeklyFrequency, createPlan, deletePlan, markComplete } =
    useCalendar()

  useReminders(plans)

  const grid = useMemo(() => getMonthGrid(year, month), [year, month])
  const currentTodayKey = todayKey()

  const prevMonth = () => {
    if (month === 0) { setYear((y) => y - 1); setMonth(11) }
    else setMonth((m) => m - 1)
  }
  const nextMonth = () => {
    if (month === 11) { setYear((y) => y + 1); setMonth(0) }
    else setMonth((m) => m + 1)
  }

  const openCreate = (dateKey: string) => {
    setCreateInitialDate(dateKey)
    setShowCreate(true)
  }

  const selectedPlans = selectedDate ? (plansByDay.get(selectedDate) ?? []) : []
  const selectedActivity = selectedDate ? activityByDay.get(selectedDate) : undefined

  const requestNotifPermission = () => {
    if (typeof Notification === 'undefined') return
    Notification.requestPermission().then((perm) => {
      setNotifPermission(perm)
    }).catch(() => {
      // ignore
    })
  }

  const navBtnStyle: React.CSSProperties = {
    width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center',
    borderRadius: 6, border: '1px solid var(--border)',
    backgroundColor: 'var(--surface-1)', color: 'var(--text-muted)',
    cursor: 'pointer', transition: 'color 150ms ease',
    flexShrink: 0,
  }

  return (
    <div style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--bg)' }}>
      {/* Page header */}
      <div style={{
        padding: '24px 24px 0',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-primary)' }}>Calendar</h1>
          {streak > 0 && <StreakBadge streak={streak} />}
        </div>
        <button
          onClick={() => openCreate(currentTodayKey)}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '8px 16px', borderRadius: 8,
            backgroundColor: 'var(--accent)', color: '#020617',
            fontSize: 13, fontWeight: 700, border: 'none', cursor: 'pointer',
          }}
        >
          <svg width="11" height="11" viewBox="0 0 11 11" fill="none" aria-hidden="true">
            <path d="M5.5 1v9M1 5.5h9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          Schedule
        </button>
      </div>

      {/* Notification permission banner */}
      {notifPermission === 'default' && (
        <div style={{ padding: '6px 24px 0' }}>
          <button
            onClick={requestNotifPermission}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              padding: '5px 12px', borderRadius: 6,
              border: '1px solid var(--accent)',
              backgroundColor: 'var(--accent-dim)',
              color: 'var(--accent)',
              fontSize: 12, fontWeight: 600,
              cursor: 'pointer',
              transition: 'opacity 150ms ease',
            }}
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
              <path
                d="M6 1a3.5 3.5 0 0 0-3.5 3.5c0 1.8-.5 2.9-.9 3.5h8.8c-.4-.6-.9-1.7-.9-3.5A3.5 3.5 0 0 0 6 1ZM4.5 9a1.5 1.5 0 0 0 3 0"
                stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"
              />
            </svg>
            Enable reminders
          </button>
        </div>
      )}
      {notifPermission === 'denied' && (
        <div style={{ padding: '6px 24px 0' }}>
          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
            Reminders blocked in browser settings
          </span>
        </div>
      )}

      {/* Month navigation */}
      <div style={{ padding: '14px 24px 10px', display: 'flex', alignItems: 'center', gap: 10 }}>
        <button onClick={prevMonth} aria-label="Previous month" style={navBtnStyle}>
          <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
            <path d="M7 2L4 5.5L7 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <span style={{
          flex: 1, textAlign: 'center',
          fontSize: 14, fontWeight: 600, color: 'var(--text-primary)',
        }}>
          {MONTH_NAMES[month]} {year}
        </span>
        <button onClick={nextMonth} aria-label="Next month" style={navBtnStyle}>
          <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
            <path d="M4 2L7 5.5L4 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>

      {/* Calendar grid */}
      <div style={{ flex: 1, padding: '0 12px', overflowY: 'auto' }}>
        {/* Day-of-week headers */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', marginBottom: 2 }}>
          {DAY_LABELS.map((day) => (
            <div key={day} style={{
              textAlign: 'center',
              fontSize: 10, fontWeight: 600,
              color: 'var(--text-muted)',
              padding: '4px 0',
              textTransform: 'uppercase', letterSpacing: '0.07em',
            }}>
              {day}
            </div>
          ))}
        </div>

        {/* Cells */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2 }}>
          {grid.map((gridDate, i) => {
            const key = gridDate ? toDateKey(gridDate) : null
            const dayPlans = key ? (plansByDay.get(key) ?? []) : []
            const dayActivity = key ? activityByDay.get(key) : undefined
            return (
              <DayCell
                key={i}
                gridDate={gridDate}
                isToday={key === currentTodayKey}
                isSelected={key === selectedDate}
                plans={dayPlans}
                hasActivity={!!dayActivity && dayActivity.solveCount > 0}
                onClick={() => key && setSelectedDate((prev) => (prev === key ? null : key))}
              />
            )
          })}
        </div>
      </div>

      {/* Consistency footer */}
      <div style={{ padding: '16px 24px 20px', borderTop: '1px solid var(--border)' }}>
        <div style={{
          fontSize: 10, fontWeight: 600,
          color: 'var(--text-muted)',
          textTransform: 'uppercase', letterSpacing: '0.08em',
          marginBottom: 8,
        }}>
          12-week activity
        </div>
        <ConsistencyChart data={weeklyFrequency} />
      </div>

      {/* Day detail panel */}
      <AnimatePresence>
        {selectedDate && (
          <DayPanel
            key={selectedDate}
            dateKey={selectedDate}
            plans={selectedPlans}
            activity={selectedActivity}
            onClose={() => setSelectedDate(null)}
            onAddPlan={() => openCreate(selectedDate)}
            onMarkComplete={markComplete}
            onDeletePlan={deletePlan}
          />
        )}
      </AnimatePresence>

      {/* Create form */}
      <AnimatePresence>
        {showCreate && (
          <CreatePlanForm
            key="create-form"
            initialDate={createInitialDate}
            onConfirm={createPlan}
            onClose={() => setShowCreate(false)}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
