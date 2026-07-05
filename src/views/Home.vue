<template>
  <div>
    <h1>OIDC Sample</h1>

    <div v-if="user">
      <p>Logged in as: {{ user.name || user.email || user.sub }}</p>
      <pre>{{ user }}</pre>
      <button @click="logout">Logout</button>
    </div>
    <div v-else>
      <p>Not logged in</p>
      <button @click="login">Login</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { OIDC_CONFIG } from '../lib/oidc/config'
import { loadTokenResponse, clearTokenResponse } from '../lib/oidc/token'
import { parseIdToken, validateIdToken } from '../lib/oidc/idToken'
import { redirectToLogin } from '../lib/oidc/authorize'

const token = loadTokenResponse()
const user = computed(() => {
  if (!token?.id_token) return null
  const payload = parseIdToken(token.id_token)
  if (!payload) return null
  const validation = validateIdToken(payload, {
    issuer: OIDC_CONFIG.issuer,
    clientId: OIDC_CONFIG.clientId,
  })
  if (!validation.valid) {
    console.warn('ID token invalid:', validation.reason)
    clearTokenResponse()
    return null
  }
  return payload
})

const login = async () => {
  await redirectToLogin()
}

const logout = () => {
  const token = loadTokenResponse()
  const idToken = token?.id_token

  const params = new URLSearchParams({
    client_id: OIDC_CONFIG.clientId,
    post_logout_redirect_uri: OIDC_CONFIG.logoutRedirectUri,
  })

  if (idToken) {
    // 任意だけど、あった方が「誰のセッションか」を Keycloak に伝えられる
    params.set('id_token_hint', idToken)
  }

  clearTokenResponse()

  window.location.href = `${OIDC_CONFIG.endpoints.logout}?${params.toString()}`
}
</script>
