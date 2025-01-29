import dotenv from 'dotenv'
import { TwitterApi } from 'twitter-api-v2'
import type { IClientSettings, TwitterApiTokens } from 'twitter-api-v2'

import type { AppContext } from '../../core/context/types'
import type { PuppetConfig } from '../../core/puppet/types'

dotenv.config()

export class TwitterApiClientPlugin {
  config = {}

  //

  puppetConfig: PuppetConfig

  clientConfig = {}

  client: TwitterApi
  threads: string[] = []
  messages: any[] = []

  //

  _app: AppContext

  //

  constructor(puppetConfig: PuppetConfig, _app: AppContext) {
    this._app = _app

    this.puppetConfig = puppetConfig

    this._app.utils.logger.send({
      type: 'SUCCESS',
      source: 'PUPPET',
      puppetId: this.puppetConfig.id,
      message: `Loaded client plugin "client-twitter-api"`,
    })
  }

  login = async () => {
    try {
      const credentials: TwitterApiTokens = {
        appKey:
          process.env[
            `TWITTER_${this.puppetConfig.id.toUpperCase()}_CONSUMER_KEY`
          ],
        appSecret:
          process.env[
            `TWITTER_${this.puppetConfig.id.toUpperCase()}_CONSUMER_SECRET`
          ],
        accessToken:
          process.env[
            `TWITTER_${this.puppetConfig.id.toUpperCase()}_ACCESS_TOKEN`
          ],
        accessSecret:
          process.env[
            `TWITTER_${this.puppetConfig.id.toUpperCase()}_ACCESS_SECRET`
          ],
      }

      const settings: Partial<IClientSettings> = {}

      this.client = new TwitterApi(credentials, settings)

      // const current = await this.client.currentUser()
      // console.log({ current })

      // this.client.login()

      return true
    } catch (error) {
      this._app.utils.logger.send({
        type: 'ERROR',
        source: 'PUPPET',
        puppetId: this.puppetConfig.id,
        message: `Error connecting to Twitter bot`,
        payload: { error },
      })

      return false
    }
  }

  getMessageThreads = () => {
    return this.threads
  }

  addMessageThread = (threadIdentifier: string) => {
    this.threads.push(threadIdentifier)
  }

  // getMessages = () => {
  //   return this.messages.filter((message) => !message.isRead)
  // }

  // clearReadMessages = () => {
  //   this.messages = this.messages.filter((message) => !message.isRead)
  // }

  /*
  getMessages = async (messages) => {
    const userId = 'user'
    const message = `Interesting ${this.puppetConfig.name}, tell me more?`

    const tweets = []

    try {
      // TODO: !!!
    } catch (error) {
      this._app.utils.logger.send({
        type: 'ERROR',
        source: 'PUPPET',
        puppetId: this.puppetConfig.id,
        message: 'Error',
        payload: error,
      })
    }
    this._app.utils.logger.send({
      type: 'LOG',
      source: 'AGENT',
      puppetId: this.puppetConfig.id,
      message: 'Read some Tweets:',
      payload: {
        tweets: tweets,
      },
    })

    // const response = await this.client.sendTweet('Hello world!', tweets.at(0).id)

    // messages.push({
    //   role: userId,
    //   content: message,
    // })

    // this._app.utils.logger.send({
    //   type: 'LOG',
    //   source: 'USER',
    //   userId: userId,
    //   message: 'Wrote a message:',
    //   payload: {
    //     message: message,
    //   },
    // })

    // this._app.utils.logger.send({
    //   type: 'LOG',
    //   source: 'PUPPET',
    //   puppetId: puppetConfig.id,
    //   message: 'Read a message:',
    //   payload: {
    //     message: message,
    //   },
    // })

    return {
      user: userId,
      message: message,
      shouldReply: true,
    }
  }
  */

  async sendMessage(message: string) {
    if (this._app.config.sandbox) {
      this._app.utils.logger.send({
        type: 'SANDBOX',
        source: 'PUPPET',
        puppetId: this.puppetConfig.id,
        message: 'client-twitter-api | sendMessage()',
        payload: {
          message: message,
        },
      })

      return
    }

    const response = await this.client.v2.tweet(message)
    // console.log('sendMessage', { response })
  }
}
