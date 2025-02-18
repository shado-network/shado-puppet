import type { HtnTask } from '../../types.ts'

export default {
  identifier: 'telegram-get-messages',
  description: 'Retrieve messages received on Telegram.',

  conditions: {
    'telegram-has-client': (props) =>
      props._puppet.runtime.memory.state?.['telegram-has-client'] === true,
    'telegram-has-messages': (props) =>
      props._puppet.runtime.memory.state?.['telegram-has-messages'] === false,
  },

  effects: {
    'telegram-has-messages': {
      value: (props) => true,
      trigger: async (props) => {
        props._puppet.runtime.memory.state['telegram-has-messages'] =
          props._puppet.runtime.memory.state?.['telegram-messages']?.length > 0

        return {
          success: true,
          payload: undefined,
        }
      },
    },
  },

  actions: {
    'telegram-get-messages': async (props) => {
      try {
        const messages = props._puppet.runtime.clients['telegram'].getMessages()
        props._puppet.runtime.memory.state['telegram-messages'] = messages
        return {
          success: true,
          payload: messages,
        }
      } catch (error) {
        return {
          success: false,
          payload: error,
        }
      }
    },
  },
} satisfies HtnTask
