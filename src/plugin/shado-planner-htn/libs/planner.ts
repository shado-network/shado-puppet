import {
  asyncForEach,
  asyncEvery,
  asyncSleep,
} from '../../../core/libs/utils.ts'
import type { AppContext } from '../../../core/context/types'
import type { Puppet } from '../../../core/puppet/types'
import type { PuppetState } from '../types'
import type { Task } from '../tasks/types'

const config = {
  AWAIT_PLANNING_FOR_X_SECONDS: 2,
  RETRY_PLANNING_IN_X_SECONDS: 5,
}

export const executePlans = async (
  puppet: Puppet,
  tasks: any,
  goals: any,
  state: PuppetState,
  _app: AppContext,
) => {
  // NOTE: Disable for debugging purposes.
  console.clear()

  const date = new Date()
  state['last-updated'] = date.valueOf()

  _app.utils.logger.send({
    source: 'PUPPET',
    puppetId: puppet.id,
    type: 'LOG',
    message: date.toLocaleString(),
  })

  _app.utils.logger.send({
    source: 'PUPPET',
    puppetId: puppet.id,
    type: 'LOG',
    message: 'Generating plans',
  })

  // NOTE: Generate some plans for the current goals.
  const plans = await generatePlansForGoals(tasks, goals, state, _app)

  // NOTE: Check if any plans have been generated.
  if (!plans || plans.length === 0) {
    _app.utils.logger.send({
      source: 'PUPPET',
      puppetId: puppet.id,
      type: 'LOG',
      message: 'No plan found for current goals',
      payload: {
        // goals: Object.keys(goals),
        currentState: state,
      },
    })

    await asyncSleep(config.RETRY_PLANNING_IN_X_SECONDS)
    executePlans(puppet, tasks, goals, state, _app)

    return
  }

  // console.log('< Generated some plans!')
  // console.log({ plans })

  const rawPlan = plans[Math.floor(Math.random() * plans.length)]

  // NOTE: Check if picked raw plan is valid.
  if (!rawPlan || rawPlan.length === 0) {
    _app.utils.logger.send({
      source: 'PUPPET',
      puppetId: puppet.id,
      type: 'LOG',
      message: 'No plan found for current goals',
      payload: {
        // goals: Object.keys(goals),
        currentState: state,
      },
    })

    await asyncSleep(config.RETRY_PLANNING_IN_X_SECONDS)
    executePlans(puppet, tasks, goals, state, _app)

    return
  }

  // console.log('> Executing picked plan')

  const pickedPlan = rawPlan.filter((task) => (task ? true : false))
  pickedPlan.reverse()

  _app.utils.logger.send({
    source: 'PUPPET',
    puppetId: puppet.id,
    type: 'INFO',
    message: 'Executing plan',
    payload: { currentPlan: pickedPlan },
    // payload: pickedPlan,
  })

  // NOTE: Loop through the picked plan.
  const planResult = await asyncEvery(pickedPlan, async (task: Task) => {
    _app.utils.logger.send({
      source: 'PUPPET',
      puppetId: puppet.id,
      type: 'LOG',
      message: `Executing task '${task.identifier}'`,
      payload: {
        task,
        // currentState: state
      },
    })

    // NOTE: Check if current conditions have been reached.
    if (
      !Object.keys(task.conditions).every((conditionIdentifier) => {
        return task.conditions[conditionIdentifier]({ state, _app })
      })
    ) {
      _app.utils.logger.send({
        source: 'PUPPET',
        puppetId: puppet.id,
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
          puppet,
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
          puppet,
          state,
          _app,
        })
      },
    )

    return true
  })

  // NOTE: Check if plan succeeded. Set retry timeout for the loop accordingly.
  if (planResult) {
    _app.utils.logger.send({
      source: 'PUPPET',
      puppetId: puppet.id,
      type: 'INFO',
      message: 'Plan executed successfully',
      payload: { currentState: state },
    })

    await asyncSleep(config.AWAIT_PLANNING_FOR_X_SECONDS)
  } else {
    _app.utils.logger.send({
      source: 'PUPPET',
      puppetId: puppet.id,
      type: 'WARNING',
      message: 'Plan skipped',
      payload: { currentState: state },
    })

    await asyncSleep(config.RETRY_PLANNING_IN_X_SECONDS)
  }

  // NOTE: Enter the planning loop after timeout.
  executePlans(puppet, tasks, goals, state, _app)
}

export const generatePlansForGoals = async (
  tasks: Task[],
  goals,
  state,
  _app: AppContext,
) => {
  // console.log({ state })
  // console.log()

  const plans: Task[][] = []

  // console.log('> Checking current goals')

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

  // console.log({ goalsReached }, { goalsUnreached })

  // NOTE: Check if current goals have all been reached.
  if (goalsUnreached.length === 0) {
    // console.log('< Current goals have been reached!')
    // console.log(goalsReached)
    return plans
  }

  // console.log('< Current goals have not been reached!')
  // console.log(goalsUnreached)

  // console.log('> Searching for related tasks')

  // NOTE: Loop through unreached goals, try to find related tasks.
  await asyncForEach(goalsUnreached, async (goalIdentifier: string) => {
    const relatedTasks: Task[] = []

    tasks.forEach((task) => {
      if (!task.effects[goalIdentifier]) {
        return
      }

      relatedTasks.push(task)
    })

    // NOTE: No related tasks found.
    if (relatedTasks.length === 0) {
      // console.log(`< No available tasks for goal ${goalIdentifier}`)
      return
    }

    // console.log(`< Found some related tasks for goal ${goalIdentifier}!`)
    // console.log(relatedTasks)

    const goalPlans = []

    // NOTE: Loop through related tasks, recursively form a plan.
    // NOTE: Just pick 1 related task for now. Dice roll? After?
    await asyncForEach(relatedTasks.slice(0, 1), async (task: Task) => {
      const goalPlan = []

      const additionalPlanning = await recursivePlanner(
        tasks,
        task,
        [],
        state,
        true,
        _app,
      )

      // console.log({ additionalPlanning })

      // NOTE: Check if full plan is executable.
      if (additionalPlanning.length > 0) {
        // goalPlan.push(task)
        goalPlan.push(...additionalPlanning)

        goalPlans.push(goalPlan)
      }
    })

    plans.push(...goalPlans)
  })

  return plans
}

const recursivePlanner = async (
  tasks: Task[],
  tempTask: Task,
  tempPlan: any[],
  tempState: any,
  success: boolean,
  _app: AppContext,
) => {
  // NOTE: Loop through current conditions and categorise into met and unmet.
  // console.log('> Checking task conditions')

  const conditionsMet = []
  const conditionsUnmet = []

  // NOTE: No more valid tasks.
  if (!tempTask) {
    // console.log('< No more tasks!')
    success = false

    return []
  }

  // NOTE: Check conditions of task.
  Object.keys(tempTask.conditions).forEach((conditionIdentifier) => {
    const conditionResult = tempTask.conditions[conditionIdentifier]({
      state: { ...tempState },
      _app,
    })

    if (conditionResult) {
      conditionsMet.push(conditionIdentifier)
    } else {
      conditionsUnmet.push(conditionIdentifier)
    }
  })

  // console.log(tempTask.identifier, { conditionsMet }, { conditionsUnmet })

  // NOTE: All task conditions have been met.
  if (conditionsUnmet.length === 0) {
    // console.log('< Task conditions have been met!')
    // console.log(conditionsMet)

    return [tempTask]
  }

  // console.log('< Task conditions have not been met!')
  // console.log(conditionsUnmet)

  // NOTE: Loop through all unmet task conditions.
  conditionsUnmet.forEach(async (conditionIdentifier) => {
    // NOTE: Search for related tasks for the task condition.
    const relatedTasks = tasks.filter((relatedTask) => {
      const effectValue = relatedTask.effects[conditionIdentifier]?.value({
        state: { ...tempState },
        _app,
      })

      return (
        Object.keys(relatedTask.effects).includes(conditionIdentifier) &&
        effectValue
      )
    })

    // NOTE: No tasks were found for the task conditions.
    if (relatedTasks.length === 0) {
      // console.log('< No related task for task conditions!')
      success = false

      return []
    }

    // console.log(
    //   `< Found some related tasks for the task ${tempTask.identifier}!`,
    // )
    // console.log(relatedTasks)

    // NOTE: Add task to plan.
    // NOTE: Just pick first one for now.
    tempPlan.push(relatedTasks[0])

    // TODO: Picking first related task for now.
    // NOTE: Just pick 1 related task for now. Dice roll? After?
    return await recursivePlanner(
      tasks,
      // NOTE: Just pick first one for now.
      relatedTasks[0],
      tempPlan,
      tempState,
      success,
      _app,
    )
  })

  // NOTE: Couldn't compile full planning chain.
  if (!success) {
    return []
  }

  return tempPlan
}
