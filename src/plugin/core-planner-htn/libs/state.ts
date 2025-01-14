const telegramDefaultState = {
  'telegram-last-updated': 0,
  'telegram-has-client': false,
  'telegram-has-messages': false,
  'telegram-messages': [],
  'telegram-last-replied': 0,
}

const twitterDefaultState = {
  'twitter-last-updated': 0,
  'twitter-has-client': false,
  'twitter-logged-in': false,
  'twitter-has-messages': false,
  'twitter-messages': [],
}

export const defaultState = {
  'last-updated': 0,
  ...telegramDefaultState,
  ...twitterDefaultState,
}
