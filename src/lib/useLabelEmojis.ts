import { useState } from 'react'
import { getCachedLabelEmojis, setCachedLabelEmojis } from '../cache'
import { LabelsEmojis } from '../types'

export function useLabelsEmojis() {
  const [labelEmojis, setLabelEmojis] = useState<LabelsEmojis>(() => getCachedLabelEmojis())
  const setPersistedLabelEmojis = (labelEmojis: LabelsEmojis) => {
    setCachedLabelEmojis(labelEmojis)
    setLabelEmojis(labelEmojis)
  }

  const getLabelEmoji = (labelId: string) => labelEmojis[labelId] || '💬'

  return {
    labelEmojis,
    getLabelEmoji,
    setLabelEmojis: setPersistedLabelEmojis,
  }
}
