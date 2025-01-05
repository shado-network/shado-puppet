import { modelActions } from './actions.model.ts'
import { telegramActions } from './actions.telegram.ts'
import { twitterActions } from './actions.twitter.ts'

export const actions = {
  model: modelActions,
  telegram: telegramActions,
  twitter: twitterActions,
}
