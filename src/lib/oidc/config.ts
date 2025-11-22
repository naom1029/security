const KEYCLOAK_BASE_URL = 'http://localhost:8080'
const REALM = 'demo'

export const OIDC_CONFIG = {
  baseUrl: KEYCLOAK_BASE_URL,
  realm: REALM,
  clientId: 'vue-oidc-sample',

  redirectUri: 'http://localhost:5173/callback',
  logoutRedirectUri: 'http://localhost:5173/',
  scope: 'openid profile email',

  endpoints: {
    authorization: `${KEYCLOAK_BASE_URL}/realms/${REALM}/protocol/openid-connect/auth`,
    token: `${KEYCLOAK_BASE_URL}/realms/${REALM}/protocol/openid-connect/token`,
    logout: `${KEYCLOAK_BASE_URL}/realms/${REALM}/protocol/openid-connect/logout`,
    userinfo: `${KEYCLOAK_BASE_URL}/realms/${REALM}/protocol/openid-connect/userinfo`,
  },
} as const
