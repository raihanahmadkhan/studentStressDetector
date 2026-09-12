import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { useState } from 'react'
import { NumericSlider } from './NumericSlider'
import { CheckInForm, Result } from './CheckIn'
import { api } from './api'
import type { CheckIn, CurrentUser } from './types'
vi.mock('./api', () => ({ api: { save: vi.fn(), edit: vi.fn() }, failure: vi.fn() }))
const user: CurrentUser = { id: 'one', timezone: 'UTC', history_version: 0, csrf_token: 'csrf', llm_consent: false }

function Slider() {
  const [value, setValue] = useState('')
  return <NumericSlider name="sleep_hours" label="Sleep duration" help="Hours asleep" max={12} step={.25} unit="hours" value={value} onChange={setValue} />
}
describe('explicit slider observations', () => {
  it('labels a native keyboard-operable range and does not assume its midpoint was reported', () => {
    render(<Slider />)
    const slider = screen.getByRole('slider', { name: 'Sleep duration' })
    expect(slider).toHaveAttribute('min', '0')
    expect(slider).toHaveAttribute('max', '12')
    expect(slider).toHaveAttribute('step', '0.25')
    expect(slider).toHaveAccessibleDescription('Hours asleep')
    expect(screen.getByText('Choose a value')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Use 6h' }))
    expect(slider).toHaveAttribute('aria-valuetext', '6h')
    fireEvent.change(slider, { target: { value: '8.25' } })
    expect(screen.getByText('8h 15m')).toBeInTheDocument()
    expect(slider).toHaveValue('8.25')
  })
  it('requires six routine values and an explicit strain choice; slider changes never save', () => {
    render(<CheckInForm user={user} onExpired={vi.fn()} />)
    expect(screen.getAllByRole('slider')).toHaveLength(7)
    fireEvent.click(screen.getByRole('button', { name: 'Save check-in' }))
    expect(screen.getByRole('alert')).toHaveTextContent('Choose a value for every routine slider')
    fireEvent.change(screen.getByRole('slider', { name: 'Deadline pressure' }), { target: { value: '9' } })
    fireEvent.change(screen.getByRole('slider', { name: 'Recovery / relaxation' }), { target: { value: '2' } })
    expect(api.save).not.toHaveBeenCalled()
    expect(api.edit).not.toHaveBeenCalled()
  })
  it('shows backend component explanations without inventing a final centroid', () => {
    const value: CheckIn = { id: 'one', observation_date: '2026-09-12', timezone: 'UTC', revision: 1, recorded_at: '2026-09-12T10:00:00Z', retrospective: false, questionnaire_version: 'check-in-2.0.0', history_version: 1,
      inputs: { sleep_hours: 6, academic_load: 5, deadline_pressure: 5, screen_hours: 8, extracurricular_load: 5, recovery: 5, reported_strain: null },
      assessment: { status: 'ok', raw_centroid: null, raw_score: 50, score: 50, category: 'Moderate', model_version: 'fuzzy-3.0.0', spec_hash: 'verified', memberships: {}, rules: [], aggregate: { universe: [], membership: [] }, reason: null, limitations: [],
        components: [{ id: 'academic_pressure', label: 'Academic pressure', raw_centroid: 50, weight: .45, contribution: 22.5, explanation: 'Trusted academic explanation from backend.', rules: [], aggregate: { universe: [], membership: [] } }] } }
    render(<Result value={value} />)
    expect(screen.getByText('Trusted academic explanation from backend.')).toBeInTheDocument()
    expect(screen.getByText(/weighted sum of the three unrounded/)).toBeInTheDocument()
  })
})
