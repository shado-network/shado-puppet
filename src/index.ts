import dotenv from 'dotenv'

import { _app } from './core/context/index.ts'

import { ShadoLogger } from './plugin/shado-logger/index.ts'
import { Puppet } from './core/puppet/index.ts'
import { parseArgs } from './core/libs/utils.ts'
import { SEC_IN_MSEC } from './core/libs/constants.ts'

dotenv.config()

console.clear()

//

console.log('SHADŌ NETWORK')
console.log('shado-puppet')
console.log('')

console.log(`Started on port ${+process.env.SERVER_PORT || 10110}`)
console.log(`http://localhost:${+process.env.SERVER_PORT || 10110}`)
console.log('')

//

_app.utils.logger = new ShadoLogger(['console'])

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
