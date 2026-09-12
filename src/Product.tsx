import { NumericSlider } from './NumericSlider'
import { useCallback, useEffect, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { CalendarDays, LineChart, FlaskConical, History, Settings as SettingsIcon } from 'lucide-react'
import { api } from './api'
import { CheckInForm, Result } from './CheckIn'
import { fields, localDate, defaultValues } from './checkInFields'
import { PatternChart } from './Charts'
import { useRequest } from './useRequest'
import type { CheckIn, CheckInPage, CurrentUser, Inputs, Patterns, ScenarioResult } from './types'

type Screen = 'Today' | 'Timeline' | 'Patterns' | 'Explore' | 'Settings'
type SessionProps = { user: CurrentUser; onExpired: () => void }
const titles: Record<keyof Inputs, string> = { sleep_hours: 'Sleep duration', academic_load: 'Academic workload', screen_hours: 'Screen time', extracurricular_load: 'Other commitments', deadline_pressure: 'Deadline pressure', recovery: 'Recovery / relaxation', reported_strain: 'Self-reported strain' }
const icons = [CalendarDays, History, LineChart, FlaskConical, SettingsIcon]
const screenLabels: Record<Screen, string> = { Today: 'Check-in', Timeline: 'Stress history', Patterns: 'Stress trends', Explore: 'What-if', Settings: 'Account & settings' }
function offset(date: string, days: number) { const d = new Date(`${date}T12:00:00Z`); d.setUTCDate(d.getUTCDate() + days); return d.toISOString().slice(0, 10) }
function Status({ pending, error }: { pending: boolean; error: string }) { return <>{pending && <p className="notice" role="status">Working…</p>}{error && <p className="error" role="alert">{error}</p>}</> }

export function Product({ user, onExpired, onUser, onLogout, authPending = false }: SessionProps & { onUser: (user: CurrentUser | null) => void; onLogout?: () => void; authPending?: boolean }) {
  const [screen, setScreen] = useState<Screen>('Today')
  const [reference, setReference] = useState<CheckIn | undefined>()
  const dirty = useRef(false)
  const onDirty = useCallback((value: boolean) => { dirty.current = value }, [])
  function navigate(next: Screen) {
    if (next === screen) return
    if (dirty.current && !window.confirm('Leave this page and discard unsaved changes?')) return
    dirty.current = false
    setScreen(next)
  }
  return <>
    <nav className="product-nav" aria-label="Product">{(['Today', 'Timeline', 'Patterns', 'Explore', 'Settings'] as Screen[]).map((name, i) => {
      const Icon = icons[i]
      return <button key={name} aria-current={screen === name ? 'page' : undefined} onClick={() => navigate(name)}><Icon size={18} aria-hidden="true" />{screenLabels[name]}</button>
    })}</nav>
    {screen === 'Today' && <CheckInForm user={user} onExpired={onExpired} onDirty={onDirty} onSaved={value => onUser({ ...user, history_version: value.history_version })} />}
    {screen === 'Timeline' && <Timeline user={user} onExpired={onExpired} onDirty={onDirty} onExplore={value => { setReference(value); navigate('Explore') }} />}
    {screen === 'Patterns' && <PatternsScreen user={user} onExpired={onExpired} />}
    {screen === 'Explore' && <Explore user={user} onExpired={onExpired} reference={reference} />}
    {screen === 'Settings' && <SettingsScreen user={user} onExpired={onExpired} onUser={onUser} onDirty={onDirty} onLogout={onLogout} authPending={authPending} />}
  </>
}

function Timeline({ user, onExpired, onDirty, onExplore }: SessionProps & { onDirty: (value: boolean) => void; onExplore: (value: CheckIn) => void }) {
  const today = localDate(user.timezone)
  const [start, setStart] = useState(offset(today, -29))
  const [end, setEnd] = useState(today)
  const [range, setRange] = useState({ start, end })
  const [page, setPage] = useState<CheckInPage | null>(null)
  const [selected, setSelected] = useState<CheckIn | null>(null)
  const [editing, setEditing] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [revisions, setRevisions] = useState<{ items: CheckIn[]; next_cursor: number | null; history_version: number } | null>(null)
  const [oldRevision, setOldRevision] = useState<CheckIn | null>(null)
  const deleteAttempt = useRef<{ fingerprint: string; key: string } | null>(null)
  const { run, pending, error } = useRequest(onExpired)
  useEffect(() => { void run(signal => api.list(range.start, range.end, undefined, undefined, signal), setPage, true) }, [range, run])
  function refresh() { setSelected(null); setEditing(false); setRevisions(null); setOldRevision(null); setConfirmDelete(false); setPage(null); setRange({ start, end }) }
  function open(value: CheckIn) {
    setRevisions(null); setOldRevision(null); setConfirmDelete(false)
    void run(signal => api.get(value.id, signal), setSelected)
  }
  function remove() {
    if (!selected) return
    const fingerprint = `${selected.id}:${selected.revision}`
    if (deleteAttempt.current?.fingerprint !== fingerprint) deleteAttempt.current = { fingerprint, key: crypto.randomUUID() }
    void run(signal => api.remove(selected.id, selected.revision, deleteAttempt.current!.key, user.csrf_token, signal), () => refresh())
  }
  function loadRevisions(more = false) {
    if (!selected) return
    void run(signal => api.revisions(selected.id, more ? revisions?.next_cursor ?? undefined : undefined, more ? revisions?.history_version : undefined, signal), value => setRevisions(more && revisions ? { ...value, items: [...revisions.items, ...value.items] } : value))
  }
  return <>
    <section className="panel"><div className="eyebrow">Your stress over time</div><h2>Stress history</h2><p>Look back at each day’s stress estimate and reported strain. Open a check-in to understand its contributors or review revisions.</p>
      <form className="range-form" onSubmit={e => { e.preventDefault(); if (!editing && !pending) refresh() }}><label>From<input type="date" required value={start} disabled={editing || pending} onChange={e => setStart(e.target.value)} /></label><label>Through<input type="date" required min={start} max={today} value={end} disabled={editing || pending} onChange={e => setEnd(e.target.value)} /></label><button disabled={pending || editing}>Refresh history</button></form>
      <p className="small muted">Browse up to 366 days at a time. Dates stay in the timezone used when recorded.</p>
      <Status pending={pending} error={error} />
      {page && <><p className="small">Showing {range.start} through {range.end}</p>{page.items.length === 0 ? <div className="empty"><h3>No check-ins in this period</h3><p>Try another date range, or save your first stress check-in in Check-in.</p></div> : <div className="table-scroll"><table><caption>Saved stress estimates and reported strain · separate scales</caption><thead><tr><th>Date</th><th>Reported strain /10</th><th>Estimated stress /100</th><th>Revision</th><th>Details</th></tr></thead><tbody>{page.items.map(value => <tr key={value.id}><td>{value.observation_date}{value.retrospective && <small className="block">Retrospective</small>}</td><td>{value.inputs.reported_strain ?? 'Skipped'}</td><td>{value.assessment.score ?? 'Unavailable'}<small className="block">{value.assessment.model_version}</small></td><td>{value.revision}</td><td><button disabled={pending || editing} onClick={() => open(value)} aria-label={`Open ${value.observation_date}`}>Open</button></td></tr>)}</tbody></table></div>}
      {page.next_cursor && <button disabled={pending || editing} onClick={() => void run(signal => api.list(range.start, range.end, page.next_cursor!, page.history_version, signal), next => setPage({ ...next, items: [...page.items, ...next.items] }))}>Load more dates</button>}</>}
    </section>
    {selected && <>
      <div className="actions"><button disabled={pending} onClick={() => { if (!editing || window.confirm('Discard unsaved edits?')) { setEditing(!editing); setConfirmDelete(false) } }}>{editing ? 'Cancel editing' : 'Edit check-in'}</button><button disabled={pending || editing} onClick={() => { setConfirmDelete(!confirmDelete); setRevisions(null) }}>Delete check-in</button><button disabled={pending || editing} onClick={() => loadRevisions()}>View revisions</button><button disabled={pending || editing} onClick={() => onExplore(selected)}>Explore from this day</button><button disabled={pending || editing} onClick={() => open(selected)}>Reload latest revision</button></div>
      {confirmDelete && <section className="panel danger-zone"><h3>Delete {selected.observation_date}?</h3><p>This permanently deletes this observation and all {selected.revision} revisions. Your patterns will be recalculated. This cannot be undone.</p><button className="danger" disabled={pending} onClick={remove}>Confirm permanent deletion</button><button disabled={pending} onClick={() => setConfirmDelete(false)}>Keep check-in</button></section>}
      {editing ? <CheckInForm key={`${selected.id}:${selected.revision}`} user={user} onExpired={onExpired} initial={selected} onDirty={onDirty} onSaved={value => { setSelected(value); setEditing(false); setRevisions(null); setOldRevision(null); setPage(previous => previous ? { ...previous, history_version: value.history_version, items: previous.items.map(item => item.id === value.id ? value : item) } : null) }} /> : <><Result value={selected} /></>}
      {revisions && <section className="panel revision-panel"><h3>Immutable revisions</h3><p>Viewing an older revision does not restore or overwrite it.</p><div className="actions">{revisions.items.map(value => <button key={value.revision} disabled={pending} onClick={() => setOldRevision(value)}>View revision {value.revision}</button>)}{revisions.next_cursor && <button disabled={pending} onClick={() => loadRevisions(true)}>Older revisions</button>}</div>{oldRevision && <Result value={oldRevision} />}</section>}
    </>}
  </>
}

function PatternsScreen({ user, onExpired }: SessionProps) {
  const [end, setEnd] = useState(localDate(user.timezone))
  const [data, setData] = useState<Patterns | null>(null)
  const [metric, setMetric] = useState<keyof Inputs>('reported_strain')
  const { run, pending, error } = useRequest(onExpired)
  useEffect(() => { void run(signal => api.patterns(end, signal), setData, true) }, [end, run])
  return <section className="panel"><div className="eyebrow">How your stress changes</div><h2>Stress & routine trends</h2><p>Start with your reported strain, then explore workload, deadlines, and recovery. Compare your last 7 calendar days with the preceding 21. These patterns describe your records; they do not establish causes.</p>
    <label className="compact-field">Period ending<input type="date" value={end} max={localDate(user.timezone)} required onChange={e => { if (e.target.value) { setData(null); setEnd(e.target.value) } }} /></label><button disabled={pending} onClick={() => void run(signal => api.patterns(end, signal), setData)}>Refresh patterns</button><Status pending={pending} error={error} />
    {data && <><p className="notice">Recent: {data.windows.recent.join(' → ')} · Baseline: {data.windows.baseline.join(' → ')}</p><div className="pattern-grid">{data.metrics.map(item => <article key={item.id} className="metric-card"><h3>{titles[item.metric]}</h3><p className="small">{item.recent_count}/7 recent · {item.baseline_count}/21 baseline reports</p>{item.difference === null ? <><strong>Not enough data</strong><p>Needs at least 4 recent and 10 baseline reports for this measure.</p></> : <><strong>{item.difference > 0 ? '+' : ''}{item.difference.toFixed(2)} {item.metric.endsWith('hours') ? 'hours' : 'points'}</strong><p>Median {item.recent_median} recent versus {item.baseline_median} baseline.</p></>}{item.latest_deviation && <p>On {end}: unusually {item.latest_deviation} than your baseline.{item.persistent_deviation && ' Recorded in the same direction on three consecutive calendar days.'}</p>}<details><summary>Calculation & limits</summary><p>{item.rule}</p><p>Baseline MAD: {item.mad?.toFixed(2) ?? 'unavailable'} · deviation threshold: {item.threshold?.toFixed(2) ?? 'unavailable'}.</p><p>{item.limitation}</p></details></article>)}</div>
      {data.cooccurrence && <p className="notice">{data.cooccurrence}</p>}
      <label className="compact-field">Chart measure<select value={metric} onChange={e => setMetric(e.target.value as keyof Inputs)}>{Object.entries(titles).map(([key, name]) => <option key={key} value={key}>{name}</option>)}</select></label><PatternChart patterns={data} metric={metric} label={titles[metric]} />
      <details><summary>Accessible chart data table</summary><div className="table-scroll"><table><caption>{titles[metric]} · missing means unreported, never zero</caption><thead><tr><th>Calendar date</th><th>Observation</th><th>7-day mean</th></tr></thead><tbody>{data.series.map(row => <tr key={row.date}><td>{row.date}</td><td>{row.inputs?.[metric] ?? 'Missing'}</td><td>{row.rolling_mean[metric]?.toFixed(2) ?? 'Not enough reports'}</td></tr>)}</tbody></table></div></details><p className="small muted">Policy {data.policy_version}. Only latest revisions are included. Index trends are excluded so different heuristic versions are not treated as the same measurement.</p></>}
  </section>
}

function Explore({ user, onExpired, reference }: SessionProps & { reference?: CheckIn }) {
  const [validation, setValidation] = useState('')
  const [useReference, setUseReference] = useState(!!reference)
  const [values, setValues] = useState<Record<string, string>>(() => Object.fromEntries(fields.map(([key]) => [key, reference?.inputs[key] == null ? defaultValues[key] : String(reference.inputs[key])])))
  const [result, setResult] = useState<ScenarioResult | null>(null)
  const { run, pending, error } = useRequest(onExpired)
  function submit(event: FormEvent) {
    event.preventDefault()
    if (fields.some(([k, , , max, step]) => !values[k] || !Number.isFinite(Number(values[k])) || Number(values[k]) < 0 || Number(values[k]) > max || Number(values[k]) % step !== 0)) { setValidation('Choose a value for every routine slider before calculating.'); return }
    setValidation('')
    const inputs: Inputs = { deadline_pressure: Number(values.deadline_pressure), recovery: Number(values.recovery), sleep_hours: Number(values.sleep_hours), academic_load: Number(values.academic_load), screen_hours: Number(values.screen_hours), extracurricular_load: Number(values.extracurricular_load), reported_strain: null }
    void run(signal => api.scenario(inputs, user.csrf_token, useReference ? reference?.id : undefined, signal), setResult)
  }
  return <><section className="panel"><div className="eyebrow">Explore the stress calculation</div><h2>What if your routine changed?</h2><p>Change workload, sleep, or other pressures to explore a different stress estimate. Scenarios never save a check-in or change your history. Both sides use the same model.</p>
    <form onSubmit={submit}><fieldset disabled={pending}><legend className="sr-only">Hypothetical routine</legend>{reference && <label className="check-label"><input type="checkbox" checked={useReference} onChange={e => setUseReference(e.target.checked)} />Compare with the latest saved revision of {reference.observation_date}</label>}<div className="form-grid">{fields.map(([key, label, help, max, step, unit]) => <NumericSlider key={key} name={key} label={label} help={help} max={max} step={step} unit={unit} value={values[key]} onChange={v => setValues({ ...values, [key]: v })} />)}</div><button className="primary">Calculate scenario</button></fieldset></form>{validation && <p role="alert" className="error">{validation}</p>}<Status pending={pending} error={error} />
    <p className="small muted">To compare with a real day, open it in Timeline and choose Explore from this day. Changes to this form do not change a calculation already displayed below.</p></section>
    {result && <>{result.reference && <section className="panel result"><h3>Hypothetical comparison</h3><p>Saved reference revision {result.reference.revision}, recalculated with {result.assessment.model_version}. The original stored assessment is untouched.</p><dl className="saved-inputs">{fields.map(([key, label, , , , unit]) => <div key={key}><dt>Reference {label}</dt><dd>{result.reference!.inputs[key] == null ? 'Not recorded' : `${result.reference!.inputs[key]} ${unit}`}</dd></div>)}</dl><p>Reference stress estimate: {result.reference.assessment.score ?? 'Unavailable'} /100 · scenario: {result.assessment.score ?? 'Unavailable'} /100.</p><strong>{result.difference === null ? 'Comparison unavailable for these inputs' : `${result.difference > 0 ? '+' : ''}${result.difference.toFixed(1)} estimate points`}</strong><p>This is a change in a heuristic calculation, not an expected change in how you will feel.</p></section>}<Result hypothetical value={{ id: 'scenario', observation_date: '', timezone: user.timezone, revision: 0, recorded_at: '', retrospective: false, questionnaire_version: '', history_version: result.history_version, inputs: result.inputs, assessment: result.assessment }} /></>}
  </>
}

function download(blob: Blob) { const url = URL.createObjectURL(blob); const link = document.createElement('a'); link.href = url; link.download = 'student-stress-data.json'; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000) }

function ProfileForm({ user, onUser, onExpired, onDirty }: SessionProps & { onUser: (user: CurrentUser) => void; onDirty: (dirty: boolean) => void }) {
  const [name, setName] = useState(user.display_name ?? '')
  const [savedName, setSavedName] = useState(user.display_name ?? '')
  const [notice, setNotice] = useState('')
  const { run, pending, error } = useRequest(onExpired)
  const dirty = name !== savedName
  useEffect(() => {
    onDirty(dirty)
    const warn = (event: BeforeUnloadEvent) => { if (dirty) { event.preventDefault(); event.returnValue = '' } }
    window.addEventListener('beforeunload', warn)
    return () => { onDirty(false); window.removeEventListener('beforeunload', warn) }
  }, [dirty, onDirty])
  return <form className="account-profile" onSubmit={event => {
    event.preventDefault(); setNotice('')
    void run(signal => api.account(name.trim(), user.csrf_token, signal), updated => {
      setName(updated.display_name ?? ''); setSavedName(updated.display_name ?? ''); onUser(updated); setNotice('Display name saved.')
    })
  }} aria-busy={pending}>
    <fieldset disabled={pending}><label htmlFor="display-name">Display name</label><input id="display-name" autoComplete="nickname" maxLength={80} required value={name} onChange={e => { setName(e.target.value); setNotice('') }} aria-describedby="display-name-help" /><p id="display-name-help" className="small muted">How we address you here. This does not change your name on Google.</p><div className="actions"><button className="primary" disabled={!dirty || !name.trim()}>{pending ? 'Saving name…' : 'Save display name'}</button>{dirty && <button type="button" onClick={() => { setName(savedName); setNotice('') }}>Cancel name changes</button>}</div></fieldset>
    <Status pending={pending} error={error} />{notice && <p role="status" className="notice">{notice}</p>}
  </form>
}

function SettingsScreen({ user, onExpired, onUser, onDirty, onLogout, authPending }: SessionProps & { onUser: (user: CurrentUser | null) => void; onDirty: (dirty: boolean) => void; onLogout?: () => void; authPending: boolean }) {
  const [timezone, setTimezone] = useState(user.timezone)
  const [snapshot, setSnapshot] = useState<CurrentUser | null>(null)
  const [confirmation, setConfirmation] = useState('')
  const [action, setAction] = useState<'history' | 'account' | null>(null)
  const [notice, setNotice] = useState('')
  const attempt = useRef<{ version: number; key: string } | null>(null)
  const { run, pending, error } = useRequest(onExpired)
  useEffect(() => { void run(signal => api.me(signal), setSnapshot, true) }, [run])
  function prepare(next: 'history' | 'account') {
    setNotice(''); setAction(null); setConfirmation('')
    void run(signal => api.me(signal), latest => { setSnapshot(latest); setAction(next) })
  }
  function destroy(event: FormEvent) {
    event.preventDefault()
    if (!snapshot || confirmation !== 'DELETE') return
    if (action === 'account') void run(signal => api.deleteAccount(snapshot.history_version, user.csrf_token, signal), () => onUser(null))
    else {
      if (attempt.current?.version !== snapshot.history_version) attempt.current = { version: snapshot.history_version, key: crypto.randomUUID() }
      void run(signal => api.clearHistory(snapshot.history_version, attempt.current!.key, user.csrf_token, signal), result => { const updated = { ...user, history_version: result.history_version }; setSnapshot(updated); onUser(updated); setAction(null); setConfirmation(''); setNotice('All observations and revisions have been deleted.') })
    }
  }
  return <section className="panel"><div className="eyebrow">Your account</div><h2>Account & settings</h2>
    <div className="account-summary"><span className="account-avatar" aria-hidden="true">{(user.display_name?.trim() || 'S').slice(0, 1).toLocaleUpperCase()}</span><div><h3>{user.display_name || 'Your profile'}</h3><p className="small">Your profile and private stress records, in one place.</p></div>{onLogout && <button disabled={authPending} onClick={onLogout}>{authPending ? 'Signing out…' : 'Sign out of this account'}</button>}</div>
    {snapshot ? <><div className="account-email"><h3>Google email</h3><p>{snapshot.google_email || 'No Google email available for this session.'}</p><p className="small muted">{snapshot.google_email ? 'Provided by Google. To use another Google account, sign out and sign in with that account.' : 'If you previously signed in with Google, sign out and sign in again to refresh your profile. Local development accounts have no Google email.'}</p></div><ProfileForm user={snapshot} onUser={updated => { setSnapshot(updated); onUser(updated) }} onExpired={onExpired} onDirty={onDirty} /></> : <p role="status">{pending ? 'Loading your profile…' : 'Your profile could not be loaded.'}</p>}
    {!snapshot && !pending && <button onClick={() => void run(signal => api.me(signal), setSnapshot)}>Retry profile</button>}
    <hr /><h3>Check-in preferences</h3>
    <form onSubmit={e => { e.preventDefault(); setNotice(''); void run(signal => api.preferences(timezone, user.csrf_token, signal), value => { onUser({ ...user, ...value }); setNotice('Timezone saved. Existing observation dates and timezones remain unchanged.') }) }}><label className="compact-field">Timezone<select value={timezone} onChange={e => setTimezone(e.target.value)} disabled={pending}>{Array.from(new Set([user.timezone, 'Asia/Kolkata', 'Asia/Dhaka', 'Asia/Karachi', 'Asia/Dubai', 'Asia/Singapore', 'Asia/Tokyo', 'Australia/Sydney', 'Europe/London', 'Europe/Paris', 'Africa/Johannesburg', 'America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles', 'America/Sao_Paulo', 'UTC'])).map(zone => <option key={zone} value={zone}>{zone.replaceAll('_', ' ').replace('/', ' / ')}</option>)}</select></label><p className="small">Keeps your check-ins on the correct calendar day. Existing saved dates stay unchanged.</p><button disabled={pending}>Save timezone</button></form>
    <hr /><h3>Export your data</h3><p>Download JSON with every saved revision, its original assessment, dates, timezones, and model specifications. Session credentials are excluded.</p><button disabled={pending} onClick={() => { setNotice(''); void run(signal => api.exportData(signal), blob => { download(blob); setNotice('Your export is ready in your browser downloads.') }) }}>Download data export</button>
    <div className="danger-zone"><h3>Delete data</h3><p>Deletion is permanent. Export first if you want a copy. History deletion keeps your account; account deletion also revokes every session.</p><div className="actions"><button disabled={pending} onClick={() => prepare('history')}>Delete all history</button><button className="danger" disabled={pending} onClick={() => prepare('account')}>Delete account</button></div>
    {action && <form onSubmit={destroy}><p>{action === 'account' ? 'Permanently delete your account and all its data. A sign-in within the last 15 minutes is required.' : 'Permanently delete all observations and every revision. Minimal retry receipts remain to stop delayed saves recreating deleted records.'}</p><label>Type DELETE to confirm<input value={confirmation} onChange={e => setConfirmation(e.target.value)} autoComplete="off" disabled={pending} /></label><div className="actions"><button className="danger" disabled={pending || confirmation !== 'DELETE'}>Confirm delete {action}</button><button type="button" disabled={pending} onClick={() => setAction(null)}>Cancel deletion</button></div></form>}</div>
    <Status pending={pending} error={error} />{notice && <p className="notice" role="status">{notice}</p>}<p className="small muted">Saving and calculation require a connection. This app does not synchronize offline drafts or import the old calculator’s local browser history.</p>
  </section>
}
