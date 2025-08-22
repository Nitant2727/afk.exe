import { useState, useEffect } from 'react'
import { Code2, Clock, Activity } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { formatDuration } from '../../lib/utils'
import { apiClient } from '../../lib/api'
import type { LanguageStats, TimeFilter } from '../../types/api'

interface LanguagesPageProps {
  timeFilter: TimeFilter
}

const LanguagesPage = ({ timeFilter }: LanguagesPageProps) => {
  const [languageStats, setLanguageStats] = useState<LanguageStats[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = async () => {
    try {
      setLoading(true)
      setError(null)

      const params = { time_filter: timeFilter }
      const languageResponse = await apiClient.getLanguageStatistics(params)

      if (languageResponse.success && languageResponse.data && Array.isArray(languageResponse.data)) {
        setLanguageStats(languageResponse.data)
      } else {
        setLanguageStats([])
        if (!languageResponse.success) {
          setError(languageResponse.error)
        }
      }

    } catch (err) {
      console.error('Failed to fetch language data:', err)
      setError('Failed to load language data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [timeFilter])

  const totalDuration = languageStats.reduce((sum, lang) => sum + lang.duration, 0)

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="ml-3 text-muted-foreground">Loading languages...</p>
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
      <div>
        <h1 className="text-3xl font-bold">Language Statistics</h1>
        <p className="text-muted-foreground">
          {languageStats.length} languages used • {formatDuration(totalDuration)} total
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {languageStats.map((language, index) => {
          const percentage = totalDuration > 0 ? Math.round((language.duration / totalDuration) * 100) : 0
          
          return (
            <Card key={language.name} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="capitalize">{language.name}</span>
                  <Code2 className="h-5 w-5 text-blue-500" />
                </CardTitle>
                <CardDescription>{percentage}% of total time</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center space-x-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">Duration</span>
                    </div>
                    <span className="font-medium">{formatDuration(language.duration)}</span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <div className="flex items-center space-x-2">
                      <Activity className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">Sessions</span>
                    </div>
                    <span className="font-medium">{language.sessions}</span>
                  </div>

                  {/* Progress bar */}
                  <div className="mt-3">
                    <div className="w-full bg-muted rounded-full h-2">
                      <div 
                        className="h-2 bg-blue-500 rounded-full transition-all duration-500"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {languageStats.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <Code2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">
              No language data available for the selected time period.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export default LanguagesPage
