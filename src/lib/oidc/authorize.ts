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
  // 【セキュリティ解説: /authorize エンドポイント】
  // ■ なぜ GET (URLパラメータ) なのか？
  // /authorize は「ユーザーをログイン画面へ連れて行く（リダイレクトさせる）」ためのエンドポイントです。
  // HTTP の仕様上、リダイレクト (302/303/307) は Location ヘッダに URL を指定する仕組みであり、
  // Body を含めることができません。そのため、必然的に GET リクエストとなり、
  // パラメータは URL クエリ文字列に含めるしかありません。
  //
  // ■ リスクと PKCE の役割
  // URL に情報が含まれるため、ブラウザの履歴、Referer、ログ、拡張機能などから
  // "code" やパラメータが参照可能（漏洩リスク）となります。
  // この「URL に情報を載せざるを得ない」という Web の構造上の制約を補うために、
  // PKCE (Proof Key for Code Exchange) が存在します。
  // ここで code_challenge を送ることで、後続の /token リクエスト時に
  // 「正当なクライアントからの要求である」ことを証明できるようにします。
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
