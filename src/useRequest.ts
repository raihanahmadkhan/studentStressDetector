import { useCallback, useEffect, useRef, useState } from 'react'
import { failure } from './api'

/** A screen owns its requests. Unmounting or replacing a read discards late responses. */
export function useRequest(onExpired: () => void) {
  const [pending, setPending] = useState(false)
  const [error, setError] = useState('')
  const current = useRef<AbortController | null>(null)
  const expired = useRef(onExpired)
  useEffect(() => { expired.current = onExpired }, [onExpired])
  useEffect(() => () => { current.current?.abort() }, [])
  const run = useCallback(async <T,>(work: (signal: AbortSignal) => Promise<T>, accept: (value: T) => void, replace = false) => {
    if (current.current && !replace) return
    current.current?.abort()
    const controller = new AbortController()
    current.current = controller
    setPending(true); setError('')
    try {
      const result = await work(controller.signal)
      if (!controller.signal.aborted) accept(result)
    } catch (error) {
      if (!controller.signal.aborted) {
        const issue = failure(error)
        if (issue.status === 401) expired.current()
        else setError(issue.message)
      }
    } finally {
      if (current.current === controller && !controller.signal.aborted) { current.current = null; setPending(false) }
    }
  }, [])
  return { pending, error, run }
}
