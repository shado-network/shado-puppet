import { ShadoLoggerNodeConsoleClient } from './libs/node-console.js'
import type { ShadoLoggerConfig, ShadoLoggerMessage } from './types'
import type { AbstractPlugin } from '@core/abstract/types'

class ShadoLoggerPlugin {
  config: ShadoLoggerConfig = {
    showIcon: false,
    showUser: false,
  }

  clients = []

  constructor(clientIdentifiers: AbstractPlugin['identifier'][]) {
    this._init(clientIdentifiers)
  }

  _init = async (clientIdentifiers: AbstractPlugin['identifier'][]) => {
    this._setClients(clientIdentifiers)

    this.send({
      type: 'SUCCESS',
      origin: {
        type: 'SERVER',
      },
      data: {
        message: 'Started Shadō Logger',
      },
    })
  }

  _setClients = (clientIdentifiers: AbstractPlugin['identifier'][]) => {
    clientIdentifiers.forEach((clientIdentifier: string) => {
      switch (clientIdentifier) {
        case 'shado-screen':
          break
        case 'node-console':
          this.clients.push(new ShadoLoggerNodeConsoleClient(this.config))
          break
      }
    })
  }

  send = (loggerMessage: ShadoLoggerMessage) => {
    this.clients.forEach((client) => {
      client.send(loggerMessage)
    })
  }
}

export default {
  identifier: 'shado-logger',
  description: 'First party logging utility.',
  key: 'logger',
  plugin: ShadoLoggerPlugin,
} satisfies AbstractPlugin
