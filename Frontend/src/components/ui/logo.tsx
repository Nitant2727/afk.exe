import { cn } from '../../lib/utils'

/**
 * AFK Monitor mark.
 *
 * Built rather than borrowed from an icon set: the previous logo was a stock
 * terminal glyph dropped in a blue square, which read as placeholder. This
 * encodes what the product measures — an activity trace rising across a window,
 * with a live cursor block at its head. Drawn on a 32-unit grid with
 * `currentColor`, so it inherits theme colour and scales without blurring.
 */
export const LogoMark = ({ className }: { className?: string }) => (
  <svg
    viewBox="0 0 32 32"
    fill="none"
    aria-hidden
    className={cn('h-full w-full', className)}
  >
    <defs>
      <linearGradient id="afk-trace" x1="4" y1="24" x2="28" y2="8" gradientUnits="userSpaceOnUse">
        <stop stopColor="currentColor" stopOpacity="0.55" />
        <stop offset="1" stopColor="currentColor" />
      </linearGradient>
    </defs>

    {/* Window frame — the editor being measured. */}
    <rect
      x="2.75"
      y="4.75"
      width="26.5"
      height="22.5"
      rx="5.25"
      stroke="currentColor"
      strokeOpacity="0.42"
      strokeWidth="1.5"
    />

    {/* Baseline the trace sits on. */}
    <path
      d="M7 22.5h18"
      stroke="currentColor"
      strokeOpacity="0.22"
      strokeWidth="1.5"
      strokeLinecap="round"
    />

    {/* Activity trace: idle, then a climb — the shape of a working session. */}
    <path
      d="M7 20.5c2.2 0 3-5.2 5.2-5.2 2.1 0 2.4 3.1 4.4 3.1 2.3 0 2.8-7.9 5.3-7.9"
      stroke="url(#afk-trace)"
      strokeWidth="2.25"
      strokeLinecap="round"
      strokeLinejoin="round"
    />

    {/* Cursor block at the head of the trace — the "live" tell. */}
    <rect x="23.4" y="8.1" width="3.4" height="3.4" rx="1" fill="currentColor" />
  </svg>
)

/**
 * Mark in its tile, as used in the sidebar and on the sign-in card.
 */
export const Logo = ({
  className,
  size = 'md',
}: {
  className?: string
  size?: 'sm' | 'md' | 'lg'
}) => {
  const box = { sm: 'h-8 w-8', md: 'h-9 w-9', lg: 'h-10 w-10' }[size]
  const glyph = { sm: 'h-[18px] w-[18px]', md: 'h-5 w-5', lg: 'h-[22px] w-[22px]' }[size]

  return (
    <span
      className={cn(
        'relative grid shrink-0 place-items-center rounded-xl',
        'bg-gradient-to-br from-primary via-primary to-primary/55',
        'text-primary-foreground shadow-lg shadow-primary/25',
        'ring-1 ring-inset ring-white/15',
        box,
        className
      )}
    >
      {/* Gloss along the top edge keeps the tile from reading flat. */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-1 top-0 h-px rounded-full bg-white/40"
      />
      <LogoMark className={glyph} />
    </span>
  )
}
