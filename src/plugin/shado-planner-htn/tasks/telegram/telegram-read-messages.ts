import { HumanMessage, SystemMessage } from '@langchain/core/messages'

import { SEC_IN_MSEC } from '../../../../core/libs/constants.ts'
import type { Task } from '../types'

export default {
  identifier: 'telegram-read-messages',

  conditions: {
    'telegram-has-client': (props) =>
      props.state['telegram-has-client'] === true,
    'telegram-has-messages': (props) =>
      props.state['telegram-has-messages'] === true,
    'telegram-last-replied': (props) =>
      props.state['telegram-last-replied'] <= Date.now() - 1 * SEC_IN_MSEC,
  },

  effects: {
    'telegram-has-messages': {
      value: (props) => false,
      trigger: async (props) => {
        props.state['telegram-messages'] = []
        props.state['telegram-has-messages'] = false

        return {
          success: true,
          payload: null,
        }
      },
    },
    'telegram-last-replied': {
      value: (props) =>
        props.state['telegram-last-replied'] <= Date.now() - 1 * SEC_IN_MSEC,
      trigger: async (props) => {
        props.state['telegram-last-replied'] = Date.now()

        return {
          success: true,
          payload: null,
        }
      },
    },
  },

  actions: {
    'telegram-read-messages': async (props) => {
      try {
        const replied = []
        let messages = []
        let firstMessageInThread = false

        // NOTE: Loop through messages.
        props.state['telegram-messages'].forEach(async (message) => {
          if (message.isRead) {
            return
          }

          // NOTE: Mark message as read.
          props.puppet.clients.telegram.markAsRead(message.id)

          props._app.utils.logger.send({
            type: 'LOG',
            source: 'AGENT',
            puppetId: props.puppet.id,
            message: 'Got a Telegram message',
            payload: {
              message: message.message,
            },
          })

          // NOTE: Should reply to message?
          if (!shouldReplyToMessage(props, message.ctx)) {
            props._app.utils.logger.send({
              type: 'LOG',
              source: 'AGENT',
              puppetId: props.puppet.id,
              message: 'Chose to ignore Telegram message:',
              payload: {
                message: message.message,
              },
            })

            replied.push(false)

            return
          }

          // NOTE: Write response.

          // NOTE: Check if this is a new thread.
          if (
            !props.puppet.clients.telegram
              .getMessageThreads()
              .includes(`telegram-${message.from_id}`)
          ) {
            props.puppet.clients.telegram.addMessageThread(
              `telegram-${message.from_id}`,
            )

            firstMessageInThread = true
          }

          if (firstMessageInThread) {
            messages = [
              new SystemMessage(props.puppet.config.bio.join('\n')),
              new HumanMessage(message.message),
            ]
          } else {
            messages = [new HumanMessage(message.message)]
          }

          // NOTE: Generate a response.
          const response = await (
            props.puppet.model as any
          ).getMessagesResponse(messages, {
            thread: `telegram-${message.from_id}`,
          })

          // console.log(
          //   { response, message },
          //   { thread: `telegram-${message.from_id}` },
          // )

          // NOTE: Send the reply.
          await props.puppet.clients.telegram.replyToMessage(
            response as string,
            message.ctx,
          )

          replied.push(true)

          // TODO: Move to runtime?
          // NOTE: Fake a delay for a more "human" response?
          // const sleepForInSeconds = response.length * this.config.SECONDS_PER_CHAR
          // await asyncSleep(sleepForInSeconds)
        })

        // NOTE: Check if all messages got a reply.
        // if (replied.every((reply) => reply === true) && replied.length > 0) {
        return {
          success: true,
          payload: null,
        }
        // } else {
        //   return {
        //     success: false,
        //     payload: null,
        //   }
        // }
      } catch (error) {
        return {
          success: false,
          payload: error,
        }
      }
    },
  },
} satisfies Task

const shouldReplyToMessage = (props, ctx) => {
  // NOTE: Check if it's in a private chat.
  const isInPrivateChat = ctx.message.chat.type === 'private'

  // NOTE: Check if they are mentioned.
  const isMentioned =
    ctx.message.text.includes(
      `@${process.env[`TELEGRAM_${props.puppet.id.toUpperCase()}_BOT_HANDLE`]}`,
    ) ||
    ctx.message.text.includes(
      `${process.env[`TELEGRAM_${props.puppet.id.toUpperCase()}_BOT_HANDLE`]}`,
    ) ||
    ctx.message.text.includes(`${props.puppet.name}`)

  // NOTE: Check if there is a mention of swarm members.
  // const isFromSwarmPuppet = [
  //   'aigent_of_good_bot',
  //   'aigent_of_evil_bot',
  // ]
  //   .filter((handle) => {
  //     return !(
  //       handle ===
  //       process.env[
  //         `TELEGRAM_${props.puppet.id.toUpperCase()}_BOT_HANDLE`
  //       ]
  //     )
  //   })
  //   .includes(ctx.message.from.username)

  const checks = [
    isInPrivateChat,
    isMentioned,
    // isFromSwarmPuppet
  ]

  // NOTE: Check if any of the checks pass.
  if (checks.some((filter) => filter)) {
    // NOTE: Should reply to message.
    return true
  }

  // NOTE: Should not reply to message.
  return false
}
