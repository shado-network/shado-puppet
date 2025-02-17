import { ChatOpenAI } from '@langchain/openai'
import type { ChatOpenAIFields, ClientOptions } from '@langchain/openai'
import type { BaseLanguageModelInput } from '@langchain/core/language_models/base'

import type { AppContext } from '../../core/context/types.ts'
import type { AbstractPlugin } from '../../core/abstract/types.ts'

class DeepSeekAdapterPlugin {
  // TODO: Get from puppet file.
  fields: ChatOpenAIFields = {
    model: 'deepseek-chat',
    temperature: 1.0,
    maxTokens: 256,
  }

  // TODO: Get from puppet file.
  config: ClientOptions = {
    apiKey: process.env.DEEPSEEK_API_KEY,
    baseURL: 'https://api.deepseek.com',
  }

  adapter: ChatOpenAI

  //

  _memoryClient
  _app: AppContext

  //

  constructor(_memoryClient: any, _app: AppContext) {
    this._app = _app

    // TODO: Merge with puppet file config.
    this.adapter = new ChatOpenAI(this.fields, this.config)
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
  identifier: 'adapter-deepseek',
  description: 'Wrapper for DeepSeek interaction through LangChain.',
  key: 'model',
  plugin: DeepSeekAdapterPlugin,
} satisfies AbstractPlugin
