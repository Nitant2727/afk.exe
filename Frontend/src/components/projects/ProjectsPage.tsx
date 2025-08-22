import { useState, useEffect, useMemo } from 'react'
import { FolderOpen, Clock, Activity } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { formatDuration } from '../../lib/utils'
import { apiClient } from '../../lib/api'
import type { ProjectStats, TimeFilter } from '../../types/api'

interface ProjectsPageProps {
  timeFilter: TimeFilter
}

const ProjectsPage = ({ timeFilter }: ProjectsPageProps) => {
  const [projectStats, setProjectStats] = useState<ProjectStats[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = async () => {
    try {
      setLoading(true)
      setError(null)

      const params = { 
        time_filter: timeFilter
      }

      const projectResponse = await apiClient.getProjectStatistics(params)

      if (projectResponse.success && projectResponse.data && Array.isArray(projectResponse.data)) {
        setProjectStats(projectResponse.data)
      } else {
        setProjectStats([])
        if (!projectResponse.success) {
          setError(projectResponse.error)
        }
      }

    } catch (err) {
      console.error('Failed to fetch project data:', err)
      setError('Failed to load project data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [timeFilter])

  // Calculate aggregate stats
  const aggregateStats = useMemo(() => {
    if (projectStats.length === 0) return null
    
    const totalDuration = projectStats.reduce((sum, project) => sum + project.duration, 0)
    const totalSessions = projectStats.reduce((sum, project) => sum + project.sessions, 0)
    const topProject = projectStats[0]

    return {
      totalProjects: projectStats.length,
      totalDuration,
      totalSessions,
      topProject: topProject ? { name: topProject.name, duration: topProject.duration } : null
    }
  }, [projectStats])

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="ml-3 text-muted-foreground">Loading projects...</p>
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
            <p className="text-muted-foreground mb-4">{error}</p>
            <button 
              onClick={fetchData}
              className="px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90"
            >
              Retry
            </button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Projects</h1>
        <p className="text-muted-foreground">
          {aggregateStats?.totalProjects || 0} projects tracked
        </p>
      </div>

      {/* Overview Stats */}
      {aggregateStats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Projects</CardTitle>
              <FolderOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{aggregateStats.totalProjects}</div>
              <p className="text-xs text-muted-foreground">Active projects</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Time</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatDuration(aggregateStats.totalDuration)}</div>
              <p className="text-xs text-muted-foreground">Across all projects</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Sessions</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{aggregateStats.totalSessions}</div>
              <p className="text-xs text-muted-foreground">Coding sessions</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Top Project</CardTitle>
              <FolderOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-lg font-bold truncate">
                {aggregateStats.topProject?.name || 'N/A'}
              </div>
              <p className="text-xs text-muted-foreground">
                {aggregateStats.topProject ? formatDuration(aggregateStats.topProject.duration) : 'No data'}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Project Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Project Breakdown</CardTitle>
          <CardDescription>Time spent on each project</CardDescription>
        </CardHeader>
        <CardContent>
          {projectStats.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No project data available for the selected time period.
            </div>
          ) : (
            <div className="space-y-4">
              {projectStats.map((project, index) => {
                const percentage = aggregateStats 
                  ? Math.round((project.duration / aggregateStats.totalDuration) * 100)
                  : 0
                
                return (
                  <div key={project.name} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium">{project.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {project.sessions} sessions
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{formatDuration(project.duration)}</p>
                        <p className="text-sm text-muted-foreground">{percentage}%</p>
                      </div>
                    </div>
                    <div className="w-full bg-secondary rounded-full h-2">
                      <div 
                        className="bg-primary h-2 rounded-full transition-all duration-300" 
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default ProjectsPage 