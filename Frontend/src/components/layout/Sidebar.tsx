import { useState } from 'react'
import {
  LayoutGrid,
  BarChart3,
  FileText,
  Settings,
  CalendarDays,
  Languages,
  FolderOpen,
  LogOut,
} from 'lucide-react'
import { LogoMark } from '../ui/logo'
import { useAuthStore } from '../../store/authStore'
import { cn } from '../../lib/utils'

interface SidebarProps {
  activeTab: string
  onTabChange: (tab: string) => void
  className?: string
}

const navigation = [
  { id: 'dashboard', name: 'Dashboard', icon: LayoutGrid },
  { id: 'sessions', name: 'Sessions', icon: FileText },
  { id: 'analytics', name: 'Analytics', icon: BarChart3 },
  { id: 'projects', name: 'Projects', icon: FolderOpen },
  { id: 'languages', name: 'Languages', icon: Languages },
  { id: 'timeline', name: 'Timeline', icon: CalendarDays },
]

/**
 * Icon rail.
 *
 * Deliberately icon-only: descriptive subtitles under every nav entry ate
 * horizontal space and read as filler. Labels appear on hover instead, which is
 * what the density of this layout wants.
 */
const Sidebar = ({ activeTab, onTabChange, className }: SidebarProps) => {
  const { user, logout } = useAuthStore()
  const [hovered, setHovered] = useState<string | null>(null)

  const item = (id: string, name: string, Icon: typeof LayoutGrid, onClick: () => void) => {
    const isActive = activeTab === id
    return (
      <div
        key={id}
        className="relative"
        onMouseEnter={() => setHovered(id)}
        onMouseLeave={() => setHovered(null)}
      >
        <button
          onClick={onClick}
          aria-label={name}
          aria-current={isActive ? 'page' : undefined}
          className={cn(
            'grid h-11 w-11 place-items-center rounded-xl transition-colors duration-200',
            isActive
              ? 'bg-primary text-primary-foreground'
              : 'text-muted-foreground hover:bg-foreground/[0.06] hover:text-foreground'
          )}
        >
          <Icon className="h-[18px] w-[18px]" />
        </button>

        {/* Label on hover — keeps the rail narrow without hiding meaning. */}
        {hovered === id && (
          <span
            role="tooltip"
            className="pointer-events-none absolute left-full top-1/2 z-50 ml-2 -translate-y-1/2 whitespace-nowrap rounded-lg border border-border bg-popover px-2.5 py-1.5 text-xs font-medium text-popover-foreground shadow-xl"
          >
            {name}
          </span>
        )}
      </div>
    )
  }

  return (
    <aside
      className={cn(
        'flex w-[68px] shrink-0 flex-col items-center gap-1 border-r border-border/70 bg-surface/40 py-4',
        className
      )}
    >
      <div className="mb-4 grid h-10 w-10 place-items-center rounded-xl bg-primary text-primary-foreground">
        <LogoMark className="h-5 w-5" />
      </div>

      <nav className="flex flex-col items-center gap-1">
        {navigation.map((n) => item(n.id, n.name, n.icon, () => onTabChange(n.id)))}
      </nav>

      <div className="mt-auto flex flex-col items-center gap-1">
        {item('settings', 'Settings', Settings, () => onTabChange('settings'))}

        {user && (
          <div
            className="relative"
            onMouseEnter={() => setHovered('user')}
            onMouseLeave={() => setHovered(null)}
          >
            <button
              onClick={logout}
              aria-label={`Sign out of ${user.username}`}
              className="group relative mt-1 grid h-9 w-9 place-items-center overflow-hidden rounded-full ring-1 ring-border transition-colors hover:ring-destructive/60"
            >
              {user.avatar_url ? (
                <img src={user.avatar_url} alt="" className="h-full w-full object-cover" />
              ) : (
                <span className="text-[11px] font-medium text-muted-foreground">
                  {(user.username || '?').slice(0, 2).toUpperCase()}
                </span>
              )}
              <span className="absolute inset-0 grid place-items-center bg-destructive/85 opacity-0 transition-opacity group-hover:opacity-100">
                <LogOut className="h-3.5 w-3.5 text-white" />
              </span>
            </button>

            {hovered === 'user' && (
              <span
                role="tooltip"
                className="pointer-events-none absolute left-full top-1/2 z-50 ml-2 -translate-y-1/2 whitespace-nowrap rounded-lg border border-border bg-popover px-2.5 py-1.5 text-xs text-popover-foreground shadow-xl"
              >
                Sign out · {user.username}
              </span>
            )}
          </div>
        )}
      </div>
    </aside>
  )
}

export default Sidebar
