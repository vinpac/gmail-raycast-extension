import { Cache } from '@raycast/api'
import { LabelsEmojis, WatchedLabel } from '../types'

const cache = new Cache({
  namespace: 'gmail',
})

export function getCachedWatchedLabels(): WatchedLabel[] {
  const cached = cache.get('watchedLabels')

  console.log({ cached })

  const list = cached ? JSON.parse(cached) : []

  return list.filter((item: WatchedLabel) => {
    return item.id && item.name
  })
}

export function setCachedWatchedLabels(watchedLabels: WatchedLabel[]): void {
  cache.set('watchedLabels', JSON.stringify(watchedLabels))
}

export function getCachedLabelEmojis(): LabelsEmojis {
  const cached = cache.get('labelEmojis')
  return cached ? JSON.parse(cached) : {}
}

export function setCachedLabelEmojis(labelIdToEmoji: LabelsEmojis): void {
  cache.set('labelEmojis', JSON.stringify(labelIdToEmoji))
}
