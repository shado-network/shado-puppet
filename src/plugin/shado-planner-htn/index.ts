import { tasks } from './tasks/index.ts'
import { defaultState } from './libs/state.ts'
import { plannerLoop } from './libs/planner.loop.ts'

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
        ...this.puppetRuntime.memory.goals,
        // TODO: Make this nicer?
        ...this.puppetConfig.planner.config.goals,
      }

      // console.log('!!!', {
      //   'telegram-has-client': Boolean(this.puppetRuntime.clients['telegram']),
      //   'twitter-has-client': Boolean(this.puppetRuntime.clients['twitter']),
      // })

      this.puppetRuntime.memory.state = {
        ...defaultState,
        ...this.puppetRuntime.memory.state,
        // TODO: Move to plugin?!
        'telegram-has-client': Boolean(this.puppetRuntime.clients['telegram']),
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

  startPlanner = () => {
    const date = new Date()
    this.puppetRuntime.memory.state['last-started'] = date.valueOf()

    plannerLoop(
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
