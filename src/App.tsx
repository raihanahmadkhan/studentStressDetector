import { useEffect, useState } from 'react'
import { ArrowRight, LogOut, ShieldCheck } from 'lucide-react'
import { api, failure } from './api'
import type { AuthConfig, CurrentUser } from './types'
import { Product } from './Product'
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
    try { await api.logout(user.csrf_token); setUser(null) }
    catch (error) { const issue = failure(error); if (issue.status === 401) setUser(null); else setError(issue.message) }
    finally { setAuthPending(false) }
  }

  return <div className="app-shell">
    <a href="#main" className="skip-link">Skip to check-in</a>
    <header className="topbar"><a href="/" className="brand"><img src="/stress-logo.png" alt="" width="38" height="38" /><span>Student Wellbeing<small>Workload & routine insights</small></span></a>{user && <button onClick={logout} disabled={authPending}><LogOut size={16} aria-hidden="true" /> Sign out</button>}</header>
    <main id="main">
      <div className="intro"><h1>Make space to check in.</h1><p>A clearer record of your workload, routines, and how your day felt.</p></div>
      {error && <p className="error" role="alert">{error}</p>}
      {loading ? <p role="status">Checking your session…</p> : user ? <Product key={user.id} user={user} onUser={setUser} onExpired={() => { setUser(null); setError('Your session expired. Sign in again to continue. Unsaved account data has been cleared.') }} /> : <section className="panel sign-in"><ShieldCheck size={30} aria-hidden="true" /><h2>Your check-ins belong to you</h2><p>Sign in to save observations and read the exact rules behind your routine-based index.</p>{config?.oidc_enabled && <a className="primary button-link" href="/api/auth/login">Continue with Google <ArrowRight size={17} aria-hidden="true" /></a>}{devLoginEnabled && <><button className="primary" onClick={devLogin} disabled={authPending}>{authPending ? 'Signing in…' : 'Use local development account'}</button><p className="muted small">Local development only. This sign-in is disabled in production.</p></>}{config && !config.oidc_enabled && !devLoginEnabled && <p className="notice">Sign-in is temporarily unavailable. Please try again later.</p>}</section>}
    </main><footer>Routine-based insights are heuristic and do not diagnose mental-health conditions.</footer>
  </div>
}
