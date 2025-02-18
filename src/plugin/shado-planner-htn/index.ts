import path from 'path'
import { dirname } from 'path'
import { fileURLToPath } from 'url'

import { tasksPool } from './tasks/index.ts'
import { defaultStates } from './states/index.ts'
import { plannerLoop } from './libs/planner.loop.ts'
import { importTasks } from './libs/utils.tasks.ts'

import type { AppContext } from '../../core/context/types.ts'
import type { PuppetInstance } from '../../core/puppet/types.ts'
import type { AbstractPlugin } from '../../core/abstract/types.ts'
import type { HtnTask } from './types.ts'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

class ShadoPlannerHtnPlugin {
  config = {
    tasksPath: path.join(__dirname, 'tasks'),
    // TODO: Implement logger conditional.
    showLogs: true,
  }

  //

  _tasks: {
    [key: string]: {
      [key: string]: HtnTask
    }
  }

  //

  _app: AppContext
  _puppet: PuppetInstance

  constructor(_puppet: PuppetInstance, _app: AppContext) {
    this._app = _app
    this._puppet = _puppet
  }

  init = async () => {
    try {
      this._puppet.runtime.memory.goals = [
        ...this._puppet.runtime.memory.goals,
        // TODO: Make this nicer?
        ...this._puppet.config.planner.config.goals,
      ]

      this._puppet.runtime.memory.state = {
        'last-started': 0,
        'last-updated': 0,
        //
        ...this._puppet.runtime.memory.state,
        //
        // NOTE: Telegram default state
        'telegram-has-client': Boolean(
          this._puppet.runtime.clients['telegram'],
        ),
        // 'telegram-has-credentials': undefined,
        ...(this._puppet.runtime.clients['telegram']
          ? defaultStates['telegram']
          : {}),
        // NOTE: Twitter default state
        'twitter-has-client': Boolean(this._puppet.runtime.clients['twitter']),
        // 'twitter-has-credentials': undefined,
        ...(this._puppet.runtime.clients['twitter']
          ? defaultStates['twitter']
          : {}),
      }

      this._tasks = await this._registerTasks(this.config.tasksPath)
    } catch (error) {
      this._app.utils.logger.send({
        type: 'ERROR',
        origin: {
          type: 'PUPPET',
          id: this._puppet.config.id,
        },
        data: {
          message: `Error in planner initialization`,
          payload: { error },
        },
      })
    }
  }

  startPlanner = () => {
    const date = new Date()
    this._puppet.runtime.memory.state['last-started'] = date.valueOf()

    this._puppet.runtime.events.emit('planner', {
      timestamp: Date.now(),
      source: 'shado-planner-htn',
      data: {
        identifier: 'puppetState',
        state: this._puppet.runtime.memory.state,
      },
    })

    plannerLoop(
      // TODO: Make it so it stays dynamic?
      tasksPool(this._puppet, this._app.plugins, this._tasks),
      this._puppet,
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
} satisfies AbstractPlugin
