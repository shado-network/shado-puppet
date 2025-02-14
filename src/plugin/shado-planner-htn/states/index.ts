import type { PuppetState } from '../types'

import { telegramDefaultState } from './telegram.ts'
import { twitterDefaultState } from './twitter.ts'

export const defaultStates: { [key: string]: PuppetState } = {
  telegram: {
    ...telegramDefaultState,
  },
  twitter: {
    ...twitterDefaultState,
  },
}
