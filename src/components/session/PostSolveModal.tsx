import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { Penalty, NotesBehavior } from '@/types'
import { formatTime } from '@/lib/utils'

interface PostSolveModalProps {
  isOpen: boolean
  time: number
  penalty: Penalty
  notesBehavior: NotesBehavior
  onPenaltyChange: (penalty: Penalty) => void
  onConfirm: (notes: string | null, tags: string[]) => void
  onDismiss: () => void
}

const PREDEFINED_TAGS = ['lockup', 'lucky', 'bad cross', 'good F2L', 'PLL skip', 'fingertrick', 'bad look']

function computeDisplayTime(time: number, penalty: Penalty): number {
  if (penalty === 'DNF') return Infinity
  if (penalty === '+2') return time + 2000
  return time
}

function penaltyColors(p: Penalty) {
  if (p === null)  return { border: 'var(--positive)',    bg: 'rgba(34,197,94,0.12)',   text: 'var(--positive)' }
  if (p === '+2')  return { border: 'var(--inspection)',  bg: 'rgba(245,158,11,0.12)',  text: 'var(--inspection)' }
  return             { border: 'var(--penalty)',    bg: 'rgba(239,68,68,0.12)',   text: 'var(--penalty)' }
}

export function PostSolveModal({ isOpen, time, penalty, notesBehavior, onPenaltyChange, onConfirm, onDismiss }: PostSolveModalProps) {
  const [notes, setNotes] = useState('')
  const [selectedTags, setSelectedTags] = useState<string[]>([])

  const displayTime = computeDisplayTime(time, penalty)
  const timeStr = displayTime === Infinity ? 'DNF' : formatTime(displayTime)

  const toggleTag = (tag: string) =>
    setSelectedTags((prev) => prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag])

  const handleConfirm = () => {
    if (notesBehavior === 'required' && !notes.trim()) return
    onConfirm(notes.trim() || null, selectedTags)
    setNotes('')
    setSelectedTags([])
  }

  const handleDismiss = () => {
    setNotes('')
    setSelectedTags([])
    onDismiss()
  }

  const canDismiss = notesBehavior !== 'required'

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop — blurs the session behind without hiding it */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={canDismiss ? handleDismiss : undefined}
            style={{
              position: 'fixed', inset: 0, zIndex: 200,
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
              backgroundColor: 'rgba(2,6,23,0.45)',
              cursor: canDismiss ? 'pointer' : 'default',
            }}
          />

          {/* Bottom sheet */}
          <motion.div
            key="sheet"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 280 }}
            style={{
              position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 201,
              backgroundColor: 'var(--surface-0)',
              borderTop: '1px solid var(--border)',
              borderTopLeftRadius: 24, borderTopRightRadius: 24,
              maxHeight: '88dvh', overflowY: 'auto',
              display: 'flex', flexDirection: 'column',
            }}
          >
            {/* Handle */}
            <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 12, paddingBottom: 4, flexShrink: 0 }}>
              <div style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: 'var(--border)' }} />
            </div>

            <div style={{ padding: '8px 24px 32px', display: 'flex', flexDirection: 'column', gap: 16 }}>

              {/* Time hero */}
              <div style={{ textAlign: 'center', padding: '4px 0 0' }}>
                <div style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 42,
                  fontWeight: 700,
                  letterSpacing: '-0.03em',
                  lineHeight: 1,
                  color: penalty === 'DNF' ? 'var(--penalty)' : penalty === '+2' ? 'var(--inspection)' : 'var(--timer-active)',
                }}>
                  {timeStr}
                </div>
                {penalty === '+2' && (
                  <div style={{ fontSize: 13, color: 'var(--inspection)', marginTop: 6, fontFamily: "'JetBrains Mono', monospace" }}>
                    +2 penalty applied
                  </div>
                )}
              </div>

              {/* Penalty chips */}
              <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
                {(['none', '+2', 'DNF'] as const).map((p) => {
                  const actual: Penalty = p === 'none' ? null : p
                  const active = penalty === actual
                  const c = penaltyColors(actual)
                  return (
                    <button
                      key={p}
                      onClick={() => onPenaltyChange(actual)}
                      style={{
                        padding: '7px 22px', borderRadius: 999,
                        border: `1px solid ${active ? c.border : 'var(--border)'}`,
                        backgroundColor: active ? c.bg : 'var(--surface-1)',
                        color: active ? c.text : 'var(--text-muted)',
                        fontSize: 13, fontWeight: 600,
                        fontFamily: "'JetBrains Mono', monospace",
                        cursor: 'pointer', transition: 'all 150ms ease',
                      }}
                    >
                      {p === 'none' ? 'OK' : p}
                    </button>
                  )
                })}
              </div>

              {/* Tags */}
              <div>
                <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 10 }}>
                  What happened?
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {PREDEFINED_TAGS.map((tag) => {
                    const active = selectedTags.includes(tag)
                    return (
                      <button
                        key={tag}
                        onClick={() => toggleTag(tag)}
                        style={{
                          padding: '5px 14px', borderRadius: 999,
                          border: `1px solid ${active ? 'var(--accent)' : 'var(--border)'}`,
                          backgroundColor: active ? 'var(--accent-dim)' : 'var(--surface-1)',
                          color: active ? 'var(--accent)' : 'var(--text-muted)',
                          fontSize: 12, fontWeight: 500,
                          cursor: 'pointer', transition: 'all 150ms ease',
                        }}
                      >
                        {tag}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Notes */}
              {notesBehavior !== 'off' && (
                <div>
                  <label
                    htmlFor="solve-notes"
                    style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 8 }}
                  >
                    Notes{notesBehavior === 'required' ? ' *' : ''}
                  </label>
                  <textarea
                    id="solve-notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="What would you do differently?"
                    rows={3}
                    style={{
                      width: '100%',
                      backgroundColor: 'var(--surface-1)',
                      border: '1px solid var(--border)',
                      borderRadius: 10, padding: '10px 14px',
                      color: 'var(--text-primary)', fontSize: 14,
                      resize: 'none', outline: 'none',
                      fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
                      lineHeight: 1.5,
                      transition: 'border-color 150ms ease',
                    }}
                    onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--accent)' }}
                    onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--border)' }}
                  />
                </div>
              )}

              {/* CTA */}
              <button
                onClick={handleConfirm}
                disabled={notesBehavior === 'required' && !notes.trim()}
                style={{
                  width: '100%', padding: '14px',
                  borderRadius: 12,
                  backgroundColor: 'var(--accent)',
                  color: '#020617',
                  fontSize: 15, fontWeight: 700,
                  border: 'none', cursor: 'pointer',
                  boxShadow: 'var(--shadow-accent)',
                  opacity: notesBehavior === 'required' && !notes.trim() ? 0.4 : 1,
                  transition: 'opacity 150ms ease, transform 100ms ease',
                }}
                onMouseDown={(e) => { e.currentTarget.style.transform = 'scale(0.98)' }}
                onMouseUp={(e) => { e.currentTarget.style.transform = 'scale(1)' }}
              >
                Next Solve
              </button>

            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
