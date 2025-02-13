import type { HtnTask } from '../types'

export default {
  identifier: 'telegram-get-messages',
  conditions: {
    'telegram-has-client': (props) =>
      props.state['telegram-has-client'] === true,
    'telegram-has-messages': (props) =>
      props.state['telegram-has-messages'] === false,
  },

  effects: {
    'telegram-has-messages': {
      value: (props) => true,
      trigger: async (props) => {
        props.state['telegram-has-messages'] =
          props.state['telegram-messages']?.length > 0

        return {
          success: true,
          payload: null,
        }
      },
    },
  },

  actions: {
    'telegram-get-messages': async (props) => {
      try {
        const messages = props.puppetRuntime.clients['telegram'].getMessages()
        props.state['telegram-messages'] = messages
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
