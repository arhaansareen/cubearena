import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface ManualEntryModalProps {
  isOpen: boolean
  onConfirm: (ms: number) => void
  onDismiss: () => void
}

// Parses "12.34", "1:23.45", "1:03", "12" into milliseconds.
// Returns null if the string is not a valid time.
function parseTimeInput(raw: string): number | null {
  const s = raw.trim().replace(/\s/g, '')
  if (!s) return null

  // mm:ss.xxx or mm:ss
  const colonMatch = s.match(/^(\d{1,2}):(\d{2})(?:\.(\d{1,3}))?$/)
  if (colonMatch) {
    const mins = parseInt(colonMatch[1], 10)
    const secs = parseInt(colonMatch[2], 10)
    if (secs >= 60) return null
    const ms = parseFloat(`0.${(colonMatch[3] ?? '0').padEnd(3, '0')}`) * 1000
    return mins * 60_000 + secs * 1000 + Math.round(ms)
  }

  // ss.xxx or ss
  const secMatch = s.match(/^(\d{1,3})(?:\.(\d{1,3}))?$/)
  if (secMatch) {
    const secs = parseInt(secMatch[1], 10)
    const ms = parseFloat(`0.${(secMatch[2] ?? '0').padEnd(3, '0')}`) * 1000
    return secs * 1000 + Math.round(ms)
  }

  return null
}

function formatPreview(ms: number): string {
  if (ms < 60_000) {
    const s = (ms / 1000).toFixed(3)
    return s
  }
  const mins = Math.floor(ms / 60_000)
  const secs = ((ms % 60_000) / 1000).toFixed(3).padStart(6, '0')
  return `${mins}:${secs}`
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!isValid || parsed === null) return
    onConfirm(parsed)
    setValue('')
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onDismiss()
    }
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
              position: 'fixed',
              inset: 0,
              backgroundColor: 'rgba(2, 6, 23, 0.7)',
              zIndex: 200,
              backdropFilter: 'blur(4px)',
              cursor: 'pointer',
            }}
          />

          <motion.div
            key="manual-modal"
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
            style={{
              position: 'fixed',
              left: '50%',
              top: '50%',
              transform: 'translate(-50%, -50%)',
              zIndex: 201,
              width: '100%',
              maxWidth: 360,
              backgroundColor: 'var(--surface-0)',
              border: '1px solid var(--border)',
              borderRadius: 16,
              padding: '28px 28px 24px',
            }}
            onKeyDown={handleKeyDown}
          >
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>
                Enter time manually
              </div>
              <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                Format: 12.34 or 1:23.456
              </div>
            </div>

            <form onSubmit={handleSubmit}>
              <input
                ref={inputRef}
                type="text"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder="e.g. 9.87 or 1:03.45"
                inputMode="decimal"
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
                  marginBottom: 8,
                }}
              />

              {/* Live preview */}
              <div
                style={{
                  height: 20,
                  textAlign: 'center',
                  fontSize: 12,
                  fontFamily: "'JetBrains Mono', monospace",
                  color: isValid ? 'var(--text-muted)' : value ? 'var(--penalty)' : 'transparent',
                  marginBottom: 20,
                  transition: 'color 150ms ease',
                }}
              >
                {isValid && parsed !== null
                  ? formatPreview(parsed)
                  : value && !isValid
                  ? 'Invalid format'
                  : '.'}
              </div>

              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  type="button"
                  onClick={onDismiss}
                  style={{
                    flex: 1,
                    padding: '11px',
                    borderRadius: 10,
                    backgroundColor: 'var(--surface-1)',
                    color: 'var(--text-muted)',
                    fontSize: 14,
                    fontWeight: 600,
                    border: '1px solid var(--border)',
                    cursor: 'pointer',
                    transition: 'color 150ms ease',
                  }}
                  onMouseOver={(e) => { e.currentTarget.style.color = 'var(--text-primary)' }}
                  onMouseOut={(e) => { e.currentTarget.style.color = 'var(--text-muted)' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!isValid}
                  style={{
                    flex: 2,
                    padding: '11px',
                    borderRadius: 10,
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
            </form>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
