import { OAuth } from '@raycast/api'
import fetch from 'node-fetch'

const clientId = '510938597000-7mtersrf3ailvkge26lgtk19b78cjn06.apps.googleusercontent.com'
const clientSecret = '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'

export const oauthClient = new OAuth.PKCEClient({
  redirectMethod: OAuth.RedirectMethod.Web,
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
    endpoint: 'https://accounts.google.com/o/oauth2/auth',
    clientId,
    scope: 'email https://www.googleapis.com/auth/gmail.readonly',
    extraParameters: {
      access_type: 'offline',
      prompt: 'consent',
    },
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
      client_secret: clientSecret,
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
  const response = await fetch('https://oauth2.googleapis.com/refresh-token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: clientId,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }),
  })

  if (!response.ok) {
    console.error('refresh tokens error:', await response.text())
    throw new Error(response.statusText)
  }

  const tokenResponse = (await response.json()) as OAuth.TokenResponse
  tokenResponse.refresh_token = tokenResponse.refresh_token ?? refreshToken

  return tokenResponse
}
