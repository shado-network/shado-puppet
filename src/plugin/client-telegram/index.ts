import dotenv from 'dotenv'
import { Telegraf } from 'telegraf'
import { message } from 'telegraf/filters'

import { asyncSleep } from '../../core/libs/utils.ts'
import type { CoreLogger } from '../core-logger/index.ts'
import type { PuppetDefinition } from '../../core/types/puppet.ts'

dotenv.config()

export class TelegramClientPlugin {
  config = {
    SECONDS_PER_CHAR: 0.0125,
  }

  //

  clientConfig = {}

  client: Telegraf

  //

  puppetDefinition: PuppetDefinition
  messages: any[] = []

  _logger: CoreLogger

  constructor(puppetDefinition: PuppetDefinition, _logger: CoreLogger) {
    this._logger = _logger

    this.puppetDefinition = puppetDefinition

    this._logger.send({
      type: 'SUCCESS',
      source: 'PUPPET',
      puppetId: this.puppetDefinition.id,
      message: `Loaded interface plugin "client-telegram"`,
    })

    try {
      this.client = new Telegraf(
        process.env[`TELEGRAM_${puppetDefinition.id.toUpperCase()}_BOT_TOKEN`],
      )

      this._logger.send({
        type: 'SUCCESS',
        source: 'PUPPET',
        puppetId: this.puppetDefinition.id,
        message: 'Connected to Telegram bot',
      })
    } catch (error) {
      this._logger.send({
        type: 'ERROR',
        source: 'PUPPET',
        puppetId: this.puppetDefinition.id,
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
      message: ctx.message.text,
      isRead: false,
      ctx,
    }

    this.messages.push(newMessage)

    return newMessage
  }

  getMessages = () => {
    return this.messages
  }

  sendMessage = async (message: string, ctx) => {
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
  }
}
