import { telegramDefaultState } from './telegram.ts'
import { twitterDefaultState } from './twitter.ts'

export const defaultStates = {
  telegram: {
    ...telegramDefaultState,
  },
  twitter: {
    ...twitterDefaultState,
  },
}
