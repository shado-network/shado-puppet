import { _app } from '../../core/context/index.ts'
import type { AppContext } from '../../core/context/types'
import type { PuppetConfig, PuppetRuntime } from './types'

import { _memoryClient } from '../libs/utils.ts'
import { asyncForEach } from '../libs/utils.async.ts'

export class Puppet {
  runtime: null | PuppetRuntime
  config: null | PuppetConfig

  // TODO: Update to the proper type from the plugin.
  planner: null | any

  //

  _app: AppContext

  //

  constructor(puppetId: string, _app: AppContext) {
    this._app = _app
    this._init(puppetId)
  }

  _init = async (puppetId: string) => {
    // TODO: Improve upon this?
    // NOTE: Puppet instance scaffold.
    this.runtime = {
      id: puppetId,
      //
      planner: undefined,
      model: undefined,
      clients: undefined,
      //
      memory: {
        goals: {},
        state: {},
      },
      knowledge: undefined,
    }

    try {
      this.config = await this._getPuppetConfig(puppetId)

      // NOTE: Register plugins.
      this.planner = await this._setPlannerPlugin(this.config.planner.provider)
      this.runtime.model = await this._setModelPlugin(
        this.config.model.provider,
      )
      this.runtime.clients = await this._setClientPlugins(this.config.clients)
    } catch (error) {
      _app.utils.logger.send({
        type: 'ERROR',
        source: 'PUPPET',
        puppetId: this.runtime.id,
        message: `Error in puppet initialization`,
        payload: { error },
      })
    }

    try {
      // NOTE: Start the planner loop.
      this.planner.init()
      this.planner.startPlanner()
    } catch (error) {
      _app.utils.logger.send({
        type: 'ERROR',
        source: 'PUPPET',
        puppetId: this.runtime.id,
        message: `Error in puppet runner loop`,
        payload: { error },
      })
    }
  }

  _getPuppetConfig = async (puppetId: string) => {
    try {
      const puppetFile = await import(`../../../include/${puppetId}.ts`)
      const config = puppetFile.default

      _app.utils.logger.send({
        type: 'SUCCESS',
        source: 'PUPPET',
        puppetId: config.id,
        message: `Loaded puppet config "${config.id}"`,
      })

      return config
    } catch (error) {
      _app.utils.logger.send({
        type: 'ERROR',
        source: 'PUPPET',
        puppetId: this.runtime.id,
        message: `No puppet config loaded!"`,
        payload: { error },
      })

      return null
    }
  }

  _setPlannerPlugin = async (plannerProvider: string) => {
    try {
      const planner = new _app.plugins[plannerProvider].plugin(
        this.runtime,
        this.config,
        _app,
      )

      _app.utils.logger.send({
        type: 'SUCCESS',
        source: 'PUPPET',
        puppetId: this.runtime.id,
        message: `Loaded planner plugin "${plannerProvider}"`,
      })

      return planner
    } catch (error) {
      _app.utils.logger.send({
        type: 'ERROR',
        source: 'PUPPET',
        puppetId: this.runtime.id,
        message: `No planner plugin loaded!"`,
        payload: { error },
      })

      return null
    }
  }

  _setModelPlugin = async (modelProvider: string) => {
    try {
      const model = new _app.plugins[modelProvider].plugin(_memoryClient, _app)

      _app.utils.logger.send({
        type: 'SUCCESS',
        source: 'PUPPET',
        puppetId: this.runtime.id,
        message: `Loaded model plugin "${modelProvider}"`,
      })

      return model
    } catch (error) {
      _app.utils.logger.send({
        type: 'ERROR',
        source: 'PUPPET',
        puppetId: this.runtime.id,
        message: `No model plugin loaded!"`,
        payload: { error },
      })

      return null
    }
  }

  _setClientPlugins = async (clientPlugins: any) => {
    const clients = {}

    await asyncForEach(clientPlugins, async (clientPlugin: any) => {
      try {
        const plugin = new _app.plugins[clientPlugin.identifier].plugin(
          clientPlugin.config,
          clientPlugin.secrets || {},
          this.config,
          _app,
        )

        clients[_app.plugins[clientPlugin.identifier].key] = plugin

        _app.utils.logger.send({
          type: 'SUCCESS',
          source: 'PUPPET',
          puppetId: this.runtime.id,
          message: `Loaded client plugin "${clientPlugin.identifier}"`,
        })
      } catch (error) {
        _app.utils.logger.send({
          type: 'ERROR',
          source: 'PUPPET',
          puppetId: this.runtime.id,
          message: `Could not load client plugin "${clientPlugin.identifier}"!`,
          payload: { error },
        })
      }
    })

    return clients
  }
}
