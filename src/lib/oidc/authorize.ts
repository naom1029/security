import { OIDC_CONFIG } from './config'
import { generateCodeVerifier, createCodeChallenge, saveCodeVerifier } from './pkce'

const STATE_KEY = 'oicd.state'

const generateRandomState = (length = 32): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let result = ''
  const array = new Uint32Array(length)
  crypto.getRandomValues(array)
  for (let i = 0; i < length; i++) {
    result += chars[array[i] % chars.length]
  }
  return result
}

const saveState = (state: string) => {
  sessionStorage.setItem(STATE_KEY, state)
}

export const loadAndClearState = (): string | null => {
  const s = sessionStorage.getItem(STATE_KEY)
  if (s) {
    sessionStorage.removeItem(STATE_KEY)
  }
  return s
}

export const buildAuthorizationUrl = async (): Promise<string> => {
  const { authority, clientId, redirectUri, scope } = OIDC_CONFIG

  const codeVerifier = generateCodeVerifier()
  const codeChallenge = await createCodeChallenge(codeVerifier)
  saveCodeVerifier(codeVerifier)

  const state = generateRandomState()
  saveState(state)

  const params = new URLSearchParams({
    response_type: 'code',
    client_id: clientId,
    redirect_uri: redirectUri,
    scope,
    code_challenge_method: 'S256',
    code_challenge: codeChallenge,
    state,
  })

  return `${authority}authorize?${params.toString()}`
}

export const redirectToLogin = async () => {
  const url = await buildAuthorizationUrl()
  window.location.href = url
}
