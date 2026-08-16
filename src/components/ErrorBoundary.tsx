import { Component, type ErrorInfo, type ReactNode } from 'react'

interface Props { children: ReactNode }
interface State { error: Error | null }

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[ErrorBoundary]', error, info.componentStack)
  }

  render() {
    const { error } = this.state
    if (!error) return this.props.children
    return (
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        minHeight: '100dvh', padding: 32, gap: 16, backgroundColor: 'var(--bg)', color: 'var(--text-primary)',
        fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
      }}>
        <div style={{ fontSize: 32 }}>⚠️</div>
        <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>Something went wrong</h2>
        <p style={{ fontSize: 14, color: 'var(--text-muted)', margin: 0, textAlign: 'center', maxWidth: 400 }}>
          {error.message || 'An unexpected error occurred.'}
        </p>
        <button
          onClick={() => window.location.reload()}
          style={{
            padding: '8px 20px', borderRadius: 8, border: '1px solid var(--border)',
            backgroundColor: 'var(--surface-1)', color: 'var(--text-primary)',
            fontSize: 13, fontWeight: 500, cursor: 'pointer',
            transition: 'background-color 150ms ease',
          }}
          onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'var(--accent-dim)')}
          onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'var(--surface-1)')}
        >
          Reload app
        </button>
      </div>
    )
  }
}
