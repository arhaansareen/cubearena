import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import { AuthProvider } from '@/providers/AuthProvider'
import { AudioProvider } from '@/providers/AudioProvider'
import { ProfileProvider } from '@/providers/ProfileProvider'
import { AppShell } from '@/components/layout/AppShell'
import { DashboardPage } from '@/pages/DashboardPage'
import { SessionPage } from '@/pages/SessionPage'
import { HistoryPage } from '@/pages/HistoryPage'
import { RivalsPage } from '@/pages/RivalsPage'
import { SettingsPage } from '@/pages/SettingsPage'
import { CalendarPage } from '@/pages/CalendarPage'
import { CompetitionPage } from '@/pages/CompetitionPage'
import { UpcomingCompsPage } from '@/pages/UpcomingCompsPage'
import { LeaderboardPage } from '@/pages/LeaderboardPage'
import { ProfilePage } from '@/pages/ProfilePage'
import { NotFoundPage } from '@/pages/NotFoundPage'

function AuthPage() {
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'var(--bg)',
        padding: 24,
      }}
    >
      <div
        style={{
          backgroundColor: 'var(--surface-0)',
          border: '1px solid var(--border)',
          borderRadius: 16,
          padding: 40,
          width: '100%',
          maxWidth: 380,
          textAlign: 'center',
        }}
      >
        <h1
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 24,
            fontWeight: 700,
            color: 'var(--accent)',
            marginBottom: 8,
            letterSpacing: '-0.02em',
          }}
        >
          CubeArena
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 32 }}>
          Sign in to sync your solves across devices.
        </p>
        <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>
          Authentication setup required. Configure Firebase credentials in .env.local.
        </p>
      </div>
    </div>
  )
}

const router = createBrowserRouter([
  {
    path: '/auth',
    element: <AuthPage />,
  },
  {
    path: '/',
    element: <AppShell />,
    children: [
      {
        index: true,
        element: <DashboardPage />,
      },
      {
        path: 'session',
        element: <SessionPage />,
      },
      {
        path: 'session/:id',
        element: <SessionPage />,
      },
      {
        path: 'history',
        element: <HistoryPage />,
      },
      {
        path: 'calendar',
        element: <CalendarPage />,
      },
      {
        path: 'rivals',
        element: <RivalsPage />,
      },
      {
        path: 'competition',
        element: <CompetitionPage />,
      },
      {
        path: 'upcoming',
        element: <UpcomingCompsPage />,
      },
      {
        path: 'leaderboard',
        element: <LeaderboardPage />,
      },
      {
        path: 'profile',
        element: <ProfilePage />,
      },
      {
        path: 'settings',
        element: <SettingsPage />,
      },
      {
        path: '*',
        element: <NotFoundPage />,
      },
    ],
  },
])

export function App() {
  return (
    <AuthProvider>
      <ProfileProvider>
        <AudioProvider>
          <RouterProvider router={router} />
        </AudioProvider>
      </ProfileProvider>
    </AuthProvider>
  )
}
