import { TwitterApi } from 'twitter-api-v2'
import type { IClientSettings, TwitterApiTokens } from 'twitter-api-v2'

import type { AppContext } from '../../core/context/types.ts'
import type { PuppetInstance } from '../../core/puppet/types.ts'
import type { AppPlugin } from '../types.ts'

class TwitterApiClientPlugin {
  config = {}

  //

  client: TwitterApi
  clientConfig: any = {}
  clientSecrets: any = {}

  threads: string[] = []
  messages: any[] = []

  //

  _app: AppContext
  _puppet: PuppetInstance

  //

  constructor(
    clientConfig: any,
    clientSecrets: any,
    _puppet: PuppetInstance,
    _app: AppContext,
  ) {
    this._app = _app
    this._puppet = _puppet

    this.clientConfig = {
      ...this.clientConfig,
      ...clientConfig,
    }

    this.clientSecrets = {
      ...this.clientSecrets,
      ...clientSecrets,
    }

    this._app.utils.logger.send({
      type: 'SUCCESS',
      source: 'PUPPET',
      puppetId: this._puppet.config.id,
      message: `Loaded client plugin "client-twitter-api"`,
    })
  }

  login = async () => {
    try {
      const credentials: TwitterApiTokens = {
        appKey: this.clientSecrets.appKey,
        appSecret: this.clientSecrets.appSecret,
        accessToken: this.clientSecrets.accessToken,
        accessSecret: this.clientSecrets.accessSecret,
      }

      const settings: Partial<IClientSettings> = {}

      this.client = new TwitterApi(credentials, settings)

      // const current = await this.client.currentUser()
      // console.log({ current })

      // this.client.login()

      // this._app.utils.logger.send({
      //   type: 'SUCCESS',
      //   source: 'PUPPET',
      //   puppetId: this._puppet.config.id,
      //   message: `Connected to Twitter bot`,
      // })

      return true
    } catch (error) {
      this._app.utils.logger.send({
        type: 'ERROR',
        source: 'PUPPET',
        puppetId: this._puppet.config.id,
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

  sendMessage = async (message: string) => {
    if (this._app.config.sandboxMode) {
      this._app.utils.logger.send({
        type: 'SANDBOX',
        source: 'PUPPET',
        puppetId: this._puppet.config.id,
        message: 'client-twitter-api | sendMessage()',
        payload: {
          message: message,
        },
      })

      return
    }

    const response = await this.client.v2.tweet(message)

    console.log('!!!', 'client-twitter | sendMessage()', { response })
  }

  // getMessages = () => {
  //   return this.messages.filter((message) => !message.isRead)
  // }

  // clearReadMessages = () => {
  //   this.messages = this.messages.filter((message) => !message.isRead)
  // }

  /*
  getMessages = async () => {
    const userId = 'user'
    const message = `Interesting ${this._puppet.name}, tell me more?`

    const tweets = []

    try {
      // TODO: !!!
    } catch (error) {
      this._app.utils.logger.send({
        type: 'ERROR',
        source: 'PUPPET',
        puppetId: this._puppet.config.id,
        message: 'Error',
        payload: { error },
      })
    }
    this._app.utils.logger.send({
      type: 'LOG',
      source: 'AGENT',
      puppetId: this._puppet.config.id,
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
    //   puppetId: puppet.id,
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
}

export default {
  identifier: 'client-twitter-api',
  description: 'Wrapper for OpenAI interaction through LangChain.',
  key: 'twitter',
  plugin: TwitterApiClientPlugin,
} satisfies AppPlugin
