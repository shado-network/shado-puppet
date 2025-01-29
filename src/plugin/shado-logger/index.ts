import dotenv from 'dotenv'

import { TelegramClientPlugin } from '../client-telegram/index.ts'
import type { AppContext } from '../../core/context/types.ts'
import type { PuppetConfig } from '../../core/puppet/types'
import type { LoggerConfig, LoggerMessage } from './types'

dotenv.config()

export class ShadoLogger {
  config: LoggerConfig = {
    interfaces: {
      console: false,
      rest: false,
    },
    sandbox: {
      telegramClient: null,
      discordClient: null,
    },
    //
    showIcons: false,
    showUser: false,
  }

  // NOTE: Node.js console colors.
  colors = {
    node: {
      fg: {
        black: '\x1b[30m',
        red: '\x1b[31m',
        green: '\x1b[32m',
        yellow: '\x1b[33m',
        blue: '\x1b[34m',
        magenta: '\x1b[35m',
        cyan: '\x1b[36m',
        white: '\x1b[37m',
        gray: '\x1b[90m',
        //
        default: '\x1b[37m',
        clear: '\x1b[0m',
      },
      bg: {
        black: '\x1b[40m',
        red: '\x1b[41m',
        green: '\x1b[42m',
        yellow: '\x1b[43m',
        blue: '\x1b[44m',
        magenta: '\x1b[45m',
        cyan: '\x1b[46m',
        white: '\x1b[47m',
        gray: '\x1b[100m',
        //
        default: '\x1b[47m',
        clear: '',
      },
    },
  }

  icons = {
    success: '🟢',
    warning: '🟠',
    danger: '🔴',
    info: '🔵',
    //
    default: '⚪️',
  }

  //

  constructor(interfaceIds: string[]) {
    if (interfaceIds.includes('console')) {
      this.config.interfaces.console = true
    }

    this.send({
      type: 'SUCCESS',
      source: 'SERVER',
      message: 'Started Shadō Logger',
    })

    this._setSandboxClient()
  }

  _setSandboxClient = () => {
    try {
      const sandboxPuppet = {
        id: 'sandbox',
        name: 'Shadō Puppet Sandbox',
        //
        planner: null,
        model: null,
        interfaces: null,
        //
        bio: null,
      } satisfies PuppetConfig

      const sandboxApp = {
        config: null,
        core: null,
        utils: {
          logger: this,
        },
      } satisfies AppContext

      this.config.sandbox.telegramClient = new TelegramClientPlugin(
        sandboxPuppet,
        sandboxApp,
      )
    } catch (error) {
      this.send({
        type: 'ERROR',
        source: 'SERVER',
        message: 'Could not start sandbox Telegram client.',
        payload: { error },
      })
    }
  }

  _getConsoleColor = (fgColorName = '', bgColorName = '') => {
    const fgColor =
      this.colors.node.fg[fgColorName.toLowerCase()] ||
      this.colors.node.fg.white
    const bgColor =
      this.colors.node.bg[bgColorName.toLowerCase()] ||
      this.colors.node.bg.clear

    return `${fgColor}${bgColor}`
  }

  _resetConsoleColor = () => {
    return this.colors.node.fg.clear
  }

  _getIcon = (type: string) => {
    const icon = this.icons[type.toLowerCase()] || this.icons.default

    if (this.config.showIcons) {
      return `${icon} `
    } else {
      return ''
    }
  }

  _writeConsoleMessage = ({
    type,
    message,
    payload,
    //
    typeStyling,
    icon,
    headerStyling,
    header,
  }: {
    type: LoggerMessage['type']
    message: LoggerMessage['message']
    payload: LoggerMessage['payload']
    header: string
    headerStyling: string
    typeStyling: string
    icon: string
  }) => {
    // console.log(typeStyling + ` ${icon}${type} ` + this._resetConsoleColor())

    console.log(
      headerStyling + header + this._resetConsoleColor(),
      typeStyling + ` ${icon}${type} ` + this._resetConsoleColor(),
    )

    console.log(message)

    if (payload) {
      console.log('')
      console.log('PAYLOAD =', payload)
    }

    console.log('')
  }

  //

  send = ({
    type,
    source,
    playId,
    puppetId,
    userId,
    message,
    payload = null,
  }: LoggerMessage) => {
    // SANDBOX
    if (type === 'SANDBOX') {
      this.config.sandbox.telegramClient.sendMessage(
        `[ PUPPET / ${puppetId?.toUpperCase()} ]\n
${message}\n
PAYLOAD = ${JSON.stringify(payload, null, 2)}`,
        process.env['TELEGRAM_SANDBOX_CHAT_ID'],
      )
    }

    // Console
    if (this.config.interfaces.console) {
      let typeStyling: string
      let icon: string
      let headerStyling: string
      let header: string

      switch (type) {
        case 'SUCCESS':
          typeStyling = this._getConsoleColor('black', 'green')
          icon = this._getIcon(type)
          break
        case 'WARNING':
          typeStyling = this._getConsoleColor('black', 'yellow')
          icon = this._getIcon(type)
          break
        case 'ERROR':
          typeStyling = this._getConsoleColor('black', 'red')
          icon = this._getIcon(type)
          break
        case 'INFO':
          typeStyling = this._getConsoleColor('black', 'blue')
          icon = this._getIcon(type)
          break
        case 'LOG':
          typeStyling = this._getConsoleColor('default', '')
          icon = this._getIcon(type)
          break
        case 'SANDBOX':
          typeStyling = this._getConsoleColor('black', 'white')
          icon = this._getIcon(type)
          break
        //
        default:
          typeStyling = this._getConsoleColor('default', '')
          icon = this._getIcon('default')
          break
      }

      switch (source) {
        case 'SERVER':
          headerStyling = this._getConsoleColor('green', '')
          header = '[ SERVER ]'
          break
        //
        case 'PLAY':
          headerStyling = this._getConsoleColor('blue', '')
          header = `[ PLAY / ${playId.toUpperCase()} ]`
          break
        case 'PUPPET':
          headerStyling = this._getConsoleColor('magenta', '')
          header = `[ PUPPET / ${puppetId.toUpperCase()} ]`
          break
        //
        case 'AGENT':
          headerStyling = this._getConsoleColor('yellow', '')
          header = `< ${puppetId.toUpperCase()} >`
          break
        case 'USER':
          headerStyling = this._getConsoleColor('cyan', '')
          header = `< ${userId.toUpperCase()} >`
          break
        //
        default:
          headerStyling = this._getConsoleColor('default', '')
          header = '[ LOG ]'
          break
      }

      this._writeConsoleMessage({
        type,
        message,
        payload,
        typeStyling,
        icon,
        headerStyling,
        header,
      })
    }
  }
}
