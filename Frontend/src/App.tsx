import { useState, useEffect } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'react-hot-toast'
import { useAuthStore } from './store/authStore'
import Dashboard from './components/dashboard/Dashboard'
import SessionsPage from './components/sessions/SessionsPage'
import AnalyticsPage from './components/analytics/AnalyticsPage'
import ProjectsPage from './components/projects/ProjectsPage'
import LanguagesPage from './components/languages/LanguagesPage'
import TimelinePage from './components/timeline/TimelinePage'
import TokenPage from './components/settings/TokenPage'
import ApiDebug from './components/debug/ApiDebug'
import Sidebar from './components/layout/Sidebar'
import Header from './components/layout/Header'
import type { TimeFilter } from './types/api'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
})

const MainLayout = () => {
  const [activeTab, setActiveTab] = useState('dashboard')
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('today')
  
  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard timeFilter={timeFilter} />
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
      case 'debug':
        return <ApiDebug />
      default:
        return <Dashboard timeFilter={timeFilter} />
    }
  }

  return (
    <div className="h-screen flex bg-background">
      <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header timeFilter={timeFilter} onTimeFilterChange={setTimeFilter} />
        <main className="flex-1 overflow-auto">
          {renderContent()}
        </main>
      </div>
    </div>
  )
}

const App = () => {
  const { initializeUser, isLoading } = useAuthStore()

  useEffect(() => {
    // Initialize user automatically on app start
    initializeUser()
  }, [initializeUser])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="ml-3 text-muted-foreground">Loading AFK Monitor...</p>
      </div>
    )
  }

  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen bg-background text-foreground">
        <MainLayout />
        <Toaster 
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: 'hsl(var(--background))',
              color: 'hsl(var(--foreground))',
              border: '1px solid hsl(var(--border))',
            },
          }}
        />
      </div>
    </QueryClientProvider>
  )
}

export default App
