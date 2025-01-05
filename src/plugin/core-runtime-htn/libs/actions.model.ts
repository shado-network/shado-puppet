import type { MessageParam } from '@anthropic-ai/sdk/resources/messages.mjs'

import type { CoreLogger } from '../../core-logger/index.ts'
import type { PuppetDefinition } from '../../../core/types/puppet.ts'
import type { AnthropicClientPlugin } from '../../client-anthropic/index.ts'

export const modelActions = {
  generateResponse: async (
    puppetDefinition: PuppetDefinition,
    messages: MessageParam[],
    model: AnthropicClientPlugin,
    _logger: CoreLogger,
  ) => {
    const response = await model.getMessagesResponse(
      messages,
      puppetDefinition.bio.at(0),
    )

    const message: MessageParam = {
      role: 'assistant',
      content: response,
    }

    messages.push(message)

    _logger.send({
      type: 'LOG',
      source: 'AGENT',
      puppetId: puppetDefinition.id,
      message: 'Wrote a message:',
      payload: {
        message: response,
      },
    })

    return message
  },
}
