import { useEffect, useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useWCACompetitions } from '@/hooks/useWCACompetitions'
import { useProfile } from '@/providers/ProfileProvider'

// Country list (ISO2 → name) — common cubing countries
const COUNTRIES: { iso2: string; name: string; flag: string }[] = [
  { iso2: '', name: 'All Countries', flag: '' },
  { iso2: 'US', name: 'United States', flag: '🇺🇸' },
  { iso2: 'CN', name: 'China', flag: '🇨🇳' },
  { iso2: 'GB', name: 'United Kingdom', flag: '🇬🇧' },
  { iso2: 'DE', name: 'Germany', flag: '🇩🇪' },
  { iso2: 'AU', name: 'Australia', flag: '🇦🇺' },
  { iso2: 'CA', name: 'Canada', flag: '🇨🇦' },
  { iso2: 'FR', name: 'France', flag: '🇫🇷' },
  { iso2: 'IN', name: 'India', flag: '🇮🇳' },
  { iso2: 'JP', name: 'Japan', flag: '🇯🇵' },
  { iso2: 'KR', name: 'South Korea', flag: '🇰🇷' },
  { iso2: 'BR', name: 'Brazil', flag: '🇧🇷' },
  { iso2: 'PL', name: 'Poland', flag: '🇵🇱' },
  { iso2: 'NL', name: 'Netherlands', flag: '🇳🇱' },
  { iso2: 'SE', name: 'Sweden', flag: '🇸🇪' },
  { iso2: 'PH', name: 'Philippines', flag: '🇵🇭' },
  { iso2: 'ID', name: 'Indonesia', flag: '🇮🇩' },
  { iso2: 'MX', name: 'Mexico', flag: '🇲🇽' },
  { iso2: 'ES', name: 'Spain', flag: '🇪🇸' },
  { iso2: 'IT', name: 'Italy', flag: '🇮🇹' },
]

const COUNTRY_FLAGS: Record<string, string> = Object.fromEntries(
  COUNTRIES.filter((c) => c.iso2).map((c) => [c.iso2, c.flag]),
)

const EVENT_LABELS: Record<string, string> = {
  '333': '3x3', '222': '2x2', '444': '4x4', '555': '5x5',
  '666': '6x6', '777': '7x7', '333bf': '3BLD', '333oh': '3OH',
  '333fm': 'FMC', clock: 'Clock', minx: 'Minx', pyram: 'Pyram',
  skewb: 'Skewb', sq1: 'Sq-1', '444bf': '4BLD', '555bf': '5BLD',
  mbld: 'MBLD',
}

function formatDateRange(start: string, end: string): string {
  if (start === end) {
    const d = new Date(start + 'T00:00:00')
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }
  const s = new Date(start + 'T00:00:00')
  const e = new Date(end + 'T00:00:00')
  const sMonth = s.toLocaleDateString('en-US', { month: 'short' })
  const eMonth = e.toLocaleDateString('en-US', { month: 'short' })
  const year = e.getFullYear()
  if (sMonth === eMonth) {
    return `${sMonth} ${s.getDate()}–${e.getDate()}, ${year}`
  }
  return `${sMonth} ${s.getDate()} – ${eMonth} ${e.getDate()}, ${year}`
}

export function UpcomingCompsPage() {
  const navigate = useNavigate()
  const { profile } = useProfile()
  const { state, fetchComps } = useWCACompetitions()

  const [selectedCountry, setSelectedCountry] = useState('')
  const [searchQuery, setSearchQuery] = useState('')

  // Default country from profile if available
  useEffect(() => {
    // profile doesn't have country_code yet — just fetch all on load
    fetchComps(selectedCountry || undefined)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleCountryChange = (iso2: string) => {
    setSelectedCountry(iso2)
    fetchComps(iso2 || undefined)
  }

  const filtered = useMemo(() => {
    const comps = state.status === 'success' ? state.comps : []
    if (!searchQuery.trim()) return comps
    const q = searchQuery.toLowerCase()
    return comps.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.city.toLowerCase().includes(q),
    )
  }, [state, searchQuery])

  return (
    <div
      style={{
        padding: '32px 24px',
        maxWidth: 900,
        margin: '0 auto',
        width: '100%',
        minHeight: '100dvh',
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
            letterSpacing: '-0.02em',
          }}
        >
          Upcoming Competitions
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>
          Real WCA competitions worldwide. Click Simulate to compete against registered athletes.
        </p>
        {profile && !profile.wcaId && (
          <p style={{ color: 'var(--text-muted)', fontSize: 12, marginTop: 4 }}>
            Tip: Add your WCA ID in{' '}
            <span
              onClick={() => navigate('/settings')}
              style={{ color: 'var(--accent)', cursor: 'pointer', textDecoration: 'underline' }}
            >
              Settings
            </span>{' '}
            to see your events highlighted.
          </p>
        )}
      </div>

      {/* Filters */}
      <div
        style={{
          display: 'flex',
          gap: 12,
          marginBottom: 24,
          flexWrap: 'wrap',
        }}
      >
        {/* Search */}
        <div style={{ flex: '1 1 200px', position: 'relative' }}>
          <svg
            width="14"
            height="14"
            viewBox="0 0 14 14"
            fill="none"
            aria-hidden="true"
            style={{
              position: 'absolute',
              left: 10,
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--text-muted)',
            }}
          >
            <circle cx="5.5" cy="5.5" r="4" stroke="currentColor" strokeWidth="1.4" />
            <path d="M9 9l3 3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
          </svg>
          <input
            type="text"
            placeholder="Search competitions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              paddingLeft: 30,
              paddingRight: 12,
              paddingTop: 9,
              paddingBottom: 9,
              backgroundColor: 'var(--surface-0)',
              border: '1px solid var(--border)',
              borderRadius: 8,
              color: 'var(--text-primary)',
              fontSize: 14,
              outline: 'none',
              transition: 'border-color 150ms ease',
              boxSizing: 'border-box',
            }}
            onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--accent)' }}
            onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--border)' }}
          />
        </div>

        {/* Country */}
        <select
          value={selectedCountry}
          onChange={(e) => handleCountryChange(e.target.value)}
          style={{
            flex: '0 0 180px',
            padding: '9px 12px',
            backgroundColor: 'var(--surface-0)',
            border: '1px solid var(--border)',
            borderRadius: 8,
            color: 'var(--text-primary)',
            fontSize: 14,
            outline: 'none',
            cursor: 'pointer',
            appearance: 'none',
            WebkitAppearance: 'none',
          }}
        >
          {COUNTRIES.map((c) => (
            <option key={c.iso2} value={c.iso2}>
              {c.flag ? `${c.flag} ${c.name}` : c.name}
            </option>
          ))}
        </select>
      </div>

      {/* State feedback */}
      <AnimatePresence mode="wait">
        {state.status === 'loading' && (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              padding: 48,
              textAlign: 'center',
              color: 'var(--text-muted)',
              fontSize: 14,
            }}
          >
            <div
              style={{
                width: 24,
                height: 24,
                border: '2px solid var(--border)',
                borderTopColor: 'var(--accent)',
                borderRadius: '50%',
                animation: 'spin 0.8s linear infinite',
                margin: '0 auto 12px',
              }}
            />
            Loading competitions...
          </motion.div>
        )}

        {state.status === 'error' && (
          <motion.div
            key="error"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              padding: 32,
              textAlign: 'center',
              color: 'var(--penalty)',
              fontSize: 14,
            }}
          >
            {state.message}
          </motion.div>
        )}

        {state.status === 'success' && (
          <motion.div
            key="results"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {/* Count */}
            <div
              style={{
                fontSize: 12,
                color: 'var(--text-muted)',
                marginBottom: 16,
                fontWeight: 500,
              }}
            >
              {filtered.length} competition{filtered.length !== 1 ? 's' : ''}
              {searchQuery ? ` matching "${searchQuery}"` : ''}
            </div>

            {/* Cards */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {filtered.map((comp, i) => {
                const flag = COUNTRY_FLAGS[comp.country_iso2] ?? ''
                return (
                  <motion.div
                    key={comp.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: Math.min(i * 0.04, 0.4) }}
                    style={{
                      backgroundColor: 'var(--surface-0)',
                      border: '1px solid var(--border)',
                      borderRadius: 12,
                      padding: '16px 20px',
                      display: 'flex',
                      gap: 16,
                      alignItems: 'flex-start',
                    }}
                  >
                    {/* Left content */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 8,
                          marginBottom: 4,
                          flexWrap: 'wrap',
                        }}
                      >
                        {flag && (
                          <span style={{ fontSize: 18, lineHeight: 1 }}>{flag}</span>
                        )}
                        <h3
                          style={{
                            fontSize: 15,
                            fontWeight: 700,
                            color: 'var(--text-primary)',
                            margin: 0,
                            letterSpacing: '-0.01em',
                          }}
                        >
                          {comp.name}
                        </h3>
                      </div>

                      <div
                        style={{
                          fontSize: 13,
                          color: 'var(--text-muted)',
                          marginBottom: 12,
                          display: 'flex',
                          gap: 12,
                          flexWrap: 'wrap',
                        }}
                      >
                        <span>{formatDateRange(comp.start_date, comp.end_date)}</span>
                        <span>·</span>
                        <span>{comp.city}</span>
                        {comp.competitor_limit && (
                          <>
                            <span>·</span>
                            <span>Limit: {comp.competitor_limit}</span>
                          </>
                        )}
                      </div>

                      {/* Event pills */}
                      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                        {comp.event_ids.map((evId) => (
                          <span
                            key={evId}
                            style={{
                              display: 'inline-block',
                              padding: '2px 7px',
                              borderRadius: 4,
                              fontSize: 11,
                              fontWeight: 600,
                              backgroundColor: 'var(--surface-1)',
                              color: 'var(--text-muted)',
                              border: '1px solid var(--border)',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {EVENT_LABELS[evId] ?? evId}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Simulate button */}
                    <button
                      onClick={() =>
                        navigate(`/competition?compId=${encodeURIComponent(comp.id)}`)
                      }
                      style={{
                        flexShrink: 0,
                        alignSelf: 'center',
                        padding: '8px 16px',
                        borderRadius: 8,
                        border: 'none',
                        backgroundColor: 'var(--accent)',
                        color: '#000',
                        fontSize: 13,
                        fontWeight: 700,
                        cursor: 'pointer',
                        fontFamily: 'Inter, sans-serif',
                        whiteSpace: 'nowrap',
                        transition: 'opacity 150ms ease',
                      }}
                      onMouseOver={(e) => { e.currentTarget.style.opacity = '0.85' }}
                      onMouseOut={(e) => { e.currentTarget.style.opacity = '1' }}
                    >
                      Simulate
                    </button>
                  </motion.div>
                )
              })}

              {filtered.length === 0 && (
                <div
                  style={{
                    padding: 48,
                    textAlign: 'center',
                    color: 'var(--text-muted)',
                    fontSize: 14,
                  }}
                >
                  No competitions found.
                </div>
              )}
            </div>
          </motion.div>
        )}

        {state.status === 'idle' && (
          <motion.div
            key="idle"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{ padding: 48, textAlign: 'center', color: 'var(--text-muted)', fontSize: 14 }}
          >
            Fetching competitions...
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  )
}
