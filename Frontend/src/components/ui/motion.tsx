/**
 * Shared motion primitives.
 *
 * Every component here checks `useReducedMotion()` and degrades to a static
 * render rather than a faster animation — with this much choreography, "less
 * motion" isn't good enough for anyone who actually needs it off.
 */
import {
  Children,
  cloneElement,
  isValidElement,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from 'react'
import {
  motion,
  useMotionValue,
  useSpring,
  useReducedMotion,
  useTransform,
} from 'framer-motion'
import { cn } from '../../lib/utils'

const EASE = [0.16, 1, 0.3, 1] as const

/**
 * Reports whether an element is within the viewport.
 *
 * Deliberately geometry-based (rect + scroll listener) rather than
 * IntersectionObserver. IO callbacks get throttled or dropped in background and
 * low-power contexts, and because these components gate *visibility*, a missed
 * callback doesn't degrade an animation — it leaves the content permanently
 * blank. A rect check is cheap, synchronous, and always correct.
 */
function useOnScreen(ref: React.RefObject<HTMLElement | null>, rootMargin = 80) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    let done = false
    const check = () => {
      if (done) return
      const r = el.getBoundingClientRect()
      const vh = window.innerHeight || document.documentElement.clientHeight
      if (r.top < vh + rootMargin && r.bottom > -rootMargin) {
        done = true
        setVisible(true)
        window.removeEventListener('scroll', check, true)
        window.removeEventListener('resize', check)
      }
    }

    check()
    window.addEventListener('scroll', check, { passive: true, capture: true })
    window.addEventListener('resize', check)
    return () => {
      window.removeEventListener('scroll', check, true)
      window.removeEventListener('resize', check)
    }
  }, [ref, rootMargin])

  return visible
}

/* ------------------------------------------------------------------ reveal */

type Direction = 'up' | 'down' | 'left' | 'right' | 'none'

const offsets: Record<Direction, { x: number; y: number }> = {
  up: { x: 0, y: 28 },
  down: { x: 0, y: -28 },
  left: { x: 28, y: 0 },
  right: { x: -28, y: 0 },
  none: { x: 0, y: 0 },
}

interface RevealProps {
  children: ReactNode
  className?: string
  direction?: Direction
  delay?: number
  duration?: number
}

/**
 * Fades and slides content in as it enters the viewport.
 *
 * Deliberately CSS-transition driven rather than JS/rAF driven: a JS animation
 * that never ticks (background tab, throttled device, starved rAF) would leave
 * the content stuck at opacity 0 — invisible, not merely unanimated. A CSS
 * transition always settles on its final computed style, so worst case the
 * content simply appears without easing.
 */
export const Reveal = ({
  children,
  className,
  direction = 'up',
  delay = 0,
  duration = 0.55,
}: RevealProps) => {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useOnScreen(ref)
  const reduced = useReducedMotion()

  if (reduced) {
    return (
      <div ref={ref} className={className}>
        {children}
      </div>
    )
  }

  const { x, y } = offsets[direction]

  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: inView ? 1 : 0,
        transform: inView ? 'translate3d(0,0,0)' : `translate3d(${x}px, ${y}px, 0)`,
        transition: `opacity ${duration}s cubic-bezier(0.16,1,0.3,1) ${delay}s, transform ${duration}s cubic-bezier(0.16,1,0.3,1) ${delay}s`,
        willChange: inView ? undefined : 'opacity, transform',
      }}
    >
      {children}
    </div>
  )
}

/* ----------------------------------------------------------------- stagger */

interface StaggerProps {
  children: ReactNode
  className?: string
}

/**
 * Wraps a grid/list so children animate in sequence rather than together.
 *
 * The stagger delay is handed to each child through context and applied as a
 * CSS transition-delay, for the same robustness reason as `Reveal`.
 */
export const Stagger = ({ children, className }: StaggerProps) => {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useOnScreen(ref)
  const reduced = useReducedMotion()

  if (reduced) {
    return (
      <div ref={ref} className={className}>
        {children}
      </div>
    )
  }

  // Index children so each can offset its own transition.
  const items = Children.toArray(children).map((child, i) =>
    isValidElement(child)
      ? cloneElement(child as React.ReactElement<StaggerItemProps>, {
          __index: i,
          __show: inView,
        })
      : child
  )

  return (
    <div ref={ref} className={className}>
      {items}
    </div>
  )
}

interface StaggerItemProps extends StaggerProps {
  /** Injected by <Stagger>; not part of the public API. */
  __index?: number
  __show?: boolean
}

export const StaggerItem = ({
  children,
  className,
  __index = 0,
  __show = true,
}: StaggerItemProps) => {
  const reduced = useReducedMotion()
  if (reduced) return <div className={className}>{children}</div>

  return (
    <div
      className={className}
      style={{
        opacity: __show ? 1 : 0,
        transform: __show ? 'translate3d(0,0,0)' : 'translate3d(0,24px,0)',
        transition: `opacity 0.5s cubic-bezier(0.16,1,0.3,1) ${__index * 0.06}s, transform 0.5s cubic-bezier(0.16,1,0.3,1) ${__index * 0.06}s`,
      }}
    >
      {children}
    </div>
  )
}

/* ---------------------------------------------------------------- count up */

interface CountUpProps {
  value: number
  /** Render the raw number as a display string (units, durations, etc). */
  format?: (n: number) => string
  duration?: number
  className?: string
}

/**
 * Counts to `value` once the element is on screen. Uses a spring rather than a
 * linear tween so large numbers decelerate instead of stopping dead.
 */
export const CountUp = ({
  value,
  format = (n) => Math.round(n).toLocaleString(),
  duration = 1.1,
  className,
}: CountUpProps) => {
  const ref = useRef<HTMLSpanElement>(null)
  const inView = useOnScreen(ref)
  const reduced = useReducedMotion()
  const [display, setDisplay] = useState(() => format(reduced ? value : 0))

  useEffect(() => {
    if (reduced) {
      setDisplay(format(value))
      return
    }
    if (!inView) {
      setDisplay(format(value))
      return
    }

    let frame = 0
    const start = performance.now()
    const ms = duration * 1000

    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / ms)
      // easeOutExpo — fast start, long settle.
      const eased = t === 1 ? 1 : 1 - Math.pow(2, -10 * t)
      setDisplay(format(value * eased))
      if (t < 1) frame = requestAnimationFrame(tick)
    }

    frame = requestAnimationFrame(tick)

    /*
     * Safety net. rAF is starved in background tabs, on throttled/low-power
     * devices, and in some headless renderers — and a counter that silently
     * stops partway reports a *wrong number*, which is far worse than one that
     * doesn't animate. This guarantees the true value is displayed regardless.
     */
    const settle = setTimeout(() => setDisplay(format(value)), ms + 150)

    return () => {
      cancelAnimationFrame(frame)
      clearTimeout(settle)
    }
    // `format` is intentionally excluded: callers pass inline lambdas.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inView, value, duration, reduced])

  return (
    <span ref={ref} className={cn('tabular', className)}>
      {display}
    </span>
  )
}

/* --------------------------------------------------------------- tilt card */

interface TiltProps {
  children: ReactNode
  className?: string
  /** Maximum rotation in degrees. */
  max?: number
  style?: CSSProperties
}

/** Card that tips toward the cursor and lifts slightly. */
export const TiltCard = ({ children, className, max = 6, style }: TiltProps) => {
  const ref = useRef<HTMLDivElement>(null)
  const reduced = useReducedMotion()

  const px = useMotionValue(0.5)
  const py = useMotionValue(0.5)

  const springCfg = { stiffness: 180, damping: 18, mass: 0.4 }
  const rotateX = useSpring(useTransform(py, [0, 1], [max, -max]), springCfg)
  const rotateY = useSpring(useTransform(px, [0, 1], [-max, max]), springCfg)

  if (reduced) {
    return (
      <div className={className} style={style}>
        {children}
      </div>
    )
  }

  return (
    <motion.div
      ref={ref}
      className={className}
      style={{ ...style, rotateX, rotateY, transformPerspective: 900 }}
      onPointerMove={(e) => {
        const el = ref.current
        if (!el) return
        const r = el.getBoundingClientRect()
        px.set((e.clientX - r.left) / r.width)
        py.set((e.clientY - r.top) / r.height)
      }}
      onPointerLeave={() => {
        px.set(0.5)
        py.set(0.5)
      }}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.26, ease: EASE }}
    >
      {children}
    </motion.div>
  )
}

/* --------------------------------------------------------------- spotlight */

/**
 * Radial highlight that tracks the cursor across a surface. Purely decorative,
 * so it is skipped entirely under reduced motion.
 */
export const Spotlight = ({
  className,
  size = 380,
}: {
  className?: string
  size?: number
}) => {
  const ref = useRef<HTMLDivElement>(null)
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null)
  const reduced = useReducedMotion()

  useEffect(() => {
    if (reduced) return
    const el = ref.current?.parentElement
    if (!el) return

    const move = (e: PointerEvent) => {
      const r = el.getBoundingClientRect()
      setPos({ x: e.clientX - r.left, y: e.clientY - r.top })
    }
    const leave = () => setPos(null)

    el.addEventListener('pointermove', move)
    el.addEventListener('pointerleave', leave)
    return () => {
      el.removeEventListener('pointermove', move)
      el.removeEventListener('pointerleave', leave)
    }
  }, [reduced])

  if (reduced) return null

  return (
    <div
      ref={ref}
      aria-hidden
      className={cn(
        'pointer-events-none absolute inset-0 transition-opacity duration-300',
        pos ? 'opacity-100' : 'opacity-0',
        className
      )}
      style={
        pos
          ? {
              background: `radial-gradient(${size}px circle at ${pos.x}px ${pos.y}px, hsl(var(--glow) / 0.12), transparent 70%)`,
            }
          : undefined
      }
    />
  )
}

/* -------------------------------------------------------------- background */

/** Slow-drifting colour fields behind the app shell. */
export const AmbientBackground = () => {
  const reduced = useReducedMotion()

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div className="absolute inset-0 grid-bg opacity-70" />
      <div
        className={cn(
          'absolute -top-40 -left-32 h-[34rem] w-[34rem] rounded-full blur-[120px]',
          !reduced && 'animate-drift'
        )}
        style={{ background: 'radial-gradient(circle, hsl(var(--primary) / 0.20), transparent 65%)' }}
      />
      <div
        className={cn(
          'absolute -bottom-52 right-[-10rem] h-[38rem] w-[38rem] rounded-full blur-[130px]',
          !reduced && 'animate-drift-slow'
        )}
        style={{ background: 'radial-gradient(circle, hsl(var(--accent) / 0.14), transparent 65%)' }}
      />
    </div>
  )
}

/* ---------------------------------------------------------------- magnetic */

/** Element that leans toward the cursor — used for primary actions. */
export const Magnetic = ({
  children,
  className,
  strength = 0.35,
}: {
  children: ReactNode
  className?: string
  strength?: number
}) => {
  const ref = useRef<HTMLDivElement>(null)
  const reduced = useReducedMotion()
  const x = useSpring(useMotionValue(0), { stiffness: 220, damping: 16 })
  const y = useSpring(useMotionValue(0), { stiffness: 220, damping: 16 })

  if (reduced) return <div className={className}>{children}</div>

  return (
    <motion.div
      ref={ref}
      className={className}
      style={{ x, y }}
      onPointerMove={(e) => {
        const el = ref.current
        if (!el) return
        const r = el.getBoundingClientRect()
        x.set((e.clientX - (r.left + r.width / 2)) * strength)
        y.set((e.clientY - (r.top + r.height / 2)) * strength)
      }}
      onPointerLeave={() => {
        x.set(0)
        y.set(0)
      }}
    >
      {children}
    </motion.div>
  )
}
