import { Detail, environment, MenuBarExtra, showToast, Toast } from '@raycast/api'
import { useMemo, useState } from 'react'
import { createGoogleAPIFetcher, GoogleAPIFetch } from './gmail'

import { authorize, oauthClient } from './oauth'

function getErrorMessage(error: unknown) {
  return typeof error === 'string' ? error : (error as Error)?.message || ''
}

type User = {
  id: string
  email: string
  verified_email: boolean
  picture: string
  hd: string
}

interface Session {
  user: User
  fetch: GoogleAPIFetch
}

let session: Session | undefined = undefined

export function withGmailCredentials(component: JSX.Element) {
  const [x, forceRerender] = useState(0)

  // we use a `useMemo` instead of `useEffect` to avoid a render
  useMemo(() => {
    const authorizationFlow = async function () {
      try {
        const accessToken = await authorize()

        const googleAPIFetch = createGoogleAPIFetcher(accessToken)
        const user = await googleAPIFetch<User>('/userinfo', {
          api: 'oauth2',
        })

        session = {
          user,
          fetch: googleAPIFetch,
        }

        forceRerender(x + 1)
      } catch (error) {
        console.error(error)

        if ((error as { code: number }).code === 401) {
          // The user revoked access to the app
          // We need to clear the token
          await oauthClient.removeTokens()
          authorizationFlow()
          return
        }

        await showToast({
          style: Toast.Style.Failure,
          title: 'Failed authenticating to Gmail',
          message: getErrorMessage(error),
        })
      }
    }

    authorizationFlow()
  }, [])

  if (!session) {
    if (environment.commandMode === 'view') {
      // Using the <List /> component makes the placeholder buggy
      return <Detail isLoading />
    } else if (environment.commandMode === 'menu-bar') {
      return <MenuBarExtra isLoading />
    } else {
      console.error('`withGmailCredentials` is only supported in `view` and `menu-bar` mode')
      return null
    }
  }

  return component
}

export function getSession() {
  if (!session) {
    throw new Error('getGmailFetch must be used when authenticated')
  }

  return session
}
