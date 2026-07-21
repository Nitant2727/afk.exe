import { useState } from 'react'
import { useQuery, useQueryClient, useIsFetching } from '@tanstack/react-query'
import { Moon, Sun, RefreshCw, Search } from 'lucide-react'
import { apiClient } from '../../lib/api'
import type { TimeFilter } from '../../types/api'
import { cn } from '../../lib/utils'

interface HeaderProps {
  title: string
  timeFilter: TimeFilter
  onTimeFilterChange: (filter: TimeFilter) => void
  className?: string
}

/**
 * The common ranges live in a segmented control because they are the control
 * people actually reach for; the long tail stays in the adjacent select. A
 * single eight-item dropdown made the most frequent action a two-step one.
 */
const QUICK: Array<{ value: TimeFilter; label: string }> = [
  { value: 'today', label: 'Day' },
  { value: 'last_7_days', label: 'Week' },
  { value: 'last_30_days', label: 'Month' },
]

const MORE: Array<{ value: TimeFilter; label: string }> = [
  { value: 'yesterday', label: 'Yesterday' },
  { value: 'this_week', label: 'This week' },
  { value: 'last_week', label: 'Last week' },
  { value: 'this_month', label: 'This month' },
  { value: 'last_month', label: 'Last month' },
]

const Header = ({ title, timeFilter, onTimeFilterChange, className }: HeaderProps) => {
  const [isDark, setIsDark] = useState(
    () =>
      typeof document !== 'undefined' &&
      document.documentElement.classList.contains('dark')
  )
  const queryClient = useQueryClient()
  const fetching = useIsFetching() > 0

  const { data: health } = useQuery({
    queryKey: ['health'],
    queryFn: () => apiClient.healthCheck(),
    refetchInterval: 15_000,
    retry: false,
  })
  const online = Boolean(health?.success)

  const toggleTheme = () => {
    const next = !isDark
    setIsDark(next)
    document.documentElement.classList.toggle('dark', next)
    localStorage.setItem('afk_theme', next ? 'dark' : 'light')
  }

  return (
    <header
      className={cn(
        'flex h-[62px] shrink-0 items-center gap-4 border-b border-border/70 px-5',
        className
      )}
    >
      <h1 className="shrink-0 text-[17px] font-semibold tracking-tight">{title}</h1>

      <div className="relative ml-2 hidden min-w-0 max-w-xs flex-1 md:block">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
        <input
          type="search"
          placeholder="Search projects, files…"
          aria-label="Search"
          className="h-9 w-full rounded-lg border border-border/80 bg-foreground/[0.03] pl-9 pr-3 text-sm outline-none transition-colors placeholder:text-muted-foreground/70 focus:border-primary/50 focus:bg-foreground/[0.05]"
        />
      </div>

      <div className="ml-auto flex shrink-0 items-center gap-2">
        {/* Segmented range control. */}
        <div className="hidden items-center rounded-lg border border-border/80 bg-foreground/[0.03] p-0.5 sm:flex">
          {QUICK.map((q) => (
            <button
              key={q.value}
              onClick={() => onTimeFilterChange(q.value)}
              className={cn(
                'rounded-md px-2.5 py-1 text-xs font-medium transition-colors',
                timeFilter === q.value
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {q.label}
            </button>
          ))}
        </div>

        <select
          value={MORE.some((m) => m.value === timeFilter) ? timeFilter : ''}
          onChange={(e) => e.target.value && onTimeFilterChange(e.target.value as TimeFilter)}
          aria-label="Other date ranges"
          className="h-8 rounded-lg border border-border/80 bg-foreground/[0.03] px-2 text-xs text-muted-foreground outline-none transition-colors hover:text-foreground focus:border-primary/50"
        >
          <option value="">Custom…</option>
          {MORE.map((m) => (
            <option key={m.value} value={m.value}>
              {m.label}
            </option>
          ))}
        </select>

        <span
          title={online ? 'Backend reachable' : 'Backend unreachable'}
          className="flex items-center gap-1.5 rounded-lg px-2 py-1.5"
        >
          <span
            className={cn(
              'h-1.5 w-1.5 rounded-full',
              online ? 'bg-success animate-pulse-ring' : 'bg-destructive'
            )}
          />
          <span className="hidden text-[11px] font-medium text-muted-foreground lg:inline">
            {online ? 'Live' : 'Offline'}
          </span>
        </span>

        <button
          onClick={() => queryClient.invalidateQueries()}
          aria-label="Refresh data"
          className="grid h-8 w-8 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-foreground/[0.06] hover:text-foreground"
        >
          <RefreshCw className={cn('h-4 w-4', fetching && 'animate-spin')} />
        </button>

        <button
          onClick={toggleTheme}
          aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
          className="grid h-8 w-8 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-foreground/[0.06] hover:text-foreground"
        >
          {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </button>
      </div>
    </header>
  )
}

export default Header
