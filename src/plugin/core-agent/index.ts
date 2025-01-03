import type { MessageParam } from '@anthropic-ai/sdk/resources/messages.mjs'

import { AnthropicClientPlugin } from '../client-anthropic/index.ts'
import { TelegramClientPlugin } from '../client-telegram/index.ts'
import { TwitterClientPlugin } from '../client-twitter/index.ts'
import type { CoreLogger } from '../core-logger/index.ts'
import type { PuppetDefinition } from '../../core/types/puppet.ts'

import { runtimes } from './libs/runtimes.ts'

export class CoreAgentPlugin {
  agentDefinition: PuppetDefinition
  model: AnthropicClientPlugin
  telegramClient: TelegramClientPlugin
  twitterClient: TwitterClientPlugin

  messages: MessageParam[] = []

  _logger: CoreLogger

  constructor(puppetDefinition: PuppetDefinition, _logger: CoreLogger) {
    this._logger = _logger
    this.agentDefinition = puppetDefinition

    this._init()
  }

  _init = async () => {
    try {
      this._setModelPlugin()
      this._initInterfaces()

      await this._debug()
    } catch (error) {
      this._logger.send({
        type: 'ERROR',
        source: 'PUPPET',
        puppetId: this.agentDefinition.id,
        message: `Error in agent initialization`,
        payload: { error },
      })
    }
  }

  _setModelPlugin = async () => {
    switch (this.agentDefinition.modelProvider) {
      case 'openai':
        this._logger.send({
          type: 'ERROR',
          source: 'PUPPET',
          message: 'Puppet model plugin for OpenAI not yet implemented.',
        })
        break
      case 'anthropic':
        this.model = new AnthropicClientPlugin(this._logger)
        this._logger.send({
          type: 'SUCCESS',
          source: 'PUPPET',
          puppetId: this.agentDefinition.id,
          message: `Loaded puppet model plugin "${this.agentDefinition.modelProvider}"`,
        })
        break
      default:
        break
    }
  }

  _initInterfaces = async () => {
    // MARK: Telegram
    if (this.agentDefinition.interfaces.includes('telegram')) {
      this.telegramClient = new TelegramClientPlugin(
        this.agentDefinition,
        this._logger,
      )
    }

    // MARK: Twitter
    if (this.agentDefinition.interfaces.includes('twitter')) {
      this.twitterClient = new TwitterClientPlugin(this._logger)
    }
  }

  _debug = async () => {
    // MARK: Telegram
    runtimes.telegram(
      this.agentDefinition,
      this.model,
      this.telegramClient,
      this._logger,
    )

    // MARK: Twitter
    runtimes.twitter(
      this.agentDefinition,
      this.model,
      this.messages,
      this.twitterClient,
      this._logger,
    )
  }
}
