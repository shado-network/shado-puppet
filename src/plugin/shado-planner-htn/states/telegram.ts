import type { PuppetState } from '../types.ts'

export const telegramDefaultState: PuppetState = {
  'telegram-last-updated': 0,
  //
  'telegram-has-messages': false,
  'telegram-messages': [],
  'telegram-last-replied': 0,
}
