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
  // ■ なぜ POST (Body) が使えるのか？
  // /token はブラウザのリダイレクトではなく、クライアントから IdP への
  // 直接的な API コール（非インタラクティブ）です。
  // そのため、HTTP POST メソッドを使用でき、データを Body に格納できます。
  //
  // ■ 安全性の担保
  // Body の内容は TLS (HTTPS) によって暗号化されたトンネル内を通るため、
  // URL のようにブラウザ履歴やログに残らず、外部からの盗聴も極めて困難です。
  //
  // ■ 構造的な役割分担
  // /authorize (GET): ブラウザの世界。URL露出リスクがあるため PKCE で補強。
  // /token (POST): APIの世界。HTTPS (TLS) で安全。
  // ここで code_verifier (秘密鍵) を安全に送信し、認可コードの正当性を証明します。
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
