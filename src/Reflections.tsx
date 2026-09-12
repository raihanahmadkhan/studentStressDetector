import { useEffect, useRef, useState } from 'react'
import type { AIStatus, CurrentUser, Reflection, ReflectionSource } from './types'
import { api } from './api'
import { useRequest } from './useRequest'

const reasons: Record<string, string> = {
  provider_unconfigured: 'The LLM provider is not configured. This reflection uses verified templates.',
  consent_required: 'External AI is off for your account. This reflection stays within this application.',
  rate_limited: 'The AI request limit has been reached or a request is already running. Verified facts remain available.',
  request_already_reserved: 'This request was already attempted. A verified fallback avoids a duplicate provider call.',
  provider_unavailable_or_invalid: 'The AI response was unavailable or failed validation. Verified templates are shown instead.',
}

export function ReflectionPanel({ source, user, onExpired }: { source: ReflectionSource; user: CurrentUser; onExpired: () => void }) {
  const [result, setResult] = useState<Reflection | null>(null)
  const key = useRef(crypto.randomUUID())
  const { run, pending, error } = useRequest(onExpired)
  return <section className="reflection-panel" aria-label="Grounded reflection"><h3>A moment to reflect</h3>
    <p>Review trusted facts and a few reflection questions. Optional AI selects the highlights; the backend supplies every factual statement and number.</p>
    <button disabled={pending} onClick={() => void run(signal => api.reflect(source, key.current, user.csrf_token, signal), setResult)}>{pending ? 'Preparing reflection…' : 'Prepare grounded reflection'}</button>
    {!user.llm_consent && <p className="small muted">External AI is off. You can review its data-sharing controls in Settings. Verified templates work without it.</p>}
    {pending && <p role="status">Preparing a reflection from this source snapshot…</p>}{error && <p className="error" role="alert">{error}</p>}
    {result && <div aria-live="polite"><p className="eyebrow">{result.status === 'grounded' ? 'AI-selected · backend-verified wording' : 'Verified template fallback'}</p>{result.status === 'fallback' && <p className="notice">{reasons[result.reason ?? ''] ?? 'A verified template is shown.'}</p>}
      <ol className="reflection-list">{result.output.highlights.map(item => <li key={item.evidence_id}><p>{item.text}</p><p><strong>Reflect:</strong> {item.reflection}</p><small>Evidence {item.evidence_id}</small></li>)}</ol>
      <details><summary>Evidence and provenance</summary><p>History version {result.history_version} · {result.prompt_version} · {result.model_version}</p>{result.evidence.map(fact => <p key={fact.id}><strong>{fact.id}:</strong> {fact.text}</p>)}<p className="provenance">Source hash: {result.source_hash}</p></details><p className="small muted">{result.output.limitation}</p></div>}
  </section>
}

export function AIControls({ user, onUser, onExpired }: { user: CurrentUser; onUser: (user: CurrentUser) => void; onExpired: () => void }) {
  const [status, setStatus] = useState<AIStatus | null>(null)
  const [agree, setAgree] = useState(false)
  const { run, pending, error } = useRequest(onExpired)
  useEffect(() => { void run(signal => api.aiStatus(signal), setStatus, true) }, [run])
  function change(enabled: boolean) {
    void run(signal => api.aiConsent(enabled, user.csrf_token, signal), value => { onUser({ ...user, llm_consent: value.consent }); setStatus(previous => previous ? { ...previous, consent: value.consent } : previous); setAgree(false) })
  }
  return <section className="reflection-panel"><h3>Optional AI reflections</h3><p>AI is used only when you explicitly request a reflection. If enabled, a small bundle of your routine/strain facts, observation dates, rule results, or period summaries is sent to OpenAI. Account identifiers, credentials, and raw free-text notes are excluded.</p>
    <p className="small">The application requests no response storage, but that is not a guarantee of zero provider retention. Review <a href="https://developers.openai.com/api/docs/guides/your-data" target="_blank" rel="noreferrer">OpenAI’s data controls</a> before enabling. Revoking consent deletes stored reflections and discards in-flight results; it cannot retract a request already sent to the provider.</p>
    {status && <><p>{status.configured ? `Configured model: ${status.model}. Limits: ${status.hourly_limit}/hour and ${status.daily_limit}/day per account.` : 'No provider is configured. Verified template reflections remain available.'}</p>{status.consent ? <button disabled={pending} onClick={() => change(false)}>Revoke AI consent and delete reflections</button> : <><label className="check-label"><input type="checkbox" checked={agree} disabled={pending || !status.configured} onChange={e => setAgree(e.target.checked)} />I agree to send these fact bundles to OpenAI when I request an AI reflection.</label><button disabled={!agree || pending || !status.configured} onClick={() => change(true)}>Enable optional AI reflections</button></>}</>}
    {pending && <p role="status">Checking AI settings…</p>}{error && <p className="error" role="alert">{error}</p>}
    <h3>Predictive ML</h3><p>Predictions are disabled. A personal next-day strain model needs at least 120 eligible day pairs across 150 days, leakage-safe evaluation against two baselines, and review before serving. No training labels are invented from the fuzzy index.</p>
  </section>
}
