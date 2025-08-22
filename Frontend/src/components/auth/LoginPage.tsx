import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Github, Monitor, Code, TrendingUp, AlertCircle, CheckCircle } from 'lucide-react'
import { Button } from '../ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { useAuthStore } from '../../store/authStore'
import toast from 'react-hot-toast'

declare global {
  interface Window {
    github_oauth_callback?: (data: any) => void;
  }
}

const LoginPage = () => {
  const [isLoading, setIsLoading] = useState(false)
  const { login, isLoading: authLoading, error } = useAuthStore()

  const features = [
    {
      icon: Monitor,
      title: "Real-time Tracking",
      description: "Track your coding activity across VS Code and Cursor"
    },
    {
      icon: Code,
      title: "Language Analytics",
      description: "Detailed insights into your programming languages"
    },
    {
      icon: TrendingUp,
      title: "Productivity Metrics",
      description: "Analyze your coding patterns and productivity trends"
    }
  ]

  const handleGitHubLogin = () => {
    if (isLoading || authLoading) return;
    
    setIsLoading(true)
    
    // Set up the callback function
    window.github_oauth_callback = async (authData) => {
      try {
        if (authData.error) {
          console.error('GitHub OAuth error:', authData.error)
          toast.error(authData.error, {
            duration: 5000,
            icon: <AlertCircle className="w-5 h-5" />
          })
          setIsLoading(false)
          return
        }

        if (authData.success && authData.user && authData.access_token) {
          // Authentication was successful, update the auth store directly
          const { setUser, setLoading } = useAuthStore.getState()
          setUser(authData.user)
          setLoading(false)
          
          const welcomeMessage = authData.is_new_user 
            ? `Welcome to AFK Monitor, ${authData.user.username}! 🎉`
            : `Welcome back, ${authData.user.username}! 👋`
          
          toast.success(welcomeMessage, {
            duration: 4000,
            icon: <CheckCircle className="w-5 h-5" />
          })
          
          setIsLoading(false)
          return
        }

        // If we get here, something unexpected happened
        toast.error('Authentication completed but no user data received', {
          duration: 5000,
          icon: <AlertCircle className="w-5 h-5" />
        })
        
      } catch (err) {
        console.error('Login callback error:', err)
        toast.error('Authentication failed. Please try again.', {
          duration: 5000,
          icon: <AlertCircle className="w-5 h-5" />
        })
      } finally {
        setIsLoading(false)
        // Clean up the callback
        delete window.github_oauth_callback
      }
    }

    // Validate GitHub client ID
    const githubClientId = import.meta.env.VITE_GITHUB_CLIENT_ID
    if (!githubClientId) {
      toast.error('GitHub authentication is not configured. Please check your environment variables.', {
        duration: 8000,
        icon: <AlertCircle className="w-5 h-5" />
      })
      setIsLoading(false)
      delete window.github_oauth_callback
      return
    }

    try {
      // Open GitHub OAuth popup
      const redirectUri = `${window.location.origin}/auth/github/callback`
      const scope = 'user:email'
      const githubAuthUrl = `https://github.com/login/oauth/authorize?client_id=${encodeURIComponent(githubClientId)}&scope=${encodeURIComponent(scope)}&redirect_uri=${encodeURIComponent(redirectUri)}`
      
      const popup = window.open(
        githubAuthUrl,
        'github-oauth',
        'width=600,height=700,scrollbars=yes,resizable=yes,left=' + (window.screen.width / 2 - 300) + ',top=' + (window.screen.height / 2 - 350)
      )

      if (!popup) {
        toast.error('Popup was blocked. Please allow popups for this site and try again.', {
          duration: 8000,
          icon: <AlertCircle className="w-5 h-5" />
        })
        setIsLoading(false)
        delete window.github_oauth_callback
        return
      }

      // Check if popup was closed manually
      const checkClosed = setInterval(() => {
        if (popup?.closed) {
          clearInterval(checkClosed)
          if (isLoading) {
            toast('Authentication was cancelled', {
              duration: 3000
            })
          }
          setIsLoading(false)
          delete window.github_oauth_callback
        }
      }, 1000)

      // Set a timeout in case the popup doesn't respond
      setTimeout(() => {
        if (popup && !popup.closed) {
          popup.close()
          clearInterval(checkClosed)
          if (isLoading) {
            toast.error('Authentication timed out. Please try again.', {
              duration: 5000,
              icon: <AlertCircle className="w-5 h-5" />
            })
          }
          setIsLoading(false)
          delete window.github_oauth_callback
        }
      }, 60000) // 60 second timeout

    } catch (err) {
      console.error('Error opening GitHub OAuth popup:', err)
      toast.error('Failed to open authentication popup. Please try again.', {
        duration: 5000,
        icon: <AlertCircle className="w-5 h-5" />
      })
      setIsLoading(false)
      delete window.github_oauth_callback
    }
  }

  useEffect(() => {
    if (error) {
      toast.error(error, {
        duration: 5000,
        icon: <AlertCircle className="w-5 h-5" />
      })
    }
  }, [error])

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/20 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-8"
        >
          <div className="flex items-center justify-center mb-4">
            <Monitor className="w-12 h-12 text-primary mr-3" />
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
              AFK Monitor
            </h1>
          </div>
          <p className="text-xl text-muted-foreground">
            Track your coding productivity with detailed analytics
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-8 items-center">
          {/* Features */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="space-y-6"
          >
            <h2 className="text-2xl font-semibold text-foreground">
              Why Choose AFK Monitor?
            </h2>
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.3 + index * 0.1 }}
                className="flex items-start space-x-4"
              >
                <div className="flex-shrink-0 w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                  <feature.icon className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-medium text-foreground">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>

          {/* Login Card */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <Card className="border-0 shadow-xl bg-card/50 backdrop-blur-sm">
              <CardHeader className="text-center">
                <CardTitle className="text-2xl">Get Started</CardTitle>
                <CardDescription>
                  Sign in with your GitHub account to start tracking your coding activity
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button
                  onClick={handleGitHubLogin}
                  disabled={isLoading || authLoading}
                  className="w-full h-12 text-base bg-[#24292e] hover:bg-[#24292e]/90 text-white"
                  size="lg"
                >
                  {isLoading || authLoading ? (
                    <>
                      <div className="w-5 h-5 mr-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Authenticating...
                    </>
                  ) : (
                    <>
                      <Github className="w-5 h-5 mr-3" />
                      Continue with GitHub
                    </>
                  )}
                </Button>
                <p className="text-xs text-muted-foreground text-center">
                  By continuing, you agree to our terms of service and privacy policy.
                  We only access your public profile information.
                </p>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  )
}

export default LoginPage 