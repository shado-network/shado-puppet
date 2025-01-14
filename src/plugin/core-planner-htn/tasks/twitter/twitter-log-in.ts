import type { Task } from '../types.ts'

export default {
  identifier: 'twitter-log-in',
  conditions: {
    'twitter-has-client': (props) => true,
    'twitter-logged-in': (props) => false,
  },

  effects: {
    'twitter-logged-in': {
      value: (props) => true,
      trigger: async (props) => {
        props.state['twitter-logged-in'] = true

        return {
          success: true,
          payload: null,
        }
      },
    },
  },

  actions: {
    'twitter-log-in': async (props) => {
      try {
        await props.puppet.interfaces.twitterClient.login()

        return {
          success: true,
          payload: null,
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
