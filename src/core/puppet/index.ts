import { _app } from '../../core/context/index.ts'
import type { AppContext } from '../../core/context/types'
import type { PuppetInstance } from './types'

import { _memoryClient, asyncForEach } from '../libs/utils.ts'

import { TelegramClientPlugin } from '../../plugin/client-telegram/index.ts'
import { TwitterApiClientPlugin } from '../../plugin/client-twitter-api/index.ts'
import { TwitterClientPlugin } from '../../plugin/client-twitter/index.ts'

export class Puppet {
  puppet: PuppetInstance

  // TODO: Update to the proper type from the plugin.
  planner: any

  //

  _app: AppContext

  //

  constructor(puppetId: string, _app: AppContext) {
    this._app = _app

    // NOTE: Puppet instance scaffold.
    // TODO: Improve upon this?
    this.puppet = {
      id: puppetId,
      name: undefined,
      //
      config: undefined,
      //
      model: undefined,
      memory: {
        short: {},
        long: {
          goals: {},
          state: {},
        },
      },
      knowledge: undefined,
      //
      clients: undefined,
    }

    this._init()
  }

  _init = async () => {
    try {
      await this._getPuppetConfig()

      // NOTE: Register plugins.
      await this._setPlannerPlugin()
      await this._setModelPlugin()
      await this._setClientPlugins()

      // NOTE: Run the planner loop.
      this.planner._init()
    } catch (error) {
      _app.utils.logger.send({
        type: 'ERROR',
        source: 'PUPPET',
        puppetId: this.puppet.id,
        message: `Error in puppet initialization`,
        payload: { error },
      })
    }
  }

  _getPuppetConfig = async () => {
    const puppetFile = await import(`../../../include/${this.puppet.id}.ts`)
    const config = puppetFile.default

    _app.utils.logger.send({
      type: 'SUCCESS',
      source: 'PUPPET',
      puppetId: this.puppet.id,
      message: `Loaded puppet config "${config.id}"`,
    })

    this.puppet.name = config.name
    this.puppet.config = config
  }

  _setPlannerPlugin = async () => {
    try {
      this.planner = new _app.plugins[this.puppet.config.planner.provider](
        this.puppet,
        _app,
      )

      _app.utils.logger.send({
        type: 'SUCCESS',
        source: 'PUPPET',
        puppetId: this.puppet.id,
        message: `Loaded planner plugin "${this.puppet.config.planner.provider}"`,
      })
    } catch (error) {
      _app.utils.logger.send({
        type: 'ERROR',
        source: 'PUPPET',
        puppetId: this.puppet.id,
        message: `No planner plugin loaded!"`,
        payload: error,
      })
    }
  }

  _setModelPlugin = async () => {
    try {
      this.puppet.model = new _app.plugins[this.puppet.config.model.provider](
        _memoryClient,
        _app,
      )

      _app.utils.logger.send({
        type: 'SUCCESS',
        source: 'PUPPET',
        puppetId: this.puppet.id,
        message: `Loaded model plugin "${this.puppet.config.model.provider}"`,
      })
    } catch (error) {
      _app.utils.logger.send({
        type: 'ERROR',
        source: 'PUPPET',
        puppetId: this.puppet.id,
        message: `No model plugin loaded!"`,
        payload: error,
      })
    }
  }

  _setClientPlugins = async () => {
    this.puppet.clients = {}

    await asyncForEach(this.puppet.config.clients, async (client: any) => {
      // Shadō
      if (client.identifier === 'shado-comms') {
        this.puppet.clients.shadoComms = new _app.plugins['shado-comms'](
          this.puppet.config,
          _app,
        )
      }

      // Telegram
      if (client.identifier === 'client-telegram') {
        this.puppet.clients.telegram = new TelegramClientPlugin(
          this.puppet.config,
          _app,
        )
      }

      // Twitter
      if (client.identifier === 'client-twitter-api') {
        this.puppet.clients.twitter = new TwitterApiClientPlugin(
          this.puppet.config,
          _app,
        )
      }

      if (client.identifier === 'client-twitter') {
        this.puppet.clients.twitter = new TwitterClientPlugin(
          this.puppet.config,
          _app,
        )
      }
    })
  }
}
