import { useEffect, useState } from 'react'
import { ArrowRight, LogOut } from 'lucide-react'
import { api, failure } from './api'
import type { AuthConfig, CurrentUser } from './types'
import { Product } from './Product'
import { Landing } from './Landing'
import './App.css'

export default function App({ signInNotice = '' }: { signInNotice?: string }) {
  const [user, setUser] = useState<CurrentUser | null>(null)
  const [config, setConfig] = useState<AuthConfig | null>(null)
  const [loading, setLoading] = useState(true)
  const [slowConnection, setSlowConnection] = useState(false)
  const [error, setError] = useState('')
  const [connectionError, setConnectionError] = useState('')
  const [attempt, setAttempt] = useState(0)
  const [authPending, setAuthPending] = useState(false)
  const devLoginEnabled = import.meta.env.DEV && config?.dev_login_enabled

  useEffect(() => {
    setLoading(true)
    setSlowConnection(false)
    setConnectionError('')
    let active = true
    const controller = new AbortController()
    const slowTimer = setTimeout(() => { if (active) setSlowConnection(true) }, 4000)
    Promise.allSettled([api.config(controller.signal, true), api.me(controller.signal, true)]).then(([configuration, session]) => {
      if (!active) return
      clearTimeout(slowTimer)
      if (configuration.status === 'fulfilled') setConfig(configuration.value)
      else if (session.status !== 'fulfilled') setConnectionError('We could not connect to sign-in. Please retry.')
      if (session.status === 'fulfilled') setUser(session.value)
      else {
        setUser(null)
        if (configuration.status === 'fulfilled' && failure(session.reason).status !== 401) setConnectionError('We could not check your session. Please retry or sign in again.')
      }
      setLoading(false)
    })
    return () => { active = false; clearTimeout(slowTimer); controller.abort() }
  }, [attempt])

  async function devLogin() {
    setAuthPending(true); setError('')
    try { setUser(await api.devLogin()) } catch (error) { setError(failure(error).message) }
    finally { setAuthPending(false) }
  }

  async function logout() {
    if (!user) return
    setAuthPending(true); setError('')
    try {
      await api.logout(user.csrf_token)
      setUser(null)
    } catch (firstError) {
      if (failure(firstError).status === 401) {
        setUser(null)
      } else {
        try {
          // A proxy can lose the 204 response after the server has already
          // revoked the session. Re-read the session before retrying so logout
          // stays idempotent and a stale CSRF token can be refreshed safely.
          const current = await api.me()
          try {
            await api.logout(current.csrf_token)
            setUser(null)
          } catch (retryError) {
            if (failure(retryError).status === 401) setUser(null)
            else setError('Sign-out could not be confirmed. Please retry.')
          }
        } catch (verificationError) {
          if (failure(verificationError).status === 401) setUser(null)
          else setError('Sign-out could not be confirmed. Please retry.')
        }
      }
    }
    finally { setAuthPending(false) }
  }

  return <div className="app-shell">
    <a href="#main" className="skip-link">Skip to check-in</a>
    <header className="topbar"><a href="/" className="brand"><img src="/stress-logo.png" alt="" width="38" height="38" /><span>Student Stress Detector<small>Routine-based stress estimates</small></span></a>{user && <button onClick={logout} disabled={authPending}><LogOut size={16} aria-hidden="true" /> Sign out</button>}</header>
    <main id="main">
      {user && <div className="intro">{user.display_name && <p className="account-greeting">Hello, {user.display_name}.</p>}<h1>Understand your stress today.</h1><p>Estimate stress from your routine, understand its contributors, and track how you feel over time.</p></div>}
      {!user && signInNotice && <p className="notice" role="status">{signInNotice}</p>}
      {connectionError && <div className="error" role="alert"><p>{connectionError}</p><button onClick={() => setAttempt(value => value + 1)} disabled={loading}>Retry connection</button></div>}
      {error && <p className="error" role="alert">{error}</p>}
      {!loading && user ? <Product key={user.id} user={user} onUser={setUser} onLogout={logout} authPending={authPending} onExpired={() => { setUser(null); setError('Your session expired. Sign in again to continue. Unsaved account data has been cleared.') }} /> : <Landing signIn={<>{loading ? <p role="status">{slowConnection ? 'Connecting securely. This may take a minute; we’ll retry automatically…' : 'Checking your session…'}</p> : <>{config?.oidc_enabled && <a className="primary button-link" href="/api/auth/login">Continue with Google <ArrowRight size={17} aria-hidden="true" /></a>}{devLoginEnabled && <><button className="primary" onClick={devLogin} disabled={authPending}>{authPending ? 'Signing in…' : 'Use local development account'}</button><p className="muted small">Local development only. This sign-in is disabled in production.</p></>}{config && !config.oidc_enabled && !devLoginEnabled && <p className="notice">Sign-in is temporarily unavailable. Please try again later.</p>}</>}</>} />}
    </main><footer>Student Stress Detector provides a rule-based stress estimate, not a clinical diagnosis.</footer>
  </div>
}
