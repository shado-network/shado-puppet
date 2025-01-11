import { HumanMessage, SystemMessage } from '@langchain/core/messages'

import type { Puppet } from '../../../../core/types/puppet.ts'
import type { Task } from '../types.ts'

export default {
  identifier: 'telegram-read-messages',
  conditions: [
    {
      identifier: 'telegram-client',
      value: (props?: unknown) => true,
    },
    {
      identifier: 'telegram-has-messages',
      value: (props?: unknown) => true,
    },
  ],
  effects: [
    {
      identifier: 'telegram-has-messages',
      value: (props?: unknown) => false,
    },
    {
      identifier: 'telegram-has-replied',
      value: () => {
        return true
      },
    },
  ],
  actions: [
    {
      identifier: 'telegram-read-messages',
      trigger: async (props?: any) => {
        // puppet: Puppet, currentState,

        // console.log(currentState['telegram-messages'])

        props.currentState['telegram-messages'].forEach(async (message) => {
          if (message.isRead) {
            return
          }

          console.log('message', message.message)

          props.puppet.interfaces.telegramClient?.markAsRead(message.id)
          console.log('markasread', message.id)

          // _logger.send({
          //   type: 'LOG',
          //   source: 'AGENT',
          //   puppetId: puppet.id,
          //   message: 'Got a Telegram message',
          //   payload: {
          //     message: message.message,
          //   },
          // })

          // MARK: Should reply?
          const shouldReply = (ctx) => {
            // console.log(ctx)

            // MARK: Private chat.
            const isInPrivateChat = ctx.message.chat.type === 'private'

            // MARK: Mention of self.
            const isMentioned = ctx.message.text.includes(
              `@${process.env[`TELEGRAM_${props.puppet.id.toUpperCase()}_BOT_HANDLE`]}`,
            )

            // MARK: Mention of swarm.
            const isFromSwarmPuppet = [
              'aigent_of_good_bot',
              'aigent_of_evil_bot',
            ]
              .filter((handle) => {
                return !(
                  handle ===
                  process.env[
                    `TELEGRAM_${props.puppet.id.toUpperCase()}_BOT_HANDLE`
                  ]
                )
              })
              .includes(ctx.message.from.username)

            const filters = [
              isInPrivateChat,
              isMentioned,
              // isFromSwarmPuppet
            ]

            if (
              filters.some((filter) => {
                return filter
              })
            ) {
              return true
            }

            return false
          }

          if (shouldReply(message.ctx)) {
            // MARK: Write

            const messages = [
              new SystemMessage(props.puppet.config.bio[0]),
              new HumanMessage(`${message.from} says: ${message.message}`),
            ]

            const response = await (
              props.puppet.model as any
            ).getMessagesResponse(messages)

            console.log({ response, message })

            // MARK: Post
            await props.puppet.interfaces.telegramClient?.sendMessage(
              response as string,
              message.ctx,
            )
          } else {
            // _logger.send({
            //   type: 'LOG',
            //   source: 'AGENT',
            //   puppetId: puppet.id,
            //   message: 'Chose to ignore Telegram message:',
            //   payload: {
            //     message: message.message,
            //   },
            // })
            console.error('IGNORE')
            props.currentState['telegram-has-replied'] = false
          }
        })

        // return puppet.interfaces.telegramClient?.markAsRead(props.messageId)
        props.currentState['telegram-messages'] = []
      },
    },
  ],
} satisfies Task
