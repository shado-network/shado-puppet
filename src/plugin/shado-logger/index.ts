import { fmt, code } from 'telegraf/format'

import TelegramClientPlugin from '../client-telegram/index.ts'

import type { PuppetInstance } from '../../core/puppet/types.ts'
import type { AppContext } from '../../core/context/types.ts'
import type { AbstractAppPlugin } from '../../core/abstract/types.ts'
import type { ShadoLoggerConfig, ShadoLoggerMessage } from './types.ts'

class ShadoLoggerPlugin {
  config: ShadoLoggerConfig = {
    clients: {
      sandbox: false,
      console: false,
      rest: false,
    },
    sandboxClients: {
      telegram: undefined,
      discord: undefined,
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

  constructor(clients: string[]) {
    if (clients.includes('sandbox')) {
      this.config.clients.sandbox = true
      this._setSandboxClients()
    }

    if (clients.includes('console')) {
      this.config.clients.console = true
    }

    this.send({
      type: 'SUCCESS',
      origin: {
        type: 'SERVER',
      },
      data: {
        message: 'Started Shadō Logger',
      },
    })
  }

  // TODO: Move?
  _setSandboxClients = () => {
    try {
      const sandboxClientConfig = {}
      const sandboxClientSecrets = {
        botHandle: process.env['SANDBOX_TELEGRAM_BOT_HANDLE'],
        botToken: process.env['SANDBOX_TELEGRAM_BOT_TOKEN'],
      }

      // TODO: Make this cleaner.
      const sandboxPuppetInstance = {
        runtime: {
          id: 'sandbox',
          //
          model: undefined,
          clients: undefined,
          memory: undefined,
        },
        config: {
          id: 'sandbox',
          name: 'Shadō Puppet Sandbox',
          //
          planner: undefined,
          model: undefined,
          clients: [
            {
              identifier: 'client-telegram',
              config: sandboxClientConfig,
              secrets: sandboxClientSecrets,
            },
          ],
          //
          bio: undefined,
        },
      } satisfies PuppetInstance

      const sandboxApp = {
        config: undefined,
        core: undefined,
        plugins: undefined,
        utils: {
          logger: this,
        },
      } satisfies AppContext

      // NOTE: Telegram sandbox client.
      this.config.sandboxClients['telegram'] = new TelegramClientPlugin.plugin(
        sandboxClientConfig,
        sandboxClientSecrets,
        sandboxPuppetInstance,
        sandboxApp,
      )
    } catch (error) {
      this.send({
        type: 'ERROR',
        origin: {
          type: 'SERVER',
        },
        data: {
          message: 'Could not start sandbox clients.',
          payload: { error },
        },
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

  _composeSandboxMessage = (loggerMessage: ShadoLoggerMessage) => {
    // NOTE: Styling.
    // TODO: Make same stylistic choices as the console logger.

    // NOTE: Logging.
    // TODO: Check if there is a payload.
    const sandboxMessage = fmt`
[ PUPPET / ${loggerMessage.origin.id?.toUpperCase()} ]
${loggerMessage.data.message}

PAYLOAD: 
${code`${JSON.stringify(loggerMessage.data.payload || null, null, 2)}`}
`
    this.config.sandboxClients['telegram'].sendMessage(
      sandboxMessage,
      process.env['SANDBOX_TELEGRAM_CHAT_ID'],
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

  _composeConsoleMessage = (loggerMessage: ShadoLoggerMessage) => {
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

    switch (loggerMessage.origin.type) {
      case 'SERVER':
        headerStyling = this._setConsoleColor('green', '')
        header = '[ SERVER ]'
        break
      //
      case 'PLAY':
        headerStyling = this._setConsoleColor('blue', '')
        header = `[ PLAY / ${loggerMessage.origin.id.toUpperCase()} ]`
        break
      case 'PUPPET':
        headerStyling = this._setConsoleColor('magenta', '')
        header = `[ PUPPET / ${loggerMessage.origin.id.toUpperCase()} ]`
        break
      //
      case 'AGENT':
        headerStyling = this._setConsoleColor('yellow', '')
        header = `< ${loggerMessage.origin.id.toUpperCase()} >`
        break
      case 'USER':
        headerStyling = this._setConsoleColor('cyan', '')
        header = `< ${loggerMessage.origin.id.toUpperCase()} >`
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

    console.log(loggerMessage.data.message)

    if (loggerMessage.data.payload && loggerMessage.data.payload !== null) {
      console.log('')
      console.log('PAYLOAD =', loggerMessage.data.payload)
    }

    console.log('')
  }

  //

  send = (loggerMessage: ShadoLoggerMessage) => {
    if (this.config.clients.sandbox && loggerMessage.type === 'SANDBOX') {
      this._composeSandboxMessage(loggerMessage)
    }

    if (this.config.clients.console) {
      this._composeConsoleMessage(loggerMessage)
    }
  }
}

export default {
  identifier: 'shado-logger',
  description: 'First party logging utility.',
  key: 'logger',
  plugin: ShadoLoggerPlugin,
} satisfies AbstractAppPlugin
