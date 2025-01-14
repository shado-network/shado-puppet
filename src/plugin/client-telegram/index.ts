import dotenv from 'dotenv'
import { Telegraf } from 'telegraf'
import { message } from 'telegraf/filters'

import { asyncSleep } from '../../core/libs/utils.ts'
import type { AppContext } from '../../context.ts'
import type { PuppetConfig } from '../../core/types/puppet.ts'

dotenv.config()

export class TelegramClientPlugin {
  config = {
    SECONDS_PER_CHAR: 0.0125,
  }

  //

  clientConfig = {}

  client: Telegraf
  messages: any[] = []
  threads: string[] = []

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

  getMessages = () => {
    return this.messages.filter((message) => !message.isRead)
  }

  clearReadMessages = () => {
    this.messages = this.messages.filter((message) => !message.isRead)
  }

  getThreads = () => {
    return this.threads
  }

  addThread = (threadIdentifier: string) => {
    this.threads.push(threadIdentifier)
  }

  sendMessage = async (message: string, ctx) => {
    // TODO: Move to runtime?
    // MARK: Fake a delay for a more "human" response.
    const sleepForInSeconds = message.length * this.config.SECONDS_PER_CHAR
    await asyncSleep(sleepForInSeconds)

    const newCtx = await ctx.reply(message, {
      reply_to_message_id: ctx.message.message_id,
      // reply_to_message_id: ctx.id,
    })

    // console.log(newCtx)
  }

  markAsRead = async (messageId: number) => {
    const message = this.messages.find((message) => message.id === messageId)

    if (!message) {
      return
    }

    message.isRead = true
    // TODO: Purge
  }
}
