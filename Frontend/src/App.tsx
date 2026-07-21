import { useState, useEffect } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'react-hot-toast'
import { AnimatePresence, motion } from 'framer-motion'
import Dashboard from './components/dashboard/Dashboard'
import SessionsPage from './components/sessions/SessionsPage'
import AnalyticsPage from './components/analytics/AnalyticsPage'
import ProjectsPage from './components/projects/ProjectsPage'
import LanguagesPage from './components/languages/LanguagesPage'
import TimelinePage from './components/timeline/TimelinePage'
import TokenPage from './components/settings/TokenPage'
import Sidebar from './components/layout/Sidebar'
import Header from './components/layout/Header'
import { AmbientBackground } from './components/ui/motion'
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
            * Keyed on the tab so each view gets its own enter/exit pass.
            * `initial={false}` skips the animation on first mount, and the
            * enter state deliberately animates position only — never opacity —
            * so a transition that fails to run can't leave the page blank.
            */}
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={activeTab}
              initial={{ y: 10 }}
              animate={{ y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
            >
              {renderContent()}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  )
}

const App = () => {
  // Honour a previously chosen theme; dark is the default set on <html>.
  useEffect(() => {
    const saved = localStorage.getItem('afk_theme')
    if (saved === 'light') document.documentElement.classList.remove('dark')
  }, [])

  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen bg-background text-foreground">
        <AmbientBackground />
        <MainLayout />
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
