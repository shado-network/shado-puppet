import type { PuppetState } from '../types'

export const telegramDefaultState: PuppetState = {
  'telegram-last-updated': 0,
  //
  'telegram-has-client': false,
  // 'telegram-has-credentials': false,
  //
  'telegram-has-messages': false,
  'telegram-messages': [],
  'telegram-last-replied': 0,
}
