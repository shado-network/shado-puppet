import type { HtnTask } from '../types.ts'

export default {
  identifier: 'twitter-get-messages',

  conditions: {
    'twitter-has-client': (props) => props.state['twitter-has-client'] === true,
    'twitter-has-logged-in': (props) =>
      props.state['twitter-has-logged-in'] === true,
    'twitter-has-messages': (props) =>
      props.state['twitter-has-messages'] === false,
  },

  effects: {
    'twitter-has-messages': {
      value: (props) => true,
      trigger: async (props) => {
        props.state['twitter-has-messages'] = true
        // props.state['twitter-has-messages'] = props.state['twitter-messages'].length > 0

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
        const messages = props.puppetRuntime.clients['twitter'].getMessages([])
        props.state['twitter-messages'] = messages

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
