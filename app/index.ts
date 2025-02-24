import { _app } from '@core/context/index.js'

import { importPlugins } from '@core/libs/utils.plugins.js'

import { Puppet } from '@core/puppet/index.js'
import { parseArgs } from '@core/libs/utils.js'
import { SEC_IN_MSEC } from '@core/libs/constants.js'

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

    plugins[importedPlugin.identifier] = importedPlugin
  })

  return plugins
}

_app.plugins = await registerPlugins(_app.config.pluginsPath)

//

// TODO: Update to the proper type from the plugin?
_app.utils.logger = new _app.plugins['shado-logger'].plugin([
  'shado-screen',
  'node-console',
])

// TODO: Update to the proper type from the plugin?
_app.utils.sandbox = new _app.plugins['shado-sandbox'].plugin(
  ['shado-screen', 'logger', 'telegram'],
  _app.utils.logger,
)

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
      origin: {
        type: 'SERVER',
      },
      data: {
        message: 'No puppetIds have been set!',
      },
    })

    return
  }

  const puppets = []

  puppetIds.forEach((puppetId) => {
    const puppet = new Puppet(puppetId, _app)

    if (!puppet) {
      _app.utils.logger.send({
        type: 'ERROR',
        origin: {
          type: 'SERVER',
        },
        data: {
          message: `Error loading puppet "${puppetId}"`,
        },
      })

      return
    }

    puppets.push(puppet)
  })

  return puppets
}

_app.core.puppets = initPuppets(puppetIds)

setInterval(() => {
  // _app.utils.logger.send({
  //   type: 'INFO',
  //   origin: {
  //     type: 'SERVER',
  //   },
  //   data: {
  //     message: 'PING!',
  //   },
  // })
}, 1 * SEC_IN_MSEC)
