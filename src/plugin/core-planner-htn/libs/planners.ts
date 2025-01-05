import { telegramPlanner } from './planners.telegram.ts'
import { twitterPlanner } from './planners.twitter.ts'

export const planners = {
  telegram: telegramPlanner,
  twitter: twitterPlanner,
}
