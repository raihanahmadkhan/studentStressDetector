import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import { ErrorBoundary } from './ErrorBoundary'
import './index.css'
import { cleanAuthUrl, authNotice } from './authUrl'

const signInNotice = authNotice(window.location.href)
// This marker only requests verification. /api/me must still authenticate the
// HttpOnly cookie; a manually supplied marker never grants access.
const restoreSession = import.meta.env.DEV || new URL(window.location.href).searchParams.get('signed_in') === '1'
const cleanUrl = cleanAuthUrl(window.location.href)
if (cleanUrl !== window.location.href) window.history.replaceState(null, '', cleanUrl)

createRoot(document.getElementById('root')!).render(<StrictMode><ErrorBoundary><App signInNotice={signInNotice} restoreSession={restoreSession} /></ErrorBoundary></StrictMode>)
