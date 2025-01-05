import type { MessageParam } from '@anthropic-ai/sdk/resources/messages.mjs'

import type { CoreLogger } from '../core-logger/index.ts'
import type { Puppet } from '../../core/types/puppet.ts'

import { runtimes } from './libs/runtimes.ts'

export class CoreRuntimePlugin {
  puppet: Puppet

  messages: MessageParam[] = []

  _logger: CoreLogger

  constructor(puppet: Puppet, _logger: CoreLogger) {
    this._logger = _logger

    this.puppet = puppet

    this._init()
  }

  _init = async () => {
    try {
      await this._debug()
    } catch (error) {
      this._logger.send({
        type: 'ERROR',
        source: 'PUPPET',
        puppetId: this.puppet.id,
        message: `Error in agent initialization`,
        payload: { error },
      })
    }
  }

  _debug = async () => {
    // MARK: Telegram
    runtimes.telegram(this.puppet, this._logger)

    // MARK: Twitter
    runtimes.twitter(this.puppet, this.messages, this._logger)
  }
}
