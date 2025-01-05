import { tasks } from './tasks.ts'
import type { CoreLogger } from '../../core-logger/index.ts'
import type { Puppet } from '../../../core/types/puppet.ts'
import { AnthropicClientPlugin } from '../../client-anthropic/index.ts'

export const telegramPlanner = (puppet: Puppet, _logger: CoreLogger) => {
  try {
    if (!puppet.interfaces.telegramClient) {
      _logger.send({
        type: 'WARNING',
        source: 'PUPPET',
        puppetId: puppet.id,
        message: `No Telegram client found`,
      })

      return
    }

    setInterval(() => {
      // MARK: Read
      const messages = tasks.telegram.getMessages(
        puppet.interfaces.telegramClient,
      )

      messages.forEach(async (message) => {
        if (message.isRead) {
          return
        }

        tasks.telegram.markAsRead(message.id, puppet.interfaces.telegramClient)

        _logger.send({
          type: 'LOG',
          source: 'AGENT',
          puppetId: puppet.id,
          message: 'Got a Telegram message',
          payload: {
            message: message.message,
          },
        })

        // MARK: Should reply?
        const shouldReply = (ctx) => {
          // console.log(ctx)

          // MARK: Private chat.
          const isInPrivateChat = ctx.message.chat.type === 'private'

          // MARK: Mention of self.
          const isMentioned = ctx.message.text.includes(
            `@${process.env[`TELEGRAM_${puppet.id.toUpperCase()}_BOT_HANDLE`]}`,
          )

          // MARK: Mention of swarm.
          const isFromSwarmPuppet = ['aigent_of_good_bot', 'aigent_of_evil_bot']
            .filter((handle) => {
              return !(
                handle ===
                process.env[`TELEGRAM_${puppet.id.toUpperCase()}_BOT_HANDLE`]
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
          const response = await tasks.model.generateResponse(
            puppet.definition,
            [
              {
                role: 'user',
                // content: `${message.from} (${message.ctx.message.from.username}) says: ${message.ctx.message.text}`,
                content: `${message.from} says: ${message.message}`,
              },
            ],
            puppet.model as AnthropicClientPlugin,
            _logger,
          )

          /// MARK: Post
          await tasks.telegram.sendMessage(
            response.content as string,
            message.ctx,
            puppet.interfaces.telegramClient,
          )
        } else {
          _logger.send({
            type: 'LOG',
            source: 'AGENT',
            puppetId: puppet.id,
            message: 'Chose to ignore Telegram message:',
            payload: {
              message: message.message,
            },
          })
        }
      })
    }, 1 * 1000)
  } catch (error) {
    _logger.send({
      type: 'ERROR',
      source: 'PUPPET',
      puppetId: puppet.id,
      message: `Error in agent planner`,
      payload: { error },
    })
  }
}
