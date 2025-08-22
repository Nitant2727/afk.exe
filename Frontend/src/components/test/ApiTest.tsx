import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { apiClient } from '../../lib/api'

const ApiTest = () => {
  const [results, setResults] = useState<Record<string, any>>({})
  const [testing, setTesting] = useState(false)

  const testEndpoints = async () => {
    setTesting(true)
    const testResults: Record<string, any> = {}

    try {
      // Test health endpoint
      testResults.health = await apiClient.healthCheck()
    } catch (err) {
      testResults.health = { error: err }
    }

    try {
      // Test session stats
      testResults.sessionStats = await apiClient.getSessionStatistics({ time_filter: 'today' })
    } catch (err) {
      testResults.sessionStats = { error: err }
    }

    try {
      // Test projects
      testResults.uniqueProjects = await apiClient.getUniqueProjects()
    } catch (err) {
      testResults.uniqueProjects = { error: err }
    }

    try {
      // Test languages
      testResults.uniqueLanguages = await apiClient.getUniqueLanguages()
    } catch (err) {
      testResults.uniqueLanguages = { error: err }
    }

    try {
      // Test project stats
      testResults.projectStats = await apiClient.getProjectStatistics({ time_filter: 'today' })
    } catch (err) {
      testResults.projectStats = { error: err }
    }

    try {
      // Test language stats
      testResults.languageStats = await apiClient.getLanguageStatistics({ time_filter: 'today' })
    } catch (err) {
      testResults.languageStats = { error: err }
    }

    try {
      // Test daily stats
      testResults.dailyStats = await apiClient.getDailyStatistics({ time_filter: 'last_7_days' })
    } catch (err) {
      testResults.dailyStats = { error: err }
    }

    setResults(testResults)
    setTesting(false)
  }

  return (
    <div className="p-6 space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>API Endpoint Test</CardTitle>
        </CardHeader>
        <CardContent>
          <button 
            onClick={testEndpoints}
            disabled={testing}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {testing ? 'Testing...' : 'Test All Endpoints'}
          </button>
          
          {Object.keys(results).length > 0 && (
            <div className="mt-4 space-y-2">
              {Object.entries(results).map(([endpoint, result]) => (
                <div key={endpoint} className="border rounded p-3">
                  <h3 className="font-semibold">{endpoint}</h3>
                  <pre className="text-sm bg-gray-100 p-2 rounded mt-1 overflow-auto">
                    {JSON.stringify(result, null, 2)}
                  </pre>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default ApiTest 