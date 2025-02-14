import path from 'path'
import { dirname } from 'path'
import { fileURLToPath } from 'url'

import { tasksPool } from './tasks/index.ts'
import { defaultStates } from './states/index.ts'
import { plannerLoop } from './libs/planner.loop.ts'
import { importTasks } from './libs/utils.tasks.ts'

import type { PuppetConfig, PuppetRuntime } from '../../core/puppet/types.ts'
import type { AppContext } from '../../core/context/types.ts'
import type { AppPlugin } from '../types.ts'
import type { HtnTask } from './tasks/types.ts'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

class ShadoPlannerHtnPlugin {
  puppetRuntime: PuppetRuntime
  puppetConfig: PuppetConfig

  //

  _app: AppContext
  _tasks: {
    [key: string]: {
      [key: string]: HtnTask
    }
  }

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
        'last-started': 0,
        'last-updated': 0,
        //
        ...this.puppetRuntime.memory.state,
        //
        // NOTE: Telegram default state
        'telegram-has-client': Boolean(this.puppetRuntime.clients['telegram']),
        // 'telegram-has-credentials': undefined,
        ...(this.puppetRuntime.clients['telegram']
          ? defaultStates['telegram']
          : {}),
        // NOTE: Twitter default state
        'twitter-has-client': Boolean(this.puppetRuntime.clients['twitter']),
        // 'twitter-has-credentials': undefined,
        ...(this.puppetRuntime.clients['twitter']
          ? defaultStates['twitter']
          : {}),
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
      // TODO: Make it so it stays dynamic?
      tasksPool(this.puppetConfig, this._app.plugins, this._tasks),
      this._app,
    )
  }

  _registerTasks = async (tasksPath: string) => {
    const tasks: {
      [key: string]: {
        [key: string]: HtnTask
      }
    } = {}

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
