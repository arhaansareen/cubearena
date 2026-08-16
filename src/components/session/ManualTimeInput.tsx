import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'

interface ManualTimeInputProps {
  onConfirm: (ms: number) => void
  onCancel: () => void
}

// Numpad / stackmat format: pure digits, right-to-left = cs, sec, min
// e.g. "10165" → cs=65, sec=01, min=1 → 1:01.65
function parseNumpad(digits: string): number | null {
  if (digits.length < 1 || digits.length > 7) return null
  const padded = digits.padStart(6, '0')
  const cs = parseInt(padded.slice(-2), 10)
  const sec = parseInt(padded.slice(-4, -2), 10)
  const min = parseInt(padded.slice(0, -4), 10)
  if (sec >= 60 || cs >= 100) return null
  return min * 60_000 + sec * 1_000 + cs * 10
}

function parseTimeInput(raw: string): number | null {
  const s = raw.trim().replace(/\s/g, '')
  if (!s) return null

  // Explicit: mm:ss.xx or mm:ss
  const colonMatch = s.match(/^(\d{1,2}):(\d{2})(?:\.(\d{1,3}))?$/)
  if (colonMatch) {
    const mins = parseInt(colonMatch[1], 10)
    const secs = parseInt(colonMatch[2], 10)
    if (secs >= 60) return null
    const frac = parseFloat(`0.${(colonMatch[3] ?? '0').padEnd(3, '0')}`) * 1000
    return mins * 60_000 + secs * 1000 + Math.round(frac)
  }

  // Explicit: ss.xx
  const decMatch = s.match(/^(\d{1,3})\.(\d{1,3})$/)
  if (decMatch) {
    const secs = parseInt(decMatch[1], 10)
    const frac = parseFloat(`0.${decMatch[2].padEnd(3, '0')}`) * 1000
    return secs * 1000 + Math.round(frac)
  }

  // Pure digits: 3+ → numpad format, 1-2 → whole seconds
  if (/^\d+$/.test(s)) {
    if (s.length >= 3) return parseNumpad(s)
    return parseInt(s, 10) * 1000
  }

  return null
}

function formatPreview(ms: number): string {
  const cs = Math.floor((ms % 1000) / 10)
  const sec = Math.floor((ms % 60_000) / 1000)
  const min = Math.floor(ms / 60_000)
  const csStr = String(cs).padStart(2, '0')
  const secStr = String(sec).padStart(2, '0')
  if (min > 0) return `${min}:${secStr}.${csStr}`
  return `${sec}.${csStr}`
}

export function ManualTimeInput({ onConfirm, onCancel }: ManualTimeInputProps) {
  const [value, setValue] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const t = setTimeout(() => inputRef.current?.focus(), 150)
    return () => clearTimeout(t)
  }, [])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { e.preventDefault(); onCancel() }
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

  const preview = isValid && parsed !== null ? formatPreview(parsed) : null

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
        gap: 8,
        width: '100%',
        padding: '0 24px',
      }}
    >
      <div style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 500 }}>
        Enter time
      </div>

      <form onSubmit={handleSubmit} style={{ width: '100%', maxWidth: 480 }}>
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value.replace(/[^\d:.]/g, ''))}
          placeholder="10165"
          inputMode="numeric"
          autoComplete="off"
          spellCheck={false}
          style={{
            width: '100%',
            background: 'none',
            border: 'none',
            borderBottom: `2px solid ${
              value && !isValid ? 'var(--penalty)' : isValid ? 'var(--accent)' : 'var(--border)'
            }`,
            outline: 'none',
            textAlign: 'center',
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 'clamp(48px, 10vw, 96px)',
            fontWeight: 500,
            color: value && !isValid ? 'var(--penalty)' : 'var(--text-primary)',
            padding: '8px 0 12px',
            letterSpacing: '-0.02em',
            transition: 'border-color 150ms ease, color 150ms ease',
          }}
        />

        {/* Live formatted preview */}
        <div style={{
          height: 28,
          textAlign: 'center',
          marginTop: 6,
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 16,
          fontWeight: 600,
          transition: 'color 150ms ease, opacity 150ms ease',
          color: 'var(--accent)',
          opacity: preview ? 1 : 0,
        }}>
          {preview ?? '—'}
        </div>

        <div style={{
          textAlign: 'center',
          marginTop: 4,
          fontSize: 11,
          color: value && !isValid ? 'var(--penalty)' : 'var(--text-muted)',
          opacity: value ? 1 : 0.5,
          transition: 'color 150ms ease',
          fontFamily: "'JetBrains Mono', monospace",
        }}>
          {value && !isValid
            ? 'invalid — try 987, 10165, or 1:23.45'
            : '987 = 9.87s · 10165 = 1:01.65 · 1:23.45'}
        </div>

        <div style={{ display: 'flex', gap: 10, marginTop: 20, justifyContent: 'center' }}>
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
            onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--text-primary)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)' }}
            onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.borderColor = 'var(--border)' }}
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
              transition: 'background-color 150ms ease, color 150ms ease, border-color 150ms ease',
            }}
            onMouseDown={(e) => { if (isValid) e.currentTarget.style.transform = 'scale(0.97)' }}
            onMouseUp={(e) => { e.currentTarget.style.transform = 'scale(1)' }}
          >
            Log time
          </button>
        </div>

        <div style={{ textAlign: 'center', marginTop: 12, fontSize: 11, color: 'var(--text-muted)', opacity: 0.6 }}>
          Enter to confirm · Esc to cancel
        </div>
      </form>
    </motion.div>
  )
}
