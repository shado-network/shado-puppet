import type { Puppet } from '../../../../core/types/puppet.ts'
import type { Task } from '../types.ts'

export default {
  identifier: 'twitter-log-in',
  conditions: [
    {
      identifier: 'twitter-client',
      value: (props?: unknown) => true,
    },
    {
      identifier: 'twitter-logged-in',
      value: (props?: unknown) => false,
    },
  ],
  effects: [
    {
      identifier: 'twitter-logged-in',
      value: (props?: unknown) => true,
    },
  ],
  actions: [
    {
      identifier: 'twitter-log-in',
      trigger: async (props?: any) => {
        // puppet: Puppet, currentState,

        await props.puppet.interfaces.twitterClient.login()
      },
    },
  ],
} satisfies Task
