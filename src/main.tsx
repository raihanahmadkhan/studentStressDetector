import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import { ErrorBoundary } from './ErrorBoundary'
import './index.css'
import { cleanAuthUrl, authNotice } from './authUrl'

const signInNotice = authNotice(window.location.href)
const cleanUrl = cleanAuthUrl(window.location.href)
if (cleanUrl !== window.location.href) window.history.replaceState(null, '', cleanUrl)

createRoot(document.getElementById('root')!).render(<StrictMode><ErrorBoundary><App signInNotice={signInNotice} /></ErrorBoundary></StrictMode>)
