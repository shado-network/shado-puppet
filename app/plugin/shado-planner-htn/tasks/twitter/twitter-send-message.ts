import { HumanMessage, SystemMessage } from '@langchain/core/messages'

import { MIN_IN_MSEC } from '@core/libs/constants.js'
import type { HtnTask } from '../../types'

export default {
  identifier: 'twitter-send-message',
  description: 'Post a message to Twitter.',

  conditions: {
    'twitter-has-client': (props) =>
      props._puppet.runtime.memory.state?.['twitter-has-client'] === true,
    'twitter-has-logged-in': (props) =>
      props._puppet.runtime.memory.state?.['twitter-has-logged-in'] === true,
    'twitter-last-sent': (props) =>
      props._puppet.runtime.memory.state?.['twitter-last-sent'] <=
      Date.now() - 3 * MIN_IN_MSEC,
  },

  effects: {
    'twitter-last-sent': {
      // value: (props) => false,
      value: (props) =>
        props._puppet.runtime.memory.state?.['twitter-last-sent'] <=
        Date.now() - 3 * MIN_IN_MSEC,
      trigger: async (props) => {
        props._puppet.runtime.memory.state['twitter-last-sent'] = Date.now()

        return {
          success: true,
          payload: undefined,
        }
      },
    },
  },

  actions: {
    'twitter-send-message': async (props) => {
      try {
        let messages = []
        let firstMessageInThread = false

        // TODO: Temp fix!
        const message = {
          from_id: 'SELF',
          message: 'What are you thinking about today?',
        }

        // NOTE: Write response.

        // NOTE: Check if this is a new thread.
        if (
          !props._puppet.runtime.clients['twitter']
            .getMessageThreads()
            .includes(`twitter-${message.from_id}`)
        ) {
          props._puppet.runtime.clients['twitter'].addMessageThread(
            `twitter-${message.from_id}`,
          )

          firstMessageInThread = true
        }

        if (firstMessageInThread) {
          messages = [
            new SystemMessage(props._puppet.config.bio.join('\n')),
            new HumanMessage(message.message),
          ]
        } else {
          message.message = 'Could you elaborate?'
          messages = [new HumanMessage(message.message)]
        }

        // console.log('!!!', messages, `twitter-${message.from_id}`)

        // NOTE: Generate a response.
        const response = await (
          props._puppet.runtime.model as any
        ).getMessagesResponse(messages, {
          thread: `twitter-${message.from_id}`,
        })

        // console.log('???', props._puppet.runtime.clients['twitter'].sendMessage)

        // NOTE: Send the message.
        await props._puppet.runtime.clients['twitter'].sendMessage(
          response as string,
        )

        // props._puppet.runtime.clients['twitter'].markAsRead(message.id)

        return {
          success: true,
          payload: response,
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
