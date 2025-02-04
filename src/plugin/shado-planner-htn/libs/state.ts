import { PuppetState } from '../types'

// TODO: Move to... plugin?
const telegramDefaultState: PuppetState = {
  'telegram-last-updated': 0,
  //
  'telegram-has-client': false,
  // 'telegram-has-credentials': false,
  //
  'telegram-has-messages': false,
  'telegram-messages': [],
  'telegram-last-replied': 0,
}
// TODO: Move to... plugin?
const twitterDefaultState: PuppetState = {
  'twitter-last-updated': 0,
  //
  'twitter-has-client': false,
  // 'twitter-has-credentials': false,
  //
  'twitter-has-logged-in': false,
  'twitter-last-log-in-attempt': 0,
  // 'twitter-has-messages': false,
  // 'twitter-messages': [],
  'twitter-last-sent': 0,
  // 'twitter-last-replied': 0,
}

export const defaultState: PuppetState = {
  'last-started': 0,
  'last-updated': 0,
  //
  ...telegramDefaultState,
  ...twitterDefaultState,
}
