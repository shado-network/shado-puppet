import { tasks } from './tasks/index.ts'
import { defaultState } from './libs/state.ts'
import { defaultGoals } from './libs/goals.ts'
import { executePlans } from './libs/planner.ts'

import type { AppContext } from '../../core/context/types'
import type { Puppet } from '../../core/puppet/types'

class ShadoPlannerHtnPlugin {
  puppet: Puppet

  //

  _app: AppContext

  //

  constructor(puppet: Puppet, _app: AppContext) {
    this._app = _app

    this.puppet = puppet
  }

  _init = async () => {
    try {
      await this._runPlanner()
    } catch (error) {
      this._app.utils.logger.send({
        type: 'ERROR',
        source: 'PUPPET',
        puppetId: this.puppet.id,
        message: `Error in planner initialization`,
        payload: { error },
      })
    }
  }

  _runPlanner = async () => {
    this.puppet.memory.long.goals = { ...defaultGoals }
    this.puppet.memory.long.state = {
      ...defaultState,
      'telegram-has-client': Boolean(this.puppet.clients.telegram),
      'twitter-has-client': Boolean(this.puppet.clients.twitter),
    }

    await executePlans(
      this.puppet,
      tasks,
      this.puppet.memory.long.goals,
      this.puppet.memory.long.state,
      this._app,
    )
  }
}

export default {
  identifier: 'shado-planner-htn',
  description: 'First party runtime planner utility.',
  plugin: ShadoPlannerHtnPlugin,
}
