import yargs from 'yargs'
import { hideBin } from 'yargs/helpers'

import { START, END } from '@langchain/langgraph'
import {
  MessagesAnnotation,
  StateGraph,
  MemorySaver,
} from '@langchain/langgraph'

import { _app } from '../../context.ts'

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
    _app.utils.logger.send({
      type: 'ERROR',
      source: 'SERVER',
      message: `Error parsing CLI arguments`,
      payload: { error },
    })

    return { puppets: null }
  }
}

export const _memoryClient = (client) => {
  const clientInvoke = async (state: typeof MessagesAnnotation.State) => {
    const response = await client.invoke(state.messages)
    return { messages: response }
  }

  const workflow = new StateGraph(MessagesAnnotation)
    .addNode('clientInvoke', clientInvoke)
    .addEdge(START, 'clientInvoke')
    .addEdge('clientInvoke', END)

  const memory = new MemorySaver()
  const memoryClient = workflow.compile({ checkpointer: memory })

  return memoryClient
}
