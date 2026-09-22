import { useEffect, useRef, useState } from 'react'
import { ArrowRight, LogOut } from 'lucide-react'
import { api, failure } from './api'
import type { AuthConfig, CurrentUser } from './types'
import { Product } from './Product'
import { Landing } from './Landing'
import './App.css'

export default function App({ signInNotice = '', restoreSession = true }: { signInNotice?: string; restoreSession?: boolean }) {
  const [user, setUser] = useState<CurrentUser | null>(null)
  const [config, setConfig] = useState<AuthConfig | null>(restoreSession ? null : { oidc_enabled: true, dev_login_enabled: false })
  const [loading, setLoading] = useState(restoreSession)
  const [configLoading, setConfigLoading] = useState(restoreSession)
  const [configFailed, setConfigFailed] = useState(false)
  const [error, setError] = useState('')
  const [connectionError, setConnectionError] = useState('')
  const [attempt, setAttempt] = useState(0)
  const [authPending, setAuthPending] = useState(false)
  const sessionRequest = useRef<AbortController | null>(null)
  const devLoginEnabled = import.meta.env.DEV && config?.dev_login_enabled

  useEffect(() => {
    // Ordinary production visits go straight to explicit Google sign-in.
    if (!restoreSession) return
    setLoading(true)
    setConfigLoading(true)
    setConfigFailed(false)
    setConnectionError('')
    let active = true
    const configController = new AbortController()
    const sessionController = new AbortController()
    sessionRequest.current = sessionController
    // Configuration controls the sign-in options only. A verified account can
    // open immediately, even if this independent request is slow or fails.
    api.config(configController.signal).then(value => {
      if (active) setConfig(value)
    }).catch(() => {
      if (active) setConfigFailed(true)
    }).finally(() => {
      if (active) setConfigLoading(false)
    })
    api.me(sessionController.signal).then(value => {
      if (active && !sessionController.signal.aborted) setUser(value)
    }).catch(error => {
      if (active && !sessionController.signal.aborted) {
        setUser(null)
        if (failure(error).status !== 401) setConnectionError('We could not check your session. Please retry or sign in again.')
      }
    }).finally(() => {
      if (active && !sessionController.signal.aborted) setLoading(false)
    })
    return () => { active = false; configController.abort(); sessionController.abort() }
  }, [attempt, restoreSession])

  async function devLogin() {
    // Explicit sign-in supersedes a pending session read.
    sessionRequest.current?.abort()
    setLoading(false)
    setAuthPending(true); setError('')
    try { setUser(await api.devLogin()); setConnectionError('') } catch (error) { setError(failure(error).message) }
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
      {!user && (connectionError || configFailed) && <div className="error" role="alert"><p>{configFailed ? 'We could not connect to sign-in. Please retry.' : connectionError}</p><button onClick={() => setAttempt(value => value + 1)} disabled={loading || configLoading || authPending}>Retry connection</button></div>}
      {error && <p className="error" role="alert">{error}</p>}
      {user ? <Product key={user.id} user={user} onUser={setUser} onLogout={logout} authPending={authPending} onExpired={() => { setUser(null); setError('Your session expired. Sign in again to continue. Unsaved account data has been cleared.') }} /> : <Landing signIn={<>
        {loading && !authPending && <p role="status">Checking your session…</p>}
        {!loading && configLoading && <p role="status">Loading sign-in…</p>}
        {config?.oidc_enabled && <a className="primary button-link" href="/api/auth/login">Continue with Google <ArrowRight size={17} aria-hidden="true" /></a>}
        {devLoginEnabled && <><button className="primary" onClick={devLogin} disabled={authPending}>{authPending ? 'Signing in…' : 'Use local development account'}</button><p className="muted small">Local development only. This sign-in is disabled in production.</p></>}
        {config && !config.oidc_enabled && !devLoginEnabled && <p className="notice">Sign-in is temporarily unavailable. Please try again later.</p>}
      </>} />}
    </main><footer>Student Stress Detector provides a rule-based stress estimate, not a clinical diagnosis.</footer>
  </div>
}
