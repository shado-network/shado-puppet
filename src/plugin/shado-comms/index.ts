import Fastify from 'fastify'
import cors from '@fastify/cors'
import type { FastifyInstance } from 'fastify'

import type { AppContext } from '../../core/context/types'
import type { PuppetConfig } from '../../core/puppet/types'
import type { ShadoCommsResponse } from './types'

export class ShadoCommsPlugin {
  config = {}

  //

  server: FastifyInstance
  serverConfig: any = {}

  //

  puppetConfig: PuppetConfig
  _app: AppContext

  //

  constructor(puppetConfig: PuppetConfig, _app: AppContext) {
    this._app = _app

    this.puppetConfig = puppetConfig

    this.serverConfig = {
      ...this.serverConfig,
      ...this.puppetConfig.clients.find((client: any) => {
        return client.identifier === 'shado-comms'
      }),
    }

    try {
      this.server = Fastify({
        // logger: true,
      })
      this.server.register(cors, {
        allowedHeaders: '*',
      })

      this._app.utils.logger.send({
        type: 'SUCCESS',
        source: 'PUPPET',
        puppetId: this.puppetConfig.id,
        message: 'Created Shadō Comms server',
      })
    } catch (error) {
      this._app.utils.logger.send({
        type: 'ERROR',
        source: 'PUPPET',
        puppetId: this.puppetConfig.id,
        message: 'Could not create Shadō Comms server',
      })
    }

    this._init()
  }

  _init = async () => {
    this._addRoutes()

    try {
      await this.server.listen({ port: this.serverConfig.config.port })

      this._app.utils.logger.send({
        type: 'SUCCESS',
        source: 'PUPPET',
        puppetId: this.puppetConfig.id,
        message: 'Started Shadō Comms server',
      })
    } catch (error) {
      this._app.utils.logger.send({
        type: 'ERROR',
        source: 'PUPPET',
        puppetId: this.puppetConfig.id,
        message: 'Could not start Shadō Comms server',
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
            message: `Puppet data for [ ${this.puppetConfig.id} / ${this.puppetConfig.name} ]`,
            puppet: {
              id: this.puppetConfig.id,
              name: this.puppetConfig.name,
              image: null,
              port: this.serverConfig.config.port,
            },
          },
        } satisfies ShadoCommsResponse
      } catch (error) {
        return this._defaultRouteError(error)
      }
    })
  }
}
