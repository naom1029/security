// src/oidc/token.ts
import { OIDC_CONFIG } from './config'
import { loadCodeVerifier } from './pkce'
import { loadAndClearState } from './authorize'
import { parseIdToken, validateIdToken } from './idToken'

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

export const clearTokenResponse = () => {
  sessionStorage.removeItem(TOKEN_KEY)
}

export const handleAuthCallback = async (url: string): Promise<TokenResponse | null> => {
  const parsed = new URL(url)
  const code = parsed.searchParams.get('code')
  const state = parsed.searchParams.get('state')
  const error = parsed.searchParams.get('error')

  if (error) {
    console.error('OIDC error', error)
    return null
  }
  if (!code || !state) {
    console.error('Missing code or state')
    return null
  }

  const originalState = loadAndClearState()
  if (!originalState || originalState !== state) {
    console.error('State mismatch')
    return null
  }

  const codeVerifier = loadCodeVerifier()
  if (!codeVerifier) {
    console.error('No PKCE code_verifier')
    return null
  }

  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    client_id: OIDC_CONFIG.clientId,
    code,
    redirect_uri: OIDC_CONFIG.redirectUri,
    code_verifier: codeVerifier,
  })

  // ---------------------------------------------------------------------------
  // なぜ POST が使えるのか:
  // /token はリダイレクトじゃなくクライアントから IdP への直接 API コール。
  // ブラウザの画面遷移を伴わないので POST で Body に載せられる。(RFC 6749 §4.1.3)
  //
  // 安全性:
  // Body は TLS で暗号化されるので、URL みたいに履歴やログに残らない。
  //
  // 役割分担:
  //   /authorize (GET) → ブラウザの世界。URL 露出リスクがあるから PKCE で補強
  //   /token (POST)    → API の世界。TLS で保護される
  // ここで code_verifier (ハッシュ化前の値) を送って、
  // /authorize 時に code_challenge を送ったクライアントと同一であることを証明する。
  // (RFC 7636 §4.5)
  // ---------------------------------------------------------------------------
  const res = await fetch(OIDC_CONFIG.endpoints.token, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body,
  })

  if (!res.ok) {
    console.error('Token endpoint error', await res.text())
    return null
  }

  const json = (await res.json()) as TokenResponse

  if (json.id_token) {
    const payload = parseIdToken(json.id_token)
    if (!payload) {
      console.error('Failed to parse id_token')
      return null
    }
    const validation = validateIdToken(payload, {
      issuer: OIDC_CONFIG.issuer,
      clientId: OIDC_CONFIG.clientId,
    })
    if (!validation.valid) {
      console.error('ID token validation failed:', validation.reason)
      return null
    }
  }

  saveTokenResponse(json)
  return json
}
