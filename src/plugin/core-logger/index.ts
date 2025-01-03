export type CoreLog = {
  type: 'SUCCESS' | 'WARNING' | 'ERROR' | 'INFO' | 'LOG'
  source: 'SERVER' | 'STAGE' | 'PUPPET' | 'WORLD' | 'AGENT' | 'USER'
  stageId?: string
  puppetId?: string
  userId?: string
  message: string
  payload?: null | unknown
}

export class CoreLogger {
  config = {
    interfaces: {
      console: false,
      rest: false,
    },
    icons: false,
    showUser: false,
  }

  // MARK: Node.js console colors.
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
      message: 'Started CoreLogger',
    })
  }

  _getColor = (fgColorName = '', bgColorName = '') => {
    const fgColor =
      this.colors.node.fg[fgColorName.toLowerCase()] ||
      this.colors.node.fg.white
    const bgColor =
      this.colors.node.bg[bgColorName.toLowerCase()] ||
      this.colors.node.bg.clear

    return `${fgColor}${bgColor}`
  }

  _resetColor = () => {
    return this.colors.node.fg.clear
  }

  _getIcon = (type: string) => {
    const icon = this.icons[type.toLowerCase()] || this.icons.default

    if (this.config.icons) {
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
    type: CoreLog['type']
    message: CoreLog['message']
    payload: CoreLog['payload']
    header: string
    headerStyling: string
    typeStyling: string
    icon: string
  }) => {
    // console.log(typeStyling + ` ${icon}${type} ` + this._resetColor())

    console.log(
      headerStyling + header + this._resetColor(),
      typeStyling + ` ${icon}${type} ` + this._resetColor(),
    )
    payload ? console.log(message, payload) : console.log(message)
    console.log('')
  }

  //

  send = ({
    type,
    source,
    stageId,
    puppetId,
    userId,
    message,
    payload = null,
  }: CoreLog) => {
    if (this.config.interfaces.console) {
      let typeStyling: string
      let icon: string
      let headerStyling: string
      let header: string

      switch (type) {
        case 'SUCCESS':
          typeStyling = this._getColor('black', 'green')
          icon = this._getIcon(type)
          break
        case 'WARNING':
          typeStyling = this._getColor('black', 'yellow')
          icon = this._getIcon(type)
          break
        case 'ERROR':
          typeStyling = this._getColor('black', 'red')
          icon = this._getIcon(type)
          break
        case 'INFO':
          typeStyling = this._getColor('black', 'blue')
          icon = this._getIcon(type)
          break
        case 'LOG':
          typeStyling = this._getColor('default', '')
          icon = this._getIcon(type)
          break
        //
        default:
          typeStyling = this._getColor('default', '')
          icon = this._getIcon('default')
          break
      }

      switch (source) {
        case 'SERVER':
          headerStyling = this._getColor('green', '')
          header = '[ SERVER ]'
          break
        case 'STAGE':
          headerStyling = this._getColor('blue', '')
          header = `[ STAGE / ${stageId.toUpperCase()} ]`
          break
        case 'PUPPET':
          headerStyling = this._getColor('magenta', '')
          header = `[ PUPPET / ${puppetId.toUpperCase()} ]`
          break
        //
        case 'WORLD':
          headerStyling = this._getColor('red', '')
          header = `< ${stageId.toUpperCase()} >`
          break
        case 'AGENT':
          headerStyling = this._getColor('yellow', '')
          header = `< ${puppetId.toUpperCase()} >`
          break
        case 'USER':
          headerStyling = this._getColor('cyan', '')
          header = `< ${userId.toUpperCase()} >`
          break
        //
        default:
          headerStyling = this._getColor('default', '')
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
