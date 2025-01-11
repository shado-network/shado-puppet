import dotenv from 'dotenv'

import { ChatOpenAI } from '@langchain/openai'
import type { ChatOpenAIFields } from '@langchain/openai'
import type { BaseLanguageModelInput } from '@langchain/core/language_models/base'

import type { CoreLogger } from '../core-logger'

dotenv.config()

export class OpenAiClientPlugin {
  config: ChatOpenAIFields = {
    apiKey: process.env.OPENAI_API_KEY,
    model: 'gpt-4o-mini',
    // temperature: 1,
    // maxTokens: 256,
  }

  client: ChatOpenAI

  //

  _logger: CoreLogger

  //

  constructor(_logger: CoreLogger) {
    this.client = new ChatOpenAI(this.config)
    this._logger = _logger
  }

  getMessagesResponse = async (messages: BaseLanguageModelInput) => {
    const response = await this.client.invoke(messages)

    if (!response || !response.content) {
      this._logger.send({
        type: 'WARNING',
        source: 'SERVER',
        message: 'Error parsing response',
        payload: {
          content: response.content,
        },
      })
    }

    return response.content
  }
}
