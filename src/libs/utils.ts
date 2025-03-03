// TODO: Figure out a better way for puppet memory.
import {
  START,
  END,
  MessagesAnnotation,
  StateGraph,
  MemorySaver,
} from '@langchain/langgraph'

export const _memoryClient = (adapter: any): any => {
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
