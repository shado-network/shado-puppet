import EventEmitter from 'events'

import type { AppContext } from '@core/context/types'
import type { AbstractPlanner } from '@core/abstract/types'

import type { PuppetInstance } from './types'

import { _memoryClient } from '@core/libs/utils.js'
import { asyncForEach } from '@core/libs/utils.async.js'

export class Puppet {
  instance: PuppetInstance

  _app: AppContext
  // TODO: Update to the proper type from the plugin?
  _planner: undefined | AbstractPlanner

  constructor(puppetId: PuppetInstance['config']['id'], _app: AppContext) {
    this._app = _app

    this.instance = {
      runtime: undefined,
      config: undefined,
    }

    this._init(puppetId)
  }

  _init = async (puppetId: PuppetInstance['config']['id']) => {
    try {
      this.instance.runtime = this._setPuppetRuntime(puppetId)
      this.instance.config = await this._getPuppetConfig(puppetId)

      // NOTE: Register plugins.
      this._planner = await this._setPlannerPlugin(
        this.instance.config.planner.provider,
      )
      this.instance.runtime.model = await this._setModelPlugin(
        this.instance.config.model.provider,
      )
      this.instance.runtime.events = this._setEventsPlugin()
      this.instance.runtime.clients = await this._setClientPlugins(
        this.instance.config.clients,
      )
    } catch (error) {
      this._app.utils.logger.send({
        type: 'ERROR',
        origin: {
          type: 'PUPPET',
          id: puppetId,
        },
        data: {
          message: `Error in puppet initialization`,
          payload: { error },
        },
      })

      return
    }

    try {
      // NOTE: Start the planner loop.
      await this._planner.init()
      this._planner.startPlanner()
    } catch (error) {
      this._app.utils.logger.send({
        type: 'ERROR',
        origin: {
          type: 'PUPPET',
          id: this.instance.config.id,
        },
        data: {
          message: `Error in puppet runner loop`,
          payload: { error },
        },
      })
    }
  }

  _setPuppetRuntime = (puppetId: PuppetInstance['config']['id']) => {
    // NOTE: Puppet runtime scaffold.
    return {
      id: puppetId,
      //
      planner: undefined,
      model: undefined,
      events: undefined,
      clients: undefined,
      //
      memory: {
        goals: [],
        state: {},
      },
      knowledge: undefined,
    } satisfies PuppetInstance['runtime']
  }

  _getPuppetConfig = async (puppetId: PuppetInstance['config']['id']) => {
    try {
      const puppetFile = await import(`../../../include/${puppetId}.js`)
      const config = puppetFile.default
      // const puppetFile = await import(`@includes/${puppetId}.js`)
      // const config = puppetFile.default

      this._app.utils.logger.send({
        type: 'SUCCESS',
        origin: {
          type: 'PUPPET',
          id: puppetId,
        },
        data: {
          message: `Loaded puppet config "${config.id}"`,
        },
      })

      return config
    } catch (error) {
      this._app.utils.logger.send({
        type: 'ERROR',
        origin: {
          type: 'PUPPET',
          id: puppetId,
        },
        data: {
          message: `No puppet config loaded!`,
          payload: { error },
        },
      })

      return undefined
    }
  }

  _setPlannerPlugin = async (plannerProvider: string) => {
    try {
      const planner = new this._app.plugins[plannerProvider].plugin(
        this.instance,
        this._app,
      )

      this._app.utils.logger.send({
        type: 'SUCCESS',
        origin: {
          type: 'PUPPET',
          id: this.instance.config.id,
        },
        data: {
          message: `Loaded planner plugin "${plannerProvider}"`,
        },
      })

      return planner
    } catch (error) {
      this._app.utils.logger.send({
        type: 'ERROR',
        origin: {
          type: 'PUPPET',
          id: this.instance.config.id,
        },
        data: {
          message: `No planner plugin loaded!`,
          payload: { error },
        },
      })

      return undefined
    }
  }

  _setModelPlugin = async (modelProvider: string) => {
    try {
      const model = new this._app.plugins[modelProvider].plugin(
        _memoryClient,
        this._app,
      )

      this._app.utils.logger.send({
        type: 'SUCCESS',
        origin: {
          type: 'PUPPET',
          id: this.instance.config.id,
        },
        data: {
          message: `Loaded model plugin "${modelProvider}"`,
        },
      })

      return model
    } catch (error) {
      this._app.utils.logger.send({
        type: 'ERROR',
        origin: {
          type: 'PUPPET',
          id: this.instance.config.id,
        },
        data: {
          message: `No model plugin loaded!`,
          payload: { error },
        },
      })

      return undefined
    }
  }

  _setEventsPlugin = () => {
    try {
      const events = new EventEmitter()

      this._app.utils.logger.send({
        type: 'SUCCESS',
        origin: {
          type: 'PUPPET',
          id: this.instance.config.id,
        },
        data: {
          message: `Loaded events plugin`,
        },
      })

      return events
    } catch (error) {
      this._app.utils.logger.send({
        type: 'ERROR',
        origin: {
          type: 'PUPPET',
          id: this.instance.config.id,
        },
        data: {
          message: `Could not load events plugin!`,
          payload: { error },
        },
      })

      return undefined
    }
  }

  _setClientPlugins = async (clientPlugins: any) => {
    const clients = {}

    await asyncForEach(clientPlugins, async (clientPlugin: any) => {
      try {
        const plugin = new this._app.plugins[clientPlugin.identifier].plugin(
          clientPlugin.config,
          clientPlugin.secrets || {},
          this.instance,
          this._app,
        )

        clients[this._app.plugins[clientPlugin.identifier].key] = plugin

        this._app.utils.logger.send({
          type: 'SUCCESS',
          origin: {
            type: 'PUPPET',
            id: this.instance.config.id,
          },
          data: {
            message: `Loaded client plugin "${clientPlugin.identifier}"`,
          },
        })
      } catch (error) {
        this._app.utils.logger.send({
          type: 'ERROR',
          origin: {
            type: 'PUPPET',
            id: this.instance.config.id,
          },
          data: {
            message: `Could not load client plugin "${clientPlugin.identifier}"!`,
            payload: { error },
          },
        })
      }
    })

    return clients
  }
}
