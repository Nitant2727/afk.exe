import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Github, Terminal, Activity, Code2, ShieldCheck, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { Button } from '../ui/button'
import { Spotlight, Magnetic } from '../ui/motion'
import { useAuthStore } from '../../store/authStore'
import { apiClient } from '../../lib/api'
import type { User } from '../../types/api'

interface OAuthResult {
  error?: string
  success?: boolean
  user?: User
  access_token?: string
  is_new_user?: boolean
}

declare global {
  interface Window {
    github_oauth_callback?: (data: OAuthResult) => void
  }
}

const FEATURES = [
  {
    icon: Activity,
    title: 'Real-time tracking',
    body: 'Sessions stream in from VS Code and Cursor as you work.',
  },
  {
    icon: Code2,
    title: 'Language breakdown',
    body: 'See which languages and projects actually consumed your week.',
  },
  {
    icon: ShieldCheck,
    title: 'Local first',
    body: 'Your data stays on your machine unless you deploy it yourself.',
  },
]

const LoginPage = () => {
  const { setUser } = useAuthStore()
  const [pending, setPending] = useState<'github' | 'local' | null>(null)
  const [config, setConfig] = useState<{
    githubEnabled: boolean
    clientId: string | null
    localLoginEnabled: boolean
  } | null>(null)

  useEffect(() => {
    apiClient.getAuthConfig().then((res) => {
      if (res.success && res.data) setConfig(res.data)
    })
  }, [])

  /* The popup calls back into the opener once the backend has exchanged the code. */
  useEffect(() => {
    window.github_oauth_callback = (result) => {
      setPending(null)
      if (result.error) {
        toast.error(result.error)
        return
      }
      if (result.user && result.access_token) {
        setUser(result.user, result.access_token)
        toast.success(
          result.is_new_user
            ? `Welcome to AFK Monitor, ${result.user.username}`
            : `Welcome back, ${result.user.username}`
        )
      }
    }
    return () => {
      delete window.github_oauth_callback
    }
  }, [setUser])

  const handleGitHub = () => {
    if (!config?.clientId) {
      toast.error('GitHub OAuth is not configured on the server')
      return
    }
    setPending('github')

    const redirect = `${window.location.origin}/auth/callback`
    const url =
      `https://github.com/login/oauth/authorize?client_id=${encodeURIComponent(config.clientId)}` +
      `&redirect_uri=${encodeURIComponent(redirect)}&scope=read:user%20user:email`

    const w = 520
    const h = 680
    const left = window.screenX + (window.outerWidth - w) / 2
    const top = window.screenY + (window.outerHeight - h) / 2
    const popup = window.open(url, 'github-oauth', `width=${w},height=${h},left=${left},top=${top}`)

    if (!popup) {
      setPending(null)
      toast.error('Popup blocked — allow popups for this site and try again')
      return
    }

    // A popup that closes without calling back means the user abandoned the flow.
    const timer = setInterval(() => {
      if (popup.closed) {
        clearInterval(timer)
        setPending((p) => (p === 'github' ? null : p))
      }
    }, 600)
  }

  const handleLocal = async () => {
    setPending('local')
    const res = await apiClient.localLogin()
    setPending(null)
    if (res.success && res.data) {
      setUser(res.data.user, res.data.access_token)
      toast.success('Signed in locally')
    } else {
      toast.error(res.success === false ? res.error : 'Local sign-in failed')
    }
  }

  return (
    <div className="relative grid min-h-screen place-items-center px-6 py-10">
      <motion.div
        initial={{ y: 16 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="relative w-full max-w-4xl overflow-hidden rounded-3xl glass glass-edge glow-ring"
      >
        <Spotlight size={600} />

        <div className="relative z-10 grid gap-10 p-8 md:grid-cols-2 md:p-12">
          <div className="flex flex-col justify-center">
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-primary to-primary/60 shadow-lg shadow-primary/25">
                <Terminal className="h-5 w-5 text-primary-foreground" />
              </div>
              <div>
                <p className="font-mono text-sm font-semibold">AFK Monitor</p>
                <p className="text-[11px] text-muted-foreground">Coding analytics</p>
              </div>
            </div>

            <h1 className="mt-7 text-3xl font-semibold leading-tight tracking-tight text-gradient sm:text-4xl">
              Know where your hours actually went
            </h1>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              Sign in to see your sessions, languages and projects — collected
              automatically while you code.
            </p>

            <div className="mt-8 space-y-3">
              {config?.githubEnabled && (
                <Magnetic strength={0.2}>
                  <Button
                    onClick={handleGitHub}
                    disabled={pending !== null}
                    className="h-11 w-full rounded-xl text-sm font-medium"
                  >
                    {pending === 'github' ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Github className="mr-2 h-4 w-4" />
                    )}
                    Continue with GitHub
                  </Button>
                </Magnetic>
              )}

              {config?.localLoginEnabled && (
                <Button
                  variant={config.githubEnabled ? 'outline' : 'default'}
                  onClick={handleLocal}
                  disabled={pending !== null}
                  className="h-11 w-full rounded-xl text-sm font-medium"
                >
                  {pending === 'local' ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Terminal className="mr-2 h-4 w-4" />
                  )}
                  Continue as local developer
                </Button>
              )}

              {config && !config.githubEnabled && !config.localLoginEnabled && (
                <p className="rounded-xl bg-destructive/10 px-4 py-3 text-xs text-destructive ring-1 ring-destructive/25">
                  No sign-in method is available. Configure GitHub OAuth in{' '}
                  <span className="font-mono">Backend/.env</span>, or enable debug mode.
                </p>
              )}

              {!config && (
                <div
                  className="h-11 w-full rounded-xl skeleton"
                  aria-label="Loading sign-in options"
                />
              )}
            </div>

            {config && !config.githubEnabled && (
              <p className="mt-4 text-[11px] leading-relaxed text-muted-foreground/80">
                GitHub sign-in appears once <span className="font-mono">GITHUB_CLIENT_ID</span> and{' '}
                <span className="font-mono">GITHUB_CLIENT_SECRET</span> are set in{' '}
                <span className="font-mono">Backend/.env</span>.
              </p>
            )}
          </div>

          <ul className="flex flex-col justify-center gap-5 md:border-l md:border-border/60 md:pl-10">
            {FEATURES.map((f) => (
              <li key={f.title} className="flex gap-3">
                <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-primary/12 ring-1 ring-inset ring-primary/25">
                  <f.icon className="h-4 w-4 text-primary" />
                </span>
                <div>
                  <p className="text-sm font-medium">{f.title}</p>
                  <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{f.body}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </motion.div>
    </div>
  )
}

export default LoginPage
