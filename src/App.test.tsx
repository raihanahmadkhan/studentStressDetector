import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import App from './App'
import { api, ApiFailure } from './api'
import type { CheckIn, CurrentUser, Submission } from './types'

vi.mock('./api', async importOriginal => {
  const actual = await importOriginal<typeof import('./api')>()
  return { ...actual, api: { config: vi.fn(), me: vi.fn(), devLogin: vi.fn(), logout: vi.fn(), save: vi.fn(), loadDate: vi.fn() } }
})

const user: CurrentUser = { id: 'student-1', timezone: 'Asia/Kolkata', history_version: 0, csrf_token: 'csrf', llm_consent: false }

function result(payload: Submission): CheckIn {
  return {
    id: 'saved-1', observation_date: payload.observation_date, timezone: payload.timezone, revision: 1,
    recorded_at: '2026-09-12T09:00:00Z', retrospective: false, questionnaire_version: 'check-in-1.0.0',
    inputs: payload, history_version: 1,
    assessment: { status: 'ok', score: 50, raw_centroid: 50, category: 'Moderate', model_version: 'fuzzy-2.0.0',
      spec_hash: 'verified-hash', memberships: {}, rules: [{ id: 'B05', weight: 1, antecedents: [{ variable: 'academic_load', term: 'medium', degree: 1 }], consequent: 'moderate', firing_strength: 0.667 }],
      aggregate: { universe: [], membership: [] }, reason: null, limitations: [] },
  }
}

async function fill() {
  await screen.findByRole('heading', { name: 'Your daily check-in' })
  fireEvent.change(screen.getByLabelText(/Sleep duration/), { target: { value: '7' } })
  for (const button of screen.getAllByRole('button', { name: 'Use 5 / 10' })) fireEvent.click(button)
  fireEvent.change(screen.getByLabelText(/Screen time/), { target: { value: '6' } })
  fireEvent.change(screen.getByLabelText(/Other commitments/), { target: { value: '5' } })
  fireEvent.change(screen.getByLabelText(/How strained/), { target: { value: '6' } })
}

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(api.config).mockResolvedValue({ oidc_enabled: false, dev_login_enabled: true })
  vi.mocked(api.me).mockResolvedValue(user)
  vi.mocked(api.save).mockImplementation(async payload => result(payload))
  vi.mocked(api.logout).mockResolvedValue(undefined)
  vi.mocked(api.loadDate).mockResolvedValue(null)
})

afterEach(() => vi.unstubAllEnvs())

it('production offers same-origin Google login and ignores a development flag', async () => {
  vi.stubEnv('DEV', false)
  vi.mocked(api.me).mockRejectedValue(new ApiFailure('Sign in', 401))
  vi.mocked(api.config).mockResolvedValue({ oidc_enabled: true, dev_login_enabled: true })
  render(<App />)
  expect(await screen.findByRole('link', { name: /Continue with Google/ })).toHaveAttribute('href', '/api/auth/login')
  expect(screen.queryByRole('button', { name: /local development/ })).not.toBeInTheDocument()
  expect(api.devLogin).not.toHaveBeenCalled()
})

it('unavailable production login gives no provider configuration instructions', async () => {
  vi.stubEnv('DEV', false)
  vi.mocked(api.me).mockRejectedValue(new ApiFailure('Sign in', 401))
  vi.mocked(api.config).mockResolvedValue({ oidc_enabled: false, dev_login_enabled: false })
  render(<App />)
  expect(await screen.findByText('Sign-in is temporarily unavailable. Please try again later.')).toBeInTheDocument()
  expect(screen.queryByText(/OIDC|client.secret|configure|backend/i)).not.toBeInTheDocument()
})

describe('intentional observations', () => {
  it('does not save on mount or on input changes', async () => {
    render(<App />)
    await fill()
    expect(api.save).not.toHaveBeenCalled()
    expect(api.loadDate).not.toHaveBeenCalled()
    expect(localStorage.getItem('stressHistory')).toBeNull()
  })

  it('saves once explicitly and keeps reported strain separate from the index', async () => {
    render(<App />)
    await fill()
    fireEvent.click(screen.getByRole('button', { name: 'Save check-in' }))
    await screen.findByText('50.0 / 100')
    expect(screen.getAllByText('6 / 10').length).toBeGreaterThan(0)
    expect(screen.getByText('B05')).toBeInTheDocument()
    expect(api.save).toHaveBeenCalledTimes(1)
    expect(api.save).toHaveBeenCalledWith(expect.objectContaining({ reported_strain: 6, sleep_hours: 7 }), expect.any(String), 'csrf', expect.any(AbortSignal))
    fireEvent.change(screen.getByLabelText(/Sleep duration/), { target: { value: '9' } })
    expect(screen.getByText('7 hours')).toBeInTheDocument()
    expect(api.save).toHaveBeenCalledTimes(1)
  })

  it('retains draft and retries an uncertain save with the same mutation key', async () => {
    vi.mocked(api.save).mockRejectedValueOnce(new ApiFailure('Save status unconfirmed.'))
    render(<App />)
    await fill()
    fireEvent.click(screen.getByRole('button', { name: 'Save check-in' }))
    await screen.findByRole('alert')
    expect(screen.getByLabelText(/Sleep duration/)).toHaveValue('7')
    expect(screen.queryByText('Your check-in is saved in your account.')).not.toBeInTheDocument()
    const firstKey = vi.mocked(api.save).mock.calls[0][1]
    fireEvent.click(screen.getByRole('button', { name: 'Save check-in' }))
    await screen.findByText('50.0 / 100')
    expect(vi.mocked(api.save).mock.calls[1][1]).toBe(firstKey)
  })

  it('creates a new attempt when the failed payload is changed', async () => {
    vi.mocked(api.save).mockRejectedValueOnce(new ApiFailure('Unavailable', 503))
    render(<App />)
    await fill()
    fireEvent.click(screen.getByRole('button', { name: 'Save check-in' }))
    await screen.findByRole('alert')
    const firstKey = vi.mocked(api.save).mock.calls[0][1]
    fireEvent.change(screen.getByLabelText(/Sleep duration/), { target: { value: '8' } })
    fireEvent.click(screen.getByRole('button', { name: 'Save check-in' }))
    await screen.findByText('50.0 / 100')
    expect(vi.mocked(api.save).mock.calls[1][1]).not.toBe(firstKey)
  })

  it('blocks double submission while a save is pending', async () => {
    let resolve!: (value: CheckIn) => void
    vi.mocked(api.save).mockImplementation(() => new Promise(done => { resolve = done }))
    render(<App />)
    await fill()
    fireEvent.click(screen.getByRole('button', { name: 'Save check-in' }))
    expect(screen.getByRole('button', { name: /Working/ })).toBeDisabled()
    expect(screen.getByLabelText(/Sleep duration/)).toBeDisabled()
    fireEvent.submit(screen.getByRole('button', { name: /Working/ }).closest('form')!)
    expect(api.save).toHaveBeenCalledTimes(1)
    await act(async () => resolve(result(vi.mocked(api.save).mock.calls[0][0])))
  })

  it('discards a late save response after logout', async () => {
    let resolve!: (value: CheckIn) => void
    vi.mocked(api.save).mockImplementation(() => new Promise(done => { resolve = done }))
    render(<App />)
    await fill()
    fireEvent.click(screen.getByRole('button', { name: 'Save check-in' }))
    fireEvent.click(screen.getByRole('button', { name: 'Sign out' }))
    await screen.findByRole('heading', { name: 'Your check-ins belong to you' })
    await act(async () => resolve(result(vi.mocked(api.save).mock.calls[0][0])))
    expect(screen.queryByText('50.0 / 100')).not.toBeInTheDocument()
    expect(screen.queryByLabelText(/Sleep duration/)).not.toBeInTheDocument()
  })

  it('requires an explicit skip and does not invent strain', async () => {
    render(<App />)
    await fill()
    fireEvent.click(screen.getByRole('button', { name: 'Prefer to skip' }))
    fireEvent.click(screen.getByRole('button', { name: 'Save check-in' }))
    await screen.findByText('Skipped')
    expect(vi.mocked(api.save).mock.calls[0][0].reported_strain).toBeNull()
  })

  it('loads a saved record without creating history', async () => {
    render(<App />)
    await fill()
    fireEvent.click(screen.getByRole('button', { name: 'Load saved check-in' }))
    await screen.findByText('No saved check-in exists for this date.')
    expect(api.save).not.toHaveBeenCalled()
  })

  it('shows session dependency failure without offering fake local scoring', async () => {
    vi.mocked(api.me).mockRejectedValue(new ApiFailure('Database unavailable', 503))
    render(<App />)
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('Database unavailable'))
    expect(screen.queryByRole('button', { name: 'Save check-in' })).not.toBeInTheDocument()
    expect(api.save).not.toHaveBeenCalled()
  })
})
