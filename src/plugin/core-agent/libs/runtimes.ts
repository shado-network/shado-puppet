import { actions } from './actions.ts'
import type { CoreLogger } from '../../core-logger/index.ts'
import type { PuppetDefinition } from '../../../core/types/puppet.ts'
import type { TelegramClientPlugin } from '../../client-telegram/index.ts'
import type { TwitterClientPlugin } from '../../client-twitter/index.ts'

const telegramRuntime = (
  agentDefinition: PuppetDefinition,
  model,
  telegramClient: TelegramClientPlugin,
  _logger: CoreLogger,
) => {
  try {
    if (!telegramClient) {
      _logger.send({
        type: 'WARNING',
        source: 'PUPPET',
        puppetId: agentDefinition.id,
        message: `No Telegram client found`,
      })

      return
    }

    setInterval(() => {
      // MARK: Read
      const messages = actions.telegram.getMessages(telegramClient)

      messages.forEach(async (message) => {
        if (message.isRead) {
          return
        }

        actions.telegram.markAsRead(message.id, telegramClient)

        _logger.send({
          type: 'LOG',
          source: 'AGENT',
          puppetId: agentDefinition.id,
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
            `@${process.env[`TELEGRAM_${agentDefinition.id.toUpperCase()}_BOT_HANDLE`]}`,
          )

          // MARK: Mention of swarm.
          const isFromSwarmPuppet = ['aigent_of_good_bot', 'aigent_of_evil_bot']
            .filter((handle) => {
              return !(
                handle ===
                process.env[
                  `TELEGRAM_${agentDefinition.id.toUpperCase()}_BOT_HANDLE`
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
          const response = await actions.model.generateResponse(
            agentDefinition,
            [
              {
                role: 'user',
                // content: `${message.from} (${message.ctx.message.from.username}) says: ${message.ctx.message.text}`,
                content: `${message.from} says: ${message.message}`,
              },
            ],
            model,
            _logger,
          )

          /// MARK: Post
          await actions.telegram.sendMessage(
            response.content as string,
            message.ctx,
            telegramClient,
          )
        } else {
          _logger.send({
            type: 'LOG',
            source: 'AGENT',
            puppetId: agentDefinition.id,
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
      puppetId: agentDefinition.id,
      message: `Error in agent runtime`,
      payload: { error },
    })
  }
}

const twitterRuntime = async (
  agentDefinition: PuppetDefinition,
  model,
  messages,
  twitterClient: TwitterClientPlugin,
  _logger: CoreLogger,
) => {
  try {
    if (!twitterClient) {
      _logger.send({
        type: 'WARNING',
        source: 'PUPPET',
        puppetId: agentDefinition.id,
        message: `No Twitter client found`,
      })

      return
    }

    // MARK: Login
    await actions.twitter.login(agentDefinition, twitterClient, _logger)

    // TODO: Loop here?
    // MARK: Read
    const getMessages = await actions.twitter.getMessages(
      agentDefinition,
      messages,
      twitterClient,
      _logger,
    )

    // TODO: MOVE!
    // MARK: Should reply?
    if (getMessages.shouldReply) {
      // MARK: Write
      // await actions.model.generateResponse(
      //   agentDefinition,
      //   messages,
      //   model,
      //   _logger,
      // )
    } else {
      _logger.send({
        type: 'LOG',
        source: 'AGENT',
        puppetId: agentDefinition.id,
        message: 'Chose to ignore Telegram message::',
        payload: {
          message: getMessages.message,
        },
      })
    }

    // MARK: Post
    // TODO: Tweet
  } catch (error) {
    _logger.send({
      type: 'ERROR',
      source: 'PUPPET',
      puppetId: agentDefinition.id,
      message: `Error in agent runtime`,
      payload: { error },
    })
  }
}

export const runtimes = {
  telegram: telegramRuntime,
  twitter: twitterRuntime,
}
