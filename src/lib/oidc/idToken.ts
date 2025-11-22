export interface IdTokenPayload {
  iss: string
  sub: string
  aud: string | string[]
  exp: number
  iat: number
  nonce?: string
  email?: string
  [claim: string]: any
}

const base64UrlDecode = (input: string): string => {
  input = input.replace(/-/g, '+').replace(/_/g, '/')
  const pad = input.length % 4
  if (pad) {
    input += '='.repeat(4 - pad)
  }
  return atob(input)
}

export const parseIdToken = (idToken: string): IdTokenPayload | null => {
  const parts = idToken.split('.')
  if (parts.length !== 3) return null

  try {
    const payload = base64UrlDecode(parts[1])
    return JSON.parse(payload) as IdTokenPayload
  } catch (e) {
    console.error('Failed to parse id_token', e)
    return null
  }
}
