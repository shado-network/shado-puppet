import Fastify from 'fastify'
import cors from '@fastify/cors'
import type { FastifyInstance } from 'fastify'

import type { AppContext } from '../../core/context/types.ts'
import type { PuppetInstance } from '../../core/puppet/types.ts'
import type { AbstractAppPlugin } from '../../core/abstract/types.ts'
import type { ShadoCommsResponse } from './types.ts'

class ShadoCommsPlugin {
  config = {}

  //

  server: FastifyInstance
  serverConfig: any = {}
  serverSecrets: any = {}

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

    this.serverConfig = {
      ...this.serverConfig,
      ...clientConfig,
    }

    this.serverSecrets = {
      ...this.serverSecrets,
      ...clientSecrets,
    }

    try {
      this.server = Fastify({
        // logger: true,
      })
      this.server.register(cors, {
        allowedHeaders: '*',
      })
    } catch (error) {
      this._app.utils.logger.send({
        type: 'ERROR',
        origin: {
          type: 'PUPPET',
          id: this._puppet.config.id,
        },
        data: {
          message: 'Could not create Shadō Comms server',
        },
      })
    }

    this._init()
  }

  _init = async () => {
    this._addRoutes()

    try {
      await this.server.listen({ port: this.serverConfig.port })

      this._app.utils.logger.send({
        type: 'SUCCESS',
        origin: {
          type: 'PUPPET',
          id: this._puppet.config.id,
        },
        data: {
          message: `Started Shadō Comms server at port ${this.serverConfig.port}`,
        },
      })
    } catch (error) {
      this._app.utils.logger.send({
        type: 'ERROR',
        origin: {
          type: 'PUPPET',
          id: this._puppet.config.id,
        },
        data: {
          message: 'Could not start Shadō Comms server',
        },
      })

      // this.server.log.error(error)
      // process.exit(1)
    }
  }

  //

  _defaultRouteError = (error: any) => {
    return {
      status: 'error',
      timestamp: Date.now(),
      data: {
        message: 'Something went wrong',
        error: error,
      },
    } satisfies ShadoCommsResponse
  }

  _addRoutes = () => {
    // NOTE: Root
    this.server.get('/', async (request, reply) => {
      return {}
    })

    // NOTE: Health check
    this.server.get('/ping', async (request, reply) => {
      try {
        return {
          status: 'success',
          timestamp: Date.now(),
          data: {
            message: 'PONG',
          },
        } satisfies ShadoCommsResponse
      } catch (error) {
        return this._defaultRouteError(error)
      }
    })

    // NOTE: Puppet data
    this.server.get('/puppet', async (request, reply) => {
      try {
        return {
          status: 'success',
          timestamp: Date.now(),
          data: {
            message: `Puppet data for [ ${this._puppet.config.id} / ${this._puppet.config.name} ]`,
            puppet: {
              id: this._puppet.config.id,
              name: this._puppet.config.name,
              image: undefined,
              port: this.serverConfig.port,
            },
          },
        } satisfies ShadoCommsResponse
      } catch (error) {
        return this._defaultRouteError(error)
      }
    })
  }
}

export default {
  identifier: 'shado-comms',
  description: 'First party intra-communication utility.',
  key: 'comms',
  plugin: ShadoCommsPlugin,
} satisfies AbstractAppPlugin
