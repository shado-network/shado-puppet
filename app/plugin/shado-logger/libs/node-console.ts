import type { ShadoLoggerConfig, ShadoLoggerMessage } from '../types'

export class ShadoLoggerNodeConsoleClient {
  config: ShadoLoggerConfig

  colors = {
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
  }

  icons = {
    success: '🟢',
    warning: '🟠',
    danger: '🔴',
    info: '🔵',
    //
    default: '⚪️',
  }

  constructor(config: ShadoLoggerConfig) {
    this.config = config
  }

  _getIcon = (type: string) => {
    const icon = this.icons[type.toLowerCase()] || this.icons.default

    if (this.config.showIcon) {
      return `${icon} `
    } else {
      return ''
    }
  }

  _setConsoleColor = (fgColorName = '', bgColorName = '') => {
    const fgColor =
      this.colors.fg[fgColorName.toLowerCase()] || this.colors.fg.white
    const bgColor =
      this.colors.bg[bgColorName.toLowerCase()] || this.colors.bg.clear

    return `${fgColor}${bgColor}`
  }

  _resetConsoleColor = () => {
    return this.colors.fg.clear
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

  send = (loggerMessage: ShadoLoggerMessage) => {
    // TODO: Split into compose and send.
    this._composeConsoleMessage(loggerMessage)
  }
}
