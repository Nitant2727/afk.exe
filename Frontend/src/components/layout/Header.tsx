import { useState } from 'react'
import { useQuery, useQueryClient, useIsFetching } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Moon, Sun, RefreshCw, Activity, WifiOff } from 'lucide-react'
import { Button } from '../ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select'
import { apiClient } from '../../lib/api'
import type { TimeFilter } from '../../types/api'
import { cn } from '../../lib/utils'

interface HeaderProps {
  timeFilter: TimeFilter
  onTimeFilterChange: (filter: TimeFilter) => void
  className?: string
}

const timeFilterOptions: Array<{ value: TimeFilter; label: string }> = [
  { value: 'today', label: 'Today' },
  { value: 'yesterday', label: 'Yesterday' },
  { value: 'this_week', label: 'This Week' },
  { value: 'last_week', label: 'Last Week' },
  { value: 'this_month', label: 'This Month' },
  { value: 'last_month', label: 'Last Month' },
  { value: 'last_7_days', label: 'Last 7 Days' },
  { value: 'last_30_days', label: 'Last 30 Days' },
]

const Header = ({ timeFilter, onTimeFilterChange, className }: HeaderProps) => {
  const [isDark, setIsDark] = useState(
    () =>
      typeof document !== 'undefined' &&
      document.documentElement.classList.contains('dark')
  )
  const queryClient = useQueryClient()
  const fetching = useIsFetching() > 0

  // Polls the backend so the badge reflects reality rather than an assumption.
  const { data: health } = useQuery({
    queryKey: ['health'],
    queryFn: () => apiClient.healthCheck(),
    refetchInterval: 15_000,
    retry: false,
  })
  const online = Boolean(health?.success)

  const handleThemeToggle = () => {
    const next = !isDark
    setIsDark(next)
    document.documentElement.classList.toggle('dark', next)
    localStorage.setItem('afk_theme', next ? 'dark' : 'light')
  }

  return (
    <header
      className={cn(
        'sticky top-0 z-30 flex h-16 shrink-0 items-center justify-between gap-4 px-6',
        'glass glass-edge border-x-0 border-t-0',
        className
      )}
    >
      <div className="flex min-w-0 items-center gap-3">
        <Select
          value={timeFilter}
          onValueChange={(value) => onTimeFilterChange(value as TimeFilter)}
        >
          <SelectTrigger className="w-[9.5rem] rounded-xl border-border/80 bg-foreground/[0.03] font-medium">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {timeFilterOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <motion.div
          key={String(online)}
          initial={{ opacity: 0, scale: 0.94 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
          className={cn(
            'hidden items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium sm:flex',
            online
              ? 'bg-success/10 text-success ring-1 ring-success/25'
              : 'bg-destructive/10 text-destructive ring-1 ring-destructive/25'
          )}
        >
          {online ? (
            <>
              <span className="relative grid h-2 w-2 place-items-center">
                <span className="absolute inset-0 rounded-full bg-success animate-pulse-ring" />
                <span className="h-2 w-2 rounded-full bg-success" />
              </span>
              <span className="hidden md:inline">Backend live</span>
              <Activity className="h-3 w-3 md:hidden" />
            </>
          ) : (
            <>
              <WifiOff className="h-3 w-3" />
              <span className="hidden md:inline">Backend offline</span>
            </>
          )}
        </motion.div>
      </div>

      <div className="flex shrink-0 items-center gap-1.5">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => queryClient.invalidateQueries()}
          aria-label="Refresh data"
          className="rounded-xl hover:bg-foreground/[0.06]"
        >
          <RefreshCw className={cn('h-4 w-4', fetching && 'animate-spin')} />
        </Button>

        <Button
          variant="ghost"
          size="icon"
          onClick={handleThemeToggle}
          aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
          className="rounded-xl hover:bg-foreground/[0.06]"
        >
          <motion.span
            key={isDark ? 'dark' : 'light'}
            initial={{ rotate: -90, opacity: 0, scale: 0.8 }}
            animate={{ rotate: 0, opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="grid place-items-center"
          >
            {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </motion.span>
        </Button>
      </div>
    </header>
  )
}

export default Header
