import type { MessageParam } from '@anthropic-ai/sdk/resources/messages.mjs'

import type { CoreLogger } from '../core-logger/index.ts'
import type { Puppet } from '../../core/types/puppet.ts'

import { planners } from './libs/planners.ts'

export class CorePlannerPlugin {
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
    planners.telegram(this.puppet, this._logger)

    // MARK: Twitter
    planners.twitter(this.puppet, this.messages, this._logger)
  }
}
