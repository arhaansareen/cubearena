import { NavLink, Outlet } from 'react-router-dom'
import { type ReactNode, useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useProfile } from '@/providers/ProfileProvider'

interface NavItem {
  to: string
  label: string
  icon: ReactNode
}

function DashboardIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <rect x="2" y="2" width="7" height="7" rx="1.5" fill="currentColor" opacity="0.9" />
      <rect x="11" y="2" width="7" height="7" rx="1.5" fill="currentColor" opacity="0.9" />
      <rect x="2" y="11" width="7" height="7" rx="1.5" fill="currentColor" opacity="0.9" />
      <rect x="11" y="11" width="7" height="7" rx="1.5" fill="currentColor" opacity="0.9" />
    </svg>
  )
}

function SessionIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <circle cx="10" cy="10" r="7.5" stroke="currentColor" strokeWidth="1.5" />
      <path d="M10 6v4l2.5 2.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function HistoryIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path d="M3 6h14M3 10h14M3 14h9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

function RivalsIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <circle cx="7" cy="7" r="3" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="13" cy="7" r="3" stroke="currentColor" strokeWidth="1.5" />
      <path d="M2 17c0-2.761 2.239-5 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M18 17c0-2.761-2.239-5-5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

function CalendarIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <rect x="2" y="4" width="16" height="13" rx="2" stroke="currentColor" strokeWidth="1.5" />
      <path d="M2 8.5h16" stroke="currentColor" strokeWidth="1.5" />
      <path d="M6.5 2v4M13.5 2v4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="6.5" cy="13" r="1" fill="currentColor" />
      <circle cx="10" cy="13" r="1" fill="currentColor" />
      <circle cx="13.5" cy="13" r="1" fill="currentColor" />
    </svg>
  )
}

function TrophyIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path
        d="M10 13c-3.314 0-6-2.686-6-6V3h12v4c0 3.314-2.686 6-6 6z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path d="M4 5H2.5a1 1 0 00-1 1v1a3 3 0 003 3H5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M16 5h1.5a1 1 0 011 1v1a3 3 0 01-3 3H15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M10 13v3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M7 18h6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

function GlobeIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <circle cx="10" cy="10" r="7.5" stroke="currentColor" strokeWidth="1.5" />
      <ellipse cx="10" cy="10" rx="3" ry="7.5" stroke="currentColor" strokeWidth="1.5" />
      <path d="M2.5 10h15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

function LeaderboardIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <rect x="2"  y="10" width="4" height="8" rx="1" fill="currentColor" opacity="0.7" />
      <rect x="8"  y="6"  width="4" height="12" rx="1" fill="currentColor" opacity="0.9" />
      <rect x="14" y="2"  width="4" height="16" rx="1" fill="currentColor" />
    </svg>
  )
}

function ProfileNavIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <circle cx="10" cy="7" r="3.5" stroke="currentColor" strokeWidth="1.5" />
      <path d="M3 17c0-3.314 3.134-6 7-6s7 2.686 7 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

function SettingsIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <circle cx="10" cy="10" r="2.5" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M10 2v1.5M10 16.5V18M2 10h1.5M16.5 10H18M4.222 4.222l1.06 1.06M14.718 14.718l1.06 1.06M4.222 15.778l1.06-1.06M14.718 5.282l1.06-1.06"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  )
}

const DESKTOP_NAV: NavItem[] = [
  { to: '/', label: 'Dashboard', icon: <DashboardIcon /> },
  { to: '/session', label: 'Session', icon: <SessionIcon /> },
  { to: '/history', label: 'History', icon: <HistoryIcon /> },
  { to: '/calendar', label: 'Calendar', icon: <CalendarIcon /> },
  { to: '/upcoming', label: 'Upcoming', icon: <GlobeIcon /> },
  { to: '/rivals', label: 'Rivals', icon: <RivalsIcon /> },
  { to: '/competition', label: 'Compete', icon: <TrophyIcon /> },
  { to: '/leaderboard', label: 'Leaderboard', icon: <LeaderboardIcon /> },
  { to: '/profile', label: 'Profile', icon: <ProfileNavIcon /> },
  { to: '/settings', label: 'Settings', icon: <SettingsIcon /> },
]

const MOBILE_NAV: NavItem[] = [
  { to: '/', label: 'Dashboard', icon: <DashboardIcon /> },
  { to: '/session', label: 'Session', icon: <SessionIcon /> },
  { to: '/competition', label: 'Compete', icon: <TrophyIcon /> },
  { to: '/leaderboard', label: 'Rankings', icon: <LeaderboardIcon /> },
  { to: '/rivals', label: 'Rivals', icon: <RivalsIcon /> },
]

const MIN_WIDTH = 180
const MAX_WIDTH = 340
const DEFAULT_WIDTH = 240

function loadWidth(): number {
  try {
    const v = localStorage.getItem('cubearena:sidebar-width')
    const n = v ? parseInt(v, 10) : DEFAULT_WIDTH
    return isNaN(n) ? DEFAULT_WIDTH : Math.max(MIN_WIDTH, Math.min(MAX_WIDTH, n))
  } catch {
    return DEFAULT_WIDTH
  }
}

function ProfileStrip({ compact }: { compact: boolean }) {
  const { profile, loading } = useProfile()
  const displayName = profile?.displayName || null
  const wcaId = profile?.wcaId || null
  const initials = displayName
    ? displayName.trim().split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase()
    : '?'

  if (loading) return null

  return (
    <NavLink
      to="/profile"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: compact ? 0 : 10,
        padding: compact ? '12px 0' : '12px 20px',
        justifyContent: compact ? 'center' : 'flex-start',
        borderTop: '1px solid var(--border)',
        marginTop: 'auto',
        cursor: 'pointer',
        transition: 'background-color 150ms ease',
        textDecoration: 'none',
      }}
      onMouseOver={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = 'var(--accent-dim)' }}
      onMouseOut={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent' }}
    >
      <div style={{ position: 'relative', flexShrink: 0 }} aria-hidden="true">
        <div style={{
          width: 32, height: 32, borderRadius: '50%',
          backgroundColor: 'var(--accent-dim)',
          border: '1px solid var(--accent)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 12, fontWeight: 700, color: 'var(--accent)',
          fontFamily: "'JetBrains Mono', monospace",
        }}>
          {initials}
        </div>
        <div style={{
          position: 'absolute', bottom: 0, right: 0,
          width: 9, height: 9, borderRadius: '50%',
          backgroundColor: '#22c55e', border: '2px solid var(--surface-0)',
        }} />
      </div>
      {!compact && (
        <div style={{ minWidth: 0, overflow: 'hidden' }}>
          <div style={{
            fontSize: 13, fontWeight: 600, color: 'var(--text-primary)',
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          }}>
            {displayName ?? 'Set your name'}
          </div>
          {wcaId ? (
            <div style={{ fontSize: 11, color: 'var(--accent)', fontFamily: "'JetBrains Mono', monospace", marginTop: 1 }}>
              {wcaId}
            </div>
          ) : (
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 1 }}>Settings</div>
          )}
        </div>
      )}
    </NavLink>
  )
}

export function AppShell() {
  const [sidebarWidth, setSidebarWidth] = useState(loadWidth)
  const [collapsed, setCollapsed] = useState(false)
  const [handleHovered, setHandleHovered] = useState(false)
  const dragging = useRef(false)
  const startX = useRef(0)
  const startWidth = useRef(0)
  const widthRef = useRef(sidebarWidth)
  widthRef.current = sidebarWidth

  // compact mode: labels hidden when width is narrow
  const compact = !collapsed && sidebarWidth < 210

  const onHandlePointerDown = useCallback((e: React.PointerEvent) => {
    if (e.button !== 0) return
    e.currentTarget.setPointerCapture(e.pointerId)
    dragging.current = false
    startX.current = e.clientX
    startWidth.current = widthRef.current
  }, [])

  const onHandlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!(e.buttons & 1)) return
    const dx = e.clientX - startX.current
    if (!dragging.current && Math.abs(dx) < 4) return
    dragging.current = true
    if (collapsed) return
    const next = Math.max(MIN_WIDTH, Math.min(MAX_WIDTH, startWidth.current + dx))
    setSidebarWidth(next)
    try { localStorage.setItem('cubearena:sidebar-width', String(Math.round(next))) } catch {}
  }, [collapsed])

  const onHandlePointerUp = useCallback(() => {
    if (!dragging.current) {
      setCollapsed((p) => !p)
    }
    dragging.current = false
  }, [])

  // Prevent text selection while dragging
  useEffect(() => {
    const prevent = (e: Event) => { if (dragging.current) e.preventDefault() }
    document.addEventListener('selectstart', prevent)
    return () => document.removeEventListener('selectstart', prevent)
  }, [])

  const effectiveWidth = collapsed ? 0 : sidebarWidth

  return (
    <>
      {/* Desktop sidebar */}
      <div
        className="app-shell-desktop"
        style={{
          width: effectiveWidth,
          minHeight: '100dvh',
          backgroundColor: 'var(--surface-0)',
          display: 'flex',
          flexDirection: 'column',
          position: 'fixed',
          top: 0,
          left: 0,
          zIndex: 100,
          overflow: 'hidden',
          transition: 'width 0.2s ease',
          flexShrink: 0,
        }}
      >
        <AnimatePresence>
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.12 }}
              style={{ display: 'flex', flexDirection: 'column', flex: 1, width: sidebarWidth, minWidth: sidebarWidth }}
            >
              {/* Logo */}
              <div style={{ padding: compact ? '24px 0 24px' : '24px 20px 24px', borderBottom: '1px solid var(--border)', marginBottom: 8, textAlign: compact ? 'center' : 'left' }}>
                <span style={{
                  fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
                  fontSize: compact ? 13 : 16,
                  fontWeight: 800,
                  letterSpacing: '-0.03em',
                  color: 'var(--accent)',
                }}>
                  {compact ? 'CA' : 'CubeArena'}
                </span>
              </div>

              {/* Nav */}
              <nav style={{ flex: 1, padding: '0 8px' }}>
                {DESKTOP_NAV.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.to === '/'}
                    title={compact ? item.label : undefined}
                    style={({ isActive }) => ({
                      display: 'flex',
                      alignItems: 'center',
                      gap: compact ? 0 : 12,
                      justifyContent: compact ? 'center' : 'flex-start',
                      padding: compact ? '10px 0' : '10px 10px 10px 12px',
                      fontSize: 14,
                      fontWeight: isActive ? 600 : 500,
                      color: isActive ? 'var(--accent)' : 'var(--text-muted)',
                      backgroundColor: isActive ? 'var(--accent-dim)' : 'transparent',
                      transition: 'color 150ms ease, background-color 150ms ease, border-color 150ms ease',
                      borderRadius: 8,
                      margin: '2px 0',
                      cursor: 'pointer',
                      textDecoration: 'none',
                      borderLeft: compact ? 'none' : `3px solid ${isActive ? 'var(--accent)' : 'transparent'}`,
                    })}
                    onMouseOver={(e) => {
                      const el = e.currentTarget as HTMLElement
                      el.style.color = 'var(--text-primary)'
                      el.style.backgroundColor = 'rgba(255,255,255,0.04)'
                    }}
                    onMouseOut={(e) => {
                      const el = e.currentTarget as HTMLElement
                      el.style.color = ''
                      el.style.backgroundColor = ''
                    }}
                  >
                    {item.icon}
                    {!compact && <span>{item.label}</span>}
                  </NavLink>
                ))}
              </nav>

              <ProfileStrip compact={compact} />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Drag handle — right edge of sidebar */}
        <div
          onPointerDown={onHandlePointerDown}
          onPointerMove={onHandlePointerMove}
          onPointerUp={onHandlePointerUp}
          onMouseEnter={() => setHandleHovered(true)}
          onMouseLeave={() => setHandleHovered(false)}
          style={{
            position: 'absolute',
            top: 0,
            right: 0,
            width: 6,
            height: '100%',
            cursor: collapsed ? 'e-resize' : 'col-resize',
            zIndex: 102,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {/* Visual indicator */}
          <div style={{
            width: 2,
            height: '100%',
            backgroundColor: handleHovered ? 'var(--accent)' : 'var(--border)',
            opacity: handleHovered ? 0.7 : 1,
            transition: 'background-color 150ms ease, opacity 150ms ease',
          }} />
        </div>
      </div>

      {/* Collapsed expand button — slim tab on left edge */}
      {collapsed && (
        <button
          className="app-shell-desktop"
          onClick={() => setCollapsed(false)}
          title="Show sidebar"
          style={{
            position: 'fixed',
            top: '50%',
            left: 0,
            transform: 'translateY(-50%)',
            zIndex: 101,
            width: 16,
            height: 56,
            borderRadius: '0 6px 6px 0',
            border: '1px solid var(--border)',
            borderLeft: 'none',
            backgroundColor: 'var(--surface-0)',
            color: 'var(--text-muted)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 0,
          }}
          onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--surface-1)'; e.currentTarget.style.color = 'var(--accent)' }}
          onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'var(--surface-0)'; e.currentTarget.style.color = 'var(--text-muted)' }}
        >
          <svg width="6" height="10" viewBox="0 0 6 10" fill="none" aria-hidden="true">
            <path d="M1 1l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      )}

      {/* Main content */}
      <div
        className="app-shell-content"
        style={{
          marginLeft: effectiveWidth,
          flex: 1,
          minHeight: '100dvh',
          backgroundColor: 'var(--bg)',
          transition: 'margin-left 0.2s ease',
        }}
      >
        <Outlet />
      </div>

      {/* Mobile bottom nav */}
      <div className="app-shell-mobile-nav" style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: 'var(--surface-0)',
        borderTop: '1px solid var(--border)',
        display: 'flex',
        zIndex: 100,
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}>
        {MOBILE_NAV.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            style={({ isActive }) => ({
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 4,
              padding: '10px 0',
              fontSize: 10,
              fontWeight: 500,
              color: isActive ? 'var(--accent)' : 'var(--text-muted)',
              transition: 'color 150ms ease',
              cursor: 'pointer',
              textDecoration: 'none',
            })}
          >
            {item.icon}
            <span>{item.label}</span>
          </NavLink>
        ))}
      </div>

      <style>{`
        @media (min-width: 768px) {
          .app-shell-mobile-nav { display: none !important; }
        }
        @media (max-width: 767px) {
          .app-shell-desktop { display: none !important; }
          .app-shell-content {
            margin-left: 0 !important;
            padding-bottom: calc(60px + env(safe-area-inset-bottom));
          }
        }
      `}</style>
    </>
  )
}
