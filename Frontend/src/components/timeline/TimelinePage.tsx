import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { CalendarDays, Flame, TrendingUp, Clock } from 'lucide-react'
import { Metric, Panel, EmptyState, MetricSkeletons } from '../ui/data-display'
import { formatDuration, cn } from '../../lib/utils'
import { apiClient } from '../../lib/api'
import type { DailyStats, TimeFilter } from '../../types/api'

interface TimelinePageProps {
  timeFilter: TimeFilter
}

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

const TimelinePage = ({ timeFilter }: TimelinePageProps) => {
  const { data, isLoading } = useQuery({
    queryKey: ['daily', timeFilter],
    queryFn: () => apiClient.getDailyStatistics({ time_filter: timeFilter }),
  })

  const daily = ((data?.success ? data.data : []) ?? []) as DailyStats[]

  const summary = useMemo(() => {
    if (daily.length === 0) return null

    const totalDuration = daily.reduce((s, d) => s + d.duration, 0)
    const best = daily.reduce((b, d) => (d.duration > b.duration ? d : b), daily[0])

    // Longest run of consecutive tracked days, counting back from the latest.
    const sorted = [...daily].sort((a, b) => a.date.localeCompare(b.date))
    let streak = 0
    let longest = 0
    let prev: Date | null = null
    for (const d of sorted) {
      const day = new Date(d.date)
      if (prev && (day.getTime() - prev.getTime()) / 86_400_000 === 1) streak += 1
      else streak = 1
      longest = Math.max(longest, streak)
      prev = day
    }

    // Which weekday carries the most tracked time.
    const byWeekday = new Array(7).fill(0)
    for (const d of daily) {
      const idx = (new Date(d.date).getDay() + 6) % 7
      byWeekday[idx] += d.duration
    }
    const topIdx = byWeekday.indexOf(Math.max(...byWeekday))

    return {
      totalDuration,
      best,
      longest,
      activeDays: daily.length,
      byWeekday,
      topWeekday: byWeekday[topIdx] > 0 ? WEEKDAYS[topIdx] : '—',
      avgPerDay: totalDuration / daily.length,
    }
  }, [daily])

  const maxDuration = Math.max(...daily.map((d) => d.duration), 1)
  const maxWeekday = Math.max(...(summary?.byWeekday ?? [1]), 1)

  return (
    <div className="space-y-4 p-5">
      {isLoading ? (
        <MetricSkeletons />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Metric
            label="Active days"
            icon={CalendarDays}
            value={summary?.activeDays ?? 0}
            count={{ to: summary?.activeDays ?? 0 }}
            sub="Days with tracked time"
          />
          <Metric
            label="Best day"
            icon={Flame}
            value={
              summary?.best
                ? new Date(summary.best.date).toLocaleDateString(undefined, {
                    month: 'short',
                    day: 'numeric',
                  })
                : '—'
            }
            sub={summary?.best ? `${formatDuration(summary.best.duration)} tracked` : 'No data'}
            invert
          />
          <Metric
            label="Longest streak"
            icon={TrendingUp}
            value={summary?.longest ?? 0}
            count={{ to: summary?.longest ?? 0 }}
            sub={`Consecutive ${summary?.longest === 1 ? 'day' : 'days'}`}
          />
          <Metric
            label="Daily average"
            icon={Clock}
            value={formatDuration(summary?.avgPerDay ?? 0)}
            count={{ to: summary?.avgPerDay ?? 0, format: formatDuration }}
            sub={summary ? `Busiest on ${summary.topWeekday}` : '—'}
          />
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_300px]">
        <Panel
          title="Daily breakdown"
          aside={
            summary ? (
              <span className="tabular font-mono text-xs text-muted-foreground">
                {formatDuration(summary.totalDuration)} total
              </span>
            ) : undefined
          }
        >
          {daily.length === 0 ? (
            <EmptyState message="No activity in this range" />
          ) : (
            <ol className="space-y-1">
              {[...daily]
                .sort((a, b) => b.date.localeCompare(a.date))
                .map((d, i) => {
                  const pct = Math.round((d.duration / maxDuration) * 100)
                  const date = new Date(d.date)
                  const isTop = d.date === summary?.best.date
                  return (
                    <li
                      key={d.date}
                      className="group flex items-center gap-3 rounded-lg px-2 py-2 transition-colors hover:bg-foreground/[0.03]"
                    >
                      <div className="w-20 shrink-0">
                        <p className="text-xs font-medium">
                          {date.toLocaleDateString(undefined, {
                            month: 'short',
                            day: 'numeric',
                          })}
                        </p>
                        <p className="text-[11px] text-muted-foreground">
                          {WEEKDAYS[(date.getDay() + 6) % 7]}
                        </p>
                      </div>

                      <div className="h-2 flex-1 overflow-hidden rounded-full bg-foreground/[0.07]">
                        <div
                          className={cn(
                            'h-full origin-left rounded-full',
                            isTop ? 'bg-primary' : 'bg-primary/45'
                          )}
                          style={{
                            transform: `scaleX(${Math.max(0.015, pct / 100)})`,
                            transition: `transform 0.7s cubic-bezier(0.16,1,0.3,1) ${
                              Math.min(i, 12) * 0.04
                            }s`,
                          }}
                        />
                      </div>

                      <p className="w-16 shrink-0 text-right tabular text-xs text-muted-foreground">
                        {d.sessions} {d.sessions === 1 ? 'session' : 'sessions'}
                      </p>
                      <p className="w-16 shrink-0 text-right tabular font-mono text-sm">
                        {formatDuration(d.duration)}
                      </p>
                    </li>
                  )
                })}
            </ol>
          )}
        </Panel>

        <Panel title="By weekday">
          {!summary ? (
            <EmptyState message="No data" />
          ) : (
            <ul className="space-y-2.5">
              {WEEKDAYS.map((day, i) => {
                const value = summary.byWeekday[i]
                const pct = Math.round((value / maxWeekday) * 100)
                return (
                  <li key={day} className="flex items-center gap-2.5">
                    <span className="w-8 shrink-0 text-xs text-muted-foreground">{day}</span>
                    <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-foreground/[0.07]">
                      <span
                        className="block h-full origin-left rounded-full bg-primary/70"
                        style={{
                          transform: `scaleX(${Math.max(0.01, pct / 100)})`,
                          transition: `transform 0.7s cubic-bezier(0.16,1,0.3,1) ${i * 0.05}s`,
                        }}
                      />
                    </span>
                    <span className="w-14 shrink-0 text-right tabular font-mono text-xs text-muted-foreground">
                      {value ? formatDuration(value) : '—'}
                    </span>
                  </li>
                )
              })}
            </ul>
          )}
        </Panel>
      </div>
    </div>
  )
}

export default TimelinePage
