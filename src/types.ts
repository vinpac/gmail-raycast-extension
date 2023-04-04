export type Label = {
  id: string
  name: string
  messageListVisibility: 'hide'
  labelListVisibility: string
  type: string
}

export type WatchedLabel = {
  id: string
  name: string
}

export type LabelsEmojis = Record<string, string>

export type LabelDetails = {
  id: string
  name: string
  type: string
  messagesTotal: number
  messagesUnread: number
  threadsTotal: number
  threadsUnread: number
}
