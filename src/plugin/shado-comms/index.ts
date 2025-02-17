import { v4 as uuidv4 } from 'uuid'

import Fastify from 'fastify'
import cors from '@fastify/cors'
import type { FastifyInstance } from 'fastify'

import WebSocket, { WebSocketServer } from 'ws'

import { broadcast } from './libs/utils.websocket.ts'
import type { AppContext } from '../../core/context/types.ts'
import type { PuppetInstance } from '../../core/puppet/types.ts'
import type { AbstractPlugin } from '../../core/abstract/types.ts'
import type { ShadoCommsHttpResponse, ShadoCommsWsResponse } from './types.ts'

class ShadoCommsPlugin {
  config = {}

  //

  httpServer: FastifyInstance
  httpServerConfig: any = {}
  httpServerSecrets: any = {}

  wsServer: WebSocketServer
  wsServerConfig: any = {}
  wsServerSecrets: any = {}
  wsConnections: { [key: string]: WebSocket } = {}

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

    this.httpServerConfig = {
      ...this.httpServerConfig,
      ...clientConfig.http,
    }

    this.httpServerSecrets = {
      ...this.httpServerSecrets,
      ...clientSecrets.http,
    }

    this.wsServerConfig = {
      ...this.wsServerConfig,
      ...clientConfig.ws,
    }

    this.wsServerSecrets = {
      ...this.wsServerSecrets,
      ...clientSecrets.ws,
    }

    // NOTE: HTTP Server
    try {
      this.httpServer = Fastify({
        // logger: true,
      })

      this.httpServer.register(cors, {
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
          message: 'Could not create Shadō Comms http server',
        },
      })
    }

    // NOTE: WebSocket Server
    try {
      this.wsServer = new WebSocketServer({
        port: this.wsServerConfig.port,
      })

      this._app.utils.logger.send({
        type: 'SUCCESS',
        origin: {
          type: 'PUPPET',
          id: this._puppet.config.id,
        },
        data: {
          message: `Started Shadō Comms websocket server at port ${this.wsServerConfig.port}`,
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
          message: 'Could not create Shadō Comms websocket server',
        },
      })
    }

    this._init()
  }

  _init = async () => {
    this._addHttpRoutes()
    this._addWebSocketEvents()

    // NOTE: HTTP Server
    try {
      await this.httpServer.listen({
        port: this.httpServerConfig.port,
      })

      this._app.utils.logger.send({
        type: 'SUCCESS',
        origin: {
          type: 'PUPPET',
          id: this._puppet.config.id,
        },
        data: {
          message: `Started Shadō Comms http server at port ${this.httpServerConfig.port}`,
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
          message: 'Could not start Shadō Comms http server',
        },
      })

      // this.httpServer.log.error(error)
      // process.exit(1)
    }

    // NOTE: WebSocket Server
    try {
      this.wsServer.on('connection', (connection) => {
        const connectionId = uuidv4()
        this.wsConnections[connectionId] = connection
      })
    } catch (error) {
      // console.log(error)
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
    } satisfies ShadoCommsHttpResponse
  }

  _addHttpRoutes = () => {
    // NOTE: Root
    this.httpServer.get('/', async (request, reply) => {
      return {}
    })

    // NOTE: Health check
    this.httpServer.get('/ping', async (request, reply) => {
      try {
        return {
          status: 'success',
          timestamp: Date.now(),
          data: {
            message: 'PONG',
          },
        } satisfies ShadoCommsHttpResponse
      } catch (error) {
        return this._defaultRouteError(error)
      }
    })

    // NOTE: Puppet data
    this.httpServer.get('/puppet', async (request, reply) => {
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
              port: this.httpServerConfig.httPort,
            },
          },
        } satisfies ShadoCommsHttpResponse
      } catch (error) {
        return this._defaultRouteError(error)
      }
    })
  }

  _addWebSocketEvents = () => {
    // NOTE: From puppet planner plugin.
    this._puppet.runtime.events.on(
      'planner',
      (payload: ShadoCommsWsResponse) => {
        // console.log('!!!', payload)
        broadcast(this.wsConnections, JSON.stringify(payload), false)
      },
    )
  }
}

export default {
  identifier: 'shado-comms',
  description: 'First party intra-communication utility.',
  key: 'comms',
  plugin: ShadoCommsPlugin,
} satisfies AbstractPlugin
