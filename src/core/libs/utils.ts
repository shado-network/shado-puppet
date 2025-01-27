import yargs from 'yargs'
import { hideBin } from 'yargs/helpers'

import {
  START,
  END,
  MessagesAnnotation,
  StateGraph,
  MemorySaver,
} from '@langchain/langgraph'

import { _app } from '../../core/context/index.ts'
import { SEC_IN_MSEC } from '../libs/constants.ts'

export const asyncForEach = async (array: any[], callback: any) => {
  for (let i = 0; i < array.length; i++) {
    await callback(array[i], i, array)
  }
}

const _asyncFilter = async (array: any[], callback: any) => {
  return Promise.all(array.map(callback)).then((results) => {
    return array.filter((_value, index) => {
      return results[index]
    })
  })
}

export const asyncSome = async (array: any[], callback: any) => {
  return (await _asyncFilter(array, callback)).length > 0
}

export const asyncEvery = async (array: any[], callback: any) => {
  return (await _asyncFilter(array, callback)).length === array.length
}

export const asyncSleep = async (seconds: number) => {
  return new Promise((resolve) => {
    return setTimeout(resolve, seconds * SEC_IN_MSEC)
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
    _app.utils.logger.send({
      type: 'ERROR',
      source: 'SERVER',
      message: `Error parsing CLI arguments`,
      payload: { error },
    })

    return { puppets: null }
  }
}

export const _memoryClient = (adapter) => {
  const adapterInvoke = async (state: typeof MessagesAnnotation.State) => {
    const response = await adapter.invoke(state.messages)
    return { messages: response }
  }

  const workflow = new StateGraph(MessagesAnnotation)
    .addNode('adapterInvoke', adapterInvoke)
    .addEdge(START, 'adapterInvoke')
    .addEdge('adapterInvoke', END)

  const memory = new MemorySaver()
  const memoryClient = workflow.compile({ checkpointer: memory })

  return memoryClient
}
