export type TelegramMessage = {
  id: number
  text: string
  is_read: boolean
  //
  from: {
    id: number
    name: string
  }
  metadata: {
    chat: { type: string }
    replyFn: (message: string) => Promise<void>
  }
}
