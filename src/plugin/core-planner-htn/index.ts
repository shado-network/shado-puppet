import { tasks } from './tasks/index.ts'
import { defaultState } from './libs/state.ts'
import { defaultGoals } from './libs/goals.ts'
import { executePlans } from './libs/planner.ts'

import type { Puppet } from '../../core/types/puppet.ts'
import type { CoreLogger } from '../core-logger/index.ts'

export class CorePlannerPlugin {
  puppet: Puppet
  _logger: CoreLogger

  constructor(puppet: Puppet, _logger: CoreLogger) {
    this.puppet = puppet
    this._logger = _logger

    this._init()
  }

  _init = async () => {
    try {
      await this._runPlanner()
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

  _runPlanner = async () => {
    this.puppet.memory.long.goals = { ...defaultGoals }
    this.puppet.memory.long.state = {
      ...defaultState,
      'telegram-has-client': Boolean(this.puppet.interfaces.telegramClient),
      'twitter-has-client': Boolean(this.puppet.interfaces.twitterClient),
    }

    await executePlans(
      this.puppet,
      tasks,
      this.puppet.memory.long.goals,
      this.puppet.memory.long.state,
    )
  }

  _debug = async () => {}
}
