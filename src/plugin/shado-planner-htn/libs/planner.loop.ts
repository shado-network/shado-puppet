import { asyncSleep } from '../../../core/libs/utils.async.ts'
import { generatePlans } from './planner.generate.ts'
import { executePlan } from './planner.execute.ts'
import type { AppContext } from '../../../core/context/types.ts'
import type { PuppetConfig, PuppetRuntime } from '../../../core/puppet/types.ts'
import type { PuppetState } from '../types.ts'
import type { HtnTask } from '../tasks/types.ts'

const config = {
  AWAIT_PLANNING_FOR_X_SECONDS: 1,
  RETRY_PLANNING_IN_X_SECONDS: 5,
}

export const plannerLoop = async (
  puppetRuntime: PuppetRuntime,
  puppetConfig: PuppetConfig,
  //
  goals: any,
  state: PuppetState,
  //
  tasksPool: HtnTask[],
  _app: AppContext,
) => {
  // NOTE: Disable for debugging purposes.
  console.clear()

  const date = new Date()
  state['last-updated'] = date.valueOf()

  _app.utils.logger.send({
    source: 'PUPPET',
    puppetId: puppetRuntime.id,
    type: 'LOG',
    message: date.toLocaleString(),
  })

  // NOTE: Check if any goals have been set.
  if (!goals || Object.keys(goals).length === 0) {
    _app.utils.logger.send({
      source: 'PUPPET',
      puppetId: puppetRuntime.id,
      type: 'LOG',
      message: 'No goals have been set',
      payload: {
        currentState: state,
      },
    })

    await asyncSleep(config.RETRY_PLANNING_IN_X_SECONDS)
    plannerLoop(puppetRuntime, puppetConfig, goals, state, tasksPool, _app)

    return
  }

  _app.utils.logger.send({
    source: 'PUPPET',
    puppetId: puppetRuntime.id,
    type: 'LOG',
    message: 'Generating plans',
  })

  // NOTE: Generate plans for the current goals.
  const plans = await generatePlans(tasksPool, goals, state, _app)

  // NOTE: Check if any plans have been generated.
  if (!plans || plans.length === 0) {
    _app.utils.logger.send({
      source: 'PUPPET',
      puppetId: puppetRuntime.id,
      type: 'LOG',
      message: 'No plan found for current goals',
      payload: {
        goals: Object.keys(goals),
        currentState: state,
      },
    })

    await asyncSleep(config.RETRY_PLANNING_IN_X_SECONDS)
    plannerLoop(puppetRuntime, puppetConfig, goals, state, tasksPool, _app)

    return
  }

  // TODO: Pick a plan for every goal, execute synchronously if possible?
  // NOTE: Pick random plan.
  const plan = plans[Math.floor(Math.random() * plans.length)]

  // NOTE: Check if picked plan is valid.
  if (!plan || plan.length === 0) {
    _app.utils.logger.send({
      source: 'PUPPET',
      puppetId: puppetRuntime.id,
      type: 'LOG',
      message: 'No plan found for current goals',
      payload: {
        goals: Object.keys(goals),
        currentState: state,
      },
    })

    await asyncSleep(config.RETRY_PLANNING_IN_X_SECONDS)
    plannerLoop(puppetRuntime, puppetConfig, goals, state, tasksPool, _app)

    return
  }

  const isPlanSuccessful = await executePlan(
    puppetRuntime,
    puppetConfig,
    //
    plan.reverse(),
    state,
    //
    _app,
  )

  // NOTE: Check if plan succeeded. Set retry timeout for the loop accordingly.
  if (isPlanSuccessful) {
    _app.utils.logger.send({
      source: 'PUPPET',
      puppetId: puppetRuntime.id,
      type: 'INFO',
      message: 'Plan executed successfully',
      payload: { currentState: state },
    })

    await asyncSleep(config.AWAIT_PLANNING_FOR_X_SECONDS)
  } else {
    _app.utils.logger.send({
      source: 'PUPPET',
      puppetId: puppetRuntime.id,
      type: 'WARNING',
      message: 'Plan skipped',
      payload: { currentState: state },
    })

    await asyncSleep(config.RETRY_PLANNING_IN_X_SECONDS)
  }

  // NOTE: Enter the planning loop after timeout.
  plannerLoop(puppetRuntime, puppetConfig, goals, state, tasksPool, _app)
}
