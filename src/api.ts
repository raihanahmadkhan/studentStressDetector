import axios from 'axios'
import type { AIStatus, Reflection, ReflectionSource } from './types'
import type { AuthConfig, CheckIn, CheckInPage, CurrentUser, Submission, Inputs, Patterns, ScenarioResult } from './types'

const http = axios.create({ baseURL: '/api', timeout: 12000, withCredentials: true })

export class ApiFailure extends Error {
  constructor(message: string, public status?: number, public code?: string) {
    super(message)
  }
}

export function failure(error: unknown): ApiFailure {
  if (error instanceof ApiFailure) return error
  if (axios.isAxiosError(error)) {
    const body = error.response?.data?.error
    const fields = Array.isArray(body?.fields)
      ? body.fields.map((field: { message?: string }) => field.message).filter(Boolean).join(' ')
      : ''
    return new ApiFailure(
      [body?.message, fields].filter(Boolean).join(' ') || 'The server could not confirm this request. Keep your values and retry.',
      error.response?.status, body?.code,
    )
  }
  return new ApiFailure('The response could not be read. Please retry.')
}

function checkInContract(value: CheckIn): CheckIn {
  const assessment = value?.assessment
  if (!value?.id || !value.inputs || !assessment || !Array.isArray(assessment.rules)
      || !['ok', 'unsupported', 'error'].includes(assessment.status)
      || (assessment.status === 'ok' && (typeof assessment.score !== 'number' || !Number.isFinite(assessment.score)))) {
    throw new ApiFailure('The server returned an unexpected assessment. Please reload before continuing.')
  }
  return value
}

export const api = {
  async account(displayName: string, csrf: string, signal?: AbortSignal) {
    return (await http.patch<CurrentUser>('/account', { display_name: displayName }, { headers: { 'X-CSRF-Token': csrf }, signal })).data
  },
  async aiStatus(signal?: AbortSignal) { return (await http.get<AIStatus>('/ai/status', { signal })).data },
  async aiConsent(enabled: boolean, csrf: string, signal?: AbortSignal) { return (await http.patch<{ consent: boolean }>('/ai/consent', { enabled }, { headers: { 'X-CSRF-Token': csrf }, signal })).data },
  async reflect(source: ReflectionSource, key: string, csrf: string, signal?: AbortSignal) {
    const value = (await http.post<Reflection>('/ai/reflections', source, { timeout: 20000, headers: { 'Idempotency-Key': key, 'X-CSRF-Token': csrf }, signal })).data
    if (!value?.output || !Array.isArray(value.evidence) || !Array.isArray(value.output.highlights) || !['grounded', 'fallback'].includes(value.status) || value.history_version !== source.expected_history_version) throw new ApiFailure('Unexpected reflection. Reload its source before continuing.')
    return value
  },
  async list(start: string, end: string, cursor?: string, version?: number, signal?: AbortSignal) {
    const result = (await http.get<CheckInPage>('/check-ins', { params: { start_date: start, end_date: end, cursor, expected_history_version: version }, signal })).data
    result.items.forEach(checkInContract)
    return result
  },
  async get(id: string, signal?: AbortSignal) { return checkInContract((await http.get<CheckIn>(`/check-ins/${id}`, { signal })).data) },
  async edit(id: string, inputs: Inputs, revision: number, key: string, csrf: string, signal?: AbortSignal) {
    return checkInContract((await http.patch<CheckIn>(`/check-ins/${id}`, { ...inputs, expected_revision: revision }, { headers: { 'Idempotency-Key': key, 'X-CSRF-Token': csrf }, signal })).data)
  },
  async remove(id: string, revision: number, key: string, csrf: string, signal?: AbortSignal) {
    return (await http.delete<{ deleted: true; history_version: number }>(`/check-ins/${id}`, { data: { expected_revision: revision }, headers: { 'Idempotency-Key': key, 'X-CSRF-Token': csrf }, signal })).data
  },
  async revisions(id: string, before?: number, version?: number, signal?: AbortSignal) {
    return (await http.get<{ items: CheckIn[]; next_cursor: number | null; history_version: number }>(`/check-ins/${id}/revisions`, { params: { before, expected_history_version: version }, signal })).data
  },
  async patterns(end: string, signal?: AbortSignal) { return (await http.get<Patterns>('/patterns', { params: { end_date: end }, signal })).data },
  async scenario(inputs: Inputs, csrf: string, reference_id?: string, signal?: AbortSignal) {
    return (await http.post<ScenarioResult>('/scenarios', { inputs, reference_id }, { headers: { 'X-CSRF-Token': csrf }, signal })).data
  },
  async preferences(timezone: string, csrf: string, signal?: AbortSignal) {
    return (await http.patch<{ timezone: string; history_version: number }>('/settings', { timezone }, { headers: { 'X-CSRF-Token': csrf }, signal })).data
  },
  async exportData(signal?: AbortSignal) { return (await http.get<Blob>('/data/export', { responseType: 'blob', timeout: 60000, signal })).data },
  async clearHistory(version: number, key: string, csrf: string, signal?: AbortSignal) {
    return (await http.delete<{ history_version: number }>('/data/history', { data: { expected_history_version: version, confirmation: 'DELETE' }, headers: { 'Idempotency-Key': key, 'X-CSRF-Token': csrf }, signal })).data
  },
  async deleteAccount(version: number, csrf: string, signal?: AbortSignal) {
    await http.delete('/data/account', { data: { expected_history_version: version, confirmation: 'DELETE' }, headers: { 'X-CSRF-Token': csrf }, signal })
  },
  async config(signal?: AbortSignal) {
    const value = (await http.get<AuthConfig>('/auth/config', { signal })).data
    if (typeof value?.oidc_enabled !== 'boolean' || typeof value?.dev_login_enabled !== 'boolean') {
      throw new ApiFailure('The sign-in service returned an unexpected response. Please try again later.')
    }
    return value
  },
  async me(signal?: AbortSignal) {
    const value = (await http.get<CurrentUser>('/me', { signal })).data
    if (typeof value?.id !== 'string' || !value.id || typeof value.csrf_token !== 'string' || !value.csrf_token
        || typeof value.timezone !== 'string' || !Number.isInteger(value.history_version)
        || value.history_version < 0 || typeof value.llm_consent !== 'boolean') {
      throw new ApiFailure('Your session could not be verified. Please reload and try again.')
    }
    return value
  },
  async devLogin() {
    return (await http.post<CurrentUser>('/auth/dev-login')).data
  },
  async logout(csrf: string) {
    await http.post('/auth/logout', undefined, { timeout: 20000, headers: { 'X-CSRF-Token': csrf } })
  },
  async save(payload: Submission, key: string, csrf: string, signal?: AbortSignal) {
    const response = await http.post<CheckIn>('/check-ins', payload, {
      headers: { 'Idempotency-Key': key, 'X-CSRF-Token': csrf }, signal,
    })
    return checkInContract(response.data)
  },
  async loadDate(date: string, signal?: AbortSignal): Promise<CheckIn | null> {
    const response = await http.get<CheckInPage>('/check-ins', {
      params: { start_date: date, end_date: date, limit: 1 }, signal,
    })
    return response.data.items.map(checkInContract)[0] ?? null
  },
}
