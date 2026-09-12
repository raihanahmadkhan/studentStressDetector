import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, expect, it, vi } from 'vitest'
import { Product } from './Product'
import { api, ApiFailure } from './api'
import type { CheckIn, CurrentUser, Patterns } from './types'

vi.mock('./api', async original => {
  const actual = await original<typeof import('./api')>()
  return { ...actual, api: Object.fromEntries(Object.keys(actual.api).map(key => [key, vi.fn()])) }
})
vi.mock('./Charts', () => ({ FuzzyChart: () => <div>Fuzzy aggregate chart</div>, PatternChart: () => <div>Calendar chart</div> }))
const user: CurrentUser = { id: 'u1', timezone: 'Asia/Kolkata', history_version: 1, csrf_token: 'csrf', llm_consent: false }
const saved: CheckIn = { id: 'c1', observation_date: '2026-09-01', timezone: user.timezone, revision: 1, recorded_at: '2026-09-01T14:00:00Z', retrospective: false, questionnaire_version: 'check-in-1.0.0', history_version: 1,
  inputs: { deadline_pressure: 5, recovery: 5, sleep_hours: 7, academic_load: 5, screen_hours: 6, extracurricular_load: 5, reported_strain: null },
  assessment: { status: 'ok', score: 50, raw_centroid: 50, category: 'Moderate', model_version: 'fuzzy-2.0.0', spec_hash: 'hash', memberships: { academic_load: { medium: 1 } }, rules: [{ id: 'B05', weight: 1, antecedents: [{ variable: 'academic_load', term: 'medium', degree: 1 }], consequent: 'moderate', firing_strength: 0.667 }], aggregate: { universe: [0, 50, 100], membership: [0, 1, 0] }, reason: null, limitations: [] } }
const emptyPatterns: Patterns = { policy_version: 'personal-patterns-1.0.0', history_version: 1, windows: { recent: ['2026-09-01', '2026-09-07'], baseline: ['2026-08-11', '2026-08-31'] }, metrics: [{ id: 'sleep', metric: 'sleep_hours', baseline_count: 0, recent_count: 0, baseline_median: null, recent_median: null, difference: null, status: 'insufficient_data', mad: null, threshold: null, latest_deviation: null, persistent_deviation: null, rule: '4/7 and 10/21', limitation: 'Missing days may bias comparisons.' }], series: [{ date: '2026-09-01', inputs: null, rolling_mean: { deadline_pressure: null, recovery: null, sleep_hours: null, academic_load: null, screen_hours: null, extracurricular_load: null, reported_strain: null } }], cooccurrence: null }
const onExpired = vi.fn(), onUser = vi.fn()

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(api.me).mockResolvedValue(user)
  vi.mocked(api.list).mockResolvedValue({ items: [saved], next_cursor: null, history_version: 1 })
  vi.mocked(api.get).mockResolvedValue(saved)
  vi.mocked(api.revisions).mockResolvedValue({ items: [saved], next_cursor: null, history_version: 1 })
  vi.mocked(api.patterns).mockResolvedValue(emptyPatterns)
  vi.mocked(api.remove).mockResolvedValue({ deleted: true, history_version: 2 })
  vi.mocked(api.clearHistory).mockResolvedValue({ history_version: 2 })
  vi.mocked(api.scenario).mockResolvedValue({ hypothetical: true, inputs: saved.inputs, assessment: saved.assessment, reference: null, difference: null, history_version: 1 })
})
function mount() { return render(<Product user={user} onUser={onUser} onExpired={onExpired} />) }
async function openObservation() {
  fireEvent.click(screen.getByRole('button', { name: 'Timeline' }))
  fireEvent.click(await screen.findByRole('button', { name: 'Open 2026-09-01' }))
  await screen.findByRole('button', { name: 'Edit observation' })
}

it('loads history as a read and needs confirmation before deleting', async () => {
  mount(); await openObservation()
  expect(api.save).not.toHaveBeenCalled()
  fireEvent.click(screen.getByRole('button', { name: 'Delete observation' }))
  expect(api.remove).not.toHaveBeenCalled()
  fireEvent.click(screen.getByRole('button', { name: 'Confirm permanent deletion' }))
  await waitFor(() => expect(api.remove).toHaveBeenCalledWith('c1', 1, expect.any(String), 'csrf', expect.any(AbortSignal)))
  await waitFor(() => expect(screen.queryByRole('heading', { name: 'Your check-in, explained' })).not.toBeInTheDocument())
})

it('retries uncertain deletion with its original key', async () => {
  vi.mocked(api.remove).mockRejectedValueOnce(new ApiFailure('Unconfirmed delete', 503))
  mount(); await openObservation()
  fireEvent.click(screen.getByRole('button', { name: 'Delete observation' }))
  fireEvent.click(screen.getByRole('button', { name: 'Confirm permanent deletion' }))
  await screen.findByText('Unconfirmed delete')
  const key = vi.mocked(api.remove).mock.calls[0][2]
  fireEvent.click(screen.getByRole('button', { name: 'Confirm permanent deletion' }))
  await waitFor(() => expect(vi.mocked(api.remove).mock.calls[1][2]).toBe(key))
})

it('keeps a conflicting edit draft and never silently overwrites', async () => {
  vi.mocked(api.edit).mockRejectedValue(new ApiFailure('Newer revision exists. Reload before saving.', 409, 'revision_conflict'))
  mount(); await openObservation()
  fireEvent.click(screen.getByRole('button', { name: 'Edit observation' }))
  fireEvent.change(screen.getByLabelText(/Sleep duration/), { target: { value: '9' } })
  fireEvent.click(screen.getByRole('button', { name: 'Save revision' }))
  await screen.findByRole('alert')
  expect(screen.getByLabelText(/Sleep duration/)).toHaveValue('9')
  expect(api.edit).toHaveBeenCalledWith('c1', expect.objectContaining({ sleep_hours: 9, reported_strain: null }), 1, expect.any(String), 'csrf', expect.any(AbortSignal))
  expect(api.save).not.toHaveBeenCalled()
})

it('preserves distinct revision views without restoration writes', async () => {
  mount(); await openObservation()
  fireEvent.click(screen.getByRole('button', { name: 'View revisions' }))
  fireEvent.click(await screen.findByRole('button', { name: 'View revision 1' }))
  expect(screen.getAllByText('50.0 / 100')).toHaveLength(2)
  expect(api.edit).not.toHaveBeenCalled()
})

it('checks history version when loading another page', async () => {
  vi.mocked(api.list).mockResolvedValueOnce({ items: [saved], next_cursor: '2026-09-01', history_version: 7 }).mockRejectedValueOnce(new ApiFailure('History changed. Refresh.', 409))
  mount()
  fireEvent.click(screen.getByRole('button', { name: 'Timeline' }))
  fireEvent.click(await screen.findByRole('button', { name: 'Load more dates' }))
  await screen.findByText('History changed. Refresh.')
  expect(vi.mocked(api.list).mock.calls[1][3]).toBe(7)
  expect(screen.getAllByRole('button', { name: 'Open 2026-09-01' })).toHaveLength(1)
})

it('shows missing pattern data explicitly with a table equivalent', async () => {
  mount(); fireEvent.click(screen.getByRole('button', { name: 'Patterns' }))
  await screen.findByText('Not enough data')
  expect(screen.getByText('Missing', { exact: true })).toBeInTheDocument()
  expect(screen.getByText('Not enough reports')).toBeInTheDocument()
  expect(api.save).not.toHaveBeenCalled()
})

it('discards a superseded patterns response', async () => {
  let resolve!: (value: Patterns) => void
  vi.mocked(api.patterns).mockImplementationOnce(() => new Promise(done => { resolve = done })).mockResolvedValueOnce(emptyPatterns)
  mount(); fireEvent.click(screen.getByRole('button', { name: 'Patterns' }))
  await waitFor(() => expect(api.patterns).toHaveBeenCalledTimes(1))
  fireEvent.change(screen.getByLabelText('Period ending'), { target: { value: '2026-09-07' } })
  await screen.findByText('Not enough data')
  await act(async () => resolve({ ...emptyPatterns, cooccurrence: 'STALE RESULT' }))
  expect(screen.queryByText('STALE RESULT')).not.toBeInTheDocument()
})

it('calculates a scenario explicitly without any history mutation and keeps its input snapshot', async () => {
  mount(); await openObservation()
  fireEvent.click(screen.getByRole('button', { name: 'Explore from this day' }))
  expect(api.scenario).not.toHaveBeenCalled()
  fireEvent.click(screen.getByRole('button', { name: 'Calculate scenario' }))
  await screen.findByRole('heading', { name: 'Your scenario, explained' })
  expect(api.scenario).toHaveBeenCalledWith(expect.objectContaining({ sleep_hours: 7, reported_strain: null }), 'csrf', 'c1', expect.any(AbortSignal))
  fireEvent.change(screen.getByLabelText(/Sleep duration/), { target: { value: '3' } })
  expect(screen.getByText('7 hours')).toBeInTheDocument()
  expect(api.save).not.toHaveBeenCalled(); expect(api.edit).not.toHaveBeenCalled(); expect(api.remove).not.toHaveBeenCalled()
})

it('requires typed confirmation with a freshly loaded version for history deletion', async () => {
  vi.mocked(api.me).mockResolvedValue({ ...user, history_version: 8 })
  mount(); fireEvent.click(screen.getByRole('button', { name: 'Settings' }))
  await waitFor(() => expect(api.me).toHaveBeenCalledTimes(1))
  await waitFor(() => expect(screen.getByRole('button', { name: 'Delete all history' })).not.toBeDisabled())
  fireEvent.click(screen.getByRole('button', { name: 'Delete all history' }))
  const confirm = await screen.findByRole('button', { name: 'Confirm delete history' })
  expect(confirm).toBeDisabled(); expect(api.clearHistory).not.toHaveBeenCalled()
  fireEvent.change(screen.getByLabelText('Type DELETE to confirm'), { target: { value: 'DELETE' } })
  fireEvent.click(confirm)
  await screen.findByText('All observations and revisions have been deleted.')
  expect(api.clearHistory).toHaveBeenCalledWith(8, expect.any(String), 'csrf', expect.any(AbortSignal))
})

it('requires a deliberate draft discard when changing sections', async () => {
  const confirm = vi.spyOn(window, 'confirm').mockReturnValue(false)
  mount()
  fireEvent.change(screen.getByLabelText(/Sleep duration/), { target: { value: '7' } })
  fireEvent.click(screen.getByRole('button', { name: 'Timeline' }))
  expect(confirm).toHaveBeenCalled()
  expect(screen.getByLabelText(/Sleep duration/)).toHaveValue('7')
  expect(api.list).not.toHaveBeenCalled()
})

it('expires the session instead of showing another account a late response', async () => {
  vi.mocked(api.list).mockRejectedValue(new ApiFailure('Sign in again', 401))
  mount(); fireEvent.click(screen.getByRole('button', { name: 'Timeline' }))
  await waitFor(() => expect(onExpired).toHaveBeenCalledTimes(1))
  expect(screen.queryByRole('button', { name: 'Open 2026-09-01' })).not.toBeInTheDocument()
})
