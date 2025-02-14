import path from 'path'
import { dirname } from 'path'
import { fileURLToPath } from 'url'

import { tasksPool } from './tasks/index.ts'
import { defaultState } from './states/default.ts'
import { plannerLoop } from './libs/planner.loop.ts'
import { importTasks } from './libs/utils.tasks.ts'

import type { PuppetConfig, PuppetRuntime } from '../../core/puppet/types'
import type { AppContext } from '../../core/context/types'
import type { AppPlugin } from '../types.ts'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

class ShadoPlannerHtnPlugin {
  puppetRuntime: PuppetRuntime
  puppetConfig: PuppetConfig

  //

  _app: AppContext
  _tasks: any

  config: { tasksPath: string }

  //

  constructor(
    puppetRuntime: PuppetRuntime,
    puppetConfig: PuppetConfig,
    _app: AppContext,
  ) {
    this._app = _app
    this.puppetRuntime = puppetRuntime
    this.puppetConfig = puppetConfig

    this.config = { tasksPath: path.join(__dirname, 'tasks') }
  }

  init = async () => {
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

      this._tasks = await this._registerTasks(this.config.tasksPath)
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
      //
      this.puppetRuntime.memory.goals,
      this.puppetRuntime.memory.state,
      //
      tasksPool(this.puppetConfig, this._app.plugins, this._tasks),
      this._app,
    )
  }

  _registerTasks = async (tasksPath: string) => {
    const tasks = {}

    const imports = await importTasks(tasksPath)

    imports.forEach((importedTask) => {
      if (!importedTask) {
        return
      }

      const key = importedTask.identifier.split('-').at(0)

      if (!tasks[key]) {
        tasks[key] = {}
      }

      tasks[key][importedTask.identifier] = importedTask
    })

    return tasks
  }
}

export default {
  identifier: 'shado-planner-htn',
  description: 'First party runtime planner utility.',
  key: 'planner',
  plugin: ShadoPlannerHtnPlugin,
} satisfies AppPlugin
