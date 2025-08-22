import { motion } from 'framer-motion'
import { 
  Home, 
  BarChart3, 
  FileText, 
  Settings, 
  Calendar,
  Languages,
  FolderOpen,
  Monitor,
  Bug
} from 'lucide-react'
import { cn } from '../../lib/utils'

interface SidebarProps {
  activeTab: string
  onTabChange: (tab: string) => void
  className?: string
}

const Sidebar = ({ activeTab, onTabChange, className }: SidebarProps) => {
  const navigation = [
    {
      id: 'dashboard',
      name: 'Dashboard',
      icon: Home,
      description: 'Overview and metrics'
    },
    {
      id: 'sessions',
      name: 'Sessions',
      icon: FileText,
      description: 'Coding sessions history'
    },
    {
      id: 'analytics',
      name: 'Analytics',
      icon: BarChart3,
      description: 'Detailed statistics'
    },
    {
      id: 'projects',
      name: 'Projects',
      icon: FolderOpen,
      description: 'Project breakdown'
    },
    {
      id: 'languages',
      name: 'Languages',
      icon: Languages,
      description: 'Language statistics'
    },
    {
      id: 'timeline',
      name: 'Timeline',
      icon: Calendar,
      description: 'Daily activity'
    }
  ]

  return (
    <aside className={cn(
      "w-64 h-full bg-card border-r border-border flex flex-col",
      className
    )}>
      {/* Header */}
      <div className="p-6 border-b border-border">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-blue-500 to-indigo-500 flex items-center justify-center">
            <Monitor className="w-4 h-4 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-foreground">AFK Monitor</h2>
            <p className="text-xs text-muted-foreground">Coding Analytics</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {navigation.map((item) => {
          const isActive = activeTab === item.id
          
          return (
            <motion.button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={cn(
                "w-full flex items-center space-x-3 px-3 py-3 rounded-lg text-left transition-all duration-200 group relative",
                isActive 
                  ? "bg-primary text-primary-foreground shadow-md" 
                  : "text-muted-foreground hover:text-foreground hover:bg-accent"
              )}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {isActive && (
                <motion.div
                  layoutId="sidebar-active"
                  className="absolute inset-0 bg-primary rounded-lg"
                  transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                />
              )}
              
              <div className="relative z-10 flex items-center space-x-3 w-full">
                <item.icon className={cn(
                  "w-5 h-5 transition-colors",
                  isActive ? "text-primary-foreground" : "text-current"
                )} />
                <div className="flex-1 min-w-0">
                  <p className={cn(
                    "text-sm font-medium truncate",
                    isActive ? "text-primary-foreground" : "text-current"
                  )}>
                    {item.name}
                  </p>
                  <p className={cn(
                    "text-xs truncate",
                    isActive ? "text-primary-foreground/80" : "text-muted-foreground"
                  )}>
                    {item.description}
                  </p>
                </div>
              </div>
            </motion.button>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-border space-y-2">
        <motion.button
          onClick={() => onTabChange('debug')}
          className={cn(
            "w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors",
            activeTab === 'debug' 
              ? "bg-orange-500 text-white" 
              : "text-muted-foreground hover:text-foreground hover:bg-accent"
          )}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <Bug className="w-4 h-4" />
          <span className="text-sm font-medium">API Debug</span>
        </motion.button>
        
        <motion.button
          onClick={() => onTabChange('settings')}
          className={cn(
            "w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors",
            activeTab === 'settings' 
              ? "bg-primary text-primary-foreground" 
              : "text-muted-foreground hover:text-foreground hover:bg-accent"
          )}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <Settings className="w-4 h-4" />
          <span className="text-sm font-medium">Settings</span>
        </motion.button>
      </div>
    </aside>
  )
}

export default Sidebar 