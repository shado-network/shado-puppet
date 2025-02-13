import { tasks } from './tasks/index.ts'
import { defaultState } from './libs/state.ts'
import { executePlansLoop } from './libs/planner.ts'

import type { PuppetConfig, PuppetRuntime } from '../../core/puppet/types'
import type { AppContext } from '../../core/context/types'
import type { AppPlugin } from '../types.ts'

class ShadoPlannerHtnPlugin {
  puppetRuntime: PuppetRuntime
  puppetConfig: PuppetConfig

  //

  _app: AppContext

  //

  constructor(
    puppetRuntime: PuppetRuntime,
    puppetConfig: PuppetConfig,
    _app: AppContext,
  ) {
    this._app = _app
    this.puppetRuntime = puppetRuntime
    this.puppetConfig = puppetConfig
  }

  init = () => {
    try {
      this.puppetRuntime.memory.goals = {
        // TODO: Make this nicer?
        ...this.puppetConfig.planner.config.goals,
      }

      this.puppetRuntime.memory.state = {
        ...defaultState,
        // TODO: Move to plugin?!
        'telegram-has-client': Boolean(this.puppetRuntime.clients['telegram']),
        // TODO: Move to plugin?!
        'twitter-has-client': Boolean(this.puppetRuntime.clients['twitter']),
      }
    } catch (error) {
      this._app.utils.logger.send({
        type: 'ERROR',
        source: 'PUPPET',
        puppetId: this.puppetRuntime.id,
        message: `Error in planner initialization`,
        payload: { error },
      })
    }
  }

  startPlanner = async () => {
    await executePlansLoop(
      this.puppetRuntime,
      this.puppetConfig,
      tasks,
      this.puppetRuntime.memory.goals,
      this.puppetRuntime.memory.state,
      this._app,
    )
  }
}

export default {
  identifier: 'shado-planner-htn',
  description: 'First party runtime planner utility.',
  key: 'planner',
  plugin: ShadoPlannerHtnPlugin,
} satisfies AppPlugin
