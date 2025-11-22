import { OIDC_CONFIG } from './config'
import { loadCodeVerifer } from './pkce'
import { loadAndClearState } from './authorize'
import { url } from 'inspector'
import { loadavg } from 'os'
import { json } from 'stream/consumers'

export interface TokenResponse {
  access_token: string
  id_token: string
  refresh_token?: string
  token_type: string
  expires_in: number
}

const TOKEN_KEY = 'oidc.token_response'

export const saveTokenResponse = (token: TokenResponse) => {
  sessionStorage.setItem(TOKEN_KEY, JSON.stringify(token))
}

export const loadTokenResponse = (): TokenResponse | null => {
  const raw = sessionStorage.getItem(TOKEN_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw) as TokenResponse
  } catch {
    return null
  }
}

export const handleAuthCallback = async (url: string): Promise<TokenResponse | null> => {
  const parsed = new URL(url)
  const code = parsed.searchParams.get('code')
  const state = parsed.searchParams.get('state')
  const error = parsed.searchParams.get('error')

  if (error) {
    console.error('Authorization error:', error)
    return null
  }

  const originalState = loadAndClearState()
  if (!originalState || originalState !== state) {
    console.error('Invalid state')
    return null
  }
  const codeVerifier = loadCodeVerifer()
  if (!codeVerifier) {
    console.error('Code verifier not found')
    return null
  }

  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    client_id: OIDC_CONFIG.clientId,
    code,
    redirect_uri: OIDC_CONFIG.redirectUri,
    code_verifier: codeVerifier,
  })

  const tokenEndpoint = `${OIDC_CONFIG.authority}oauth/token`
  const response = await fetch(tokenEndpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body,
  })

  if (!response.ok) {
    console.error('Token request failed:', response.statusText)
    return null
  }
  const json = (await response.json()) as TokenResponse
  saveTokenResponse(json)
  return json
}
