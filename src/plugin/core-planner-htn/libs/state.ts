const telegramDefaultState = {
  'telegram-client': true,
  'telegram-has-messages': false,
  'telegram-messages': [],
  'telegram-has-replied': false,
}

const twitterDefaultState = {
  'twitter-client': true,
  'twitter-logged-in': false,
  'twitter-has-messages': false,
  'twitter-messages': [],
}

export const defaultState = {
  'last-updated': 0,
  ...telegramDefaultState,
  ...twitterDefaultState,
}
