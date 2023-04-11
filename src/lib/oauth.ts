import { OAuth } from '@raycast/api'
import fetch from 'node-fetch'

const clientId = '510938597000-vv5htokjbkmtpcs5r9v096nau4ef1ajd.apps.googleusercontent.com'

export const oauthClient = new OAuth.PKCEClient({
  redirectMethod: OAuth.RedirectMethod.AppURI,
  providerName: 'Gmail',
  providerIcon: 'gmail.png',
  providerId: 'Gmail',
  description: 'Connect your Gmail account',
})

export async function authorize() {
  const tokenSet = await oauthClient.getTokens()

  if (tokenSet?.accessToken) {
    if (tokenSet.refreshToken && tokenSet.isExpired()) {
      const tokens = await refreshTokens(tokenSet.refreshToken)
      await oauthClient.setTokens(tokens)
      return tokens.access_token
    }

    return tokenSet.accessToken
  }

  const authRequest = await oauthClient.authorizationRequest({
    endpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
    clientId,
    scope: 'https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/gmail.readonly',
  })

  const { authorizationCode } = await oauthClient.authorize(authRequest)
  const tokens = await fetchTokens(authRequest, authorizationCode)

  await oauthClient.setTokens(tokens)

  return tokens.access_token
}

async function fetchTokens(authRequest: OAuth.AuthorizationRequest, authCode: string): Promise<OAuth.TokenResponse> {
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: clientId,
      code: authCode,
      code_verifier: authRequest.codeVerifier,
      grant_type: 'authorization_code',
      redirect_uri: authRequest.redirectURI,
    }),
  })

  if (!response.ok) {
    throw new Error(response.statusText)
  }

  const tokens = await response.json()

  return tokens as OAuth.TokenResponse
}

async function refreshTokens(refreshToken: string): Promise<OAuth.TokenResponse> {
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: clientId,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }),
  })

  if (!response.ok) {
    const json = (await response.json()) as Record<string, string>
    console.error('refresh tokens error:', json)

    if (json.error === 'invalid_request') {
      oauthClient.removeTokens()
    }

    throw new Error(response.statusText)
  }

  const tokenResponse = (await response.json()) as OAuth.TokenResponse
  tokenResponse.refresh_token = tokenResponse.refresh_token ?? refreshToken

  return tokenResponse
}
