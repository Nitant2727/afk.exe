/**
 * Shared surfaces for the analytics pages.
 *
 * Deliberately plain: no tilt, spotlight or sheen. Those were applied to every
 * card previously, which flattened the hierarchy — when every surface carries
 * an effect, none of them signal anything. Emphasis is spent on the data.
 */
import type { ReactNode } from 'react'
import { ArrowUpRight, ArrowDownRight, type LucideIcon } from 'lucide-react'
import { CountUp } from './motion'
import { cn } from '../../lib/utils'

/**
 * Row colours.
 *
 * Hex on purpose: these get suffixed with hex alpha to build gradients, and the
 * backend's own language colours are hex too. An `hsl()` string would produce
 * `hsl(...)bb` — invalid CSS that fails silently and renders an empty meter.
 */
export const ACCENT_SOLID = [
  '#3b82f6',
  '#f59e0b',
  '#22c55e',
  '#a855f7',
  '#06b6d4',
  '#ec4899',
]

interface MetricProps {
  label: string
  icon: LucideIcon
  value: string | number
  sub?: string
  /** Renders an animated counter instead of a static value. */
  count?: { to: number; format?: (n: number) => string }
  delta?: number
  className?: string
}

export const Metric = ({
  label,
  icon: Icon,
  value,
  sub,
  count,
  delta,
  className,
}: MetricProps) => (
  <div
    className={cn(
      'rounded-xl border border-border/70 bg-surface/50 p-4 transition-colors hover:border-border',
      className
    )}
  >
    <div className="flex items-center gap-2">
      <Icon className="h-3.5 w-3.5 text-muted-foreground" />
      <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      {delta != null && delta !== 0 && Number.isFinite(delta) && (
        <span
          className={cn(
            'ml-auto flex items-center gap-0.5 text-[11px] font-medium tabular',
            delta > 0 ? 'text-success' : 'text-destructive'
          )}
        >
          {delta > 0 ? (
            <ArrowUpRight className="h-3 w-3" />
          ) : (
            <ArrowDownRight className="h-3 w-3" />
          )}
          {Math.abs(delta)}%
        </span>
      )}
    </div>
    <p className="mt-2.5 truncate font-mono text-2xl font-semibold leading-none tracking-tight">
      {count ? <CountUp value={count.to} format={count.format} /> : value}
    </p>
    {sub && <p className="mt-1.5 truncate text-xs text-muted-foreground">{sub}</p>}
  </div>
)

export const Panel = ({
  title,
  aside,
  children,
  className,
  bodyClassName,
}: {
  title: string
  aside?: ReactNode
  children: ReactNode
  className?: string
  bodyClassName?: string
}) => (
  <section className={cn('rounded-xl border border-border/70 bg-surface/50', className)}>
    <div className="flex items-center justify-between gap-3 border-b border-border/60 px-4 py-3">
      <h2 className="text-sm font-semibold tracking-tight">{title}</h2>
      {aside}
    </div>
    <div className={cn('p-4', bodyClassName)}>{children}</div>
  </section>
)

export const EmptyState = ({
  message,
  hint = 'Start coding with the extension installed, or widen the time range.',
}: {
  message: string
  hint?: string
}) => (
  <div className="py-12 text-center">
    <p className="text-sm text-muted-foreground">{message}</p>
    <p className="mt-1 text-xs text-muted-foreground/70">{hint}</p>
  </div>
)

export const MetricSkeletons = ({ count = 4 }: { count?: number }) => (
  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className="h-[6.5rem] rounded-xl skeleton" />
    ))}
  </div>
)

interface BreakdownRow {
  name: string
  duration: number
  sessions: number
  color?: string
}

/**
 * Ranked breakdown table shared by Projects and Languages.
 *
 * The meter is a scaled element rather than an animated width, so it composites
 * on the GPU instead of forcing layout on every frame.
 */
export const BreakdownTable = ({
  rows,
  total,
  label,
  formatDuration,
}: {
  rows: BreakdownRow[]
  total: number
  /** Column heading for the name column, e.g. "Project". */
  label: string
  formatDuration: (n: number) => string
}) => (
  <table className="w-full text-sm">
    <thead>
      <tr className="text-[11px] uppercase tracking-wider text-muted-foreground">
        <th className="w-8 pb-2 text-left font-medium">#</th>
        <th className="pb-2 text-left font-medium">{label}</th>
        <th className="hidden pb-2 text-right font-medium sm:table-cell">Sessions</th>
        <th className="w-[34%] pb-2 pl-4 text-left font-medium">Share</th>
        <th className="pb-2 text-right font-medium">Time</th>
      </tr>
    </thead>
    <tbody>
      {rows.map((row, i) => {
        const pct = total ? Math.round((row.duration / total) * 100) : 0
        const hue = row.color || ACCENT_SOLID[i % ACCENT_SOLID.length]
        return (
          <tr
            key={row.name}
            className="border-t border-border/50 transition-colors hover:bg-foreground/[0.03]"
          >
            <td className="py-2.5 font-mono text-[11px] text-muted-foreground">{i + 1}</td>
            <td className="py-2.5 pr-3">
              <span className="flex items-center gap-2">
                <span
                  className="h-2 w-2 shrink-0 rounded-full"
                  style={{ background: hue }}
                />
                <span className="truncate font-medium">{row.name}</span>
              </span>
            </td>
            <td className="hidden py-2.5 pr-3 text-right tabular text-muted-foreground sm:table-cell">
              {row.sessions}
            </td>
            <td className="py-2.5 pl-4">
              <span className="flex items-center gap-2.5">
                <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-foreground/[0.07]">
                  <span
                    className="block h-full origin-left rounded-full"
                    style={{
                      background: hue,
                      transform: `scaleX(${Math.max(0.015, pct / 100)})`,
                      transition: `transform 0.7s cubic-bezier(0.16,1,0.3,1) ${i * 0.05}s`,
                    }}
                  />
                </span>
                <span className="w-8 shrink-0 text-right tabular font-mono text-xs text-muted-foreground">
                  {pct}%
                </span>
              </span>
            </td>
            <td className="py-2.5 pl-3 text-right tabular font-mono">
              {formatDuration(row.duration)}
            </td>
          </tr>
        )
      })}
    </tbody>
  </table>
)
