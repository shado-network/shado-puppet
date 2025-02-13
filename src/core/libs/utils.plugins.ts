import fs from 'fs'
import path from 'path'

import { asyncForEach } from './utils.async.ts'

export const importPlugins = async (pluginsPath: string) => {
  const imports = []

  const files = fs.readdirSync(pluginsPath, {
    recursive: true,
  }) as string[]

  await asyncForEach(files, async (file: string) => {
    if (!file.endsWith('index.ts')) {
      return
    }

    // TODO: More checks!
    // TODO: Single level depth!

    try {
      const pluginPath = path.join(pluginsPath, file)
      const plugin = await import(pluginPath)

      imports.push(plugin.default)
    } catch (error) {
      console.log('Error loading plugin', error)
    }
  })

  return imports
}
