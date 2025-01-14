import { HumanMessage, SystemMessage } from '@langchain/core/messages'

import type { Task } from '../types.ts'

export default {
  identifier: 'telegram-read-messages',

  conditions: {
    'telegram-has-client': (props) =>
      props.state['telegram-has-client'] === true,
    'telegram-has-messages': (props) =>
      props.state['telegram-has-messages'] === true,
    'telegram-last-replied': (props) =>
      props.state['telegram-last-replied'] <= Date.now() - 1 * 1000,
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
        props.state['telegram-last-replied'] <= Date.now() - 1 * 1000,
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
          props.puppet.interfaces.telegramClient.markAsRead(message.id)
          console.log('markAsRead', message.id)

          // _logger.send({
          //   type: 'LOG',
          //   source: 'AGENT',
          //   puppetId: puppet.id,
          //   message: 'Got a Telegram message',
          //   payload: {
          //     message: message.message,
          //   },
          // })

          // MARK: Should reply to message?
          if (!shouldReplyToMessage(props, message.ctx)) {
            // _logger.send({
            //   type: 'LOG',
            //   source: 'AGENT',
            //   puppetId: puppet.id,
            //   message: 'Chose to ignore Telegram message:',
            //   payload: {
            //     message: message.message,
            //   },
            // })

            replied.push(false)

            return
          }

          // MARK: Write response.

          // NOTE: Check if this is a new thread.
          if (
            !props.puppet.interfaces.telegramClient
              .getThreads()
              .includes(`telegram-${message.from_id}`)
          ) {
            props.puppet.interfaces.telegramClient.addThread(
              `telegram-${message.from_id}`,
            )

            firstMessageInThread = true
          }

          if (firstMessageInThread) {
            messages = [
              new SystemMessage(props.puppet.config.bio[0]),
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

          // MARK: Send the reply.
          await props.puppet.interfaces.telegramClient.sendMessage(
            response as string,
            message.ctx,
          )

          replied.push(true)
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
  // MARK: Check if it's in a private chat.
  const isInPrivateChat = ctx.message.chat.type === 'private'

  // MARK: Check if they are mentioned.
  const isMentioned =
    ctx.message.text.includes(
      `@${process.env[`TELEGRAM_${props.puppet.id.toUpperCase()}_BOT_HANDLE`]}`,
    ) ||
    ctx.message.text.includes(
      `${process.env[`TELEGRAM_${props.puppet.id.toUpperCase()}_BOT_HANDLE`]}`,
    ) ||
    ctx.message.text.includes(`${props.puppet.name}`)

  // MARK: Check if there is a mention of swarm members.
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

  const filters = [
    isInPrivateChat,
    isMentioned,
    // isFromSwarmPuppet
  ]

  // NOTE: Check if any of the filters pass.
  if (filters.some((filter) => filter)) {
    // NOTE: Should reply to message.
    return true
  }

  // NOTE: Should not reply to message.
  return false
}
