import { useNavigate } from 'react-router-dom'

const WCA_EVENTS_PB: { label: string; pb: string | null }[] = [
  { label: '3x3', pb: null },
  { label: '2x2', pb: null },
  { label: '4x4', pb: null },
  { label: 'OH', pb: null },
  { label: 'Pyra', pb: null },
  { label: 'Skewb', pb: null },
]

function PlayIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
      <path d="M6 4.5l11 5.5-11 5.5V4.5z" />
    </svg>
  )
}

function LinkIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <path d="M6 2H2v10h10V8M8 2h4v4M8 6l4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function DashboardPage() {
  const navigate = useNavigate()

  return (
    <div
      style={{
        padding: '32px 32px 32px',
        maxWidth: 880,
        margin: '0 auto',
        width: '100%',
      }}
    >
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <h1
          style={{
            fontSize: 28,
            fontWeight: 700,
            color: 'var(--text-primary)',
            marginBottom: 6,
          }}
        >
          Dashboard
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>
          Welcome back. Ready to cube?
        </p>
      </div>

      {/* Quick start */}
      <button
        onClick={() => navigate('/session')}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: '18px 28px',
          backgroundColor: 'var(--accent)',
          color: '#020617',
          borderRadius: 12,
          fontSize: 17,
          fontWeight: 700,
          cursor: 'pointer',
          border: 'none',
          marginBottom: 40,
          transition: 'opacity 150ms ease, transform 150ms ease',
          boxShadow: '0 0 32px rgba(34,211,238,0.2)',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.opacity = '0.9'
          e.currentTarget.style.transform = 'translateY(-1px)'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.opacity = '1'
          e.currentTarget.style.transform = 'translateY(0)'
        }}
      >
        <PlayIcon />
        Quick Start Session
      </button>

      {/* Personal bests */}
      <section style={{ marginBottom: 40 }}>
        <h2
          style={{
            fontSize: 16,
            fontWeight: 600,
            color: 'var(--text-primary)',
            marginBottom: 16,
            letterSpacing: '-0.01em',
          }}
        >
          Personal Bests
        </h2>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))',
            gap: 12,
          }}
        >
          {WCA_EVENTS_PB.map(({ label, pb }) => (
            <div
              key={label}
              style={{
                backgroundColor: 'var(--surface-0)',
                border: '1px solid var(--border)',
                borderRadius: 10,
                padding: '14px 16px',
                display: 'flex',
                flexDirection: 'column',
                gap: 4,
              }}
            >
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  color: 'var(--text-muted)',
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                }}
              >
                {label}
              </span>
              <span
                className="font-mono"
                style={{
                  fontSize: 22,
                  fontWeight: 700,
                  color: pb ? 'var(--text-primary)' : 'var(--text-muted)',
                  letterSpacing: '-0.02em',
                }}
              >
                {pb ?? '--'}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* Recent sessions */}
      <section style={{ marginBottom: 40 }}>
        <h2
          style={{
            fontSize: 16,
            fontWeight: 600,
            color: 'var(--text-primary)',
            marginBottom: 16,
            letterSpacing: '-0.01em',
          }}
        >
          Recent Sessions
        </h2>
        <div
          style={{
            backgroundColor: 'var(--surface-0)',
            border: '1px solid var(--border)',
            borderRadius: 10,
            padding: '32px',
            textAlign: 'center',
            color: 'var(--text-muted)',
            fontSize: 14,
          }}
        >
          No sessions yet. Start solving to see your history here.
        </div>
      </section>

      {/* WCA ID prompt */}
      <div
        style={{
          backgroundColor: 'var(--surface-0)',
          border: '1px solid var(--border)',
          borderRadius: 10,
          padding: '16px 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 16,
        }}
      >
        <div>
          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 2 }}>
            Link your WCA ID
          </div>
          <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
            Track rivals and compare with official results.
          </div>
        </div>
        <button
          onClick={() => navigate('/settings')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '8px 16px',
            backgroundColor: 'var(--surface-1)',
            border: '1px solid var(--border)',
            borderRadius: 8,
            color: 'var(--text-primary)',
            fontSize: 13,
            fontWeight: 500,
            cursor: 'pointer',
            transition: 'border-color 150ms ease',
            whiteSpace: 'nowrap',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)' }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border)' }}
        >
          <LinkIcon />
          Add WCA ID
        </button>
      </div>
    </div>
  )
}
