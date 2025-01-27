import dotenv from 'dotenv'

import { ChatOpenAI } from '@langchain/openai'
import type { ChatOpenAIFields, ClientOptions } from '@langchain/openai'
import type { BaseLanguageModelInput } from '@langchain/core/language_models/base'

import type { AppContext } from '../../core/context/types'

dotenv.config()

export class DeepSeekClientPlugin {
  fields: ChatOpenAIFields = {
    model: 'deepseek-chat',
    temperature: 1,
    maxTokens: 256,
  }

  config: ClientOptions = {
    apiKey: process.env.DEEPSEEK_API_KEY,
    baseURL: 'https://api.deepseek.com',
  }

  client: ChatOpenAI

  //

  _memoryClient
  _app: AppContext

  //

  constructor(_memoryClient: any, _app: AppContext) {
    this._app = _app

    this.client = new ChatOpenAI(this.fields, this.config)
    this._memoryClient = _memoryClient(this.client)
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
