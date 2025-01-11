import {
  asyncForEach,
  asyncSleep,
  checkAgainstState,
  recursivePlanner,
} from './utils.ts'
import type { Puppet } from '../../../core/types/puppet.ts'

const config = {
  FAUX_SLEEP_FOR_SECONDS: 1,
  RETRY_PLANNING_IN_SECONDS: 5,
}

export const generatePlansForGoals = async (
  tasks: any[],
  currentGoals,
  currentState,
) => {
  const plans: any[] = []

  console.log('Checking goals...')

  // MARK: Check if current goals are reached.
  if (checkAgainstState(currentGoals, currentState)) {
    console.log('Current goals reached!')

    return plans
  }

  console.log('Goals have not been reached!')

  // MARK: Loop through (unmet) goals
  await asyncForEach(currentGoals, async (goal) => {
    console.log({
      [goal.identifier]: goal.value({ currentState }),
      state: currentState[goal.identifier],
      match: goal.value({ currentState }) === currentState[goal.identifier],
    })

    if (goal.value({ currentState }) === currentState[goal.identifier]) {
      return
    }

    console.log(`Unmet goal ${goal.identifier}`)

    const matchingTasks = []

    tasks.forEach((task) => {
      const effect = task.effects.find((effect) => {
        return (
          goal.identifier === effect.identifier &&
          goal.value({ currentState }) === effect.value({ currentState })
        )
      })

      if (!effect) {
        return
      }

      matchingTasks.push(task)
    })

    if (matchingTasks.length === 0) {
      console.log(`No available tasks for goal ${goal.identifier}`)
      return
    }

    // console.log({ matchingTasks })

    let plan = []

    await asyncForEach(matchingTasks, async (task) => {
      plan.push(task)
      plan.push(
        ...(await recursivePlanner(
          tasks,
          task.conditions,
          [],
          currentState,
          false,
        )),
      )

      console.log({ plan })
    })

    plans.push(plan)
  })

  // console.log({ plans })

  return plans
}

export const executePlans = async (
  puppet: Puppet,
  tasks: any,
  currentGoals: any,
  currentState: any,
) => {
  console.clear()
  const date = new Date()
  console.log(date.toLocaleString())
  console.log()

  const plans = await generatePlansForGoals(tasks, currentGoals, currentState)

  if (!plans || plans.length === 0) {
    console.log('No plans!')

    await asyncSleep(config.RETRY_PLANNING_IN_SECONDS)

    if (Math.random() < 0.5) {
      console.log('Random reset!')
      currentState['telegram-has-replied'] = false
    }

    // console.log('Retrying!')

    executePlans(puppet, tasks, currentGoals, currentState)

    return
  }

  // console.log({ plans })

  const pickedPlan = plans[Math.floor(Math.random() * plans.length)]

  if (!pickedPlan || pickedPlan.length === 0) {
    console.log('No picked plans!')

    await asyncSleep(config.RETRY_PLANNING_IN_SECONDS)

    if (Math.random() < 0.5) {
      // console.log('Random reset!')
      currentState['telegram-has-replied'] = false
    }

    // console.log('Retrying!')

    executePlans(puppet, tasks, currentGoals, currentState)

    return
  }

  console.log('Executing plan...')
  console.log({ pickedPlan })

  pickedPlan.reverse().forEach((task) => {
    console.log('pre', task.identifier, { currentState })
    // console.log({ task })

    // MARK: Check if current conditions have been reached.
    if (!checkAgainstState(task.conditions, currentState)) {
      console.log('Current conditions have not been reached! Changes?')

      return
    }

    // console.log('Task conditions have been reached!')

    // MARK: Run effects

    task.effects.forEach((effect) => {
      currentState[effect.identifier] = effect.value({ currentState })
    })

    // MARK: Run task actions
    asyncForEach(task.actions || [], async (action: any) => {
      // console.log({ action })
      const result = await action.trigger({ puppet, currentState })
      // console.log({ result })
      // console.log({ currentState })
    })

    //  Check effects again?
  })

  // console.log('Finished executing plan!')
  console.log('post', { currentState })

  await asyncSleep(1)

  // console.log('Retrying!')

  executePlans(puppet, tasks, currentGoals, currentState)
}
