import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { FolderOpen, Clock, Activity, Crown } from 'lucide-react'
import { Reveal, Stagger, StaggerItem } from '../ui/motion'
import { StatCard, PanelCard, EmptyState, RankRow, ACCENTS } from '../ui/data-display'
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
    const duration = projects.reduce((sum, p) => sum + p.duration, 0)
    const sessions = projects.reduce((sum, p) => sum + p.sessions, 0)
    return { duration, sessions, top: projects[0] }
  }, [projects])

  return (
    <div className="mx-auto w-full max-w-[92rem] space-y-6 px-6 py-7">
      <Reveal direction="down" duration={0.5}>
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-primary/90">
            Projects
          </p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight text-gradient sm:text-4xl">
            What you've been building
          </h1>
        </div>
      </Reveal>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-[7.5rem] rounded-2xl skeleton" />
          ))}
        </div>
      ) : (
        <Stagger className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StaggerItem>
            <StatCard
              label="Projects"
              value={projects.length}
              count={{ to: projects.length }}
              hint="Active in this range"
              icon={FolderOpen}
              accent={ACCENTS[0]}
            />
          </StaggerItem>
          <StaggerItem>
            <StatCard
              label="Total time"
              value={formatDuration(totals?.duration ?? 0)}
              count={{ to: totals?.duration ?? 0, format: (n) => formatDuration(n) }}
              hint="Across all projects"
              icon={Clock}
              accent={ACCENTS[1]}
            />
          </StaggerItem>
          <StaggerItem>
            <StatCard
              label="Sessions"
              value={totals?.sessions ?? 0}
              count={{ to: totals?.sessions ?? 0 }}
              hint="Coding sessions logged"
              icon={Activity}
              accent={ACCENTS[2]}
            />
          </StaggerItem>
          <StaggerItem>
            <StatCard
              label="Top project"
              value={totals?.top?.name ?? '—'}
              hint={totals?.top ? `${formatDuration(totals.top.duration)} tracked` : 'No data yet'}
              icon={Crown}
              accent={ACCENTS[3]}
            />
          </StaggerItem>
        </Stagger>
      )}

      <Reveal delay={0.05}>
        <PanelCard
          title="Project breakdown"
          description="Share of tracked time, ranked"
          action={
            totals ? (
              <span className="shrink-0 rounded-full bg-foreground/[0.05] px-2.5 py-1 font-mono text-[11px] text-muted-foreground ring-1 ring-inset ring-border/70">
                {formatDuration(totals.duration)} total
              </span>
            ) : undefined
          }
        >
          {projects.length === 0 ? (
            <EmptyState message="No projects tracked in this range" />
          ) : (
            <ul className="-mx-1 divide-y divide-border/50">
              {projects.map((project, i) => (
                <RankRow
                  key={project.name}
                  rank={i + 1}
                  index={i}
                  name={project.name}
                  subtitle={`${project.sessions} ${project.sessions === 1 ? 'session' : 'sessions'}`}
                  value={formatDuration(project.duration)}
                  percent={
                    totals?.duration
                      ? Math.round((project.duration / totals.duration) * 100)
                      : 0
                  }
                />
              ))}
            </ul>
          )}
        </PanelCard>
      </Reveal>
    </div>
  )
}

export default ProjectsPage
