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

export interface IdTokenValidationParams {
  issuer: string
  clientId: string
  clockToleranceSec?: number
}

// ID Token の claims 検証 (OpenID Connect Core 1.0 §3.1.3.7)
export const validateIdToken = (
  payload: IdTokenPayload,
  params: IdTokenValidationParams,
): { valid: true } | { valid: false; reason: string } => {
  if (payload.iss !== params.issuer) {
    return { valid: false, reason: `iss mismatch: expected "${params.issuer}", got "${payload.iss}"` }
  }

  const audArray = Array.isArray(payload.aud) ? payload.aud : [payload.aud]
  if (!audArray.includes(params.clientId)) {
    return { valid: false, reason: `aud does not contain "${params.clientId}"` }
  }

  const now = Math.floor(Date.now() / 1000)
  const tolerance = params.clockToleranceSec ?? 60

  if (payload.exp <= now - tolerance) {
    return { valid: false, reason: `token expired at ${payload.exp} (now: ${now})` }
  }

  if (payload.iat > now + tolerance) {
    return { valid: false, reason: `iat is in the future: ${payload.iat} (now: ${now})` }
  }

  return { valid: true }
}
