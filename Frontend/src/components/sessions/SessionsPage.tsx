import { useState, useEffect, useMemo } from 'react'
import { motion } from 'framer-motion'
import { 
  Calendar, 
  Clock, 
  Code, 
  FileText, 
  Filter,
  Search,
  ChevronDown,
  ExternalLink
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { formatDuration, formatDate } from '../../lib/utils'
import { apiClient } from '../../lib/api'
import type { FileSession, TimeFilter } from '../../types/api'

interface SessionsPageProps {
  timeFilter: TimeFilter
}

const SessionsPage = ({ timeFilter }: SessionsPageProps) => {
  const [sessions, setSessions] = useState<FileSession[]>([])
  const [totalSessions, setTotalSessions] = useState(0)
  const [projects, setProjects] = useState<string[]>([])
  const [languages, setLanguages] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedProject, setSelectedProject] = useState<string>('all')
  const [selectedLanguage, setSelectedLanguage] = useState<string>('all')
  const [sortBy, setSortBy] = useState<'date' | 'duration' | 'name'>('date')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(20)

  const fetchData = async () => {
    try {
      setLoading(true)
      setError(null)

      // Build query parameters
      const params: any = {
        limit: 1000, // Get more to handle client-side filtering
        offset: 0
      }

      // Convert timeFilter to date range for sessions endpoint
      const now = new Date()
      let fromDate: Date | null = null
      
      switch (timeFilter) {
        case 'today':
          fromDate = new Date(now.getFullYear(), now.getMonth(), now.getDate())
          break
        case 'yesterday':
          fromDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1)
          params.to = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString()
          break
        case 'this_week':
          const startOfWeek = new Date(now)
          startOfWeek.setDate(now.getDate() - now.getDay())
          fromDate = startOfWeek
          break
        case 'last_7_days':
          fromDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
          break
        case 'this_month':
          fromDate = new Date(now.getFullYear(), now.getMonth(), 1)
          break
        case 'last_30_days':
          fromDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
          break
      }
      
      if (fromDate) {
        params.from = fromDate.toISOString()
      }

      // Add project and language filters if selected
      if (selectedProject !== 'all') {
        params.projectName = selectedProject
      }
      if (selectedLanguage !== 'all') {
        params.language = selectedLanguage
      }

      // Fetch sessions and filter data
      const [sessionsResponse, projectsResponse, languagesResponse] = await Promise.all([
        apiClient.getSessions(params),
        apiClient.getUniqueProjects(),
        apiClient.getUniqueLanguages()
      ])

      if (sessionsResponse.success && sessionsResponse.data?.sessions && Array.isArray(sessionsResponse.data.sessions)) {
        setSessions(sessionsResponse.data.sessions)
        setTotalSessions(sessionsResponse.data.total || 0)
      } else {
        setSessions([])
        setTotalSessions(0)
      }

      if (projectsResponse.success && projectsResponse.data && Array.isArray(projectsResponse.data)) {
        setProjects(projectsResponse.data)
      } else {
        setProjects([])
      }

      if (languagesResponse.success && languagesResponse.data && Array.isArray(languagesResponse.data)) {
        setLanguages(languagesResponse.data)
      } else {
        setLanguages([])
      }

    } catch (err) {
      console.error('Failed to fetch sessions:', err)
      setError('Failed to load sessions data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [timeFilter, selectedProject, selectedLanguage])

  // Filter and sort sessions
  const filteredSessions = useMemo(() => {
    let filtered = sessions.filter(session => {
      const matchesSearch = searchTerm === '' || 
        session.fileName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        session.projectName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        session.language.toLowerCase().includes(searchTerm.toLowerCase())
      
      return matchesSearch
    })

    // Sort sessions
    filtered.sort((a, b) => {
      let comparison = 0
      
      switch (sortBy) {
        case 'date':
          comparison = new Date(a.sessionStartTime).getTime() - new Date(b.sessionStartTime).getTime()
          break
        case 'duration':
          comparison = a.totalDuration - b.totalDuration
          break
        case 'name':
          comparison = a.fileName.localeCompare(b.fileName)
          break
      }
      
      return sortOrder === 'desc' ? -comparison : comparison
    })

    return filtered
  }, [sessions, searchTerm, sortBy, sortOrder])

  // Paginate sessions
  const paginatedSessions = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage
    return filteredSessions.slice(startIndex, startIndex + itemsPerPage)
  }, [filteredSessions, currentPage, itemsPerPage])

  const totalPages = Math.ceil(filteredSessions.length / itemsPerPage)

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  }

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="ml-3 text-muted-foreground">Loading sessions...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6 flex items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle className="text-red-600">Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">{error}</p>
            <Button onClick={fetchData}>Retry</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <motion.div
      className="p-6 space-y-6"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Header */}
      <motion.div variants={itemVariants}>
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Coding Sessions</h1>
            <p className="text-muted-foreground">
              {totalSessions} total sessions • {filteredSessions.length} filtered
            </p>
          </div>
        </div>
      </motion.div>

      {/* Filters */}
      <motion.div variants={itemVariants}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Filter className="w-5 h-5" />
              <span>Filters</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Search */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Search</label>
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Search files, projects..."
                    className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>

              {/* Project Filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Project</label>
                <Select value={selectedProject} onValueChange={setSelectedProject}>
                  <SelectTrigger>
                    <SelectValue placeholder="All projects" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All projects</SelectItem>
                    {projects.map(project => (
                      <SelectItem key={project} value={project}>{project}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Language Filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Language</label>
                <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
                  <SelectTrigger>
                    <SelectValue placeholder="All languages" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All languages</SelectItem>
                    {languages.map(language => (
                      <SelectItem key={language} value={language}>{language}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Sort */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Sort by</label>
                <div className="flex space-x-2">
                  <Select value={sortBy} onValueChange={(value: 'date' | 'duration' | 'name') => setSortBy(value)}>
                    <SelectTrigger className="flex-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="date">Date</SelectItem>
                      <SelectItem value="duration">Duration</SelectItem>
                      <SelectItem value="name">Name</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                    className="px-3"
                  >
                    {sortOrder === 'desc' ? '↓' : '↑'}
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Sessions List */}
      <motion.div variants={itemVariants}>
        <Card>
          <CardHeader>
            <CardTitle>Session History</CardTitle>
            <CardDescription>
              Showing {paginatedSessions.length} of {filteredSessions.length} sessions
            </CardDescription>
          </CardHeader>
          <CardContent>
            {paginatedSessions.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No sessions found matching your criteria.
              </div>
            ) : (
              <div className="space-y-3">
                {paginatedSessions.map((session) => (
                  <motion.div
                    key={session.id}
                    className="p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-3">
                          <FileText className="w-5 h-5 text-blue-500 flex-shrink-0" />
                          <div className="min-w-0 flex-1">
                            <p className="font-medium truncate">{session.fileName}</p>
                            <p className="text-sm text-muted-foreground truncate">
                              {session.projectName} • {session.language}
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-6 text-sm text-muted-foreground">
                        <div className="flex items-center space-x-1">
                          <Clock className="w-4 h-4" />
                          <span>{formatDuration(session.totalDuration)}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Code className="w-4 h-4" />
                          <span>{session.linesAdded}+ {session.linesDeleted}-</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Calendar className="w-4 h-4" />
                          <span>{formatDate(session.sessionStartTime)}</span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-6">
                <p className="text-sm text-muted-foreground">
                  Page {currentPage} of {totalPages}
                </p>
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(currentPage - 1)}
                    disabled={currentPage === 1}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(currentPage + 1)}
                    disabled={currentPage === totalPages}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  )
}

export default SessionsPage 