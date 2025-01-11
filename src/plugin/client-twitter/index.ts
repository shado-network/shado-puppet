import { fileURLToPath } from 'url'
import path from 'path'

import dotenv from 'dotenv'
import { Scraper, SearchMode, Tweet } from 'agent-twitter-client'
import type { MessageParam } from '@anthropic-ai/sdk/resources/messages.mjs'

import { cookies } from './libs/utils.ts'
import { asyncSleep } from '../../core/libs/utils.ts'
import type { CoreLogger } from '../core-logger/index.ts'
import type { PuppetConfig } from '../../core/types/puppet.ts'

dotenv.config()

// TODO: Find a better way.
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const cacheDirectoryPaths = [__dirname, '../../../cache/twitter']

export class TwitterClientPlugin {
  config = {
    MAX_LOGIN_ATTEMPTS: 3,
    ATTEMPT_INTERVAL_SECONDS: 2,
  }

  //

  puppetConfig: PuppetConfig

  clientConfig = {}

  client: Scraper

  //

  _logger: CoreLogger

  constructor(puppetConfig: PuppetConfig, _logger: CoreLogger) {
    this._logger = _logger

    this.puppetConfig = puppetConfig

    this._logger.send({
      type: 'SUCCESS',
      source: 'PUPPET',
      puppetId: this.puppetConfig.id,
      message: `Loaded client plugin "client-twitter"`,
    })
    try {
      this.client = new Scraper()
    } catch (error) {
      this._logger.send({
        type: 'ERROR',
        source: 'PUPPET',
        puppetId: this.puppetConfig.id,
        message: 'Could not connect to Twitter bot',
      })
    }
  }

  login = async () => {
    cookies.createDirectory(cacheDirectoryPaths)
    const cookiesFilepath = cookies.getFilepath(
      cacheDirectoryPaths,
      this.puppetConfig,
    )

    //

    try {
      if (cookies.hasPreviousCookies(cookiesFilepath)) {
        const cookiesArray = cookies.retrieve(cookiesFilepath)
        const cookieStrings = await cookies.toCookieStrings(cookiesArray)
        await this.client.setCookies(cookieStrings)

        this._logger.send({
          type: 'INFO',
          source: 'PUPPET',
          puppetId: this.puppetConfig.id,
          message: "Found it's previous Twitter cookies",
        })
      }

      let loginAttempts = 0

      while (true) {
        this._logger.send({
          type: 'LOG',
          source: 'PUPPET',
          puppetId: this.puppetConfig.id,
          message: `Twitter login attempt #${loginAttempts + 1}`,
        })

        await this.client.login(
          process.env[`TWITTER_${this.puppetConfig.id.toUpperCase()}_USERNAME`],
          process.env[`TWITTER_${this.puppetConfig.id.toUpperCase()}_PASSWORD`],
          process.env[`TWITTER_${this.puppetConfig.id.toUpperCase()}_EMAIL`],
        )

        if (await this.client.isLoggedIn()) {
          this._logger.send({
            type: 'SUCCESS',
            source: 'PUPPET',
            puppetId: this.puppetConfig.id,
            message: `Logged into Twitter`,
          })

          try {
            const cookiesArray = await this.client.getCookies()
            cookies.store(cookiesArray, cookiesFilepath)

            this._logger.send({
              type: 'SUCCESS',
              source: 'PUPPET',
              puppetId: this.puppetConfig.id,
              message: `Stored it's new Twitter cookies`,
            })
          } catch (error) {
            this._logger.send({
              type: 'ERROR',
              source: 'PUPPET',
              puppetId: this.puppetConfig.id,
              message: `Could not store it's new Twitter cookies`,
            })
          }

          break
        }

        loginAttempts++

        if (loginAttempts > this.config.MAX_LOGIN_ATTEMPTS) {
          this._logger.send({
            type: 'ERROR',
            source: 'PUPPET',
            puppetId: this.puppetConfig.id,
            message: `Failed to log in to Twitter after ${loginAttempts} attempts`,
          })
          break
        }

        await asyncSleep(
          this.config.ATTEMPT_INTERVAL_SECONDS * (loginAttempts + 1),
        )
      }
    } catch (error) {
      this._logger.send({
        type: 'ERROR',
        source: 'PUPPET',
        puppetId: this.puppetConfig.id,
        message: `Error logging in to Twitter`,
        payload: { error },
      })
      return null
    }
  }

  getMessages = async (messages: MessageParam[]) => {
    if (await !this.client.isLoggedIn()) {
      return
    }
    const userId = 'user'
    const message = `Interesting ${this.puppetConfig.name}, tell me more?`

    const tweets = []

    try {
      // const rawTweets = this.client.getTweetsAndReplies('Garbage_42069', 120)
      // const rawTweets = await this.client.getTweets('garbage_42069', 10)
      // const rawTweets = this.client.getTweetsAndReplies('garbage_42069')
      // const rawTweets = await this.client.fetchSearchTweets(
      const rawTweets = this.client.searchTweets(
        '@garbage_42069',
        50,
        SearchMode.Latest,
      )

      if (!rawTweets) {
        return
      }

      // for await (const rawTweet of rawTweets.tweets) {
      for await (const rawTweet of rawTweets) {
        const parsedTweet: Partial<Tweet> = {
          id: rawTweet.id,
          conversationId: rawTweet.conversationId,
          thread: rawTweet.thread,
          userId: rawTweet.userId,
          username: rawTweet.username,
          name: rawTweet.name,
          text: rawTweet.text,
          hashtags: rawTweet.hashtags,
          mentions: rawTweet.mentions,
          inReplyToStatus: rawTweet.inReplyToStatus,
          inReplyToStatusId: rawTweet.inReplyToStatusId,
          urls: rawTweet.urls,
          timestamp: rawTweet.timestamp,
          timeParsed: rawTweet.timeParsed,
        }

        tweets.push(parsedTweet)
      }
    } catch (error) {
      this._logger.send({
        type: 'ERROR',
        source: 'PUPPET',
        puppetId: this.puppetConfig.id,
        message: 'Error',
        payload: error,
      })
    }
    this._logger.send({
      type: 'LOG',
      source: 'AGENT',
      puppetId: this.puppetConfig.id,
      message: 'Read some Tweets:',
      payload: {
        tweets: tweets,
      },
    })

    // const response = await this.client.sendTweet('Hello world!', tweets.at(0).id)
    // const json = await response.json()
    // console.log({ json })

    // messages.push({
    //   role: userId,
    //   content: message,
    // })

    // this._logger.send({
    //   type: 'LOG',
    //   source: 'USER',
    //   userId: userId,
    //   message: 'Wrote a message:',
    //   payload: {
    //     message: message,
    //   },
    // })

    // this._logger.send({
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
}
