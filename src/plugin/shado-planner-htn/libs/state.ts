const telegramDefaultState = {
  'telegram-last-updated': 0,
  //
  'telegram-has-client': false,
  // 'telegram-has-credentials': false,
  //
  'telegram-has-messages': false,
  'telegram-messages': [],
  'telegram-last-replied': 0,
}

const twitterDefaultState = {
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

export const defaultState = {
  'last-updated': 0,
  //
  ...telegramDefaultState,
  ...twitterDefaultState,
}
