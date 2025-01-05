import { modelTasks } from './tasks.model.ts'
import { telegramTasks } from './tasks.telegram.ts'
import { twitterTasks } from './tasks.twitter.ts'

export const tasks = {
  model: modelTasks,
  telegram: telegramTasks,
  twitter: twitterTasks,
}
