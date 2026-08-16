import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface ManualEntryModalProps {
  isOpen: boolean
  onConfirm: (ms: number) => void
  onDismiss: () => void
}

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

  const colonMatch = s.match(/^(\d{1,2}):(\d{2})(?:\.(\d{1,3}))?$/)
  if (colonMatch) {
    const mins = parseInt(colonMatch[1], 10)
    const secs = parseInt(colonMatch[2], 10)
    if (secs >= 60) return null
    const frac = parseFloat(`0.${(colonMatch[3] ?? '0').padEnd(3, '0')}`) * 1000
    return mins * 60_000 + secs * 1000 + Math.round(frac)
  }

  const decMatch = s.match(/^(\d{1,3})\.(\d{1,3})$/)
  if (decMatch) {
    const secs = parseInt(decMatch[1], 10)
    const frac = parseFloat(`0.${decMatch[2].padEnd(3, '0')}`) * 1000
    return secs * 1000 + Math.round(frac)
  }

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

export function ManualEntryModal({ isOpen, onConfirm, onDismiss }: ManualEntryModalProps) {
  const [value, setValue] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isOpen) {
      setValue('')
      setTimeout(() => inputRef.current?.focus(), 60)
    }
  }, [isOpen])

  const parsed = parseTimeInput(value)
  const isValid = parsed !== null && parsed > 0
  const preview = isValid && parsed !== null ? formatPreview(parsed) : null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!isValid || parsed === null) return
    onConfirm(parsed)
    setValue('')
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            key="manual-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={onDismiss}
            style={{
              position: 'fixed', inset: 0,
              backgroundColor: 'rgba(2, 6, 23, 0.7)',
              zIndex: 200, backdropFilter: 'blur(4px)', cursor: 'pointer',
            }}
          />
          <motion.div
            key="manual-modal"
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
            onKeyDown={(e) => { if (e.key === 'Escape') onDismiss() }}
            style={{
              position: 'fixed', left: '50%', top: '50%',
              transform: 'translate(-50%, -50%)',
              zIndex: 201, width: '100%', maxWidth: 360,
              backgroundColor: 'var(--surface-0)',
              border: '1px solid var(--border)',
              borderRadius: 16, padding: '28px 28px 24px',
            }}
          >
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>
                Enter time
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: "'JetBrains Mono', monospace" }}>
                987 = 9.87s · 10165 = 1:01.65 · 1:23.45
              </div>
            </div>

            <form onSubmit={handleSubmit}>
              <input
                ref={inputRef}
                type="text"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder="10165"
                inputMode="numeric"
                autoComplete="off"
                style={{
                  width: '100%',
                  backgroundColor: 'var(--surface-1)',
                  border: `1px solid ${value && !isValid ? 'var(--penalty)' : isValid ? 'var(--accent)' : 'var(--border)'}`,
                  borderRadius: 10,
                  padding: '14px 16px',
                  color: 'var(--text-primary)',
                  fontSize: 28,
                  fontFamily: "'JetBrains Mono', monospace",
                  fontWeight: 500,
                  outline: 'none',
                  transition: 'border-color 150ms ease',
                  textAlign: 'center',
                  letterSpacing: '0.02em',
                  marginBottom: 6,
                }}
              />

              {/* Live preview */}
              <div style={{
                height: 24,
                textAlign: 'center',
                fontSize: 14,
                fontFamily: "'JetBrains Mono', monospace",
                fontWeight: 600,
                color: preview ? 'var(--accent)' : value && !isValid ? 'var(--penalty)' : 'transparent',
                marginBottom: 16,
                transition: 'color 150ms ease',
              }}>
                {preview ?? (value && !isValid ? 'invalid format' : '.')}
              </div>

              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  type="button"
                  onClick={onDismiss}
                  style={{
                    flex: 1, padding: '11px', borderRadius: 10,
                    backgroundColor: 'var(--surface-1)', color: 'var(--text-muted)',
                    fontSize: 14, fontWeight: 600, border: '1px solid var(--border)',
                    cursor: 'pointer', transition: 'color 150ms ease',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--text-primary)' }}
                  onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-muted)' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!isValid}
                  style={{
                    flex: 2, padding: '11px', borderRadius: 10,
                    backgroundColor: isValid ? 'var(--accent)' : 'var(--surface-1)',
                    color: isValid ? '#020617' : 'var(--text-muted)',
                    fontSize: 14, fontWeight: 700,
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
            </form>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
