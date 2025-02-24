import { ShadoSandboxTelegramClient } from './libs/telegram.js'
import type { ShadoSandboxConfig, ShadoSandboxMessage } from './types'
import type { AbstractLogger, AbstractPlugin } from '@core/abstract/types'

class ShadoSandboxPlugin {
  config: ShadoSandboxConfig = {}

  clients = []

  constructor(
    clientIdentifiers: AbstractPlugin['identifier'][],
    _logger: AbstractLogger,
  ) {
    this._init(clientIdentifiers, _logger)
  }

  _init = async (
    clientIdentifiers: AbstractPlugin['identifier'][],
    _logger: AbstractLogger,
  ) => {
    this._setClients(clientIdentifiers, _logger)

    _logger.send({
      type: 'SUCCESS',
      origin: {
        type: 'SERVER',
      },
      data: {
        message: 'Started Shadō Sandbox',
      },
    })
  }

  _setClients = (
    clientIdentifiers: AbstractPlugin['identifier'][],
    _logger: AbstractLogger,
  ) => {
    clientIdentifiers.forEach((clientIdentifier: string) => {
      switch (clientIdentifier) {
        case 'shado-screen':
          break
        case 'logger':
          this.clients.push(_logger)
          break
        case 'telegram':
          this.clients.push(
            new ShadoSandboxTelegramClient(this.config, _logger),
          )
          break
      }
    })
  }

  send = (sandboxMessage: ShadoSandboxMessage) => {
    this.clients.forEach((client) => {
      client.send(sandboxMessage)
    })
  }
}

export default {
  identifier: 'shado-sandbox',
  description: 'First party sandbox environment utility.',
  key: 'sandbox',
  plugin: ShadoSandboxPlugin,
} satisfies AbstractPlugin
