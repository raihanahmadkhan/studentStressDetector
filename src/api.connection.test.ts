import axios, { AxiosError, type AxiosResponse } from 'axios'
import { afterEach, expect, it, vi } from 'vitest'
import { api } from './api'

afterEach(() => vi.restoreAllMocks())

it.each(['me', 'config'] as const)('bounds %s to one five-second request without retries', async method => {
  const request = vi.spyOn(axios.Axios.prototype, 'request').mockRejectedValue(new AxiosError('Timeout', 'ECONNABORTED'))
  await expect(api[method]()).rejects.toMatchObject({ code: 'ECONNABORTED' })
  expect(request).toHaveBeenCalledTimes(1)
  expect(request.mock.calls[0][0].timeout).toBe(5000)
})

it.each([401, 403, 429, 502, 503, 504])('does not repeat failed session verification for HTTP %i', async status => {
  const request = vi.spyOn(axios.Axios.prototype, 'request').mockRejectedValue(
    new AxiosError('Unavailable', 'ERR_BAD_RESPONSE', undefined, undefined, { status } as AxiosResponse),
  )
  await expect(api.me()).rejects.toMatchObject({ response: { status } })
  expect(request).toHaveBeenCalledTimes(1)
})
