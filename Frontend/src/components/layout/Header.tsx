import { useState } from 'react'
import { motion } from 'framer-motion'
import { 
  Bell, 
  Search, 
  Moon, 
  Sun, 
  LogOut, 
  User,
  Settings,
  RefreshCw,
  Wifi,
  WifiOff
} from 'lucide-react'
import { Button } from '../ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select'
import { useAuthStore } from '../../store/authStore'
import type { TimeFilter } from '../../types/api'
import { cn } from '../../lib/utils'

interface HeaderProps {
  timeFilter: TimeFilter
  onTimeFilterChange: (filter: TimeFilter) => void
  className?: string
}

const Header = ({ timeFilter, onTimeFilterChange, className }: HeaderProps) => {
  const [isDark, setIsDark] = useState(false)
  const [isConnected] = useState(true)
  const { user, logout } = useAuthStore()

  const timeFilterOptions = [
    { value: 'today', label: 'Today' },
    { value: 'yesterday', label: 'Yesterday' },
    { value: 'this_week', label: 'This Week' },
    { value: 'last_week', label: 'Last Week' },
    { value: 'this_month', label: 'This Month' },
    { value: 'last_month', label: 'Last Month' },
    { value: 'last_7_days', label: 'Last 7 Days' },
    { value: 'last_30_days', label: 'Last 30 Days' },
  ]

  const handleThemeToggle = () => {
    setIsDark(!isDark)
    document.documentElement.classList.toggle('dark')
  }

  const handleSync = () => {
    // Trigger manual sync
    console.log('Manual sync triggered')
  }

  const handleLogout = () => {
    logout()
  }

  const getUserInitials = () => {
    if (!user?.username) return 'U'
    return user.username.slice(0, 2).toUpperCase()
  }

  return (
    <header className={cn(
      "h-16 bg-background border-b border-border flex items-center justify-between px-6",
      className
    )}>
      {/* Left side - Search and Filters */}
      <div className="flex items-center space-x-4 flex-1">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <input
            type="text"
            placeholder="Search sessions, projects..."
            className="w-full pl-10 pr-4 py-2 bg-accent/50 border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
          />
        </div>

        <Select value={timeFilter} onValueChange={(value) => onTimeFilterChange(value as TimeFilter)}>
          <SelectTrigger className="w-40">
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
      </div>

      {/* Right side - Actions and User */}
      <div className="flex items-center space-x-2">
        {/* Extension Status */}
        <motion.div
          className={cn(
            "flex items-center space-x-2 px-3 py-1.5 rounded-full text-xs font-medium",
            isConnected 
              ? "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400"
              : "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400"
          )}
          animate={{ scale: isConnected ? 1 : [1, 1.05, 1] }}
          transition={{ duration: 0.3, repeat: isConnected ? 0 : Infinity, repeatDelay: 2 }}
        >
          {isConnected ? (
            <Wifi className="w-3 h-3" />
          ) : (
            <WifiOff className="w-3 h-3" />
          )}
          <span>{isConnected ? 'Connected' : 'Disconnected'}</span>
        </motion.div>

        {/* Sync Button */}
        <Button
          variant="ghost"
          size="icon"
          onClick={handleSync}
          className="relative"
        >
          <RefreshCw className="w-4 h-4" />
        </Button>

        {/* Theme Toggle */}
        <Button
          variant="ghost"
          size="icon"
          onClick={handleThemeToggle}
        >
          {isDark ? (
            <Sun className="w-4 h-4" />
          ) : (
            <Moon className="w-4 h-4" />
          )}
        </Button>

        {/* Notifications */}
        <Button
          variant="ghost"
          size="icon"
          className="relative"
        >
          <Bell className="w-4 h-4" />
          <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full"></span>
        </Button>

        {/* User Menu */}
        <div className="flex items-center space-x-3 pl-3 border-l border-border">
          <div className="text-right">
            <p className="text-sm font-medium text-foreground">{user?.username || 'User'}</p>
            <p className="text-xs text-muted-foreground">{user?.email || 'user@example.com'}</p>
          </div>
          
          <div className="relative group">
            <Avatar className="w-8 h-8 cursor-pointer">
              <AvatarImage src={user?.avatar_url} alt={user?.username} />
              <AvatarFallback className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white text-xs">
                {getUserInitials()}
              </AvatarFallback>
            </Avatar>
            
            {/* Dropdown Menu */}
            <div className="absolute right-0 top-full mt-2 w-48 bg-popover border border-border rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
              <div className="p-2 space-y-1">
                <button className="w-full flex items-center space-x-2 px-2 py-1.5 text-sm text-foreground hover:bg-accent rounded-md">
                  <User className="w-4 h-4" />
                  <span>Profile</span>
                </button>
                <button className="w-full flex items-center space-x-2 px-2 py-1.5 text-sm text-foreground hover:bg-accent rounded-md">
                  <Settings className="w-4 h-4" />
                  <span>Settings</span>
                </button>
                <hr className="my-1 border-border" />
                <button 
                  onClick={handleLogout}
                  className="w-full flex items-center space-x-2 px-2 py-1.5 text-sm text-destructive hover:bg-destructive/10 rounded-md"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign out</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}

export default Header 