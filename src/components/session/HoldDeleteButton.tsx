import { useRef, useState } from 'react'
import { motion, useAnimation } from 'framer-motion'

interface HoldDeleteButtonProps {
  onDelete: () => void
  holdDuration?: number
}

function TrashIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 11 11" fill="none" aria-hidden="true">
      <path
        d="M2 2.5h7M4.5 2.5V2a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 .5.5v.5M3.5 4v4.5M5.5 4v4.5M7.5 4v4.5M2.5 2.5l.5 7h5l.5-7"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function HoldDeleteButton({ onDelete, holdDuration = 800 }: HoldDeleteButtonProps) {
  const [holding, setHolding] = useState(false)
  const controls = useAnimation()
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const didComplete = useRef(false)

  function startHold() {
    didComplete.current = false
    setHolding(true)
    controls.start({
      scaleX: 1,
      transition: { duration: holdDuration / 1000, ease: 'linear' },
    }).then(() => {
      if (!didComplete.current) {
        didComplete.current = true
        onDelete()
        endHold()
      }
    })
  }

  function endHold() {
    setHolding(false)
    controls.stop()
    controls.set({ scaleX: 0 })
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
  }

  return (
    <button
      onMouseDown={startHold}
      onMouseUp={endHold}
      onMouseLeave={endHold}
      onTouchStart={(e) => { e.preventDefault(); startHold() }}
      onTouchEnd={endHold}
      onTouchCancel={endHold}
      style={{
        position: 'relative',
        overflow: 'hidden',
        padding: '8px',
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 5,
        fontSize: 11,
        fontWeight: 500,
        color: holding ? 'var(--penalty)' : 'var(--text-muted)',
        transition: 'color 150ms ease',
        background: 'none',
        borderTop: '1px solid var(--border)',
        borderRight: 'none',
        borderBottom: 'none',
        borderLeft: 'none',
        cursor: 'pointer',
        flexShrink: 0,
      }}
    >
      {/* Fill bar */}
      <motion.div
        aria-hidden="true"
        initial={{ scaleX: 0 }}
        animate={controls}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          height: '100%',
          width: '100%',
          background: 'rgba(239,68,68,0.12)',
          zIndex: 0,
          originX: 0,
          transformOrigin: 'left center',
        }}
      />

      {/* Content */}
      <span
        style={{
          position: 'relative',
          zIndex: 1,
          display: 'flex',
          alignItems: 'center',
          gap: 5,
        }}
      >
        <TrashIcon />
        {holding ? 'Release…' : 'Hold to delete'}
      </span>
    </button>
  )
}
