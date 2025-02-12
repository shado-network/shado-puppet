import { _app } from './core/context/index.ts'

import { importPlugins } from './core/libs/utils.plugins.ts'

import { Puppet } from './core/puppet/index.ts'
import { parseArgs } from './core/libs/utils.ts'
import { SEC_IN_MSEC } from './core/libs/constants.ts'

import dotenv from 'dotenv'
dotenv.config()

console.clear()

//

console.log('SHADŌ NETWORK')
console.log('shado-puppet')
console.log('')

//

const registerPlugins = async (pluginsPath: string) => {
  const plugins = {}

  const imports = await importPlugins(pluginsPath)

  imports.forEach((importedPlugin) => {
    if (!importedPlugin) {
      return
    }

    plugins[importedPlugin.identifier] = importedPlugin.plugin
  })

  return plugins
}

_app.plugins = await registerPlugins(_app.config.pluginsPath)

//

// TODO: Update to the proper type from the plugin.
_app.utils.logger = new _app.plugins['shado-logger'](['sandbox', 'console'])

//

const args = parseArgs()

const puppetIds = args.puppets
  ?.replaceAll(' ', '')
  .split(',')
  .map((puppetId) => puppetId.trim())

//

const initPuppets = (puppetIds: string[]) => {
  if (!puppetIds || puppetIds.length === 0) {
    _app.utils.logger.send({
      type: 'WARNING',
      source: 'SERVER',
      message: 'No puppetIds have been set!',
    })

    return
  }

  const puppets = []

  puppetIds.forEach((puppetId) => {
    const puppet = new Puppet(puppetId, _app)

    if (!puppet) {
      _app.utils.logger.send({
        type: 'ERROR',
        source: 'SERVER',
        message: `Error loading puppet "${puppetId}"`,
      })

      return
    }

    puppets.push(puppet)
  })

  return puppets
}

_app.core.puppets = initPuppets(puppetIds)

setInterval(() => {
  // _app.utils.logger.send({ type: 'INFO', source: 'SERVER', message: 'PING!' })
}, 1 * SEC_IN_MSEC)
