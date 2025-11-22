// src/oidc/token.ts
import { OIDC_CONFIG } from './config'
import { loadCodeVerifier } from './pkce'
import { loadAndClearState } from './authorize'

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
  // 【セキュリティ解説: /token エンドポイント】
  // このリクエストは HTTPS の POST メソッドで行われ、パラメータは Body に格納されます。
  // URL ではないため、ブラウザの履歴や Referer には残りません。
  //
  // 通信経路は TLS (HTTPS) で暗号化されているため、
  // ネットワーク経路上で Body の中身（code_verifier など）を盗聴することは困難です。
  //
  // つまり、/authorize の段階では URL 経由で code が漏れるリスクがありましたが、
  // /token の段階では HTTPS によって安全性が担保されています。
  // ここで code_verifier を送ることで、最初の /authorize リクエストをした者と
  // 同一人物であることを証明し、安全にトークンを取得します。
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
  saveTokenResponse(json)
  return json
}
