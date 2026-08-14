import { NavLink, Outlet } from 'react-router-dom'
import { type ReactNode, useState } from 'react'
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

function AlgorithmsIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <rect x="2" y="2" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
      <rect x="11" y="2" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
      <rect x="2" y="11" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
      <rect x="11" y="11" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  )
}

function RaceIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path d="M3 10h14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M13 6l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M3 6l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
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
  { to: '/algorithms', label: 'Algorithms', icon: <AlgorithmsIcon /> },
  { to: '/rivals', label: 'Rivals', icon: <RivalsIcon /> },
  { to: '/race', label: 'Race', icon: <RaceIcon /> },
  { to: '/competition', label: 'Compete', icon: <TrophyIcon /> },
  { to: '/leaderboard', label: 'Leaderboard', icon: <LeaderboardIcon /> },
  { to: '/profile', label: 'Profile', icon: <ProfileNavIcon /> },
  { to: '/settings', label: 'Settings', icon: <SettingsIcon /> },
]

const MOBILE_NAV: NavItem[] = [
  { to: '/', label: 'Dashboard', icon: <DashboardIcon /> },
  { to: '/session', label: 'Session', icon: <SessionIcon /> },
  { to: '/race', label: 'Race', icon: <RaceIcon /> },
  { to: '/competition', label: 'Compete', icon: <TrophyIcon /> },
  { to: '/leaderboard', label: 'Rankings', icon: <LeaderboardIcon /> },
  { to: '/rivals', label: 'Rivals', icon: <RivalsIcon /> },
]

const SIDEBAR_WIDTH = 240

function ProfileStrip() {
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
        gap: 10,
        padding: '12px 20px',
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
      <div style={{ minWidth: 0, overflow: 'hidden' }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {displayName ?? 'Set your name'}
        </div>
        {wcaId ? (
          <div style={{ fontSize: 11, color: 'var(--accent)', fontFamily: "'JetBrains Mono', monospace", marginTop: 1 }}>{wcaId}</div>
        ) : (
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 1 }}>Settings</div>
        )}
      </div>
    </NavLink>
  )
}

export function AppShell() {
  const [collapsed, setCollapsed] = useState(false)
  const effectiveWidth = collapsed ? 0 : SIDEBAR_WIDTH

  return (
    <>
      {/* Desktop sidebar */}
      <div
        className="app-shell-desktop"
        style={{
          width: effectiveWidth,
          minHeight: '100dvh',
          backgroundColor: 'var(--surface-0)',
          borderRight: collapsed ? 'none' : '1px solid var(--border)',
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
              style={{ display: 'flex', flexDirection: 'column', flex: 1, width: SIDEBAR_WIDTH, minWidth: SIDEBAR_WIDTH, padding: '24px 0 0' }}
            >
              {/* Logo */}
              <div style={{ padding: '0 20px 20px', borderBottom: '1px solid var(--border)', marginBottom: 8 }}>
                <span style={{ fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif", fontSize: 16, fontWeight: 800, letterSpacing: '-0.03em', color: 'var(--accent)' }}>
                  CubeArena
                </span>
              </div>

              {/* Nav */}
              <nav style={{ flex: 1, padding: '0 8px' }}>
                {DESKTOP_NAV.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.to === '/'}
                    style={({ isActive }) => ({
                      display: 'flex', alignItems: 'center', gap: 12,
                      padding: '10px 10px 10px 12px',
                      fontSize: 14, fontWeight: isActive ? 600 : 400,
                      color: isActive ? 'var(--accent)' : 'var(--text-primary)',
                      backgroundColor: isActive ? 'var(--accent-dim)' : 'transparent',
                      transition: 'background-color 150ms ease, transform 120ms ease, box-shadow 120ms ease',
                      borderRadius: 8, margin: '2px 0', cursor: 'pointer', textDecoration: 'none',
                      borderLeft: `3px solid ${isActive ? 'var(--accent)' : 'transparent'}`,
                    })}
                    onMouseOver={(e) => { const el = e.currentTarget as HTMLElement; el.style.backgroundColor = 'rgba(255,255,255,0.05)'; el.style.transform = 'translateX(2px)' }}
                    onMouseOut={(e) => { const el = e.currentTarget as HTMLElement; el.style.backgroundColor = ''; el.style.transform = '' }}
                  >
                    {item.icon}
                    <span>{item.label}</span>
                  </NavLink>
                ))}
              </nav>

              <div style={{
                padding: '6px 20px 10px',
                fontSize: 10,
                color: 'var(--text-muted)',
                opacity: 0.45,
                letterSpacing: '0.01em',
              }}>
                © {new Date().getFullYear()} Arhaan Sareen
              </div>

              <ProfileStrip />
            </motion.div>
          )}
        </AnimatePresence>

      </div>

      {/* Collapse toggle — fixed so it's always reachable */}
      <button
        className="app-shell-desktop"
        onClick={() => setCollapsed((p) => !p)}
        title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        style={{
          position: 'fixed', top: 22, left: effectiveWidth - 11, zIndex: 200,
          width: 22, height: 22, borderRadius: '50%',
          border: '1px solid var(--border)', backgroundColor: 'var(--surface-0)',
          color: 'var(--text-muted)', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: 0, boxShadow: '0 1px 6px rgba(0,0,0,0.4)',
          transition: 'left 0.2s ease, color 150ms ease, border-color 150ms ease',
        }}
        onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--accent)'; e.currentTarget.style.borderColor = 'var(--accent)' }}
        onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.borderColor = 'var(--border)' }}
      >
        <svg width="8" height="8" viewBox="0 0 8 8" fill="none" aria-hidden="true">
          <path d={collapsed ? 'M2 1l3 3-3 3' : 'M6 1L3 4l3 3'} stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

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
