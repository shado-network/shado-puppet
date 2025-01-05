import dotenv from 'dotenv'

import { context } from './context.ts'
import { CoreLogger } from './plugin/core-logger/index.ts'
import { Puppet } from './core/puppet/index.ts'
import { parseArgs } from './core/libs/utils.ts'

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

context.core._logger = new CoreLogger(['console'])

const args = parseArgs()

const puppetIds = args.puppets
  ?.replaceAll(' ', '')
  .split(',')
  .map((puppetId) => puppetId.trim())

//

const initPuppets = (puppetIds: string[]) => {
  if (!puppetIds || puppetIds.length === 0) {
    context.core._logger.send({
      type: 'WARNING',
      source: 'SERVER',
      message: 'No puppetIds have been set!',
    })
    return
  }

  const puppets = []

  puppetIds.forEach((puppetId) => {
    const puppet = new Puppet(puppetId, context.core._logger)

    if (!puppet) {
      context.core._logger.send({
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

context.core.puppets = initPuppets(puppetIds)

setInterval(() => {
  // context.core._logger.send({ type: 'INFO', source: 'SERVER', message: 'PING!' })
}, 1 * 1000)
