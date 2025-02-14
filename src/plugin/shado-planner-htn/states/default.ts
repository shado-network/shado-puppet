import type { PuppetState } from '../types'

import { telegramDefaultState } from './telegram.ts'
import { twitterDefaultState } from './twitter.ts'

export const defaultState: PuppetState = {
  'last-started': 0,
  'last-updated': 0,
  //
  ...telegramDefaultState,
  ...twitterDefaultState,
}
