import { ChatAnthropic } from '@langchain/anthropic'
import type { AnthropicInput } from '@langchain/anthropic'
import type { BaseChatModelParams } from '@langchain/core/language_models/chat_models'
import type { BaseLanguageModelInput } from '@langchain/core/language_models/base'

import type { AppContext } from '@core/context/types'
import type { AbstractPlugin } from '@core/abstract/types'

class AnthropicAdapterPlugin {
  // TODO: Get from puppet file.
  config: AnthropicInput & BaseChatModelParams = {
    apiKey: process.env.ANTHROPIC_API_KEY,
    model: 'claude-3-5-sonnet-20241022',
    temperature: 1.0,
    maxTokens: 256,
  }

  adapter: ChatAnthropic

  //

  _memoryClient
  _app: AppContext

  //

  constructor(_memoryClient: any, _app: AppContext) {
    this._app = _app

    // TODO: Merge with puppet file config.
    this.adapter = new ChatAnthropic(this.config)
    this._memoryClient = _memoryClient(this.adapter)
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
      this._app.utils.logger.send({
        type: 'WARNING',
        origin: {
          type: 'SERVER',
        },
        data: {
          message: 'Error parsing response',
          payload: { content: response.content },
        },
      })
    }

    return response.messages[response.messages.length - 1].content
  }
}

export default {
  identifier: 'adapter-anthropic',
  description: 'Wrapper for Anthropic Claude interaction through LangChain.',
  key: 'model',
  plugin: AnthropicAdapterPlugin,
} satisfies AbstractPlugin
