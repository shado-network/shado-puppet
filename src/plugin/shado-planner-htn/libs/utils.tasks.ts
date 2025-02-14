import fs from 'fs'
import path from 'path'

import { asyncForEach } from '../../../core/libs/utils.async.ts'
import type { HtnTask } from '../tasks/types'

export const importTasks = async (tasksPath: string) => {
  const imports: HtnTask[] = []

  const files = fs.readdirSync(tasksPath, {
    recursive: true,
  }) as string[]

  await asyncForEach(files, async (file: string) => {
    if (!file.endsWith('.ts')) {
      return
    }

    // TODO: More checks!
    // TODO: Single level depth!

    try {
      const taskPath = path.join(tasksPath, file)
      const task = await import(taskPath)

      imports.push(task.default)
    } catch (error) {
      console.log('Error loading task', error)
    }
  })

  return imports
}
