import { tasks } from './tasks/index.ts'
import { defaultState } from './libs/state.ts'
import { defaultGoals } from './libs/goals.ts'
import { executePlans } from './libs/planner.ts'

import type { Puppet } from '../../core/types/puppet.ts'
import type { CoreLogger } from '../core-logger/index.ts'

// TODO: Move down! Into memory?
const currentGoals = {}
const currentState = {}

export class CorePlannerPlugin {
  puppet: Puppet
  _logger: CoreLogger

  messages = []

  constructor(puppet: Puppet, _logger: CoreLogger) {
    this.puppet = puppet
    this._logger = _logger

    this._init()
  }

  _init = async () => {
    try {
      await this._runPlanner()

      // await this._debug()
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
    currentState[this.puppet.id] = { ...defaultState }
    currentGoals[this.puppet.id] = [...defaultGoals]

    await executePlans(
      this.puppet,
      tasks,
      currentGoals[this.puppet.id],
      currentState[this.puppet.id],
    )
  }

  _debug = async () => {}
}
