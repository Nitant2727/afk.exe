import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { FolderOpen, Clock, Activity, Crown } from 'lucide-react'
import {
  Metric,
  Panel,
  EmptyState,
  MetricSkeletons,
  BreakdownTable,
} from '../ui/data-display'
import { formatDuration } from '../../lib/utils'
import { apiClient } from '../../lib/api'
import type { ProjectStats, TimeFilter } from '../../types/api'

interface ProjectsPageProps {
  timeFilter: TimeFilter
}

const ProjectsPage = ({ timeFilter }: ProjectsPageProps) => {
  const { data, isLoading } = useQuery({
    queryKey: ['projects', timeFilter],
    queryFn: () => apiClient.getProjectStatistics({ time_filter: timeFilter }),
  })

  const projects = ((data?.success ? data.data : []) ?? []) as ProjectStats[]

  const totals = useMemo(() => {
    if (projects.length === 0) return null
    return {
      duration: projects.reduce((sum, p) => sum + p.duration, 0),
      sessions: projects.reduce((sum, p) => sum + p.sessions, 0),
      top: projects[0],
    }
  }, [projects])

  return (
    <div className="space-y-4 p-5">
      {isLoading ? (
        <MetricSkeletons />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Metric
            label="Projects"
            icon={FolderOpen}
            value={projects.length}
            count={{ to: projects.length }}
            sub="Active in this range"
          />
          <Metric
            label="Total time"
            icon={Clock}
            value={formatDuration(totals?.duration ?? 0)}
            count={{ to: totals?.duration ?? 0, format: formatDuration }}
            sub="Across all projects"
          />
          <Metric
            label="Sessions"
            icon={Activity}
            value={totals?.sessions ?? 0}
            count={{ to: totals?.sessions ?? 0 }}
            sub={
              totals?.sessions
                ? `Avg ${formatDuration(totals.duration / totals.sessions)} each`
                : 'None logged'
            }
          />
          <Metric
            label="Top project"
            icon={Crown}
            value={totals?.top?.name ?? '—'}
            sub={totals?.top ? `${formatDuration(totals.top.duration)} tracked` : 'No data yet'}
          />
        </div>
      )}

      <Panel
        title="Project breakdown"
        aside={
          totals ? (
            <span className="tabular font-mono text-xs text-muted-foreground">
              {formatDuration(totals.duration)} total
            </span>
          ) : undefined
        }
      >
        {projects.length === 0 ? (
          <EmptyState message="No projects tracked in this range" />
        ) : (
          <BreakdownTable
            rows={projects}
            total={totals?.duration ?? 0}
            label="Project"
            formatDuration={formatDuration}
          />
        )}
      </Panel>
    </div>
  )
}

export default ProjectsPage
