import type { Task } from '../types.ts'

export default {
  identifier: 'twitter-get-messages',
  conditions: {
    'twitter-has-client': (props) => true,
    'twitter-logged-in': (props) => true,
    'twitter-has-messages': (props) => false,
  },
  effects: {
    'twitter-has-messages': {
      value: (props) => true,
      trigger: async (props) => {
        props.state['twitter-has-messages'] =
          props.state['twitter-messages'].length > 0

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
        const messages = props.puppet.interfaces.twitterClient.getMessages([])
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
} satisfies Task
