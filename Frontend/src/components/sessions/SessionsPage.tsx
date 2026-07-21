import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { FileText, Clock, Pencil, Search, X } from 'lucide-react'
import {
  Metric,
  Panel,
  EmptyState,
  MetricSkeletons,
  ACCENT_SOLID,
} from '../ui/data-display'
import { SelectMenu } from '../ui/select-menu'
import { formatDuration, cn } from '../../lib/utils'
import { apiClient } from '../../lib/api'
import type { FileSession, LanguageStats, TimeFilter } from '../../types/api'

interface SessionsPageProps {
  timeFilter: TimeFilter
}

const PAGE_SIZE = 25

const SessionsPage = ({ timeFilter }: SessionsPageProps) => {
  const [project, setProject] = useState<string>('')
  const [language, setLanguage] = useState<string>('')
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(0)

  const params = { time_filter: timeFilter }

  const sessionsQ = useQuery({
    queryKey: ['sessions', timeFilter, project, language, page],
    queryFn: () =>
      apiClient.getSessions({
        ...params,
        limit: PAGE_SIZE,
        offset: page * PAGE_SIZE,
        ...(project ? { projectName: project } : {}),
        ...(language ? { language } : {}),
      }),
  })
  const projectsQ = useQuery({
    queryKey: ['projectNames'],
    queryFn: () => apiClient.getUniqueProjects(),
  })
  const languagesQ = useQuery({
    queryKey: ['languageStats', timeFilter],
    queryFn: () => apiClient.getLanguageStatistics(params),
  })

  const sessions = ((sessionsQ.data?.success ? sessionsQ.data.data?.sessions : []) ??
    []) as FileSession[]
  const total = (sessionsQ.data?.success ? sessionsQ.data.data?.total : 0) ?? 0
  const projectNames = ((projectsQ.data?.success ? projectsQ.data.data : []) ?? []) as string[]
  const languages = ((languagesQ.data?.success ? languagesQ.data.data : []) ??
    []) as LanguageStats[]

  /*
   * Colour is keyed by language rather than row position, so the same language
   * is always the same colour down the page.
   */
  const colorFor = (name: string) => {
    const i = languages.findIndex((l) => l.name === name)
    if (i === -1) return ACCENT_SOLID[0]
    const c = (languages[i] as LanguageStats & { color?: string }).color
    // #6b7280 is the backend's "unknown language" grey, not a real colour.
    if (c && c.toLowerCase() !== '#6b7280') return c
    return ACCENT_SOLID[i % ACCENT_SOLID.length]
  }

  // Free-text filtering is client-side; the API has no search parameter.
  const visible = useMemo(() => {
    if (!query.trim()) return sessions
    const q = query.toLowerCase()
    return sessions.filter(
      (s) =>
        s.fileName.toLowerCase().includes(q) ||
        s.projectName.toLowerCase().includes(q) ||
        s.filePath.toLowerCase().includes(q)
    )
  }, [sessions, query])

  const pageTotals = useMemo(
    () => ({
      duration: sessions.reduce((sum, s) => sum + s.totalDuration, 0),
      edits: sessions.reduce((sum, s) => sum + s.totalEdits, 0),
    }),
    [sessions]
  )

  const lastPage = Math.max(0, Math.ceil(total / PAGE_SIZE) - 1)
  const filtersActive = Boolean(project || language || query)

  const resetFilters = () => {
    setProject('')
    setLanguage('')
    setQuery('')
    setPage(0)
  }

  return (
    <div className="space-y-4 p-5">
      {sessionsQ.isLoading ? (
        <MetricSkeletons count={3} />
      ) : (
        <div className="grid gap-3 sm:grid-cols-3">
          <Metric
            label="Sessions"
            icon={FileText}
            value={total}
            count={{ to: total }}
            sub={filtersActive ? 'Matching current filters' : 'In this range'}
          />
          <Metric
            label="Time on this page"
            icon={Clock}
            value={formatDuration(pageTotals.duration)}
            count={{ to: pageTotals.duration, format: formatDuration }}
            sub={`${sessions.length} of ${total} shown`}
          />
          <Metric
            label="Edits on this page"
            icon={Pencil}
            value={pageTotals.edits}
            count={{ to: pageTotals.edits }}
            sub={
              sessions.length
                ? `Avg ${Math.round(pageTotals.edits / sessions.length)} per session`
                : '—'
            }
          />
        </div>
      )}

      <Panel
        title="All sessions"
        aside={
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3 w-3 -translate-y-1/2 text-muted-foreground" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Filter files…"
                aria-label="Filter sessions by file or project"
                className="h-8 w-40 rounded-lg border border-border/80 bg-foreground/[0.03] pl-7 pr-2 text-xs outline-none transition-colors placeholder:text-muted-foreground/70 focus:border-primary/50"
              />
            </div>

            <SelectMenu
              value={project}
              onChange={(v) => {
                setProject(v)
                setPage(0)
              }}
              options={projectNames.map((p) => ({ value: p, label: p }))}
              placeholder="All projects"
              emptyLabel="All projects"
              ariaLabel="Filter by project"
            />

            <SelectMenu
              value={language}
              onChange={(v) => {
                setLanguage(v)
                setPage(0)
              }}
              options={languages.map((l) => ({ value: l.name, label: l.name }))}
              placeholder="All languages"
              emptyLabel="All languages"
              ariaLabel="Filter by language"
            />

            {filtersActive && (
              <button
                onClick={resetFilters}
                className="flex h-8 items-center gap-1 rounded-lg px-2 text-xs text-muted-foreground transition-colors hover:bg-foreground/[0.06] hover:text-foreground"
              >
                <X className="h-3 w-3" />
                Clear
              </button>
            )}
          </div>
        }
      >
        {visible.length === 0 ? (
          <EmptyState
            message={filtersActive ? 'No sessions match these filters' : 'No sessions recorded'}
            hint={
              filtersActive
                ? 'Try clearing a filter or widening the date range.'
                : 'Start coding with the extension installed, or widen the time range.'
            }
          />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-[11px] uppercase tracking-wider text-muted-foreground">
                    <th className="pb-2 text-left font-medium">File</th>
                    <th className="hidden pb-2 text-left font-medium md:table-cell">Project</th>
                    <th className="hidden pb-2 text-left font-medium sm:table-cell">Language</th>
                    <th className="hidden pb-2 text-left font-medium lg:table-cell">Started</th>
                    <th className="pb-2 text-right font-medium">Edits</th>
                    <th className="pb-2 text-right font-medium">Duration</th>
                  </tr>
                </thead>
                <tbody>
                  {visible.map((s) => (
                    <tr
                      key={s.id}
                      className="border-t border-border/50 transition-colors hover:bg-foreground/[0.03]"
                    >
                      <td className="max-w-[15rem] py-2.5 pr-3">
                        <p className="truncate font-mono text-[13px]">{s.fileName}</p>
                        <p className="truncate text-[11px] text-muted-foreground">
                          {s.filePath}
                        </p>
                      </td>
                      <td className="hidden py-2.5 pr-3 text-muted-foreground md:table-cell">
                        {s.projectName}
                      </td>
                      <td className="hidden py-2.5 pr-3 sm:table-cell">
                        <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                          <span
                            className="h-2 w-2 shrink-0 rounded-full"
                            style={{ background: colorFor(s.language) }}
                          />
                          {s.language}
                        </span>
                      </td>
                      <td className="hidden py-2.5 pr-3 tabular text-xs text-muted-foreground lg:table-cell">
                        {new Date(s.sessionStartTime).toLocaleString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                      <td className="py-2.5 pl-3 text-right tabular text-muted-foreground">
                        {s.totalEdits.toLocaleString()}
                      </td>
                      <td className="py-2.5 pl-3 text-right tabular font-mono">
                        {formatDuration(s.totalDuration)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {lastPage > 0 && (
              <div className="mt-4 flex items-center justify-between border-t border-border/50 pt-3">
                <p className="text-xs text-muted-foreground">
                  Page <span className="tabular">{page + 1}</span> of{' '}
                  <span className="tabular">{lastPage + 1}</span>
                </p>
                <div className="flex gap-2">
                  {(['Previous', 'Next'] as const).map((dir) => {
                    const disabled = dir === 'Previous' ? page === 0 : page >= lastPage
                    return (
                      <button
                        key={dir}
                        onClick={() =>
                          setPage((p) =>
                            dir === 'Previous' ? Math.max(0, p - 1) : Math.min(lastPage, p + 1)
                          )
                        }
                        disabled={disabled}
                        className={cn(
                          'rounded-lg border border-border/80 px-2.5 py-1 text-xs transition-colors',
                          disabled
                            ? 'cursor-not-allowed opacity-40'
                            : 'hover:bg-foreground/[0.06]'
                        )}
                      >
                        {dir}
                      </button>
                    )
                  })}
                </div>
              </div>
            )}
          </>
        )}
      </Panel>
    </div>
  )
}

export default SessionsPage
