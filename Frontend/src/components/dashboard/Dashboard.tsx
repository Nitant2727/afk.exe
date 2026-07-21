import type { ReactNode } from 'react'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import {
  Clock,
  Code2,
  Layers,
  Flame,
  TrendingUp,
  TrendingDown,
  type LucideIcon,
} from 'lucide-react'
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { Reveal, Stagger, StaggerItem, CountUp, TiltCard, Spotlight } from '../ui/motion'
import { formatDuration, formatDurationShort, cn } from '../../lib/utils'
import { apiClient } from '../../lib/api'
import type {
  TimeFilter,
  SessionStats,
  DailyStats,
  LanguageStats,
  ProjectStats,
} from '../../types/api'

interface DashboardProps {
  timeFilter: TimeFilter
}

/** Fallback palette for languages the backend doesn't colour itself. */
const FALLBACK_COLORS = [
  'hsl(217 91% 60%)',
  'hsl(38 92% 55%)',
  'hsl(152 62% 48%)',
  'hsl(280 65% 65%)',
  'hsl(340 75% 60%)',
  'hsl(190 80% 55%)',
]

const chartAxis = {
  stroke: 'hsl(var(--muted-foreground) / 0.55)',
  fontSize: 11,
  tickLine: false,
  axisLine: false,
}

/** Shared tooltip so every chart reads the same way. */
const ChartTooltip = ({ active, payload, label, valueFormat }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-xl border border-border/80 bg-popover/95 px-3 py-2 shadow-xl backdrop-blur">
      {label != null && (
        <p className="mb-1 text-[11px] font-medium text-muted-foreground">{label}</p>
      )}
      {payload.map((entry: any) => (
        <p key={entry.dataKey ?? entry.name} className="flex items-center gap-2 text-sm">
          <span
            className="h-2 w-2 shrink-0 rounded-full"
            style={{ background: entry.color ?? entry.payload?.fill }}
          />
          <span className="text-muted-foreground">{entry.name}</span>
          <span className="tabular font-medium text-foreground">
            {valueFormat ? valueFormat(entry.value) : entry.value}
          </span>
        </p>
      ))}
    </div>
  )
}

interface StatCardProps {
  label: string
  value: string | number
  hint: string
  icon: LucideIcon
  accent: string
  /** Rendered as an animated counter when provided. */
  count?: { to: number; format?: (n: number) => string }
  trend?: number
}

const StatCard = ({ label, value, hint, icon: Icon, accent, count, trend }: StatCardProps) => (
  <TiltCard className="h-full">
    <Card className="group relative h-full overflow-hidden rounded-2xl glass glow-ring-hover sheen">
      <Spotlight />
      {/* Accent wash bound to the metric's colour. */}
      <div
        aria-hidden
        className="pointer-events-none absolute -right-10 -top-12 h-32 w-32 rounded-full opacity-50 blur-3xl transition-opacity duration-500 group-hover:opacity-90"
        style={{ background: accent }}
      />
      <CardContent className="relative z-10 p-5">
        <div className="flex items-start justify-between gap-3">
          <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
            {label}
          </p>
          <span
            className="grid h-8 w-8 shrink-0 place-items-center rounded-lg ring-1 ring-inset ring-border/70 transition-transform duration-300 group-hover:scale-110"
            style={{ background: accent }}
          >
            <Icon className="h-4 w-4 text-foreground/90" />
          </span>
        </div>

        <p className="mt-3 font-mono text-3xl font-semibold leading-none tracking-tight">
          {count ? <CountUp value={count.to} format={count.format} /> : value}
        </p>

        <div className="mt-2 flex items-center gap-1.5">
          {trend != null && trend !== 0 && Number.isFinite(trend) && (
            <span
              className={cn(
                'inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 text-[10px] font-medium tabular',
                trend > 0 ? 'bg-success/12 text-success' : 'bg-destructive/12 text-destructive'
              )}
            >
              {trend > 0 ? (
                <TrendingUp className="h-3 w-3" />
              ) : (
                <TrendingDown className="h-3 w-3" />
              )}
              {Math.abs(trend)}%
            </span>
          )}
          <p className="truncate text-xs text-muted-foreground">{hint}</p>
        </div>
      </CardContent>
    </Card>
  </TiltCard>
)

const ChartCard = ({
  title,
  description,
  children,
  className,
}: {
  title: string
  description: string
  children: ReactNode
  className?: string
}) => (
  <Card className={cn('relative overflow-hidden rounded-2xl glass glow-ring-hover', className)}>
    <Spotlight size={460} />
    <CardHeader className="relative z-10 pb-2">
      <CardTitle className="text-base font-semibold tracking-tight">{title}</CardTitle>
      <CardDescription className="text-xs">{description}</CardDescription>
    </CardHeader>
    <CardContent className="relative z-10">{children}</CardContent>
  </Card>
)

const EmptyChart = ({ message }: { message: string }) => (
  <div className="grid h-64 place-items-center text-center">
    <div>
      <Layers className="mx-auto h-8 w-8 text-muted-foreground/40" />
      <p className="mt-2 text-sm text-muted-foreground">{message}</p>
      <p className="mt-1 text-xs text-muted-foreground/70">
        Start coding with the extension installed, or widen the time range.
      </p>
    </div>
  </div>
)

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

  const stats = (statsQ.data?.success ? statsQ.data.data : null) as SessionStats | null
  const daily = ((dailyQ.data?.success ? dailyQ.data.data : []) ?? []) as DailyStats[]
  const languages = ((langQ.data?.success ? langQ.data.data : []) ?? []) as LanguageStats[]
  const projects = ((projQ.data?.success ? projQ.data.data : []) ?? []) as ProjectStats[]

  const loading = statsQ.isLoading || dailyQ.isLoading

  const topLanguage = languages[0]?.name ?? '—'
  const topProject = projects[0]?.name ?? '—'

  // Compare the latest day against the previous one for a direction hint.
  const trend = (() => {
    if (daily.length < 2) return undefined
    const prev = daily[daily.length - 2].duration
    const last = daily[daily.length - 1].duration
    if (!prev) return undefined
    return Math.round(((last - prev) / prev) * 100)
  })()

  const dailyChart = daily.map((d) => ({
    ...d,
    label: new Date(d.date).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
    }),
  }))

  return (
    <div className="mx-auto w-full max-w-[92rem] space-y-6 px-6 py-7">
      <Reveal direction="down" duration={0.5}>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-primary/90">
              Overview
            </p>
            <h1 className="mt-1 text-3xl font-semibold tracking-tight text-gradient sm:text-4xl">
              Where your hours actually went
            </h1>
          </div>
          {stats && (
            <p className="text-sm text-muted-foreground">
              <span className="tabular font-medium text-foreground">
                {stats.totalSessions.toLocaleString()}
              </span>{' '}
              sessions across{' '}
              <span className="tabular font-medium text-foreground">{projects.length}</span>{' '}
              projects
            </p>
          )}
        </div>
      </Reveal>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-[7.5rem] rounded-2xl skeleton" />
          ))}
        </div>
      ) : (
        <Stagger className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StaggerItem>
            <StatCard
              label="Coding time"
              value={formatDuration(stats?.totalDuration ?? 0)}
              count={{ to: stats?.totalDuration ?? 0, format: (n) => formatDuration(n) }}
              hint={`Avg ${formatDuration(stats?.averageSessionDuration ?? 0)} per session`}
              icon={Clock}
              accent="hsl(var(--primary) / 0.22)"
              trend={trend}
            />
          </StaggerItem>
          <StaggerItem>
            <StatCard
              label="Sessions"
              value={stats?.totalSessions ?? 0}
              count={{ to: stats?.totalSessions ?? 0 }}
              hint={`Top project: ${topProject}`}
              icon={Layers}
              accent="hsl(38 92% 55% / 0.20)"
            />
          </StaggerItem>
          <StaggerItem>
            <StatCard
              label="Lines added"
              value={stats?.totalLinesAdded ?? 0}
              count={{ to: stats?.totalLinesAdded ?? 0 }}
              hint={`${(stats?.totalLinesDeleted ?? 0).toLocaleString()} removed`}
              icon={Code2}
              accent="hsl(152 62% 48% / 0.20)"
            />
          </StaggerItem>
          <StaggerItem>
            <StatCard
              label="Top language"
              value={topLanguage}
              hint={
                languages[0] ? `${formatDuration(languages[0].duration)} logged` : 'No data yet'
              }
              icon={Flame}
              accent="hsl(280 65% 65% / 0.20)"
            />
          </StaggerItem>
        </Stagger>
      )}

      <div className="grid gap-5 lg:grid-cols-5">
        <Reveal className="lg:col-span-3" delay={0.05}>
          <ChartCard
            title="Daily activity"
            description="Time tracked per day over the selected range"
          >
            {dailyChart.length === 0 ? (
              <EmptyChart message="No activity in this range" />
            ) : (
              <ResponsiveContainer width="100%" height={288}>
                <AreaChart data={dailyChart} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
                  <defs>
                    <linearGradient id="activityFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.45} />
                      <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="hsl(var(--border) / 0.6)"
                  />
                  <XAxis dataKey="label" {...chartAxis} />
                  <YAxis {...chartAxis} tickFormatter={(v) => formatDurationShort(v)} width={48} />
                  <Tooltip
                    content={<ChartTooltip valueFormat={(v: number) => formatDuration(v)} />}
                    cursor={{ stroke: 'hsl(var(--primary) / 0.4)', strokeWidth: 1 }}
                  />
                  <Area
                    type="monotone"
                    dataKey="duration"
                    name="Tracked"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    fill="url(#activityFill)"
                    animationDuration={900}
                    activeDot={{ r: 4, strokeWidth: 2 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </ChartCard>
        </Reveal>

        <Reveal className="lg:col-span-2" delay={0.12}>
          <ChartCard title="Languages" description="Share of tracked time by language">
            {languages.length === 0 ? (
              <EmptyChart message="No language data yet" />
            ) : (
              <div className="relative">
                <ResponsiveContainer width="100%" height={264}>
                  <PieChart>
                    <Pie
                      data={languages.slice(0, 6)}
                      dataKey="duration"
                      nameKey="name"
                      innerRadius={62}
                      outerRadius={96}
                      paddingAngle={3}
                      stroke="none"
                      animationDuration={900}
                    >
                      {languages.slice(0, 6).map((entry, i) => (
                        <Cell
                          key={entry.name}
                          fill={(entry as any).color || FALLBACK_COLORS[i % FALLBACK_COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      content={<ChartTooltip valueFormat={(v: number) => formatDuration(v)} />}
                    />
                  </PieChart>
                </ResponsiveContainer>

                {/* Donut centre carries the headline. */}
                <div className="pointer-events-none absolute inset-x-0 top-0 grid h-[264px] place-items-center">
                  <div className="text-center">
                    <p className="font-mono text-xl font-semibold">{topLanguage}</p>
                    <p className="text-[11px] text-muted-foreground">most used</p>
                  </div>
                </div>

                <ul className="mt-3 space-y-1.5">
                  {languages.slice(0, 5).map((l, i) => (
                    <li key={l.name} className="flex items-center gap-2 text-xs">
                      <span
                        className="h-2 w-2 shrink-0 rounded-full"
                        style={{
                          background:
                            (l as any).color || FALLBACK_COLORS[i % FALLBACK_COLORS.length],
                        }}
                      />
                      <span className="flex-1 truncate text-muted-foreground">{l.name}</span>
                      <span className="tabular text-foreground/90">
                        {formatDuration(l.duration)}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </ChartCard>
        </Reveal>
      </div>

      <Reveal delay={0.05}>
        <ChartCard title="Project breakdown" description="Time spent per project">
          {projects.length === 0 ? (
            <EmptyChart message="No projects tracked yet" />
          ) : (
            <ResponsiveContainer width="100%" height={Math.max(220, projects.length * 46)}>
              <BarChart
                data={projects.slice(0, 8)}
                layout="vertical"
                margin={{ top: 4, right: 24, left: 8, bottom: 4 }}
              >
                <defs>
                  <linearGradient id="projectFill" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.9} />
                    <stop offset="100%" stopColor="hsl(var(--accent))" stopOpacity={0.75} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  horizontal={false}
                  stroke="hsl(var(--border) / 0.6)"
                />
                <XAxis type="number" {...chartAxis} tickFormatter={(v) => formatDurationShort(v)} />
                <YAxis
                  type="category"
                  dataKey="name"
                  {...chartAxis}
                  width={104}
                  tick={{ fontSize: 12, fill: 'hsl(var(--foreground) / 0.85)' }}
                />
                <Tooltip
                  content={<ChartTooltip valueFormat={(v: number) => formatDuration(v)} />}
                  cursor={{ fill: 'hsl(var(--foreground) / 0.04)' }}
                />
                <Bar
                  dataKey="duration"
                  name="Tracked"
                  fill="url(#projectFill)"
                  radius={[0, 8, 8, 0]}
                  animationDuration={900}
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>
      </Reveal>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="pb-2 text-center text-[11px] text-muted-foreground/70"
      >
        Data collected locally by the AFK extension for VS Code and Cursor.
      </motion.p>
    </div>
  )
}

export default Dashboard
