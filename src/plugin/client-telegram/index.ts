import { Telegraf } from 'telegraf'
import { message } from 'telegraf/filters'
import type { FmtString } from 'telegraf/format'

import type { AppContext } from '../../core/context/types.ts'
import type { PuppetInstance } from '../../core/puppet/types.ts'
import type { AbstractAppPlugin } from '../../core/abstract/types.ts'
import type { TelegramMessage } from './types.ts'

class TelegramClientPlugin {
  config = {
    SECONDS_PER_CHAR: 0.0125,
  }

  //

  client: Telegraf
  clientConfig: any = {}
  clientSecrets: any = {}

  threads: string[] = []
  messages: TelegramMessage[] = []

  //

  _app: AppContext
  _puppet: PuppetInstance

  //

  constructor(
    clientConfig: any,
    clientSecrets: any,
    _puppet: PuppetInstance,
    _app: AppContext,
  ) {
    this._app = _app
    this._puppet = _puppet

    this.clientConfig = {
      ...this.clientConfig,
      ...clientConfig,
    }

    this.clientSecrets = {
      ...this.clientSecrets,
      ...clientSecrets,
    }

    try {
      this.client = new Telegraf(this.clientSecrets.botToken)
    } catch (error) {
      this._app.utils.logger.send({
        type: 'ERROR',
        origin: {
          type: 'PUPPET',
          id: this._puppet.config.id,
        },
        data: {
          message: 'Could not connect to Telegram bot',
        },
      })
    }

    this._init()
  }

  _init = async () => {
    this.client.on(message('text'), (ctx) => {
      this._storeMessage(ctx)
    })

    this.client.launch()

    process.once('SIGINT', () => this.client.stop('SIGINT'))
    process.once('SIGTERM', () => this.client.stop('SIGTERM'))
  }

  _storeMessage = async (ctx: any) => {
    const message: TelegramMessage = {
      id: ctx.message.message_id,
      text: ctx.message.text,
      is_read: false,
      //
      from: {
        id: ctx.message.from.id,
        name: ctx.message.from.first_name,
      },
      metadata: {
        chat: { type: ctx.message.chat.type },
        replyFn: async (message: string) => {
          await ctx.reply(message, {
            reply_to_message_id: ctx.message.message_id,
          })
        },
      },
    }

    this.messages.push(message)

    return message
  }

  getMessageThreads = () => {
    return this.threads
  }

  addMessageThread = (threadIdentifier: string) => {
    this.threads.push(threadIdentifier)
  }

  getMessages = () => {
    return this.messages.filter((message) => !message.is_read)
  }

  clearReadMessages = () => {
    this.messages = this.messages.filter((message) => !message.is_read)
  }

  sendMessage = async (message: string | FmtString, chatId: string) => {
    const newCtx = await this.client.telegram.sendMessage(chatId, message)
  }

  replyToMessage = async (message: string, replyFn) => {
    const newCtx = await replyFn(message)
  }

  markAsRead = async (messageId: number) => {
    const message = this.messages.find((message) => message.id === messageId)

    if (!message) {
      return
    }

    message.is_read = true

    // TODO: Purge message?
  }
}

export default {
  identifier: 'client-telegram',
  description: 'Wrapper for OpenAI interaction through LangChain.',
  key: 'telegram',
  plugin: TelegramClientPlugin,
} satisfies AbstractAppPlugin
