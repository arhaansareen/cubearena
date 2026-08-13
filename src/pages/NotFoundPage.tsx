import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'

export function NotFoundPage() {
  const navigate = useNavigate()

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '60dvh',
        padding: 32,
        textAlign: 'center',
        gap: 16,
      }}
    >
      {/* Cube icon */}
      <svg width="48" height="48" viewBox="0 0 48 48" fill="none" aria-hidden="true">
        <path d="M24 8L40 17L24 26L8 17Z" fill="rgba(34,211,238,0.5)"/>
        <path d="M8 17L24 26L24 42L8 33Z" fill="rgba(8,145,178,0.5)"/>
        <path d="M40 17L24 26L24 42L40 33Z" fill="rgba(14,116,144,0.5)"/>
      </svg>

      <div>
        <div style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 72,
          fontWeight: 700,
          color: 'var(--border)',
          lineHeight: 1,
          letterSpacing: '-0.04em',
        }}>
          404
        </div>
        <p style={{ fontSize: 15, color: 'var(--text-muted)', marginTop: 8 }}>
          This page doesn't exist.
        </p>
      </div>

      <button
        onClick={() => navigate('/')}
        style={{
          marginTop: 8,
          padding: '10px 24px',
          borderRadius: 8,
          border: '1px solid var(--border)',
          backgroundColor: 'var(--surface-0)',
          color: 'var(--text-primary)',
          fontSize: 14,
          fontWeight: 500,
          cursor: 'pointer',
          transition: 'border-color 150ms ease',
        }}
        onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)' }}
        onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border)' }}
      >
        Back to dashboard
      </button>
    </motion.div>
  )
}
