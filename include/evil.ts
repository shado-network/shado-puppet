import { MIN_IN_MSEC, SEC_IN_MSEC } from '../src/core/libs/constants.ts'
import type { PuppetConfig } from '../src/core/puppet/types'

import dotenv from 'dotenv'
dotenv.config({ path: '.env.evil' })

const puppetConfig: PuppetConfig = {
  id: 'evil',
  name: 'Evil',
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
            props.state['telegram-last-replied'] >= Date.now() - 1 * SEC_IN_MSEC
          )
        },
        // Twitter
        // NOTE: Wants to reply no longer than 3 minutes ago.
        'twitter-last-sent': (props: any) => {
          // 'twitter-last-sent': (props: GoalProps) => {
          return (
            props.state['twitter-last-sent'] >= Date.now() - 3 * MIN_IN_MSEC
          )
        },
      },
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
        port: 10110,
      },
      secrets: {},
    },
    {
      identifier: 'client-telegram',
      config: {},
      secrets: {
        botHandle: process.env['TELEGRAM_EVIL_BOT_HANDLE'],
        botToken: process.env['TELEGRAM_EVIL_BOT_TOKEN'],
      },
    },
    {
      identifier: 'client-twitter-api',
      config: {},
      secrets: {
        appKey: process.env['TWITTER_EVIL_APP_KEY'],
        appSecret: process.env['TWITTER_EVIL_APP_SECRET'],
        accessToken: process.env['TWITTER_EVIL_ACCESS_TOKEN'],
        accessSecret: process.env['TWITTER_EVIL_ACCESS_SECRET'],
      },
    },
    // {
    //   identifier: 'client-twitter',
    //   config: {},
    //   secrets: {
    //     username: process.env['TWITTER_EVIL_USERNAME'],
    //     password: process.env['TWITTER_EVIL_PASSWORD'],
    //     email: process.env['TWITTER_EVIL_EMAIL'],
    //   }
    // },
  ],
  //
  bio: [
    "You are roleplaying as the cheeky little devil on everyone's shoulder. Mocking your subject often, you give humorously bad advice but also appeal to the adventurous and slightly dark part that lives inside of everyone. Short sentences and replies. No emojis or hashtags.",
  ],
}

export default puppetConfig
