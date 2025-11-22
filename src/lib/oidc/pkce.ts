const CODE_VERIFIER_KEY = 'pkce_code_verifier'

export const generateCodeVerifier = (lengh = 64): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~'

  let result = ''
  const array = new Uint32Array(length)
  crypto.getRandomValues(array)
  for (let i = 0; i < length; i++) {
    result += chars[array[i] % chars.length]
  }

  return result
}

const base64UrlEncode = (buffer: ArrayBuffer): string => {
  const bytes = new Uint8Array(buffer)
  let binary = ''
  bytes.forEach((b) => (binary += String.fromCharCode(b)))
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

export const createCodeChallenge = async (verifer: string): Promise<string> => {
  const data = new TextEncoder().encode(verifer)
  const digest = await crypto.subtle.digest('SHA-256', data)
  return base64UrlEncode(digest)
}

export const saveCodeVerifier = (verifier: string): void => {
  sessionStorage.setItem(CODE_VERIFIER_KEY, verifier)
}

export const loadCodeVerifer = (): string | null => {
  const v = sessionStorage.getItem(CODE_VERIFIER_KEY)
  if (v) {
    sessionStorage.removeItem(CODE_VERIFIER_KEY)
  }
  return v
}
