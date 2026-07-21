import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Code2, Clock, Activity, Flame } from 'lucide-react'
import {
  Metric,
  Panel,
  EmptyState,
  MetricSkeletons,
  BreakdownTable,
} from '../ui/data-display'
import { formatDuration } from '../../lib/utils'
import { apiClient } from '../../lib/api'
import type { LanguageStats, TimeFilter } from '../../types/api'

interface LanguagesPageProps {
  timeFilter: TimeFilter
}

const LanguagesPage = ({ timeFilter }: LanguagesPageProps) => {
  const { data, isLoading } = useQuery({
    queryKey: ['languages', timeFilter],
    queryFn: () => apiClient.getLanguageStatistics({ time_filter: timeFilter }),
  })

  const languages = ((data?.success ? data.data : []) ?? []) as LanguageStats[]

  const totals = useMemo(() => {
    if (languages.length === 0) return null
    return {
      duration: languages.reduce((sum, l) => sum + l.duration, 0),
      sessions: languages.reduce((sum, l) => sum + l.sessions, 0),
      top: languages[0],
    }
  }, [languages])

  return (
    <div className="space-y-4 p-5">
      {isLoading ? (
        <MetricSkeletons />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Metric
            label="Languages"
            icon={Code2}
            value={languages.length}
            count={{ to: languages.length }}
            sub="Used in this range"
          />
          <Metric
            label="Total time"
            icon={Clock}
            value={formatDuration(totals?.duration ?? 0)}
            count={{ to: totals?.duration ?? 0, format: formatDuration }}
            sub="Across all languages"
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
            label="Most used"
            icon={Flame}
            value={totals?.top?.name ?? '—'}
            sub={
              totals?.top
                ? `${Math.round((totals.top.duration / totals.duration) * 100)}% of tracked time`
                : 'No data yet'
            }
          />
        </div>
      )}

      <Panel
        title="Language breakdown"
        aside={
          totals ? (
            <span className="tabular font-mono text-xs text-muted-foreground">
              {formatDuration(totals.duration)} total
            </span>
          ) : undefined
        }
      >
        {languages.length === 0 ? (
          <EmptyState message="No language data in this range" />
        ) : (
          <BreakdownTable
            /*
             * Prefer the backend's canonical language colours, but drop its
             * grey fallback: it returns #6b7280 for anything it doesn't
             * recognise, which rendered TOML, Markdown and Shell as three
             * identical grey rows. Passing undefined lets the table assign a
             * distinct palette slot by rank.
             */
            rows={languages.map((l) => {
              const c = (l as LanguageStats & { color?: string }).color
              return { ...l, color: c && c.toLowerCase() !== '#6b7280' ? c : undefined }
            })}
            total={totals?.duration ?? 0}
            label="Language"
            formatDuration={formatDuration}
          />
        )}
      </Panel>
    </div>
  )
}

export default LanguagesPage
