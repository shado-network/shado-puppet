import { fmt, code } from 'telegraf/format'

import TelegramClientPlugin from '@plugins/client-telegram/index.js'
import type { AppContext } from '@core/context/types'
import type { PuppetInstance } from '@core/puppet/types'
import type { AbstractLogger } from '@core/abstract/types'
import type { ShadoSandboxConfig, ShadoSandboxMessage } from '../types'

export class ShadoSandboxTelegramClient {
  config: ShadoSandboxConfig

  client: any
  clientConfig = {}
  clientSecrets = {
    botHandle: process.env['SANDBOX_TELEGRAM_BOT_HANDLE'],
    botToken: process.env['SANDBOX_TELEGRAM_BOT_TOKEN'],
    chatId: process.env['SANDBOX_TELEGRAM_CHAT_ID'],
  }

  _logger: AbstractLogger

  constructor(config: ShadoSandboxConfig, _logger: AbstractLogger) {
    this.config = config
    this._logger = _logger

    this._init()
  }

  _init = async () => {
    try {
      // TODO: Make this cleaner.
      const sandboxPuppetInstance = {
        runtime: {
          id: 'sandbox',
          //
          model: undefined,
          clients: undefined,
          memory: undefined,
          //
          events: undefined,
        },
        config: {
          id: 'sandbox',
          name: 'Shadō Puppet Sandbox',
          //
          planner: undefined,
          model: undefined,
          clients: [
            {
              identifier: 'client-telegram',
              config: this.clientConfig,
              secrets: this.clientSecrets,
            },
          ],
          //
          bio: undefined,
        },
      } satisfies PuppetInstance

      const sandboxApp = {
        config: undefined,
        core: undefined,
        plugins: undefined,
        utils: {
          logger: undefined,
          sandbox: this,
        },
      } satisfies AppContext

      // NOTE: Telegram sandbox client.
      this.client = new TelegramClientPlugin.plugin(
        this.clientConfig,
        this.clientSecrets,
        sandboxPuppetInstance,
        sandboxApp,
      )
    } catch (error) {
      this._logger.send({
        type: 'ERROR',
        origin: {
          type: 'SERVER',
        },
        data: {
          message: 'Could not start Telegram sandbox client',
          payload: { error },
        },
      })
    }
  }

  _composeTelegramMessage = async (sandboxMessage: ShadoSandboxMessage) => {
    // NOTE: Styling.
    // TODO: Make same stylistic choices as the console logger.

    // NOTE: Logging.
    // TODO: Check if there is a payload.
    const message = fmt`
  [ PUPPET / ${sandboxMessage.origin.id?.toUpperCase()} ]
  ${sandboxMessage.data.message}
  
  PAYLOAD: 
  ${code`${JSON.stringify(sandboxMessage.data.payload || null, null, 2)}`}
  `

    await this.client.sendMessage(message, this.clientSecrets.chatId)
  }

  send = async (sandboxMessage: ShadoSandboxMessage) => {
    // TODO: Split into compose and send.
    await this._composeTelegramMessage(sandboxMessage)
  }
}
