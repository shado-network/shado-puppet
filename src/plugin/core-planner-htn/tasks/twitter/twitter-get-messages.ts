import type { MessageParam } from '@anthropic-ai/sdk/resources/messages.mjs'

import type { Puppet } from '../../../../core/types/puppet.ts'
import type { Task } from '../types.ts'

export default {
  identifier: 'twitter-get-messages',
  conditions: [
    {
      identifier: 'twitter-client',
      value: (props?: unknown) => true,
    },
    {
      identifier: 'twitter-logged-in',
      value: (props?: unknown) => true,
    },
    {
      identifier: 'twitter-has-messages',
      value: (props?: unknown) => false,
    },
  ],
  effects: [
    {
      identifier: 'twitter-has-messages',
      value: (props?: unknown) => true,
    },
  ],
  actions: [
    {
      identifier: 'telegram-get-messages',
      trigger: async (props?: any) => {
        // puppet: Puppet, currentState,

        const messages = []
        const nmessages =
          props.puppet.interfaces.twitterClient.getMessages(messages)
        props.currentState['twitter-messages'] = nmessages
        // props.currentState['twitter-has-messages'] = props.currentState['twitter-messages'].length > 0

        return messages
      },
    },
  ],
} satisfies Task
