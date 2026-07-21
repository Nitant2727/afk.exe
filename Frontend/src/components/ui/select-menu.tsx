import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './select'
import { cn } from '../../lib/utils'

export interface SelectOption {
  value: string
  label: string
}

interface SelectMenuProps {
  value: string
  onChange: (value: string) => void
  options: SelectOption[]
  placeholder: string
  /** Label shown for the empty value, e.g. "All projects". Omit to hide it. */
  emptyLabel?: string
  ariaLabel: string
  className?: string
}

/**
 * Compact dropdown for the toolbars.
 *
 * Wraps Radix rather than a native `<select>`: browsers render the native
 * option list with OS chrome that CSS cannot reach, so on a dark theme it came
 * out as a white panel with unreadable grey text. Radix renders the list into a
 * portal we own, so it inherits the theme and keeps keyboard nav and
 * click-outside behaviour.
 *
 * Radix treats "" as "no value", which would clear the trigger label, so the
 * empty choice is carried under a sentinel instead.
 */
const ALL = '__all__'

export const SelectMenu = ({
  value,
  onChange,
  options,
  placeholder,
  emptyLabel,
  ariaLabel,
  className,
}: SelectMenuProps) => (
  <Select
    value={value === '' ? ALL : value}
    onValueChange={(v) => onChange(v === ALL ? '' : v)}
  >
    <SelectTrigger
      aria-label={ariaLabel}
      className={cn(
        'h-8 w-auto gap-1.5 rounded-lg border-border/80 bg-foreground/[0.03] px-2.5 text-xs font-medium',
        'transition-colors hover:bg-foreground/[0.06] focus:ring-1 focus:ring-ring focus:ring-offset-0',
        '[&>svg]:h-3.5 [&>svg]:w-3.5',
        className
      )}
    >
      <SelectValue placeholder={placeholder} />
    </SelectTrigger>

    <SelectContent
      className="min-w-[10rem] rounded-lg border-border/80 bg-popover/95 backdrop-blur"
      position="popper"
      sideOffset={6}
    >
      {emptyLabel && (
        <SelectItem value={ALL} className="text-xs">
          {emptyLabel}
        </SelectItem>
      )}
      {options.map((o) => (
        <SelectItem key={o.value} value={o.value} className="text-xs">
          {o.label}
        </SelectItem>
      ))}
    </SelectContent>
  </Select>
)
