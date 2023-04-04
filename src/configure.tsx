import { Action, ActionPanel, Icon, List } from '@raycast/api'
import { withGmailCredentials } from './lib/withGoogleCredentials'
import { useGoogleAPI } from './lib/useGoogleAPI'
import { useMemo, useState } from 'react'
import { emojis } from './lib/emojis'
import { Label, WatchedLabel } from './types'
import { getCachedWatchedLabels, setCachedWatchedLabels } from './cache'
import { useLabelsEmojis } from './lib/useLabelEmojis'

const useAllLabels = () => {
  const query = useGoogleAPI<{
    labels: Label[]
  }>({
    id: 'labels',
    getData: (gmail) => gmail('/labels'),
  })

  return useMemo(
    () => ({
      ...query,
      labels: query.data?.labels.sort((a, b) => a.name.localeCompare(b.name)) || [],
    }),
    [query]
  )
}

function useWatchedLabels() {
  const [watchedLabels, setWatchedLabels] = useState<WatchedLabel[]>(() => getCachedWatchedLabels())
  const setPersistedWatchedLabels = (labels: WatchedLabel[]) => {
    setCachedWatchedLabels(labels)
    setWatchedLabels(labels)
  }

  return [watchedLabels, setPersistedWatchedLabels] as const
}

function Configure() {
  const { labels, isLoading } = useAllLabels()
  const [typeFilter, setTypeFilter] = useState<string | undefined>(undefined)
  const [wachedLabels, setWatchedLabels] = useWatchedLabels()
  const { getLabelEmoji, labelEmojis, setLabelEmojis } = useLabelsEmojis()
  const wachedLabelIds = useMemo(() => wachedLabels.map((label) => label.id), [wachedLabels])
  const labelsTypes = useMemo(() => {
    const set = new Set<string>()
    labels.forEach((label) => set.add(label.type))
    return Array.from(set)
  }, [labels])

  const filteredLabels = useMemo(() => {
    if (typeFilter) {
      return labels.filter((label) => label.type === typeFilter)
    }
    return labels
  }, [labels, typeFilter])

  const [watched, unwatched] = useMemo(() => {
    const watched: Label[] = []
    const unwatched: Label[] = []
    filteredLabels.forEach((label) => {
      if (wachedLabelIds.includes(label.id)) {
        watched.push(label)
      } else {
        unwatched.push(label)
      }
    })
    return [watched, unwatched]
  }, [filteredLabels, wachedLabelIds])

  const setLabelEmoji = (label: Label, emoji: string | undefined) => {
    if (!emoji) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { [label.id]: _, ...newLabelEmojis } = labelEmojis
      setLabelEmojis(newLabelEmojis)
      return
    }

    setLabelEmojis({
      ...labelEmojis,
      [label.id]: emoji,
    })
  }

  const toggleWatchedState = (label: Label) => {
    if (wachedLabelIds.includes(label.id)) {
      // remove
      setWatchedLabels(
        wachedLabels.filter((watchedLabel) => {
          return watchedLabel.id !== label.id
        })
      )
    } else {
      // add
      setWatchedLabels([
        ...wachedLabels,
        {
          id: label.id,
          name: label.name,
        },
      ])
    }
  }

  const renderList = (title: string, items: Label[]) => {
    return (
      <List.Section title={title} subtitle={`${items.length} labels`}>
        {items.map((label) => {
          return (
            <List.Item
              key={label.id}
              title={`${getLabelEmoji(label.id)}  ${label.name}`}
              subtitle={label.type}
              actions={
                <ActionPanel>
                  <Action
                    title="Select"
                    onAction={() => {
                      toggleWatchedState(label)
                    }}
                  />
                  <ActionPanel.Submenu title="Set Emoji">
                    {emojis.map(({ emoji, description }) => (
                      <Action
                        title={`${emoji} ${description}` as string}
                        onAction={() => {
                          setLabelEmoji(label, emoji)
                        }}
                      />
                    ))}
                    <Action
                      title="Remove"
                      icon={Icon.XMarkCircle}
                      onAction={() => {
                        setLabelEmoji(label, undefined)
                      }}
                    />
                  </ActionPanel.Submenu>
                </ActionPanel>
              }
            />
          )
        })}
      </List.Section>
    )
  }

  return (
    <List
      isLoading={isLoading}
      searchBarAccessory={
        <List.Dropdown tooltip="Select Todo List" value={typeFilter} onChange={(newValue) => setTypeFilter(newValue)}>
          <List.Dropdown.Item title="All" value="" />
          {labelsTypes.map((type) => (
            <List.Dropdown.Item key={type} title={type} value={type} />
          ))}
        </List.Dropdown>
      }
    >
      {renderList('Watched', watched)}
      {renderList('Not watched', unwatched)}
    </List>
  )
}

export default function Command() {
  return withGmailCredentials(<Configure />)
}
