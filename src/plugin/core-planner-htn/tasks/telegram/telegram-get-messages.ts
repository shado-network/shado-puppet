import type { Puppet } from '../../../../core/types/puppet.ts'
import type { Task } from '../types.ts'

export default {
  identifier: 'telegram-get-messages',
  conditions: [
    {
      identifier: 'telegram-client',
      value: (props?: unknown) => true,
    },
    {
      identifier: 'telegram-has-messages',
      value: (props?: unknown) => false,
    },
  ],
  effects: [
    {
      identifier: 'telegram-has-messages',
      value: (props?: any) => true,
      // props.currentState['telegram-messages'].length > 0,
    },
  ],
  actions: [
    {
      identifier: 'telegram-get-messages',
      trigger: async (props?: any) => {
        // puppet: Puppet, currentState,
        const messages = props.puppet.interfaces.telegramClient?.getMessages()
        props.currentState['telegram-messages'] = messages
        props.currentState['telegram-has-messages'] =
          props.currentState['telegram-messages'].length > 0

        return messages
      },
    },
  ],
} satisfies Task
