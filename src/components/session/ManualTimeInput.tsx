import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import type { Penalty } from '@/types'

interface ManualTimeInputProps {
  pendingPenalty: Penalty
  onConfirm: (ms: number) => void
  onCancel: () => void
}

function parseTimeInput(raw: string): number | null {
  const s = raw.trim().replace(/\s/g, '')
  if (!s) return null

  const colonMatch = s.match(/^(\d{1,2}):(\d{2})(?:\.(\d{1,3}))?$/)
  if (colonMatch) {
    const mins = parseInt(colonMatch[1], 10)
    const secs = parseInt(colonMatch[2], 10)
    if (secs >= 60) return null
    const frac = parseFloat(`0.${(colonMatch[3] ?? '0').padEnd(3, '0')}`) * 1000
    return mins * 60_000 + secs * 1000 + Math.round(frac)
  }

  const secMatch = s.match(/^(\d{1,3})(?:\.(\d{1,3}))?$/)
  if (secMatch) {
    const secs = parseInt(secMatch[1], 10)
    const frac = parseFloat(`0.${(secMatch[2] ?? '0').padEnd(3, '0')}`) * 1000
    return secs * 1000 + Math.round(frac)
  }

  return null
}

function formatPreview(ms: number): string {
  if (ms < 60_000) return (ms / 1000).toFixed(3)
  const mins = Math.floor(ms / 60_000)
  const secs = ((ms % 60_000) / 1000).toFixed(3).padStart(6, '0')
  return `${mins}:${secs}`
}

function penaltyLabel(p: Penalty): string {
  if (p === '+2') return '+2'
  if (p === 'DNF') return 'DNF'
  return ''
}

export function ManualTimeInput({ pendingPenalty, onConfirm, onCancel }: ManualTimeInputProps) {
  const [value, setValue] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    // Delay focus slightly so the AnimatePresence entrance doesn't compete
    const t = setTimeout(() => inputRef.current?.focus(), 80)
    return () => clearTimeout(t)
  }, [])

  // Escape cancels; Enter confirms if valid
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        onCancel()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onCancel])

  const parsed = parseTimeInput(value)
  const isValid = parsed !== null && parsed > 0

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!isValid || parsed === null) return
    onConfirm(parsed)
  }

  const penaltyColor =
    pendingPenalty === 'DNF'
      ? 'var(--penalty)'
      : pendingPenalty === '+2'
      ? 'var(--inspection)'
      : null

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.97 }}
      transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
        width: '100%',
        padding: '0 24px',
      }}
    >
      {/* Instruction label */}
      <div style={{
        fontSize: 13,
        color: 'var(--text-muted)',
        letterSpacing: '0.05em',
        textTransform: 'uppercase',
        fontWeight: 500,
      }}>
        Enter your time
      </div>

      {/* Penalty badge if inspection was overstayed */}
      {pendingPenalty && (
        <div style={{
          fontSize: 13,
          fontWeight: 700,
          color: penaltyColor ?? undefined,
          fontFamily: "'JetBrains Mono', monospace",
          letterSpacing: '0.04em',
        }}>
          {penaltyLabel(pendingPenalty)} from inspection
        </div>
      )}

      {/* Main input -- same visual weight as the xl timer display */}
      <form onSubmit={handleSubmit} style={{ width: '100%', maxWidth: 480 }}>
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="9.87"
          inputMode="decimal"
          autoComplete="off"
          spellCheck={false}
          style={{
            width: '100%',
            background: 'none',
            border: 'none',
            borderBottom: `2px solid ${
              value && !isValid
                ? 'var(--penalty)'
                : isValid
                ? 'var(--accent)'
                : 'var(--border)'
            }`,
            outline: 'none',
            textAlign: 'center',
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 'clamp(48px, 10vw, 96px)',
            fontWeight: 500,
            color: value && !isValid
              ? 'var(--penalty)'
              : isValid
              ? 'var(--text-primary)'
              : 'var(--text-muted)',
            padding: '8px 0 12px',
            letterSpacing: '-0.02em',
            transition: 'border-color 150ms ease, color 150ms ease',
          }}
        />

        {/* Live parse feedback */}
        <div style={{
          height: 22,
          textAlign: 'center',
          marginTop: 8,
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 14,
          transition: 'color 150ms ease',
          color: isValid
            ? 'var(--text-muted)'
            : value
            ? 'var(--penalty)'
            : 'transparent',
        }}>
          {isValid && parsed !== null
            ? formatPreview(parsed)
            : value && !isValid
            ? 'Invalid format -- try 9.87 or 1:23.45'
            : '.'}
        </div>

        {/* Confirm / Cancel */}
        <div style={{ display: 'flex', gap: 10, marginTop: 24, justifyContent: 'center' }}>
          <button
            type="button"
            onClick={onCancel}
            style={{
              padding: '11px 28px',
              borderRadius: 8,
              backgroundColor: 'var(--surface-1)',
              color: 'var(--text-muted)',
              fontSize: 14,
              fontWeight: 600,
              border: '1px solid var(--border)',
              cursor: 'pointer',
              transition: 'color 150ms ease, border-color 150ms ease',
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.color = 'var(--text-primary)'
              e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.color = 'var(--text-muted)'
              e.currentTarget.style.borderColor = 'var(--border)'
            }}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={!isValid}
            style={{
              padding: '11px 36px',
              borderRadius: 8,
              backgroundColor: isValid ? 'var(--accent)' : 'var(--surface-1)',
              color: isValid ? '#020617' : 'var(--text-muted)',
              fontSize: 14,
              fontWeight: 700,
              border: `1px solid ${isValid ? 'var(--accent)' : 'var(--border)'}`,
              cursor: isValid ? 'pointer' : 'not-allowed',
              transition: 'all 150ms ease',
            }}
          >
            Log time
          </button>
        </div>

        <div style={{
          textAlign: 'center',
          marginTop: 14,
          fontSize: 12,
          color: 'var(--text-muted)',
        }}>
          Enter to confirm, Esc to cancel
        </div>
      </form>
    </motion.div>
  )
}
