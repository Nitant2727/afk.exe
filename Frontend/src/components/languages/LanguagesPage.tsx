import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Code2, Clock, Activity, Flame } from 'lucide-react'
import { Reveal, Stagger, StaggerItem } from '../ui/motion'
import { StatCard, PanelCard, EmptyState, RankRow, ACCENTS } from '../ui/data-display'
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
    const duration = languages.reduce((sum, l) => sum + l.duration, 0)
    const sessions = languages.reduce((sum, l) => sum + l.sessions, 0)
    return { duration, sessions, top: languages[0] }
  }, [languages])

  return (
    <div className="mx-auto w-full max-w-[92rem] space-y-6 px-6 py-7">
      <Reveal direction="down" duration={0.5}>
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-primary/90">
            Languages
          </p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight text-gradient sm:text-4xl">
            What you've been writing in
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
              label="Languages"
              value={languages.length}
              count={{ to: languages.length }}
              hint="Used in this range"
              icon={Code2}
              accent={ACCENTS[0]}
            />
          </StaggerItem>
          <StaggerItem>
            <StatCard
              label="Total time"
              value={formatDuration(totals?.duration ?? 0)}
              count={{ to: totals?.duration ?? 0, format: (n) => formatDuration(n) }}
              hint="Across all languages"
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
              label="Most used"
              value={totals?.top?.name ?? '—'}
              hint={totals?.top ? `${formatDuration(totals.top.duration)} tracked` : 'No data yet'}
              icon={Flame}
              accent={ACCENTS[3]}
            />
          </StaggerItem>
        </Stagger>
      )}

      <Reveal delay={0.05}>
        <PanelCard
          title="Language breakdown"
          description="Share of tracked time, ranked"
          action={
            totals ? (
              <span className="shrink-0 rounded-full bg-foreground/[0.05] px-2.5 py-1 font-mono text-[11px] text-muted-foreground ring-1 ring-inset ring-border/70">
                {formatDuration(totals.duration)} total
              </span>
            ) : undefined
          }
        >
          {languages.length === 0 ? (
            <EmptyState message="No language data in this range" />
          ) : (
            <ul className="-mx-1 divide-y divide-border/50">
              {languages.map((language, i) => (
                <RankRow
                  key={language.name}
                  rank={i + 1}
                  index={i}
                  name={language.name}
                  subtitle={`${language.sessions} ${language.sessions === 1 ? 'session' : 'sessions'}`}
                  value={formatDuration(language.duration)}
                  percent={
                    totals?.duration
                      ? Math.round((language.duration / totals.duration) * 100)
                      : 0
                  }
                  /* The backend ships canonical language colours — use them. */
                  color={(language as LanguageStats & { color?: string }).color}
                />
              ))}
            </ul>
          )}
        </PanelCard>
      </Reveal>
    </div>
  )
}

export default LanguagesPage
