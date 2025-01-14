import dotenv from 'dotenv'

import { ChatAnthropic } from '@langchain/anthropic'
import type { AnthropicInput } from '@langchain/anthropic'
import type { BaseChatModelParams } from '@langchain/core/language_models/chat_models'
import type { BaseLanguageModelInput } from '@langchain/core/language_models/base'

import type { CoreLogger } from '../core-logger'

dotenv.config()

export class AnthropicClientPlugin {
  config: AnthropicInput & BaseChatModelParams = {
    apiKey: process.env.ANTHROPIC_API_KEY,
    model: 'claude-3-5-sonnet-20241022',
    // temperature: 1,
    // maxTokens: 256,
  }

  client: ChatAnthropic
  _memoryClient

  //

  _logger: CoreLogger

  //

  constructor(_memoryClient: any, _logger: CoreLogger) {
    this.client = new ChatAnthropic(this.config)
    this._memoryClient = _memoryClient(this.client)

    this._logger = _logger
  }

  getMessagesResponse = async (
    messages: BaseLanguageModelInput,
    props: any,
  ) => {
    const response = await this._memoryClient.invoke(
      { messages },
      { configurable: { thread_id: props.thread } },
    )

    if (!response || !response.messages || response.messages.length === 0) {
      this._logger.send({
        type: 'WARNING',
        source: 'SERVER',
        message: 'Error parsing response',
        payload: {
          content: response.content,
        },
      })
    }

    return response.messages[response.messages.length - 1].content
  }
}
