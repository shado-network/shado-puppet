import {
  asyncForEach,
  asyncEvery,
  asyncSleep,
} from '../../../core/libs/utils.async.ts'
import type { AppContext } from '../../../core/context/types'
import type { PuppetConfig, PuppetRuntime } from '../../../core/puppet/types'
import type { PuppetState } from '../types'
import type { HtnTask } from '../tasks/types'

const config = {
  AWAIT_PLANNING_FOR_X_SECONDS: 1,
  RETRY_PLANNING_IN_X_SECONDS: 5,
}

export const plannerLoop = async (
  puppetRuntime: PuppetRuntime,
  puppetConfig: PuppetConfig,
  //
  tasks: any,
  goals: any,
  state: PuppetState,
  //
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
    plannerLoop(puppetRuntime, puppetConfig, tasks, goals, state, _app)

    return
  }

  _app.utils.logger.send({
    source: 'PUPPET',
    puppetId: puppetRuntime.id,
    type: 'LOG',
    message: 'Generating plans',
  })

  // NOTE: Generate plans for the current goals.
  const plans = await generatePlans(tasks, goals, state, _app)

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
    plannerLoop(puppetRuntime, puppetConfig, tasks, goals, state, _app)

    return
  }

  // NOTE: Pick random plan.
  const plan = plans[Math.floor(Math.random() * plans.length)]

  // NOTE: Check if picked raw plan is valid.
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
    plannerLoop(puppetRuntime, puppetConfig, tasks, goals, state, _app)

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
  plannerLoop(puppetRuntime, puppetConfig, tasks, goals, state, _app)
}

//

export const generatePlans = async (
  tasksPool: HtnTask[],
  goals: any,
  state: PuppetState,
  _app: AppContext,
) => {
  const plans: HtnTask[][] = []

  const goalsReached = []
  const goalsUnreached = []

  // NOTE: Loop through current goals and categorise into reached and unreached.
  Object.keys(goals).forEach((goalIdentifier) => {
    const goalResult = goals[goalIdentifier]({ state })

    if (goalResult) {
      goalsReached.push(goalIdentifier)
    } else {
      goalsUnreached.push(goalIdentifier)
    }
  })

  // NOTE: Check if current goals have all been reached.
  if (goalsUnreached.length === 0) {
    // NOTE: Debug log!
    // console.log('!!!', 'goalsReached', goalsReached)
    return plans
  }

  // NOTE: Debug log!
  // console.log('!!!', 'goalsUnreached', goalsUnreached)

  // NOTE: Loop through unreached goals, try to find related tasks.
  await asyncForEach(goalsUnreached, async (goalIdentifier: string) => {
    // NOTE: Check if there is a task in the pool that could achieve the goal.
    const relatedTasks = tasksPool.filter((task) => {
      return Boolean(task.effects[goalIdentifier])
    })

    // NOTE: No related tasks found.
    if (relatedTasks.length === 0) {
      return
    }

    // NOTE: Debug log!
    // console.log('!!!', 'relatedTasks', relatedTasks)

    const tempPlans: HtnTask[][] = []

    // NOTE: Loop through related tasks, recursively form a plan.
    await asyncForEach(
      // NOTE: Just pick first related task for now.
      [relatedTasks.at(0)],
      async (relatedTask: HtnTask) => {
        const remainingPlan = await recursivePlanner(
          true,
          relatedTask,
          tasksPool,
          [],
          state,
          _app,
        )

        // NOTE: Debug log!
        // console.log('!!!', 'tempPlan', tempPlan)

        // NOTE: Check if full plan is executable.
        if (
          remainingPlan &&
          remainingPlan !== null &&
          remainingPlan.length > 0
        ) {
          // TODO: If only 1 thing in the chain, it's just the related one, just run that?
          // TODO: If not, add it to the recursive plan?

          const fullPlan: HtnTask[] = [relatedTask, ...remainingPlan]

          // NOTE: Debug log!
          // console.log('!!!', 'fullPlan', fullPlan)

          tempPlans.push(fullPlan)
        }
      },
    )

    plans.push(...tempPlans)
  })

  return plans
}

const recursivePlanner = async (
  success: boolean,
  tempTask: HtnTask,
  tasksPool: HtnTask[],
  tempPlan: any[],
  state: PuppetState,
  _app: AppContext,
) => {
  // NOTE: Early return of the loop.
  if (!success) {
    success = false
    return null
  }

  // NOTE: No more valid tasks.
  if (!tempTask) {
    success = false
    return null
  }

  const conditionsMet = []
  const conditionsUnmet = []

  // NOTE: Check conditions of task and categorise them.
  Object.keys(tempTask.conditions).forEach((conditionIdentifier) => {
    const conditionResult = tempTask.conditions[conditionIdentifier]({
      state: { ...state },
      _app,
    })

    if (conditionResult) {
      conditionsMet.push(conditionIdentifier)
    } else {
      conditionsUnmet.push(conditionIdentifier)
    }
  })

  // NOTE: Debug log!
  // console.log(
  //   '!!!',
  //   tempTask.identifier,
  //   { conditionsMet },
  //   { conditionsUnmet },
  // )

  // NOTE: All task conditions have been met.
  if (conditionsUnmet.length === 0) {
    success = true
    return [tempTask]
  }

  // NOTE: Debug log!
  // console.log('!!!', 'conditionsUnmet', conditionsUnmet)

  // NOTE: Loop through all unmet task conditions.
  conditionsUnmet.forEach(async (conditionIdentifier) => {
    // NOTE: Search for related tasks for the task condition.
    const relatedTasks = tasksPool.filter((relatedTask) => {
      const effectValue = relatedTask.effects[conditionIdentifier]?.value({
        state: { ...state },
        _app,
      })

      return (
        Object.keys(relatedTask.effects).includes(conditionIdentifier) &&
        effectValue
      )
    })

    // NOTE: No tasks were found for the task conditions.
    if (relatedTasks.length === 0) {
      success = false
      return null
    }

    // NOTE: Add task to plan.
    // NOTE: Just pick first one for now.
    tempPlan.push(relatedTasks.at(0))

    // NOTE: Re-enter loop to look for more potential tasks to chain.
    return await recursivePlanner(
      success,
      // NOTE: Just pick first related task for now.
      relatedTasks.at(0),
      tasksPool,
      tempPlan,
      state,
      _app,
    )
  })

  // // NOTE: Couldn't compile a full task chain.
  if (!success) {
    success = false
    return []
  }

  // NOTE: Compiled a full task chain.
  success = true
  return tempPlan
}

//

const executePlan = async (
  puppetRuntime: PuppetRuntime,
  puppetConfig: PuppetConfig,
  //
  plan: any[],
  state: PuppetState,
  //
  _app: AppContext,
) => {
  _app.utils.logger.send({
    source: 'PUPPET',
    puppetId: puppetRuntime.id,
    type: 'INFO',
    message: 'Executing plan',
    payload: { currentPlan: plan },
  })

  // TODO: Why the every? Just break out of plan if one step fails!
  // NOTE: Loop through the plan's tasks.
  const planResult = await asyncEvery(plan, async (task: HtnTask) => {
    _app.utils.logger.send({
      source: 'PUPPET',
      puppetId: puppetRuntime.id,
      type: 'LOG',
      message: `Executing task '${task.identifier}'`,
      payload: {
        task,
        // currentState: state
      },
    })

    // NOTE: Debug log!
    // console.log('!!!', 'plan', plan)

    // NOTE: Check if current conditions have been reached.
    if (
      !Object.keys(task.conditions).every((conditionIdentifier) => {
        return task.conditions[conditionIdentifier]({ state, _app })
      })
    ) {
      _app.utils.logger.send({
        source: 'PUPPET',
        puppetId: puppetRuntime.id,
        type: 'WARNING',
        message: `Task '${task.identifier}' skipped. Conditions have not been met. Something changed?`,
      })

      return false
    }

    // NOTE: Run task actions.
    const results = []

    await asyncForEach(
      Object.keys(task.actions),
      async (actionIdentifier: string) => {
        const result = await task.actions[actionIdentifier]({
          puppetRuntime,
          puppetConfig,
          state,
          _app,
        })

        // console.log(actionIdentifier, { result })
        results.push(result)
      },
    )

    // TODO: Update logic, apply effects of succeeded tasks.
    // NOTE: Check if it should run the tasks effects.
    if (
      !results.every((result) => {
        // console.log('taskResult', { result })
        return result.success
      })
    ) {
      return false
    }

    // NOTE: Run task effects.
    await asyncForEach(
      Object.keys(task.effects),
      async (effectIdentifier: string) => {
        const result = await task.effects[effectIdentifier].trigger({
          puppetRuntime,
          puppetConfig,
          state,
          _app,
        })
      },
    )

    return true
  })

  return planResult
}
