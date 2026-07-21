import { useQuery } from '@tanstack/react-query'
import { Plus, Minus, Pencil, Gauge, Clock } from 'lucide-react'
import {
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { Metric, Panel, EmptyState, MetricSkeletons } from '../ui/data-display'
import { formatDuration, formatDurationShort } from '../../lib/utils'
import { apiClient } from '../../lib/api'
import type { SessionStats, TimeFilter } from '../../types/api'

interface AnalyticsPageProps {
  timeFilter: TimeFilter
}

const axis = {
  stroke: 'hsl(var(--muted-foreground) / 0.5)',
  fontSize: 11,
  tickLine: false,
  axisLine: false,
}

const HourTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg border border-border bg-popover px-3 py-2 shadow-xl">
      <p className="mb-0.5 text-[11px] text-muted-foreground">{label}:00</p>
      <p className="tabular font-mono text-sm font-semibold">
        {formatDuration(payload[0].value)}
      </p>
    </div>
  )
}

/** How the edit volume splits between additions, edits and deletions. */
const ChurnBar = ({
  added,
  deleted,
  modified,
}: {
  added: number
  deleted: number
  modified: number
}) => {
  const total = added + deleted + modified
  if (!total) return null

  const parts = [
    { label: 'Added', value: added, color: 'hsl(var(--success))' },
    { label: 'Modified', value: modified, color: 'hsl(var(--primary))' },
    { label: 'Deleted', value: deleted, color: 'hsl(var(--destructive))' },
  ]

  return (
    <div>
      <div className="flex h-2.5 overflow-hidden rounded-full">
        {parts.map((p) => (
          <span
            key={p.label}
            title={`${p.label}: ${p.value.toLocaleString()}`}
            style={{ width: `${(p.value / total) * 100}%`, background: p.color }}
          />
        ))}
      </div>
      <ul className="mt-3 space-y-1.5">
        {parts.map((p) => (
          <li key={p.label} className="flex items-center gap-2 text-xs">
            <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: p.color }} />
            <span className="flex-1 text-muted-foreground">{p.label}</span>
            <span className="tabular font-mono">{p.value.toLocaleString()}</span>
            <span className="w-9 shrink-0 text-right tabular text-muted-foreground">
              {Math.round((p.value / total) * 100)}%
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}

const AnalyticsPage = ({ timeFilter }: AnalyticsPageProps) => {
  const params = { time_filter: timeFilter }

  const statsQ = useQuery({
    queryKey: ['stats', timeFilter],
    queryFn: () => apiClient.getSessionStatistics(params),
  })
  const hourlyQ = useQuery({
    queryKey: ['hourly', timeFilter],
    queryFn: () => apiClient.getHourlyStatistics(params),
  })

  const stats = (statsQ.data?.success ? statsQ.data.data : null) as SessionStats | null
  const hourly = ((hourlyQ.data?.success ? hourlyQ.data.data : []) ?? []) as Array<{
    hour: string
    duration: number
  }>

  const peak = hourly.reduce((best, h) => (h.duration > best.duration ? h : best), {
    hour: '—',
    duration: 0,
  })
  const activeHours = hourly.filter((h) => h.duration > 0).length
  const churn = (stats?.totalLinesAdded ?? 0) + (stats?.totalLinesDeleted ?? 0)

  return (
    <div className="space-y-4 p-5">
      {statsQ.isLoading ? (
        <MetricSkeletons />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Metric
            label="Lines added"
            icon={Plus}
            value={stats?.totalLinesAdded ?? 0}
            count={{ to: stats?.totalLinesAdded ?? 0 }}
            sub={
              churn
                ? `${Math.round(((stats?.totalLinesAdded ?? 0) / churn) * 100)}% of churn`
                : '—'
            }
          />
          <Metric
            label="Lines removed"
            icon={Minus}
            value={stats?.totalLinesDeleted ?? 0}
            count={{ to: stats?.totalLinesDeleted ?? 0 }}
            sub={
              churn
                ? `${Math.round(((stats?.totalLinesDeleted ?? 0) / churn) * 100)}% of churn`
                : '—'
            }
          />
          <Metric
            label="Total edits"
            icon={Pencil}
            value={stats?.totalEdits ?? 0}
            count={{ to: stats?.totalEdits ?? 0 }}
            sub={`${(stats?.totalLinesModified ?? 0).toLocaleString()} lines modified`}
          />
          <Metric
            label="Peak hour"
            icon={Gauge}
            value={peak.duration ? `${peak.hour}:00` : '—'}
            sub={peak.duration ? `${formatDuration(peak.duration)} logged` : 'No data yet'}
            invert
          />
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
        <Panel
          title="When you code"
          aside={
            activeHours > 0 ? (
              <span className="text-xs text-muted-foreground">
                {activeHours} active {activeHours === 1 ? 'hour' : 'hours'} of 24
              </span>
            ) : undefined
          }
        >
          {hourly.length === 0 ? (
            <EmptyState message="No hourly data in this range" />
          ) : (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={hourly} margin={{ top: 6, right: 6, left: -14, bottom: 0 }}>
                <CartesianGrid
                  strokeDasharray="2 4"
                  vertical={false}
                  stroke="hsl(var(--border) / 0.7)"
                />
                <XAxis dataKey="hour" {...axis} interval={1} />
                <YAxis {...axis} tickFormatter={formatDurationShort} width={46} />
                <Tooltip
                  content={<HourTooltip />}
                  cursor={{ fill: 'hsl(var(--foreground) / 0.04)' }}
                />
                <Bar dataKey="duration" radius={[3, 3, 0, 0]} animationDuration={700}>
                  {/* The busiest hour is the point of the chart — mark it. */}
                  {hourly.map((h) => (
                    <Cell
                      key={h.hour}
                      fill={
                        h.hour === peak.hour && peak.duration > 0
                          ? 'hsl(var(--primary))'
                          : 'hsl(var(--primary) / 0.28)'
                      }
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </Panel>

        <Panel title="Code churn">
          {!stats || churn === 0 ? (
            <EmptyState message="No edits recorded" />
          ) : (
            <ChurnBar
              added={stats.totalLinesAdded}
              deleted={stats.totalLinesDeleted}
              modified={stats.totalLinesModified}
            />
          )}
        </Panel>
      </div>

      <Panel title="Session shape">
        {!stats || !stats.totalSessions ? (
          <EmptyState message="No sessions in this range" />
        ) : (
          <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                term: 'Average session',
                value: formatDuration(stats.averageSessionDuration),
                hint: 'Mean tracked length',
                icon: Clock,
              },
              {
                term: 'Edits per session',
                value: Math.round(stats.totalEdits / stats.totalSessions).toLocaleString(),
                hint: 'Mean edit operations',
                icon: Pencil,
              },
              {
                term: 'Lines per session',
                value: Math.round(stats.totalLinesAdded / stats.totalSessions).toLocaleString(),
                hint: 'Mean lines added',
                icon: Plus,
              },
              {
                term: 'Add / remove ratio',
                value: stats.totalLinesDeleted
                  ? (stats.totalLinesAdded / stats.totalLinesDeleted).toFixed(2)
                  : '∞',
                hint: 'Higher means more net new code',
                icon: Gauge,
              },
            ].map((row) => (
              <div key={row.term}>
                <dt className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                  <row.icon className="h-3 w-3" />
                  {row.term}
                </dt>
                <dd className="mt-1.5 font-mono text-xl font-semibold tracking-tight">
                  {row.value}
                </dd>
                <p className="mt-0.5 text-xs text-muted-foreground">{row.hint}</p>
              </div>
            ))}
          </dl>
        )}
      </Panel>
    </div>
  )
}

export default AnalyticsPage
