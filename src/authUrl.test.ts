import { expect, it } from 'vitest'
import { cleanAuthUrl, authNotice } from './authUrl'

it('removes callback parameters and duplicates without sending them anywhere', () => {
  expect(cleanAuthUrl('https://example.test/?code=test-only&code=duplicate&state=fake&iss=provider&scope=openid&authuser=2&prompt=none&signed_in=1&view=history#main'))
    .toBe('https://example.test/?view=history#main')
})

it('leaves the backend callback intact for server verification', () => {
  const callback = 'https://example.test/api/auth/callback?code=test-only&state=fake'
  expect(cleanAuthUrl(callback)).toBe(callback)
})

it('removes token fragments and provider error details', () => {
  expect(cleanAuthUrl('https://example.test/?error=denied&error_description=private#error=private')).toBe('https://example.test/')
  expect(cleanAuthUrl('https://example.test/#access_token=test-only')).toBe('https://example.test/')
  expect(cleanAuthUrl('https://example.test/#inside-the-product')).toBe('https://example.test/#inside-the-product')
})

it('shows only fixed outcome messages and strips the outcome marker', () => {
  expect(authNotice('https://example.test/?sign_in=cancelled')).toMatch(/cancelled/)
  expect(authNotice('https://example.test/?sign_in=failed')).toMatch(/try again/)
  expect(authNotice('https://example.test/?sign_in=untrusted')).toBe('')
  expect(cleanAuthUrl('https://example.test/?sign_in=cancelled&error_description=private')).toBe('https://example.test/')
})
