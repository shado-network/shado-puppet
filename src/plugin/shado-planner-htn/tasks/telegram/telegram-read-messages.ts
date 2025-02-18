import { HumanMessage, SystemMessage } from '@langchain/core/messages'

import { SEC_IN_MSEC } from '../../../../core/libs/constants.ts'
import type { TelegramMessage } from '../../../client-telegram/types.ts'
import type { HtnTask, TriggerProps } from '../../types.ts'

export default {
  identifier: 'telegram-read-messages',
  description: 'Reply to retrieved Telegram messages.',

  conditions: {
    'telegram-has-client': (props) =>
      props._puppet.runtime.memory.state?.['telegram-has-client'] === true,
    'telegram-has-messages': (props) =>
      props._puppet.runtime.memory.state?.['telegram-has-messages'] === true,
    'telegram-last-replied': (props) =>
      props._puppet.runtime.memory.state?.['telegram-last-replied'] <=
      Date.now() - 1 * SEC_IN_MSEC,
  },

  effects: {
    'telegram-has-messages': {
      value: (props) => false,
      trigger: async (props) => {
        props._puppet.runtime.memory.state['telegram-messages'] = []
        props._puppet.runtime.memory.state['telegram-has-messages'] = false

        return {
          success: true,
          payload: undefined,
        }
      },
    },
    'telegram-last-replied': {
      value: (props) =>
        props._puppet.runtime.memory.state?.['telegram-last-replied'] <=
        Date.now() - 1 * SEC_IN_MSEC,
      trigger: async (props) => {
        props._puppet.runtime.memory.state['telegram-last-replied'] = Date.now()

        return {
          success: true,
          payload: undefined,
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
        props._puppet.runtime.memory.state?.['telegram-messages'].forEach(
          async (message: TelegramMessage) => {
            if (message.is_read) {
              return
            }

            // NOTE: Mark message as read.
            props._puppet.runtime.clients['telegram'].markAsRead(message.id)

            props._app.utils.logger.send({
              type: 'LOG',
              origin: {
                type: 'AGENT',
                id: props._puppet.config.id,
              },
              data: {
                message: 'Got a Telegram message',
                payload: { message: message.text },
              },
            })

            // NOTE: Should reply to message?
            if (
              !_shouldReplyToMessage(
                props,
                message.metadata.chat.type,
                message.text,
              )
            ) {
              props._app.utils.logger.send({
                type: 'LOG',
                origin: {
                  type: 'AGENT',
                  id: props._puppet.config.id,
                },
                data: {
                  message: 'Chose to ignore Telegram message:',
                  payload: { message: message.text },
                },
              })

              replied.push(false)

              return
            }

            // NOTE: Write response.

            // NOTE: Check if this is a new thread.
            if (
              !props._puppet.runtime.clients['telegram']
                .getMessageThreads()
                .includes(`telegram-${message.from.id}`)
            ) {
              props._puppet.runtime.clients['telegram'].addMessageThread(
                `telegram-${message.from.id}`,
              )

              firstMessageInThread = true
            }

            if (firstMessageInThread) {
              messages = [
                new SystemMessage(props._puppet.config.bio.join('\n')),
                new HumanMessage(message.text),
              ]
            } else {
              messages = [new HumanMessage(message.text)]
            }

            // NOTE: Generate a response.
            const response = await (
              props._puppet.runtime.model as any
            ).getMessagesResponse(messages, {
              thread: `telegram-${message.from.id}`,
            })

            // console.log(
            //   { response, message },
            //   { thread: `telegram-${message.from_id}` },
            // )

            // NOTE: Send the reply.
            await props._puppet.runtime.clients['telegram'].replyToMessage(
              response as string,
              message.metadata.replyFn,
            )

            replied.push(true)

            // TODO: Move to runtime?
            // NOTE: Fake a delay for a more "human" response?
            // const sleepForInSeconds = response.length * this.config.SECONDS_PER_CHAR
            // await asyncSleep(sleepForInSeconds)
          },
        )

        // NOTE: Check if all messages got a reply.
        // if (replied.every((reply) => reply === true) && replied.length > 0) {
        return {
          success: true,
          payload: undefined,
        }
        // } else {
        //   return {
        //     success: false,
        //     payload: undefined,
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
} satisfies HtnTask

const _shouldReplyToMessage = (
  props: TriggerProps,
  chatType: string,
  messageText: string,
) => {
  // NOTE: Check if it's in a private chat.
  const isInPrivateChat = chatType === 'private'

  // TODO: Do not get from .env directly. Get from puppet secrets?
  // NOTE: Check if they are mentioned.
  const isMentioned =
    messageText.includes(
      `@${process.env[`TELEGRAM_${props._puppet.config.id.toUpperCase()}_BOT_HANDLE`]}`,
    ) ||
    messageText.includes(
      `${process.env[`TELEGRAM_${props._puppet.config.id.toUpperCase()}_BOT_HANDLE`]}`,
    ) ||
    messageText.includes(`${props._puppet.config.name}`)

  // NOTE: Check if there is a mention of swarm members.
  // const isFromSwarmPuppet = [
  //   'aigent_of_good_bot',
  //   'aigent_of_evil_bot',
  // ]
  //   .filter((handle) => {
  //     return !(
  //       handle ===
  //       process.env[
  //         `TELEGRAM_${props._puppet.config.id.toUpperCase()}_BOT_HANDLE`
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
