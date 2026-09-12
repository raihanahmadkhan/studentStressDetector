import { Component } from 'react'
import type { ReactNode } from 'react'

export class ErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false }
  static getDerivedStateFromError() { return { failed: true } }
  render() {
    if (this.state.failed) return <main className="panel" role="alert"><h1>This view could not be displayed.</h1><p>Reload to fetch your saved data again. Unsaved drafts may be lost; a request already sent may still have completed.</p><button onClick={() => window.location.reload()}>Reload application</button></main>
    return this.props.children
  }
}
