import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useWCAData, type WCAPersonResult } from '@/hooks/useWCAData'
import { formatTime } from '@/lib/utils'
import type { Rival, WCAEvent } from '@/types'
import { generateId } from '@/lib/utils'

function SearchIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="1.5" />
      <path d="M11 11l3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

function SpinnerIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      aria-label="Loading"
      style={{ animation: 'spin 0.8s linear infinite' }}
    >
      <circle cx="8" cy="8" r="6" stroke="var(--border)" strokeWidth="2" />
      <path d="M8 2a6 6 0 0 1 6 6" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" />
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </svg>
  )
}

const DISPLAY_EVENTS: WCAEvent[] = ['333', '222', '444', '555', '333oh', 'pyram', 'skewb']
const EVENT_LABELS: Record<string, string> = {
  '333': '3x3', '222': '2x2', '444': '4x4', '555': '5x5',
  '333oh': 'OH', 'pyram': 'Pyram', 'skewb': 'Skewb',
}

function ResultCard({ data, onAdd }: { data: WCAPersonResult; onAdd: (rival: Rival) => void }) {
  const { person, personal_records } = data

  const handleAdd = () => {
    const rival: Rival = {
      id: generateId(),
      wcaId: person.wca_id,
      name: person.name,
      addedAt: Date.now(),
      lastSyncedAt: Date.now(),
      stats: DISPLAY_EVENTS.flatMap((event) => {
        const rec = personal_records[event]
        if (!rec) return []
        return [{
          event,
          single: rec.single?.best ?? null,
          ao5: null,
          ao12: null,
          ao100: rec.average?.best ?? null,
        }]
      }),
    }
    onAdd(rival)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
      style={{
        backgroundColor: 'var(--surface-0)',
        border: '1px solid var(--border)',
        borderRadius: 12,
        padding: '20px 24px',
        marginBottom: 12,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
        <div>
          <div style={{ fontSize: 17, fontWeight: 700, color: 'var(--text-primary)' }}>
            {person.name}
          </div>
          <div style={{ fontSize: 12, color: 'var(--accent)', fontFamily: "'JetBrains Mono', monospace", marginTop: 3 }}>
            {person.wca_id}
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
            {person.country_iso2}
          </div>
        </div>
        <button
          onClick={handleAdd}
          style={{
            padding: '8px 18px',
            backgroundColor: 'var(--accent)',
            color: '#020617',
            borderRadius: 8,
            border: 'none',
            fontSize: 13,
            fontWeight: 700,
            cursor: 'pointer',
            transition: 'opacity 150ms ease',
            flexShrink: 0,
          }}
          onMouseOver={(e) => { e.currentTarget.style.opacity = '0.85' }}
          onMouseOut={(e) => { e.currentTarget.style.opacity = '1' }}
        >
          Add Rival
        </button>
      </div>

      {/* Personal records grid */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {DISPLAY_EVENTS.map((event) => {
          const rec = personal_records[event]
          if (!rec) return null
          return (
            <div
              key={event}
              style={{
                backgroundColor: 'var(--surface-1)',
                border: '1px solid var(--border)',
                borderRadius: 8,
                padding: '8px 12px',
                minWidth: 72,
              }}
            >
              <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, letterSpacing: '0.04em', marginBottom: 4 }}>
                {EVENT_LABELS[event] ?? event}
              </div>
              {rec.single && (
                <div style={{ fontSize: 13, fontFamily: "'JetBrains Mono', monospace", color: 'var(--text-primary)', fontWeight: 500 }}>
                  {formatTime(rec.single.best)}
                </div>
              )}
              {rec.average && (
                <div style={{ fontSize: 11, fontFamily: "'JetBrains Mono', monospace", color: 'var(--text-muted)', marginTop: 2 }}>
                  avg {formatTime(rec.average.best)}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </motion.div>
  )
}

function ErrorBanner({ message }: { message: string }) {
  return (
    <div
      role="alert"
      style={{
        backgroundColor: 'rgba(239, 68, 68, 0.08)',
        border: '1px solid rgba(239, 68, 68, 0.3)',
        borderRadius: 10,
        padding: '12px 16px',
        display: 'flex',
        alignItems: 'flex-start',
        gap: 10,
        marginBottom: 20,
      }}
    >
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0, marginTop: 1 }}>
        <circle cx="8" cy="8" r="7" stroke="#EF4444" strokeWidth="1.5" />
        <path d="M8 5v3M8 10.5v.5" stroke="#EF4444" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
      <span style={{ fontSize: 13, color: '#EF4444', lineHeight: 1.5 }}>{message}</span>
    </div>
  )
}

export function RivalsPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [rivals, setRivals] = useState<Rival[]>([])
  const { state, lookup, reset } = useWCAData()

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (!searchQuery.trim()) return
    lookup(searchQuery.trim())
  }

  const handleInputChange = (val: string) => {
    setSearchQuery(val)
    if (state.status !== 'idle') reset()
  }

  const handleAddRival = (rival: Rival) => {
    setRivals((prev) => {
      if (prev.some((r) => r.wcaId === rival.wcaId)) return prev
      return [...prev, rival]
    })
    reset()
    setSearchQuery('')
  }

  const handleRemoveRival = (id: string) => {
    setRivals((prev) => prev.filter((r) => r.id !== id))
  }

  return (
    <div style={{ padding: '32px', maxWidth: 880, margin: '0 auto', width: '100%' }}>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 6 }}>
          Rivals
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>
          Track other competitors and compare your stats.
        </p>
      </div>

      {/* Search — pill container */}
      <form
        onSubmit={handleSearch}
        style={{
          display: 'flex',
          alignItems: 'center',
          borderRadius: 999,
          border: '1px solid var(--border)',
          backgroundColor: 'var(--surface-0)',
          overflow: 'hidden',
          maxWidth: 440,
          marginBottom: 24,
        }}
      >
        <div style={{ position: 'relative', flex: 1 }}>
          <div
            style={{
              position: 'absolute',
              left: 16,
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--text-muted)',
              pointerEvents: 'none',
              display: 'flex',
            }}
          >
            {state.status === 'loading' ? <SpinnerIcon /> : <SearchIcon />}
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => handleInputChange(e.target.value)}
            placeholder="WCA ID (e.g. 2009ZEMD01)"
            autoCapitalize="characters"
            autoCorrect="off"
            spellCheck={false}
            style={{
              width: '100%',
              backgroundColor: 'transparent',
              border: 'none',
              padding: '11px 12px 11px 42px',
              color: 'var(--text-primary)',
              fontSize: 14,
              outline: 'none',
              fontFamily: "'JetBrains Mono', monospace",
            }}
          />
        </div>
        {/* Divider */}
        <div style={{ width: 1, height: 28, backgroundColor: 'var(--border)', flexShrink: 0 }} />
        <button
          type="submit"
          disabled={!searchQuery.trim() || state.status === 'loading'}
          style={{
            padding: '11px 20px',
            backgroundColor: 'transparent',
            color: searchQuery.trim() && state.status !== 'loading' ? 'var(--accent)' : 'var(--text-muted)',
            border: 'none',
            fontSize: 14,
            fontWeight: 600,
            cursor: searchQuery.trim() && state.status !== 'loading' ? 'pointer' : 'not-allowed',
            opacity: searchQuery.trim() && state.status !== 'loading' ? 1 : 0.5,
            transition: 'opacity 150ms ease, color 150ms ease',
            whiteSpace: 'nowrap',
          }}
        >
          Look up
        </button>
      </form>

      {/* Error states */}
      <AnimatePresence mode="wait">
        {state.status === 'error' && (
          <motion.div
            key="error"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            <ErrorBanner message={`Lookup failed: ${state.message}`} />
          </motion.div>
        )}
        {state.status === 'not_found' && (
          <motion.div
            key="not-found"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            <ErrorBanner message={`No WCA competitor found with ID "${searchQuery.trim().toUpperCase()}". Check the ID and try again.`} />
          </motion.div>
        )}
        {state.status === 'success' && (
          <motion.div
            key="result"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            <ResultCard data={state.data} onAdd={handleAddRival} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tracked rivals */}
      {rivals.length > 0 && (
        <div>
          <div style={{ fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 600, marginBottom: 12 }}>
            Tracked ({rivals.length})
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {rivals.map((rival) => {
              // Hash wcaId chars to pick avatar color
              const colorSum = rival.wcaId.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0)
              const avatarColors = ['#7C3AED', '#DC2626', '#D97706', '#059669']
              const avatarBg = avatarColors[colorSum % 4]
              const initials = rival.name.trim().split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase()
              return (
                <div
                  key={rival.id}
                  style={{
                    backgroundColor: 'var(--surface-0)',
                    border: '1px solid var(--border)',
                    borderRadius: 10,
                    padding: '14px 18px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 16,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    {/* Avatar circle */}
                    <div style={{
                      width: 36,
                      height: 36,
                      borderRadius: '50%',
                      backgroundColor: avatarBg,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 13,
                      fontWeight: 700,
                      color: '#fff',
                      fontFamily: "'JetBrains Mono', monospace",
                      flexShrink: 0,
                    }}>
                      {initials}
                    </div>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>
                        {rival.name}
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--accent)', fontFamily: "'JetBrains Mono', monospace", marginTop: 2 }}>
                        {rival.wcaId}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => handleRemoveRival(rival.id)}
                    aria-label={`Remove ${rival.name}`}
                    style={{
                      background: 'none',
                      border: '1px solid var(--border)',
                      borderRadius: 6,
                      padding: '4px 10px',
                      color: 'var(--text-muted)',
                      fontSize: 12,
                      cursor: 'pointer',
                      transition: 'color 150ms ease, border-color 150ms ease',
                    }}
                    onMouseOver={(e) => { e.currentTarget.style.color = 'var(--penalty)'; e.currentTarget.style.borderColor = 'var(--penalty)' }}
                    onMouseOut={(e) => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.borderColor = 'var(--border)' }}
                  >
                    Remove
                  </button>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Empty state */}
      {rivals.length === 0 && state.status === 'idle' && (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '80px 32px',
            backgroundColor: 'var(--surface-0)',
            border: '1px solid var(--border)',
            borderRadius: 12,
            textAlign: 'center',
            gap: 8,
          }}
        >
          <p style={{ fontSize: 28, margin: 0 }}>🔍</p>
          <p style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-muted)', margin: 0 }}>
            Search for a WCA competitor above
          </p>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', maxWidth: 300, opacity: 0.7 }}>
            Enter a WCA ID to find a competitor and start tracking their stats.
          </p>
        </div>
      )}
    </div>
  )
}
