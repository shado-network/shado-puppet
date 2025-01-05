import { actions } from './actions.ts'
import type { CoreLogger } from '../../core-logger/index.ts'
import type { Puppet } from '../../../core/types/puppet.ts'

export const twitterRuntime = async (
  puppet: Puppet,
  messages,
  _logger: CoreLogger,
) => {
  try {
    if (!puppet.interfaces.twitterClient) {
      _logger.send({
        type: 'WARNING',
        source: 'PUPPET',
        puppetId: puppet.id,
        message: `No Twitter client found`,
      })

      return
    }

    // MARK: Login
    await actions.twitter.login(
      puppet.definition,
      puppet.interfaces.twitterClient,
      _logger,
    )

    // TODO: Loop here?
    // MARK: Read
    const getMessages = await actions.twitter.getMessages(
      puppet.definition,
      messages,
      puppet.interfaces.twitterClient,
      _logger,
    )

    // TODO: MOVE!
    // MARK: Should reply?
    if (getMessages.shouldReply) {
      // MARK: Write
      // await actions.model.generateResponse(
      //   puppet,
      //   messages,
      //   model,
      //   _logger,
      // )
    } else {
      _logger.send({
        type: 'LOG',
        source: 'AGENT',
        puppetId: puppet.id,
        message: 'Chose to ignore Telegram message:',
        payload: {
          message: getMessages.message,
        },
      })
    }

    // MARK: Post
    // TODO: Tweet
  } catch (error) {
    _logger.send({
      type: 'ERROR',
      source: 'PUPPET',
      puppetId: puppet.id,
      message: `Error in agent runtime`,
      payload: { error },
    })
  }
}
