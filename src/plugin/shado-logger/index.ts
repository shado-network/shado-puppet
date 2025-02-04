import dotenv from 'dotenv'

import { TelegramClientPlugin } from '../client-telegram/index.ts'
import type { AppContext } from '../../core/context/types.ts'
import type { PuppetConfig } from '../../core/puppet/types'
import type { LoggerConfig, LoggerMessage } from './types'

dotenv.config()

export class ShadoLogger {
  config: LoggerConfig = {
    interfaces: {
      sandbox: false,
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

  // TODO: Move to console method?
  colors = {
    // NOTE: Node.js console colors.
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
    if (interfaceIds.includes('sandbox')) {
      this.config.interfaces.sandbox = true
      this._setSandboxClients()
    }

    if (interfaceIds.includes('console')) {
      this.config.interfaces.console = true
    }

    this.send({
      type: 'SUCCESS',
      source: 'SERVER',
      message: 'Started Shadō Logger',
    })
  }

  _setSandboxClients = () => {
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

      // NOTE: Telegram sandbox client.
      this.config.sandbox.telegramClient = new TelegramClientPlugin(
        sandboxPuppet,
        sandboxApp,
      )
    } catch (error) {
      this.send({
        type: 'ERROR',
        source: 'SERVER',
        message: 'Could not start sandbox clients.',
        payload: { error },
      })
    }
  }

  _getIcon = (type: string) => {
    const icon = this.icons[type.toLowerCase()] || this.icons.default

    if (this.config.showIcons) {
      return `${icon} `
    } else {
      return ''
    }
  }

  _composeSandboxMessage = (loggerMessage: LoggerMessage) => {
    // NOTE: Styling.
    // TODO: Make same stylistic choices as the console logger.

    // NOTE: Logging.
    // TODO: Check if there is a payload.
    const sandboxMessage = `[ PUPPET / ${loggerMessage.puppetId?.toUpperCase()} ]
${loggerMessage.message}

PAYLOAD: 
\`\`\`
${JSON.stringify(loggerMessage.payload || null, null, 2)}
\`\`\``

    this.config.sandbox.telegramClient.sendMessage(
      sandboxMessage,
      process.env['TELEGRAM_SANDBOX_CHAT_ID'],
    )
  }

  //

  _setConsoleColor = (fgColorName = '', bgColorName = '') => {
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

  _composeConsoleMessage = (loggerMessage: LoggerMessage) => {
    // NOTE: Styling.
    let typeStyling: string
    let icon: string
    let headerStyling: string
    let header: string

    switch (loggerMessage.type) {
      case 'SUCCESS':
        typeStyling = this._setConsoleColor('black', 'green')
        icon = this._getIcon(loggerMessage.type)
        break
      case 'WARNING':
        typeStyling = this._setConsoleColor('black', 'yellow')
        icon = this._getIcon(loggerMessage.type)
        break
      case 'ERROR':
        typeStyling = this._setConsoleColor('black', 'red')
        icon = this._getIcon(loggerMessage.type)
        break
      case 'INFO':
        typeStyling = this._setConsoleColor('black', 'blue')
        icon = this._getIcon(loggerMessage.type)
        break
      case 'LOG':
        typeStyling = this._setConsoleColor('default', '')
        icon = this._getIcon(loggerMessage.type)
        break
      case 'SANDBOX':
        typeStyling = this._setConsoleColor('black', 'white')
        icon = this._getIcon(loggerMessage.type)
        break
      //
      default:
        typeStyling = this._setConsoleColor('default', '')
        icon = this._getIcon('default')
        break
    }

    switch (loggerMessage.source) {
      case 'SERVER':
        headerStyling = this._setConsoleColor('green', '')
        header = '[ SERVER ]'
        break
      //
      case 'PLAY':
        headerStyling = this._setConsoleColor('blue', '')
        header = `[ PLAY / ${loggerMessage.playId.toUpperCase()} ]`
        break
      case 'PUPPET':
        headerStyling = this._setConsoleColor('magenta', '')
        header = `[ PUPPET / ${loggerMessage.puppetId.toUpperCase()} ]`
        break
      //
      case 'AGENT':
        headerStyling = this._setConsoleColor('yellow', '')
        header = `< ${loggerMessage.puppetId.toUpperCase()} >`
        break
      case 'USER':
        headerStyling = this._setConsoleColor('cyan', '')
        header = `< ${loggerMessage.userId.toUpperCase()} >`
        break
      //
      default:
        headerStyling = this._setConsoleColor('default', '')
        header = '[ LOG ]'
        break
    }

    // NOTE: Logging.
    console.log(
      headerStyling + header + this._resetConsoleColor(),
      typeStyling +
        ` ${icon}${loggerMessage.type} ` +
        this._resetConsoleColor(),
    )

    console.log(loggerMessage.message)

    if (loggerMessage.payload && loggerMessage.payload !== null) {
      console.log('')
      console.log('PAYLOAD =', loggerMessage.payload)
    }

    console.log('')
  }

  //

  send = (loggerMessage: LoggerMessage) => {
    if (this.config.interfaces.sandbox && loggerMessage.type === 'SANDBOX') {
      this._composeSandboxMessage(loggerMessage)
    }

    if (this.config.interfaces.console) {
      this._composeConsoleMessage(loggerMessage)
    }
  }
}
