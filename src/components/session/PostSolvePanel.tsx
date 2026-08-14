import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import type { Penalty, NotesBehavior } from '@/types'
import { formatTime } from '@/lib/utils'

interface PostSolvePanelProps {
  time: number
  penalty: Penalty
  notesBehavior: NotesBehavior
  onPenaltyChange: (p: Penalty) => void
  onConfirm: (notes: string | null, tags: string[]) => void
}

const TAGS = ['lockup', 'lucky', 'bad cross', 'good F2L', 'PLL skip', 'fingertrick', 'bad look']

function penaltyStyle(p: Penalty, active: boolean) {
  const colors = p === null
    ? { border: 'var(--positive)', bg: 'rgba(34,197,94,0.12)', text: 'var(--positive)' }
    : p === '+2'
    ? { border: 'var(--inspection)', bg: 'rgba(245,158,11,0.12)', text: 'var(--inspection)' }
    : { border: 'var(--penalty)', bg: 'rgba(239,68,68,0.12)', text: 'var(--penalty)' }
  return {
    flex: 1, padding: '5px 0', borderRadius: 6,
    border: `1px solid ${active ? colors.border : 'var(--border)'}`,
    backgroundColor: active ? colors.bg : 'var(--surface-0)',
    color: active ? colors.text : 'var(--text-muted)',
    fontSize: 12, fontWeight: 600,
    fontFamily: "'JetBrains Mono', monospace",
    cursor: 'pointer' as const,
    transition: 'all 120ms ease',
  }
}

export function PostSolvePanel({ time, penalty, notesBehavior, onPenaltyChange, onConfirm }: PostSolvePanelProps) {
  const [notes, setNotes] = useState('')
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key !== 'Enter') return
      if (document.activeElement === textareaRef.current) return
      if (notesBehavior === 'required' && !notes.trim()) return
      e.preventDefault()
      handleConfirm()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [notes, notesBehavior, penalty])

  const displayTime = penalty === 'DNF' ? Infinity : penalty === '+2' ? time + 2000 : time

  const toggleTag = (tag: string) =>
    setSelectedTags((prev) => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag])

  const handleConfirm = () => {
    if (notesBehavior === 'required' && !notes.trim()) return
    onConfirm(notes.trim() || null, selectedTags)
    setNotes('')
    setSelectedTags([])
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 8 }}
      transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
      style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: '14px 12px', gap: 12, overflowY: 'auto' }}
    >
      {/* Time */}
      <div style={{ textAlign: 'center', paddingBottom: 4, borderBottom: '1px solid var(--border)' }}>
        <div style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 28, fontWeight: 700, letterSpacing: '-0.03em',
          color: penalty === 'DNF' ? 'var(--penalty)' : penalty === '+2' ? 'var(--inspection)' : 'var(--timer-active)',
        }}>
          {displayTime === Infinity ? 'DNF' : formatTime(displayTime)}
        </div>
        <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>new solve</div>
      </div>

      {/* Penalty */}
      <div style={{ display: 'flex', gap: 5 }}>
        {(['none', '+2', 'DNF'] as const).map((p) => {
          const actual: Penalty = p === 'none' ? null : p
          return (
            <button key={p} onClick={() => onPenaltyChange(actual)} style={penaltyStyle(actual, penalty === actual)}>
              {p === 'none' ? 'OK' : p}
            </button>
          )
        })}
      </div>

      {/* Tags */}
      <div>
        <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 6 }}>Tags</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
          {TAGS.map(tag => {
            const active = selectedTags.includes(tag)
            return (
              <button
                key={tag}
                onClick={() => toggleTag(tag)}
                style={{
                  padding: '3px 9px', borderRadius: 999, fontSize: 11, fontWeight: 500,
                  border: `1px solid ${active ? 'var(--accent)' : 'var(--border)'}`,
                  backgroundColor: active ? 'var(--accent-dim)' : 'transparent',
                  color: active ? 'var(--accent)' : 'var(--text-muted)',
                  cursor: 'pointer', transition: 'all 120ms ease',
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
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 5 }}>
          <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.07em', textTransform: 'uppercase' }}>
            Notes{notesBehavior === 'required' ? ' *' : ''}
          </div>
          <textarea
            ref={textareaRef}
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="What happened?"
            rows={3}
            style={{
              flex: 1, width: '100%', minHeight: 64,
              backgroundColor: 'var(--surface-1)',
              border: '1px solid var(--border)', borderRadius: 8,
              padding: '8px 10px', color: 'var(--text-primary)',
              fontSize: 12, resize: 'none', outline: 'none',
              fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
              lineHeight: 1.5, transition: 'border-color 150ms ease',
            }}
            onFocus={e => { e.currentTarget.style.borderColor = 'var(--accent)' }}
            onBlur={e => { e.currentTarget.style.borderColor = 'var(--border)' }}
          />
        </div>
      )}

      {/* Save */}
      <button
        onClick={handleConfirm}
        disabled={notesBehavior === 'required' && !notes.trim()}
        style={{
          width: '100%', padding: '10px',
          borderRadius: 8, border: 'none',
          backgroundColor: 'var(--accent)', color: '#020617',
          fontSize: 13, fontWeight: 700, cursor: 'pointer',
          opacity: notesBehavior === 'required' && !notes.trim() ? 0.4 : 1,
          transition: 'opacity 150ms ease, transform 100ms ease',
        }}
        onMouseDown={e => { e.currentTarget.style.transform = 'scale(0.97)' }}
        onMouseUp={e => { e.currentTarget.style.transform = 'scale(1)' }}
      >
        Next Solve
      </button>
    </motion.div>
  )
}
