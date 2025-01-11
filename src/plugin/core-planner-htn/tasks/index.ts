import telegramGetMessages from './telegram/telegram-get-messages.ts'
import telegramReadMessages from './telegram/telegram-read-messages.ts'

import twitterLogIn from './twitter/twitter-log-in.ts'
import twitterGetMessages from './twitter/twitter-get-messages.ts'

export const tasks = [
  // Telegram
  telegramGetMessages,
  telegramReadMessages,
  // Twitter
  twitterLogIn,
  twitterGetMessages,
]
