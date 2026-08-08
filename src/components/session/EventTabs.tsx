import { useLayoutEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import type { WCAEvent } from '@/types'

const WCA_EVENTS: { value: WCAEvent; label: string }[] = [
  { value: '333', label: '3x3' },
  { value: '222', label: '2x2' },
  { value: '444', label: '4x4' },
  { value: '555', label: '5x5' },
  { value: '666', label: '6x6' },
  { value: '777', label: '7x7' },
  { value: '333bf', label: '3BLD' },
  { value: '333oh', label: '3OH' },
  { value: '333fm', label: 'FMC' },
  { value: 'clock', label: 'Clock' },
  { value: 'minx', label: 'Megaminx' },
  { value: 'pyram', label: 'Pyraminx' },
  { value: 'skewb', label: 'Skewb' },
  { value: 'sq1', label: 'Sq-1' },
  { value: '444bf', label: '4BLD' },
  { value: '555bf', label: '5BLD' },
]

interface EventTabsProps {
  value: WCAEvent
  onChange: (e: WCAEvent) => void
}

export function EventTabs({ value, onChange }: EventTabsProps) {
  const buttonRefs = useRef<Map<WCAEvent, HTMLButtonElement>>(new Map())
  const [indicatorStyle, setIndicatorStyle] = useState<{ left: number; width: number; top: number; height: number }>({
    left: 0,
    width: 0,
    top: 0,
    height: 0,
  })

  useLayoutEffect(() => {
    const el = buttonRefs.current.get(value)
    if (el) {
      const parent = el.offsetParent as HTMLElement | null
      const parentLeft = parent ? 0 : 0
      setIndicatorStyle({
        left: el.offsetLeft - parentLeft,
        top: el.offsetTop,
        width: el.offsetWidth,
        height: el.offsetHeight,
      })
    }
  }, [value])

  return (
    <div
      style={{
        position: 'relative',
        display: 'flex',
        gap: 2,
        overflowX: 'auto',
        scrollbarWidth: 'none',
        msOverflowStyle: 'none',
        flexShrink: 0,
      }}
    >
      <style>{`
        .event-tabs-container::-webkit-scrollbar { display: none; }
      `}</style>

      {/* Sliding indicator */}
      <motion.div
        aria-hidden="true"
        animate={{
          left: indicatorStyle.left,
          top: indicatorStyle.top,
          width: indicatorStyle.width,
          height: indicatorStyle.height,
        }}
        transition={{ type: 'spring', stiffness: 380, damping: 30 }}
        style={{
          position: 'absolute',
          background: 'var(--accent-dim)',
          border: '1px solid var(--accent)',
          borderRadius: 6,
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />

      {WCA_EVENTS.map((ev) => (
        <button
          key={ev.value}
          ref={(el) => {
            if (el) buttonRefs.current.set(ev.value, el)
            else buttonRefs.current.delete(ev.value)
          }}
          onClick={() => onChange(ev.value)}
          style={{
            position: 'relative',
            zIndex: 1,
            padding: '6px 10px',
            fontSize: 12,
            fontWeight: value === ev.value ? 700 : 500,
            fontFamily: "'JetBrains Mono', monospace",
            color: value === ev.value ? 'var(--text-primary)' : 'var(--text-muted)',
            background: 'none',
            border: 'none',
            borderRadius: 6,
            cursor: 'pointer',
            whiteSpace: 'nowrap',
            transition: 'color 150ms ease, font-weight 150ms ease',
            flexShrink: 0,
          }}
        >
          {ev.label}
        </button>
      ))}
    </div>
  )
}
