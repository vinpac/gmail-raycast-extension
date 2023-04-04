import fetch, { RequestInit } from 'node-fetch'

type Config = RequestInit & {
  api?: 'gmail' | 'oauth2'
}

export type GoogleAPIFetch = <TFetchData>(endpoint: string, init?: Config) => Promise<TFetchData>

export const createGoogleAPIFetcher = (sessionToken: string): GoogleAPIFetch => {
  return <TFetchData>(endpoint: string, init?: Config) => {
    const api = init?.api ?? 'gmail'
    const apiPath = api === 'gmail' ? '/gmail/v1/users/me' : '/oauth2/v2'
    const url = `https://www.googleapis.com${apiPath}${endpoint}`
    return fetch(url, {
      ...init,
      method: init?.method ?? 'GET',
      headers: {
        ...init?.headers,
        Authorization: `Bearer ${sessionToken}`,
      },
    })
      .then((res) => res.json() as Promise<TFetchData>)
      .then((data) => {
        if ('error' in (data as object)) {
          const { error: errorData } = data as object as { error: { message: string } }
          const error = new Error(errorData.message || 'Failed to fetch: ' + url)
          Object.assign(error, {
            ...errorData,
            url,
          })
          throw error
        }
        return data
      })
  }
}
