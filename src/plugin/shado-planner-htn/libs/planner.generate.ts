import { asyncForEach } from '../../../core/libs/utils.async.ts'
import type { AppContext } from '../../../core/context/types.ts'
import type { PuppetInstance } from '../../../core/puppet/types.ts'
import type { HtnTask } from '../tasks/types.ts'

export const generatePlans = async (
  tasksPool: HtnTask[],
  _puppet: PuppetInstance,
  _app: AppContext,
) => {
  const plans: HtnTask[][] = []

  const goalsReached = []
  const goalsUnreached = []

  // NOTE: Loop through current goals and categorise into reached and unreached.
  Object.keys(_puppet.runtime.memory.goals || {}).forEach((goalIdentifier) => {
    const goalResult = _puppet.runtime.memory.goals[goalIdentifier]({
      _puppet,
      _app,
    })

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
        const tempPlan: HtnTask[] = await _recursivePlanner(
          true,
          relatedTask,
          [],
          tasksPool,
          _puppet,
          _app,
        )

        // NOTE: Debug log!
        // console.log('!!!', 'currentPlan', currentPlan)

        // NOTE: Check if full plan is executable.
        if (tempPlan && tempPlan !== null && tempPlan.length > 0) {
          tempPlans.push(tempPlan)
        }
      },
    )

    plans.push(...tempPlans)
  })

  return plans
}

const _recursivePlanner = async (
  success: boolean,
  currentTask: HtnTask,
  currentPlan: HtnTask[],
  tasksPool: HtnTask[],
  _puppet: PuppetInstance,
  _app: AppContext,
) => {
  // NOTE: Early return of the loop.
  if (!success) {
    success = false
    return null
  }

  // NOTE: No more valid tasks.
  if (!currentTask) {
    success = false
    return null
  }

  const conditionsMet = []
  const conditionsUnmet = []

  // NOTE: Check conditions of task and categorise them.
  Object.keys(currentTask.conditions).forEach((conditionIdentifier) => {
    const conditionResult = currentTask.conditions[conditionIdentifier]({
      _puppet: { ..._puppet },
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
  //   currentTask.identifier,
  //   { conditionsMet },
  //   { conditionsUnmet },
  // )

  // NOTE: All task conditions have been met.
  if (conditionsUnmet.length === 0) {
    success = true
    return [currentTask]
  }

  // NOTE: Debug log!
  // console.log('!!!', 'conditionsUnmet', conditionsUnmet)

  // NOTE: Loop through all unmet task conditions.
  conditionsUnmet.forEach(async (conditionIdentifier) => {
    // NOTE: Search for related tasks for the task condition.
    const relatedTasks = tasksPool.filter((relatedTask) => {
      const effectValue = relatedTask.effects[conditionIdentifier]?.value({
        _puppet: { ..._puppet },
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
    currentPlan.push(relatedTasks.at(0))

    // NOTE: Re-enter loop to look for more potential tasks to chain.
    return await _recursivePlanner(
      success,
      // NOTE: Just pick first related task for now.
      relatedTasks.at(0),
      currentPlan,
      tasksPool,
      _puppet,
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
  return [currentTask, ...currentPlan].reverse()
}
