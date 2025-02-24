import type { HtnTask } from '../../types'

export default {
  identifier: 'twitter-get-messages',
  description: 'Retrieve messages from Twitter.',

  conditions: {
    'twitter-has-client': (props) =>
      props._puppet.runtime.memory.state?.['twitter-has-client'] === true,
    'twitter-has-logged-in': (props) =>
      props._puppet.runtime.memory.state?.['twitter-has-logged-in'] === true,
    'twitter-has-messages': (props) =>
      props._puppet.runtime.memory.state?.['twitter-has-messages'] === false,
  },

  effects: {
    'twitter-has-messages': {
      value: (props) => true,
      trigger: async (props) => {
        props._puppet.runtime.memory.state['twitter-has-messages'] = true
        // props._puppet.runtime.memory.state['twitter-has-messages'] = props._puppet.runtime.memory.state?.['twitter-messages'].length > 0

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
        const messages = props._puppet.runtime.clients['twitter'].getMessages()
        props._puppet.runtime.memory.state['twitter-messages'] = messages

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
