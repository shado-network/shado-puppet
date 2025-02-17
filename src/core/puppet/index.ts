import EventEmitter from 'events'

import { _app } from '../../core/context/index.ts'
import type { AppContext } from '../../core/context/types.ts'
import type { PuppetInstance } from './types.ts'
import type { AbstractPlanner } from '../abstract/types.ts'

import { _memoryClient } from '../libs/utils.ts'
import { asyncForEach } from '../libs/utils.async.ts'

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
      _app.utils.logger.send({
        type: 'ERROR',
        origin: {
          type: 'PUPPET',
          id: this.instance.config.id,
        },
        data: {
          message: `Error in puppet initialization`,
          payload: { error },
        },
      })
    }

    try {
      // NOTE: Start the planner loop.
      await this._planner.init()
      this._planner.startPlanner()
    } catch (error) {
      _app.utils.logger.send({
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
        goals: {},
        state: {},
      },
      knowledge: undefined,
    } satisfies PuppetInstance['runtime']
  }

  _getPuppetConfig = async (puppetId: PuppetInstance['config']['id']) => {
    try {
      const puppetFile = await import(`../../../include/${puppetId}.ts`)
      const config = puppetFile.default

      _app.utils.logger.send({
        type: 'SUCCESS',
        origin: {
          type: 'PUPPET',
          id: config.id,
        },
        data: {
          message: `Loaded puppet config "${config.id}"`,
        },
      })

      return config
    } catch (error) {
      _app.utils.logger.send({
        type: 'ERROR',
        origin: {
          type: 'PUPPET',
          id: this.instance.config.id,
        },
        data: {
          message: `No puppet config loaded!"`,
          payload: { error },
        },
      })

      return undefined
    }
  }

  _setPlannerPlugin = async (plannerProvider: string) => {
    try {
      const planner = new _app.plugins[plannerProvider].plugin(
        this.instance,
        _app,
      )

      _app.utils.logger.send({
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
      _app.utils.logger.send({
        type: 'ERROR',
        origin: {
          type: 'PUPPET',
          id: this.instance.config.id,
        },
        data: {
          message: `No planner plugin loaded!"`,
          payload: { error },
        },
      })

      return undefined
    }
  }

  _setModelPlugin = async (modelProvider: string) => {
    try {
      const model = new _app.plugins[modelProvider].plugin(_memoryClient, _app)

      _app.utils.logger.send({
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
      _app.utils.logger.send({
        type: 'ERROR',
        origin: {
          type: 'PUPPET',
          id: this.instance.config.id,
        },
        data: {
          message: `No model plugin loaded!"`,
          payload: { error },
        },
      })

      return undefined
    }
  }

  _setEventsPlugin = () => {
    try {
      const events = new EventEmitter()

      _app.utils.logger.send({
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
      _app.utils.logger.send({
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
        const plugin = new _app.plugins[clientPlugin.identifier].plugin(
          clientPlugin.config,
          clientPlugin.secrets || {},
          this.instance,
          _app,
        )

        clients[_app.plugins[clientPlugin.identifier].key] = plugin

        _app.utils.logger.send({
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
        _app.utils.logger.send({
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
