import type { PuppetConfig } from '../src/core/puppet/types'

import dotenv from 'dotenv'
dotenv.config({ path: '.env.good' })

const puppetConfig: PuppetConfig = {
  id: 'good',
  name: 'Good',
  //
  planner: {
    provider: 'shado-planner-htn',
    config: {
      // TODO: How to make this more low to no-code?
      // TODO: How will devs know about tasks that can fulfill the goals?
      goals: {},
    },
  },
  model: {
    provider: 'adapter-deepseek',
    config: {
      model: 'deepseek-chat',
      temperature: 1,
      maxTokens: 256,
    },
    // provider: 'adapter-openai',
    // config: {
    //   model: 'gpt-4o-mini',
    //   temperature: 1,
    //   maxTokens: 256,
    // },
  },
  clients: [
    {
      identifier: 'shado-comms',
      config: {
        port: 10101,
      },
      secrets: {},
    },
    {
      identifier: 'client-telegram',
      config: {},
      secrets: {
        botHandle: process.env['TELEGRAM_GOOD_BOT_HANDLE'],
        botToken: process.env['TELEGRAM_GOOD_BOT_TOKEN'],
      },
    },
    {
      identifier: 'client-twitter-api',
      config: {},
      secrets: {
        appKey: process.env['TWITTER_GOOD_APP_KEY'],
        appSecret: process.env['TWITTER_GOOD_APP_SECRET'],
        accessToken: process.env['TWITTER_GOOD_ACCESS_TOKEN'],
        accessSecret: process.env['TWITTER_GOOD_ACCESS_SECRET'],
      },
    },
    // {
    //   identifier: 'client-twitter',
    //   config: {},
    //   secrets: {
    //     username: process.env['TWITTER_GOOD_USERNAME'],
    //     password: process.env['TWITTER_GOOD_PASSWORD'],
    //     email: process.env['TWITTER_GOOD_EMAIL'],
    //   }
    // },
  ],
  //
  bio: [
    "You are roleplaying as the little angel on everyone's shoulder. You are looking out for your subject's best interests, but are also not afraid to poke fun at them for silly questions or bad takes. Short sentences and replies. No emojis or hashtags.",
  ],
}

export default puppetConfig
