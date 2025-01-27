import { _app } from '../../core/context/index.ts'
import type { AppContext } from '../../core/context/types'

import { CorePlannerPlugin } from '../../plugin/core-planner-htn/index.ts'
import type { Puppet as PuppetType } from './types'

import { _memoryClient } from '../libs/utils.ts'

import { AnthropicClientPlugin } from '../../plugin/client-anthropic/index.ts'
import { DeepSeekClientPlugin } from '../../plugin/client-deepseek/index.ts'
import { OpenAiClientPlugin } from '../../plugin/client-openai/index.ts'

import { TelegramClientPlugin } from '../../plugin/client-telegram/index.ts'
import { TwitterApiClientPlugin } from '../../plugin/client-twitter-api/index.ts'
import { TwitterClientPlugin } from '../../plugin/client-twitter/index.ts'

export class Puppet {
  planner: CorePlannerPlugin

  //

  puppet: any | PuppetType

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
      await this._setInterfacePlugins()
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
      // NOTE: Anthropic
      case 'client-anthropic':
        this.puppet.model = new AnthropicClientPlugin(_memoryClient, _app)

        _app.utils.logger.send({
          type: 'SUCCESS',
          source: 'PUPPET',
          puppetId: this.puppet.id,
          message: `Loaded model plugin "${this.puppet.config.model.provider}"`,
        })
        break

      // NOTE: DeepSeek
      case 'client-deepseek':
        this.puppet.model = new DeepSeekClientPlugin(_memoryClient, _app)

        _app.utils.logger.send({
          type: 'SUCCESS',
          source: 'PUPPET',
          puppetId: this.puppet.id,
          message: `Loaded model plugin "${this.puppet.config.model.provider}"`,
        })
        break

      // NOTE: OpenAI
      case 'client-openai':
        this.puppet.model = new OpenAiClientPlugin(_memoryClient, _app)

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

  _setInterfacePlugins = async () => {
    this.puppet.interfaces = {}

    // NOTE: Telegram
    if (
      Object.keys(this.puppet.config.interfaces).includes('client-telegram')
    ) {
      this.puppet.interfaces.telegramClient = new TelegramClientPlugin(
        this.puppet.config,
        _app,
      )
    }

    // NOTE: Twitter
    if (
      Object.keys(this.puppet.config.interfaces).includes('client-twitter-api')
    ) {
      this.puppet.interfaces.twitterClient = new TwitterApiClientPlugin(
        this.puppet.config,
        _app,
      )
    }

    if (Object.keys(this.puppet.config.interfaces).includes('client-twitter')) {
      this.puppet.interfaces.twitterClient = new TwitterClientPlugin(
        this.puppet.config,
        _app,
      )
    }
  }

  _setPlannerPlugin = async () => {
    switch (this.puppet.config.planner.provider) {
      case 'core-planner-htn':
        this.planner = new CorePlannerPlugin(this.puppet, _app)

        _app.utils.logger.send({
          type: 'SUCCESS',
          source: 'PUPPET',
          puppetId: this.puppet.id,
          message: `Loaded puppet planner plugin "${this.puppet.config.planner.provider}"`,
        })
        break
      case 'core-planner-sm':
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
      case 'core-planner-bt':
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
