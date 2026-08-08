import { useRef } from 'react'
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform } from 'framer-motion'

interface SpotlightStatCellProps {
  label: string
  value: string | number
  highlight?: boolean
  color?: string
}

export function SpotlightStatCell({
  label,
  value,
  highlight = false,
  color = 'var(--accent)',
}: SpotlightStatCellProps) {
  const cardRef = useRef<HTMLDivElement>(null)

  // Raw normalized mouse position (0..1), center = 0.5
  const normX = useMotionValue(0.5)
  const normY = useMotionValue(0.5)
  const glowOpacity = useMotionValue(0)

  // Spring-smoothed versions
  const springNormX = useSpring(normX, { stiffness: 300, damping: 28 })
  const springNormY = useSpring(normY, { stiffness: 300, damping: 28 })
  const springGlow = useSpring(glowOpacity, { stiffness: 180, damping: 22 })

  // Convert normalized position to tilt degrees (-6..+6)
  const rotateY = useTransform(springNormX, [0, 1], [-6, 6])
  const rotateX = useTransform(springNormY, [0, 1], [6, -6])

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    const el = cardRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    normX.set((e.clientX - rect.left) / rect.width)
    normY.set((e.clientY - rect.top) / rect.height)
  }

  function handleMouseEnter() {
    glowOpacity.set(1)
  }

  function handleMouseLeave() {
    normX.set(0.5)
    normY.set(0.5)
    glowOpacity.set(0)
  }

  return (
    <motion.div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{
        background: 'var(--surface-1)',
        border: '1px solid var(--border)',
        borderRadius: 10,
        padding: '10px 16px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 4,
        minWidth: 80,
        position: 'relative',
        overflow: 'hidden',
        transformStyle: 'preserve-3d',
        perspective: 600,
        cursor: 'default',
        rotateX,
        rotateY,
      }}
    >
      {/* Static accent tint — always visible */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: 0,
          background: `radial-gradient(ellipse at 20% 20%, ${color}14, transparent 65%)`,
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />

      {/* Hover glow — animated opacity */}
      <motion.div
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: 0,
          opacity: springGlow,
          pointerEvents: 'none',
          zIndex: 0,
        }}
      >
        <motion.div
          style={{
            position: 'absolute',
            inset: 0,
            background: useTransform(
              [springNormX, springNormY],
              ([x, y]) =>
                `radial-gradient(ellipse at ${(x as number) * 100}% ${(y as number) * 100}%, ${color}30, transparent 65%)`
            ),
          }}
        />
      </motion.div>

      {/* Label */}
      <span
        style={{
          position: 'relative',
          zIndex: 1,
          fontSize: 10,
          fontWeight: 600,
          color: 'var(--text-muted)',
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
        }}
      >
        {label}
      </span>

      {/* Value with AnimatePresence slide transition */}
      <AnimatePresence mode="popLayout">
        <motion.span
          key={String(value)}
          initial={{ opacity: 0, y: -6, scale: 0.92 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 6, scale: 0.92 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          style={{
            position: 'relative',
            zIndex: 1,
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 18,
            fontWeight: 700,
            color: highlight ? color : 'var(--text-primary)',
            fontVariantNumeric: 'tabular-nums',
            display: 'block',
          }}
        >
          {value}
        </motion.span>
      </AnimatePresence>
    </motion.div>
  )
}
