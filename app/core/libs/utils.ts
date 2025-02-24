import yargs from 'yargs'
import { hideBin } from 'yargs/helpers'

import {
  START,
  END,
  MessagesAnnotation,
  StateGraph,
  MemorySaver,
} from '@langchain/langgraph'

import { _app } from '@core/context/index.js'

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
      origin: {
        type: 'SERVER',
      },
      data: {
        message: `Error parsing CLI arguments`,
        payload: { error },
      },
    })

    return { puppets: undefined }
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
