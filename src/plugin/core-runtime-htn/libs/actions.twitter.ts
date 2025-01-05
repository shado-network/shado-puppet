import type { MessageParam } from '@anthropic-ai/sdk/resources/messages.mjs'

import type { TwitterClientPlugin } from '../../client-twitter/index.ts'
import type { CoreLogger } from '../../core-logger/index.ts'
import type { PuppetDefinition } from '../../../core/types/puppet.ts'

export const twitterActions = {
  login: async (
    puppetDefinition: PuppetDefinition,
    twitterClient: TwitterClientPlugin,
    _logger: CoreLogger,
  ) => {
    await twitterClient.login(puppetDefinition)
  },
  getMessages: async (
    puppetDefinition: PuppetDefinition,
    messages: MessageParam[],
    twitterClient: TwitterClientPlugin,
    _logger: CoreLogger,
  ) => {
    return await twitterClient.getMessages(puppetDefinition, messages)
  },
}
