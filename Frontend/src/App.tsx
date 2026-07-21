import { useState, useEffect } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'react-hot-toast'
import Dashboard from './components/dashboard/Dashboard'
import SessionsPage from './components/sessions/SessionsPage'
import AnalyticsPage from './components/analytics/AnalyticsPage'
import ProjectsPage from './components/projects/ProjectsPage'
import LanguagesPage from './components/languages/LanguagesPage'
import TimelinePage from './components/timeline/TimelinePage'
import TokenPage from './components/settings/TokenPage'
import Sidebar from './components/layout/Sidebar'
import Header from './components/layout/Header'
import LoginPage from './components/auth/LoginPage'
import GitHubCallback from './components/auth/GitHubCallback'
import { AmbientBackground } from './components/ui/motion'
import { useAuthStore } from './store/authStore'
import type { TimeFilter } from './types/api'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 30_000,
    },
  },
})

const MainLayout = () => {
  const [activeTab, setActiveTab] = useState('dashboard')
  // Seven days reads as a real working week; "today" is often nearly empty and
  // makes the dashboard look broken on first load.
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('last_7_days')

  const renderContent = () => {
    switch (activeTab) {
      case 'sessions':
        return <SessionsPage timeFilter={timeFilter} />
      case 'analytics':
        return <AnalyticsPage timeFilter={timeFilter} />
      case 'projects':
        return <ProjectsPage timeFilter={timeFilter} />
      case 'languages':
        return <LanguagesPage timeFilter={timeFilter} />
      case 'timeline':
        return <TimelinePage timeFilter={timeFilter} />
      case 'settings':
        return <TokenPage />
      default:
        return <Dashboard timeFilter={timeFilter} />
    }
  }

  return (
    <div className="h-screen flex">
      <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header timeFilter={timeFilter} onTimeFilterChange={setTimeFilter} />
        <main className="flex-1 overflow-y-auto overflow-x-hidden">
          {/*
            * Deliberately not AnimatePresence with mode="wait": that holds the
            * incoming view until the outgoing one finishes animating out, so if
            * the animation clock is starved (background tab, throttled device)
            * navigation stops working entirely — clicks change nothing.
            *
            * Remounting on `key` and animating only the entrance keeps routing
            * independent of motion. Position animates, opacity does not, so a
            * transition that never runs still leaves the page fully readable.
            */}
          <div key={activeTab} className="page-enter">
            {renderContent()}
          </div>
        </main>
      </div>
    </div>
  )
}

const App = () => {
  const { initializeUser, isAuthenticated, isLoading } = useAuthStore()

  // Honour a previously chosen theme; dark is the default set on <html>.
  useEffect(() => {
    const saved = localStorage.getItem('afk_theme')
    if (saved === 'light') document.documentElement.classList.remove('dark')
  }, [])

  useEffect(() => {
    initializeUser()
  }, [initializeUser])

  /*
   * The OAuth popup lands on /auth/callback. It runs in its own window, hands
   * the result back to the opener and closes itself, so it must render before
   * any auth gate — it is the thing that produces the session.
   */
  const isCallback = window.location.pathname === '/auth/callback'

  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen bg-background text-foreground">
        <AmbientBackground />
        {isCallback ? (
          <GitHubCallback />
        ) : isLoading ? (
          <div className="grid min-h-screen place-items-center">
            <div className="flex items-center gap-3 text-muted-foreground">
              <span className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              <p className="text-sm">Loading AFK Monitor…</p>
            </div>
          </div>
        ) : isAuthenticated ? (
          <MainLayout />
        ) : (
          <LoginPage />
        )}
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: 'hsl(var(--popover))',
              color: 'hsl(var(--popover-foreground))',
              border: '1px solid hsl(var(--border))',
              borderRadius: '0.75rem',
            },
          }}
        />
      </div>
    </QueryClientProvider>
  )
}

export default App
