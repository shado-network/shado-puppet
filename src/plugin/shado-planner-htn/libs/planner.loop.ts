import { asyncSleep } from '../../../core/libs/utils.async.ts'
import { generatePlans } from './planner.generate.ts'
import { executePlan } from './planner.execute.ts'
import type { AppContext } from '../../../core/context/types.ts'
import type { PuppetInstance } from '../../../core/puppet/types.ts'
import type { HtnTask } from '../tasks/types.ts'

const config = {
  AWAIT_PLANNING_FOR_X_SECONDS: 1,
  RETRY_PLANNING_IN_X_SECONDS: 5,
}

export const plannerLoop = async (
  tasksPool: HtnTask[],
  _puppet: PuppetInstance,
  _app: AppContext,
) => {
  // NOTE: Disable for debugging purposes.
  console.clear()

  const date = new Date()
  _puppet.runtime.memory.state['last-updated'] = date.valueOf()

  _app.utils.logger.send({
    type: 'LOG',
    origin: {
      type: 'PUPPET',
      id: _puppet.config.id,
    },
    data: {
      message: date.toLocaleString(),
    },
  })

  // NOTE: Check if any goals have been set.
  if (
    !_puppet.runtime.memory.goals ||
    Object.keys(_puppet.runtime.memory.goals).length === 0
  ) {
    _app.utils.logger.send({
      type: 'LOG',
      origin: {
        type: 'PUPPET',
        id: _puppet.config.id,
      },
      data: {
        message: 'No goals have been set',
        payload: { state: _puppet.runtime.memory.state },
      },
    })

    await asyncSleep(config.RETRY_PLANNING_IN_X_SECONDS)
    plannerLoop(tasksPool, _puppet, _app)

    return
  }

  _app.utils.logger.send({
    type: 'LOG',
    origin: {
      type: 'PUPPET',
      id: _puppet.config.id,
    },
    data: {
      message: 'Generating plans',
    },
  })

  // NOTE: Generate plans for the current goals.
  const plans = await generatePlans(tasksPool, _puppet, _app)

  // NOTE: Check if any plans have been generated.
  if (!plans || plans.length === 0) {
    _app.utils.logger.send({
      type: 'LOG',
      origin: {
        type: 'PUPPET',
        id: _puppet.config.id,
      },
      data: {
        message: 'No plan found for current goals',
        payload: {
          goals: Object.keys(_puppet.runtime.memory.goals),
          state: _puppet.runtime.memory.state,
        },
      },
    })

    await asyncSleep(config.RETRY_PLANNING_IN_X_SECONDS)
    plannerLoop(tasksPool, _puppet, _app)

    return
  }

  // TODO: Pick a plan for every goal, execute synchronously if possible?
  // NOTE: Pick random plan.
  const plan = plans[Math.floor(Math.random() * plans.length)]

  // NOTE: Check if picked plan is valid.
  if (!plan || plan.length === 0) {
    _app.utils.logger.send({
      type: 'LOG',
      origin: {
        type: 'PUPPET',
        id: _puppet.config.id,
      },
      data: {
        message: 'No plan found for current goals',
        payload: {
          goals: Object.keys(_puppet.runtime.memory.goals),
          // state: _puppet.runtime.memory.state,
        },
      },
    })

    await asyncSleep(config.RETRY_PLANNING_IN_X_SECONDS)
    plannerLoop(tasksPool, _puppet, _app)

    return
  }

  const isPlanSuccessful = await executePlan(plan, _puppet, _app)

  // NOTE: Check if plan succeeded. Set retry timeout for the loop accordingly.
  if (isPlanSuccessful) {
    _app.utils.logger.send({
      type: 'INFO',
      origin: {
        type: 'PUPPET',
        id: _puppet.config.id,
      },
      data: {
        message: 'Plan executed',
        payload: { state: _puppet.runtime.memory.state },
      },
    })

    // await asyncSleep(config.AWAIT_PLANNING_FOR_X_SECONDS)
  } else {
    _app.utils.logger.send({
      type: 'WARNING',
      origin: {
        type: 'PUPPET',
        id: _puppet.config.id,
      },
      data: {
        message: 'Plan skipped',
        payload: { state: _puppet.runtime.memory.state },
      },
    })

    await asyncSleep(config.RETRY_PLANNING_IN_X_SECONDS)
  }

  // NOTE: Enter the planning loop after timeout.
  plannerLoop(tasksPool, _puppet, _app)
}
