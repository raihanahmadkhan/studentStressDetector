import { act, render, screen } from '@testing-library/react'
import axios, { AxiosError } from 'axios'
import { afterEach, expect, it, vi } from 'vitest'
import App from './App'

vi.mock('./Product', () => ({ Product: () => <p>Restored account</p> }))
afterEach(() => { vi.useRealTimers(); vi.restoreAllMocks() })

const user = { id: 'existing-student', csrf_token: 'csrf', timezone: 'UTC', history_version: 0, llm_consent: false }

it('automatically restores an existing account after the server wakes up', async () => {
  vi.useFakeTimers()
  let ready = false
  const request = vi.spyOn(axios.Axios.prototype, 'request').mockImplementation(async config => {
    if (!ready) throw new AxiosError('Timeout', 'ECONNABORTED')
    return { data: config.url === '/me' ? user : { oidc_enabled: true, dev_login_enabled: false } }
  })
  render(<App />)
  expect(screen.getByRole('status')).toHaveTextContent('Checking your session')
  await act(async () => { await vi.advanceTimersByTimeAsync(4000) })
  expect(screen.getByRole('status')).toHaveTextContent('retry automatically')
  expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  ready = true
  await act(async () => { await vi.runAllTimersAsync() })
  expect(screen.getByText('Restored account')).toBeInTheDocument()
  expect(screen.getByRole('button', { name: 'Sign out' })).toBeInTheDocument()
  expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  expect(request.mock.calls.every(([config]) => config.method === 'get')).toBe(true)
})

it('keeps a verified account available if sign-in configuration is invalid', async () => {
  vi.spyOn(axios.Axios.prototype, 'request').mockImplementation(async config => ({ data: config.url === '/me' ? user : {} }))
  render(<App />)
  expect(await screen.findByText('Restored account')).toBeInTheDocument()
  expect(screen.queryByRole('alert')).not.toBeInTheDocument()
})

it('cancels both startup retries on unmount', async () => {
  vi.useFakeTimers()
  const request = vi.spyOn(axios.Axios.prototype, 'request').mockRejectedValue(new AxiosError('Offline', 'ERR_NETWORK'))
  const view = render(<App />)
  await act(async () => { await vi.advanceTimersByTimeAsync(0) })
  view.unmount()
  await act(async () => { await vi.runAllTimersAsync() })
  expect(request).toHaveBeenCalledTimes(2)
  expect(request.mock.calls.every(([config]) => config.signal?.aborted)).toBe(true)
})
