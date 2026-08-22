import { useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'

interface KeyboardShortcutsModalProps {
  isOpen: boolean
  onClose: () => void
}

const SHORTCUTS: { key: string; description: string }[] = [
  { key: 'Space', description: 'Start inspection / Arm timer / Stop timer' },
  { key: 'Enter', description: '(Manual mode) Skip to time entry' },
  { key: '?', description: 'Show / hide this help' },
]

export function KeyboardShortcutsModal({ isOpen, onClose }: KeyboardShortcutsModalProps) {
  useEffect(() => {
    if (!isOpen) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="shortcuts-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          onClick={onClose}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 2000,
            backgroundColor: 'rgba(0, 0, 0, 0.55)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <motion.div
            key="shortcuts-card"
            initial={{ opacity: 0, scale: 0.94, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 8 }}
            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: 'var(--surface-0)',
              border: '1px solid var(--border)',
              borderRadius: 16,
              padding: '28px 32px',
              minWidth: 380,
              maxWidth: 480,
              width: '90vw',
              boxShadow: '0 24px 60px rgba(0,0,0,0.4)',
            }}
          >
            <div style={{
              fontSize: 11,
              fontWeight: 700,
              color: 'var(--text-muted)',
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              marginBottom: 16,
            }}>
              Keyboard Shortcuts
            </div>

            <div style={{
              width: '100%',
              height: 1,
              backgroundColor: 'var(--border)',
              marginBottom: 16,
            }} />

            <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
              {SHORTCUTS.map((shortcut, i) => (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 16,
                    padding: '10px 0',
                    borderBottom: i < SHORTCUTS.length - 1 ? '1px solid var(--border)' : 'none',
                  }}
                >
                  <kbd style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: 12,
                    fontWeight: 600,
                    color: 'var(--accent)',
                    backgroundColor: 'var(--surface-1)',
                    border: '1px solid var(--border)',
                    borderRadius: 6,
                    padding: '3px 10px',
                    whiteSpace: 'nowrap',
                    flexShrink: 0,
                    minWidth: 70,
                    textAlign: 'center',
                    display: 'inline-block',
                  }}>
                    {shortcut.key}
                  </kbd>
                  <span style={{
                    fontSize: 13,
                    color: 'var(--text-primary)',
                    lineHeight: 1.4,
                  }}>
                    {shortcut.description}
                  </span>
                </div>
              ))}
            </div>

            <div style={{
              marginTop: 20,
              fontSize: 11,
              color: 'var(--text-muted)',
              textAlign: 'center',
            }}>
              Press <kbd style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 10,
                backgroundColor: 'var(--surface-1)',
                border: '1px solid var(--border)',
                borderRadius: 4,
                padding: '1px 5px',
              }}>Esc</kbd> or click outside to close
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
