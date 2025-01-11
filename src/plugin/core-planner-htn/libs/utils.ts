export const asyncForEach = async (array: any[], callback: any) => {
  for (let i = 0; i < array.length; i++) {
    await callback(array[i], i, array)
  }
}

export const asyncSleep = async (seconds: number) => {
  return new Promise((resolve) => {
    return setTimeout(resolve, seconds * 1000)
  })
}

export const checkAgainstState = (checks: any[], currentState) => {
  const checkIdentifiers = checks.map((check) => {
    return check.identifier
  })

  return checkIdentifiers.every((checkIdentifier) => {
    const matchingCheck = checks.find((check) => {
      return check.identifier === checkIdentifier
    })

    // console.log({
    //   [matchingCheck.identifier]: matchingCheck.value(),
    //   state: currentState[checkIdentifier],
    //   match: matchingCheck.value() === currentState[checkIdentifier],
    // })

    return (
      matchingCheck.value({ currentState }) === currentState[checkIdentifier]
    )
  })
}

export const recursivePlanner = async (
  tasks,
  startTaskConditions,
  plan,
  state,
  done,
) => {
  if (done) {
    return plan
  }

  await tasks.forEach(async (task) => {
    // console.log({ task })

    task.effects.forEach(async (effect) => {
      // MARK: Check task task effect for matching goal identifier.
      const currentGoal = startTaskConditions.find((goal) => {
        // console.log({ goal })
        return goal.identifier === effect.identifier
      })

      if (!currentGoal) {
        return
      }

      // MARK: Check task effect for matching goal result.
      if (currentGoal.value({ state }) !== effect.value({ state })) {
        return
      }

      // console.log({
      //   task: task.identifier,
      //   effect,
      //   match:
      //     effect.value({ state }) === currentGoal.value({ state }),
      // })

      // MARK: Check if current conditions have been reached.
      // console.log(task.conditions)

      console.log('Checking task conditions...')

      if (checkAgainstState(task.conditions, state)) {
        console.log(
          'Current task conditions reached!',
          // { conditions: task.conditions },
          // { state },
        )

        plan.push(task)
        done = true
        return plan
      }

      console.log('Task conditions have not been reached!')

      plan.push(task)

      // task.effects.forEach(async (effect) => {
      //   state[effect.identifier] = effect.value()
      // })

      const additionalPlanning = await recursivePlanner(
        tasks,
        task.conditions,
        [],
        { ...state },
        false,
      )
      // console.log({ additionalPlanning })
      plan.push(...additionalPlanning)
    })
  })

  done = true
  return plan
}
