import { asyncForEach } from '../../../core/libs/utils.async.ts'
import type { AppContext } from '../../../core/context/types.ts'
import type { PuppetState } from '../types.ts'
import type { HtnTask } from '../tasks/types.ts'

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
        const remainingPlan = await _recursivePlanner(
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

const _recursivePlanner = async (
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
    return await _recursivePlanner(
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
