import { useEffect, useState } from 'react'
import { ArrowRight, LogOut } from 'lucide-react'
import { api, failure } from './api'
import type { AuthConfig, CurrentUser } from './types'
import { Product } from './Product'
import { Landing } from './Landing'
import './App.css'

export default function App() {
  const [user, setUser] = useState<CurrentUser | null>(null)
  const [config, setConfig] = useState<AuthConfig | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [authPending, setAuthPending] = useState(false)
  const devLoginEnabled = import.meta.env.DEV && config?.dev_login_enabled

  useEffect(() => {
    let active = true
    const controller = new AbortController()
    Promise.allSettled([api.config(controller.signal), api.me(controller.signal)]).then(([configuration, session]) => {
      if (!active) return
      if (configuration.status === 'fulfilled') setConfig(configuration.value)
      else setError(failure(configuration.reason).message)
      if (session.status === 'fulfilled') setUser(session.value)
      else if (failure(session.reason).status !== 401) setError(failure(session.reason).message)
      setLoading(false)
    })
    return () => { active = false; controller.abort() }
  }, [])

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
    <header className="topbar"><a href="/" className="brand"><img src="/stress-logo.png" alt="" width="38" height="38" /><span>Student Wellbeing<small>Workload & routine insights</small></span></a>{user && <button onClick={logout} disabled={authPending}><LogOut size={16} aria-hidden="true" /> Sign out</button>}</header>
    <main id="main">
      {user && <div className="intro"><h1>Make space to check in.</h1><p>A clearer record of your workload, routines, and how your day felt.</p></div>}
      {error && <p className="error" role="alert">{error}</p>}
      {!loading && user ? <Product key={user.id} user={user} onUser={setUser} onExpired={() => { setUser(null); setError('Your session expired. Sign in again to continue. Unsaved account data has been cleared.') }} /> : <Landing signIn={<>{loading ? <p role="status">Checking your session…</p> : <>{config?.oidc_enabled && <a className="primary button-link" href="/api/auth/login">Continue with Google <ArrowRight size={17} aria-hidden="true" /></a>}{devLoginEnabled && <><button className="primary" onClick={devLogin} disabled={authPending}>{authPending ? 'Signing in…' : 'Use local development account'}</button><p className="muted small">Local development only. This sign-in is disabled in production.</p></>}{config && !config.oidc_enabled && !devLoginEnabled && <p className="notice">Sign-in is temporarily unavailable. Please try again later.</p>}</>}</>} />}
    </main><footer>Routine-based insights are heuristic and do not diagnose mental-health conditions.</footer>
  </div>
}
