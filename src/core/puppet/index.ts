import { CoreAgentPlugin } from '../../plugin/core-agent/index.ts'
import type { PuppetDefinition } from '../types/puppet.ts'
import type { CoreLogger } from '../../plugin/core-logger/index.ts'

export class Puppet {
  puppetId: string
  puppetDefinition: PuppetDefinition
  agent: CoreAgentPlugin

  _logger: CoreLogger

  constructor(puppetId: string, _logger: CoreLogger) {
    this._logger = _logger

    this.puppetId = puppetId
    this._init()
  }

  _init = async () => {
    try {
      this.puppetDefinition = await this._loadPuppetDefinition()
      this._setPuppetPlugin()

      // await this._debug()
    } catch (error) {
      this._logger.send({
        type: 'ERROR',
        source: 'PUPPET',
        puppetId: this.puppetId,
        message: `Error in puppet initialization`,
        payload: { error },
      })
    }
  }

  _loadPuppetDefinition = async () => {
    this._logger.send({
      type: 'INFO',
      source: 'PUPPET',
      puppetId: this.puppetId,
      message: `Loading puppet definition for "${this.puppetId}"`,
    })

    const puppet = await import(`../../../include/puppet/${this.puppetId}.ts`)
    const puppetDefinition = puppet.default

    this._logger.send({
      type: 'SUCCESS',
      source: 'PUPPET',
      puppetId: this.puppetId,
      message: `Loaded "${puppetDefinition.name}"'s definition`,
    })

    return puppetDefinition
  }

  _setPuppetPlugin = async () => {
    switch (this.puppetDefinition.agentProvider) {
      case 'shado':
        this.agent = new CoreAgentPlugin(this.puppetDefinition, this._logger)

        this._logger.send({
          type: 'SUCCESS',
          source: 'PUPPET',
          puppetId: this.puppetId,
          message: `Loaded puppet agent plugin "${this.puppetDefinition.agentProvider}"`,
        })
        break
      case 'eliza':
        this._logger.send({
          type: 'ERROR',
          source: 'PUPPET',
          message: 'Puppet agent plugin for Eliza not yet implemented.',
          payload: {
            puppetId: this.puppetId,
          },
        })
        break
      default:
        break
    }
  }

  _debug = async () => {}
}
