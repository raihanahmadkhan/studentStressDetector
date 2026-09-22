import axios, { AxiosError, type AxiosResponse } from 'axios'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { api } from './api'

const user = { id: 'existing-student', csrf_token: 'existing-csrf', timezone: 'UTC', history_version: 0, llm_consent: false }
const unavailable = (status: number) => new AxiosError('Unavailable', 'ERR_BAD_RESPONSE', undefined, undefined, { status } as AxiosResponse)

beforeEach(() => vi.useFakeTimers())
afterEach(() => { vi.useRealTimers(); vi.restoreAllMocks() })

it('restores the existing session after timeouts and proxy startup failures', async () => {
  const request = vi.spyOn(axios.Axios.prototype, 'request')
    .mockRejectedValueOnce(new AxiosError('Timeout', 'ECONNABORTED'))
    .mockRejectedValueOnce(unavailable(502))
    .mockRejectedValueOnce(unavailable(503))
    .mockResolvedValue({ data: user })
  const restored = api.me(new AbortController().signal, true)
  await vi.runAllTimersAsync()
  await expect(restored).resolves.toEqual(user)
  expect(request).toHaveBeenCalledTimes(4)
  expect(request.mock.calls.every(([config]) => config.url === '/me' && config.method === 'get')).toBe(true)
})

it('recovers sign-in configuration after a temporary network failure', async () => {
  const config = { oidc_enabled: true, dev_login_enabled: false }
  const request = vi.spyOn(axios.Axios.prototype, 'request')
    .mockRejectedValueOnce(new AxiosError('Offline', 'ERR_NETWORK'))
    .mockResolvedValue({ data: config })
  const restored = api.config(undefined, true)
  await vi.runAllTimersAsync()
  await expect(restored).resolves.toEqual(config)
  expect(request).toHaveBeenCalledTimes(2)
})

it.each([401, 403, 404, 429])('does not retry HTTP %i as a connection problem', async status => {
  const request = vi.spyOn(axios.Axios.prototype, 'request').mockRejectedValue(unavailable(status))
  await expect(api.me(undefined, true)).rejects.toMatchObject({ response: { status } })
  expect(request).toHaveBeenCalledTimes(1)
  expect(vi.getTimerCount()).toBe(0)
})

it('stops a persistent outage within the startup recovery budget', async () => {
  const started = Date.now()
  const request = vi.spyOn(axios.Axios.prototype, 'request').mockRejectedValue(unavailable(504))
  const result = expect(api.me(undefined, true)).rejects.toMatchObject({ response: { status: 504 } })
  await vi.runAllTimersAsync()
  await result
  expect(Date.now() - started).toBeGreaterThanOrEqual(60000)
  expect(Date.now() - started).toBeLessThanOrEqual(90000)
  expect(request.mock.calls.length).toBeLessThan(20)
})

it('cancels a queued retry on unmount without issuing another request', async () => {
  const request = vi.spyOn(axios.Axios.prototype, 'request').mockRejectedValue(unavailable(503))
  const controller = new AbortController()
  const result = expect(api.me(controller.signal, true)).rejects.toMatchObject({ code: 'ERR_CANCELED' })
  await vi.advanceTimersByTimeAsync(0)
  controller.abort()
  await result
  await vi.runAllTimersAsync()
  expect(request).toHaveBeenCalledTimes(1)
})

it('does not retry invalid authentication JSON or ordinary session verification', async () => {
  const request = vi.spyOn(axios.Axios.prototype, 'request').mockResolvedValue({ data: '<html>Wrong upstream</html>' })
  await expect(api.me(undefined, true)).rejects.toThrow('Your session could not be verified')
  expect(request).toHaveBeenCalledTimes(1)
  request.mockRejectedValue(unavailable(503))
  await expect(api.me()).rejects.toMatchObject({ response: { status: 503 } })
  expect(request).toHaveBeenCalledTimes(2)
})
