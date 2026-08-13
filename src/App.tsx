import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import { AuthProvider, useAuth } from '@/providers/AuthProvider'
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
import { LoginPage } from '@/pages/LoginPage'

function AuthGate({ children }: { children: React.ReactNode }) {
  const { user, loading, isAnonymous } = useAuth()
  if (loading) {
    return (
      <div style={{
        minHeight: '100dvh', backgroundColor: 'var(--bg)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <div style={{
          width: 24, height: 24,
          border: '2px solid var(--border)', borderTopColor: 'var(--accent)',
          borderRadius: '50%', animation: 'spin 0.8s linear infinite',
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    )
  }
  if (!user || isAnonymous) return <LoginPage />
  return <>{children}</>
}

const router = createBrowserRouter([
  {
    path: '/',
    element: <AuthGate><AppShell /></AuthGate>,
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
