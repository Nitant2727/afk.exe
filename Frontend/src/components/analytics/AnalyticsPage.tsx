import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { formatDuration } from '../../lib/utils'
import { apiClient } from '../../lib/api'
import type { SessionStats, TimeFilter } from '../../types/api'

interface AnalyticsPageProps {
  timeFilter: TimeFilter
}

const AnalyticsPage = ({ timeFilter }: AnalyticsPageProps) => {
  const [sessionStats, setSessionStats] = useState<SessionStats | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchData = async () => {
    try {
      setLoading(true)
      const params = { time_filter: timeFilter }
      const sessionResponse = await apiClient.getSessionStatistics(params)

      if (sessionResponse.success && sessionResponse.data) {
        setSessionStats(sessionResponse.data)
      }
    } catch (err) {
      console.error('Failed to fetch analytics data:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [timeFilter])

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="ml-3 text-muted-foreground">Loading analytics...</p>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Advanced Analytics</h1>
        <p className="text-muted-foreground">Detailed insights into your coding patterns</p>
      </div>

      {sessionStats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Total Sessions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{sessionStats.totalSessions}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Total Duration</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatDuration(sessionStats.totalDuration)}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Average Session</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatDuration(sessionStats.averageSessionDuration)}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Lines Added</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{sessionStats.totalLinesAdded.toLocaleString()}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Total Edits</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{sessionStats.totalEdits.toLocaleString()}</div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}

export default AnalyticsPage 