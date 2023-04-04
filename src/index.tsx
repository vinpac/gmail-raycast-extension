import { MenuBarExtra, open } from '@raycast/api'
import { withGmailCredentials } from './lib/withGoogleCredentials'
import { oauthClient } from './lib/oauth'
import { useMemo } from 'react'
import { getCachedWatchedLabels } from './cache'
import { useGoogleAPI } from './lib/useGoogleAPI'
import { LabelDetails } from './types'
import { useLabelsEmojis } from './lib/useLabelEmojis'

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
  const { getLabelEmoji } = useLabelsEmojis()

  const title = watchedLabels
    .map((label) => {
      const unreadCount = unreadCountById ? unreadCountById[label.id] || 0 : '-'
      const emoji = getLabelEmoji(label.id)

      return `${emoji} ${unreadCount}`
    })
    .join(' ')

  return (
    <MenuBarExtra isLoading={isLoading} title={title}>
      {watchedLabels.map((label) => {
        const emoji = getLabelEmoji(label.id)
        const unreadCount = unreadCountById ? unreadCountById[label.id] || 0 : '-'
        return (
          <MenuBarExtra.Item
            key={label.id}
            title={`${emoji} ${label.name} (${unreadCount})`}
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
