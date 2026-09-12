import { useEffect, useId, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { ArrowRight, Check, ShieldCheck } from 'lucide-react'
import { api, failure } from './api'
import type { CheckIn, CurrentUser, Submission } from './types'
import { FuzzyChart } from './Charts'
import { fields, localDate } from './checkInFields'
import { NumericSlider } from './NumericSlider'
import { ReflectionPanel } from './Reflections'

export function Result({ value, hypothetical = false }: { value: CheckIn; hypothetical?: boolean }) {
  const headingId = useId()
  const result = value.assessment
  const fired = result.rules.filter(rule => rule.firing_strength > 0)
  return <section className="panel result" aria-labelledby={headingId}>
    <div className="eyebrow"><Check size={16} aria-hidden="true" /> {hypothetical ? 'Hypothetical scenario · never saved' : `Saved stress check-in · ${value.observation_date}`}</div>
    <h2 id={headingId}>{hypothetical ? 'Your scenario stress estimate' : 'Your stress estimate, explained'}</h2>
    <p>{hypothetical ? 'This calculation describes only the scenario values below.' : `This result belongs to revision ${value.revision} of the saved values below. Recorded ${new Date(value.recorded_at).toLocaleString()} in ${value.timezone}${value.retrospective ? ' · retrospective report' : ''}.`}</p>
    <div className="scores">
      <div className="stress-score"><span>Estimated stress</span><strong>{result.status === 'ok' ? `${result.score?.toFixed(1)} / 100` : 'Unavailable'}</strong><small>{result.status === 'ok' ? `${result.category} · routine-based estimate` : 'No numerical stress estimate'}</small></div>
      <div><span>Your reported strain</span><strong>{hypothetical ? 'Not estimated' : value.inputs.reported_strain === null ? 'Skipped' : `${value.inputs.reported_strain} / 10`}</strong><small>{hypothetical ? 'Scenarios cannot predict your feelings' : 'Your own report'}</small></div>
    </div>
    {result.status === 'ok' && !!result.components?.length && <section className="stress-contributors" aria-label="Contributors to the stress estimate"><h3>What contributes to this estimate?</h3><p>These are contributions to the model score, not proven causes of your stress.</p><div className="contributor-grid">{result.components.map(component => <article key={component.id}><h4>{component.label}</h4><strong>{component.contribution.toFixed(1)} <small>of 100 points</small></strong><p>{component.explanation}</p></article>)}</div></section>}
    {result.status !== 'ok' && <p className="notice">{result.status === 'unsupported'
      ? `This model requires all six routine inputs within its supported ranges. Older observations may not contain the new inputs. ${hypothetical ? 'The scenario inputs have not been clipped or saved.' : 'Your genuine observation is saved; the inputs have not been clipped.'}`
      : hypothetical ? 'The scenario could not be calculated. No observation was saved.' : 'The baseline could not be calculated. Your observation is safely saved.'}</p>}
    <dl className="saved-inputs">{fields.map(([name, label, , , , unit]) => <div key={name}><dt>{label}</dt><dd>{value.inputs[name] == null ? 'Not recorded' : `${value.inputs[name]} ${unit}`}</dd></div>)}</dl>
    <details><summary>See the fuzzy rules and calculation</summary>
      <p>Model {result.model_version}. {result.components?.length ? 'Each component multiplies input memberships, scales symmetric output sets, sums them, and calculates their centroid. The final index blends these component scores using the recorded weights.' : 'Rules combine input memberships with minimum, clip output sets, aggregate with maximum, then calculate their centroid.'}</p>
      <p>A firing strength is a membership degree, not a confidence probability or an additive contribution.</p>
      {result.status === 'ok' && <>{result.components?.length ? <><p>The final index is a weighted sum of the three unrounded component centroids: {result.raw_score?.toFixed(4)}, rounded to {result.score?.toFixed(1)}. Higher recovery deficit means less recovery.</p>{result.components.map(component => <section key={component.id}><h3>{component.label}</h3><p>Component centroid: {component.raw_centroid.toFixed(4)} · weight: {component.weight}.</p><FuzzyChart assessment={component} /></section>)}</> : <><FuzzyChart assessment={result} /><p>The centroid is {result.raw_centroid?.toFixed(4)}, rounded to {result.score?.toFixed(1)}.</p></>}<p> Index bands use the rounded score: below 25 very low, below 45 low, below 65 moderate, below 85 high, otherwise very high.</p><div className="table-scroll"><table><caption>Fuzzification: membership of each observed input</caption><thead><tr><th>Input</th><th>Memberships (0–1)</th></tr></thead><tbody>{Object.entries(result.memberships).map(([name, terms]) => <tr key={name}><td>{name.replaceAll('_', ' ')}</td><td>{Object.entries(terms).map(([term, degree]) => `${term}: ${degree.toFixed(3)}`).join('; ')}</td></tr>)}</tbody></table></div></>}
      {fired.length > 0 ? <div className="table-scroll"><table><caption>Actual activated rules ({fired.length} of {result.rules.length})</caption><thead><tr><th>Rule</th><th>Input memberships</th><th>Output term</th><th>Strength</th></tr></thead><tbody>{fired.map(rule => <tr key={rule.id}><td>{rule.id}</td><td>{rule.antecedents.map(term => `${term.variable.replaceAll('_', ' ')}: ${term.term} (${term.degree.toFixed(3)})`).join(' AND ')}</td><td>{rule.consequent.replaceAll('_', ' ')}</td><td>{rule.firing_strength.toFixed(3)}</td></tr>)}</tbody></table></div> : <p>No numerical inference is available for this observation.</p>}
      <p className="provenance">Specification: {result.spec_hash}</p>
    </details>
    <p className="muted">This stress estimate uses authored fuzzy rules. It is not a clinically validated measurement, diagnosis, or proof of what causes your stress.</p>
  </section>
}

export function CheckInForm({ user, onExpired, initial, onSaved, onDirty }: { user: CurrentUser; onExpired: () => void; initial?: CheckIn; onSaved?: (value: CheckIn) => void; onDirty?: (dirty: boolean) => void }) {
  const [date, setDate] = useState(() => initial?.observation_date ?? localDate(user.timezone))
  const [values, setValues] = useState<Record<string, string>>(() => initial ? Object.fromEntries(Object.entries(initial.inputs).map(([k, v]) => [k, v === null ? (k === 'reported_strain' ? 'skip' : '') : String(v)])) : { ...Object.fromEntries(fields.map(([k]) => [k, ''])), reported_strain: '' })
  const [result, setResult] = useState<CheckIn | null>(null)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')
  const [dirty, setDirty] = useState(false)
  const attempt = useRef<{ fingerprint: string; key: string } | null>(null)
  const operation = useRef(0)
  const controller = useRef<AbortController | null>(null)
  const busy = useRef(false)
  useEffect(() => { onDirty?.(dirty); return () => onDirty?.(false) }, [dirty, onDirty])

  useEffect(() => () => { operation.current += 1; controller.current?.abort() }, [])
  useEffect(() => {
    const warn = (event: BeforeUnloadEvent) => { if (dirty) { event.preventDefault(); event.returnValue = '' } }
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [dirty])

  function changed(name: string, value: string) {
    setValues(previous => ({ ...previous, [name]: value }))
    setDirty(true)
    setInfo('')
  }

  async function submit(event: FormEvent) {
    event.preventDefault()
    if (busy.current) return
    if (fields.some(([k, , , max, step]) => !values[k] || !Number.isFinite(Number(values[k])) || Number(values[k]) < 0 || Number(values[k]) > max || Number(values[k]) % step !== 0) || !values.reported_strain) { setError('Choose a value for every routine slider and report your strain or explicitly skip it.'); return }
    const payload: Submission = {
      observation_date: date, timezone: user.timezone,
      sleep_hours: Number(values.sleep_hours), academic_load: Number(values.academic_load),
      deadline_pressure: Number(values.deadline_pressure), recovery: Number(values.recovery),
      screen_hours: Number(values.screen_hours), extracurricular_load: Number(values.extracurricular_load),
      reported_strain: values.reported_strain === 'skip' ? null : Number(values.reported_strain),
    }
    const fingerprint = JSON.stringify(payload)
    if (attempt.current?.fingerprint !== fingerprint) attempt.current = { fingerprint, key: crypto.randomUUID() }
    busy.current = true
    setPending(true); setError(''); setInfo('')
    const generation = ++operation.current
    controller.current?.abort()
    controller.current = new AbortController()
    try {
      const saved = initial ? await api.edit(initial.id, { deadline_pressure: payload.deadline_pressure, recovery: payload.recovery, sleep_hours: payload.sleep_hours, academic_load: payload.academic_load, screen_hours: payload.screen_hours, extracurricular_load: payload.extracurricular_load, reported_strain: payload.reported_strain }, initial.revision, attempt.current.key, user.csrf_token, controller.current.signal) : await api.save(payload, attempt.current.key, user.csrf_token, controller.current.signal)
      if (generation !== operation.current) return
      setResult(saved); setDirty(false)
      setInfo('Your check-in is saved in your account.')
      onSaved?.(saved)
    } catch (error) {
      if (generation !== operation.current) return
      const issue = failure(error)
      if (issue.status === 401) { onExpired(); return }
      setError(issue.message + (issue.status === undefined || issue.status >= 500 ? ' If you retry unchanged values, the same request key prevents a duplicate save.' : ''))
    } finally {
      if (generation === operation.current) { busy.current = false; setPending(false) }
    }
  }

  async function loadSaved() {
    if (busy.current) return
    busy.current = true; setPending(true); setError(''); setInfo('')
    const generation = ++operation.current
    controller.current?.abort(); controller.current = new AbortController()
    try {
      const saved = await api.loadDate(date, controller.current.signal)
      if (generation !== operation.current) return
      setResult(saved)
      setInfo(saved ? 'Loaded the saved observation. The form above is unchanged.' : 'No saved check-in exists for this date.')
    } catch (error) {
      if (generation !== operation.current) return
      const issue = failure(error)
      if (issue.status === 401) onExpired()
      else setError(issue.message)
    } finally {
      if (generation === operation.current) { busy.current = false; setPending(false) }
    }
  }

  return <>
    <div className="workspace">
      <section className="panel" aria-labelledby="checkin-heading">
        <div className="eyebrow">Your daily stress assessment</div>
        <h2 id="checkin-heading">{initial ? `Edit ${initial.observation_date} · revision ${initial.revision}` : 'Your daily stress check-in'}</h2>
        <p>Describe your workload, pressures, and recovery to estimate stress for this day. Then record how strained you felt. Only Save check-in saves your answers and result.</p>
        <form onSubmit={submit} aria-busy={pending}>
          <fieldset disabled={pending}>
            <legend className="sr-only">Daily stress check-in</legend>
            <label htmlFor="observation-date">Check-in date</label>
            <input id="observation-date" type="date" required disabled={!!initial} max={localDate(user.timezone)} value={date} onChange={event => { setDate(event.target.value); setDirty(true); setInfo('') }} />
            <small>Calendar dates use {initial?.timezone ?? user.timezone}. Earlier dates are marked retrospective.</small>
            <div className="form-grid">{fields.map(([name, label, help, max, step, unit]) => <NumericSlider key={name} name={name} label={label} help={help} max={max} step={step} unit={unit} value={values[name] ?? ''} onChange={v => changed(name, v)} />)}</div>
            <div className="strain-field"><NumericSlider name="reported_strain" label="How strained did you feel on this day?" help="Your experience matters. This report stays separate from the stress estimate and never changes its calculation. You can skip it." max={10} step={1} unit="/ 10" value={values.reported_strain} onChange={v => changed('reported_strain', v)} />
              <button type="button" aria-pressed={values.reported_strain === 'skip'} onClick={() => changed('reported_strain', 'skip')}>Prefer to skip</button>
            </div>
            <div className="actions"><button className="primary" type="submit">{pending ? 'Working…' : initial ? 'Save revision' : 'Save check-in'} <ArrowRight size={17} aria-hidden="true" /></button>{!initial && <button type="button" onClick={loadSaved}>Load saved check-in</button>}</div>
          </fieldset>
        </form>
        {error && <p className="error" role="alert">{error}</p>}
        {info && <p className="notice" role="status">{info}</p>}
        <p className="muted small">Unsaved values stay only in this tab and are lost on reload. Saving requires a connection. One check-in is allowed per calendar day.</p>
      </section>
      <aside className="side-note"><ShieldCheck size={25} aria-hidden="true" /><h2>What shapes your stress estimate?</h2><p>Six routine inputs form three components. The result shows how much each contributes to the estimated stress score.</p><ol><li>Academic pressure: workload and deadlines.</li><li>Recovery deficit: sleep and relaxation.</li><li>Contextual pressure: screen time and other commitments.</li></ol><p className="muted">Your reported strain is shown alongside the estimate. A rule-based score cannot capture everything you feel.</p></aside>
    </div>
    {result && <><Result value={result} /><ReflectionPanel key={`${result.id}:${result.revision}:${result.history_version}`} source={{ kind: 'checkin', checkin_id: result.id, expected_history_version: result.history_version }} user={user} onExpired={onExpired} /></>}
  </>
}
