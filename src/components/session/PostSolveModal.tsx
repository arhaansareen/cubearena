import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { Penalty, NotesBehavior } from '@/types'
import { TimeDisplay } from '@/components/shared/TimeDisplay'
import { PenaltyBadge } from '@/components/shared/PenaltyBadge'

interface PostSolveModalProps {
  isOpen: boolean
  time: number
  penalty: Penalty
  notesBehavior: NotesBehavior
  onPenaltyChange: (penalty: Penalty) => void
  onConfirm: (notes: string | null, tags: string[]) => void
  onDismiss: () => void
}

const PREDEFINED_TAGS = [
  'lockup',
  'lucky',
  'bad cross',
  'good F2L',
  'PLL skip',
  'fingertrick',
  'OH fumble',
]

function computeDisplayTime(time: number, penalty: Penalty): number {
  if (penalty === 'DNF') return Infinity
  if (penalty === '+2') return time + 2000
  return time
}

export function PostSolveModal({
  isOpen,
  time,
  penalty,
  notesBehavior,
  onPenaltyChange,
  onConfirm,
  onDismiss,
}: PostSolveModalProps) {
  const [notes, setNotes] = useState('')
  const [selectedTags, setSelectedTags] = useState<string[]>([])

  const displayTime = computeDisplayTime(time, penalty)

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    )
  }

  const handleConfirm = () => {
    if (notesBehavior === 'required' && notes.trim() === '') return
    onConfirm(notes.trim() || null, selectedTags)
    setNotes('')
    setSelectedTags([])
  }

  const handleDismiss = () => {
    setNotes('')
    setSelectedTags([])
    onDismiss()
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={notesBehavior !== 'required' ? handleDismiss : undefined}
            style={{
              position: 'fixed',
              inset: 0,
              backgroundColor: 'rgba(2, 6, 23, 0.7)',
              zIndex: 200,
              backdropFilter: 'blur(4px)',
              cursor: notesBehavior !== 'required' ? 'pointer' : 'default',
            }}
          />

          {/* Modal */}
          <motion.div
            key="modal"
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            style={{
              position: 'fixed',
              left: '50%',
              top: '50%',
              transform: 'translate(-50%, -50%)',
              zIndex: 201,
              width: '100%',
              maxWidth: 440,
              backgroundColor: 'var(--surface-0)',
              border: '1px solid var(--border)',
              borderRadius: 16,
              padding: 28,
              display: 'flex',
              flexDirection: 'column',
              gap: 20,
            }}
          >
            {/* Time display */}
            <div style={{ textAlign: 'center' }}>
              <TimeDisplay ms={displayTime} size="xl" />
              <div style={{ marginTop: 8, display: 'flex', justifyContent: 'center', gap: 8 }}>
                <PenaltyBadge penalty={penalty} />
              </div>
            </div>

            {/* Penalty buttons */}
            <div
              style={{
                display: 'flex',
                gap: 8,
                justifyContent: 'center',
              }}
            >
              {(['none', '+2', 'DNF'] as const).map((p) => {
                const actualPenalty: Penalty = p === 'none' ? null : p
                const isActive = penalty === actualPenalty
                return (
                  <button
                    key={p}
                    onClick={() => onPenaltyChange(actualPenalty)}
                    style={{
                      padding: '8px 20px',
                      borderRadius: 8,
                      border: `1px solid ${isActive ? getActiveBorderColor(actualPenalty) : 'var(--border)'}`,
                      backgroundColor: isActive ? getActiveBgColor(actualPenalty) : 'var(--surface-1)',
                      color: isActive ? getActiveTextColor(actualPenalty) : 'var(--text-muted)',
                      fontSize: 13,
                      fontWeight: 600,
                      letterSpacing: '0.02em',
                      cursor: 'pointer',
                      transition: 'all 150ms ease',
                      fontFamily: "'JetBrains Mono', monospace",
                    }}
                  >
                    {p === 'none' ? 'OK' : p}
                  </button>
                )
              })}
            </div>

            {/* Tags */}
            <div>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 8 }}>
                Tags
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {PREDEFINED_TAGS.map((tag) => {
                  const active = selectedTags.includes(tag)
                  return (
                    <button
                      key={tag}
                      onClick={() => toggleTag(tag)}
                      style={{
                        padding: '4px 12px',
                        borderRadius: 9999,
                        border: `1px solid ${active ? 'var(--accent)' : 'var(--border)'}`,
                        backgroundColor: active ? 'var(--accent-dim)' : 'var(--surface-1)',
                        color: active ? 'var(--accent)' : 'var(--text-muted)',
                        fontSize: 12,
                        fontWeight: 500,
                        cursor: 'pointer',
                        transition: 'all 150ms ease',
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
                  style={{
                    display: 'block',
                    fontSize: 12,
                    fontWeight: 600,
                    color: 'var(--text-muted)',
                    letterSpacing: '0.06em',
                    textTransform: 'uppercase',
                    marginBottom: 8,
                  }}
                >
                  Notes{notesBehavior === 'required' ? ' (required)' : ''}
                </label>
                <textarea
                  id="solve-notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="What happened on this solve?"
                  rows={3}
                  style={{
                    width: '100%',
                    backgroundColor: 'var(--surface-1)',
                    border: `1px solid ${notes.trim() ? 'rgba(255,255,255,0.15)' : 'var(--border)'}`,
                    borderRadius: 8,
                    padding: '10px 12px',
                    color: 'var(--text-primary)',
                    fontSize: 13,
                    resize: 'vertical',
                    outline: 'none',
                    fontFamily: "'Inter', sans-serif",
                    transition: 'border-color 150ms ease',
                  }}
                  onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--accent)' }}
                  onBlur={(e) => { e.currentTarget.style.borderColor = notes.trim() ? 'rgba(255,255,255,0.15)' : 'var(--border)' }}
                />
              </div>
            )}

            {/* Action button */}
            <button
              onClick={handleConfirm}
              disabled={notesBehavior === 'required' && notes.trim() === ''}
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: 10,
                backgroundColor: 'var(--accent)',
                color: '#020617',
                fontSize: 15,
                fontWeight: 700,
                cursor: notesBehavior === 'required' && notes.trim() === '' ? 'not-allowed' : 'pointer',
                border: 'none',
                transition: 'opacity 150ms ease',
                opacity: notesBehavior === 'required' && notes.trim() === '' ? 0.4 : 1,
              }}
            >
              Next Solve
            </button>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

function getActiveBorderColor(penalty: Penalty): string {
  if (penalty === null) return 'var(--positive)'
  if (penalty === '+2') return 'var(--inspection)'
  return 'var(--penalty)'
}

function getActiveBgColor(penalty: Penalty): string {
  if (penalty === null) return 'rgba(34, 197, 94, 0.12)'
  if (penalty === '+2') return 'rgba(245, 158, 11, 0.12)'
  return 'rgba(239, 68, 68, 0.12)'
}

function getActiveTextColor(penalty: Penalty): string {
  if (penalty === null) return 'var(--positive)'
  if (penalty === '+2') return 'var(--inspection)'
  return 'var(--penalty)'
}
