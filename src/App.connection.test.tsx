import { act, fireEvent, render, screen } from '@testing-library/react'
import axios, { AxiosError, type AxiosResponse } from 'axios'
import { afterEach, expect, it, vi } from 'vitest'
import App from './App'

vi.mock('./Product', () => ({ Product: ({ user }: { user: { id: string } }) => <p>Verified account: {user.id}</p> }))
afterEach(() => vi.restoreAllMocks())
const user = { id: 'existing-student', csrf_token: 'csrf', timezone: 'UTC', history_version: 0, llm_consent: false }
const config = { oidc_enabled: true, dev_login_enabled: false }

it('shows fresh Google sign-in immediately with no API requests on an ordinary visit', () => {
  const request = vi.spyOn(axios.Axios.prototype, 'request')
  render(<App restoreSession={false} />)
  expect(screen.getByRole('link', { name: /Continue with Google/ })).toHaveAttribute('href', '/api/auth/login')
  expect(screen.queryByRole('status')).not.toBeInTheDocument()
  expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  expect(request).not.toHaveBeenCalled()
})

it('opens a verified session without waiting for sign-in configuration', async () => {
  vi.spyOn(axios.Axios.prototype, 'request').mockImplementation(async request => {
    if (request.url === '/auth/config') return new Promise(() => {})
    return { data: user }
  })
  render(<App />)
  expect(await screen.findByText('Verified account: existing-student')).toBeInTheDocument()
  expect(screen.queryByRole('status')).not.toBeInTheDocument()
})

it('offers sign-in while session verification is still pending', async () => {
  vi.spyOn(axios.Axios.prototype, 'request').mockImplementation(async request => {
    if (request.url === '/me') return new Promise(() => {})
    return { data: config }
  })
  render(<App />)
  expect(await screen.findByRole('link', { name: /Continue with Google/ })).toBeInTheDocument()
  expect(screen.queryByText(/Verified account/)).not.toBeInTheDocument()
})

it('requires server verification even when opened as a login callback', async () => {
  vi.spyOn(axios.Axios.prototype, 'request').mockImplementation(async request => {
    if (request.url === '/me') throw new AxiosError('Sign in', 'ERR_BAD_REQUEST', undefined, undefined, { status: 401 } as AxiosResponse)
    return { data: config }
  })
  render(<App restoreSession />)
  expect(await screen.findByRole('link', { name: /Continue with Google/ })).toBeInTheDocument()
  expect(screen.queryByText(/Verified account/)).not.toBeInTheDocument()
})

it('reports an outage without a retry loop and allows a deliberate retry', async () => {
  let ready = false
  const request = vi.spyOn(axios.Axios.prototype, 'request').mockImplementation(async request => {
    if (!ready) throw new AxiosError('Timeout', 'ECONNABORTED')
    return { data: request.url === '/me' ? user : config }
  })
  render(<App />)
  expect(await screen.findByRole('alert')).toHaveTextContent('We could not connect to sign-in')
  expect(request).toHaveBeenCalledTimes(2)
  ready = true
  fireEvent.click(screen.getByRole('button', { name: 'Retry connection' }))
  expect(await screen.findByText('Verified account: existing-student')).toBeInTheDocument()
  expect(screen.queryByRole('alert')).not.toBeInTheDocument()
})

it('does not let a late session response overwrite an explicit development login', async () => {
  let complete!: (value: unknown) => void
  vi.spyOn(axios.Axios.prototype, 'request').mockImplementation(async request => {
    if (request.url === '/me') return new Promise(resolve => { complete = resolve })
    if (request.url === '/auth/dev-login') return { data: user }
    return { data: { oidc_enabled: false, dev_login_enabled: true } }
  })
  render(<App />)
  fireEvent.click(await screen.findByRole('button', { name: 'Use local development account' }))
  expect(await screen.findByText('Verified account: existing-student')).toBeInTheDocument()
  await act(async () => complete({ data: { ...user, id: 'stale-user' } }))
  expect(screen.getByText('Verified account: existing-student')).toBeInTheDocument()
})

it('cancels outstanding reads on unmount', () => {
  const request = vi.spyOn(axios.Axios.prototype, 'request').mockImplementation(() => new Promise(() => {}))
  const view = render(<App />)
  view.unmount()
  expect(request).toHaveBeenCalledTimes(2)
  expect(request.mock.calls.every(([config]) => config.signal?.aborted)).toBe(true)
})
