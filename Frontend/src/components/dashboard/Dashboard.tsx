import { useQuery } from '@tanstack/react-query'
import {
  Clock,
  Code2,
  Layers,
  Flame,
} from 'lucide-react'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { Metric, Panel, ACCENT_SOLID } from '../ui/data-display'
import { formatDuration, formatDurationShort } from '../../lib/utils'
import { apiClient } from '../../lib/api'
import type {
  TimeFilter,
  SessionStats,
  DailyStats,
  LanguageStats,
  ProjectStats,
  FileSession,
} from '../../types/api'

interface DashboardProps {
  timeFilter: TimeFilter
}

const axis = {
  stroke: 'hsl(var(--muted-foreground) / 0.5)',
  fontSize: 11,
  tickLine: false,
  axisLine: false,
}

const ChartTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg border border-border bg-popover px-3 py-2 shadow-xl">
      <p className="mb-0.5 text-[11px] text-muted-foreground">{label}</p>
      <p className="tabular font-mono text-sm font-semibold">
        {formatDuration(payload[0].value)}
      </p>
    </div>
  )
}

const Dashboard = ({ timeFilter }: DashboardProps) => {
  const params = { time_filter: timeFilter }

  const statsQ = useQuery({
    queryKey: ['stats', timeFilter],
    queryFn: () => apiClient.getSessionStatistics(params),
  })
  const dailyQ = useQuery({
    queryKey: ['daily', timeFilter],
    queryFn: () => apiClient.getDailyStatistics(params),
  })
  const langQ = useQuery({
    queryKey: ['languages', timeFilter],
    queryFn: () => apiClient.getLanguageStatistics(params),
  })
  const projQ = useQuery({
    queryKey: ['projects', timeFilter],
    queryFn: () => apiClient.getProjectStatistics(params),
  })
  const recentQ = useQuery({
    queryKey: ['recent', timeFilter],
    queryFn: () => apiClient.getSessions({ ...params, limit: 8 }),
  })

  const stats = (statsQ.data?.success ? statsQ.data.data : null) as SessionStats | null
  const daily = ((dailyQ.data?.success ? dailyQ.data.data : []) ?? []) as DailyStats[]
  const languages = ((langQ.data?.success ? langQ.data.data : []) ?? []) as LanguageStats[]
  const projects = ((projQ.data?.success ? projQ.data.data : []) ?? []) as ProjectStats[]
  const recent = ((recentQ.data?.success ? recentQ.data.data?.sessions : []) ??
    []) as FileSession[]

  const loading = statsQ.isLoading || dailyQ.isLoading

  const delta = (() => {
    if (daily.length < 2) return undefined
    const prev = daily[daily.length - 2].duration
    const last = daily[daily.length - 1].duration
    if (!prev) return undefined
    return Math.round(((last - prev) / prev) * 100)
  })()

  const chart = daily.map((d) => ({
    ...d,
    label: new Date(d.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
  }))

  const langTotal = languages.reduce((s, l) => s + l.duration, 0)
  const projTotal = projects.reduce((s, p) => s + p.duration, 0)

  /*
   * Colour is keyed by language, not by row position — indexing by row meant
   * two Rust files could render green and purple in the same table. Prefers the
   * backend's canonical colour and falls back to a stable slot by rank.
   */
  const colorFor = (language: string) => {
    const i = languages.findIndex((l) => l.name === language)
    if (i === -1) return ACCENT_SOLID[0]
    // #6b7280 is the backend's "unknown language" grey — not a real colour.
    const c = (languages[i] as any).color as string | undefined
    if (c && c.toLowerCase() !== '#6b7280') return c
    return ACCENT_SOLID[i % ACCENT_SOLID.length]
  }

  return (
    <div className="grid gap-4 p-5 xl:grid-cols-[minmax(0,1fr)_310px]">
      {/* ---------------------------------------------------------- main */}
      <div className="min-w-0 space-y-4">
        {loading ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-[6.5rem] rounded-xl skeleton" />
            ))}
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Metric
              label="Coding time"
              icon={Clock}
              value={formatDuration(stats?.totalDuration ?? 0)}
              count={{ to: stats?.totalDuration ?? 0, format: (n) => formatDuration(n) }}
              sub={`Avg ${formatDuration(stats?.averageSessionDuration ?? 0)} / session`}
              delta={delta}
            />
            <Metric
              label="Sessions"
              icon={Layers}
              value={stats?.totalSessions ?? 0}
              count={{ to: stats?.totalSessions ?? 0 }}
              sub={`${projects.length} projects touched`}
            />
            <Metric
              label="Lines added"
              icon={Code2}
              value={stats?.totalLinesAdded ?? 0}
              count={{ to: stats?.totalLinesAdded ?? 0 }}
              sub={`${(stats?.totalLinesDeleted ?? 0).toLocaleString()} removed`}
            />
            <Metric
              label="Top language"
              icon={Flame}
              value={languages[0]?.name ?? '—'}
              sub={
                languages[0] ? `${formatDuration(languages[0].duration)} logged` : 'No data yet'
              }
            />
          </div>
        )}

        <Panel
          title="Activity"
          aside={
            stats && (
              <span className="tabular font-mono text-xs text-muted-foreground">
                {formatDuration(stats.totalDuration)} total
              </span>
            )
          }
        >
          {chart.length === 0 ? (
            <p className="py-16 text-center text-sm text-muted-foreground">
              No activity in this range
            </p>
          ) : (
            <ResponsiveContainer width="100%" height={230}>
              <AreaChart data={chart} margin={{ top: 6, right: 6, left: -14, bottom: 0 }}>
                <defs>
                  <linearGradient id="fill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="2 4"
                  vertical={false}
                  stroke="hsl(var(--border) / 0.7)"
                />
                <XAxis dataKey="label" {...axis} />
                <YAxis {...axis} tickFormatter={formatDurationShort} width={46} />
                <Tooltip
                  content={<ChartTooltip />}
                  cursor={{ stroke: 'hsl(var(--primary) / 0.35)', strokeWidth: 1 }}
                />
                <Area
                  type="monotone"
                  dataKey="duration"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  fill="url(#fill)"
                  dot={{ r: 2.5, strokeWidth: 0, fill: 'hsl(var(--primary))' }}
                  activeDot={{ r: 4 }}
                  animationDuration={800}
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </Panel>

        {/* Recent sessions — the detail the previous layout was missing. */}
        <Panel
          title="Recent sessions"
          aside={
            <span className="text-xs text-muted-foreground">
              {recent.length} shown
            </span>
          }
        >
          {recent.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">
              No sessions recorded yet
            </p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-[11px] uppercase tracking-wider text-muted-foreground">
                  <th className="pb-2 text-left font-medium">File</th>
                  <th className="pb-2 text-left font-medium">Project</th>
                  <th className="hidden pb-2 text-left font-medium sm:table-cell">Language</th>
                  <th className="pb-2 text-right font-medium">Edits</th>
                  <th className="pb-2 text-right font-medium">Duration</th>
                </tr>
              </thead>
              <tbody>
                {recent.map((s) => (
                  <tr
                    key={s.id}
                    className="border-t border-border/50 transition-colors hover:bg-foreground/[0.03]"
                  >
                    <td className="max-w-[13rem] truncate py-2 pr-3 font-mono text-[13px]">
                      {s.fileName}
                    </td>
                    <td className="py-2 pr-3 text-muted-foreground">{s.projectName}</td>
                    <td className="hidden py-2 pr-3 sm:table-cell">
                      <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                        <span
                          className="h-2 w-2 rounded-full"
                          style={{ background: colorFor(s.language) }}
                        />
                        {s.language}
                      </span>
                    </td>
                    <td className="py-2 pl-3 text-right tabular text-muted-foreground">
                      {s.totalEdits.toLocaleString()}
                    </td>
                    <td className="py-2 pl-3 text-right tabular font-mono">
                      {formatDuration(s.totalDuration)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Panel>
      </div>

      {/* ---------------------------------------------------------- rail */}
      <aside className="space-y-4">
        <Panel title="Languages">
          {languages.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">No data</p>
          ) : (
            <ul className="space-y-3">
              {languages.slice(0, 6).map((l, i) => {
                const pct = langTotal ? Math.round((l.duration / langTotal) * 100) : 0
                const hue = (l as any).color || ACCENT_SOLID[i % ACCENT_SOLID.length]
                return (
                  <li key={l.name}>
                    <div className="flex items-baseline justify-between gap-2 text-xs">
                      <span className="truncate font-medium">{l.name}</span>
                      <span className="shrink-0 tabular font-mono text-muted-foreground">
                        {formatDuration(l.duration)}
                      </span>
                    </div>
                    <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-foreground/[0.07]">
                      <div
                        className="h-full origin-left rounded-full"
                        style={{
                          background: hue,
                          transform: `scaleX(${Math.max(0.015, pct / 100)})`,
                          transition: `transform 0.7s cubic-bezier(0.16,1,0.3,1) ${i * 0.05}s`,
                        }}
                      />
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </Panel>

        <Panel title="Projects">
          {projects.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">No data</p>
          ) : (
            <ul className="space-y-2.5">
              {projects.slice(0, 6).map((p, i) => {
                const pct = projTotal ? Math.round((p.duration / projTotal) * 100) : 0
                return (
                  <li key={p.name} className="flex items-center gap-2.5">
                    <span className="w-4 shrink-0 font-mono text-[11px] text-muted-foreground">
                      {i + 1}
                    </span>
                    <span className="min-w-0 flex-1 truncate text-xs font-medium">{p.name}</span>
                    <span className="shrink-0 tabular font-mono text-xs text-muted-foreground">
                      {pct}%
                    </span>
                    <span className="shrink-0 tabular font-mono text-xs">
                      {formatDuration(p.duration)}
                    </span>
                  </li>
                )
              })}
            </ul>
          )}
        </Panel>
      </aside>
    </div>
  )
}

export default Dashboard
