import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, expect, it, vi } from 'vitest'
import { AIControls, ReflectionPanel } from './Reflections'
import { api, ApiFailure } from './api'
import type { CurrentUser, Reflection } from './types'

vi.mock('./api', async original => {
  const actual = await original<typeof import('./api')>()
  return { ...actual, api: { aiStatus: vi.fn(), aiConsent: vi.fn(), reflect: vi.fn() } }
})
const user: CurrentUser = { id: 'u', timezone: 'UTC', history_version: 1, csrf_token: 'csrf', llm_consent: false }
const source = { kind: 'checkin' as const, checkin_id: 'c', expected_history_version: 1 }
const reflected: Reflection = { id: null, status: 'fallback', reason: 'consent_required', history_version: 1, source_hash: 'hash', prompt_version: 'v1', model_version: 'deterministic', context: {}, evidence: [{ id: 'F01', text: 'Your strain was skipped.', source: {} }], output: { highlights: [{ evidence_id: 'F01', text: 'Your strain was skipped.', reflection: 'Would you like to record more days?', source: {} }], limitation: 'Not a diagnosis.' } }
beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(api.reflect).mockResolvedValue(reflected)
  vi.mocked(api.aiStatus).mockResolvedValue({ configured: true, consent: false, provider: 'OpenAI', model: 'configured-model', hourly_limit: 5, daily_limit: 20, predictions_enabled: false })
  vi.mocked(api.aiConsent).mockResolvedValue({ consent: true })
})

it('never generates on mount and clearly labels a fallback with evidence', async () => {
  render(<ReflectionPanel user={user} source={source} onExpired={vi.fn()} />)
  expect(api.reflect).not.toHaveBeenCalled()
  fireEvent.click(screen.getByRole('button', { name: 'Prepare grounded reflection' }))
  await screen.findByText('Verified template fallback')
  expect(screen.getByText('Evidence F01')).toBeInTheDocument()
  expect(api.reflect).toHaveBeenCalledWith(source, expect.any(String), 'csrf', expect.any(AbortSignal))
})

it('retries an uncertain reflection with the same key', async () => {
  vi.mocked(api.reflect).mockRejectedValueOnce(new ApiFailure('Unconfirmed request', 503))
  render(<ReflectionPanel user={user} source={source} onExpired={vi.fn()} />)
  fireEvent.click(screen.getByRole('button', { name: 'Prepare grounded reflection' }))
  await screen.findByRole('alert')
  const key = vi.mocked(api.reflect).mock.calls[0][1]
  fireEvent.click(screen.getByRole('button', { name: 'Prepare grounded reflection' }))
  await screen.findByText('Verified template fallback')
  expect(vi.mocked(api.reflect).mock.calls[1][1]).toBe(key)
})

it('does not render a late reflection after the source screen unmounts', async () => {
  let resolve!: (value: Reflection) => void
  vi.mocked(api.reflect).mockImplementation(() => new Promise(done => { resolve = done }))
  const view = render(<ReflectionPanel user={user} source={source} onExpired={vi.fn()} />)
  fireEvent.click(screen.getByRole('button', { name: 'Prepare grounded reflection' }))
  expect(screen.getByRole('button', { name: 'Preparing reflection…' })).toBeDisabled()
  view.unmount()
  await act(async () => resolve(reflected))
  expect(screen.queryByText('Verified template fallback')).not.toBeInTheDocument()
})

it('requires explicit data-sharing agreement before enabling AI', async () => {
  const onUser = vi.fn()
  render(<AIControls user={user} onUser={onUser} onExpired={vi.fn()} />)
  const enable = await screen.findByRole('button', { name: 'Enable optional AI reflections' })
  expect(enable).toBeDisabled(); expect(api.aiConsent).not.toHaveBeenCalled()
  fireEvent.click(screen.getByRole('checkbox'))
  fireEvent.click(enable)
  await waitFor(() => expect(onUser).toHaveBeenCalledWith({ ...user, llm_consent: true }))
  expect(api.aiConsent).toHaveBeenCalledWith(true, 'csrf', expect.any(AbortSignal))
})

it('keeps AI disabled when the provider is not configured', async () => {
  vi.mocked(api.aiStatus).mockResolvedValue({ configured: false, consent: false, provider: 'OpenAI', model: null, hourly_limit: 5, daily_limit: 20, predictions_enabled: false })
  render(<AIControls user={user} onUser={vi.fn()} onExpired={vi.fn()} />)
  await screen.findByText('No provider is configured. Verified template reflections remain available.')
  expect(screen.getByRole('checkbox')).toBeDisabled()
  expect(api.aiConsent).not.toHaveBeenCalled()
})

it('shows a source conflict instead of accepting stale evidence', async () => {
  vi.mocked(api.reflect).mockRejectedValue(new ApiFailure('History changed. Reload source.', 409))
  render(<ReflectionPanel user={user} source={source} onExpired={vi.fn()} />)
  fireEvent.click(screen.getByRole('button', { name: 'Prepare grounded reflection' }))
  await screen.findByText('History changed. Reload source.')
  expect(screen.queryByText('Evidence F01')).not.toBeInTheDocument()
})
