import { CoreRuntimePlugin } from '../../plugin/core-runtime-htn/index.ts'
import type { Puppet as PuppetType } from '../types/puppet.ts'
import type { CoreLogger } from '../../plugin/core-logger/index.ts'

import { AnthropicClientPlugin } from '../../plugin/client-anthropic/index.ts'
import { OpenAiClientPlugin } from '../../plugin/client-openai/index.ts'
import { TelegramClientPlugin } from '../../plugin/client-telegram/index.ts'
import { TwitterClientPlugin } from '../../plugin/client-twitter/index.ts'

export class Puppet {
  runtime: CoreRuntimePlugin

  puppet: any | PuppetType

  _logger: CoreLogger

  constructor(puppetId: string, _logger: CoreLogger) {
    this._logger = _logger

    this.puppet = { id: puppetId }

    this._init()
  }

  _init = async () => {
    try {
      await this._setPuppetDefinition()

      await this._setModelPlugin()
      await this._setInterfacePlugins()
      await this._setRuntimePlugin()

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

  _setPuppetDefinition = async () => {
    const puppetFile = await import(`../../../include/${this.puppet.id}.ts`)
    const definition = puppetFile.default

    this._logger.send({
      type: 'SUCCESS',
      source: 'PUPPET',
      puppetId: this.puppet.id,
      message: `Loaded "${definition.name}"'s puppet definition`,
    })

    this.puppet.definition = definition
  }

  _setModelPlugin = async () => {
    switch (this.puppet.definition.model.provider) {
      // MARK: Anthropic
      case 'client-anthropic':
        this.puppet.model = new AnthropicClientPlugin(this._logger)

        this._logger.send({
          type: 'SUCCESS',
          source: 'PUPPET',
          puppetId: this.puppet.definition.id,
          message: `Loaded model plugin "${this.puppet.definition.model.provider}"`,
        })
        break
      // MARK: OpenAI
      case 'client-openai':
        this.puppet.model = new OpenAiClientPlugin(this._logger)

        this._logger.send({
          type: 'SUCCESS',
          source: 'PUPPET',
          puppetId: this.puppet.definition.id,
          message: `Loaded model plugin "${this.puppet.definition.model.provider}"`,
        })
        break
      default:
        this._logger.send({
          type: 'ERROR',
          source: 'PUPPET',
          puppetId: this.puppet.definition.id,
          message: `No model plugin loaded!"`,
        })
        break
    }
  }

  _setInterfacePlugins = async () => {
    this.puppet.interfaces = {}

    // MARK: Telegram
    if (
      Object.keys(this.puppet.definition.interfaces).includes('client-telegram')
    ) {
      this.puppet.interfaces.telegramClient = new TelegramClientPlugin(
        this.puppet.definition,
        this._logger,
      )
    }

    // MARK: Twitter
    if (
      Object.keys(this.puppet.definition.interfaces).includes('client-twitter')
    ) {
      this.puppet.interfaces.twitterClient = new TwitterClientPlugin(
        this.puppet.definition,
        this._logger,
      )
    }
  }

  _setRuntimePlugin = async () => {
    switch (this.puppet.definition.runtime.provider) {
      case 'core-runtime-htn':
        this.runtime = new CoreRuntimePlugin(this.puppet, this._logger)

        this._logger.send({
          type: 'SUCCESS',
          source: 'PUPPET',
          puppetId: this.puppet.id,
          message: `Loaded puppet runtime plugin "${this.puppet.definition.runtime.provider}"`,
        })
        break
      case 'core-runtime-sm':
        this._logger.send({
          type: 'ERROR',
          source: 'PUPPET',
          message:
            'Puppet runtime plugin for State Machines not yet implemented',
          payload: {
            puppetId: this.puppet.id,
          },
        })
        break
      case 'core-runtime-bt':
        this._logger.send({
          type: 'ERROR',
          source: 'PUPPET',
          message:
            'Puppet runtime plugin for Behaviour Trees not yet implemented',
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
