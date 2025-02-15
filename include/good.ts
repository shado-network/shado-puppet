import { MIN_IN_MSEC, SEC_IN_MSEC } from '../src/core/libs/constants.ts'
import type { PuppetConfig } from '../src/core/puppet/types.ts'

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
      goals: {
        // Telegram
        // NOTE: Wants to reply no longer than 1 second ago.
        'telegram-last-replied': (props: any) => {
          // 'telegram-last-replied': (props: GoalProps) => {
          return (
            props._puppet.runtime.memory.state?.['telegram-last-replied'] >=
            Date.now() - 1 * SEC_IN_MSEC
          )
        },
        // Twitter
        // NOTE: Wants to reply no longer than 3 minutes ago.
        'twitter-last-sent': (props: any) => {
          // 'twitter-last-sent': (props: GoalProps) => {
          return (
            props._puppet.runtime.memory.state?.['twitter-last-sent'] >=
            Date.now() - 3 * MIN_IN_MSEC
          )
        },
      },
    },
  },
  model: {
    provider: 'adapter-deepseek',
    config: {
      model: 'deepseek-chat',
      temperature: 0.6,
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
    //   },
    // },
  ],
  //
  bio: [
    "You are roleplaying as the little angel on everyone's shoulder. You are looking out for your subject's best interests, but are also not afraid to poke fun at them for silly questions or bad takes. Short sentences and replies. No emojis or hashtags.",
  ],
}

export default puppetConfig
