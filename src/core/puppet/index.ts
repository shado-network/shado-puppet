import { CorePlannerPlugin } from '../../plugin/core-planner-htn/index.ts'
import type { Puppet as PuppetType } from '../types/puppet.ts'
import type { CoreLogger } from '../../plugin/core-logger/index.ts'

import { _memoryClient } from '../libs/utils.ts'
import { AnthropicClientPlugin } from '../../plugin/client-anthropic/index.ts'
import { OpenAiClientPlugin } from '../../plugin/client-openai/index.ts'

import { TelegramClientPlugin } from '../../plugin/client-telegram/index.ts'
import { TwitterClientPlugin } from '../../plugin/client-twitter/index.ts'

export class Puppet {
  planner: CorePlannerPlugin

  puppet: any | PuppetType

  _logger: CoreLogger

  constructor(puppetId: string, _logger: CoreLogger) {
    this._logger = _logger

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
      this._logger.send({
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

    this._logger.send({
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
      // MARK: Anthropic
      case 'client-anthropic':
        this.puppet.model = new AnthropicClientPlugin(
          _memoryClient,
          this._logger,
        )

        this._logger.send({
          type: 'SUCCESS',
          source: 'PUPPET',
          puppetId: this.puppet.id,
          message: `Loaded model plugin "${this.puppet.config.model.provider}"`,
        })
        break
      // MARK: OpenAI
      case 'client-openai':
        this.puppet.model = new OpenAiClientPlugin(_memoryClient, this._logger)

        this._logger.send({
          type: 'SUCCESS',
          source: 'PUPPET',
          puppetId: this.puppet.id,
          message: `Loaded model plugin "${this.puppet.config.model.provider}"`,
        })
        break
      default:
        this._logger.send({
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

    // MARK: Telegram
    if (
      Object.keys(this.puppet.config.interfaces).includes('client-telegram')
    ) {
      this.puppet.interfaces.telegramClient = new TelegramClientPlugin(
        this.puppet.config,
        this._logger,
      )
    }

    // MARK: Twitter
    if (Object.keys(this.puppet.config.interfaces).includes('client-twitter')) {
      this.puppet.interfaces.twitterClient = new TwitterClientPlugin(
        this.puppet.config,
        this._logger,
      )
    }
  }

  _setPlannerPlugin = async () => {
    switch (this.puppet.config.planner.provider) {
      case 'core-planner-htn':
        this.planner = new CorePlannerPlugin(this.puppet, this._logger)

        this._logger.send({
          type: 'SUCCESS',
          source: 'PUPPET',
          puppetId: this.puppet.id,
          message: `Loaded puppet planner plugin "${this.puppet.config.planner.provider}"`,
        })
        break
      case 'core-planner-sm':
        this._logger.send({
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
        this._logger.send({
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
        this._logger.send({
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
