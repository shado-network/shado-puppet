import { MIN_IN_MSEC } from '../../../../core/libs/constants.ts'
import type { Task } from '../types'

export default {
  identifier: 'twitter-log-in',

  conditions: {
    'twitter-has-client': (props) => props.state['twitter-has-client'] === true,
    'twitter-has-logged-in': (props) =>
      props.state['twitter-has-logged-in'] === false,
    'twitter-last-log-in': (props) =>
      props.state['twitter-last-log-in-attempt'] <=
      Date.now() - 1 * MIN_IN_MSEC,
  },

  effects: {
    'twitter-has-logged-in': {
      value: (props) => true,
      trigger: async (props) => {
        props.state['twitter-has-logged-in'] = true

        return {
          success: true,
          payload: null,
        }
      },
    },
    'twitter-last-log-in-attempt': {
      value: (props) =>
        props.state['twitter-log-in-try'] <= Date.now() - 1 * MIN_IN_MSEC,
      trigger: async (props) => {
        props.state['twitter-last-log-in-attempt'] = Date.now()

        return {
          success: true,
          payload: null,
        }
      },
    },
  },

  actions: {
    'twitter-log-in': async (props) => {
      props.state['twitter-last-log-in-attempt'] = Date.now()

      try {
        const result = await props.puppet.interfaces.twitterClient.login()

        if (result === true) {
          return {
            success: true,
            payload: null,
          }
        } else {
          return {
            success: false,
            payload: null,
          }
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
