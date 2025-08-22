import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { apiClient } from '../../lib/api'

const ApiDebug = () => {
  const [results, setResults] = useState<Record<string, any>>({})
  const [testing, setTesting] = useState(false)

  const debugEndpoint = async (name: string, apiCall: () => Promise<any>) => {
    try {
      console.log(`Testing ${name}...`)
      const result = await apiCall()
      console.log(`${name} result:`, result)
      return { success: true, data: result }
    } catch (error) {
      console.error(`${name} error:`, error)
      return { success: false, error: error instanceof Error ? error.message : String(error) }
    }
  }

  const runDiagnostics = async () => {
    setTesting(true)
    const testResults: Record<string, any> = {}

    // Test all endpoints systematically
    const tests = [
      {
        name: 'Health Check',
        call: () => apiClient.healthCheck()
      },
      {
        name: 'Current User',
        call: () => apiClient.getCurrentUser()
      },
      {
        name: 'Sessions (Basic)',
        call: () => apiClient.getSessions({ limit: 5 })
      },
      {
        name: 'Unique Projects',
        call: () => apiClient.getUniqueProjects()
      },
      {
        name: 'Unique Languages', 
        call: () => apiClient.getUniqueLanguages()
      },
      {
        name: 'Session Stats (Today)',
        call: () => apiClient.getSessionStatistics({ time_filter: 'today' })
      },
      {
        name: 'Session Stats (Last 7 Days)',
        call: () => apiClient.getSessionStatistics({ time_filter: 'last_7_days' })
      },
      {
        name: 'Project Stats (Today)',
        call: () => apiClient.getProjectStatistics({ time_filter: 'today' })
      },
      {
        name: 'Project Stats (Last 7 Days)',
        call: () => apiClient.getProjectStatistics({ time_filter: 'last_7_days' })
      },
      {
        name: 'Language Stats (Today)',
        call: () => apiClient.getLanguageStatistics({ time_filter: 'today' })
      },
      {
        name: 'Language Stats (Last 7 Days)',
        call: () => apiClient.getLanguageStatistics({ time_filter: 'last_7_days' })
      },
      {
        name: 'Daily Stats (Last 7 Days)',
        call: () => apiClient.getDailyStatistics({ time_filter: 'last_7_days' })
      },
      {
        name: 'Daily Stats (Last 30 Days)',
        call: () => apiClient.getDailyStatistics({ time_filter: 'last_30_days' })
      }
    ]

    for (const test of tests) {
      testResults[test.name] = await debugEndpoint(test.name, test.call)
      // Small delay to avoid overwhelming the API
      await new Promise(resolve => setTimeout(resolve, 100))
    }

    setResults(testResults)
    setTesting(false)
  }

  const checkAuthToken = () => {
    const token = localStorage.getItem('auth_token')
    return {
      hasToken: !!token,
      tokenLength: token?.length || 0,
      tokenPreview: token ? `${token.substring(0, 10)}...` : 'None'
    }
  }

  const authInfo = checkAuthToken()

  return (
    <div className="p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>🔍 API Diagnostics Tool</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Auth Status */}
          <div className="p-4 bg-gray-50 rounded-lg">
            <h3 className="font-semibold mb-2">Authentication Status</h3>
            <div className="text-sm space-y-1">
              <p>Has Token: <span className={authInfo.hasToken ? 'text-green-600' : 'text-red-600'}>
                {authInfo.hasToken ? 'Yes' : 'No'}
              </span></p>
              <p>Token Length: {authInfo.tokenLength}</p>
              <p>Token Preview: <code className="bg-gray-200 px-1 rounded">{authInfo.tokenPreview}</code></p>
            </div>
          </div>

          <Button 
            onClick={runDiagnostics}
            disabled={testing}
            className="w-full"
          >
            {testing ? 'Running Diagnostics...' : 'Run Full API Diagnostics'}
          </Button>
          
          {Object.keys(results).length > 0 && (
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {Object.entries(results).map(([testName, result]) => (
                <div key={testName} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold">{testName}</h3>
                    <span className={`px-2 py-1 rounded text-xs ${
                      result.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {result.success ? 'SUCCESS' : 'FAILED'}
                    </span>
                  </div>
                  
                  <div className="bg-gray-50 p-3 rounded text-xs">
                    <details>
                      <summary className="cursor-pointer font-medium mb-2">
                        View Response Data
                      </summary>
                      <pre className="overflow-auto whitespace-pre-wrap">
                        {JSON.stringify(result, null, 2)}
                      </pre>
                    </details>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default ApiDebug 