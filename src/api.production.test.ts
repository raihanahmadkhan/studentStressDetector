import axios, { type Axios } from 'axios'
import { afterEach, expect, it, vi } from 'vitest'
import { api } from './api'

afterEach(() => vi.restoreAllMocks())

it('uses same-origin API paths and retains credentials and CSRF on logout', async () => {
  const request = vi.spyOn(axios.Axios.prototype, 'request').mockResolvedValue({ data: { id: 'test', csrf_token: 'test-csrf', timezone: 'UTC', history_version: 0, llm_consent: false } })
  await api.me()
  await api.logout('test-csrf')
  const [read, logout] = request.mock.calls.map(([config]) => config)
  expect(read.url).toBe('/me')
  expect(logout.url).toBe('/auth/logout')
  expect(logout.headers).toEqual(expect.objectContaining({ 'X-CSRF-Token': 'test-csrf' }))
  const instance = request.mock.instances[0] as Axios
  expect(instance.defaults.baseURL).toBe('/api')
  expect(instance.defaults.withCredentials).toBe(true)
})

it('rejects frontend HTML returned in place of authentication JSON', async () => {
  vi.spyOn(axios.Axios.prototype, 'request').mockResolvedValue({ data: '<!doctype html><html><body>Vite</body></html>' })
  await expect(api.me()).rejects.toThrow('Your session could not be verified')
  await expect(api.config()).rejects.toThrow('The sign-in service returned an unexpected response')
})
