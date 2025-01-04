import yargs from 'yargs'
import { hideBin } from 'yargs/helpers'

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

export function parseArgs(): {
  puppets: string
} {
  try {
    const args = yargs(hideBin(process.argv))
      .option('puppets', {
        type: 'string',
        description: 'A comma separated list of Puppet IDs.',
      })
      .parseSync()

    return args
  } catch (error) {
    this._logger.send({
      type: 'ERROR',
      source: 'SERVER',
      message: `Error parsing CLI arguments`,
      payload: { error },
    })

    return {
      puppets: null,
    }
  }
}
