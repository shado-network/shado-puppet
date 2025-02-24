import { telegramDefaultState } from './telegram.js'
import { twitterDefaultState } from './twitter.js'

export const defaultStates = {
  telegram: {
    ...telegramDefaultState,
  },
  twitter: {
    ...twitterDefaultState,
  },
}
