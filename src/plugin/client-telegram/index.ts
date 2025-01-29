import dotenv from 'dotenv'
import { Telegraf } from 'telegraf'
import { message } from 'telegraf/filters'

import type { AppContext } from '../../core/context/types'
import type { PuppetConfig } from '../../core/puppet/types'

dotenv.config()

export class TelegramClientPlugin {
  config = {
    SECONDS_PER_CHAR: 0.0125,
  }

  //

  clientConfig = {}

  client: Telegraf
  threads: string[] = []
  messages: any[] = []

  //

  puppetConfig: PuppetConfig

  _app: AppContext

  //

  constructor(puppetConfig: PuppetConfig, _app: AppContext) {
    this._app = _app

    this.puppetConfig = puppetConfig

    this._app.utils.logger.send({
      type: 'SUCCESS',
      source: 'PUPPET',
      puppetId: this.puppetConfig.id,
      message: `Loaded client plugin "client-telegram"`,
    })

    try {
      this.client = new Telegraf(
        process.env[`TELEGRAM_${puppetConfig.id.toUpperCase()}_BOT_TOKEN`],
      )

      this._app.utils.logger.send({
        type: 'SUCCESS',
        source: 'PUPPET',
        puppetId: this.puppetConfig.id,
        message: 'Connected to Telegram bot',
      })
    } catch (error) {
      this._app.utils.logger.send({
        type: 'ERROR',
        source: 'PUPPET',
        puppetId: this.puppetConfig.id,
        message: 'Could not connect to Telegram bot',
      })
    }

    this._init()
  }

  _init = async () => {
    this.client.on(message('text'), (ctx) => {
      this._storeMessage(ctx)
    })

    this.client.launch()
  }

  _storeMessage = async (ctx) => {
    const newMessage = {
      id: ctx.message.message_id,
      from: ctx.message.from.first_name,
      from_id: ctx.message.from.id,
      message: ctx.message.text,
      isRead: false,
      ctx,
    }

    this.messages.push(newMessage)

    return newMessage
  }

  getMessageThreads = () => {
    return this.threads
  }

  addMessageThread = (threadIdentifier: string) => {
    this.threads.push(threadIdentifier)
  }

  getMessages = () => {
    return this.messages.filter((message) => !message.isRead)
  }

  clearReadMessages = () => {
    this.messages = this.messages.filter((message) => !message.isRead)
  }

  sendMessage = async (message: string, chatId: string) => {
    const newCtx = await this.client.telegram.sendMessage(chatId, message)
  }

  replyToMessage = async (message: string, ctx) => {
    const newCtx = await ctx.reply(message, {
      reply_to_message_id: ctx.message.message_id,
    })
  }

  markAsRead = async (messageId: number) => {
    const message = this.messages.find((message) => message.id === messageId)

    if (!message) {
      return
    }

    message.isRead = true
    // TODO: Purge?
  }
}
