/** OAuth belongs on the server callback, never in a rendered application URL. */
export function cleanAuthUrl(href: string): string {
  const url = new URL(href)
  if (url.pathname.startsWith('/api/')) return href
  for (const key of ['code', 'state', 'iss', 'scope', 'authuser', 'prompt', 'session_state', 'access_token', 'id_token', 'refresh_token', 'token_type', 'expires_in', 'error', 'error_description', 'error_uri', 'signed_in', 'sign_in']) {
    url.searchParams.delete(key)
  }
  const fragment = new URLSearchParams(url.hash.slice(1))
  if (['access_token', 'id_token', 'code', 'state', 'error'].some(key => fragment.has(key))) url.hash = ''
  return url.href
}

export function authNotice(href: string): string {
  const outcome = new URL(href).searchParams.get('sign_in')
  if (outcome === 'cancelled') return 'Google sign-in was cancelled. You can try again whenever you’re ready.'
  if (outcome === 'failed') return 'Google sign-in could not be completed. Please try again.'
  return ''
}
