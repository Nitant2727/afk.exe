/**
 * Shared surfaces for every analytics page.
 *
 * These live here rather than in Dashboard so Projects, Languages, Sessions and
 * Timeline all inherit the same glass treatment, spacing and motion — the inner
 * pages previously drifted into a flatter, unrelated look.
 */
import type { ReactNode } from 'react'
import { Layers, type LucideIcon } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './card'
import { TiltCard, Spotlight, CountUp } from './motion'
import { cn } from '../../lib/utils'

/** Accent washes, indexed so callers can just pass a position. */
export const ACCENTS = [
  'hsl(var(--primary) / 0.22)',
  'hsl(38 92% 55% / 0.20)',
  'hsl(152 62% 48% / 0.20)',
  'hsl(280 65% 65% / 0.20)',
  'hsl(190 80% 55% / 0.20)',
  'hsl(340 75% 60% / 0.20)',
]

/**
 * Solid versions of the same hues, for bars and dots.
 *
 * Hex on purpose: these get suffixed with hex alpha (`${hue}bb`) to build
 * gradients, and the backend's own language colours are hex too. An `hsl()`
 * string would produce `hsl(...)bb` — invalid CSS that fails silently and
 * renders the meter empty.
 */
export const ACCENT_SOLID = [
  '#3b82f6',
  '#f59e0b',
  '#22c55e',
  '#a855f7',
  '#06b6d4',
  '#ec4899',
]

interface StatCardProps {
  label: string
  value: string | number
  hint?: string
  icon: LucideIcon
  accent?: string
  /** Renders an animated counter instead of a static value. */
  count?: { to: number; format?: (n: number) => string }
  className?: string
}

export const StatCard = ({
  label,
  value,
  hint,
  icon: Icon,
  accent = ACCENTS[0],
  count,
  className,
}: StatCardProps) => (
  <TiltCard className={cn('h-full', className)}>
    <Card className="group relative h-full overflow-hidden rounded-2xl glass glow-ring-hover sheen">
      <Spotlight />
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

        <p className="mt-3 truncate font-mono text-3xl font-semibold leading-none tracking-tight">
          {count ? <CountUp value={count.to} format={count.format} /> : value}
        </p>

        {hint && <p className="mt-2 truncate text-xs text-muted-foreground">{hint}</p>}
      </CardContent>
    </Card>
  </TiltCard>
)

export const PanelCard = ({
  title,
  description,
  action,
  children,
  className,
}: {
  title: string
  description?: string
  action?: ReactNode
  children: ReactNode
  className?: string
}) => (
  <Card className={cn('relative overflow-hidden rounded-2xl glass glow-ring-hover', className)}>
    <Spotlight size={520} />
    <CardHeader className="relative z-10 flex-row items-start justify-between gap-4 space-y-0 pb-3">
      <div className="min-w-0">
        <CardTitle className="text-base font-semibold tracking-tight">{title}</CardTitle>
        {description && <CardDescription className="text-xs">{description}</CardDescription>}
      </div>
      {action}
    </CardHeader>
    <CardContent className="relative z-10">{children}</CardContent>
  </Card>
)

export const EmptyState = ({
  message,
  hint = 'Start coding with the extension installed, or widen the time range.',
}: {
  message: string
  hint?: string
}) => (
  <div className="grid min-h-[12rem] place-items-center text-center">
    <div>
      <Layers className="mx-auto h-8 w-8 text-muted-foreground/40" />
      <p className="mt-2 text-sm text-muted-foreground">{message}</p>
      <p className="mt-1 text-xs text-muted-foreground/70">{hint}</p>
    </div>
  </div>
)

interface RankRowProps {
  rank: number
  name: string
  subtitle: string
  value: string
  percent: number
  color?: string
  /** Delay the bar fill so a list animates in sequence. */
  index?: number
}

/**
 * A ranked row with a meter — used for project and language breakdowns.
 *
 * The meter is a segmented track rather than a plain rail: discrete ticks read
 * as an instrument readout and give the eye something to measure against, which
 * a single flat bar does not. The lit portion is one gradient element clipped by
 * the track, scaled on the X axis — `transform` composites on the GPU, whereas
 * animating `width` would force layout on every frame.
 */
export const RankRow = ({
  rank,
  name,
  subtitle,
  value,
  percent,
  color,
  index = 0,
}: RankRowProps) => {
  const hue = color ?? ACCENT_SOLID[(rank - 1) % ACCENT_SOLID.length]
  const isLead = rank === 1

  return (
    <li className="group relative overflow-hidden rounded-xl px-3 py-3.5 transition-colors duration-300 hover:bg-foreground/[0.035]">
      {/* Colour bleeds in from the left on hover, tinted to the row's own hue. */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-y-0 left-0 w-1/3 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{ background: `linear-gradient(90deg, ${hue}14, transparent)` }}
      />

      <div className="relative flex items-center gap-3">
        {/* Rank chip — filled for the leader, outlined for the rest. */}
        <span
          className={cn(
            'grid h-7 w-7 shrink-0 place-items-center rounded-lg font-mono text-[11px] font-semibold transition-transform duration-300 group-hover:scale-110',
            isLead ? 'text-background' : 'text-muted-foreground ring-1 ring-inset ring-border/80'
          )}
          style={isLead ? { background: hue, boxShadow: `0 0 18px -4px ${hue}` } : undefined}
        >
          {String(rank).padStart(2, '0')}
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex items-baseline justify-between gap-3">
            <p className="truncate text-sm font-medium">{name}</p>
            <p className="shrink-0 tabular font-mono text-sm font-semibold">{value}</p>
          </div>

          <div className="mt-1.5 flex items-center gap-3">
            {/* Segmented meter. */}
            <div className="relative h-2 flex-1 overflow-hidden rounded-full bg-foreground/[0.06] ring-1 ring-inset ring-border/50">
              <div
                className="h-full origin-left rounded-full"
                style={{
                  background: `linear-gradient(90deg, ${hue}bb, ${hue})`,
                  boxShadow: `0 0 14px -2px ${hue}`,
                  transform: `scaleX(${Math.max(0.012, percent / 100)})`,
                  transition: `transform 0.85s cubic-bezier(0.16,1,0.3,1) ${index * 0.07}s`,
                }}
              />
              {/*
                Tick marks sit above the fill so the meter reads as a scale.
                Kept sparse and faint — dense, opaque ticks eat the fill and
                make a full bar look empty.
              */}
              <div
                aria-hidden
                className="pointer-events-none absolute inset-0"
                style={{
                  backgroundImage:
                    'repeating-linear-gradient(90deg, transparent 0 17px, hsl(var(--background)/0.28) 17px 18px)',
                }}
              />
            </div>

            <p className="w-9 shrink-0 text-right tabular font-mono text-xs text-muted-foreground">
              {percent}%
            </p>
          </div>

          <p className="mt-1 truncate text-[11px] text-muted-foreground/80">{subtitle}</p>
        </div>
      </div>
    </li>
  )
}
