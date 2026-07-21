import { motion } from 'framer-motion'
import {
  Home,
  BarChart3,
  FileText,
  Settings,
  Calendar,
  Languages,
  FolderOpen,
  Terminal,
} from 'lucide-react'
import { cn } from '../../lib/utils'

interface SidebarProps {
  activeTab: string
  onTabChange: (tab: string) => void
  className?: string
}

const navigation = [
  { id: 'dashboard', name: 'Dashboard', icon: Home, description: 'Overview and metrics' },
  { id: 'sessions', name: 'Sessions', icon: FileText, description: 'Coding session history' },
  { id: 'analytics', name: 'Analytics', icon: BarChart3, description: 'Detailed statistics' },
  { id: 'projects', name: 'Projects', icon: FolderOpen, description: 'Project breakdown' },
  { id: 'languages', name: 'Languages', icon: Languages, description: 'Language statistics' },
  { id: 'timeline', name: 'Timeline', icon: Calendar, description: 'Daily activity' },
]

const Sidebar = ({ activeTab, onTabChange, className }: SidebarProps) => {
  const renderItem = (item: (typeof navigation)[number]) => {
    const isActive = activeTab === item.id
    return (
      <motion.button
        key={item.id}
        onClick={() => onTabChange(item.id)}
        aria-current={isActive ? 'page' : undefined}
        /*
         * No entry animation here on purpose. The sidebar is on screen at load,
         * so a staggered reveal buys almost nothing — and any fade-in that
         * fails to run (throttled tab, starved animation clock) leaves the
         * primary navigation invisible. Motion below is interaction-driven,
         * which can only ever be additive.
         */
        whileHover={{ x: 3 }}
        whileTap={{ scale: 0.985 }}
        className={cn(
          'group relative w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-left',
          'transition-colors duration-200',
          isActive
            ? 'text-foreground'
            : 'text-muted-foreground hover:text-foreground hover:bg-foreground/[0.04]'
        )}
      >
        {/* Shared pill slides between items rather than fading in place. */}
        {isActive && (
          <motion.span
            layoutId="nav-pill"
            className="absolute inset-0 rounded-xl bg-primary/12 ring-1 ring-primary/30"
            transition={{ type: 'spring', stiffness: 380, damping: 32 }}
          />
        )}
        {isActive && (
          <motion.span
            layoutId="nav-bar"
            className="absolute left-0 top-1/2 h-6 w-[3px] -translate-y-1/2 rounded-full bg-primary"
            transition={{ type: 'spring', stiffness: 380, damping: 32 }}
          />
        )}

        <span className="relative z-10 flex items-center gap-3 w-full min-w-0">
          <item.icon
            className={cn(
              'h-[18px] w-[18px] shrink-0 transition-colors',
              isActive ? 'text-primary' : 'text-current'
            )}
          />
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-medium">{item.name}</span>
            <span className="block truncate text-[11px] text-muted-foreground/80">
              {item.description}
            </span>
          </span>
        </span>
      </motion.button>
    )
  }

  return (
    <aside
      className={cn(
        'relative z-20 flex h-full w-64 shrink-0 flex-col glass glass-edge border-y-0 border-l-0',
        className
      )}
    >
      <div className="px-5 py-6">
        <div className="flex items-center gap-3">
          <div className="relative grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-primary to-primary/60 shadow-lg shadow-primary/25">
            <Terminal className="h-4 w-4 text-primary-foreground" />
          </div>
          <div className="min-w-0">
            <h2 className="truncate font-mono text-[15px] font-semibold tracking-tight">
              AFK Monitor
            </h2>
            <p className="truncate text-[11px] text-muted-foreground">Coding analytics</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 pb-4">
        {navigation.map(renderItem)}
      </nav>

      <div className="border-t border-border/70 p-3">
        <motion.button
          onClick={() => onTabChange('settings')}
          whileHover={{ x: 3 }}
          whileTap={{ scale: 0.985 }}
          aria-current={activeTab === 'settings' ? 'page' : undefined}
          className={cn(
            'relative flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition-colors duration-200',
            activeTab === 'settings'
              ? 'text-foreground'
              : 'text-muted-foreground hover:text-foreground hover:bg-foreground/[0.04]'
          )}
        >
          {activeTab === 'settings' && (
            <motion.span
              layoutId="nav-pill"
              className="absolute inset-0 rounded-xl bg-primary/12 ring-1 ring-primary/30"
              transition={{ type: 'spring', stiffness: 380, damping: 32 }}
            />
          )}
          <span className="relative z-10 flex items-center gap-3">
            <Settings className="h-[18px] w-[18px]" />
            Settings
          </span>
        </motion.button>
      </div>
    </aside>
  )
}

export default Sidebar
