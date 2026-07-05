import { OIDC_CONFIG } from './config'
import { generateCodeVerifier, createCodeChallenge, saveCodeVerifier } from './pkce'

const STATE_KEY = 'oidc.state'

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
  if (s) sessionStorage.removeItem(STATE_KEY)
  return s
}

export const buildAuthorizationUrl = async (): Promise<string> => {
  const { endpoints, clientId, redirectUri, scope } = OIDC_CONFIG

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

  // ---------------------------------------------------------------------------
  // なぜ GET なのか:
  // リダイレクト (302) は Location ヘッダで遷移先を指定する仕組みなので Body が使えない。
  // 結果、パラメータは全部 URL のクエリ文字列に載せるしかない。(RFC 6749 §4.1.1)
  //
  // リスクと PKCE:
  // この /authorize も、IdP からのコールバック (/callback?code=...&state=...) も
  // どちらもリダイレクト = URL 経由なので、履歴・Referer・ログ・拡張機能から漏れうる。
  // 特にコールバック URL の認可コード (code) を奪われるとトークンを不正取得される。
  // PKCE はこの対策で、先に code_verifier のハッシュ値 (code_challenge) だけ送っておき、
  // /token 時にハッシュ化前の code_verifier を出すことで、
  // code を盗んだだけの攻撃者にはトークンを取れないようにする。(RFC 7636)
  // ---------------------------------------------------------------------------
  const url = `${endpoints.authorization}?${params.toString()}`
  console.log('OIDC Authorization URL:', url)
  console.log('OIDC Redirect URI:', redirectUri)

  return url
}

export const redirectToLogin = async () => {
  const url = await buildAuthorizationUrl()
  window.location.href = url
}
