import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  Clock, 
  Code, 
  Calendar, 
  FileText,
  BarChart3,
  Activity,
  Zap,
  RefreshCw
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts'
import { formatDuration } from '../../lib/utils'
import { apiClient } from '../../lib/api'
import type { TimeFilter, SessionStats, DailyStats, LanguageStats, ProjectStats } from '../../types/api'

interface DashboardProps {
  timeFilter: TimeFilter
}

const Dashboard = ({ timeFilter }: DashboardProps) => {
  const [stats, setStats] = useState<SessionStats | null>(null)
  const [dailyData, setDailyData] = useState<DailyStats[]>([])
  const [languageData, setLanguageData] = useState<LanguageStats[]>([])
  const [projectData, setProjectData] = useState<ProjectStats[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch data from API
  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      setError(null)

      console.log('🎯 Dashboard: Fetching data with timeFilter:', timeFilter)

      const params = { time_filter: timeFilter }

      // Fetch all data in parallel
      const [
        statsResponse,
        dailyResponse,
        languageResponse,
        projectResponse
      ] = await Promise.all([
        apiClient.getSessionStatistics(params),
        apiClient.getDailyStatistics(params),
        apiClient.getLanguageStatistics(params),
        apiClient.getProjectStatistics(params)
      ])

      console.log('🎯 Dashboard: Raw API responses:', {
        stats: statsResponse,
        daily: dailyResponse,
        languages: languageResponse,
        projects: projectResponse
      })

      if (statsResponse.success && statsResponse.data) {
        console.log('✅ Stats data:', statsResponse.data)
        setStats(statsResponse.data)
      } else {
        console.warn('❌ Stats failed:', statsResponse.success === false ? statsResponse.error : 'No data')
      }

      if (dailyResponse.success && dailyResponse.data && Array.isArray(dailyResponse.data)) {
        console.log('✅ Daily data:', dailyResponse.data)
        setDailyData(dailyResponse.data)
      } else {
        console.warn('❌ Daily failed or not array:', dailyResponse)
        setDailyData([])
      }

      if (languageResponse.success && languageResponse.data && Array.isArray(languageResponse.data)) {
        console.log('✅ Language data:', languageResponse.data)
        setLanguageData(languageResponse.data)
      } else {
        console.warn('❌ Languages failed or not array:', languageResponse)
        setLanguageData([])
      }

      if (projectResponse.success && projectResponse.data && Array.isArray(projectResponse.data)) {
        console.log('✅ Project data:', projectResponse.data)
        setProjectData(projectResponse.data)
      } else {
        console.warn('❌ Projects failed or not array:', projectResponse)
        setProjectData([])
      }

    } catch (err) {
      console.error('❌ Dashboard error:', err)
      setError('Failed to load dashboard data')
    } finally {
      setLoading(false)
    }
  }

  // Fetch data on component mount and when timeFilter changes
  useEffect(() => {
    fetchDashboardData()
  }, [timeFilter])

  // Calculate derived stats
  const derivedStats = {
    totalSessions: stats?.totalSessions || 0,
    totalDuration: stats?.totalDuration || 0,
    linesAdded: stats?.totalLinesAdded || 0,
    averageSessionTime: stats?.averageSessionDuration || 0,
    mostUsedLanguage: languageData.length > 0 ? languageData[0].name : 'N/A',
    activeProject: projectData.length > 0 ? projectData[0].name : 'N/A'
  }

  const statCards = [
    {
      title: 'Total Sessions',
      value: derivedStats.totalSessions.toLocaleString(),
      icon: FileText,
      description: loading ? 'Loading...' : `Avg ${formatDuration(derivedStats.averageSessionTime)}`
    },
    {
      title: 'Coding Time',
      value: loading ? '...' : formatDuration(derivedStats.totalDuration),
      icon: Clock,
      description: loading ? 'Loading...' : `Total time tracked`
    },
    {
      title: 'Lines Added',
      value: loading ? '...' : derivedStats.linesAdded.toLocaleString(),
      icon: Code,
      description: loading ? 'Loading...' : 'Lines of code written'
    },
    {
      title: 'Top Language',
      value: loading ? '...' : derivedStats.mostUsedLanguage,
      icon: Calendar,
      description: loading ? 'Loading...' : 'Most used language'
    }
  ]

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5 }
    }
  }

  if (error) {
    return (
      <div className="p-6 flex items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle className="text-red-600">Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">{error}</p>
            <button
              onClick={fetchDashboardData}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Retry</span>
            </button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <motion.div
      className="p-6 space-y-6"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Stats Cards */}
      <motion.div 
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
        variants={itemVariants}
      >
        {statCards.map((stat) => (
          <motion.div
            key={stat.title}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Card className="relative overflow-hidden">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
                <stat.icon className="w-4 h-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {loading ? (
                    <div className="animate-pulse bg-gray-200 h-8 w-20 rounded"></div>
                  ) : (
                    stat.value
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {stat.description}
                </p>
              </CardContent>
              
              {/* Gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-transparent pointer-events-none" />
            </Card>
          </motion.div>
        ))}
      </motion.div>

      {/* Charts Grid */}
      <motion.div className="grid grid-cols-1 lg:grid-cols-2 gap-6" variants={itemVariants}>
        {/* Daily Activity Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Activity className="w-5 h-5" />
              <span>Daily Activity</span>
            </CardTitle>
            <CardDescription>
              Your coding activity over the selected time period
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="h-[300px] flex items-center justify-center">
                <div className="animate-pulse text-muted-foreground">Loading chart...</div>
              </div>
            ) : dailyData.length === 0 ? (
              <div className="h-[300px] flex items-center justify-center">
                <div className="text-muted-foreground">No data available</div>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={dailyData}>
                  <defs>
                    <linearGradient id="colorDuration" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis 
                    dataKey="date" 
                    tick={{ fontSize: 12 }}
                    tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  />
                  <YAxis 
                    tick={{ fontSize: 12 }}
                    tickFormatter={(value) => `${Math.round(value / 3600)}h`}
                  />
                  <Tooltip 
                    labelFormatter={(value) => new Date(value).toLocaleDateString()}
                    formatter={(value: number, name) => [
                      name === 'duration' ? formatDuration(value) : value,
                      name === 'duration' ? 'Coding Time' : 'Sessions'
                    ]}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="duration" 
                    stroke="#3b82f6" 
                    fillOpacity={1} 
                    fill="url(#colorDuration)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Language Distribution Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Zap className="w-5 h-5" />
              <span>Languages</span>
            </CardTitle>
            <CardDescription>
              Programming language usage breakdown
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="h-[300px] flex items-center justify-center">
                <div className="animate-pulse text-muted-foreground">Loading chart...</div>
              </div>
            ) : languageData.length === 0 ? (
              <div className="h-[300px] flex items-center justify-center">
                <div className="text-muted-foreground">No data available</div>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={languageData}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="duration"
                    label={({ name, duration }) => `${name}: ${formatDuration(duration)}`}
                  >
                    {languageData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={`hsl(${index * 45}, 70%, 60%)`} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value: number, name) => [formatDuration(value), 'Duration']}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </motion.div>

      <motion.div className="grid grid-cols-1 lg:grid-cols-2 gap-6" variants={itemVariants}>
        {/* Project Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <BarChart3 className="w-5 h-5" />
              <span>Project Breakdown</span>
            </CardTitle>
            <CardDescription>
              Time spent on different projects
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="h-[300px] flex items-center justify-center">
                <div className="animate-pulse text-muted-foreground">Loading chart...</div>
              </div>
            ) : projectData.length === 0 ? (
              <div className="h-[300px] flex items-center justify-center">
                <div className="text-muted-foreground">No data available</div>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={projectData} layout="horizontal">
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis 
                    type="number" 
                    tick={{ fontSize: 12 }}
                    tickFormatter={(value) => `${Math.round(value / 3600)}h`}
                  />
                  <YAxis 
                    type="category" 
                    dataKey="name" 
                    tick={{ fontSize: 12 }}
                    width={80}
                  />
                  <Tooltip 
                    formatter={(value: number, name) => [
                      name === 'duration' ? formatDuration(value) : value,
                      name === 'duration' ? 'Time' : 'Sessions'
                    ]}
                  />
                  <Bar 
                    dataKey="duration" 
                    fill="#8b5cf6" 
                    radius={[0, 4, 4, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>


      </motion.div>
    </motion.div>
  )
}

export default Dashboard 