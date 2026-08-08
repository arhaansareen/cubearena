import { NavLink, Outlet } from 'react-router-dom'
import { type ReactNode } from 'react'
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

// Desktop sidebar includes all 6 items; mobile bottom nav capped at 5 (Settings dropped — accessible via desktop profile strip or direct URL)
const DESKTOP_NAV: NavItem[] = [
  { to: '/', label: 'Dashboard', icon: <DashboardIcon /> },
  { to: '/session', label: 'Session', icon: <SessionIcon /> },
  { to: '/history', label: 'History', icon: <HistoryIcon /> },
  { to: '/calendar', label: 'Calendar', icon: <CalendarIcon /> },
  { to: '/rivals', label: 'Rivals', icon: <RivalsIcon /> },
  { to: '/settings', label: 'Settings', icon: <SettingsIcon /> },
]

const MOBILE_NAV: NavItem[] = [
  { to: '/', label: 'Dashboard', icon: <DashboardIcon /> },
  { to: '/session', label: 'Session', icon: <SessionIcon /> },
  { to: '/history', label: 'History', icon: <HistoryIcon /> },
  { to: '/calendar', label: 'Calendar', icon: <CalendarIcon /> },
  { to: '/rivals', label: 'Rivals', icon: <RivalsIcon /> },
]

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
      to="/settings"
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
      <div
        aria-hidden="true"
        style={{
          width: 32,
          height: 32,
          borderRadius: '50%',
          backgroundColor: 'var(--accent-dim)',
          border: '1px solid var(--accent)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          fontSize: 12,
          fontWeight: 700,
          color: 'var(--accent)',
          fontFamily: "'JetBrains Mono', monospace",
        }}
      >
        {initials}
      </div>
      <div style={{ minWidth: 0 }}>
        <div
          style={{
            fontSize: 13,
            fontWeight: 600,
            color: 'var(--text-primary)',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {displayName ?? 'Set your name'}
        </div>
        {wcaId && (
          <div
            style={{
              fontSize: 11,
              color: 'var(--accent)',
              fontFamily: "'JetBrains Mono', monospace",
              marginTop: 1,
            }}
          >
            {wcaId}
          </div>
        )}
        {!displayName && (
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 1 }}>
            Settings
          </div>
        )}
      </div>
    </NavLink>
  )
}

export function AppShell() {
  return (
    <>
      {/* Desktop sidebar */}
      <div className="app-shell-desktop" style={{
        width: 240,
        minHeight: '100dvh',
        backgroundColor: 'var(--surface-0)',
        borderRight: '1px solid var(--border)',
        display: 'flex',
        flexDirection: 'column',
        padding: '24px 0 0',
        position: 'fixed',
        top: 0,
        left: 0,
        zIndex: 100,
      }}>
        <div style={{ padding: '0 20px 24px', borderBottom: '1px solid var(--border)', marginBottom: 8 }}>
          <span style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 18,
            fontWeight: 700,
            color: 'var(--accent)',
            letterSpacing: '-0.02em',
          }}>
            CubeArena
          </span>
        </div>
        <nav style={{ flex: 1 }}>
          {DESKTOP_NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              style={({ isActive }) => ({
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '10px 16px 10px 18px',
                fontSize: 14,
                fontWeight: isActive ? 600 : 500,
                color: isActive ? 'var(--text-primary)' : 'var(--text-muted)',
                backgroundColor: isActive ? 'var(--accent-dim)' : 'transparent',
                transition: 'color 150ms ease, background-color 150ms ease, border-color 150ms ease',
                borderRadius: 8,
                margin: '2px 8px',
                cursor: 'pointer',
                textDecoration: 'none',
                borderLeft: `2px solid ${isActive ? 'var(--accent)' : 'transparent'}`,
              })}
              onMouseOver={(e) => {
                const el = e.currentTarget as HTMLElement
                if (!el.dataset.active) {
                  el.style.color = 'var(--text-primary)'
                  el.style.backgroundColor = 'rgba(255,255,255,0.04)'
                }
              }}
              onMouseOut={(e) => {
                const el = e.currentTarget as HTMLElement
                if (!el.dataset.active) {
                  el.style.color = ''
                  el.style.backgroundColor = ''
                }
              }}
            >
              {item.icon}
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>
        <ProfileStrip />
      </div>

      {/* Main content */}
      <div className="app-shell-content" style={{
        marginLeft: 240,
        flex: 1,
        minHeight: '100dvh',
        backgroundColor: 'var(--bg)',
      }}>
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
          .app-shell-mobile-nav {
            display: none !important;
          }
        }
        @media (max-width: 767px) {
          .app-shell-desktop {
            display: none !important;
          }
          .app-shell-content {
            margin-left: 0 !important;
            padding-bottom: calc(60px + env(safe-area-inset-bottom));
          }
        }
      `}</style>
    </>
  )
}
