import { MenuBarExtra, open } from '@raycast/api'
import { withGmailCredentials } from './lib/withGoogleCredentials'
import { oauthClient } from './lib/oauth'
import { useMemo } from 'react'
import { getCachedLabelEmojis, getCachedWatchedLabels } from './cache'
import { useGoogleAPI } from './lib/useGoogleAPI'
import { LabelDetails } from './types'

const useWatchedLabelsUnreadCount = () => {
  const watchedLabels = useMemo(() => {
    return getCachedWatchedLabels()
  }, [])

  const query = useGoogleAPI<Array<LabelDetails>>({
    id: 'watchedLabelsDetails',
    getData: (gmail) => Promise.all(watchedLabels.map((label) => gmail<LabelDetails>(`/labels/${label.id}`))),
  })

  const unreadCountById = useMemo(() => {
    if (!query.data) {
      return undefined
    }

    const unreadCountById: Record<string, number> = {}

    query.data.forEach((label) => {
      unreadCountById[label.id] = label.messagesUnread
    })

    return unreadCountById
  }, [query.data])

  return {
    ...query,
    watchedLabels,
    unreadCountById,
  }
}

function UnReadEmails() {
  const { watchedLabels, unreadCountById, isLoading } = useWatchedLabelsUnreadCount()
  const labelEmojis = useMemo(() => {
    return getCachedLabelEmojis()
  }, [])

  const title = watchedLabels
    .map((label) => {
      const unreadCount = unreadCountById ? unreadCountById[label.id] || 0 : '-'
      const emoji = labelEmojis[label.id] || label.name.charAt(0)

      return `${emoji} ${unreadCount}`
    })
    .join(' ')

  return (
    <MenuBarExtra isLoading={isLoading} title={title}>
      {watchedLabels.map((label) => {
        const emoji = labelEmojis[label.id]
        const unreadCount = unreadCountById ? unreadCountById[label.id] || 0 : '-'
        return (
          <MenuBarExtra.Item
            key={label.id}
            title={emoji ? `${emoji} ${label.name} (${unreadCount})` : `${label.name}  (${unreadCount})`}
            onAction={() => open(`https://mail.google.com/mail/u/0/#label/${label.name}`)}
          />
        )
      })}
      <MenuBarExtra.Separator />
      <MenuBarExtra.Item title="Log out" onAction={() => oauthClient.removeTokens()} />
    </MenuBarExtra>
  )
}

export default function Command() {
  return withGmailCredentials(<UnReadEmails />)
}
