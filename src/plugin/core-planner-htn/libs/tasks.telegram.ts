import type { TelegramClientPlugin } from '../../client-telegram/index.ts'

export const telegramTasks = {
  getMessages: (telegramClient: TelegramClientPlugin) => {
    return telegramClient.getMessages()
  },
  markAsRead: (messageId: number, telegramClient: TelegramClientPlugin) => {
    return telegramClient.markAsRead(messageId)
  },
  sendMessage: (
    message: string,
    ctx: any,
    telegramClient: TelegramClientPlugin,
  ) => {
    return telegramClient.sendMessage(message, ctx)
  },
}
