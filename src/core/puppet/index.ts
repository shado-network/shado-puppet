import { _app } from '../../core/context/index.ts'
import type { AppContext } from '../../core/context/types'

import { ShadoPlanner } from '../../plugin/shado-planner-htn/index.ts'
import type { Puppet as PuppetType } from './types'

import { _memoryClient, asyncForEach } from '../libs/utils.ts'

import { AnthropicAdapterPlugin } from '../../plugin/adapter-anthropic/index.ts'
import { DeepSeekAdapterPlugin } from '../../plugin/adapter-deepseek/index.ts'
import { OpenAiAdapterPlugin } from '../../plugin/adapter-openai/index.ts'

import { ShadoCommsPlugin } from '../../plugin/shado-comms/index.ts'
import { TelegramClientPlugin } from '../../plugin/client-telegram/index.ts'
import { TwitterApiClientPlugin } from '../../plugin/client-twitter-api/index.ts'
import { TwitterClientPlugin } from '../../plugin/client-twitter/index.ts'

export class Puppet {
  planner: ShadoPlanner

  //

  puppet: Partial<PuppetType> | PuppetType | any

  //

  _app: AppContext

  //

  constructor(puppetId: string, _app: AppContext) {
    this._app = _app

    this.puppet = { id: puppetId }
    this.puppet.memory = {
      short: {},
      long: {
        goals: {},
        state: {},
      },
    }

    this._init()
  }

  _init = async () => {
    try {
      await this._getPuppetConfig()

      await this._setModelPlugin()
      await this._setClientPlugins()
      await this._setPlannerPlugin()

      await this._debug()
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

  _setModelPlugin = async () => {
    switch (this.puppet.config.model.provider) {
      // Anthropic
      case 'adapter-anthropic':
        this.puppet.model = new AnthropicAdapterPlugin(_memoryClient, _app)

        _app.utils.logger.send({
          type: 'SUCCESS',
          source: 'PUPPET',
          puppetId: this.puppet.id,
          message: `Loaded model plugin "${this.puppet.config.model.provider}"`,
        })
        break

      // DeepSeek
      case 'adapter-deepseek':
        this.puppet.model = new DeepSeekAdapterPlugin(_memoryClient, _app)

        _app.utils.logger.send({
          type: 'SUCCESS',
          source: 'PUPPET',
          puppetId: this.puppet.id,
          message: `Loaded model plugin "${this.puppet.config.model.provider}"`,
        })
        break

      // OpenAI
      case 'adapter-openai':
        this.puppet.model = new OpenAiAdapterPlugin(_memoryClient, _app)

        _app.utils.logger.send({
          type: 'SUCCESS',
          source: 'PUPPET',
          puppetId: this.puppet.id,
          message: `Loaded model plugin "${this.puppet.config.model.provider}"`,
        })
        break
      default:
        _app.utils.logger.send({
          type: 'ERROR',
          source: 'PUPPET',
          puppetId: this.puppet.id,
          message: `No model plugin loaded!"`,
        })
        break
    }
  }

  _setClientPlugins = async () => {
    this.puppet.clients = {}

    await asyncForEach(this.puppet.config.clients, async (client: any) => {
      // Shadō
      if (client.identifier === 'shado-comms') {
        this.puppet.clients.shadoComms = new ShadoCommsPlugin(
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

  _setPlannerPlugin = async () => {
    switch (this.puppet.config.planner.provider) {
      case 'shado-planner-htn':
        this.planner = new ShadoPlanner(this.puppet, _app)

        _app.utils.logger.send({
          type: 'SUCCESS',
          source: 'PUPPET',
          puppetId: this.puppet.id,
          message: `Loaded puppet planner plugin "${this.puppet.config.planner.provider}"`,
        })
        break
      case 'shado-planner-sm':
        _app.utils.logger.send({
          type: 'ERROR',
          source: 'PUPPET',
          message:
            'Puppet planner plugin for State Machines not yet implemented',
          payload: {
            puppetId: this.puppet.id,
          },
        })
        break
      case 'shado-planner-bt':
        _app.utils.logger.send({
          type: 'ERROR',
          source: 'PUPPET',
          message:
            'Puppet planner plugin for Behaviour Trees not yet implemented',
          payload: {
            puppetId: this.puppet.id,
          },
        })
        break
      default:
        _app.utils.logger.send({
          type: 'ERROR',
          source: 'PUPPET',
          puppetId: this.puppet.id,
          message: `No puppet model plugin loaded!"`,
        })
        break
    }
  }

  _debug = async () => {}
}
