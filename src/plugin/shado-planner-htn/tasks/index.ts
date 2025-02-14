import type { PuppetInstance } from '../../../core/puppet/types.ts'
import type { HtnTask } from './types.ts'

export const tasksPool = (
  _puppet: PuppetInstance,
  //
  _plugins: any,
  _tasks: any,
) => {
  const pool: HtnTask[] = []

  const clientsArray = _puppet.config.clients.map((client) => {
    return client.identifier
  })

  // NOTE: Check if there is overlap between all plugins and the puppets clients.
  const intersection = Object.keys(_plugins).filter((value) =>
    clientsArray.includes(value),
  )

  intersection.forEach((identifier: string) => {
    try {
      pool.push(
        ...Object.values(
          _tasks[_plugins[identifier].key] as { [key: string]: HtnTask },
        ),
      )
    } catch (error) {
      // console.log(error)
    }
  })

  return pool
}
