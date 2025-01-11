import dotenv from 'dotenv'
import Anthropic from '@anthropic-ai/sdk'
import type { ClientOptions } from '@anthropic-ai/sdk'
import type {
  TextBlock,
  MessageParam,
} from '@anthropic-ai/sdk/resources/messages.mjs'

import type { CoreLogger } from '../core-logger'

dotenv.config()

export class AnthropicClientPlugin {
  config = {
    MAX_MESSAGES: 100,
  }

  //

  clientOptions: ClientOptions = {
    apiKey: process.env.ANTHROPIC_API_KEY,
  }

  clientConfig = {
    model: 'claude-3-5-sonnet-20241022',
    max_tokens: 256,
    temperature: 1,
  }

  client: Anthropic

  //

  _logger: CoreLogger

  constructor(_logger: CoreLogger) {
    this._logger = _logger

    this.clientConfig = { ...this.clientConfig }
    this.client = new Anthropic(this.clientOptions)
  }

  //

  getMessagesResponse = async (
    messages: MessageParam[],
    systemPrompt: string,
  ) => {
    const response = await this.client.messages.create({
      model: this.clientConfig.model,
      max_tokens: this.clientConfig.max_tokens,
      temperature: this.clientConfig.temperature,
      //
      system: systemPrompt,
      //
      messages: messages.slice(-1 * this.config.MAX_MESSAGES),
    })

    // TODO: What's this array exactly?
    // TODO: Filter this on TextBlocks?
    const responseText = (response?.content[0] as TextBlock)?.text || null

    if (responseText === null) {
      this._logger.send({
        type: 'WARNING',
        source: 'SERVER',
        message: 'Error parsing response',
        payload: {
          content: response.content,
        },
      })
    }

    return responseText
  }
}
