import dotenv from 'dotenv'
import OpenAI from 'openai'
import type { ClientOptions } from 'openai'
import type { ChatCompletionMessageParam } from 'openai/resources/index.mjs'

import type { CoreLogger } from '../core-logger'

dotenv.config()

export class OpenAiClientPlugin {
  config = {
    MAX_MESSAGES: 100,
  }

  //

  clientOptions: ClientOptions = {
    apiKey: process.env.OPENAI_API_KEY,
  }

  clientConfig = {
    model: 'gpt-4o-mini',
    max_tokens: 256,
    temperature: 1,
  }

  client: OpenAI

  //

  _logger: CoreLogger

  constructor(_logger: CoreLogger) {
    this._logger = _logger

    this.client = new OpenAI(this.clientOptions)
  }

  //

  getMessagesResponse = async (
    messages: ChatCompletionMessageParam[],
    persona: string,
  ) => {
    const response = await this.client.chat.completions.create({
      model: this.clientConfig.model,
      max_tokens: this.clientConfig.max_tokens,
      temperature: this.clientConfig.temperature,
      //
      messages: [
        {
          role: 'system',
          content: persona,
        },
        ...messages.slice(-1 * (this.config.MAX_MESSAGES + 1)),
      ],
    })

    // TODO: What's this array exactly?
    const responseText = response.choices[0].message.content

    if (responseText === null) {
      this._logger.send({
        type: 'WARNING',
        source: 'SERVER',
        message: 'Error parsing response',
        payload: {
          content: response,
        },
      })
    }

    return responseText
  }
}
