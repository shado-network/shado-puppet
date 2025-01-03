import type { MessageParam } from '@anthropic-ai/sdk/resources/messages.mjs'

import type { CoreLogger } from '../../core-logger/index.ts'
import type { PuppetDefinition } from '../../../core/types/puppet.ts'
import type { AnthropicClientPlugin } from '../../client-anthropic/index.ts'
import type { TelegramClientPlugin } from '../../client-telegram/index.ts'
import type { TwitterClientPlugin } from '../../client-twitter/index.ts'

const shadoActions = {}

const modelActions = {
  generateResponse: async (
    agentDefinition: PuppetDefinition,
    messages: MessageParam[],
    model: AnthropicClientPlugin,
    _logger: CoreLogger,
  ) => {
    const response = await model.getMessagesResponse(
      messages,
      agentDefinition.bio.at(0),
    )

    const message: MessageParam = {
      role: 'assistant',
      content: response,
    }

    messages.push(message)

    _logger.send({
      type: 'LOG',
      source: 'AGENT',
      puppetId: agentDefinition.id,
      message: 'Wrote a message:',
      payload: {
        message: response,
      },
    })

    return message
  },
}

const telegramActions = {
  getMessages: (telegramClient: TelegramClientPlugin) => {
    return telegramClient.getMessages()
  },
  markAsRead: (messageId: number, telegramClient: TelegramClientPlugin) => {
    return telegramClient.markAsRead(messageId)
  },
  sendMessage: (
    message: string,
    ctx: any,
    telegramClient: TelegramClientPlugin,
  ) => {
    return telegramClient.sendMessage(message, ctx)
  },
}

const twitterActions = {
  login: async (
    agentDefinition: PuppetDefinition,
    twitterClient: TwitterClientPlugin,
    _logger: CoreLogger,
  ) => {
    await twitterClient.login(agentDefinition)
  },
  getMessages: async (
    agentDefinition: PuppetDefinition,
    messages: MessageParam[],
    twitterClient: TwitterClientPlugin,
    _logger: CoreLogger,
  ) => {
    return await twitterClient.getMessages(agentDefinition, messages)
  },
}

export const actions = {
  shado: shadoActions,
  model: modelActions,
  telegram: telegramActions,
  twitter: twitterActions,
}
