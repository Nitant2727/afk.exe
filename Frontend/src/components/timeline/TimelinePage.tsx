import { useState, useEffect } from 'react'
import { Calendar, Clock, Activity, GitCommit } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { formatDuration, formatDate } from '../../lib/utils'
import { apiClient } from '../../lib/api'
import type { DailyStats, TimeFilter, FileSession } from '../../types/api'

interface TimelinePageProps {
  timeFilter: TimeFilter
}

const TimelinePage = ({ timeFilter }: TimelinePageProps) => {
  const [dailyData, setDailyData] = useState<DailyStats[]>([])
  const [recentSessions, setRecentSessions] = useState<FileSession[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = async () => {
    try {
      setLoading(true)
      setError(null)

      const params = { time_filter: timeFilter }

      const [dailyResponse, sessionsResponse] = await Promise.all([
        apiClient.getDailyStatistics(params),
        apiClient.getSessions({ limit: 20, offset: 0 })
      ])

      if (dailyResponse.success && dailyResponse.data && Array.isArray(dailyResponse.data)) {
        setDailyData(dailyResponse.data)
      } else {
        setDailyData([])
      }

      if (sessionsResponse.success && sessionsResponse.data?.sessions && Array.isArray(sessionsResponse.data.sessions)) {
        setRecentSessions(sessionsResponse.data.sessions)
      } else {
        setRecentSessions([])
      }

    } catch (err) {
      console.error('Failed to fetch timeline data:', err)
      setError('Failed to load timeline data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [timeFilter])

  // Calculate streak information
  const streakInfo = (() => {
    if (dailyData.length === 0) return { current: 0, longest: 0 }
    
    let currentStreak = 0
    let longestStreak = 0
    let tempStreak = 0
    
    // Sort by date descending to calculate current streak
    const sortedData = [...dailyData].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    
    // Calculate current streak
    for (const day of sortedData) {
      if (day.duration > 0) {
        currentStreak++
      } else {
        break
      }
    }
    
    // Calculate longest streak
    for (const day of dailyData) {
      if (day.duration > 0) {
        tempStreak++
        longestStreak = Math.max(longestStreak, tempStreak)
      } else {
        tempStreak = 0
      }
    }
    
    return { current: currentStreak, longest: longestStreak }
  })()

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="ml-3 text-muted-foreground">Loading timeline...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6 flex items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle className="text-red-600">Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">{error}</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Activity Timeline</h1>
        <p className="text-muted-foreground">Your coding activity over time</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Current Streak</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{streakInfo.current}</div>
            <p className="text-xs text-muted-foreground">Consecutive coding days</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Longest Streak</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{streakInfo.longest}</div>
            <p className="text-xs text-muted-foreground">Best streak achieved</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Days</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {dailyData.filter(day => day.duration > 0).length}
            </div>
            <p className="text-xs text-muted-foreground">
              Out of {dailyData.length} days
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Daily Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Daily Activity</CardTitle>
          <CardDescription>Your coding activity over the last few days</CardDescription>
        </CardHeader>
        <CardContent>
          {dailyData.length > 0 ? (
            <div className="space-y-3">
              {dailyData.slice(-10).reverse().map((day) => (
                <div key={day.date} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Calendar className="h-4 w-4 text-blue-500" />
                    <div>
                      <p className="font-medium">{formatDate(day.date)}</p>
                      <p className="text-sm text-muted-foreground">
                        {day.sessions} sessions
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{formatDuration(day.duration)}</p>
                    <div className="w-20 bg-muted rounded-full h-2 mt-1">
                      <div 
                        className="h-2 bg-blue-500 rounded-full"
                        style={{ 
                          width: `${Math.min((day.duration / Math.max(...dailyData.map(d => d.duration))) * 100, 100)}%` 
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No activity data available
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Sessions */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Sessions</CardTitle>
          <CardDescription>Your latest coding sessions</CardDescription>
        </CardHeader>
        <CardContent>
          {recentSessions.length > 0 ? (
            <div className="space-y-3">
              {recentSessions.map((session) => (
                <div
                  key={session.id}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <GitCommit className="w-4 h-4 text-blue-500" />
                    <div>
                      <p className="font-medium">{session.fileName}</p>
                      <p className="text-sm text-muted-foreground">
                        {session.projectName} • {session.language}
                      </p>
                    </div>
                  </div>
                  <div className="text-right text-sm text-muted-foreground">
                    <p className="font-medium">{formatDuration(session.totalDuration)}</p>
                    <p>{formatDate(session.sessionStartTime)}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No recent sessions found
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default TimelinePage
