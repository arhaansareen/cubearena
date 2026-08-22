import { Analytics } from '@vercel/analytics/react'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { AuthProvider } from '@/providers/AuthProvider'
import { AudioProvider } from '@/providers/AudioProvider'
import { ProfileProvider } from '@/providers/ProfileProvider'
import { ThemeProvider } from '@/providers/ThemeProvider'
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
import { RacePage } from '@/pages/RacePage'
import { NotFoundPage } from '@/pages/NotFoundPage'
import { AlgorithmsPage } from '@/pages/AlgorithmsPage'


const router = createBrowserRouter([
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
        path: 'algorithms',
        element: <AlgorithmsPage />,
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
        path: 'race',
        element: <RacePage />,
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
    <ErrorBoundary>
      <ThemeProvider>
        <AuthProvider>
          <ProfileProvider>
            <AudioProvider>
              <RouterProvider router={router} />
              <Analytics />
            </AudioProvider>
          </ProfileProvider>
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  )
}
